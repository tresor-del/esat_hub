from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    SECRET_KEY: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REFRESH_SECRET_KEY: str 
    REFRESH_ALGORITHM: str = "HS256"
    
    app_name: str ="esat-hub"
    API_V1_STR: str = "/api/v1"

    SQLALCHEMY_DATABASE_URI: str 

    AVATAR_DIR: str = "uploads/avatars"
    ALLOWED_TYPES: set = {"image/jpeg", "image/png", "image/webp"}
    MAX_SIZE: int = 5 * 1024 * 1024 

    UPLOAD_DIR: Path = Path("uploads")

    # Extensions de fichiers autorisées
    ALLOWED_PHOTO_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    ALLOWED_DOCUMENT_EXTENSIONS: set = {".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".ppt", ".pptx"}

    DEFAULT_AVATAR: str = "static/default_avatar.jpg"

    FRONTEND_HOST: str = "http://localhost:5173"

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: str
    EMAILS_FROM_NAME: str
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    
settings = Settings()