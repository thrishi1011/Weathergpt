# IMD Data Layer

This module provides WeatherGPT with weather information from official
India Meteorological Department (IMD) APIs.

## Current APIs

The initial implementation uses:

1. Current Weather
2. City 7-day Forecast
3. District-wise Warnings
4. District-wise Rainfall

Official IMD API documentation:

https://mausam.imd.gov.in/imd_latest/contents/api.pdf

Official IMD API portal:

https://mausam.imd.gov.in/responsive/apis.php

## Files

- `imd_client.py` — HTTP client for IMD APIs.
- `exceptions.py` — IMD-specific exceptions.
- `normalizer.py` — Converts IMD responses into the WeatherGPT weather format.
- `__init__.py` — Python package marker.

## Location IDs

Location and district identifiers must come from a verified IMD source.

Do not assume that an example ID from the IMD documentation represents
Warangal, Hanamkonda, Hyderabad, or another Telangana location.

## Error handling

The client raises custom exceptions for:

- network/connection failures
- HTTP errors
- invalid JSON
- unexpected IMD data

The backend should handle these failures gracefully.

## API access

No API keys or credentials should be committed to Git.

If an IMD endpoint requires authentication, IP whitelisting, or another
access mechanism, that requirement must be configured separately.

## Attribution

WeatherGPT uses data provided by the India Meteorological Department.
Proper attribution should be retained in the application.

## Caching

The application should use appropriate client-side/server-side caching
where practical to avoid unnecessary repeated requests to IMD services.