
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    chat_id: int

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    read: Optional[bool] = None

class MessageResponse(MessageBase):
    id: int
    chat_id: int
    sender_id: int
    created_at: datetime
    read: bool
    
    class Config:
        orm_mode = True
