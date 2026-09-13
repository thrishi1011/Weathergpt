"""
Normalization helpers for converting IMD API responses into
the WeatherGPT shared weather format.
"""

from typing import Any, Dict, Optional


def _first_value(data: Dict[str, Any], *keys: str) -> Any:
    """Return the first non-null value found for the supplied keys."""
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def normalize_current_weather(
    raw: Dict[str, Any],
    location: str = "",
) -> Dict[str, Any]:
    """
    Normalize an IMD Current Weather API response.

    IMD documents fields such as:
    Station, Date of Observation, Time, Temperature,
    Humidity, Wind Speed and Last 24 hrs Rainfall.
    """

    date = _first_value(
        raw,
        "Date of Observation",
        "date_of_observation",
    )

    time = _first_value(
        raw,
        "Time",
        "time",
    )

    timestamp = ""

    if date and time:
        timestamp = f"{date} {time}"
    elif date:
        timestamp = str(date)
    elif time:
        timestamp = str(time)

    return {
        "location": location or _first_value(
            raw,
            "Station",
            "station",
        ) or "",

        "timestamp": timestamp,

        "temperature": _first_value(
            raw,
            "Temperature",
            "temperature",
        ),

        "humidity": _first_value(
            raw,
            "Humidity",
            "humidity",
        ),

        "rain_probability": None,

        "rainfall": _first_value(
            raw,
            "Last 24 hrs Rainfall",
            "last_24_hrs_rainfall",
        ),

        "wind_speed": _first_value(
            raw,
            "Wind Speed",
            "wind_speed",
        ),

        "weather_condition": _first_value(
            raw,
            "Weather",
            "weather",
            "Weather Description",
            "weather_description",
        ) or "",

        "imd_alert": {
            "active": False,
            "severity": "",
            "event": "",
            "message": "",
        },
    }


def normalize_warning(
    raw: Dict[str, Any],
    location: str = "",
) -> Dict[str, Any]:
    """
    Normalize an IMD district warning into the WeatherGPT alert format.

    Warning field names may vary between IMD warning products, so only
    explicitly available values are mapped.
    """

    severity = _first_value(
        raw,
        "severity",
        "Severity",
        "warning",
        "Warning",
        "warning_level",
        "Warning Level",
    )

    event = _first_value(
        raw,
        "event",
        "Event",
        "event_name",
        "Event Name",
        "phenomenon",
    )

    message = _first_value(
        raw,
        "message",
        "Message",
        "warning_message",
        "Warning Message",
        "description",
        "Description",
    )

    active = bool(severity or event or message)

    return {
        "location": location,
        "imd_alert": {
            "active": active,
            "severity": severity or "",
            "event": event or "",
            "message": message or "",
        },
    }


def normalize_weather(
    current_weather: Optional[Dict[str, Any]] = None,
    warning: Optional[Dict[str, Any]] = None,
    location: str = "",
) -> Dict[str, Any]:
    """
    Build a WeatherGPT weather object from available IMD responses.

    Missing information remains null/empty rather than being invented.
    """

    result = normalize_current_weather(
        current_weather or {},
        location=location,
    )

    if warning:
        result["imd_alert"] = normalize_warning(
            warning,
            location=location,
        )["imd_alert"]

    return result