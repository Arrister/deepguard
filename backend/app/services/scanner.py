try:
    from scapy.all import ARP, Ether, srp
    SCAPY_AVAILABLE = True
except Exception:
    SCAPY_AVAILABLE = False

from sqlalchemy.sql import func
import asyncio
from app.models.device import Device
from app.db.session import SessionLocal
import threading
import time

class NetworkScanner:
    def __init__(self):
        self.scanning = False # Loop control
        self.is_scanning_now = False # Actual scan execution status
    
    def get_local_network(self):
        """
        Get the local network IP range (e.g., 192.168.1.0/24).
        """
        try:
            # Connect to an external server to determine the active interface IP
            # We don't actually send data, just create the socket
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            
            # Assume /24 subnet for simplicity (most common for home/hotspots)
            # 192.168.1.15 -> 192.168.1.0/24
            ip_parts = local_ip.split('.')
            network = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0/24"
            return network
        except Exception as e:
            print(f"Could not determine local network: {e}")
            return "192.168.1.0/24"  # Fallback

    def scan_network(self, ip_range=None):
        """
        Scan the network using ARP requests to find active devices.
        """
        if not SCAPY_AVAILABLE:
            print("Scapy not available (cloud environment) — skipping network scan.")
            return []

        if self.is_scanning_now:
            print("Scan already in progress, skipping...")
            return []
            
        self.is_scanning_now = True
        
        if ip_range is None:
            ip_range = self.get_local_network()
            
        print(f"Scanning network: {ip_range}...")
        try:
            # Create ARP request packet
            arp = ARP(pdst=ip_range)
            ether = Ether(dst="ff:ff:ff:ff:ff:ff")
            packet = ether/arp

            # Send packet and get response
            result = srp(packet, timeout=3, verbose=0)[0]

            # Process results
            devices = []
            for sent, received in result:
                devices.append({
                    'ip': received.psrc,
                    'mac': received.hwsrc
                })
            
            self.update_db(devices)
            print(f"Scan complete. Found {len(devices)} devices.")
            return devices

        except Exception as e:
            print(f"Error scanning network: {e}")
            return []
        finally:
            self.is_scanning_now = False

    def update_db(self, devices):
        """Update database with found devices"""
        db = SessionLocal()
        try:
            # Get all currently active devices from DB
            all_db_devices = db.query(Device).all()
            db_macs = {d.mac_address: d for d in all_db_devices}
            found_macs = set()

            for dev_data in devices:
                mac = dev_data['mac']
                found_macs.add(mac)
                
                if mac in db_macs:
                    # Update existing device
                    device = db_macs[mac]
                    device.ip_address = dev_data['ip']
                    device.is_active = True
                    device.last_seen = func.now()
                else:
                    # Create new device
                    new_device = Device(
                        ip_address=dev_data['ip'],
                        mac_address=dev_data['mac'],
                        name=f"Device-{dev_data['ip'].split('.')[-1]}", # Default name
                        type="Unknown",
                        is_active=True
                    )
                    db.add(new_device)
                    
                    # ALERT: Unknown Device Detected
                    from app.models.log import Log
                    alert_log = Log(
                        source_ip=dev_data['ip'],
                        destination_ip="Broadcast",
                        protocol="ARP",
                        prediction="Attack", # Flag as attack/alert
                        confidence=1.0,
                        details=f"New Unknown Device Detected: {dev_data['mac']}"
                    )
                    db.add(alert_log)
            
            # Mark devices not found in this scan as offline
            for mac, device in db_macs.items():
                if mac not in found_macs and device.is_active:
                    device.is_active = False
            
            db.commit()
        except Exception as e:
            print(f"Database update error: {e}")
            db.rollback()
        finally:
            db.close()

    def start_periodic_scan(self, interval=300):
        """Start periodic scanning in background thread"""
        def scan_loop():
            self.scanning = True
            while self.scanning:
                self.scan_network()
                time.sleep(interval)
        
        thread = threading.Thread(target=scan_loop, daemon=True)
        thread.start()
        return thread

scanner = NetworkScanner()
