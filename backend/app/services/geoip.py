import requests
import logging

logger = logging.getLogger(__name__)

class GeoIPService:
    def __init__(self):
        self.base_url = "http://ip-api.com/json/"
        self.cache = {}

    def resolve(self, ip_address: str):
        """
        Resolve IP to location.
        Returns a dict with country, city, lat, lon.
        """
        # Skip local IPs
        if ip_address.startswith("192.168.") or ip_address.startswith("10.") or ip_address == "127.0.0.1":
            return {
                "country": "Local Network",
                "city": "Internal",
                "lat": 0,
                "lon": 0,
                "isp": "Local"
            }

        if ip_address in self.cache:
            return self.cache[ip_address]

        try:
            response = requests.get(f"{self.base_url}{ip_address}?fields=status,message,country,city,lat,lon,isp", timeout=2)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    result = {
                        "country": data.get("country", "Unknown"),
                        "city": data.get("city", "Unknown"),
                        "lat": data.get("lat", 0),
                        "lon": data.get("lon", 0),
                        "isp": data.get("isp", "Unknown")
                    }
                    self.cache[ip_address] = result
                    return result
        except Exception as e:
            logger.error(f"GeoIP resolution failed for {ip_address}: {e}")
        
        return None

geoip = GeoIPService()
