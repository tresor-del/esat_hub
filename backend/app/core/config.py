import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    SECRET_KEY: str = "_zVgUKk973F8jF_UFSQojePb8oHQxiYIQEshaE--xZE"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1
    
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REFRESH_SECRET_KEY: str = "oUgu8uvFixfhx_RcupLcuNK7FCpoxLFOTsCIixZ_16Y"
    REFRESH_ALGORITHM: str = "HS256"
    
    app_name: str ="esat-hub"

    SQLALCHEMY_DATABASE_URI: str = "postgresql://tresoresathub:tresoresathub16@localhost:5432/esathub"
    
settings = Settings()