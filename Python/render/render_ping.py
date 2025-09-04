import os
import requests
import time
import threading
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

HF_SPACE_URL = os.getenv("HF_SPACE_URL", "https://your-space-url.hf.space")
HF_TOKEN = os.getenv("HF_TOKEN")

def ping_hf_space():
    """
    Ping HuggingFace Space to keep it alive
    """
    try:
        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(HF_SPACE_URL, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "target_url": HF_SPACE_URL,
                "response_code": response.status_code,
                "response_time": response.elapsed.total_seconds()
            }
        else:
            return {
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "target_url": HF_SPACE_URL,
                "response_code": response.status_code,
                "error": f"HTTP {response.status_code}"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "target_url": HF_SPACE_URL,
            "error": str(e)
        }

def schedule_pings():
    """
    Schedule regular pings to keep HF Space alive
    """
    while True:
        result = ping_hf_space()
        print(f"Ping result: {result}")
        time.sleep(240)  # Wait 4 minutes

if __name__ == "__main__":
    print(f"Will ping HuggingFace Space: {HF_SPACE_URL}")
    print(f"Starting ping scheduler...")
    
    # Start ping scheduler in background
    ping_thread = threading.Thread(target=schedule_pings, daemon=True)
    ping_thread.start()
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Ping scheduler stopped")
