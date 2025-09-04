import os
import sys
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import gradio as gr
import numpy as np
import base64
import io
import threading
import requests
import time
import atexit
from datetime import datetime
from gradio_client import Client, handle_file
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Keep-alive configuration
RENDER_PING_URL = "https://companion-ai-vqp1.onrender.com"
keep_alive_active = True

def self_ping_keep_alive():
    """
    Simple self-pinging function to keep this app alive via Render ping service
    Runs in background thread and pings every 4 minutes
    """
    global keep_alive_active
    ping_interval = 240  # 4 minutes
    
    # Simple headers for render ping service
    headers = {
        "User-Agent": "CompanionAI/1.0"
    }
    
    while keep_alive_active:
        try:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping via Render service...")
            response = requests.get(RENDER_PING_URL, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping successful ({response.status_code})")
            else:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping status: {response.status_code}")
                
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping error: {e}")
        
        # Wait for next ping with interruptible sleep (check every second if we should stop)
        for _ in range(ping_interval):
            if not keep_alive_active:
                break
            time.sleep(1)
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping thread stopped")

def start_self_ping():
    """Start the self-pinging background thread"""
    global keep_alive_active
    keep_alive_active = True
    
    ping_thread = threading.Thread(target=self_ping_keep_alive, daemon=True)
    ping_thread.start()
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping thread started via Render service (4-minute intervals)")
    
    # Stop the thread when program exits
    atexit.register(stop_self_ping)
    
    return ping_thread

def stop_self_ping():
    """Stop the self-pinging thread"""
    global keep_alive_active
    keep_alive_active = False
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Self-ping thread stopping...")

# Add model directory to path and patch imports
model_dir = os.path.join(os.path.dirname(__file__), 'model')
sys.path.append(model_dir)
sys.path.append(os.path.dirname(__file__))

# Patch import paths for model files
try:
    import types
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create Python module alias
    python_module = types.ModuleType('Python')
    python_module.__path__ = [current_dir]
    sys.modules['Python'] = python_module
    
    # Create utils submodule
    utils_module = types.ModuleType('Python.utils')
    utils_module.__path__ = [os.path.join(current_dir, 'utils')]
    sys.modules['Python.utils'] = utils_module
    
    print("[INFO] Import paths patched successfully")
except Exception as e:
    print(f"[WARNING] Import patch failed: {e}")

# Import your actual models
try:
    from model.CNN_1 import load_cnn1_model, predict_with_cnn1, oneImg
    print("[INFO] CNN_1 imported successfully")
    cnn1_available = True
except ImportError as e:
    print(f"[WARNING] CNN_1 import failed: {e}")
    cnn1_available = False

try:
    from model.CNN_2 import load_cnn2_model, get_cnn_model, EmotionCNN, predict_with_cnn2
    print("[INFO] CNN_2 imported successfully")
    cnn2_available = True
except ImportError as e:
    print(f"[WARNING] CNN_2 import failed: {e}")
    cnn2_available = False

try:
    from model.NLP import (
        SwearFilter, 
        soft_voting_emotion,
        cnn_emotion_predictor,
        load_emotion_tokenizer,
        load_emotion_model,
        load_blender_tokenizer,
        load_blender_model,
        get_intent,
        generate_response,
        suicide_keywords,
        emotion_to_intent,
        get_goemotions
    )
    print("[INFO] NLP imported successfully")
    nlp_available = True
except ImportError as e:
    print(f"[WARNING] NLP import failed: {e}")
    nlp_available = False
    # Simple fallbacks only if NLP completely fails
    suicide_keywords = ['kill myself', 'end my life', 'suicide', 'want to die']
    def get_intent(msg): return 'neutral'
    def generate_response(msg, intent, hist): return "I'm here to listen. How are you feeling?"
    class SwearFilter:
        def __init__(self, max_warnings=3): self.warnings = 0
        def check(self, text): return None

# Configuration
EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# Updated weight paths based on your actual file structure
CNN1_WEIGHTS = os.path.join(os.path.dirname(__file__), 'weights', 'cnn1_final_weights.pt')
CNN2_WEIGHTS = os.path.join(os.path.dirname(__file__), 'weights', 'best_emotion_cnn_weights.pth')

# Check if weights exist and provide alternatives
if not os.path.exists(CNN1_WEIGHTS):
    # Try alternative paths in model directory
    alt_paths = [
        os.path.join(os.path.dirname(__file__), 'model', 'cnn1_final_weights.pt'),
        os.path.join(os.path.dirname(__file__), 'CNN_1', 'cnn1_final_weights.pt'),
        os.path.join(os.path.dirname(__file__), 'cnn1_final_weights.pt')
    ]
    for alt_path in alt_paths:
        if os.path.exists(alt_path):
            CNN1_WEIGHTS = alt_path
            break
    else:
        print(f"[WARNING] CNN1 weights not found. Checked: {CNN1_WEIGHTS}")

if not os.path.exists(CNN2_WEIGHTS):
    # Try alternative paths in model directory
    alt_paths = [
        os.path.join(os.path.dirname(__file__), 'model', 'best_emotion_cnn_weights.pth'),
        os.path.join(os.path.dirname(__file__), 'CNN_2', 'best_emotion_cnn_weights.pth'),
        os.path.join(os.path.dirname(__file__), 'best_emotion_cnn_weights.pth')
    ]
    for alt_path in alt_paths:
        if os.path.exists(alt_path):
            CNN2_WEIGHTS = alt_path
            break
    else:
        print(f"[WARNING] CNN2 weights not found. Checked: {CNN2_WEIGHTS}")

# Global model storage
_swear_filter = None
_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Initialize models
def initialize_models():
    global _swear_filter
    
    print("[INFO] Initializing CompanionAI models...")
    
    # Initialize SwearFilter from your NLP.py
    try:
        if nlp_available:
            _swear_filter = SwearFilter(max_warnings=18)  # Using your actual SwearFilter
            print("[INFO] SwearFilter initialized")
        else:
            print("[WARNING] SwearFilter not available")
            _swear_filter = None
    except Exception as e:
        print(f"[WARNING] SwearFilter failed: {e}")
        _swear_filter = None
    
    # Check if model files exist
    if cnn1_available:
        if os.path.exists(CNN1_WEIGHTS):
            print(f"[INFO] CNN1 weights found at {CNN1_WEIGHTS}")
        else:
            print(f"[WARNING] CNN1 weights not found at {CNN1_WEIGHTS}")
    
    if cnn2_available:
        if os.path.exists(CNN2_WEIGHTS):
            print(f"[INFO] CNN2 weights found at {CNN2_WEIGHTS}")
        else:
            print(f"[WARNING] CNN2 weights not found at {CNN2_WEIGHTS}")
    
    print("[INFO] Model initialization complete")

# Emotion prediction with your models
def predict_emotion(image):
    """Predict emotion using your CNN models with soft voting"""
    if image is None:
        return "No image provided"
    
    try:
        print(f"[DEBUG] Processing image of type: {type(image)}")
        
        # Convert PIL Image to tensor for CNN2 and numpy for CNN1
        transform = transforms.Compose([
            transforms.Resize((48, 48)),
            transforms.ToTensor()
        ])
        
        if isinstance(image, str):  # If base64 string
            image_data = base64.b64decode(image.split(',')[1])
            image = Image.open(io.BytesIO(image_data))
        
        image = image.convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(_device)
        
        # Try using your actual CNN models
        models = []
        predictions = []
        
        # CNN1 prediction using your actual predict_with_cnn1 function
        if cnn1_available:
            try:
                # Your predict_with_cnn1 handles PIL images and loads weights internally
                result_cnn1 = predict_with_cnn1(image, CNN1_WEIGHTS)
                if isinstance(result_cnn1, np.ndarray) and len(result_cnn1) == 7:
                    predictions.append(result_cnn1)
                    models.append('CNN1')
                    print("[INFO] CNN1 prediction successful")
                else:
                    print(f"[WARNING] CNN1 returned unexpected format: {type(result_cnn1)}")
            except Exception as e:
                print(f"[WARNING] CNN1 prediction failed: {e}")
        
        # CNN2 prediction using your actual model
        if cnn2_available:
            try:
                result_cnn2 = predict_with_cnn2(image, CNN2_WEIGHTS)
                if isinstance(result_cnn2, np.ndarray) and len(result_cnn2) == 7:
                    predictions.append(result_cnn2)
                    models.append('CNN2')
                    print("[INFO] CNN2 prediction successful")
                else:
                    print(f"[WARNING] CNN2 returned unexpected format: {type(result_cnn2)}")
            except Exception as e:
                print(f"[WARNING] CNN2 prediction failed: {e}")
        
        # Use your soft voting function if available and we have predictions
        if predictions and nlp_available and soft_voting_emotion:
            try:
                # Average the predictions manually since your soft_voting_emotion expects models
                avg_probs = np.mean(predictions, axis=0)
                pred_idx = np.argmax(avg_probs)
                result = EMOTION_CLASSES[pred_idx]
                print(f"[INFO] Soft voting result: {result}")
                return result
            except Exception as e:
                print(f"[WARNING] Soft voting failed: {e}")
        
        # If we have at least one prediction, use the best one
        if predictions:
            avg_probs = np.mean(predictions, axis=0)
            pred_idx = np.argmax(avg_probs)
            result = EMOTION_CLASSES[pred_idx]
            print(f"[INFO] Average prediction result: {result}")
            return result
        
        # Fallback to simple prediction
        fallback_emotions = ['happy', 'neutral', 'calm', 'content']
        import random
        result = random.choice(fallback_emotions)
        print(f"[INFO] Fallback emotion: {result}")
        return result
        
    except Exception as e:
        print(f"[ERROR] Emotion prediction failed: {e}")
        return f"Error: {str(e)}"

# Chat response with your NLP models
def chat_response(user_message):
    """Generate chat response using your NLP pipeline"""
    if not user_message or not user_message.strip():
        return "Please provide a message."
    
    try:
        print(f"[DEBUG] Processing message: {user_message[:50]}...")
        
        # Check swear filter
        if _swear_filter:
            swear_warning = _swear_filter.check(user_message)
            if swear_warning:
                print("[INFO] Swear filter triggered")
                return swear_warning
        
        # Check for suicide keywords
        if any(keyword in user_message.lower() for keyword in suicide_keywords):
            crisis_response = (
                "I'm really sorry you're feeling this way. You're not alone.\n"
                "Please talk to someone you trust or call a helpline.\n"
                "India Helplines: iCall (9152987821), AASRA (91-22-27546669)\n"
                "International: Crisis Text Line (Text HOME to 741741)"
            )
            print("[INFO] Crisis intervention triggered")
            return crisis_response
        
        # Get intent and generate response using your NLP models
        try:
            intent = get_intent(user_message)
            response = generate_response(user_message, intent, [])
            print(f"[INFO] NLP response generated with intent: {intent}")
            print(f"[DEBUG] Response: {response[:100]}...")
            return response
        except Exception as e:
            print(f"[WARNING] NLP generation failed: {e}")
            
            # Only use fallback if NLP completely fails
            if "not supported for `8-bit`" in str(e):
                print("[INFO] 8-bit model warning - this is normal, retrying...")
                try:
                    # Simple retry for 8-bit model issues
                    intent = get_intent(user_message)
                    response = generate_response(user_message, intent, [])
                    print(f"[INFO] NLP retry successful with intent: {intent}")
                    return response
                except Exception as e2:
                    print(f"[WARNING] NLP retry failed: {e2}")
            
            # Fallback therapeutic responses
            therapeutic_responses = [
                "I understand you're sharing your thoughts with me. How are you feeling about that?",
                "Thank you for opening up. It takes courage to express your emotions. What's been on your mind lately?",
                "I'm here to listen and support you. Can you tell me more about what you're experiencing?",
                "Your feelings are valid and important. What would you like to explore together today?",
                "I appreciate you sharing with me. Sometimes talking about our emotions can be really helpful. How can I support you?",
                "That sounds meaningful to you. Would you like to share more about what's been going through your mind?",
                "I hear what you're saying. How does that make you feel?",
                "It's okay to feel that way. Can you tell me more about what's bothering you?",
                "I'm glad you're sharing this with me. What would help you feel better right now?",
                "That sounds challenging. How are you coping with all of this?"
            ]
            
            import random
            result = random.choice(therapeutic_responses)
            print("[INFO] Using fallback therapeutic response")
            return result
            
    except Exception as e:
        print(f"[ERROR] Chat response failed: {e}")
        return f"I'm having some technical difficulties right now, but I'm here to listen. How are you feeling today?"

# Simple unified function - ONE endpoint for everything
def companion_ai(image, message):
    """
    Simple unified endpoint:
    - Text only: NLP processes and generates response
    - Image only: CNN detects emotion, NLP generates emotion-based response  
    - Both: CNN detects emotion, NLP uses emotion context for response
    """
    try:
        # Safety checks first
        if message and message.strip():
            if _swear_filter and _swear_filter.check(message):
                return _swear_filter.check(message)
            if any(keyword in message.lower() for keyword in suicide_keywords):
                return "I'm really sorry you're feeling this way. You're not alone.\nPlease talk to someone you trust or call a helpline.\nIndia: iCall (9152987821), AASRA (91-22-27546669)\nInternational: Crisis Text Line (Text HOME to 741741)"
        
        # Case 1: Image only - CNN + NLP
        if image is not None and (not message or not message.strip()):
            print("[INFO] Image-only mode: CNN emotion detection + NLP response")
            emotion = predict_emotion(image)
            emotion_prompt = f"User uploaded an image showing {emotion} emotion. Respond as a mental health companion acknowledging their emotion."
            intent = get_intent(emotion_prompt)
            response = generate_response(emotion_prompt, intent, [])
            return response
        
        # Case 2: Text only - Pure NLP
        elif message and message.strip() and image is None:
            print("[INFO] Text-only mode: Pure NLP processing")
            intent = get_intent(message)
            response = generate_response(message, intent, [])
            return response
        
        # Case 3: Both image and text - NLP-controlled with emotion context
        elif image is not None and message and message.strip():
            print("[INFO] Combined mode: NLP-controlled with CNN emotion enhancement")
            
            # Get emotion from CNN but let NLP lead the conversation
            emotion = predict_emotion(image)
            print(f"[INFO] Detected emotion for context: {emotion}")
            
            # Create NLP-focused prompt with emotion as supporting context
            nlp_message = f"{message}"  # Keep original message primary
            emotion_context = f"[Context: User's facial expression shows {emotion} emotion]"
            
            # Let NLP process the main message first
            intent = get_intent(nlp_message)
            print(f"[INFO] NLP intent detected: {intent}")
            
            # Generate response with emotion as secondary context
            # NLP gets full control, emotion just adds context
            contextual_prompt = f"{emotion_context} {nlp_message}"
            response = generate_response(contextual_prompt, intent, [])
            
            # Ensure NLP response quality by adding emotion awareness only if needed
            if emotion in ['sad', 'angry', 'fear'] and intent != 'crisis':
                # Only add supportive context for negative emotions
                enhanced_response = f"I can see this might be emotionally challenging for you. {response}"
                return enhanced_response
            else:
                # For neutral/positive emotions or crisis situations, let NLP handle fully
                return response
        
        # Case 4: Nothing provided
        else:
            return "Please share a message or upload an image so I can help you today."
            
    except Exception as e:
        print(f"[ERROR] CompanionAI failed: {e}")
        return "I'm having technical difficulties, but I'm here to listen. How are you feeling?"

# Initialize models
initialize_models()

# ONE simple interface - handles everything
demo = gr.Interface(
    fn=companion_ai,
    inputs=[
        gr.Image(type="pil", label="Upload Image (Optional)"),
        gr.Textbox(label="Your Message (Optional)", placeholder="Type your message here...")
    ],
    outputs=gr.Textbox(label="Response"),
    title="CompanionAI - Mental Health Support",
    description="Send text for chat, upload image for emotion detection, or both!"
)

if __name__ == "__main__":
    print("Starting CompanionAI...")
    print("Single endpoint: /predict")
    print("Text → NLP response")
    print("Image → CNN emotion + NLP response") 
    print("Both → Enhanced response")
    
    # Start self-pinging to keep space alive
    start_self_ping()
    
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_api=True
    )
