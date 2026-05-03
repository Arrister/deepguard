from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    mac_address = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)  # User-defined name (e.g., "Dad's iPhone")
    type = Column(String, default="Unknown")  # e.g., PC, Mobile, IoT
    vendor = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
