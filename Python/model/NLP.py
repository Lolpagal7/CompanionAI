import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification, BlenderbotTokenizer, BlenderbotForConditionalGeneration
try:
    from utils.goemotions_loader import load_goemotions, clear_goemotions
except ImportError:
    print("[WARNING] goemotions_loader not found, using fallback")
    def load_goemotions(): return None, None
    def clear_goemotions(): pass
import re
import datetime
import threading
import gc

# ------------ EMOTION DETECTOR (GoEmotions) ------------ #

emotion_model_name = "SamLowe/roberta-base-go_emotions"
# emotion_tokenizer = AutoTokenizer.from_pretrained(emotion_model_name)
# emotion_model = AutoModelForSequenceClassification.from_pretrained(emotion_model_name)

emotion_to_intent = {
    "admiration": "happy", "amusement": "happy", "approval": "happy", "caring": "happy", "curiosity": "general_help",
    "gratitude": "happy", "joy": "happy", "love": "happy", "optimism": "happy", "pride": "happy", "excitement": "happy",
    "anger": "angry", "annoyance": "angry", "disapproval": "angry", "disgust": "disgust", 
    "confusion": "general_help", "realization": "general_help",
    "desire": "need_motivation", "nervousness": "panic_attack",
    "disappointment": "feeling_down", "embarrassment": "feeling_down", "grief": "feeling_down", 
    "remorse": "feeling_down", "sadness": "feeling_down", 
    "surprise": "surprise", "fear": "fear", "neutral": "neutral"
}

# ------------ SUICIDE PHRASE DETECTION ------------ #

suicide_keywords = [
    "kill myself", "want to die", "end it all", "suicidal", "not worth living",
    "i wanna die", "i want to die", "i'm done", "i give up", "i can't go on", "hanging myself", "hang myself"
]

# ------------ BLENDERBOT (NLG) SETUP ------------ #

blender_model_name = "facebook/blenderbot-400M-distill"
# blender_tokenizer = BlenderbotTokenizer.from_pretrained(blender_model_name)
# blender_model = BlenderbotForConditionalGeneration.from_pretrained(blender_model_name)

# ------------ LAZY LOADING FOR NLP MODELS ------------ #
_emotion_tokenizer_cache = None
_emotion_model_cache = None
_blender_tokenizer_cache = None
_blender_model_cache = None

_goemotions_tokenizer = None
_goemotions_model = None
_goemotions_lock = threading.Lock()

def load_emotion_tokenizer():
    global _emotion_tokenizer_cache
    if _emotion_tokenizer_cache is None:
        _emotion_tokenizer_cache = AutoTokenizer.from_pretrained(emotion_model_name)
    return _emotion_tokenizer_cache

def load_emotion_model():
    global _emotion_model_cache
    if _emotion_model_cache is None:
        _emotion_model_cache = AutoModelForSequenceClassification.from_pretrained(emotion_model_name)
    return _emotion_model_cache

def load_blender_tokenizer():
    global _blender_tokenizer_cache
    if _blender_tokenizer_cache is None:
        _blender_tokenizer_cache = BlenderbotTokenizer.from_pretrained(blender_model_name)
    return _blender_tokenizer_cache

def load_blender_model():
    global _blender_model_cache
    if _blender_model_cache is None:
        _blender_model_cache = BlenderbotForConditionalGeneration.from_pretrained(blender_model_name)
    return _blender_model_cache

def get_goemotions():
    global _goemotions_tokenizer, _goemotions_model
    if _goemotions_tokenizer is None or _goemotions_model is None:
        print("[INFO] Loading GoEmotions model in optimized precision...")
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _goemotions_tokenizer = AutoTokenizer.from_pretrained(emotion_model_name)
        _goemotions_model = AutoModelForSequenceClassification.from_pretrained(
            emotion_model_name,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        _goemotions_model.to(device)
    return _goemotions_tokenizer, _goemotions_model

def clear_goemotions():
    """
    Frees GoEmotions tokenizer and clears memory.
    """
    global _goemotions_tokenizer, _goemotions_model
    with _goemotions_lock:
        _goemotions_tokenizer = None
        _goemotions_model = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

def get_goemotions():
    """Load GoEmotions tokenizer (cached) and model (per-call, low memory)."""
    global _goemotions_tokenizer
    if _goemotions_tokenizer is None:
        _goemotions_tokenizer = AutoTokenizer.from_pretrained(emotion_model_name)
    try:
        model = AutoModelForSequenceClassification.from_pretrained(
            emotion_model_name, low_cpu_mem_usage=True, torch_dtype=torch.float16
        ).to('cpu')
    except RuntimeError as e:
        print(f"[ERROR] GoEmotions model OOM: {e}. Trying fallback...")
        fallback_model = "distilbert-base-uncased"
        _goemotions_tokenizer = AutoTokenizer.from_pretrained(fallback_model)
        model = AutoModelForSequenceClassification.from_pretrained(
            fallback_model, low_cpu_mem_usage=True
        ).to('cpu')
    return _goemotions_tokenizer, model

# ------------ EMOTION INTENT FUNCTION ------------ #

def get_intent(text):
    emotion_tokenizer, emotion_model = get_goemotions()
    
    # Don't move 8-bit quantized models - they're already on the correct device
    inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    
    # Check if model is quantized and handle device placement accordingly
    try:
        # For quantized models, inputs should match model device
        if hasattr(emotion_model, 'device'):
            inputs = inputs.to(emotion_model.device)
        else:
            # Fallback for regular models
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            inputs = inputs.to(device)
            if not hasattr(emotion_model, 'hf_quantizer'):  # Only move non-quantized models
                emotion_model = emotion_model.to(device)
    except Exception as e:
        print(f"[WARNING] Device placement failed: {e}")
        # Keep inputs on CPU if device placement fails
        pass
    
    with torch.inference_mode():
        outputs = emotion_model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)
        pred = torch.argmax(probs, dim=1).item()
        emotion_label = emotion_model.config.id2label[pred]
    
    # Aggressive cleanup
    del inputs, outputs, probs
    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    intent = emotion_to_intent.get(emotion_label, "neutral")
    print(f"[DEBUG] Detected emotion: '{emotion_label}'")
    print(f"[Intent detected: {intent}]")
    return intent

# ------------ GENERATE RESPONSE (EMPATHETIC) ------------ #

def generate_response(user_input, intent, history):
    try:
        system_prompt = (
            "You are a compassionate and emotionally intelligent friend. "
            "You remember past messages and respond supportively and naturally. "
            "You never repeat yourself or introduce yourself again.\n\n"
        )
        # Keep the last 3 user-bot exchanges (truncate safely)
        dialogue = "\n".join(history[-6:])
        full_prompt = f"{system_prompt}{dialogue}\nUser: {user_input}\nBot:"
        
        blender_tokenizer = load_blender_tokenizer()
        blender_model = load_blender_model()
        
        # Handle device placement carefully
        inputs = blender_tokenizer([full_prompt], return_tensors="pt", truncation=True)
        
        # Generate response with proper error handling
        reply_ids = blender_model.generate(
            **inputs,
            max_length=180,
            pad_token_id=blender_tokenizer.eos_token_id,
            do_sample=True,
            top_k=50,
            top_p=0.92,
            temperature=0.8
        )
        response = blender_tokenizer.decode(reply_ids[0], skip_special_tokens=True).strip()
        
        # Clean up the response (remove the prompt part)
        if "Bot:" in response:
            response = response.split("Bot:")[-1].strip()
        if "User:" in response:
            response = response.split("User:")[0].strip()
            
        return response if response else "I understand. How are you feeling right now?"
        
    except Exception as e:
        print(f"[ERROR] BlenderBot generation failed: {e}")
        # Return intent-based response as fallback
        intent_responses = {
            'sadness': "I'm sorry you're feeling down. Would you like to talk about what's bothering you?",
            'anger': "It sounds like you're feeling frustrated. That's completely understandable. What's been causing these feelings?",
            'joy': "I'm glad to hear you're feeling good! What's been bringing you happiness lately?",
            'neutral': "Thank you for sharing that with me. How are you feeling today?",
            'happy': "I'm happy to hear that! What's been going well for you?",
            'fear': "I understand you might be feeling anxious. It's okay to feel scared sometimes. What's worrying you?",
            'surprise': "That sounds unexpected! How are you processing this?"
        }
        return intent_responses.get(intent, "I'm here to listen and support you. How can I help?")

# ------------ SOFT VOTING FOR EMOTION DETECTION ------------ #

def soft_voting_emotion(models, image_tensor, class_names):
    """
    Args:
        models: List or tuple of 2 PyTorch models (should output logits or probabilities).
        image_tensor: Input image tensor (batched or single image).
        class_names: List of class names (index to label).
    Returns:
        Predicted emotion class (str) or error message (str).
    """
    import torch
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if isinstance(image_tensor, torch.Tensor):
        if image_tensor.dim() == 3:
            image_tensor = image_tensor.unsqueeze(0)
        image_tensor = image_tensor.float().to(device)
    probs_list = []
    for model in models:
        try:
            model.eval()
            with torch.no_grad():
                output = model(image_tensor)
                if hasattr(output, 'logits'):
                    logits = output.logits
                else:
                    logits = output
                probs = torch.softmax(logits, dim=1)
                probs_list.append(probs)
        except Exception as e:
            print(f"[ERROR] CNN model failed: {e}")
            continue
    if len(probs_list) == 0:
        return 'Emotion detection system is down right now.'
    avg_probs = torch.stack(probs_list).mean(dim=0)
    pred_idx = torch.argmax(avg_probs, dim=1).item()
    return class_names[pred_idx]

def cnn_emotion_predictor(primary_model, secondary_model, image_tensor, class_names, primary_name="CNN_1", secondary_name="CNN_2"):
    """
    Tries to use the primary CNN for emotion prediction. If it fails, uses the secondary.
    Args:
        primary_model: Best-performing CNN model (PyTorch model).
        secondary_model: Backup CNN model (PyTorch model).
        image_tensor: Input image tensor.
        class_names: List of class names.
        primary_name: Name for logging primary model.
        secondary_name: Name for logging secondary model.
    Returns:
        Predicted emotion class (str) or error message (str).
    """
    import torch
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if isinstance(image_tensor, torch.Tensor):
        if image_tensor.dim() == 3:
            image_tensor = image_tensor.unsqueeze(0)
        image_tensor = image_tensor.float().to(device)
    try:
        primary_model.eval()
        with torch.no_grad():
            output = primary_model(image_tensor)
            if hasattr(output, 'logits'):
                logits = output.logits
            else:
                logits = output
            probs = torch.softmax(logits, dim=1)
            pred_idx = torch.argmax(probs, dim=1).item()
            print(f"[INFO] Used {primary_name} for prediction.")
            return class_names[pred_idx]
    except Exception as e:
        print(f"[ERROR] {primary_name} failed: {e}. Trying {secondary_name}...")
        try:
            secondary_model.eval()
            with torch.no_grad():
                output = secondary_model(image_tensor)
                if hasattr(output, 'logits'):
                    logits = output.logits
                else:
                    logits = output
                probs = torch.softmax(logits, dim=1)
                pred_idx = torch.argmax(probs, dim=1).item()
                print(f"[INFO] Used {secondary_name} for prediction.")
                return class_names[pred_idx]
        except Exception as e2:
            print(f"[ERROR] Both CNNs failed: {e2}")
            return 'Emotion detection system is down right now.'

SWEAR_PATTERNS = [
    # Strong English
    r"\bf\W*c\W*k\b", r"\bf\W*u\W*c\W*k\W*i\W*n\W*g\b", r"\bf\W*u\W*c\W*k\W*e\W*r\b",
    r"\bf\W*u\W*c\W*k\W*e\W*d\b", r"\bb\W*i\W*t\W*c\W*h\b", r"\bb\W*a\W*s\W*t\W*a\W*r\W*d\b",
    r"\ba\W*s\W*s\W*h\W*o\W*l\W*e\b", r"\bd\W*i\W*c\W*k\b", r"\bd\W*i\W*c\W*k\W*h\W*e\W*a\W*d\b",
    r"\bc\W*u\W*n\W*t\b", r"\bp\W*r\W*i\W*c\W*k\b", r"\bs\W*l\W*u\W*t\b", r"\bw\W*h\W*o\W*r\W*e\b",
    r"\bm\W*o\W*t\W*h\W*e\W*r\W*f\W*u\W*c\W*k\W*e\W*r\b", r"\bc\W*o\W*c\W*k\b",
    r"\bc\W*o\W*c\W*k\W*h\W*e\W*a\W*d\b", r"\bt\W*w\W*a\W*t\b", r"\bw\W*a\W*n\W*k\W*e\W*r\b",
    r"\bn\W*i\W*g\W*g\W*e\W*r\b", r"\bn\W*i\W*g\W*g\W*a\b", r"\bj\W*a\W*c\W*k\W*a\W*s\W*s\b",
    r"\bp\W*u\W*s\W*s\W*y\b", r"\bt\W*o\W*s\W*s\W*e\W*r\b",
    # Hindi / Indian
    r"\bc\W*h\W*u\W*t\W*i\W*y\W*a\b", r"\bc\W*h\W*u\W*t\W*i\W*y\W*e\b",
    r"\bb\W*h\W*e\W*n\W*c\W*h\W*o\W*d\b", r"\bm\W*a\W*d\W*a\W*r\W*c\W*h\W*o\W*d\b",
    r"\bb\W*h\W*o\W*s\W*d\W*i\W*k\W*e\b", r"\br\W*a\W*n\W*d\W*i\b", r"\bh\W*a\W*r\W*a\W*m\W*i\b",
    r"\bg\W*a\W*n\W*d\W*u\b", r"\bt\W*e\W*r\W*i\W*\s*m\W*a\W*a\W*k\W*i\b",
    r"\bl\W*a\W*u\W*d\W*a\b", r"\bl\W*a\W*n\W*d\b", r"\bp\W*i\W*l\W*l\W*u\b",
    r"\bk\W*u\W*t\W*t\W*i\b", r"\bk\W*u\W*t\W*t\W*e\b", r"\bs\W*u\W*a\W*r\b",
    r"\bu\W*l\W*l\W*u\b", r"\bu\W*l\W*l\W*u\W*\s*k\W*a\W*\s*p\W*a\W*t\W*t\W*h\W*a\b",
    r"\bc\W*h\W*u\W*s\W*i\W*y\W*a\b", r"\bb\W*a\W*l\W*a\W*t\W*k\W*a\W*r\b",
    r"\bc\W*h\W*i\W*n\W*i\W*y\W*a\b", r"\bp\W*h\W*a\W*d\W*i\b",
    r"\bt\W*a\W*t\W*t\W*i\b", r"\bk\W*h\W*a\W*n\W*a\b", r"\bg\W*h\W*a\W*n\W*d\W*u\b",
    r"\bm\W*a\W*i\W*k\W*a\W*\b",
    # Explicit Phrases
    r"\bm\W*a\W*a\W*\s*k\W*i\W*\s*c\W*h\W*u\W*t\b",
    r"\bb\W*h\W*e\W*n\W*\s*k\W*i\W*\s*c\W*h\W*u\W*t\b",
    r"\bb\W*h\W*e\W*n\W*\s*k\W*e\W*\s*l\W*a\W*u\W*d\W*e\b",
    r"\bm\W*a\W*d\W*a\W*r\W*\s*c\W*h\W*o\W*d\b",
    r"\bb\W*h\W*e\W*n\W*\s*k\W*e\W*\s*t\W*a\W*t\W*t\W*e\b",
    r"\bt\W*e\W*r\W*i\W*\s*m\W*a\W*a\W*k\W*i\b",
    r"\bb\W*h\W*e\W*n\W*\s*k\W*e\W*\s*b\W*h\W*o\W*s\W*d\W*e\b"
]

class SwearFilter:
    def __init__(self, max_warnings=18, support_email="support@yourdomain.com"):
        self.warning_count = 0
        self.max_warnings = max_warnings
        self.banned = False
        self.support_email = support_email

    def check(self, message):
        if self.banned:
            return f"You are banned for repeated use of inappropriate language. Please contact support at {self.support_email}."
        for pattern in SWEAR_PATTERNS:
            try:
                if re.search(pattern, message, re.IGNORECASE):
                    self.warning_count += 1
                    if self.warning_count >= self.max_warnings:
                        self.banned = True
                        return f"You have been banned for repeated swearing. Please contact support at {self.support_email}."
                    return f"Please avoid using inappropriate language. Warning {self.warning_count}/{self.max_warnings}."
            except re.error as e:
                print(f"[WARN] Invalid regex: {pattern} ({e})")
        return None

class SimpleLogger:
    def __init__(self, log_to_firebase=False, firebase_db=None, firebase_path="/logs/errors", log_file="error_log.txt"):
        self.log_to_firebase = log_to_firebase
        self.firebase_db = firebase_db
        self.firebase_path = firebase_path
        self.log_file = log_file

    def log(self, error_type, message, extra_info=None):
        timestamp = datetime.datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": error_type,
            "message": message,
            "extra": extra_info or {}
        }
        # Log to file
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(str(log_entry) + "\n")
        except Exception as e:
            print(f"[Logger] Failed to write to file: {e}")
        # Log to Firebase if enabled
        if self.log_to_firebase and self.firebase_db:
            try:
                ref = self.firebase_db.reference(self.firebase_path)
                ref.push(log_entry)
            except Exception as e:
                print(f"[Logger] Failed to log to Firebase: {e}")

# ------------ MAIN LOOP ------------ #

def mental_health_bot():
    print("🧠 Empathetic BlenderBot Mental Health Chatbot\nType 'exit' to quit.\n")
    history = []
    swear_filter = SwearFilter()

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ["exit", "quit"]:
            print("Bot: Take care of yourself. You're not alone")
            break

        # Check for swearing
        swear_warning = swear_filter.check(user_input)
        if swear_warning:
            print("Bot:", swear_warning)
            continue

        # Check for critical phrases
        if any(kw in user_input.lower() for kw in suicide_keywords):
            response = (
                "I'm really sorry you're feeling this way. You're not alone.\n"
                "Please talk to someone you trust or call a helpline.\n"
                "India Helplines: iCall (9152987821), AASRA (91-22-27546669)"
            )
        else:
            intent = get_intent(user_input)
            response = generate_response(user_input, intent, history)

        # Update history
        history.append(f"User: {user_input}")
        history.append(f"Bot: {response}")
        print("Bot:", response)

# ------------ TEST CASES ------------ #

def test_cnn_and_nlp():
    print("\n--- Running CNN and NLP Filter Tests ---\n")
    # Dummy CNN models
    class DummyCNN:
        def __init__(self, out_class):
            self.out_class = out_class
            self.eval_called = False
        def eval(self):
            self.eval_called = True
        def __call__(self, x):
            # Simulate logits for 3 classes
            import torch
            if self.out_class == 0:
                return torch.tensor([[10.0, 1.0, 0.5]])
            elif self.out_class == 1:
                return torch.tensor([[0.5, 10.0, 1.0]])
            else:
                return torch.tensor([[1.0, 0.5, 10.0]])

    class_names = ["happy", "sad", "angry"]
    image_tensor = torch.zeros((1, 3, 224, 224))  # Dummy image

    # Test soft voting (both models predict different classes)
    cnn1 = DummyCNN(0)
    cnn2 = DummyCNN(1)
    result = soft_voting_emotion([cnn1, cnn2], image_tensor, class_names)
    print(f"Soft voting result (cnn1=happy, cnn2=sad): {result}")

    # Test fallback (cnn1 fails, cnn2 works)
    class FailingCNN:
        def eval(self): pass
        def __call__(self, x): raise Exception("Model error")
    cnn1_fail = FailingCNN()
    cnn2 = DummyCNN(2)
    result = soft_voting_emotion([cnn1_fail, cnn2], image_tensor, class_names)
    print(f"Soft voting with fallback (cnn1 fails, cnn2=angry): {result}")

    # Test both fail
    cnn1_fail = FailingCNN()
    cnn2_fail = FailingCNN()
    result = soft_voting_emotion([cnn1_fail, cnn2_fail], image_tensor, class_names)
    print(f"Soft voting with both failing: {result}")

    # Test SwearFilter
    swear_filter = SwearFilter(max_warnings=3)
    texts = [
        "You are awesome!",
        "What the f*** is this?",
        "bhench0d!",
        "Another f u c k",
        "Clean again"
    ]
    for i, text in enumerate(texts):
        msg = swear_filter.check(text)
        print(f"Input {i+1}: '{text}' => {msg if msg else 'No warning'}")
    # Test ban
    msg = swear_filter.check("f u c k")
    print(f"Ban test: {msg}")

if __name__ == "__main__":
    mental_health_bot()
