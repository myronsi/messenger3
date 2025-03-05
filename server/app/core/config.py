
import os
from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Configuration
    api_prefix: str = "/api"
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS 
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ]
    
    # JWT Settings
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "supersecretkey")
    jwt_algorithm: str = "HS256"
    jwt_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Database Settings
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./chat.db")
    
    class Config:
        env_file = ".env"

settings = Settings()
