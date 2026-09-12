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
    """Load .env from voice/.env, root .env, and backend/.env if not already set."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(current_dir)
    env_files = [
        os.path.join(repo_root, "voice", ".env"),
        os.path.join(repo_root, ".env"),
        os.path.join(repo_root, "backend", ".env")
    ]
    for env_file in env_files:
        if os.path.exists(env_file):
            try:
                from dotenv import load_dotenv
                load_dotenv(env_file, override=False)
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
                    logger.debug(f"Could not read env file {env_file}: {e}")

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
    def __init__(self, api_key: str, model_name: str = "gemini-3.6-flash"):
        self.api_key = api_key
        active_models = [
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.6-flash",
        ]
        if model_name and model_name not in active_models:
            active_models.insert(0, model_name)
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

def detect_language_with_gemini(text: str) -> Optional[Dict[str, str]]:
    """
    Use Gemini API to detect the language and script of user input.
    Handles native Indic scripts as well as Romanized/phonetic transliterations
    (e.g., 'eroju varsham paduthunda' -> 'te', 'aaj mausam kaisa hai' -> 'hi').
    """
    if not text or not text.strip():
        return None

    provider = get_provider()
    if not isinstance(provider, GeminiProvider):
        return None

    prompt = f"""Identify the primary language and script of the following text: "{text.strip()}"

The text may be:
1. Written in native Indic script (Telugu: తెలుగు, Hindi: हिन्दी, Tamil: தமிழ், Kannada: ಕನ್ನಡ, etc.)
2. Written phonetically in English/Latin letters (e.g. "eroju varsham paduthunda" -> Telugu 'te', "aaj mausam kaisa rahega" -> Hindi 'hi', "mazhai varuma" -> Tamil 'ta')
3. Written in plain English ("will it rain today" -> English 'en')

Return a strictly valid JSON object with:
{{
  "language": "2-letter ISO code: te, hi, en, ta, kn, ml, bn, mr, gu, pa, or, ur",
  "language_name": "Full English name of language",
  "confidence": 0.95
}}
"""
    try:
        raw = provider.generate(
            system_prompt="You are a linguistic language and transliteration identification engine. Return valid JSON only.",
            user_prompt=prompt
        )
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(cleaned)
        if "language" in data:
            lang = data["language"].lower().strip()
            if lang in {"te", "hi", "en", "ta", "kn", "ml", "bn", "mr", "gu", "pa", "or", "ur", "as", "ks"}:
                return data
    except Exception as e:
        logger.warning(f"Gemini language detection failed: {e}")

    return None

# ISO 639-1 to BCP-47 locale and canonical codes
LANGUAGE_MAP = {
    "te": {"code": "te", "bcp47": "te-IN", "name": "Telugu"},
    "hi": {"code": "hi", "bcp47": "hi-IN", "name": "Hindi"},
    "en": {"code": "en", "bcp47": "en-IN", "name": "English"},
    "ta": {"code": "ta", "bcp47": "ta-IN", "name": "Tamil"},
    "kn": {"code": "kn", "bcp47": "kn-IN", "name": "Kannada"},
    "ml": {"code": "ml", "bcp47": "ml-IN", "name": "Malayalam"},
    "bn": {"code": "bn", "bcp47": "bn-IN", "name": "Bengali"},
    "mr": {"code": "mr", "bcp47": "mr-IN", "name": "Marathi"},
    "gu": {"code": "gu", "bcp47": "gu-IN", "name": "Gujarati"},
    "pa": {"code": "pa", "bcp47": "pa-IN", "name": "Punjabi"},
    "or": {"code": "or", "bcp47": "or-IN", "name": "Odia"},
    "ur": {"code": "ur", "bcp47": "ur-PK", "name": "Urdu"},
    "as": {"code": "as", "bcp47": "as-IN", "name": "Assamese"},
    "ks": {"code": "ks", "bcp47": "ks-IN", "name": "Kashmiri"}
}

def normalize_voice_language(lang_str: Optional[str]) -> Dict[str, str]:
    if not lang_str:
        return LANGUAGE_MAP["en"]
    clean = lang_str.lower().strip().replace("_", "-")
    prefix = clean.split("-")[0]
    if prefix in LANGUAGE_MAP:
        return LANGUAGE_MAP[prefix]
    # Name matching
    for code, info in LANGUAGE_MAP.items():
        if info["name"].lower() in clean or clean in info["name"].lower():
            return info
    return LANGUAGE_MAP["en"]

def transcribe_audio_with_gemini(audio_base64: str, mime_type: str = "audio/webm") -> Optional[Dict[str, Any]]:
    """
    Transcribe speech from base64-encoded audio using Gemini API.
    Listens to audio, identifies spoken language, and transcribes accurately in native script.
    Supports Telugu, Hindi, English, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, and all configured languages.
    """
    load_dotenv_if_present()
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        logger.error("No Gemini API key available for audio transcription")
        return None

    # Clean mime type (e.g. audio/webm;codecs=opus -> audio/webm)
    clean_mime = mime_type.split(";")[0].strip() if mime_type else "audio/webm"

    # Supported flash models with audio input capability
    models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.6-flash"]
    prompt = """Listen to the supplied audio, identify the language being spoken, and transcribe the speech accurately in the native script of that language. Do not transliterate Indian or other non-Latin languages into English/Latin characters. Return both the detected language code and the transcription.

Transcription Rules:
1. Native Script is Mandatory:
   - Telugu: Transcribe in Telugu script (e.g., 'ఈరోజు వర్షం పడుతుందా?'), NOT Latin transliteration like 'eroju varsham padutunda'.
   - Hindi: Transcribe in Devanagari script (e.g., 'क्या आज बारिश होगी?'), NOT Latin transliteration like 'kya aaj baarish hogi'.
   - English: Transcribe in English Latin script (e.g., 'Will it rain today?').
   - Tamil: Transcribe in Tamil script (e.g., 'இன்று மழை பெய்யுமா?').
   - Kannada: Transcribe in Kannada script (e.g., 'ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?').
   - Malayalam: Transcribe in Malayalam script (e.g., 'ഇന്ന് മഴ പെയ്യുമോ?').
   - Bengali: Transcribe in Bengali script (e.g., 'আজ কি বৃষ্টি হবে?').
   - Marathi: Transcribe in Marathi Devanagari script (e.g., 'आज पाऊस पडेल का?').
   - Gujarati: Transcribe in Gujarati script (e.g., 'શું આજે વરસાદ પડશે?').
   - Punjabi: Transcribe in Gurmukhi script (e.g., 'ਕੀ ਅੱਜ ਮੀਂਹ ਪਵੇਗਾ?').
   - Odia: Transcribe in Odia script (e.g., 'ଆଜି ବର୍ଷା ହେବ କି?').
   - Urdu: Transcribe in Urdu script (e.g., 'کیا آج بارش ہوگی؟').
2. Preserve the speaker's exact spoken words and meaning faithfully.
3. Do NOT translate into English unless the speech was already in English.
4. If no speech is detected or audio is pure silence/noise, set transcript to empty string "".

Respond ONLY with valid JSON in this exact structure:
{
  "text": "<transcribed text in native script>",
  "transcript": "<transcribed text in native script>",
  "language": "<language code: te | hi | en | ta | kn | ml | bn | mr | gu | pa | or | ur>",
  "language_name": "<language name in English: Telugu | Hindi | English | Tamil | Kannada | Malayalam | Bengali | Marathi | Gujarati>",
  "confidence": 0.95
}"""

    payload = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": clean_mime, "data": audio_base64}},
                {"text": prompt}
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    last_err = None
    for m in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=22) as r:
                res = json.loads(r.read().decode("utf-8"))
                text_part = res["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text_part.startswith("```"):
                    text_part = text_part.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                data = json.loads(text_part)

                transcript_val = (data.get("text") or data.get("transcript") or "").strip()
                raw_lang = data.get("language") or data.get("language_name") or "en"
                lang_info = normalize_voice_language(raw_lang)

                return {
                    "text": transcript_val,
                    "transcript": transcript_val,
                    "language": lang_info["code"],
                    "language_code": lang_info["code"],
                    "language_name": lang_info["name"],
                    "bcp47": lang_info["bcp47"],
                    "confidence": data.get("confidence", 0.95),
                    "model": m
                }
        except Exception as e:
            last_err = e
            logger.warning(f"Gemini audio transcription error on model {m}: {e}")
            continue

    logger.error(f"All Gemini audio models failed: {last_err}")
    return None


