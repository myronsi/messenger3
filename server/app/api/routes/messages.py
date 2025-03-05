
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse, MessageUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new message in a chat"""
    # Check if chat exists
    chat = db.query(Chat).filter(Chat.id == message_data.chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is a participant in the chat
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to send messages to this chat")
    
    # Create new message
    new_message = Message(
        content=message_data.content,
        chat_id=message_data.chat_id,
        sender_id=current_user.id
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@router.get("/chat/{chat_id}", response_model=List[MessageResponse])
def get_chat_messages(
    chat_id: int,
    skip: int = Query(0, description="Number of messages to skip (for pagination)"),
    limit: int = Query(50, description="Maximum number of messages to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages from a specific chat with pagination"""
    # Check if chat exists
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is a participant in the chat
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to view messages in this chat")
    
    # Get messages with pagination, ordered by timestamp (newest last)
    messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(
        Message.timestamp.asc()
    ).offset(skip).limit(limit).all()
    
    return messages

@router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific message by ID"""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is a participant in the chat where message belongs
    chat = db.query(Chat).filter(Chat.id == message.chat_id).first()
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to view this message")
    
    return message

@router.patch("/{message_id}", response_model=MessageResponse)
def update_message(
    message_id: int,
    message_update: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a message (only sender can update)"""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only sender can update message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can update this message")
    
    # Update content if provided
    if message_update.content:
        message.content = message_update.content
        message.is_edited = True
    
    db.commit()
    db.refresh(message)
    
    return message

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a message (only sender can delete)"""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only sender can delete message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can delete this message")
    
    db.delete(message)
    db.commit()
    
    return None
