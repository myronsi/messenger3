
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.schemas.chat import ChatCreate, ChatResponse, ChatUpdate

router = APIRouter()

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_data: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat with participants"""
    # Create new chat
    new_chat = Chat(name=chat_data.name, created_by=current_user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    # Add participants (including creator)
    new_chat.participants.append(current_user)
    
    # Add other participants if provided
    if chat_data.participant_ids:
        for participant_id in chat_data.participant_ids:
            if participant_id != current_user.id:  # Skip if it's the current user
                participant = db.query(User).filter(User.id == participant_id).first()
                if participant:
                    new_chat.participants.append(participant)
                else:
                    # We don't throw an error if a participant doesn't exist, just skip them
                    pass
    
    db.commit()
    db.refresh(new_chat)
    
    return new_chat

@router.get("/", response_model=List[ChatResponse])
def get_user_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all chats where the current user is a participant"""
    user_chats = current_user.chats
    return user_chats

@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific chat by ID"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is a participant
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    return chat

@router.patch("/{chat_id}", response_model=ChatResponse)
def update_chat(
    chat_id: int, 
    chat_update: ChatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update chat name or add/remove participants"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is a participant
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    # Update chat name if provided
    if chat_update.name:
        chat.name = chat_update.name
    
    # Add new participants if provided
    if chat_update.add_participant_ids:
        for participant_id in chat_update.add_participant_ids:
            participant = db.query(User).filter(User.id == participant_id).first()
            if participant and participant not in chat.participants:
                chat.participants.append(participant)
    
    # Remove participants if provided
    if chat_update.remove_participant_ids:
        for participant_id in chat_update.remove_participant_ids:
            # Don't allow removing the current user (should be done via leave_chat)
            if participant_id != current_user.id:
                participant = db.query(User).filter(User.id == participant_id).first()
                if participant and participant in chat.participants:
                    chat.participants.remove(participant)
    
    db.commit()
    db.refresh(chat)
    
    return chat

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a chat (only creator can delete)"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Only creator can delete chat
    if chat.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the chat creator can delete the chat")
    
    db.delete(chat)
    db.commit()
    
    return None
