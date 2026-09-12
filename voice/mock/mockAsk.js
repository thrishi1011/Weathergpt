/**
 * Mock / Live API Client for WeatherGPT Backend (POST /api/ask)
 *
 * SCOPE NOTE:
 * This module is self-contained inside voice/mock/.
 * To switch to the real backend once available, change USE_MOCK to false
 * or provide a custom backend endpoint URL.
 */

// Toggle between mock and live backend
export const USE_MOCK = true;
export const BACKEND_URL = '/api/ask';

/**
 * Canned mock answers strictly categorized per language (en-IN, hi-IN, te-IN).
 * Clearly marked as mock data for testing voice module flows.
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
  ]
};

/**
 * Helper to pick relevant canned answer in mock mode.
 */
function getMockAnswer(question, language = 'en-IN', location = 'Warangal') {
  const langKey = MOCK_RESPONSES[language] ? language : 'en-IN';
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
    language: language
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
