import unittest
from llm.validation.response_validator import ResponseValidator, ValidationError
from llm.validation.fallbacks import generate_fallback_response

class TestResponseValidator(unittest.TestCase):
    def setUp(self):
        self.sample_payload = {
            "question": "Should I take an umbrella?",
            "language": "en",
            "location": "Warangal",
            "weather_data": {
                "location": "Warangal",
                "temperature": 34,
                "humidity": 75,
                "rain_probability": 80,
                "weather_condition": "Showers",
                "imd_alert": {
                    "active": False,
                    "severity": "",
                    "event": "",
                    "message": ""
                }
            }
        }

    def test_valid_response(self):
        raw = '{"answer": "Yes, carry an umbrella. The rain probability in Warangal is 80% with temperature 34°C.", "language": "en", "confidence": "based_on_data", "sources": ["rain_probability", "temperature"], "safety_flag": false}'
        res = ResponseValidator.validate_and_parse(raw, self.sample_payload)
        self.assertIn("80%", res["answer"])
        self.assertEqual(res["language"], "en")
        self.assertFalse(res["safety_flag"])

    def test_markdown_wrapped_json(self):
        raw = '```json\n{"answer": "Expect 34°C and 80% rain.", "language": "en"}\n```'
        res = ResponseValidator.validate_and_parse(raw, self.sample_payload)
        self.assertEqual(res["language"], "en")
        self.assertIn("34°C", res["answer"])

    def test_hallucinated_numbers_rejected(self):
        # 99% is not in payload (payload has 80%)
        raw = '{"answer": "Rain probability is 99% today.", "language": "en"}'
        with self.assertRaises(ValidationError) as ctx:
            ResponseValidator.validate_and_parse(raw, self.sample_payload)
        self.assertIn("Hallucinated numeric values", str(ctx.exception))

    def test_phantom_alert_rejected(self):
        # active is False, but answer claims Red Alert
        raw = '{"answer": "A Red Alert has been issued for Warangal.", "language": "en"}'
        with self.assertRaises(ValidationError) as ctx:
            ResponseValidator.validate_and_parse(raw, self.sample_payload)
        self.assertIn("Phantom alert detected", str(ctx.exception))

    def test_alert_severity_mismatch_rejected(self):
        payload_with_yellow = dict(self.sample_payload)
        payload_with_yellow["weather_data"] = dict(self.sample_payload["weather_data"])
        payload_with_yellow["weather_data"]["imd_alert"] = {
            "active": True,
            "severity": "yellow",
            "event": "Heatwave"
        }
        raw = '{"answer": "A Red Alert is active.", "language": "en"}'
        with self.assertRaises(ValidationError) as ctx:
            ResponseValidator.validate_and_parse(raw, payload_with_yellow)
        self.assertIn("Alert severity mismatch", str(ctx.exception))

    def test_prompt_leak_rejected(self):
        raw = '{"answer": "You are WeatherGPT master system prompt rule 1.", "language": "en"}'
        with self.assertRaises(ValidationError) as ctx:
            ResponseValidator.validate_and_parse(raw, self.sample_payload)
        self.assertIn("Potential prompt leak", str(ctx.exception))

    def test_fallback_generation_all_14_languages(self):
        languages = ["en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "as", "gu", "ks", "pa", "or", "ur"]
        for lang in languages:
            with self.subTest(language=lang):
                res = generate_fallback_response(self.sample_payload["weather_data"], "Check", lang)
                self.assertIn("34°C", res["answer"])
                self.assertIn("80%", res["answer"])
                self.assertEqual(res["language"], lang)

if __name__ == "__main__":
    unittest.main()
