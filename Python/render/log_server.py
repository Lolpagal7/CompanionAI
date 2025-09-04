import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

HF_SPACE_URL = os.getenv("HF_SPACE_URL", "https://your-space-url.hf.space")
HF_TOKEN = os.getenv("HF_TOKEN")

def check_space_status():
    """
    Check HuggingFace Space status and log results
    """
    try:
        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(HF_SPACE_URL, headers=headers, timeout=10)
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "url": HF_SPACE_URL,
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds(),
            "status": "success" if response.status_code == 200 else "error"
        }
        
        print(f"Space check: {log_entry}")
        return log_entry
        
    except Exception as e:
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "url": HF_SPACE_URL,
            "status": "error",
            "error": str(e)
        }
        print(f"Space check failed: {log_entry}")
        return log_entry

if __name__ == "__main__":
    print(f"Checking HuggingFace Space: {HF_SPACE_URL}")
    result = check_space_status()
    print(f"Check complete: {result['status']}")
