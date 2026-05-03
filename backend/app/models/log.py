from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source_ip = Column(String, index=True)
    destination_ip = Column(String, index=True)
    source_hostname = Column(String, nullable=True)
    destination_hostname = Column(String, nullable=True)
    protocol = Column(String)
    prediction = Column(String)  # "Normal" or "Attack"
    confidence = Column(Float)
    details = Column(String, nullable=True)
    is_false_positive = Column(Boolean, default=False)
