from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.log import Log
from app.api.schemas import LogResponse, StatsResponse
from typing import List

router = APIRouter()

@router.get("/logs", response_model=List[LogResponse])
def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    logs = db.query(Log).order_by(Log.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

@router.put("/logs/{log_id}/false-positive")
def mark_false_positive(
    log_id: int, 
    is_false_positive: bool = Query(..., description="Set to true to mark as false positive"),
    db: Session = Depends(get_db)
):
    log = db.query(Log).filter(Log.id == log_id).first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Log not found")
    
    log.is_false_positive = is_false_positive
    db.commit()
    return {"message": "Log updated successfully"}

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    # Filter out false positives for stats
    total_packets = db.query(Log).filter(Log.is_false_positive == False).count()
    total_attacks = db.query(Log).filter(Log.prediction == "Attack", Log.is_false_positive == False).count()
    attack_rate = (total_attacks / total_packets * 100) if total_packets > 0 else 0.0
    
    recent_attacks = db.query(Log).filter(
        Log.prediction == "Attack", 
        Log.is_false_positive == False
    ).order_by(Log.timestamp.desc()).limit(10).all()
    
    return {
        "total_packets": total_packets,
        "total_attacks": total_attacks,
        "attack_rate": attack_rate,
        "recent_attacks": recent_attacks
    }
