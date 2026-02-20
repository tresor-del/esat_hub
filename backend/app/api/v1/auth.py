import logging
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from jose import jwt, JWTError

from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies import get_db, get_auth_service, get_email_service
from app.models.token import Token
from app.db.security import create_access_token, create_refresh_token
from app.models.user import UserCreate
from app.models.message import Message
from app.services.email_service import EmailService
from app.db.security import authenticate_user
from app.db.database import SessionLocal
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])



@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db=db, username=form_data.username, password=form_data.password)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    # access_token_expires = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")
    


@router.post("/refresh")
def refresh_token(refresh_token: str):
    
    try:
        payload = jwt.decode(
            token=refresh_token,
            key=settings.REFRESH_SECRET_KEY,
            algorithms=[settings.REFRESH_ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        access_token = create_access_token(
            data={"sub": user_id}
        )
        return {"access_token": access_token}
    except JWTError:
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
    
    # création de l'utilisateur
    user = auth_service.create_user(
        username=user_in.email, 
        password=user_in.password, 
        is_verified=False
    )
    
    # création de l'email de vérification
    token = auth_service.create_verification_email(user_id=user.id)
    
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
    
    record = email_service.check_user_email_verification_token(token)

    if not record:
        raise HTTPException(400, "Invalid token")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(400, "Token expired")
    
    user = auth_service.check_user_email_verification_token(record)

    if not user:
        raise HTTPException(404, "User not found")
    
    auth_service.confirm_user(user, record)

    return Message(message="Email verified successfully")
