from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Объединяем все поля и убираем дубликаты
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ]
    database_url: str = "sqlite:///./chat.db"
    secret_key: str = "supersecretkey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 дней в минутах
    api_prefix: str = "/api"
    debug: bool = False
    environment: str = "development"

    # Новая конфигурация (ЗАМЕНЯЕТ старый класс Config)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()