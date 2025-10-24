# Connect NLP and CNN logic for import
from .NLP import (
    soft_voting_emotion,
    cnn_emotion_predictor,
    SwearFilter,
    get_intent,
    generate_response,
    SimpleLogger,
    test_cnn_and_nlp,
    clear_goemotions,
    get_goemotions
)
# from ..utils.goemotions_loader import load_goemotions, clear_goemotions

__all__ = [
    "SwearFilter",
    "get_intent",
    "generate_response",
    "load_goemotions",
    "clear_goemotions",
    # ...add any other exports as needed...
]

def clear_goemotions():
    """Clear GoEmotions model and tokenizer from memory and free resources."""
    import sys
    import gc
    import torch
    from .NLP import _goemotions_lock
    # Use sys.modules to access the module-level variables
    nlp_mod = sys.modules[__name__.replace("__init__", "NLP")]
    with _goemotions_lock:
        setattr(nlp_mod, "_goemotions_model", None)
        setattr(nlp_mod, "_goemotions_tokenizer", None)
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()