import logging
import datetime
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from jose import jwt, JWTError

from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies import get_db, get_auth_service, get_email_service
from app.models.token import Token
from app.db.security import create_access_token, create_refresh_token, hash_password
from app.models.user import UserCreate, UserInDatabase
from app.models.message import Message
from app.services.email import EmailService
from app.db.security import authenticate_user
from app.db.database import SessionLocal
from app.services.users import AuthService
from app.models.token import RefreshToken
from app.db.schemas.revoked_token import RevokedToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db=db, username=form_data.username, password=form_data.password)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post("/logout")
def logout(body: RefreshToken, db: Session = Depends(get_db)):
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

        db.add(RevokedToken(jti=jti))
        db.commit()

        return Message(message="Logout out successfully")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
def refresh_token(body: RefreshToken, db: Session = Depends(get_db)):
    
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
        
        db.add(RevokedToken(jti=jti))
        db.commit()

        new_access_token = create_access_token(
            data={"sub": user_id}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user_id)},
        )

        return Token(access_token=new_access_token, refresh_token=new_refresh_token, token_type="bearer")

    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=Message)
def register(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends(get_auth_service),
    email_service: EmailService = Depends(get_email_service)
):

    if auth_service.check_duplicated_email(user_in.email):
        raise HTTPException(400, "Email already registered")
    
    if auth_service.check_duplicated_profil_name(user_in.profil_name):
        raise HTTPException(400, "User with this profil name already exists")
    
    # création de l'utilisateur
    username = auth_service.get_username(user_in.profil_name, user_in.school_name)
    user_data = UserInDatabase(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        username=username,
        profil_name=user_in.profil_name,
        email=user_in.email,
        school_name=user_in.school_name,
        domain=user_in.domain,
        level=user_in.level,
        is_verified=False,
        hashed_password=hash_password(user_in.password)
    )
    user = auth_service.create_user(user_data=user_data)
    
    # création de l'email de vérification
    token = email_service.create_verification_email(user_id=user.id)
    
    # Envoie d'email à l'utilisateur
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        token
    )
    
    return Message(message="Registration successful. Check your email.")

@router.get("/confirm-email")
def confirm_email(
    token: str, 
    auth_service: AuthService = Depends(get_auth_service),
    email_service: EmailService = Depends(get_email_service),
    ):
    
    record = email_service.check_verification_token(token)

    if not record:
        raise HTTPException(400, "Invalid token")
    

    if record.expires_at < datetime.datetime.now():

        # supprimer l'utilisateur associé au token expiré
        user = email_service.validate_user(record)
        if user:
            auth_service.delete_user(user.id)

        raise HTTPException(400, "Token expired")
    
    user = email_service.validate_user(record)

    if not user:
        raise HTTPException(404, "User not found")
    
    auth_service.confirm_user(user, record)

    return Message(message="Email verified successfully")
