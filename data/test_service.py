import unittest
from unittest.mock import MagicMock
from data.service import WeatherService

class TestDataWeatherService(unittest.TestCase):
    def setUp(self):
        self.mock_client = MagicMock()
        self.mock_client.get_current_weather.return_value = {
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
        self.service = WeatherService(client=self.mock_client)

    def test_get_current_weather(self):
        result = self.service.get_current_weather(
            station_id="43087",
            location="Hanamkonda"
        )
        self.assertEqual(result["location"], "Hanamkonda")
        self.assertEqual(result["temperature"], 29.5)
        self.assertEqual(result["humidity"], 72)
        self.assertEqual(result["rainfall"], 4.2)
        self.assertEqual(result["wind_speed"], 14.0)
        self.mock_client.get_current_weather.assert_called_once_with(station_id="43087")

    def test_close(self):
        self.service.close()
        self.mock_client.close.assert_called_once()

if __name__ == "__main__":
    unittest.main()