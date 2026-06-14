import logging
import datetime
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request

from jose import jwt, JWTError

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps.redis import get_redis
import redis.asyncio as aioredis

from app.core.config import settings
from app.api.deps.db import get_db
from app.api.deps.services import get_admin_service, get_auth_service, get_email_service, get_notification_service, get_room_service
from app.models.token import Token
from app.db.security import create_access_token, create_refresh_token, hash_password
from app.models.user import UserCreate, UserInDatabase
from app.models.message import Message
from app.services.auth.email import EmailService
from app.db.security import authenticate_user
from app.services.auth.users import AuthService
from app.models.token import RefreshToken
from app.db.schemas.revoked_token import RevokedToken
from app.services.social.room import RoomService
from app.models.mail import EmailModel
from app.core.limiter import limiter
from app.api.deps.auth import get_current_admin
from app.tasks.notifications import send_notification_task
from app.tasks.mail import send_verification_task, resend_verification_task
from app.models.notifications import NotificationResponse
from app.services.admin.manager import AdminService
from app.services.interactions.notification import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/token", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    notif_service: NotificationService = Depends(get_notification_service),
    redis: aioredis.Redis = Depends(get_redis)
):
    user = authenticate_user(db=db, username=form_data.username, password=form_data.password)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    if not user.status == "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Please verify your email before logging in."
        )

    try:
        notif_service.send_firebase_push(
            recipient_id=user.id,  # L'UUID de l'utilisateur qui vient de se connecter
            title=f"Bonjour {user.profil_name}",
            body="Bienvenue sur EsatHub."
        )
    except Exception as push_err:
        # On capture l'erreur pour éviter de bloquer la connexion de l'utilisateur si FCM échoue
        print(f"Impossible d'envoyer la notification de connexion : {push_err}")

    
    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    # enrégistrer la session sur redis
    await redis.setex(f"session:{user.id}", 604800, "active")

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer") #nosec

@router.post("/logout")
async def logout(
    request: Request,
    body: RefreshToken, 
    db: Session = Depends(get_db), 
    redis: aioredis.Redis = Depends(get_redis)
):
    try:
        payload = jwt.decode(
            token=body.refresh_token,
            key=settings.REFRESH_SECRET_KEY,
            algorithms=[settings.REFRESH_ALGORITHM],
        )
        jti = payload.get("jti")

        if jti is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Vérifier s'il est déjà révoqué
        already_revoked = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
        if already_revoked:
            raise HTTPException(status_code=401, detail="Token already revoked")

        try:
            db.add(RevokedToken(jti=jti))
            db.commit()
        except IntegrityError:
            # Deux requêtes simultanées avec le même token
            db.rollback()
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # supprimer la session redit
        await redis.delete(f"session:{payload.get('sub')}")


        return Message(message="Logout out successfully")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
@limiter.limit("20/minute")
def refresh_token(
    request: Request,
    body: RefreshToken, 
    db: Session = Depends(get_db)
):
    
    try:
        payload = jwt.decode(
            token=body.refresh_token,
            key=settings.REFRESH_SECRET_KEY,
            algorithms=[settings.REFRESH_ALGORITHM],
        )
        user_id = payload.get("sub")
        jti = payload.get("jti")

        # vérifier que c'est bien un access_token
        if not payload.get("type") == "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # vérifier qu'un utilisateur est associé au token
        if user_id is None or jti is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # vérifier que le token à été déjà utilisé
        already_used = db.query(RevokedToken).where(RevokedToken.jti == jti).first()
        if already_used:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        try:
            db.add(RevokedToken(jti=jti))
            db.commit()
        except IntegrityError:
            # Deux requêtes simultanées avec le même token
            db.rollback()
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        new_access_token = create_access_token(
            data={"sub": user_id}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user_id)},
        )

        return Token(access_token=new_access_token, refresh_token=new_refresh_token, token_type="bearer") #nosec

    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=Message)
@limiter.limit("3/minute")
def register(
    request: Request,
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends(get_auth_service),
    admin_service: AdminService = Depends(get_admin_service),
    room_service: RoomService = Depends(get_room_service)
):

    # if auth_service.check_duplicated_email(user_in.email):
    #     raise HTTPException(400, "Email already registered")
    
    if auth_service.check_duplicated_profil_name(user_in.profil_name):
        raise HTTPException(400, "User with this profil name already exists")
    
    # création de l'utilisateur
    username = auth_service.get_username(user_in.profil_name, user_in.school_name)
    user_room_id = room_service.get_user_room_id(user_in.level, user_in.year)
    # print(user_room_id)
    user_data = UserInDatabase(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        username=username,
        profil_name=user_in.profil_name,
        email=user_in.email,
        school_name=user_in.school_name,
        domain=user_in.domain,
        level=user_in.level,
        role=user_in.role,
        major=user_in.major,
        year=user_in.year,
        user_room_id=user_room_id,
        hashed_password=hash_password(user_in.password)
    )
    user = auth_service.create_user(user_data=user_data)
    admin = auth_service.get_admin()

    # Envoyer une notification à l'admin en arrière-plan pour la confirmation
    notification = NotificationResponse(
        type="STATUS_UPDATE",
        content=f"Une confirmation de compte en attente",
        is_read=False,
        sender=admin_service.users.create_user_response(user),
        recipient=admin_service.users.create_user_response(admin),
    )
    
    background_tasks.add_task(send_notification_task, notification)
    
    return Message(message="Registration successful.")

@router.get("/check-profil-name/{profil_name}")
def check_profil_name_availability(
    profil_name: str, 
    auth_service: AuthService = Depends(get_auth_service)
):
    is_taken = auth_service.check_duplicated_profil_name(profil_name)
    if is_taken:
        return {"available": False, "message": "Ce nom de profil est déjà utilisé"}
    return {"available": True, "message": "Nom de profil disponible"}

