"""
LLM Provider Integration & Generation Engine for WeatherGPT.
Supports Google Gemini, OpenAI, and Mock/Offline providers with zero hardcoded credentials.
"""
import os
import json
import urllib.request
import urllib.error
from typing import Any, Dict, Optional
from .prompts import get_system_prompt
from .validation.fallbacks import generate_fallback_response

class LLMProvider:
    """Base class for LLM providers."""
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError

class MockProvider(LLMProvider):
    """
    Offline/Mock LLM provider for local testing and deterministic integration testing.
    """
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            payload = json.loads(user_prompt)
        except Exception:
            payload = {}

        q = payload.get("question", "").lower()
        lang = payload.get("language", "en")
        loc = payload.get("location") or "the requested location"
        w = payload.get("weather_data", {})
        
        # Use our grounded fallback template generator for consistent mock responses
        fb = generate_fallback_response(w, q, lang, loc)
        
        return json.dumps({
            "answer": fb["answer"],
            "language": lang,
            "confidence": fb["confidence"],
            "sources": fb["sources"],
            "safety_flag": fb["safety_flag"]
        })

class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider via REST API using GEMINI_API_KEY."""
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]

class OpenAIProvider(LLMProvider):
    """OpenAI API provider via REST using OPENAI_API_KEY."""
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]

def get_provider() -> LLMProvider:
    """Instantiate and return the configured LLM provider based on environment variables."""
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    model_name = os.environ.get("LLM_MODEL")

    if gemini_key:
        return GeminiProvider(api_key=gemini_key, model_name=model_name or "gemini-1.5-flash")
    elif openai_key:
        return OpenAIProvider(api_key=openai_key, model_name=model_name or "gpt-4o-mini")
    else:
        return MockProvider()
