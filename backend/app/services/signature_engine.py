import time
from collections import defaultdict
from scapy.all import IP, TCP, UDP, ICMP

class SignatureEngine:
    def __init__(self):
        # Configuration
        self.TIME_WINDOW = 2.0  # seconds
        self.SYN_THRESHOLD = 100  # packets per window
        self.ICMP_THRESHOLD = 100 # packets per window
        self.SCAN_THRESHOLD = 20  # unique ports per window
        
        # State tracking
        # ip_tracker: {src_ip: [timestamp1, timestamp2, ...]}
        self.syn_tracker = defaultdict(list)
        self.icmp_tracker = defaultdict(list)
        
        # port_scan_tracker: {src_ip: {(dst_ip, dst_port): timestamp}}
        self.port_scan_tracker = defaultdict(list)

    def _clean_old_records(self, tracker, current_time):
        """Remove records older than TIME_WINDOW"""
        for key in list(tracker.keys()):
            tracker[key] = [t for t in tracker[key] if current_time - t <= self.TIME_WINDOW]
            if not tracker[key]:
                del tracker[key]

    def check_signatures(self, packet):
        """
        Check packet against known attack signatures.
        Returns: Attack Name (str) or None
        """
        if not packet.haslayer(IP):
            return None

        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        current_time = time.time()
        
        # 1. ICMP Flood Detection
        if packet.haslayer(ICMP):
            self.icmp_tracker[src_ip].append(current_time)
            # Clean and check
            self.icmp_tracker[src_ip] = [t for t in self.icmp_tracker[src_ip] if current_time - t <= self.TIME_WINDOW]
            if len(self.icmp_tracker[src_ip]) > self.ICMP_THRESHOLD:
                return "ICMP Flood"

        # 2. SYN Flood Detection
        if packet.haslayer(TCP):
            flags = packet[TCP].flags
            # Check for SYN flag (S) without ACK (A)
            if flags & 0x02 and not (flags & 0x10):
                self.syn_tracker[src_ip].append(current_time)
                # Clean and check
                self.syn_tracker[src_ip] = [t for t in self.syn_tracker[src_ip] if current_time - t <= self.TIME_WINDOW]
                if len(self.syn_tracker[src_ip]) > self.SYN_THRESHOLD:
                    return "SYN Flood"

        # 3. Port Scan Detection (TCP/UDP)
        dst_port = None
        if packet.haslayer(TCP):
            dst_port = packet[TCP].dport
        elif packet.haslayer(UDP):
            dst_port = packet[UDP].dport
            
        if dst_port:
            # Track unique (dst_ip, dst_port) accessed by src_ip
            # We store tuples of (dst_ip, dst_port, timestamp)
            self.port_scan_tracker[src_ip].append((dst_ip, dst_port, current_time))
            
            # Clean old records
            self.port_scan_tracker[src_ip] = [
                (dip, dport, t) for (dip, dport, t) in self.port_scan_tracker[src_ip] 
                if current_time - t <= self.TIME_WINDOW
            ]
            
            # Count unique ports
            unique_ports = set((dip, dport) for (dip, dport, t) in self.port_scan_tracker[src_ip])
            if len(unique_ports) > self.SCAN_THRESHOLD:
                return "Port Scan"

        return None

# Global instance
signature_engine = SignatureEngine()
