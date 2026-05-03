from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.device import Device
from app.services.scanner import scanner
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# Schemas
class DeviceCreate(BaseModel):
    ip_address: str
    mac_address: str
    name: str
    type: str = "Unknown"

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None

class DeviceResponse(BaseModel):
    id: int
    ip_address: str
    mac_address: str
    name: Optional[str]
    type: str
    vendor: Optional[str]
    is_active: bool
    last_seen: datetime

    class Config:
        from_attributes = True

@router.get("/devices", response_model=List[DeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    """Get all devices"""
    devices = db.query(Device).all()
    return devices

@router.post("/devices", response_model=DeviceResponse)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Manually add a new device"""
    # Check if device exists
    existing_device = db.query(Device).filter(
        (Device.ip_address == device.ip_address) | 
        (Device.mac_address == device.mac_address)
    ).first()
    
    if existing_device:
        raise HTTPException(status_code=400, detail="Device with this IP or MAC already exists")
    
    new_device = Device(
        ip_address=device.ip_address,
        mac_address=device.mac_address,
        name=device.name,
        type=device.type,
        is_active=True
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return new_device

@router.put("/devices/{device_id}", response_model=DeviceResponse)
def update_device(device_id: int, device_in: DeviceUpdate, db: Session = Depends(get_db)):
    """Update device name and type"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if device_in.name is not None:
        device.name = device_in.name
    if device_in.type is not None:
        device.type = device_in.type
    
    db.commit()
    db.refresh(device)
    return device

@router.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Delete a device"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(device)
    db.commit()
    return {"message": "Device deleted successfully"}

@router.post("/scan")
def trigger_scan():
    """Trigger a manual network scan"""
    if not scanner.is_scanning_now:
        # Start scan in background
        import threading
        thread = threading.Thread(target=scanner.scan_network, daemon=True)
        thread.start()
        return {"message": "Network scan started"}
    return {"message": "Scan already in progress"}
