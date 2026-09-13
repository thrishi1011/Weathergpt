import unittest
from data.normalizer import normalize_current_weather, normalize_warning, normalize_weather

class TestDataNormalizer(unittest.TestCase):
    def setUp(self):
        self.mock_imd_response = {
            "Station": "Hanamkonda",
            "Date of Observation": "2026-09-11",
            "Time": "12:30",
            "Temperature": 29.5,
            "Humidity": 72,
            "Wind Speed": 14.0,
            "Wind Direction": 320,
            "Weather Code": 3,
            "Last 24 hrs Rainfall": 4.2,
        }

    def test_normalize_current_weather(self):
        result = normalize_current_weather(
            self.mock_imd_response,
            location="Hanamkonda",
        )
        self.assertEqual(result["location"], "Hanamkonda")
        self.assertEqual(result["temperature"], 29.5)
        self.assertEqual(result["humidity"], 72)
        self.assertEqual(result["rainfall"], 4.2)
        self.assertEqual(result["wind_speed"], 14.0)
        self.assertFalse(result["imd_alert"]["active"])

    def test_normalize_warning(self):
        warning = {
            "severity": "yellow",
            "event": "Thunderstorm",
            "message": "Thunderstorm warning in effect"
        }
        res = normalize_warning(warning, location="Warangal")
        self.assertTrue(res["imd_alert"]["active"])
        self.assertEqual(res["imd_alert"]["severity"], "yellow")
        self.assertEqual(res["imd_alert"]["event"], "Thunderstorm")

    def test_normalize_weather_combined(self):
        warning = {
            "severity": "orange",
            "event": "Heavy Rain",
            "message": "Orange alert for heavy rain"
        }
        res = normalize_weather(self.mock_imd_response, warning=warning, location="Hanamkonda")
        self.assertEqual(res["temperature"], 29.5)
        self.assertTrue(res["imd_alert"]["active"])
        self.assertEqual(res["imd_alert"]["severity"], "orange")

if __name__ == "__main__":
    unittest.main()