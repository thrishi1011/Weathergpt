"""
LLM Provider Integration & Generation Engine for WeatherGPT.
Supports Google Gemini, OpenAI, and Mock/Offline providers with simple language generation.
"""
import os
import json
import ssl
import time
import logging
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional
from .prompts import get_system_prompt
from .validation.fallbacks import generate_fallback_response

logger = logging.getLogger("weathergpt.llm.generator")

def get_ssl_context():
    """Create a robust SSL context that works seamlessly across platforms."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        try:
            return ssl.create_default_context()
        except Exception:
            return ssl._create_unverified_context()

class LLMProvider:
    """Base class for LLM providers."""
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError

class GeminiProvider(LLMProvider):
    """
    Google Gemini LLM provider via REST API.
    Generates friendly, simple-language responses grounded in weather data.
    """
    def __init__(self, api_key: str, model_name: Optional[str] = None):
        self.api_key = api_key
        self.model_name = model_name or os.environ.get("LLM_MODEL") or "gemini-3.5-flash"
        self.candidate_models = [self.model_name, "gemini-flash-latest", "gemini-3.6-flash", "gemini-3.7-flash"]

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        ctx = get_ssl_context()
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
                "temperature": 0.3,
                "response_mime_type": "application/json"
            }
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json"}

        last_error = None
        for model in self.candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            
            # Up to 2 retries per model for transient network/503 hiccups
            for attempt in range(2):
                try:
                    with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return text
                except Exception as e:
                    last_error = e
                    time.sleep(0.5)

        raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")

class OpenAIProvider(LLMProvider):
    """OpenAI API provider via REST using OPENAI_API_KEY."""
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        ctx = get_ssl_context()
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
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]

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
        
        fb = generate_fallback_response(w, q, lang, loc)
        
        return json.dumps({
            "answer": fb["answer"],
            "language": lang,
            "confidence": fb["confidence"],
            "sources": fb["sources"],
            "safety_flag": fb["safety_flag"]
        })

def get_provider() -> LLMProvider:
    """Instantiate and return the configured LLM provider based on environment variables."""
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    model_name = os.environ.get("LLM_MODEL")

    if gemini_key:
        return GeminiProvider(api_key=gemini_key, model_name=model_name)
    elif openai_key:
        return OpenAIProvider(api_key=openai_key, model_name=model_name or "gpt-4o-mini")
    else:
        return MockProvider()
