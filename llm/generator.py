"""
LLM Provider Integration & Generation Engine for WeatherGPT.
Supports Google Gemini, OpenAI, and Mock/Offline providers with zero hardcoded credentials.
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import Any, Dict, Optional
from .prompts import get_system_prompt
from .validation.fallbacks import generate_fallback_response

logger = logging.getLogger("weathergpt.llm.generator")

def load_dotenv_if_present():
    """Load .env from repository root if not already loaded."""
    if not os.environ.get("GEMINI_API_KEY"):
        # Look for .env in repo root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        repo_root = os.path.dirname(current_dir)
        env_file = os.path.join(repo_root, ".env")
        if os.path.exists(env_file):
            try:
                from dotenv import load_dotenv
                load_dotenv(env_file)
            except ImportError:
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                k, v = line.split("=", 1)
                                k = k.strip()
                                v = v.strip().strip("'\"")
                                if k not in os.environ:
                                    os.environ[k] = v
                except Exception as e:
                    logger.debug(f"Could not read .env file: {e}")

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
    """Google Gemini LLM provider via REST API with multi-model failover for high reliability."""
    def __init__(self, api_key: str, model_name: str = "gemini-flash-latest"):
        self.api_key = api_key
        # Prioritize active, available Gemini models
        active_models = [
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-3-flash-preview",
            "gemini-pro-latest"
        ]
        if model_name and model_name not in active_models:
            active_models.append(model_name)
        self.model_name = active_models[0]
        self.model_pool = active_models

    def generate(self, system_prompt: str, user_prompt: str) -> str:
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

        last_error = None
        for model in self.model_pool:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                logger.warning(f"Gemini API returned HTTP {e.code} for model '{model}': {err_body[:200]}")
                last_error = e
                # If rate-limited (429), busy (503), or not found (404), try next model in pool
                if e.code in (404, 429, 503):
                    continue
                raise RuntimeError(f"Gemini API HTTP {e.code}: {err_body[:200]}")
            except Exception as e:
                logger.warning(f"Gemini generation error for model '{model}': {e}")
                last_error = e
                continue

        raise RuntimeError(f"All Gemini models in pool failed. Last error: {last_error}")

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
    load_dotenv_if_present()
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    model_name = os.environ.get("LLM_MODEL")

    if gemini_key:
        active_model = model_name or "gemini-flash-latest"
        logger.info(f"Initialized GeminiProvider with model '{active_model}'")
        return GeminiProvider(api_key=gemini_key, model_name=active_model)
    elif openai_key:
        active_model = model_name or "gpt-4o-mini"
        logger.info(f"Initialized OpenAIProvider with model '{active_model}'")
        return OpenAIProvider(api_key=openai_key, model_name=active_model)
    else:
        logger.info("Initialized MockProvider (no API key configured)")
        return MockProvider()
