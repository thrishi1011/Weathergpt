"""
IMD API Client — HTTP interface to official India Meteorological Department endpoints.

This module provides a clean Python interface for fetching weather data from
IMD's official public APIs. It does NOT hardcode location or district IDs;
callers must supply verified identifiers.

Endpoints used (from official IMD API documentation):
  - Current weather:      https://mausam.imd.gov.in/api/current_wx_api.php
  - City 7-day forecast:  https://city.imd.gov.in/api/cityweather.php
  - District warnings:    https://mausam.imd.gov.in/api/warnings_district_api.php
  - District rainfall:    https://mausam.imd.gov.in/api/districtwise_rainfall_api.php
"""

import json
import logging
from typing import Any, Dict, List, Optional

import requests

from .exceptions import (
    IMDConnectionError,
    IMDHTTPError,
    IMDParseError,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------
DEFAULT_TIMEOUT = 15  # seconds
DEFAULT_RETRIES = 1   # one retry on transient failure

# Base URLs from official IMD API documentation
_BASE_MAUSAM = "https://mausam.imd.gov.in/api"
_BASE_CITY = "https://city.imd.gov.in/api"

ENDPOINTS = {
    "current_weather": f"{_BASE_MAUSAM}/current_wx_api.php",
    "city_forecast": f"{_BASE_CITY}/cityweather.php",
    "district_warnings": f"{_BASE_MAUSAM}/warnings_district_api.php",
    "district_rainfall": f"{_BASE_MAUSAM}/districtwise_rainfall_api.php",
}


class IMDClient:
    """
    HTTP client for IMD's official weather APIs.

    Usage:
        client = IMDClient()
        data = client.get_current_weather(station_id="42182")

    All methods return parsed JSON (dict or list). On failure they raise
    one of the exceptions defined in data.exceptions rather than letting
    raw requests errors propagate.
    """

    def __init__(
        self,
        timeout: int = DEFAULT_TIMEOUT,
        retries: int = DEFAULT_RETRIES,
    ):
        self.timeout = timeout
        self.retries = retries
        self._session = requests.Session()
        self._session.headers.update({
            "User-Agent": "WeatherGPT/0.1 (research project)",
            "Accept": "application/json",
        })

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get(self, url: str, params: Optional[Dict[str, str]] = None) -> Any:
        """
        Perform a GET request with timeout, retry, and error handling.

        Returns parsed JSON on success.
        Raises IMDConnectionError, IMDHTTPError, or IMDParseError on failure.
        """
        last_exc: Optional[Exception] = None

        for attempt in range(1, self.retries + 2):  # retries + 1 initial
            try:
                logger.debug(
                    "IMD request [attempt %d]: GET %s params=%s",
                    attempt, url, params,
                )
                resp = self._session.get(
                    url, params=params, timeout=self.timeout,
                )
            except requests.exceptions.Timeout as exc:
                last_exc = exc
                logger.warning("IMD request timed out (attempt %d): %s", attempt, exc)
                continue
            except requests.exceptions.ConnectionError as exc:
                last_exc = exc
                logger.warning("IMD connection error (attempt %d): %s", attempt, exc)
                continue
            except requests.exceptions.RequestException as exc:
                raise IMDConnectionError(
                    f"Unexpected request error: {exc}"
                ) from exc

            # We got a response — check status
            if resp.status_code != 200:
                raise IMDHTTPError(
                    status_code=resp.status_code,
                    message=resp.text[:200],
                )

            # Parse JSON
            try:
                return resp.json()
            except (json.JSONDecodeError, ValueError) as exc:
                raise IMDParseError(
                    f"Could not parse IMD response as JSON: {exc}"
                ) from exc

        # All retries exhausted
        raise IMDConnectionError(
            f"IMD request failed after {self.retries + 1} attempts: {last_exc}"
        )

    # ------------------------------------------------------------------
    # Public API methods
    # ------------------------------------------------------------------

    def get_current_weather(self, station_id: str) -> Dict[str, Any]:
        """
        Fetch current weather observations for a single IMD station.

        Args:
            station_id: IMD station identifier (e.g. "42182").
                        Do NOT guess IDs — use a verified mapping.

        Returns:
            Parsed JSON dict with current weather fields.
        """
        return self._get(
            ENDPOINTS["current_weather"],
            params={"id": station_id},
        )

    def get_city_forecast(self, city_id: str) -> Dict[str, Any]:
        """
        Fetch 7-day weather forecast for a city.

        Args:
            city_id: IMD city identifier (e.g. "42182").
                     Do NOT guess IDs — use a verified mapping.

        Returns:
            Parsed JSON dict/list with 7-day forecast data.
        """
        return self._get(
            ENDPOINTS["city_forecast"],
            params={"id": city_id},
        )

    def get_district_warnings(self, state_id: str) -> List[Dict[str, Any]]:
        """
        Fetch district-wise weather warnings for a state.

        Args:
            state_id: IMD state identifier (e.g. "1" for a particular state).
                      Do NOT hardcode — use a verified mapping.

        Returns:
            Parsed JSON list of district warning objects.
        """
        return self._get(
            ENDPOINTS["district_warnings"],
            params={"id": state_id},
        )

    def get_district_rainfall(self) -> List[Dict[str, Any]]:
        """
        Fetch district-wise rainfall data (all districts).

        This endpoint returns rainfall data for all districts across India.
        Filter the result by district/state name in the normalizer.

        Returns:
            Parsed JSON list of district rainfall objects.
        """
        return self._get(ENDPOINTS["district_rainfall"])

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self):
        """Close the underlying HTTP session."""
        self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
