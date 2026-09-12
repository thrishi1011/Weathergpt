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

  // Multilingual responses
  if (language === 'te') {
    if (q.includes('rain') || q.includes('వర్షం') || q.includes('రేపు')) {
      return `రేపు ${loc} లో భారీ వర్షం పడే అవకాశం ఉంది (దాదాపు 75% సంభావ్యత). విత్తనాలు నాటడం లేదా పురుగుమందులు పిచికారీ చేయడం రెండు రోజులు వాయిదా వేయడం మంచిది.`;
    }
    return `${loc} వాతావరణ నివేదిక ప్రకారం ప్రస్తుతం ఉష్ణోగ్రత 28°C గా ఉంది, ఆకాశం మేఘావృతమై ఉంది. వ్యవసాయ పనులలో తగిన జాగ్రత్తలు పాటించండి.`;
  }

  if (language === 'hi') {
    if (q.includes('rain') || q.includes('बारिश') || q.includes('कल')) {
      return `कल ${loc} में गरज के साथ बारिश होने की 75% संभावना है। यदि आप बुवाई या कीटनाशक छिड़काव की योजना बना रहे हैं, तो इसे स्थगित करने की सलाह दी जाती है।`;
    }
    return `${loc} के लिए मौसम पूर्वानुमान: तापमान लगभग 28°C है और बादल छाए रहने की संभावना है।`;
  }

  // English default - Direct Humanoid Responses
  if (q.includes('today') && q.includes('rain')) {
    return `Yes, it will definitely rain today in ${loc}. Expect moderate to heavy thunderstorm showers between 3:30 PM and 6:00 PM (78% likelihood). It is safe to complete your morning commute and chores, but ensure you carry an umbrella for the evening and bring outdoor laundry inside before 1:00 PM.`;
  }

  if (q.includes('tomorrow') && q.includes('rain')) {
    return `Yes, rain is expected tomorrow in ${loc} with a 75% probability and thunderstorm activity peaking in the late afternoon. If you are planning field sowing, harvesting, or pesticide application, it is best to postpone those activities until skies settle.`;
  }

  if (q.includes('rain')) {
    return `Yes, rain showers and convective thunderstorms are likely in ${loc} today (around 78% probability). Most shower activity will develop between 3:30 PM and 6:00 PM with gusty winds.`;
  }

  if (q.includes('plant') || q.includes('sow') || q.includes('seed')) {
    return `Hold off on planting for the next 48 hours in ${loc}. With 18-22mm of precipitation forecasted, heavy rain may cause seed dislodgement and soil crusting in freshly sown furrows. Plan your sowing immediately once the thunderstorm spell clears.`;
  }

  if (q.includes('spray') || q.includes('pesticide') || q.includes('fertilizer')) {
    return `Do NOT spray pesticides or foliar fertilizers today in ${loc}. Upcoming afternoon rainfall will wash away chemical applications, wasting inputs and causing environmental runoff. Spray only when at least 24 hours of dry weather are guaranteed.`;
  }

  if (q.includes('temp') || q.includes('hot') || q.includes('cold') || q.includes('degree')) {
    return `Current temperature in ${loc} is 28.4°C with high relative humidity at 82%. Winds are steady from the southwest at 14.2 km/h. Maximum daytime high is expected to reach 31.0°C around 1:30 PM before showers bring temperatures down to 26.0°C.`;
  }

  return `Current meteorological summary for ${loc}: Sky is overcast with convective clouds forming. Rain probability stands at 75% with IMD thunderstorm alerts in effect. Complete outdoor tasks early and keep drainage paths unobstructed.`;
}
