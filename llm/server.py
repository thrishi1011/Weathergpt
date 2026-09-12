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

from llm.service import ask_weather

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
logger = logging.getLogger("weathergpt.llm.server")

class LLMRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: Dict[str, Any]):
        response_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
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
        if self.path in ("/ask", "/api/ask"):
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
                    location=location
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
