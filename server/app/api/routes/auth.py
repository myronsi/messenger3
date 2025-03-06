
import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    get_current_user
)
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, RegisterRequest, AuthResponse
from app.schemas.user import UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == request.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == request.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    db_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(db_user.id)},
        expires_delta=access_token_expires
    )
    
    logger.info(f"New user registered: {request.username} ({request.email})")
    
    return {
        "user": UserResponse.from_orm(db_user),
        "access_token": access_token
    }

@router.post("/login", response_model=AuthResponse)
def login(
    response: Response,
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Set cookie for easy WebSocket authentication
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
        secure=settings.environment != "development"
    )
    
    logger.info(f"User logged in: {user.username} ({user.email})")
    
    return {
        "user": UserResponse.from_orm(user),
        "access_token": access_token
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="token")
    return {"detail": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    return current_user
