/**
 * Mock / Live API Client for WeatherGPT Backend (POST /api/ask)
 *
 * SCOPE NOTE:
 * This module is self-contained inside voice/mock/.
 * To switch to the real backend once available, change USE_MOCK to false
 * or provide a custom backend endpoint URL.
 */

import { detectLanguage } from '../utils/languageDetector.js';
// Toggle between mock and live backend
export const USE_MOCK = true;
export const BACKEND_URL = '/api/ask';

/**
 * Canned mock answers categorized per language (en-IN, te-IN, hi-IN, ta-IN, kn-IN, ml-IN, bn-IN, mr-IN, gu-IN).
 */
const MOCK_RESPONSES = {
  'en-IN': [
    {
      keywords: ['rain', 'precipitation', 'umbrella', 'drizzle', 'shower'],
      answer: 'Rain is highly likely tomorrow in Warangal, with an 80% chance of precipitation. Carrying an umbrella is strongly advised.',
      location: 'Warangal'
    },
    {
      keywords: ['temperature', 'heat', 'hot', 'warm', 'temp', 'celsius', 'degrees'],
      answer: 'The current temperature in Warangal is 31 degrees Celsius, feeling like 35 degrees due to humidity.',
      location: 'Warangal'
    },
    {
      keywords: ['cold', 'winter', 'chilly', 'frost'],
      answer: 'The temperature is mild with a low of 20 degrees Celsius expected tonight.',
      location: 'Warangal'
    },
    {
      keywords: ['wind', 'storm', 'cyclone', 'breeze', 'air'],
      answer: 'Wind speeds in Warangal are moderate at around 12 km/h. No storm warnings are active.',
      location: 'Warangal'
    },
    {
      keywords: ['default', 'weather', 'climate', 'forecast'],
      answer: 'The weather in Warangal is currently partly cloudy with a light breeze. No severe weather warnings are active today.',
      location: 'Warangal'
    }
  ],
  'te-IN': [
    {
      keywords: ['వర్షం', 'వాన', 'జల్లు', 'తడి', 'గొడుగు', 'varsham', 'vaana', 'rain', 'drizzle'],
      answer: 'వరంగల్‌లో రేపు వర్షం పడే అవకాశం 80 శాతం వరకు ఉంది. బయటకు వెళ్లేటప్పుడు గొడుగు తీసుకెళ్లడం మంచిది.',
      location: 'వరంగల్'
    },
    {
      keywords: ['ఉష్ణోగ్రత', 'వేడి', 'ఎండ', 'సెల్సియస్', 'ushnograta', 'temperature', 'temp', 'heat', 'hot', 'yenda', 'enda', 'ukkapotha'],
      answer: 'వరంగల్‌లో ప్రస్తుత ఉష్ణోగ్రత 31 డిగ్రీల సెల్సియస్. వాతావరణం కాస్త వేడిగా మరియు ఉక్కపోతగా ఉంది.',
      location: 'వరంగల్'
    },
    {
      keywords: ['వాతావరణం', 'వాతావరణ', 'వాతావరణము', 'weather', 'climate', 'forecast', 'ela undi', 'ela vundi'],
      answer: 'వరంగల్‌లో ప్రస్తుత వాతావరణం ఆహ్లాదకరంగా ఉంది. ఆకాశం పాక్షికంగా మేఘావృతమై ఉంది, తీవ్ర హెచ్చరికలు ఏవీ లేవు.',
      location: 'వరంగల్'
    },
    {
      keywords: ['చలి', 'మంచు', 'cold', 'chali', 'winter'],
      answer: 'వరంగల్‌లో రాత్రి వేళ చలి సాధారణంగా ఉంటుంది. ఉష్ణోగ్రత 20 డిగ్రీల వరకు నమోదయ్యే అవకాశం ఉంది.',
      location: 'వరంగల్'
    },
    {
      keywords: ['గాలి', 'తుఫాను', 'గాలులు', 'wind', 'storm', 'cyclone', 'gaali'],
      answer: 'వరంగల్‌లో గాలి వేగం గంటకు 12 కిలోమీటర్లుగా ఉంది. ఎలాంటి తుఫాను సూచనలు లేవు.',
      location: 'వరంగల్'
    },
    {
      keywords: ['default'],
      answer: 'వరంగల్‌లో ప్రస్తుత వాతావరణం సాధారణంగా ఉంది. ఎటువంటి తీవ్ర వాతావరణ హెచ్చరికలు లేవు.',
      location: 'వరంగల్'
    }

  ],
  'hi-IN': [
    {
      keywords: ['बारिश', 'वर्षा', 'पानी', 'बरसात', 'छाता', 'barish', 'rain'],
      answer: 'वारंगल में कल बारिश की 80% संभावना है। बाहर निकलते समय छाता साथ रखना अच्छा रहेगा।',
      location: 'वारंगल'
    },
    {
      keywords: ['तापमान', 'गर्मी', 'धूप', 'ताप', 'tapman', 'temperature', 'temp'],
      answer: 'वारंगल में वर्तमान तापमान 31 डिग्री सेल्सियस है और हल्की नमी बनी हुई है।',
      location: 'वारंगल'
    },
    {
      keywords: ['हवा', 'तूफान', 'आंधी', 'wind', 'storm'],
      answer: 'वारंगल में हवा की गति सामान्य है (12 किमी/घंटा)। किसी बड़े तूफान की चेतावनी नहीं है।',
      location: 'वारंगल'
    },
    {
      keywords: ['default', 'मौसम', 'हाल', 'mausam', 'weather'],
      answer: 'वारंगल में मौसम सामान्य रूप से आंशिक रूप से बादल छाए रहने का है। कोई विशेष चेतावनी नहीं है।',
      location: 'वारंगल'
    }
  ],
  'ta-IN': [
    {
      keywords: ['மழை', 'mazhai', 'rain'],
      answer: 'வாரங்கலில் நாளை மழை பெய்ய 80% வாய்ப்புள்ளது. வெளியே செல்லும்போது குடை எடுத்துச் செல்லவும்.',
      location: 'வாரங்கல்'
    },
    {
      keywords: ['வெப்பநிலை', 'வெயில்', 'veppam', 'temperature'],
      answer: 'வாரங்கலில் தற்போதைய வெப்பநிலை 31 டிகிரி செல்சியஸ் ஆகும்.',
      location: 'வாரங்கல்'
    },
    {
      keywords: ['default', 'வானிலை', 'weather'],
      answer: 'வாரங்கலில் தற்போதைய வானிலை சீராகவும், ஓரளவு மேகமூட்டத்துடனும் உள்ளது.',
      location: 'வாரங்கல்'
    }
  ],
  'kn-IN': [
    {
      keywords: ['ಮಳೆ', 'male', 'rain'],
      answer: 'ವಾರಂಗಲ್‌ನಲ್ಲಿ ನಾಳೆ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ 80% ಇದೆ. ಹೊರಗೆ ಹೋಗುವಾಗ ಕೊಡೆ ಒಯ್ಯುವುದು ಒಳ್ಳೆಯದು.',
      location: 'ವಾರಂಗಲ್'
    },
    {
      keywords: ['ತಾಪಮಾನ', 'ಸೆಖೆ', 'temperature'],
      answer: 'ವಾರಂಗಲ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ತಾಪಮಾನ 31 ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಆಗಿದೆ.',
      location: 'ವಾರಂಗಲ್'
    },
    {
      keywords: ['default', 'ಹವಾಮಾನ', 'weather'],
      answer: 'ವಾರಂಗಲ್‌ನಲ್ಲಿ ಹವಾಮಾನವು ಪ್ರಸ್ತುತ ಭಾಗಶಃ ಮೋಡ ಕವಿದಿದ್ದು, ಯಾವುದೇ ತೀವ್ರ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.',
      location: 'ವಾರಂಗಲ್'
    }
  ],
  'ml-IN': [
    {
      keywords: ['മഴ', 'mazha', 'rain'],
      answer: 'വാറങ്കലിൽ നാളെ മഴയ്ക്ക് 80% സാധ്യതയുണ്ട്. പുറത്തിറങ്ങുമ്പോൾ കുട കരുതുക.',
      location: 'വാറങ്കൽ'
    },
    {
      keywords: ['default', 'കാലാവസ്ഥ', 'weather'],
      answer: 'വാറങ്കലിൽ കാലാവസ്ഥ പൊതുവെ സുഖകരമാണ്. കനത്ത മുന്നറിയിപ്പുകളൊന്നുമില്ല.',
      location: 'വാറങ്കൽ'
    }
  ],
  'bn-IN': [
    {
      keywords: ['বৃষ্টি', 'brishti', 'rain'],
      answer: 'ওয়ারাঙ্গলে আগামীকাল বৃষ্টির ৮০% সম্ভাবনা রয়েছে। বাইরে যাওয়ার সময় ছাতা সাথে রাখা ভালো।',
      location: 'ওয়ারাঙ্গল'
    },
    {
      keywords: ['default', 'আবহাওয়া', 'weather'],
      answer: 'ওয়ারাঙ্গলে বর্তমান আবহাওয়া আংশিক মেঘলা এবং স্বাভাবিক রয়েছে।',
      location: 'ওয়ারাঙ্গল'
    }
  ],
  'mr-IN': [
    {
      keywords: ['पाऊस', 'paus', 'rain'],
      answer: 'वारंगलमध्ये उद्या पाऊस पडण्याची 80% शक्यता आहे. बाहेर जाताना छत्री सोबत ठेवा.',
      location: 'वारंगल'
    },
    {
      keywords: ['default', 'हवामान', 'weather'],
      answer: 'वारंगलमध्ये सध्या हवामान अंशतः ढगाळ आणि सामान्य आहे.',
      location: 'वारंगल'
    }
  ],
  'gu-IN': [
    {
      keywords: ['વરસાદ', 'varsad', 'rain'],
      answer: 'વારંગલમાં કાલે વરસાદ પડવાની 80% શક્યતા છે. બહાર જતી વખતે છત્રી સાથે રાખવી સારી.',
      location: 'વારંગલ'
    },
    {
      keywords: ['default', 'હવામાન', 'weather'],
      answer: 'વારંગલમાં હાલનું હવામાન આંશિક વાદળછાયું અને સામાન્ય છે.',
      location: 'વારંગલ'
    }

  ]
};

/**
 * Helper to pick relevant canned answer in mock mode with dynamic language detection.
 */
function getMockAnswer(question, requestedLang = 'auto', location = 'Warangal') {
  // Automatically detect language if requested as 'auto' or detect from script
  const detectedLang = detectLanguage(question, requestedLang === 'auto' ? 'en-IN' : requestedLang);
  const targetLang = (requestedLang === 'auto' || detectedLang !== 'en-IN') ? detectedLang : requestedLang;

  const langKey = MOCK_RESPONSES[targetLang] ? targetLang : 'en-IN';
  const responses = MOCK_RESPONSES[langKey];
  const qLower = (question || '').toLowerCase().trim();

  let match = null;
  if (qLower) {
    match = responses.find(r => {
      if (!r.keywords || r.keywords.includes('default')) return false;
      return r.keywords.some(k => qLower.includes(k.toLowerCase()));
    });
  }

  const chosen = match || responses.find(r => r.keywords && r.keywords.includes('default')) || responses[responses.length - 1];

  return {
    answer: chosen.answer,
    location: location || chosen.location,
    language: langKey
  };
}

/**
 * Main backend communication function for the voice module.
 *
 * Sits in front of POST /api/ask.
 *
 * @param {string} question - Transcribed user question
 * @param {string} [location='Warangal'] - Optional known user location
 * @param {string} [language='en-IN'] - Language code ('en-IN', 'hi-IN', 'te-IN')
 * @param {Object} [options]
 * @param {boolean} [options.forceLive=false] - If true, ignores USE_MOCK and calls fetch
 * @param {string} [options.apiUrl] - Custom API endpoint URL
 * @returns {Promise<{ answer: string, location?: string, language?: string }>}
 */
export async function askBackend(question, location = 'Warangal', language = 'en-IN', options = {}) {
  const isMock = options.forceLive ? false : USE_MOCK;

  if (isMock) {
    // Simulate natural network latency (400ms - 800ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = getMockAnswer(question, language, location);
    console.log('[MockBackend] Returned mock response:', result);
    return result;
  }

  // Live backend call matching shared/api-contract.md
  const endpoint = options.apiUrl || BACKEND_URL;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        location,
        language
      })
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      answer: data.answer || 'No answer provided by backend.',
      location: data.location || location,
      language: data.language || language
    };
  } catch (err) {
    console.error('[askBackend] API fetch failed:', err);
    throw new Error('Could not connect to the WeatherGPT backend service. Please check your connection.');
  }
}
