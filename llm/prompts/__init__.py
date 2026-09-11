import os
from functools import lru_cache

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_SYSTEM_PROMPT_PATH = os.path.join(_CURRENT_DIR, "system_prompt.md")

@lru_cache(maxsize=1)
def get_system_prompt() -> str:
    """Load and return the master system prompt text."""
    with open(_SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()

__all__ = ["get_system_prompt"]
