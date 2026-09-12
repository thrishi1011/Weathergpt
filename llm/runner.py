"""
CLI Runner for WeatherGPT LLM service.
Allows direct execution without running a daemon HTTP server.
Usage:
    python -m llm.runner '<json_payload>'
"""
import sys
import io
import json

# Ensure UTF-8 output on all platforms (especially Windows PowerShell/cmd)
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from llm.service import ask_weather

def main():
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read()

    try:
        data = json.loads(raw_input)
        question = data.get("question", "")
        weather = data.get("weather_data") or data.get("weather") or {}
        language = data.get("language", "en")
        location = data.get("location") or weather.get("location")

        res = ask_weather(
            question=question,
            weather_data=weather,
            language=language,
            location=location
        )
        print(json.dumps(res, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "answer": "Unable to generate answer due to an internal error.",
            "language": "en"
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
