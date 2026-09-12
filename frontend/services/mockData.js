/**
 * WeatherGPT Mock Data Service
 * Provides authentic schema-compliant fallbacks when backend is not actively running.
 * Conforms strictly to shared/api-contract.md & shared/weather-schema.json
 */

export const MOCK_WEATHER_DATABASE = {
  'Warangal': {
    location: 'Warangal',
    timestamp: new Date().toISOString(),
    temperature: 28.4,
    humidity: 82,
    rain_probability: 75,
    rainfall: 18.5,
    wind_speed: 14.2,
    weather_condition: 'Thunderstorm & Showers',
    imd_alert: {
      active: true,
      severity: 'Orange',
      event: 'Heavy Rainfall Warning',
      message: 'IMD Alert: Moderate to heavy thunderstorm with lightning and gusty winds (30-40 kmph) likely over Warangal.'
    }
  },
  'Hyderabad': {
    location: 'Hyderabad',
    timestamp: new Date().toISOString(),
    temperature: 29.8,
    humidity: 74,
    rain_probability: 45,
    rainfall: 4.2,
    wind_speed: 12.0,
    weather_condition: 'Partly Cloudy',
    imd_alert: {
      active: false,
      severity: 'Green',
      event: 'No Severe Warning',
      message: 'Weather conditions normal across Hyderabad urban zones.'
    }
  },
  'Delhi': {
    location: 'Delhi',
    timestamp: new Date().toISOString(),
    temperature: 34.2,
    humidity: 58,
    rain_probability: 20,
    rainfall: 0.0,
    wind_speed: 9.5,
    weather_condition: 'Hazy Sunshine',
    imd_alert: {
      active: true,
      severity: 'Yellow',
      event: 'Heat Watch',
      message: 'Day temperatures are likely to rise by 2-3°C over Delhi NCR.'
    }
  },
  'Mumbai': {
    location: 'Mumbai',
    timestamp: new Date().toISOString(),
    temperature: 30.5,
    humidity: 88,
    rain_probability: 90,
    rainfall: 32.0,
    wind_speed: 24.5,
    weather_condition: 'Continuous Monsoon Downpour',
    imd_alert: {
      active: true,
      severity: 'Red',
      event: 'Extremely Heavy Rainfall',
      message: 'IMD Red Alert: Intense spell of heavy to very heavy rain with high tides expected along Konkan coast.'
    }
  },
  'Bengaluru': {
    location: 'Bengaluru',
    timestamp: new Date().toISOString(),
    temperature: 24.6,
    humidity: 65,
    rain_probability: 30,
    rainfall: 1.5,
    wind_speed: 16.0,
    weather_condition: 'Pleasant Breeze & Overcast',
    imd_alert: {
      active: false,
      severity: 'Green',
      event: 'Normal',
      message: 'Gentle breeze and pleasant conditions expected throughout the day.'
    }
  }
};

export function getMockWeather(location) {
  const normalized = Object.keys(MOCK_WEATHER_DATABASE).find(
    k => k.toLowerCase() === (location || '').trim().toLowerCase()
  );
  if (normalized) {
    return {
      ...MOCK_WEATHER_DATABASE[normalized],
      timestamp: new Date().toISOString()
    };
  }

  // Generic fallback adhering to schema
  return {
    location: location || 'Local Station',
    timestamp: new Date().toISOString(),
    temperature: 27.0,
    humidity: 70,
    rain_probability: 40,
    rainfall: 2.0,
    wind_speed: 11.5,
    weather_condition: 'Scattered Clouds',
    imd_alert: {
      active: false,
      severity: '',
      event: '',
      message: 'No active IMD meteorological warnings for this region.'
    }
  };
}

export function getMockAnswer(question, location = 'Warangal', language = 'en') {
  const q = (question || '').toLowerCase();
  const loc = location || 'Warangal';

  // 1. Fisherman / Marine queries
  const isFisherman = q.includes('fish') || q.includes('boat') || q.includes('sea') || q.includes('marine') ||
                      q.includes('చేప') || q.includes('మత్స్య') || q.includes('मछुआरे') || q.includes('मछली');
  if (isFisherman) {
    if (language === 'te') {
      return `${loc} తీరంలో వాతావరణం అల్లకల్లోలంగా ఉండే అవకాశం ఉంది. గాలి వేగం మరియు అలల ఉధృతి ఎక్కువగా ఉండడం వల్ల సముద్రంలోకి వేటకు వెళ్లడం సురక్షితం కాదు. వాతావరణం అనుకూలించే వరకు వేటను వాయిదా వేయండి.`;
    }
    if (language === 'hi') {
      return `${loc} में तेज हवाओं और खराब मौसम के कारण समुद्र में जाना सुरक्षित नहीं है। मछुआरों को सलाह दी जाती है कि वे मौसम सामान्य होने तक समुद्र में न जाएं।`;
    }
    return `For fishermen in ${loc}, sea conditions are currently choppy with strong gusts. Venturing out to deep waters is not recommended today due to sudden squalls and high waves. Please keep boats safely docked until conditions stabilize.`;
  }

  // 2. Construction / Outdoor Painting / Masonry
  const isConstruction = q.includes('construct') || q.includes('paint') || q.includes('cement') || q.includes('roof') ||
                         q.includes('భవన') || q.includes('నిర్మాణం') || q.includes('रंगाई') || q.includes('निर्माण');
  if (isConstruction) {
    if (language === 'te') {
      return `${loc} లో ఈరోజు వర్షం పడే అవకాశం ఉన్నందున అవుట్‌డోర్ పెయింటింగ్ లేదా కాంక్రీట్ పనులకు ఆటంకం కలగవచ్చు. ఇండోర్ పనులు పూర్తి చేసుకోవడం మంచిది.`;
    }
    if (language === 'hi') {
      return `${loc} में बारिश की संभावना के कारण बाहरी निर्माण या पेंटिंग कार्य में रुकावट आ सकती है। इन कार्यों को शुष्क मौसम तक टालना बेहतर रहेगा।`;
    }
    return `Outdoor construction, painting, and roofing in ${loc} face rain disruption risks today. High humidity and showers may delay paint drying and wash uncured cement. Focus on indoor or sheltered tasks today.`;
  }

  // 3. Farming / Pesticide queries (ONLY when explicitly asked)
  const isFarming = q.includes('plant') || q.includes('sow') || q.includes('seed') || q.includes('spray') ||
                    q.includes('pesticide') || q.includes('fertilizer') || q.includes('crop') || q.includes('farm') ||
                    q.includes('విత్తనాలు') || q.includes('పురుగుమందులు') || q.includes('పంట') || q.includes('खेती') || q.includes('कीटनाशक');
  if (isFarming) {
    if (language === 'te') {
      return `${loc} లో వర్షం పడే అవకాశం ఎక్కువగా ఉన్నందున పురుగుమందుల పిచికారీ మరియు విత్తనాలు నాటే పనులను తాత్కాలికంగా వాయిదా వేయడం మంచిది. లేదంటే మందు వర్షపు నీటిలో కొట్టుకుపోతుంది.`;
    }
    if (language === 'hi') {
      return `${loc} में बारिश की संभावना के कारण आज कीटनाशक छिड़काव या बुवाई स्थगित करना उचित होगा, अन्यथा दवा धुल जाएगी।`;
    }
    return `Do NOT spray pesticides or fertilizers today in ${loc}. Impending rain will wash away chemical applications into runoff. Plan agricultural chemical spraying when at least 24 hours of dry weather are guaranteed.`;
  }

  // 4. General Rain & Commute
  if (q.includes('rain') || q.includes('వర్షం') || q.includes('बारिश')) {
    if (language === 'te') {
      return `అవును, ఈరోజు ${loc} లో వర్షం పడే అవకాశం ఉంది. ఉష్ణోగ్రత 28°C గా ఉండి, తేలికపాటి నుండి మోస్తరు జల్లులు కురవవచ్చు. బయటకు వెళ్ళేటప్పుడు గొడుగు వెంట తీసుకెళ్లండి.`;
    }
    if (language === 'hi') {
      return `हाँ, आज ${loc} में बारिश होने की संभावना है। तापमान लगभग 28°C रहेगा और हल्की से मध्यम फुहारें पड़ सकती हैं। बाहर जाते समय छाता अवश्य साथ रखें।`;
    }
    return `Yes, rain showers are expected today in ${loc}. Temperatures will stay near 28°C with gusty conditions. Be sure to carry an umbrella or raincoat if you are heading outdoors.`;
  }

  // 5. Temperature / General Weather
  if (language === 'te') {
    return `${loc} లో ప్రస్తుత ఉష్ణోగ్రత 28°C గా ఉంది, ఆకాశం మేఘావృతమై ఉంది. గాలి వేగం సాధారణంగా ఉంది.`;
  }
  if (language === 'hi') {
    return `${loc} में वर्तमान तापमान लगभग 28°C है और आकाश में बादल छाए हुए हैं। सामान्य मौसम बना रहेगा।`;
  }
  return `Current meteorological summary for ${loc}: Sky is partly cloudy to overcast with temperatures around 28°C and steady breezes. Standard outdoor activities can proceed with awareness of shifting skies.`;
}
