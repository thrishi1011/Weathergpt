# WeatherGPT API Contract

## GET /api/weather

Purpose:
Return weather data for a requested location.

Example request:

GET /api/weather?location=Warangal

---

## POST /api/ask

Purpose:
Accept a user's natural-language weather question and location,
then return a clear WeatherGPT answer.

Request:

{
  "question": "Should I plant tomorrow?",
  "location": "Warangal",
  "language": "en"
}

Response:

{
  "answer": "Rain is expected tomorrow, so it may be better to postpone planting.",
  "language": "en"
}

---

## Rules

1. Frontend must follow this request/response structure.
2. LLM must work with the weather data supplied by the backend.
3. Backend is responsible for connecting weather data, IMD data and LLM.
4. Other team members must not change this contract unless explicitly agreed by the Backend/Integration Lead.
