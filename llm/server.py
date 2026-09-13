"""
WeatherGPT LLM HTTP Service Wrapper.
Provides a lightweight HTTP interface to the LLM service using only Python standard library.
"""
import os
import sys
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any

# Ensure UTF-8 on Windows console to prevent UnicodeEncodeError with Indic scripts
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try: sys.stderr.reconfigure(encoding='utf-8')
    except Exception: pass

from llm.service import ask_weather
from llm.generator import detect_language_with_gemini, transcribe_audio_with_gemini

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
logger = logging.getLogger("weathergpt.llm.server")

class LLMRequestHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        try:
            logger.info(f"{self.address_string()} - {format%args}")
        except Exception:
            pass

    def _send_json(self, status: int, payload: Dict[str, Any]):
        response_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_GET(self):
        if self.path in ("/", "/health"):
            self._send_json(200, {
                "status": "ok",
                "service": "WeatherGPT LLM Service"
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        if self.path in ("/transcribe", "/api/transcribe"):
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body) if body else {}
                audio_b64 = payload.get("audio", "").strip()
                mime_type = payload.get("mime_type", "audio/webm")

                if not audio_b64:
                    self._send_json(400, {"error": "Missing audio parameter"})
                    return

                logger.info(f"Received /transcribe request: {len(audio_b64)} chars base64, mime: {mime_type}")
                res = transcribe_audio_with_gemini(audio_b64, mime_type)
                logger.info(f"Gemini transcribe result: {res}")
                if not res or not (res.get("text") or res.get("transcript")):
                    logger.warning("Gemini transcription returned empty or None result")
                    self._send_json(200, {"text": "", "transcript": "", "language": "en", "language_name": "English"})
                    return

                self._send_json(200, res)
            except Exception as e:
                logger.error(f"Error transcribing audio: {e}", exc_info=True)
                self._send_json(500, {"error": "Audio transcription error", "message": str(e)})

        elif self.path in ("/detect-language", "/api/detect-language"):
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body) if body else {}
                text = payload.get("text", "").strip() or payload.get("question", "").strip()

                if not text:
                    self._send_json(400, {"error": "Missing text parameter"})
                    return

                res = detect_language_with_gemini(text)
                if not res:
                    # Heuristic fallback using script detection
                    import re
                    lang = "en"
                    if re.search(r"[\u0C00-\u0C7F]", text): lang = "te"
                    elif re.search(r"[\u0900-\u097F]", text): lang = "hi"
                    elif re.search(r"[\u0B80-\u0BFF]", text): lang = "ta"
                    elif re.search(r"[\u0C80-\u0CFF]", text): lang = "kn"
                    res = {"language": lang, "language_name": "Detected", "confidence": 0.8}

                self._send_json(200, res)
            except Exception as e:
                logger.error(f"Error detecting language: {e}", exc_info=True)
                self._send_json(500, {"error": "Language detection error", "message": str(e)})

        elif self.path in ("/ask", "/api/ask"):
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body) if body else {}

                question = payload.get("question", "").strip()
                weather_data = payload.get("weather_data") or payload.get("weather") or {}
                language = payload.get("language", "en")
                location = payload.get("location") or weather_data.get("location")

                if not question:
                    self._send_json(400, {"error": "Missing required field: question"})
                    return

                # Invoke the real WeatherGPT LLM service
                result = ask_weather(
                    question=question,
                    weather_data=weather_data,
                    language=language,
                    location=location,
                    conversation_context=payload.get("conversation_context") or payload.get("history") or []
                )

                self._send_json(200, result)

            except Exception as e:
                logger.error(f"Error processing LLM request: {e}", exc_info=True)
                self._send_json(500, {"error": "Internal Server Error", "message": str(e)})
        else:
            self._send_json(404, {"error": "Not Found"})

def run_server(port: int = 8001):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, LLMRequestHandler)
    logger.info(f"WeatherGPT LLM HTTP Service running at http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down LLM server...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(os.environ.get("LLM_PORT", 8001))
    run_server(port)
