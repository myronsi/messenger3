
import logging
import json
from datetime import datetime
from typing import Dict, Set, Any, List
from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.chat import Chat, ChatParticipant
from app.models.user import User

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map of user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
            
    async def broadcast(self, message: dict, exclude_user_id: int = None):
        for user_id, connection in self.active_connections.items():
            if exclude_user_id is None or user_id != exclude_user_id:
                await connection.send_json(message)
                
    def get_online_users(self) -> List[int]:
        return list(self.active_connections.keys())

class WebSocketConnectionManager(ConnectionManager):
    async def handle_message(self, data: dict, user_id: int, db: Session):
        message_type = data.get("type")
        
        if message_type == "message":
            await self.handle_chat_message(data, user_id, db)
        elif message_type == "mark_read":
            await self.handle_mark_read(data, user_id, db)
        elif message_type == "typing":
            await self.handle_typing_indicator(data, user_id)
        elif message_type == "heartbeat":
            # Just acknowledge heartbeats, no action needed
            pass
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    async def handle_chat_message(self, data: dict, user_id: int, db: Session):
        chat_id = data.get("chatId")
        content = data.get("content")
        
        if not chat_id or not content:
            return
        
        # Check if user is a participant in the chat
        participant = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.user_id == user_id
        ).first()
        
        if not participant:
            logger.warning(f"User {user_id} attempted to send message to chat {chat_id} but is not a participant")
            return
        
        # Create and save the message
        message = Message(
            chat_id=chat_id,
            sender_id=user_id,
            content=content,
            created_at=datetime.utcnow(),
            read=False
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Get chat participants to send the message to
        participants = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == chat_id
        ).all()
        
        # Convert message to dict for sending over WebSocket
        message_data = {
            "type": "message",
            "message": {
                "id": message.id,
                "chatId": message.chat_id,
                "senderId": message.sender_id,
                "content": message.content,
                "createdAt": message.created_at.isoformat(),
                "read": message.read
            }
        }
        
        # Send to all participants
        for participant in participants:
            if participant.user_id in self.active_connections:
                await self.send_personal_message(message_data, participant.user_id)
    
    async def handle_mark_read(self, data: dict, user_id: int, db: Session):
        chat_id = data.get("chatId")
        
        if not chat_id:
            return
        
        # Mark all messages in the chat as read for this user
        unread_messages = db.query(Message).filter(
            Message.chat_id == chat_id,
            Message.sender_id != user_id,
            Message.read == False
        ).all()
        
        for message in unread_messages:
            message.read = True
        
        db.commit()
        
        # Notify the sender that their messages were read
        for message in unread_messages:
            if message.sender_id in self.active_connections:
                await self.send_personal_message({
                    "type": "message_read",
                    "messageId": message.id,
                    "chatId": chat_id,
                    "readBy": user_id
                }, message.sender_id)
    
    async def handle_typing_indicator(self, data: dict, user_id: int):
        chat_id = data.get("chatId")
        is_typing = data.get("isTyping", False)
        
        if not chat_id:
            return
        
        # Send typing indicator to all participants in the chat
        typing_data = {
            "type": "user_typing",
            "chatId": chat_id,
            "userId": user_id,
            "isTyping": is_typing
        }
        
        await self.broadcast(typing_data, exclude_user_id=user_id)
    
    async def broadcast_user_status(self, user_id: int, is_online: bool, db: Session):
        # Get all chats the user is a participant in
        participant_chats = db.query(ChatParticipant).filter(
            ChatParticipant.user_id == user_id
        ).all()
        
        # For each chat, notify other participants of the user's status
        for participant in participant_chats:
            chat_participants = db.query(ChatParticipant).filter(
                ChatParticipant.chat_id == participant.chat_id,
                ChatParticipant.user_id != user_id
            ).all()
            
            status_data = {
                "type": "status",
                "userId": user_id,
                "isOnline": is_online
            }
            
            for chat_participant in chat_participants:
                if chat_participant.user_id in self.active_connections:
                    await self.send_personal_message(status_data, chat_participant.user_id)
