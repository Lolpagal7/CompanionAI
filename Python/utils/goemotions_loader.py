import gc
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

GOEMOTIONS_MODEL = "SamLowe/roberta-base-go_emotions"
_goemotions_model = None
_goemotions_tokenizer = None

def load_goemotions():
    """Load GoEmotions model and tokenizer."""
    global _goemotions_model, _goemotions_tokenizer
    if _goemotions_model is None or _goemotions_tokenizer is None:
        print("[INFO] Loading GoEmotions model with 8-bit quantization...")
        try:
            from transformers import BitsAndBytesConfig
            quant_config = BitsAndBytesConfig(load_in_8bit=True)
            _goemotions_model = AutoModelForSequenceClassification.from_pretrained(
                GOEMOTIONS_MODEL,
                quantization_config=quant_config,
                device_map="cpu"
            )
        except Exception as e:
            print(f"[WARN] Quantization fallback: {e}")
            _goemotions_model = AutoModelForSequenceClassification.from_pretrained(GOEMOTIONS_MODEL)
        _goemotions_tokenizer = AutoTokenizer.from_pretrained(GOEMOTIONS_MODEL)
    return _goemotions_tokenizer, _goemotions_model

def clear_goemotions():
    global _goemotions_model, _goemotions_tokenizer
    _goemotions_model = None
    _goemotions_tokenizer = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
