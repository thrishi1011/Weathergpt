import unittest
from llm.service import generate_weather_response, build_llm_payload
from llm.generator import MockProvider

class TestWeatherLLMService(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MockProvider()
        self.base_weather = {
            "location": "Warangal",
            "timestamp": "2026-09-11T12:00:00+05:30",
            "temperature": 34,
            "humidity": 75,
            "rain_probability": 80,
            "rainfall": 15,
            "wind_speed": 18,
            "weather_condition": "Thunderstorms",
            "imd_alert": {
                "active": False,
                "severity": "",
                "event": "",
                "message": ""
            }
        }

    def test_build_llm_payload(self):
        payload = build_llm_payload(
            question="Will it rain tomorrow?",
            weather_data=self.base_weather,
            language="hi",
            location="Warangal"
        )
        self.assertEqual(payload["question"], "Will it rain tomorrow?")
        self.assertEqual(payload["language"], "hi")
        self.assertEqual(payload["location"], "Warangal")
        self.assertEqual(payload["weather_data"]["temperature"], 34)

    def test_umbrella_question_en(self):
        res = generate_weather_response(
            question="Should I carry an umbrella?",
            weather_data=self.base_weather,
            language="en",
            provider=self.mock_provider
        )
        self.assertIn("answer", res)
        self.assertEqual(res["language"], "en")
        self.assertIn("80%", res["answer"])
        self.assertIn("34°C", res["answer"])

    def test_all_14_languages(self):
        languages = ["en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "as", "gu", "ks", "pa", "or", "ur"]
        for lang in languages:
            with self.subTest(language=lang):
                res = generate_weather_response(
                    question="Weather check",
                    weather_data=self.base_weather,
                    language=lang,
                    provider=self.mock_provider
                )
                self.assertIn("answer", res)
                self.assertEqual(res["language"], lang)
                self.assertIn("34°C", res["answer"])
                self.assertIn("80%", res["answer"])

    def test_imd_alert_response(self):
        alert_weather = dict(self.base_weather)
        alert_weather["imd_alert"] = {
            "active": True,
            "severity": "yellow",
            "event": "Heavy Rain Advisory",
            "message": "Yellow Alert for moderate to heavy rainfall."
        }
        res = generate_weather_response(
            question="Is there an alert today?",
            weather_data=alert_weather,
            language="en",
            provider=self.mock_provider
        )
        self.assertTrue(res["safety_flag"])
        self.assertIn("Yellow", res["answer"])

    def test_fallback_on_broken_provider(self):
        class BrokenProvider:
            def generate(self, system_prompt: str, user_prompt: str) -> str:
                return "This is not JSON at all."

        res = generate_weather_response(
            question="What is the weather?",
            weather_data=self.base_weather,
            language="en",
            provider=BrokenProvider()
        )
        self.assertIn("answer", res)
        self.assertEqual(res["language"], "en")
        self.assertIn("34°C", res["answer"])

if __name__ == "__main__":
    unittest.main()
