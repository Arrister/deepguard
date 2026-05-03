from fastapi import APIRouter
import psutil
import os

router = APIRouter()

@router.get("/system/stats")
def get_system_stats():
    """Get system resource usage (CPU, RAM)"""
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    return {
        "cpu_usage": cpu_percent,
        "memory_usage": memory.percent,
        "memory_total": memory.total,
        "memory_available": memory.available
    }
