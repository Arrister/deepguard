from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, logs, devices
from app.db.base import Base
from app.db.session import engine
from app.services.sniffer import sniffer
from app.services.scanner import scanner

# Create database tables
Base.metadata.create_all(bind=engine)

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.security_headers import SecurityHeadersMiddleware

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="DeepGuard-IDS", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://deepguard-production-ddd1.up.railway.app","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(logs.router, prefix="/api", tags=["logs"])
app.include_router(devices.router, prefix="/api", tags=["devices"])
from app.api import system
app.include_router(system.router, prefix="/api", tags=["system"])

@app.on_event("startup")
async def startup_event():
    """Start network sniffer on startup"""
    print("Starting DeepGuard-IDS...")
    # Uncomment to start sniffer automatically
    # sniffer.start_async()
    
    # Start periodic network scan (every 60 seconds)
    scanner.start_periodic_scan(interval=60)

@app.get("/")
def read_root():
    return {"message": "DeepGuard-IDS Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/sniffer/start")
def start_sniffer():
    """Manually start the network sniffer"""
    if not sniffer.running:
        sniffer.start_async()
        return {"message": "Sniffer started"}
    return {"message": "Sniffer already running"}

@app.post("/api/sniffer/stop")
def stop_sniffer():
    """Stop the network sniffer"""
    sniffer.running = False
    return {"message": "Sniffer stopped"}

@app.get("/api/sniffer/status")
def sniffer_status():
    """Get sniffer status"""
    return {
        "running": sniffer.running,
        "packet_count": sniffer.packet_count
    }
