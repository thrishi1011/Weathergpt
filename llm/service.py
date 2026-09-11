"""
WeatherGPT LLM Intelligence Service.
Main entry point for converting structured weather information + user queries into safe, multilingual answers.
"""
import json
import logging
from typing import Any, Dict, List, Optional

from .prompts import get_system_prompt
from .generator import get_provider, LLMProvider
from .validation import ResponseValidator, ValidationError, generate_fallback_response

logger = logging.getLogger("weathergpt.llm")

SUPPORTED_LANGUAGES = {
    "en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "as", "gu", "ks", "pa", "or", "ur"
}

def build_llm_payload(
    question: str,
    weather_data: Dict[str, Any],
    language: str = "en",
    location: Optional[str] = None,
    conversation_context: Optional[List[Dict[str, str]]] = None,
    reference_timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Construct the normalized input payload matching schemas/input.schema.json.
    """
    normalized_lang = language.lower().strip() if language else "en"
    if normalized_lang not in SUPPORTED_LANGUAGES:
        normalized_lang = "en"

    loc = location or weather_data.get("location")

    return {
        "question": question,
        "language": normalized_lang,
        "location": loc,
        "reference_timestamp": reference_timestamp or weather_data.get("timestamp"),
        "weather_data": weather_data,
        "conversation_context": conversation_context or []
    }

def generate_weather_response(
    question: str,
    weather_data: Dict[str, Any],
    language: str = "en",
    location: Optional[str] = None,
    conversation_context: Optional[List[Dict[str, str]]] = None,
    provider: Optional[LLMProvider] = None
) -> Dict[str, Any]:
    """
    Main API for generating an LLM weather response across 14 supported languages.

    Args:
        question: Natural language question from user.
        weather_data: Structured weather data adhering to shared/weather-schema.json.
        language: Language code (en, hi, te, ta, kn, ml, bn, mr, as, gu, ks, pa, or, ur).
        location: Optional explicit location string.
        conversation_context: Optional previous chat turns.
        provider: Optional custom LLM provider override.

    Returns:
        Dictionary conforming to schemas/output.schema.json:
        {
            "answer": str,
            "language": str,
            "confidence": str,
            "sources": list[str],
            "safety_flag": bool
        }
    """
    input_payload = build_llm_payload(
        question=question,
        weather_data=weather_data,
        language=language,
        location=location,
        conversation_context=conversation_context
    )

    system_prompt = get_system_prompt()
    user_prompt = json.dumps(input_payload, ensure_ascii=False)
    active_provider = provider or get_provider()

    # Attempt 1: Standard Generation
    try:
        raw_output = active_provider.generate(system_prompt=system_prompt, user_prompt=user_prompt)
        validated = ResponseValidator.validate_and_parse(raw_output, input_payload)
        return validated
    except Exception as e:
        logger.warning(f"LLM generation attempt 1 failed: {e}. Retrying with corrective prompt...")

    # Attempt 2: Corrective Retry
    try:
        corrective_user_prompt = (
            f"Previous output failed validation. Please strictly return valid JSON grounded in the following data:\n"
            f"{user_prompt}"
        )
        raw_output_retry = active_provider.generate(system_prompt=system_prompt, user_prompt=corrective_user_prompt)
        validated = ResponseValidator.validate_and_parse(raw_output_retry, input_payload)
        return validated
    except Exception as e:
        logger.error(f"LLM generation attempt 2 failed: {e}. Activating deterministic fallback.")

    # Fallback: 100% data-grounded template
    return generate_fallback_response(
        weather_data=weather_data,
        question=question,
        language=input_payload["language"],
        location=location
    )

# Alias matching standard backend invocation conventions
ask_weather = generate_weather_response
