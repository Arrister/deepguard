from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        from_attributes = True

# Log Schemas
class LogResponse(BaseModel):
    id: int
    timestamp: datetime
    source_ip: str
    source_hostname: Optional[str] = None
    destination_ip: str
    destination_hostname: Optional[str] = None
    protocol: str
    prediction: str
    confidence: float
    details: Optional[str] = None
    is_false_positive: bool = False

    class Config:
        from_attributes = True

# Stats Schema
class StatsResponse(BaseModel):
    total_packets: int
    total_attacks: int
    attack_rate: float
    recent_attacks: list[LogResponse]
