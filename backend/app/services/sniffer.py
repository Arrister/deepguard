import asyncio
import time
from scapy.all import sniff, IP, TCP, UDP, ICMP
from app.services.ml_engine import ml_engine
from app.services.signature_engine import signature_engine
from app.models.log import Log
from app.services.geoip import geoip
from app.db.session import SessionLocal
import threading
import socket
from collections import defaultdict

class NetworkSniffer:
    def __init__(self):
        self.running = False
        self.packet_count = 0
        self.ip_tracker = defaultdict(list)
        self.hostname_cache = {}  # Simple cache for hostnames

        
        # Common port mapping for 'service' feature
        # NOTE: NSL-KDD is old. Mapping modern HTTPS (443) to 'http' can confuse the model
        # because encrypted traffic looks different from plain text HTTP.
        # We map 443 to 'other' or let it fall through to default.
        self.PORT_MAP = {
            80: 'http', 8080: 'http',
            21: 'ftp', 20: 'ftp_data',
            22: 'ssh',
            23: 'telnet',
            25: 'smtp',
            53: 'domain_u',
            110: 'pop_3',
            143: 'imap4',
            3306: 'sql_net',
            3306: 'sql_net',
            # 443 is intentionally omitted to fall back to 'other'
        }

    def _resolve_hostname(self, ip):
        """Resolve IP to hostname with caching and timeout"""
        if ip in self.hostname_cache:
            return self.hostname_cache[ip]
        
        try:
            # Set a short timeout for DNS lookup to avoid blocking
            socket.setdefaulttimeout(0.5)
            hostname = socket.gethostbyaddr(ip)[0]
            self.hostname_cache[ip] = hostname
            return hostname
        except Exception:
            # If resolution fails, store None or just the IP to avoid retrying immediately
            # For now, we'll just return None and not cache failure aggressively 
            # (or we could cache it as None to avoid repeated failed lookups)
            self.hostname_cache[ip] = None
            return None
        
    def _update_metrics(self, src_ip):
        """Update and get metrics for source IP"""
        current_time = time.time()
        self.ip_tracker[src_ip].append(current_time)
        
        # Remove packets older than 2 seconds
        self.ip_tracker[src_ip] = [t for t in self.ip_tracker[src_ip] if current_time - t <= 2.0]
        
        count = len(self.ip_tracker[src_ip])
        
        # Heuristic: If count is very high, it's likely a flood
        # We don't artificially multiply here anymore because SignatureEngine handles floods.
        # But for the ML model, a high count is still a strong signal.
        
        srv_count = count # Simplified approximation
        
        return count, srv_count
    
    def _get_service(self, packet):
        """Determine service from port"""
        port = None
        if packet.haslayer(TCP):
            port = packet[TCP].dport
        elif packet.haslayer(UDP):
            port = packet[UDP].dport
            
        if port:
            # Change default from 'private' to 'other' to reduce false positives
            # 'private' in NSL-KDD often implies non-standard ports used for attacks
            return self.PORT_MAP.get(port, 'other') 
        
        if packet.haslayer(ICMP):
            return 'ecr_i' # Common ICMP service in NSL-KDD
            
        return 'other'

    def _is_noise(self, packet):
        """
        Filter out common local network noise that causes false positives.
        Includes: DHCP, mDNS, SSDP, LLMNR, Broadcast, Multicast.
        """
        if not packet.haslayer(IP):
            return True
            
        dst_ip = packet[IP].dst
        
        # 1. Broadcast / Multicast IPs
        if dst_ip == "255.255.255.255" or dst_ip.startswith("224."):
            return True
            
        # 2. Common Noisy UDP Protocols
        if packet.haslayer(UDP):
            sport = packet[UDP].sport
            dport = packet[UDP].dport
            
            # DHCP (67, 68)
            if sport in [67, 68] or dport in [67, 68]:
                return True
                
            # mDNS (5353)
            if sport == 5353 or dport == 5353:
                return True
                
            # SSDP (1900) - UPnP discovery
            if sport == 1900 or dport == 1900:
                return True
                
            # LLMNR (5355) - Link-Local Multicast Name Resolution
            if sport == 5355 or dport == 5355:
                return True
                
        return False

    def extract_features(self, packet):
        """Extract features from packet for ML prediction"""
        try:
            if not packet.haslayer(IP):
                return None
            
            src_ip = packet[IP].src
            count, srv_count = self._update_metrics(src_ip)
            service = self._get_service(packet)
            
            # Determine flag (simplified)
            flag = 'SF' # Normal
            if packet.haslayer(TCP):
                flags = packet[TCP].flags
                if flags == 0x02: # Pure SYN (common in stealth scans)
                    flag = 'S0'
                elif flags & 0x04: # RST
                    flag = 'REJ'
                elif flags == 0x00 or (flags & 0x01) or (flags & 0x20): # NULL, FIN, URG etc.
                    flag = 'OTH'
            
            features = {
                'duration': 0,
                'protocol_type': 'tcp' if packet.haslayer(TCP) else 'udp' if packet.haslayer(UDP) else 'icmp',
                'service': service,
                'flag': flag,
                'src_bytes': len(packet),
                'dst_bytes': 0,
                'land': 1 if packet[IP].src == packet[IP].dst else 0,
                'wrong_fragment': 0,
                'urgent': 0,
                'hot': 0,
                'num_failed_logins': 0,
                'logged_in': 0,
                'num_compromised': 0,
                'root_shell': 0,
                'su_attempted': 0,
                'num_root': 0,
                'num_file_creations': 0,
                'num_shells': 0,
                'num_access_files': 0,
                'num_outbound_cmds': 0,
                'is_host_login': 0,
                'is_guest_login': 0,
                'count': count,
                'srv_count': srv_count,
                'serror_rate': 1.0 if flag in ['S0', 'OTH'] else 0.0,
                'srv_serror_rate': 1.0 if flag in ['S0', 'OTH'] else 0.0,
                'rerror_rate': 1.0 if flag in ['REJ', 'OTH'] else 0.0,
                'srv_rerror_rate': 1.0 if flag in ['REJ', 'OTH'] else 0.0,
                'same_srv_rate': 1.0,
                'diff_srv_rate': 0.0,
                'srv_diff_host_rate': 0.0,
                'dst_host_count': count,
                'dst_host_srv_count': srv_count,
                'dst_host_same_srv_rate': 1.0,
                'dst_host_diff_srv_rate': 0.0,
                'dst_host_same_src_port_rate': 1.0 if count < 10 else 0.0, # High count usually means same port flood
                'dst_host_srv_diff_host_rate': 0.0,
                'dst_host_serror_rate': 0.0,
                'dst_host_srv_serror_rate': 0.0,
                'dst_host_rerror_rate': 0.0,
                'dst_host_srv_rerror_rate': 0.0,
            }
            
            return features, packet[IP].src, packet[IP].dst
        
        except Exception as e:
            print(f"Feature extraction error: {e}")
            return None
    
    def process_packet(self, packet):
        """Process a single packet"""
        try:
            if not packet.haslayer(IP):
                return

            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            
            # Check if packet is common background noise
            is_noise = self._is_noise(packet)
            
            prediction = "Normal"
            confidence = 0.0
            detection_source = "AI"
            signature_attack = None
            
            # If it's noise, we skip detection and just label it Normal
            if is_noise:
                prediction = "Normal"
                confidence = 1.0
                detection_source = "Rule (Noise)"
            else:
                # --- HYBRID DETECTION LAYER ---
                
                # 1. Signature-based Detection (Fast, High Confidence)
                signature_attack = signature_engine.check_signatures(packet)
                
                if signature_attack:
                    prediction = "Attack"
                    confidence = 1.0
                    detection_source = "Signature"
                    print(f"🚫 SIGNATURE DETECTED: {signature_attack} from {src_ip}")
                else:
                    # 2. AI-based Detection (Slower, Complex Patterns)
                    result = self.extract_features(packet)
                    if result:
                        features, _, _ = result
                        prediction, confidence = ml_engine.predict(features)
                        
                        # Debug log occasionally
                        if self.packet_count % 50 == 0:
                            print(f"DEBUG: {src_ip} -> {features['service']} | {features['flag']} | Pred: {prediction}")

            # --- LOGGING ---
            
            should_log = False
            if prediction == "Attack":
                should_log = True
                # If it's an AI detection, print it clearly
                if detection_source == "AI":
                    print(f"🤖 AI DETECTED: Potential Attack from {src_ip} (Conf: {confidence:.2%})")
                    # DEBUG: Print features to understand why
                    if not is_noise: # Only print debug for non-noise
                        result = self.extract_features(packet)
                        if result:
                            feat = result[0]
                            # Get port for debug
                            port = "N/A"
                            if packet.haslayer(TCP): port = packet[TCP].dport
                            elif packet.haslayer(UDP): port = packet[UDP].dport
                            print(f"   DEBUG FEATURES: Port={port}, Service={feat['service']}, Flag={feat['flag']}, Count={feat['count']}")
            
            # Log ALL normal traffic (as requested by user)
            else:
                should_log = True
            
            # Log to DB
            if should_log:
                db = SessionLocal()
                try:
                    # Resolve hostnames (best effort)
                    src_host = self._resolve_hostname(src_ip)
                    dst_host = self._resolve_hostname(dst_ip)

                    # Resolve GeoIP
                    src_geo = geoip.resolve(src_ip)
                    dst_geo = geoip.resolve(dst_ip)
                    geo_info = f" | Src: {src_geo['country']} | Dst: {dst_geo['country']}" if src_geo and dst_geo else ""

                    log = Log(
                        source_ip=src_ip,
                        source_hostname=src_host,
                        destination_ip=dst_ip,
                        destination_hostname=dst_host,
                        protocol='TCP' if packet.haslayer(TCP) else 'UDP' if packet.haslayer(UDP) else 'ICMP',
                        prediction=prediction,
                        confidence=confidence,
                        details=f"Source: {detection_source} | Type: {signature_attack if signature_attack else 'Anomaly'}{geo_info}"
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    print(f"DB Error: {e}")
                finally:
                    db.close()
            
            self.packet_count += 1
        
        except Exception as e:
            print(f"Packet processing error: {e}")
    
    def start_sniffing(self, interface=None, packet_count=0):
        """Start packet sniffing"""
        print(f"Starting HYBRID AI-IDS sniffer...")
        self.running = True
        
        try:
            sniff(
                iface=interface,
                prn=self.process_packet,
                store=False,
                count=packet_count if packet_count > 0 else 0,
                stop_filter=lambda x: not self.running
            )
        except Exception as e:
            print(f"Sniffing error: {e}")
            self.running = False
    
    def start_async(self):
        """Start sniffing in a separate thread"""
        thread = threading.Thread(target=self.start_sniffing, daemon=True)
        thread.start()
        return thread

# Global instance
sniffer = NetworkSniffer()
