"""
Weather service layer.

Provides a simple interface for the backend to obtain
normalized weather data from IMD.
"""

from typing import Any, Dict, Optional

from .imd_client import IMDClient
from .normalizer import normalize_weather


class WeatherService:
    """High-level service for retrieving normalized IMD weather data."""

    def __init__(self, client: Optional[IMDClient] = None):
        self.client = client or IMDClient()

    def get_current_weather(
        self,
        station_id: str,
        location: str = "",
    ) -> Dict[str, Any]:
        """
        Fetch current weather from IMD and normalize it
        into the WeatherGPT shared weather schema.
        """

        raw_weather = self.client.get_current_weather(
            station_id=station_id
        )

        return normalize_weather(
            current_weather=raw_weather,
            location=location,
        )

    def close(self):
        """Close the underlying IMD HTTP session."""
        self.client.close()