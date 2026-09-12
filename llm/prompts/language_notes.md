# Multilingual Guidelines & Indian Languages Master Reference

## Overview

WeatherGPT supports 14 major Indian and international languages. The target language is specified explicitly via the `language` parameter passed to the LLM module.

Supported Language Codes (ISO 639-1):
- `en` — English
- `hi` — Hindi (हिंदी)
- `te` — Telugu (తెలుగు)
- `ta` — Tamil (தமிழ்)
- `kn` — Kannada (ಕನ್ನಡ)
- `ml` — Malayalam (മലയാളം)
- `bn` — Bengali (বাংলা)
- `mr` — Marathi (मराठी)
- `as` — Assamese (অসমীয়া)
- `gu` — Gujarati (ગુજરાતી)
- `ks` — Kashmiri (कॉशुर / کٲشُر)
- `pa` — Punjabi (ਪੰਜਾਬੀ)
- `or` — Odia (ଓଡ଼ିଆ)
- `ur` — Urdu (اردو)

---

## 1. Core Principles

1. **Explicit Language Code**:
   - The output language must strictly correspond to the `language` code passed in the request payload.
2. **Standard Arabic Numerals & Units**:
   - **Always use Western Arabic numerals** (`34`, `80`, `15`) across all languages and scripts. Do not spell out numbers or use regional numeral systems (e.g., write `34°C` and `80%`, NOT `३४` or `౩౪`).
   - Keep standard unit symbols intact: `°C`, `%`, `km/h`, `mm`.
3. **Data Grounding**:
   - Never invent numbers or alerts. If a metric is `null`, state that data is unavailable in the target language.
4. **Tone & Register**:
   - Always use a polite, respectful, and helpful conversational register across all Indian languages (e.g., आप in Hindi, మీరు in Telugu, நீங்கள் in Tamil, ನೀವು in Kannada, നിങ്ങള്‍ in Malayalam, আপনি in Bengali, आपण in Marathi, আপুনি in Assamese, તમે in Gujarati, ਤੁਸੀਂ in Punjabi, ଆପଣ in Odia, آپ in Urdu).

---

## 2. IMD Alert Terminology Across All 14 Languages

| Code | English | Hindi (`hi`) | Telugu (`te`) | Tamil (`ta`) | Kannada (`kn`) | Malayalam (`ml`) | Bengali (`bn`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `yellow` | Yellow Alert | येलो अलर्ट (पीली चेतावनी) | పసుపు హెచ్చరిక (ఎల్లో అలర్ట్) | மஞ்சள் எச்சரிக்கை | ಹಳದಿ ಎಚ್ಚರಿಕೆ | മഞ്ഞ മുന്നറിയിപ്പ് | হলুদ সতর্কতা |
| `orange` | Orange Alert | ऑरेंज अलर्ट (नारंगी चेतावनी) | నారింజ హెచ్చరిక (ఆరెంజ్ అలర్ట్) | ஆரஞ்சு எச்சரிக்கை | ಕಿತ್ತಳೆ ಎಚ್ಚರಿಕೆ | ഓറഞ്ച് മുന്നറിയിപ്പ് | কমলা সতর্কতা |
| `red` | Red Alert | रेड अलर्ट (लाल चेतावनी) | ఎరుపు హెచ్చరిక (రెడ్ అలర్ట్) | சிவப்பு எச்சரிக்கை | ಕೆಂಪು ಎಚ್ಚರಿಕೆ | ചുവപ്പ് മുന്നറിയിപ്പ് | লাল সতর্কতা |

| Code | Marathi (`mr`) | Assamese (`as`) | Gujarati (`gu`) | Kashmiri (`ks`) | Punjabi (`pa`) | Odia (`or`) | Urdu (`ur`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `yellow` | पिवळा अलर्ट (इशारा) | হালধীয়া সতৰ্কবাৰ্তা | પીળો એલર્ટ (ચેતવણી) | زرد الرٹ (وارننگ) | ਪੀਲਾ ਅਲਰਟ (ਚਿਤਾਵਨੀ) | ହଳଦିଆ ସତର୍କତା | پیلا الرٹ |
| `orange` | केशरी अलर्ट (नारंगी इशारा) | সুমথিৰা সতৰ্কবাৰ্তা | નારંગી એલર્ટ | نارنجی الرٹ | ਸੰਤਰੀ ਅਲਰਟ | ନାରଙ୍ଗୀ ସତର୍କତା | نارنجی الرٹ |
| `red` | लाल अलर्ट (धोक्याचा इशारा) | ৰঙা সতৰ্কবাৰ্তা | લાલ એલર્ટ | ریڈ الرٹ (لال وارننگ) | ਲਾਲ ਅਲਰਟ | ଲାଲ୍ ସତର୍କତା | ریڈ الرٹ (سرخ وارننگ) |

---

## 3. Key Weather Vocabulary & Reference Examples

### Tamil (`ta` — தமிழ்)
- Rain probability: மழை வாய்ப்பு (`80% மழை வாய்ப்பு`)
- Temperature: வெப்பநிலை (`34°C`)
- Umbrella: குடை
- Example: *"ஆம், இன்று குடை எடுத்துச் செல்வது நல்லது. 80% மழை பெய்ய வாய்ப்புள்ளது மற்றும் வெப்பநிலை 34°C ஆக இருக்கும்."*

### Kannada (`kn` — ಕನ್ನಡ)
- Rain probability: ಮಳೆಯ ಸಾಧ್ಯತೆ (`80% ಮಳೆಯ ಸಾಧ್ಯತೆ`)
- Temperature: ತಾಪಮಾನ (`34°C`)
- Umbrella: ಛತ್ರಿ
- Example: *"ಹೌದು, ನೀವು ಇಂದು ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗುವುದು ಉತ್ತಮ. 80% ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ ಮತ್ತು ತಾಪಮಾನ 34°C ಇದೆ."*

### Malayalam (`ml` — മലയാളം)
- Rain probability: മഴ സാധ്യത (`80% മഴ സാധ്യത`)
- Temperature: താപനില (`34°C`)
- Umbrella: കുട
- Example: *"അതെ, ഇന്ന് കുട കരുതുന്നത് നല്ലതാണ്. 80% മഴ സാധ്യതയുണ്ട്, താപനില 34°C ആണ്."*

### Bengali (`bn` — বাংলা)
- Rain probability: বৃষ্টির সম্ভাবনা (`80% বৃষ্টির সম্ভাবনা`)
- Temperature: তাপমাত্রা (`34°C`)
- Umbrella: ছাতা
- Example: *"হ্যাঁ, আজ আপনার ছাতা সাথে রাখা উচিত। 80% বৃষ্টির সম্ভাবনা রয়েছে এবং তাপমাত্রা 34°C।"*

### Marathi (`mr` — मराठी)
- Rain probability: पावसाची शक्यता (`80% पावसाची शक्यता`)
- Temperature: तापमान (`34°C`)
- Umbrella: छत्री
- Example: *"होय, आज छत्री सोबत ठेवणे योग्य ठरेल. 80% पावसाची शक्यता असून तापमान 34°C आहे."*

### Assamese (`as` — অসমীয়া)
- Rain probability: বৰষুণৰ সম্ভাৱনা (`80% বৰষুণৰ সম্ভাৱনা`)
- Temperature: তাপমাত্রা (`34°C`)
- Umbrella: ছাতি
- Example: *"হয়, আজি ছাতি লগত ৰখাটো উচিত হ'ব। 80% বৰষুণৰ সম্ভাৱনা আছে আৰু তাপমাত্রা 34°C।"*

### Gujarati (`gu` — ગુજરાતી)
- Rain probability: વરસાદની સંભાવના (`80% વરસાદની સંભાવના`)
- Temperature: તાપમાન (`34°C`)
- Umbrella: છત્રી
- Example: *"હા, આજે છત્રી સાથે રાખવી સારી રહેશે. 80% વરસાદની સંભાવના છે અને તાપમાન 34°C છે."*

### Kashmiri (`ks` — कॉशुर / کٲشُر)
- Rain probability: رُد گژھنُک امکان / रुद गछ़नुक इम्कान
- Temperature: درجہ حرارت / दर्जा हरारत (`34°C`)
- Umbrella: چَھتٕر / छत्र
- Example: *"آ، از پزِ چھترِ رٹِتھ پکن۔ 80% رُد گژھنُک امکان چھُ تہٕ درجہ حرارت چھُ 34°C۔"*

### Punjabi (`pa` — ਪੰਜਾਬੀ)
- Rain probability: ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ (`80% ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ`)
- Temperature: ਤਾਪਮਾਨ (`34°C`)
- Umbrella: ਛਤਰੀ
- Example: *"ਹਾਂ ਜੀ, ਅੱਜ ਛਤਰੀ ਨਾਲ ਰੱਖਣੀ ਚਾਹੀਦੀ ਹੈ। 80% ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ ਅਤੇ ਤਾਪਮਾਨ 34°C ਰਹੇਗਾ।"*

### Odia (`or` — ଓଡ଼ିଆ)
- Rain probability: ବର୍ଷା ସମ୍ଭାବନା (`80% ବର୍ଷା ସମ୍ଭାବନା`)
- Temperature: ତାପମାତ୍ରା (`34°C`)
- Umbrella: ଛତା
- Example: *"ହଁ, ଆଜି ଛତା ସାଥିରେ ନେବା ଉଚିତ ହେବ। 80% ବର୍ଷା ହେବାର ସମ୍ଭାବନା ଅଛି ଏବଂ ତାପମାତ୍ରା 34°C ରହିଛି।"*

### Urdu (`ur` — اردو)
- Rain probability: بارش کا امکان (`80% بارش کا امکان`)
- Temperature: درجہ حرارت (`34°C`)
- Umbrella: چھتری
- Example: *"جی ہاں، آج اپنے ساتھ چھتری رکھنا بہتر ہے۔ 80% بارش کا امکان ہے اور درجہ حرارت 34°C ہے۔"*
