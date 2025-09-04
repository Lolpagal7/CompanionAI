
import requests
import time
import json
import threading
import atexit
from datetime import datetime

# Your HuggingFace Space Configuration
SPACE_URL = "https://lolpagal7-companion-ai-backend.hf.space"
HF_TOKEN = "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"

# Global variable to control the keep-alive thread
keep_alive_active = True

# Headers for authentication
HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "companion-ai-pinger/1.0"
}

def self_ping_keep_alive():
    """
    Simple recursive self-pinging function to keep HuggingFace Space alive
    Runs in background thread and pings every 4-5 minutes
    """
    global keep_alive_active
    ping_interval = 240  # 4 minutes
    
    while keep_alive_active:
        try:
            log_with_timestamp("Self-ping to stay alive...")
            response = requests.get(SPACE_URL, timeout=10)
            
            if response.status_code == 200:
                log_with_timestamp(f"Self-ping successful ({response.status_code})")
            else:
                log_with_timestamp(f"Self-ping status: {response.status_code}")
                
        except Exception as e:
            log_with_timestamp(f"Self-ping error: {e}")
        
        # Wait for next ping (only if still active)
        for _ in range(ping_interval):
            if not keep_alive_active:
                break
            time.sleep(1)
    
    log_with_timestamp("Self-ping thread stopped")

def start_self_ping():
    """Start the self-pinging background thread"""
    global keep_alive_active
    keep_alive_active = True
    
    ping_thread = threading.Thread(target=self_ping_keep_alive, daemon=True)
    ping_thread.start()
    log_with_timestamp(" Self-ping thread started (4-minute intervals)")
    
    # Stop the thread when program exits
    atexit.register(stop_self_ping)
    
    return ping_thread

def stop_self_ping():
    """Stop the self-pinging thread"""
    global keep_alive_active
    keep_alive_active = False
    log_with_timestamp(" Self-ping thread stopping...")

def log_with_timestamp(message):
    """Print message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def test_space_accessibility():
    """Test if the space is accessible"""
    try:
        log_with_timestamp("Testing space accessibility...")
        response = requests.get(SPACE_URL, headers=HEADERS, timeout=10)
        log_with_timestamp(f"Space accessibility: {response.status_code} {response.reason}")
        return response.status_code == 200
    except Exception as e:
        log_with_timestamp(f"Space accessibility test failed: {e}")
        return False

def call_companion_ai_api(text_message, endpoint_type="run"):
    """
    Call your companion_ai function via Gradio API
    
    Args:
        text_message (str): The message to send to your AI
        endpoint_type (str): "run" for /run/predict or "api" for /api/predict
    
    Returns:
        dict: Response from the API or error info
    """
    try:
        # Choose endpoint based on type
        if endpoint_type == "run":
            url = f"{SPACE_URL}/run/predict"
            payload = {
                "data": [text_message, None],  # text, image (None for no image)
                "fn_index": 0,  # companion_ai function index
                "session_hash": f"session_{int(time.time())}"
            }
        elif endpoint_type == "predict":
            url = f"{SPACE_URL}/predict"
            payload = {
                "data": [None, text_message]  # image (None), message - matching your frontend
            }
        else:  # api
            url = f"{SPACE_URL}/api/predict"
            payload = {
                "data": [text_message, None]  # text, image
            }
        
        log_with_timestamp(f"Calling {endpoint_type} endpoint: {url}")
        log_with_timestamp(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, headers=HEADERS, json=payload, timeout=30)
        
        log_with_timestamp(f"Response Status: {response.status_code} {response.reason}")
        
        if response.status_code == 200:
            result = response.json()
            log_with_timestamp(f" SUCCESS! Response: {json.dumps(result, indent=2)}")
            
            # Extract the AI response
            ai_response = result.get('data', [None])[0]
            return {
                "success": True,
                "response": ai_response,
                "endpoint": endpoint_type,
                "raw_result": result
            }
        else:
            error_text = response.text
            log_with_timestamp(f" FAILED! Error: {error_text}")
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {error_text}",
                "endpoint": endpoint_type
            }
            
    except Exception as e:
        log_with_timestamp(f" EXCEPTION: {e}")
        return {
            "success": False,
            "error": str(e),
            "endpoint": endpoint_type
        }

def test_both_endpoints(message="Hello! This is a test from the Python pinger."):
    """Test /run/predict, /predict, and /api/predict endpoints"""
    log_with_timestamp("="*60)
    log_with_timestamp("TESTING ALL GRADIO ENDPOINTS")
    log_with_timestamp("="*60)
    
    # Test /predict (your frontend uses this)
    log_with_timestamp(" Testing /predict endpoint (frontend uses this)...")
    predict_result = call_companion_ai_api(message, "predict")
    
    # Test /run/predict
    log_with_timestamp(" Testing /run/predict endpoint...")
    run_result = call_companion_ai_api(message, "run")
    
    # Test /api/predict
    log_with_timestamp(" Testing /api/predict endpoint...")
    api_result = call_companion_ai_api(message, "api")
    
    # Summary
    log_with_timestamp("="*60)
    log_with_timestamp("ENDPOINT TEST RESULTS:")
    log_with_timestamp(f"/predict: {' SUCCESS' if predict_result['success'] else ' FAILED'}")
    log_with_timestamp(f"/run/predict: {' SUCCESS' if run_result['success'] else ' FAILED'}")
    log_with_timestamp(f"/api/predict: {' SUCCESS' if api_result['success'] else ' FAILED'}")
    
    # Return the working endpoint (prioritize /predict since frontend uses it)
    if predict_result['success']:
        log_with_timestamp(" /predict works - your frontend should connect!")
        return "predict", predict_result
    elif run_result['success']:
        log_with_timestamp(" USE /run/predict in your frontend!")
        return "run", run_result
    elif api_result['success']:
        log_with_timestamp(" USE /api/predict in your frontend!")
        return "api", api_result
    else:
        log_with_timestamp(" All endpoints failed. Your space might be sleeping or need different auth.")
        return None, None

def keep_space_alive_background():
    """
    Background thread function to keep HuggingFace Space alive
    Pings every 4 minutes (240 seconds)
    """
    ping_interval = 240  # 4 minutes
    ping_count = 0
    
    log_with_timestamp(" Starting background keep-alive service")
    log_with_timestamp(f"Will ping {SPACE_URL} every {ping_interval} seconds")
    
    while True:
        try:
            ping_count += 1
            log_with_timestamp(f" Background ping #{ping_count}")
            
            # Simple ping to keep space awake
            response = requests.get(SPACE_URL, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                log_with_timestamp(f" Space kept alive (status: {response.status_code})")
            else:
                log_with_timestamp(f" Ping returned status: {response.status_code}")
                
            time.sleep(ping_interval)
            
        except Exception as e:
            log_with_timestamp(f" Keep-alive error: {e}")
            time.sleep(60)  # Wait 1 minute on error before retrying

def start_keep_alive_thread():
    """Start the background keep-alive thread"""
    keep_alive_thread = threading.Thread(target=keep_space_alive_background, daemon=True)
    keep_alive_thread.start()
    log_with_timestamp(" Background keep-alive thread started")
    return keep_alive_thread

def keep_space_alive(ping_interval=300):  # 5 minutes
    """
    Continuously ping the space to keep it alive
    
    Args:
        ping_interval (int): Seconds between pings (default: 5 minutes)
    """
    log_with_timestamp(" Starting HuggingFace Space Keep-Alive Service")
    log_with_timestamp(f"Space URL: {SPACE_URL}")
    log_with_timestamp(f"Ping interval: {ping_interval} seconds")
    log_with_timestamp("="*60)
    
    ping_count = 0
    
    while True:
        try:
            ping_count += 1
            log_with_timestamp(f" PING #{ping_count}")
            
            # Test space accessibility
            is_accessible = test_space_accessibility()
            
            if is_accessible:
                # Try to call the API
                result = call_companion_ai_api(f"Keep-alive ping #{ping_count} at {datetime.now()}")
                
                if result['success']:
                    log_with_timestamp(f" Space is alive and responding!")
                    log_with_timestamp(f"AI said: {result['response']}")
                else:
                    log_with_timestamp(f" Space is accessible but API failed: {result['error']}")
            else:
                log_with_timestamp(" Space seems to be sleeping or inaccessible")
            
            log_with_timestamp(f"Waiting {ping_interval} seconds until next ping...")
            log_with_timestamp("-" * 40)
            
            time.sleep(ping_interval)
            
        except KeyboardInterrupt:
            log_with_timestamp(" Keep-alive service stopped by user")
            break
        except Exception as e:
            log_with_timestamp(f" Unexpected error: {e}")
            log_with_timestamp("Continuing in 30 seconds...")
            time.sleep(30)

def main():
    """Main function to run the space tester and keep-alive service"""
    print(" HuggingFace Companion AI Space Manager")
    print("=" * 50)
    
    # Start self-pinging automatically
    start_self_ping()
    
    while True:
        print("\nChoose an option:")
        print("1. Test all endpoints once")
        print("2. Start manual keep-alive service (continuous foreground)")
        print("3. Single API test")
        print("4. Exit")
        print("  Self-ping is running every 4 minutes in background")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            test_both_endpoints()
            
        elif choice == "2":
            interval = input("Enter ping interval in seconds (default 300): ").strip()
            interval = int(interval) if interval.isdigit() else 300
            keep_space_alive(interval)
            
        elif choice == "3":
            message = input("Enter a message to test: ").strip()
            if not message:
                message = "Hello from Python tester!"
            
            endpoint = input("Which endpoint? (predict/run/api): ").strip().lower()
            if endpoint not in ["predict", "run", "api"]:
                endpoint = "predict"
                
            result = call_companion_ai_api(message, endpoint)
            if result['success']:
                print(f"\n SUCCESS! AI Response: {result['response']}")
            else:
                print(f"\n FAILED! Error: {result['error']}")
                
        elif choice == "4":
            stop_self_ping()
            log_with_timestamp(" Goodbye!")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
