import unittest
from unittest.mock import patch, MagicMock
from data.imd_client import IMDClient
from data.exceptions import IMDConnectionError, IMDHTTPError

class TestIMDClient(unittest.TestCase):
    def test_client_init_and_close(self):
        client = IMDClient()
        self.assertIsNotNone(client)
        client.close()

    @patch('requests.Session.get')
    def test_get_current_weather_mocked(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"Station": "Warangal", "Temperature": 32.0}
        mock_get.return_value = mock_response

        client = IMDClient()
        try:
            res = client.get_current_weather("43087")
            self.assertEqual(res["Station"], "Warangal")
            self.assertEqual(res["Temperature"], 32.0)
        finally:
            client.close()

if __name__ == "__main__":
    unittest.main()