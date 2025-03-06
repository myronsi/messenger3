
import logging
import os
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session

from app.api.routes import auth, users, chats, messages
from app.core.config import Settings
from app.db.database import get_db, create_tables
from app.core.auth import get_current_user
from app.core.websocket import WebSocketConnectionManager
from app.core.logger import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create WebSocket connection manager
ws_manager = WebSocketConnectionManager()

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up server and initializing database...")
    create_tables()
    yield
    logger.info("Shutting down server...")

# Create FastAPI app
app = FastAPI(
    title="Chat API",
    description="A real-time chat API built with FastAPI and WebSockets",
    version="1.0.0",
    lifespan=lifespan,
)

# Load settings
settings = Settings()

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chats.router, prefix="/api/chats", tags=["Chats"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    try:
        # Authenticate the WebSocket connection
        user = get_current_user(token=token, db=db)
        user_id = user.id
        
        await ws_manager.connect(websocket, user_id)
        logger.info(f"User {user_id} connected to WebSocket")
        
        try:
            while True:
                data = await websocket.receive_json()
                await ws_manager.handle_message(data, user_id, db)
        except WebSocketDisconnect:
            logger.info(f"User {user_id} disconnected from WebSocket")
            ws_manager.disconnect(user_id)
            # Notify other users about the disconnect
            await ws_manager.broadcast_user_status(user_id, False, db)
        
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
    )
