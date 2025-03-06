
from typing import Optional, List, Union
from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.message import MessageResponse

class ChatParticipantBase(BaseModel):
    user_id: int
    chat_id: int

class ChatParticipantCreate(ChatParticipantBase):
    pass

class ChatParticipantResponse(ChatParticipantBase):
    joined_at: datetime
    
    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    name: Optional[str] = None
    is_group: bool = False

class ChatCreate(ChatBase):
    participant_ids: List[int]

class ChatUpdate(BaseModel):
    name: Optional[str] = None

class ChatResponse(ChatBase):
    id: int
    created_at: datetime
    participants: List[UserResponse]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True
