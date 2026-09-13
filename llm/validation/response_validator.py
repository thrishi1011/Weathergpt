"""
Response Validator for WeatherGPT LLM Output.
Ensures outputs are well-formed, grounded in provided weather data, and free of hallucinations or leaks.
"""
import re
import json
from typing import Any, Dict, List, Set, Tuple

class ValidationError(Exception):
    """Raised when LLM output violates schema, grounding, or safety checks."""
    pass

class ResponseValidator:
    """Deterministic validation guardrail for LLM weather responses."""

    SEVERITY_KEYWORDS = {
        "yellow": {
            "yellow", "येलो", "पीला", "पीली", "పసుపు", "மஞ்சள்", "ಹಳದಿ",
            "മഞ്ഞ", "হলুদ", "पिवळा", "হালধীয়া", "પીળો", "زرد", "ਪੀਲਾ", "ହଳଦିଆ"
        },
        "orange": {
            "orange", "ऑरेंज", "नारंगी", "నారింజ", "ஆரஞ்சு", "ಕಿತ್ತಳೆ",
            "ഓറഞ്ച്", "কমলা", "केशरी", "সুমথিৰা", "નારંગી", "نارنجی", "ਸੰਤਰੀ", "ନାରଙ୍ଗୀ"
        },
        "red": {
            "red", "रेड", "लाल", "ఎరుపు", "ఎర్ర", "சிவப்பு", "ಕೆಂಪು",
            "ചുവപ്പ്", "লাল", "ৰঙা", "લાલ", "ریڈ", "ਲਾਲ", "ଲାଲ୍"
        }
    }

    PROMPT_LEAK_PATTERNS = [
        r"non-negotiable",
        r"system prompt",
        r"weathergpt master",
        r"few-shot",
        r"you are weathergpt"
    ]

    SUPPORTED_LANGUAGES = {
        "en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "as", "gu", "ks", "pa", "or", "ur"
    }

    @classmethod
    def clean_json_text(cls, raw_text: str) -> str:
        """Strip markdown code fence blocks if present."""
        text = raw_text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        return text.strip()

    @classmethod
    def extract_numbers_from_text(cls, text: str) -> Set[float]:
        """Extract all numeric values from text (integers and floats)."""
        matches = re.findall(r"\b\d+(?:\.\d+)?\b", text)
        return {float(m) for m in matches}

    @classmethod
    def extract_numbers_from_payload(cls, payload: Dict[str, Any]) -> Set[float]:
        """Collect all numeric values from weather data, forecast, and user question."""
        numbers: Set[float] = set()

        def _traverse(obj: Any):
            if isinstance(obj, (int, float)) and not isinstance(obj, bool):
                numbers.add(float(obj))
            elif isinstance(obj, str):
                numbers.update(cls.extract_numbers_from_text(obj))
            elif isinstance(obj, dict):
                for v in obj.values():
                    _traverse(v)
            elif isinstance(obj, (list, tuple)):
                for item in obj:
                    _traverse(item)

        _traverse(payload)
        return numbers

    @classmethod
    def validate_and_parse(
        cls,
        raw_llm_output: str,
        input_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run full validation suite on LLM output against the input payload.
        Returns the parsed response dictionary if valid.
        Raises ValidationError on violation.
        """
        # 1. Parse JSON
        cleaned = cls.clean_json_text(raw_llm_output)
        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            raise ValidationError(f"Invalid JSON format: {e}")

        if not isinstance(parsed, dict):
            raise ValidationError("LLM output is not a JSON object")

        # 2. Check required fields
        if "answer" not in parsed or not isinstance(parsed["answer"], str) or not parsed["answer"].strip():
            raise ValidationError("Missing or empty 'answer' string")

        answer_text = parsed["answer"].strip()
        lang = parsed.get("language", input_payload.get("language", "en"))
        if lang not in cls.SUPPORTED_LANGUAGES:
            lang = "en"

        # 3. Check for system prompt leaks
        for pattern in cls.PROMPT_LEAK_PATTERNS:
            if re.search(pattern, answer_text, re.IGNORECASE):
                raise ValidationError(f"Potential prompt leak detected with pattern: {pattern}")

        # 4. Check IMD Alert Severities
        weather_data = input_payload.get("weather_data") or {}
        imd_alert = weather_data.get("imd_alert") or {}
        alert_active = imd_alert.get("active", False) if isinstance(imd_alert, dict) else False
        expected_severity = (imd_alert.get("severity", "") or "").lower() if isinstance(imd_alert, dict) else ""

        answer_lower = answer_text.lower()

        # Check if severity terms are mentioned
        found_severities = []
        for sev, keywords in cls.SEVERITY_KEYWORDS.items():
            for kw in keywords:
                if kw in answer_lower:
                    found_severities.append(sev)
                    break

        if not alert_active:
            # If no active alert, reject phantom severe alert claims
            if found_severities:
                raise ValidationError(f"Phantom alert detected: response claims severity {found_severities} but alert is inactive")
        else:
            # If active alert, ensure severity matches
            if found_severities and expected_severity:
                if expected_severity not in found_severities and expected_severity != "none":
                    raise ValidationError(f"Alert severity mismatch: expected '{expected_severity}', found '{found_severities}'")

        # 5. Number grounding check
        answer_numbers = cls.extract_numbers_from_text(answer_text)
        payload_numbers = cls.extract_numbers_from_payload(input_payload)

        # Allow benign conversational time/duration/counting numbers (e.g. hours, days, percentages)
        benign_numbers = {
            0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0,
            14.0, 15.0, 20.0, 24.0, 30.0, 45.0, 48.0, 50.0, 60.0, 72.0
        }

        # Include rounded variants of payload numbers (e.g. 27.8 -> 28)
        rounded_payload = {round(n) for n in payload_numbers} | {float(int(n)) for n in payload_numbers}
        all_allowed = payload_numbers | rounded_payload | benign_numbers

        # Check for any truly unaccounted numbers (not close to any allowed number within 0.6)
        unaccounted_numbers = set()
        for num in answer_numbers:
            if num not in all_allowed:
                if not any(abs(num - pn) <= 0.6 for pn in payload_numbers):
                    unaccounted_numbers.add(num)

        if unaccounted_numbers:
            raise ValidationError(
                f"Hallucinated numeric values found in answer: {unaccounted_numbers} (allowed in payload: {payload_numbers})"
            )

        # Normalize output structure
        return {
            "answer": answer_text,
            "language": lang,
            "confidence": parsed.get("confidence", "based_on_data"),
            "sources": parsed.get("sources", ["weather_data"]),
            "safety_flag": parsed.get("safety_flag", bool(alert_active))
        }
