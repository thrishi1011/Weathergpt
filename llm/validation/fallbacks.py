"""
Deterministic fallback response generator for WeatherGPT.
Supports all 14 Indian & English languages with 100% data grounding.
"""
from typing import Any, Dict, Optional

SUPPORTED_LANGUAGES = [
    "en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "as", "gu", "ks", "pa", "or", "ur"
]

def generate_fallback_response(
    weather_data: Dict[str, Any],
    question: str,
    language: str = "en",
    location: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a 100% grounded, deterministic weather answer without calling an LLM.
    """
    lang = language.lower().strip() if language in SUPPORTED_LANGUAGES else "en"
    loc = location or weather_data.get("location") or "the requested location"
    temp = weather_data.get("temperature")
    rain_prob = weather_data.get("rain_probability")
    cond = weather_data.get("weather_condition") or "Moderate conditions"
    alert = weather_data.get("imd_alert") or {}
    alert_active = alert.get("active", False) if isinstance(alert, dict) else False
    severity = alert.get("severity", "").title() if isinstance(alert, dict) else ""
    event = alert.get("event", "") if isinstance(alert, dict) else ""

    unavail_map = {
        "en": "unavailable",
        "hi": "उपलब्ध नहीं",
        "te": "అందుబాటులో లేదు",
        "ta": "கிடைக்கவில்லை",
        "kn": "ಲಭ್ಯವಿಲ್ಲ",
        "ml": "ലഭ്യമല്ല",
        "bn": "উপলব্ধ নেই",
        "mr": "उपलब्ध नाही",
        "as": "উপলব্ধ নাই",
        "gu": "ઉપલબ્ધ નથી",
        "ks": "دستیاب چھُ نہ",
        "pa": "ਉਪਲਬਧ ਨਹੀਂ",
        "or": "ଉପଲବ୍ଧ ନାହିଁ",
        "ur": "دستیاب نہیں"
    }

    unavail = unavail_map.get(lang, "unavailable")
    temp_str = f"{temp}°C" if temp is not None else unavail
    rain_str = f"{rain_prob}%" if rain_prob is not None else unavail

    if lang == "hi":
        if alert_active and severity:
            ans = f"{loc} के लिए {severity} अलर्ट सक्रिय है ({event})। तापमान {temp_str} और बारिश की संभावना {rain_str} है।"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} में बारिश की {rain_str} संभावना है। मौसम {cond} रहने का अनुमान है और तापमान {temp_str} है।"
        else:
            ans = f"{loc} में मौसम {cond} है। तापमान {temp_str} और बारिश की संभावना {rain_str} है।"

    elif lang == "te":
        if alert_active and severity:
            ans = f"{loc} కొరకు {severity} హెచ్చరిక అమలులో ఉంది ({event}). ఉష్ణోగ్రత {temp_str} మరియు వర్షం పడే అవకాశం {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} లో వర్షం పడే అవకాశం {rain_str} గా ఉంది. వాతావరణం {cond} మరియు ఉష్ణోగ్రత {temp_str}."
        else:
            ans = f"{loc} లో వాతావరణం {cond} గా ఉంది. ఉష్ణోగ్రత {temp_str} మరియు వర్షం పడే అవకాశం {rain_str}."

    elif lang == "ta":
        if alert_active and severity:
            ans = f"{loc} பகுதிக்கு {severity} எச்சரிக்கை விடுக்கப்பட்டுள்ளது ({event}). வெப்பநிலை {temp_str}, மழை வாய்ப்பு {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} பகுதியில் {rain_str} மழை பெய்ய வாய்ப்புள்ளது. வானிலை: {cond}, வெப்பநிலை: {temp_str}."
        else:
            ans = f"{loc} பகுதியில் வானிலை {cond} ஆக உள்ளது. வெப்பநிலை {temp_str}, மழை வாய்ப்பு {rain_str}."

    elif lang == "kn":
        if alert_active and severity:
            ans = f"{loc} ಗೆ {severity} ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ ({event}). ತಾಪಮಾನ {temp_str}, ಮಳೆಯ ಸಾಧ್ಯತೆ {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} ನಲ್ಲಿ {rain_str} ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಹವಾಮಾನ {cond} ಮತ್ತು ತಾಪಮಾನ {temp_str}."
        else:
            ans = f"{loc} ನಲ್ಲಿ ಹವಾಮಾನ {cond} ಆಗಿದೆ. ತಾಪಮಾನ {temp_str} ಮತ್ತು ಮಳೆಯ ಸಾಧ್ಯತೆ {rain_str}."

    elif lang == "ml":
        if alert_active and severity:
            ans = f"{loc} പ്രദേശത്ത് {severity} മുന്നറിയിപ്പ് നൽകിയിട്ടുണ്ട് ({event}). താപനില {temp_str}, മഴ സാധ്യത {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} പ്രദേശത്ത് {rain_str} മഴ സാധ്യതയുണ്ട്. കാലാവസ്ഥ {cond}, താപനില {temp_str}."
        else:
            ans = f"{loc} പ്രദേശത്ത് കാലാവസ്ഥ {cond} ആണ്. താപനില {temp_str}, മഴ സാധ്യത {rain_str}."

    elif lang == "bn":
        if alert_active and severity:
            ans = f"{loc}-এর জন্য {severity} সতর্কতা জারি করা হয়েছে ({event})। তাপমাত্রা {temp_str}, বৃষ্টির সম্ভাবনা {rain_str}।"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc}-এ {rain_str} বৃষ্টির সম্ভাবনা রয়েছে। আবহাওয়া {cond} এবং তাপমাত্রা {temp_str}।"
        else:
            ans = f"{loc}-এ আবহাওয়া {cond}। তাপমাত্রা {temp_str} এবং বৃষ্টির সম্ভাবনা {rain_str}।"

    elif lang == "mr":
        if alert_active and severity:
            ans = f"{loc} साठी {severity} अलर्ट जारी केला आहे ({event})। तापमान {temp_str}, पावसाची शक्यता {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} मध्ये पावसाची शक्यता {rain_str} आहे. हवामान {cond} आणि तापमान {temp_str} आहे."
        else:
            ans = f"{loc} मध्ये हवामान {cond} आहे. तापमान {temp_str} आणि पावसाची शक्यता {rain_str} आहे."

    elif lang == "as":
        if alert_active and severity:
            ans = f"{loc}-ৰ বাবে {severity} সতৰ্কবাৰ্তা জাৰি কৰা হৈছে ({event})। তাপমাত্রা {temp_str}, বৰষুণৰ সম্ভাৱনা {rain_str}।"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc}-ত বৰষুণৰ সম্ভাৱনা {rain_str}। বতৰ {cond} আৰু তাপমাত্রা {temp_str}।"
        else:
            ans = f"{loc}-ত বতৰ {cond}। তাপমাত্রা {temp_str} আৰু বৰষুণৰ সম্ভাৱনা {rain_str}।"

    elif lang == "gu":
        if alert_active and severity:
            ans = f"{loc} માટે {severity} એલર્ટ જારી કરવામાં આવ્યું છે ({event}). તાપમાન {temp_str}, વરસાદની સંભાવના {rain_str}."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} માં વરસાદની સંભાવના {rain_str} છે. હવામાન {cond} અને તાપમાન {temp_str} છે."
        else:
            ans = f"{loc} માં હવામાન {cond} છે. તાપમાન {temp_str} અને વરસાદની સંભાવના {rain_str} છે."

    elif lang == "ks":
        if alert_active and severity:
            ans = f"{loc} خٲطرٕ چھُ {severity} الرٹ جاری کرنہٕ آمُت ({event})۔ درجہ حرارت {temp_str} تہٕ رُد گژھنُک امکان {rain_str}۔"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} منٛز چھُ {rain_str} رُد گژھنُک امکان۔ موسم {cond} تہٕ درجہ حرارت {temp_str}۔"
        else:
            ans = f"{loc} منٛز چھُ موسم {cond}۔ درجہ حرارت {temp_str} تہٕ رُد گژھنُک امکان {rain_str}۔"

    elif lang == "pa":
        if alert_active and severity:
            ans = f"{loc} ਲਈ {severity} ਅਲਰਟ ਜਾਰੀ ਕੀਤਾ ਗਿਆ ਹੈ ({event})। ਤਾਪਮਾਨ {temp_str}, ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ {rain_str}।"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} ਵਿੱਚ ਮੀਂਹ ਪੈਣ ਦੀ {rain_str} ਸੰਭਾਵਨਾ ਹੈ। ਮੌਸਮ {cond} ਅਤੇ ਤਾਪਮਾਨ {temp_str} ਰਹੇਗਾ।"
        else:
            ans = f"{loc} ਵਿੱਚ ਮੌਸਮ {cond} ਹੈ। ਤਾਪਮਾਨ {temp_str} ਅਤੇ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ {rain_str} ਹੈ।"

    elif lang == "or":
        if alert_active and severity:
            ans = f"{loc} ପାଇଁ {severity} ସତର୍କତା ଜାରି କରାଯାଇଛି ({event})। ତାପମାତ୍ରା {temp_str}, ବର୍ଷା ସମ୍ଭାବନା {rain_str}।"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} ରେ {rain_str} ବର୍ଷା ହେବାର ସମ୍ଭାବନା ଅଛି। ପାଗ {cond} ଏବଂ ତାପମାତ୍ରା {temp_str}।"
        else:
            ans = f"{loc} ରେ ପାଗ {cond} ଅଛି। ତାପମାତ୍ରା {temp_str} ଏବଂ ବର୍ଷା ସମ୍ଭାବନା {rain_str}।"

    elif lang == "ur":
        if alert_active and severity:
            ans = f"{loc} کے لیے {severity} الرٹ جاری کیا گیا ہے ({event})۔ درجہ حرارت {temp_str} اور بارش کا امکان {rain_str} ہے۔"
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"{loc} میں بارش کا {rain_str} امکان ہے۔ موسم {cond} اور درجہ حرارت {temp_str} رہنے کی توقع ہے۔"
        else:
            ans = f"{loc} میں موسم {cond} ہے۔ درجہ حرارت {temp_str} اور بارش کا امکان {rain_str} ہے۔"

    else:  # Default English ('en')
        if alert_active and severity:
            ans = f"An active {severity} Alert is in place for {loc} due to {event}. Current temperature is {temp_str} with {rain_str} rain probability."
        elif rain_prob is not None and rain_prob >= 50:
            ans = f"Rain is likely in {loc} with a {rain_str} probability. Expect {cond} with a temperature of {temp_str}."
        else:
            ans = f"In {loc}, the weather is {cond} with a temperature of {temp_str} and rain probability of {rain_str}."

    return {
        "answer": ans,
        "language": lang,
        "confidence": "based_on_data" if (temp is not None or rain_prob is not None) else "partial_data",
        "sources": [k for k in ["temperature", "rain_probability", "weather_condition", "imd_alert"] if weather_data.get(k) is not None],
        "safety_flag": bool(alert_active)
    }
