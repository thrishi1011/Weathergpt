from data.normalizer import normalize_weather


mock_imd_response = {
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


result = normalize_weather(
    current_weather=mock_imd_response,
    location="Hanamkonda",
)

print(result)