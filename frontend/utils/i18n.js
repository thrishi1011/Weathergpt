/**
 * WeatherGPT client-side i18n.
 *
 * Chrome's built-in page translator cannot be invoked programmatically from a
 * normal web app. This module provides the same UX: selecting a language
 * translates the visible application UI, including DOM content rendered later
 * by the SPA. Backend-generated chat answers should still be requested in the
 * selected language.
 */

import { LANGUAGES, DEFAULT_LANGUAGE } from './languages.js';

const T = {
  te: {
    'Language:':'భాష:', 'Travel':'ప్రయాణం', 'Farming':'వ్యవసాయం', 'Outdoor':'బయటి కార్యకలాపాలు', 'Chat':'చాట్',
    'Travelling Mode':'ప్రయాణ మోడ్', 'Farming & Agro-Meteorology Mode':'వ్యవసాయం & వ్యవసాయ-వాతావరణ మోడ్',
    'Outdoor & Activity Mode':'బయటి కార్యకలాపాలు & సమయ మోడ్',
    'Agro & Atmospheric Intelligence':'వ్యవసాయ & వాతావరణ మేధస్సు',
    'AI-Powered Agro-Meteorological & Atmospheric Intelligence':'AI ఆధారిత వ్యవసాయ-వాతావరణ & వాతావరణ మేధస్సు',
    'Start Chatting':'చాట్ ప్రారంభించండి', 'Click anywhere or wait to enter...':'ఎక్కడైనా క్లిక్ చేయండి లేదా ప్రవేశించడానికి వేచి ఉండండి...',
    'Enter WeatherGPT ➔':'WeatherGPT లోకి ప్రవేశించండి ➔',
    'Save recovery link':'రికవరీ లింక్‌ను సేవ్ చేయండి', '🔗 Save recovery link':'🔗 రికవరీ లింక్‌ను సేవ్ చేయండి',
    'What would you like to know?':'మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?', 'Switch to specialized mode:':'ప్రత్యేక మోడ్‌కు మారండి:',
    'Travelling Mode':'ప్రయాణ మోడ్','Farming Mode':'వ్యవసాయ మోడ్','Outdoor Mode':'బయటి కార్యకలాపాల మోడ్',
    'Will it rain today?':'ఈరోజు వర్షం పడుతుందా?','Will it rain tomorrow?':'రేపు వర్షం పడుతుందా?',
    'Should I spray pesticide today?':'ఈరోజు పురుగుమందు పిచికారీ చేయాలా?','Show 24-hour rain graph':'24 గంటల వర్ష గ్రాఫ్ చూపించు',
    'Ask anything about weather... or click mic to speak':'వాతావరణం గురించి ఏదైనా అడగండి... లేదా మాట్లాడటానికి మైక్ క్లిక్ చేయండి',
    'Ask anything about the weather (e.g., \'Will it rain tomorrow?\')':'వాతావరణం గురించి ఏదైనా అడగండి (ఉదా., \'రేపు వర్షం పడుతుందా?\')',
    'Ask weather question':'వాతావరణ ప్రశ్న అడగండి','Voice input':'వాయిస్ ఇన్‌పుట్','Send query':'ప్రశ్న పంపండి',
    'Back to Chat':'చాట్‌కు తిరిగి వెళ్లండి','Journey Route & Transit Mode':'ప్రయాణ మార్గం & రవాణా మోడ్',
    'Enter your starting point, destination, and vehicle type to compute transit duration, weather hazards, and the most accurate departure time.':'ప్రయాణ సమయం, వాతావరణ ప్రమాదాలు మరియు సరైన బయలుదేరే సమయాన్ని తెలుసుకోవడానికి ప్రారంభ స్థానం, గమ్యం మరియు వాహన రకాన్ని నమోదు చేయండి.',
    'Current Location (Origin)':'ప్రస్తుత స్థానం (ప్రారంభం)','Destination Location':'గమ్యస్థానం',
    'Enter starting city...':'ప్రారంభ నగరాన్ని నమోదు చేయండి...','Enter destination city...':'గమ్య నగరాన్ని నమోదు చేయండి...',
    'Popular Routes:':'ప్రసిద్ధ మార్గాలు:','Mode of Transport':'రవాణా విధానం',
    'Car / SUV':'కారు / SUV','Two-Wheeler':'ద్విచక్ర వాహనం','Bus':'బస్సు','Train':'రైలు','Flight':'విమానం',
    'Analyze Route & Best Departure Time':'మార్గం & ఉత్తమ బయలుదేరు సమయాన్ని విశ్లేషించండి',
    'Route & Mode':'మార్గం & మోడ్','Route Distance':'మార్గ దూరం','Expected Transit Time':'అంచనా ప్రయాణ సమయం',
    'MOST ACCURATE TIME TO START':'ప్రారంభించడానికి అత్యంత సరైన సమయం','Optimal Window:':'సరైన సమయ పరిధి:',
    'Why this timing:':'ఈ సమయం ఎందుకు:','Avoid Departure:':'ఈ సమయంలో బయలుదేరవద్దు:',
    'Route Weather & Rain Likelihood by Hour':'గంటల వారీ మార్గ వాతావరణం & వర్ష అవకాశం',
    'Transit Corridor Weather & Safety Timeline':'రవాణా మార్గ వాతావరణం & భద్రతా టైమ్‌లైన్',
    'Farm & Crop Profile':'పొలం & పంట వివరాలు','Location of Agricultural Land':'వ్యవసాయ భూమి స్థానం',
    'Enter village, mandal or district...':'గ్రామం, మండలం లేదా జిల్లాను నమోదు చేయండి...','Type of Soil':'నేల రకం',
    'Target Crop':'ఎంచుకున్న పంట','Generate Agro-Advisory Plan':'వ్యవసాయ సలహా ప్రణాళిక రూపొందించండి',
    'Land Location':'భూమి స్థానం','Soil Profile':'నేల వివరాలు','Selected Crop':'ఎంచుకున్న పంట',
    '1. Best Sowing Time':'1. ఉత్తమ విత్తన సమయం','2. Best Irrigation Schedule':'2. ఉత్తమ నీటిపారుదల షెడ్యూల్',
    '3. Best Crop Cutting / Harvest Window':'3. ఉత్తమ పంట కోత / కోయే సమయ పరిధి',
    'Recommended Window: Within 48-72 hours post-rain':'సిఫార్సు సమయం: వర్షం తర్వాత 48-72 గంటల్లో',
    'Irrigation Status: PAUSE for 3 Days (Rain forecasted)':'నీటిపారుదల స్థితి: 3 రోజులు ఆపండి (వర్షం అంచనా)',
    'Safe Harvest Spell: Day 12 to 18 (Dry conditions)':'సురక్షిత కోత సమయం: 12వ రోజు నుంచి 18వ రోజు వరకు (పొడి పరిస్థితులు)',
    'Field Soil Moisture & Field Capacity':'నేల తేమ & ఫీల్డ్ సామర్థ్యం',
    'Available Soil Moisture':'అందుబాటులో ఉన్న నేల తేమ','Soil Aeration / Air Pores':'నేల గాలి ప్రసరణ / గాలి రంధ్రాలు',
    '7-Day Rainfall Forecast (Rain Probability %)':'7 రోజుల వర్ష అంచనా (వర్ష అవకాశం %)',
    'Outdoor Activity & Timing':'బయటి కార్యకలాపాలు & సమయం','Activity Location':'కార్యకలాప స్థానం',
    'Enter city or area...':'నగరం లేదా ప్రాంతాన్ని నమోదు చేయండి...','What is your planned activity?':'మీరు ఏ కార్యకలాపాన్ని ప్లాన్ చేస్తున్నారు?',
    'Planned Time Window':'ప్రణాళిక చేసిన సమయ పరిధి','Check Umbrella, Outfit & Schedule':'గొడుగు, దుస్తులు & షెడ్యూల్ తనిఖీ చేయండి',
    'DEFINITELY CARRY AN UMBRELLA':'తప్పకుండా గొడుగు తీసుకెళ్లండి','NO UMBRELLA NEEDED':'గొడుగు అవసరం లేదు',
    'High Rain Likelihood':'వర్షం పడే అవకాశం ఎక్కువ','Clear & Dry Weather':'ఆకాశం స్పష్టంగా, పొడి వాతావరణం',
    'Recommended Schedule Modification':'సిఫార్సు చేసిన షెడ్యూల్ మార్పు','Schedule Timing is Optimal':'షెడ్యూల్ సమయం సరైనది',
    'Recommended Clothes & Gear':'సిఫార్సు చేసిన దుస్తులు & సామగ్రి','Water-Resistant Shoes':'నీటి నిరోధక షూస్',
    'Breathable Cap':'గాలి ప్రసరణ ఉన్న క్యాప్','UV Sunglasses':'UV సన్‌గ్లాసెస్','Compact Umbrella':'చిన్న గొడుగు',
    'TARGET LOCATION':'లక్ష్య స్థానం','Target Location':'లక్ష్య స్థానం','Current Location:':'ప్రస్తుత స్థానం:','Enter city or district...':'నగరం లేదా జిల్లా నమోదు చేయండి...',
    'Detected:':'గుర్తించబడింది:','via GPS':'GPS ద్వారా','Detected: Warangal via GPS':'GPS ద్వారా వరంగల్ గుర్తించబడింది',
    'Humidity':'తేమ','HUMIDITY':'తేమ','Wind':'గాలి','WIND':'గాలి','Rainfall':'వర్షపాతం','RAINFALL':'వర్షపాతం','Rain Probability':'వర్ష అవకాశం',
    'Relative Humidity':'సాపేక్ష ఆర్ద్రత','Wind Velocity':'గాలి వేగం','24h Rainfall':'24 గంటల వర్షపాతం',
    'Light drizzle':'తేలికపాటి జల్లులు','Heavy rain':'భారీ వర్షం','Moderate rain':'మోస్తరు వర్షం','Overcast':'మేఘావృతం','Clear sky':'నిర్మల ఆకాశం',
    'Unknown Station':'తెలియని స్టేషన్','Normal':'సాధారణ','Weather Warning':'వాతావరణ హెచ్చరిక',
    'Advisory issued by India Meteorological Department.':'భారత వాతావరణ శాఖ జారీ చేసిన సలహా.',
    'IMD Status: No severe weather warnings active.':'IMD స్థితి: తీవ్రమైన వాతావరణ హెచ్చరికలు ప్రస్తుతం లేవు.',
    'Updating...':'నవీకరిస్తోంది...','Copy':'కాపీ','Copied':'కాపీ అయింది','Listen':'వినండి','Stop':'ఆపు',
    'WeatherGPT is evaluating radar & meteorological data...':'WeatherGPT రాడార్ & వాతావరణ డేటాను విశ్లేషిస్తోంది...',
    'Checking Backend...':'బ్యాక్‌ఎండ్‌ను తనిఖీ చేస్తోంది...','Backend: Connected':'బ్యాక్‌ఎండ్: కనెక్ట్ అయింది',
    'Backend: Demo Mode':'బ్యాక్‌ఎండ్: డెమో మోడ్','Connection Issue':'కనెక్షన్ సమస్య','Advisory':'సలహా','Success':'విజయం','Notification':'నోటిఫికేషన్',
    'Dismiss toast':'సందేశాన్ని మూసివేయండి','Use my current GPS location':'నా ప్రస్తుత GPS స్థానాన్ని ఉపయోగించండి',
    'Search History':'శోధన చరిత్ర','No history yet':'ఇంకా చరిత్ర లేదు','Clear history':'చరిత్ర తొలగించు',
    'Loading telemetry...':'టెలిమెట్రీ లోడ్ అవుతోంది...','Ask direct questions about rainfall, storms, or temperature. WeatherGPT provides direct humanoid answers, clear advice on what you can and cannot do, and precise charts.':'వర్షపాతం, తుఫాన్లు లేదా ఉష్ణోగ్రత గురించి నేరుగా ప్రశ్నలు అడగండి. WeatherGPT స్పష్టమైన సమాధానాలు, మీరు చేయగలిగేది మరియు చేయలేనిది గురించి సలహాలు, మరియు ఖచ్చితమైన చార్టులు అందిస్తుంది.',
    'Yes, it will definitely rain today.':'అవును, నేడు తప్పకుండా వర్షం పడుతుంది.','No rain is expected today.':'నేడు వర్షం అంచనా లేదు.',
    'Likelihood:':'అవకాశం:','Expected Window:':'అంచనా సమయం:',
    '✅ What you CAN do:':'✅ మీరు చేయగలిగేది:','❌ What to AVOID:':'❌ నివారించవలసినవి:',
    'Finish morning outdoor chores and travel before 2:00 PM.':'ఉదయం బయటి పనులు పూర్తి చేసి మధ్యాహ్నం 2:00 కంటే ముందు ప్రయాణించండి.',
    'Keep field drainage channels open to absorb natural rain.':'సహజ వర్షాన్ని శోషించడానికి పొలం배수 చానళ్లు తెరిచి ఉంచండి.',
    'Carry a light umbrella if returning home in the evening.':'సాయంత్రం ఇంటికి వస్తే తేలికైన గొడుగు తీసుకెళ్లండి.',
    'Avoid hanging laundry outside after 1:00 PM.':'మధ్యాహ్నం 1:00 తర్వాత బట్టలు బయట ఆరేయవద్దు.',
    'Do NOT spray pesticides or fertilizers (will wash away).':'పురుగుమందులు లేదా ఎరువులు పిచికారీ చేయకండి (కొట్టుకుపోతాయి).',
    'Avoid two-wheeler highway travel during 3:30 PM – 6:00 PM squalls.':'మధ్యాహ్నం 3:30 – సాయంత్రం 6:00 మధ్య రెండు చక్రాల వాహన హైవే ప్రయాణం నివారించండి.',
    '📊 Rain Probability & Temperature Curve':'📊 వర్ష అవకాశం & ఉష్ణోగ్రత వక్రం',
    'Ask anything about the weather (e.g., \'Will it rain tomorrow?\')':'వాతావరణం గురించి ఏదైనా అడగండి (ఉదా., \'రేపు వర్షం పడుతుందా?\')'
  },
  hi: {
    'Language:':'भाषा:','Travel':'यात्रा','Farming':'कृषि','Outdoor':'आउटडोर','Chat':'चैट','Travelling Mode':'यात्रा मोड',
    'Farming & Agro-Meteorology Mode':'कृषि और कृषि-मौसम विज्ञान मोड','Outdoor & Activity Mode':'आउटडोर और गतिविधि मोड',
    'Agro & Atmospheric Intelligence':'कृषि और वायुमंडलीय बुद्धिमत्ता','AI-Powered Agro-Meteorological & Atmospheric Intelligence':'AI आधारित कृषि-मौसम और वायुमंडलीय बुद्धिमत्ता',
    'Start Chatting':'चैट शुरू करें','Click anywhere or wait to enter...':'कहीं भी क्लिक करें या प्रवेश के लिए प्रतीक्षा करें...',
    'Enter WeatherGPT ➔':'WeatherGPT में प्रवेश करें ➔',
    'Save recovery link':'रिकवरी लिंक सहेजें', '🔗 Save recovery link':'🔗 रिकवरी लिंक सहेजें',
    'What would you like to know?':'आप क्या जानना चाहते हैं?','Switch to specialized mode:':'विशेष मोड पर जाएँ:',
    'Travelling Mode':'यात्रा मोड','Farming Mode':'कृषि मोड','Outdoor Mode':'आउटडोर मोड','Will it rain today?':'क्या आज बारिश होगी?',
    'Will it rain tomorrow?':'क्या कल बारिश होगी?','Should I spray pesticide today?':'क्या आज कीटनाशक का छिड़काव करना चाहिए?',
    'Show 24-hour rain graph':'24 घंटे का वर्षा ग्राफ दिखाएँ','Ask weather question':'मौसम संबंधी प्रश्न पूछें',
    'Ask anything about weather... or click mic to speak':'मौसम के बारे में कुछ भी पूछें... या बोलने के लिए माइक पर क्लिक करें',
    'Ask anything about the weather (e.g., \'Will it rain tomorrow?\')':'मौसम के बारे में कुछ भी पूछें (उदा., \'क्या कल बारिश होगी?\')',
    'Voice input':'वॉइस इनपुट','Send query':'प्रश्न भेजें','Back to Chat':'चैट पर वापस जाएँ','Journey Route & Transit Mode':'यात्रा मार्ग और परिवहन मोड',
    'Current Location (Origin)':'वर्तमान स्थान (प्रारंभ)','Destination Location':'गंतव्य स्थान','Popular Routes:':'लोकप्रिय मार्ग:',
    'Mode of Transport':'परिवहन का साधन','Car / SUV':'कार / SUV','Two-Wheeler':'दोपहिया','Bus':'बस','Train':'ट्रेन','Flight':'उड़ान',
    'Analyze Route & Best Departure Time':'मार्ग और सर्वोत्तम प्रस्थान समय का विश्लेषण करें','Route & Mode':'मार्ग और मोड',
    'Route Distance':'मार्ग दूरी','Expected Transit Time':'अनुमानित यात्रा समय','MOST ACCURATE TIME TO START':'शुरू करने का सबसे सही समय',
    'Optimal Window:':'सर्वोत्तम समय-सीमा:','Why this timing:':'यह समय क्यों:','Avoid Departure:':'इस समय प्रस्थान से बचें:',
    'Route Weather & Rain Likelihood by Hour':'घंटे के अनुसार मार्ग मौसम और बारिश की संभावना',
    'Transit Corridor Weather & Safety Timeline':'परिवहन मार्ग मौसम और सुरक्षा टाइमलाइन','Farm & Crop Profile':'खेत और फसल प्रोफ़ाइल',
    'Location of Agricultural Land':'कृषि भूमि का स्थान','Type of Soil':'मिट्टी का प्रकार','Target Crop':'लक्षित फसल',
    'Generate Agro-Advisory Plan':'कृषि सलाह योजना बनाएँ','Land Location':'भूमि स्थान','Soil Profile':'मिट्टी प्रोफ़ाइल','Selected Crop':'चयनित फसल',
    '1. Best Sowing Time':'1. सर्वोत्तम बुवाई समय','2. Best Irrigation Schedule':'2. सर्वोत्तम सिंचाई कार्यक्रम',
    '3. Best Crop Cutting / Harvest Window':'3. सर्वोत्तम फसल कटाई / हार्वेस्ट समय','Recommended Window: Within 48-72 hours post-rain':'अनुशंसित समय: बारिश के 48-72 घंटे के भीतर',
    'Irrigation Status: PAUSE for 3 Days (Rain forecasted)':'सिंचाई स्थिति: 3 दिनों के लिए रोकें (बारिश का पूर्वानुमान)',
    'Safe Harvest Spell: Day 12 to 18 (Dry conditions)':'सुरक्षित कटाई अवधि: दिन 12 से 18 (शुष्क परिस्थितियाँ)',
    'Field Soil Moisture & Field Capacity':'मिट्टी की नमी और फील्ड क्षमता','Available Soil Moisture':'उपलब्ध मिट्टी की नमी',
    'Soil Aeration / Air Pores':'मिट्टी का वातन / वायु छिद्र','7-Day Rainfall Forecast (Rain Probability %)':'7-दिन का वर्षा पूर्वानुमान (वर्षा संभावना %)',
    'Outdoor Activity & Timing':'आउटडोर गतिविधि और समय','Activity Location':'गतिविधि स्थान','What is your planned activity?':'आपकी नियोजित गतिविधि क्या है?',
    'Planned Time Window':'नियोजित समय अवधि','Check Umbrella, Outfit & Schedule':'छाता, पोशाक और शेड्यूल जाँचें',
    'DEFINITELY CARRY AN UMBRELLA':'छाता ज़रूर साथ रखें','NO UMBRELLA NEEDED':'छाते की आवश्यकता नहीं',
    'High Rain Likelihood':'बारिश की अधिक संभावना','Clear & Dry Weather':'साफ़ और शुष्क मौसम','Recommended Schedule Modification':'अनुशंसित शेड्यूल बदलाव',
    'Schedule Timing is Optimal':'शेड्यूल का समय सर्वोत्तम है','Recommended Clothes & Gear':'अनुशंसित कपड़े और सामान',
    'Water-Resistant Shoes':'पानी-रोधी जूते','Breathable Cap':'हवादार कैप','UV Sunglasses':'UV धूप का चश्मा','Compact Umbrella':'छोटा छाता',
    'TARGET LOCATION':'लक्षित स्थान','Target Location':'लक्षित स्थान','Current Location:':'वर्तमान स्थान:','Enter city or district...':'शहर या ज़िला दर्ज करें...',
    'Detected:':'पता लगाया गया:','via GPS':'GPS के माध्यम से','Detected: Warangal via GPS':'GPS के माध्यम से वारंगल का पता चला',
    'Humidity':'आर्द्रता','HUMIDITY':'आर्द्रता','Wind':'हवा','WIND':'हवा','Rainfall':'वर्षा','RAINFALL':'वर्षा','Rain Probability':'वर्षा की संभावना',
    'Relative Humidity':'सापेक्ष आर्द्रता','Wind Velocity':'हवा की गति','24h Rainfall':'24 घंटे की वर्षा',
    'Light drizzle':'हल्की बूंदाबांदी','Heavy rain':'भारी बारिश','Moderate rain':'मध्यम बारिश','Overcast':'बादल छाए हुए','Clear sky':'साफ़ आसमान',
    'Unknown Station':'अज्ञात स्टेशन','Normal':'सामान्य',
    'Weather Warning':'मौसम चेतावनी','Advisory issued by India Meteorological Department.':'भारत मौसम विज्ञान विभाग द्वारा जारी सलाह।',
    'IMD Status: No severe weather warnings active.':'IMD स्थिति: कोई गंभीर मौसम चेतावनी सक्रिय नहीं है।','Updating...':'अपडेट हो रहा है...',
    'Copy':'कॉपी','Copied':'कॉपी हो गया','Listen':'सुनें','Stop':'रोकें','WeatherGPT is evaluating radar & meteorological data...':'WeatherGPT रडार और मौसम संबंधी डेटा का विश्लेषण कर रहा है...',
    'Checking Backend...':'बैकएंड जाँचा जा रहा है...','Backend: Connected':'बैकएंड: कनेक्टेड','Backend: Demo Mode':'बैकएंड: डेमो मोड',
    'Connection Issue':'कनेक्शन समस्या','Advisory':'सलाह','Success':'सफलता','Notification':'सूचना','Dismiss toast':'संदेश बंद करें','Use my current GPS location':'मेरे वर्तमान GPS स्थान का उपयोग करें',
    'Search History':'खोज इतिहास','No history yet':'अभी तक कोई इतिहास नहीं','Clear history':'इतिहास साफ़ करें',
    'Loading telemetry...':'टेलीमेट्री लोड हो रही है...','Ask direct questions about rainfall, storms, or temperature. WeatherGPT provides direct humanoid answers, clear advice on what you can and cannot do, and precise charts.':'वर्षा, तूफान या तापमान के बारे में सीधे प्रश्न पूछें। WeatherGPT सीधे उत्तर, स्पष्ट सलाह और सटीक चार्ट प्रदान करता है।',
    'Yes, it will definitely rain today.':'हाँ, आज बारिश ज़रूर होगी.','No rain is expected today.':'आज बारिश की उम्मीद नहीं है.',
    'Likelihood:':'संभावना:','Expected Window:':'अपेक्षित समय सीमा:',
    '✅ What you CAN do:':'✅ आप क्या कर सकते हैं:','❌ What to AVOID:':'❌ क्या टालें:',
    'Finish morning outdoor chores and travel before 2:00 PM.':'सुबह के बाहरी काम निपटाएं और दोपहर 2:00 बजे से पहले यात्रा करें.',
    'Keep field drainage channels open to absorb natural rain.':'प्राकृतिक वर्षा को सोखने के लिए खेत की नालियाँ खुली रखें.',
    'Carry a light umbrella if returning home in the evening.':'शाम को घर लौटते समय हल्का छाता साथ रखें.',
    'Avoid hanging laundry outside after 1:00 PM.':'दोपहर 1:00 बजे के बाद बाहर कपड़े न सुखाएं.',
    'Do NOT spray pesticides or fertilizers (will wash away).':'कीटनाशक या उर्वरक का छिड़काव न करें (बह जाएंगे).',
    'Avoid two-wheeler highway travel during 3:30 PM – 6:00 PM squalls.':'दोपहर 3:30 – शाम 6:00 बजे के बीच दोपहिया राजमार्ग यात्रा से बचें.',
    '📊 Rain Probability & Temperature Curve':'📊 वर्षा संभावना और तापमान वक्र'
  },
  ta: {
    'Language:':'மொழி:','Travel':'பயணம்','Farming':'விவசாயம்','Outdoor':'வெளிப்புறம்','Chat':'அரட்டை','Travelling Mode':'பயண முறை',
    'Farming & Agro-Meteorology Mode':'விவசாயம் & வேளாண் வானிலை முறை','Outdoor & Activity Mode':'வெளிப்புற & செயல்பாட்டு முறை',
    'Agro & Atmospheric Intelligence':'வேளாண் & வளிமண்டல நுண்ணறிவு','AI-Powered Agro-Meteorological & Atmospheric Intelligence':'AI சார்ந்த வேளாண்-வானிலை & வளிமண்டல நுண்ணறிவு',
    'Start Chatting':'அரட்டையைத் தொடங்குங்கள்','Click anywhere or wait to enter...':'எங்கும் கிளிக் செய்யவும் அல்லது நுழைய காத்திருக்கவும்...',
    'Enter WeatherGPT ➔':'WeatherGPT க்குள் நுழையவும் ➔',
    'Save recovery link':'மீட்பு இணைப்பைச் சேமிக்கவும்', '🔗 Save recovery link':'🔗 மீட்பு இணைப்பைச் சேமிக்கவும்',
    'What would you like to know?':'நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?','Switch to specialized mode:':'சிறப்பு முறைக்கு மாறவும்:',
    'Travelling Mode':'பயண முறை','Farming Mode':'விவசாய முறை','Outdoor Mode':'வெளிப்புற முறை','Will it rain today?':'இன்று மழை பெய்யுமா?',
    'Will it rain tomorrow?':'நாளை மழை பெய்யுமா?','Should I spray pesticide today?':'இன்று பூச்சிக்கொல்லி தெளிக்கலாமா?',
    'Show 24-hour rain graph':'24 மணி நேர மழை வரைபடத்தைக் காட்டு','Ask weather question':'வானிலை கேள்வியைக் கேளுங்கள்',
    'Ask anything about weather... or click mic to speak':'வானிலை பற்றி ஏதேனும் கேட்கவும்... அல்லது பேச மைக் அழுத்தவும்',
    'Ask anything about the weather (e.g., \'Will it rain tomorrow?\')':'வானிலை பற்றி எதையும் கேளுங்கள் (எ.கா., \'நாளை மழை பெய்யுமா?\')',
    'Voice input':'குரல் உள்ளீடு','Send query':'கேள்வியை அனுப்பவும்','Back to Chat':'அரட்டைக்குத் திரும்பு','Journey Route & Transit Mode':'பயண பாதை & போக்குவரத்து முறை',
    'Current Location (Origin)':'தற்போதைய இடம் (தொடக்கம்)','Destination Location':'செல்லும் இடம்','Popular Routes:':'பிரபலமான பாதைகள்:',
    'Mode of Transport':'போக்குவரத்து முறை','Car / SUV':'கார் / SUV','Two-Wheeler':'இருசக்கர வாகனம்','Bus':'பேருந்து','Train':'ரயில்','Flight':'விமானம்',
    'Analyze Route & Best Departure Time':'பாதை & சிறந்த புறப்படும் நேரத்தை பகுப்பாய்வு செய்','Route & Mode':'பாதை & முறை','Route Distance':'பாதை தூரம்',
    'Expected Transit Time':'எதிர்பார்க்கப்படும் பயண நேரம்','MOST ACCURATE TIME TO START':'தொடங்குவதற்கான மிகச் சரியான நேரம்','Optimal Window:':'சிறந்த நேர வரம்பு:',
    'Why this timing:':'இந்த நேரம் ஏன்:','Avoid Departure:':'இந்த நேரத்தில் புறப்படுவதைத் தவிர்க்கவும்','Route Weather & Rain Likelihood by Hour':'மணி வாரியான பாதை வானிலை & மழை வாய்ப்பு',
    'Transit Corridor Weather & Safety Timeline':'போக்குவரத்து பாதை வானிலை & பாதுகாப்பு காலவரிசை','Farm & Crop Profile':'பண்ணை & பயிர் சுயவிவரம்',
    'Location of Agricultural Land':'விவசாய நிலத்தின் இடம்','Type of Soil':'மண் வகை','Target Crop':'தேர்ந்தெடுக்கப்பட்ட பயிர்','Generate Agro-Advisory Plan':'வேளாண் ஆலோசனைத் திட்டத்தை உருவாக்கு',
    'Land Location':'நிலத்தின் இடம்','Soil Profile':'மண் சுயவிவரம்','Selected Crop':'தேர்ந்தெடுக்கப்பட்ட பயிர்','1. Best Sowing Time':'1. சிறந்த விதைப்பு நேரம்',
    '2. Best Irrigation Schedule':'2. சிறந்த நீர்ப்பாசன அட்டவணை','3. Best Crop Cutting / Harvest Window':'3. சிறந்த அறுவடை நேரம்',
    'Recommended Window: Within 48-72 hours post-rain':'பரிந்துரைக்கப்படும் நேரம்: மழைக்குப் பிறகு 48-72 மணி நேரத்திற்குள்',
    'Irrigation Status: PAUSE for 3 Days (Rain forecasted)':'நீர்ப்பாசன நிலை: 3 நாட்கள் நிறுத்தவும் (மழை முன்னறிவிப்பு)',
    'Safe Harvest Spell: Day 12 to 18 (Dry conditions)':'பாதுகாப்பான அறுவடை காலம்: நாள் 12 முதல் 18 வரை (வறண்ட நிலை)',
    'Field Soil Moisture & Field Capacity':'மண் ஈரப்பதம் & களத் திறன்','Available Soil Moisture':'கிடைக்கும் மண் ஈரப்பதம்',
    'Soil Aeration / Air Pores':'மண் காற்றோட்டம் / காற்றுத் துளைகள்','7-Day Rainfall Forecast (Rain Probability %)':'7 நாள் மழை முன்னறிவிப்பு (மழை வாய்ப்பு %)',
    'Outdoor Activity & Timing':'வெளிப்புற செயல்பாடு & நேரம்','Activity Location':'செயல்பாட்டு இடம்','What is your planned activity?':'உங்கள் திட்டமிட்ட செயல்பாடு என்ன?',
    'Planned Time Window':'திட்டமிட்ட நேர வரம்பு','Check Umbrella, Outfit & Schedule':'குடை, உடை & அட்டவணையைச் சரிபார்க்கவும்',
    'DEFINITELY CARRY AN UMBRELLA':'கண்டிப்பாக குடை எடுத்துச் செல்லுங்கள்','NO UMBRELLA NEEDED':'குடை தேவையில்லை','High Rain Likelihood':'அதிக மழை வாய்ப்பு',
    'Clear & Dry Weather':'தெளிவான & வறண்ட வானிலை','Recommended Schedule Modification':'பரிந்துரைக்கப்படும் அட்டவணை மாற்றம்','Schedule Timing is Optimal':'அட்டவணை நேரம் சிறந்தது',
    'Recommended Clothes & Gear':'பரிந்துரைக்கப்படும் உடைகள் & உபகரணங்கள்','Water-Resistant Shoes':'நீர் எதிர்ப்பு காலணிகள்','Breathable Cap':'காற்றோட்டமான தொப்பி',
    'UV Sunglasses':'UV சன்கிளாஸ்','Compact Umbrella':'சிறிய குடை',
    'TARGET LOCATION':'இலக்கு இடம்','Target Location':'இலக்கு இடம்','Current Location:':'தற்போதைய இடம்:','Enter city or district...':'நகரம் அல்லது மாவட்டத்தை உள்ளிடவும்...',
    'Detected:':'கண்டறியப்பட்டது:','via GPS':'GPS வழியாக','Detected: Warangal via GPS':'GPS வழியாக வாரங்கல் கண்டறியப்பட்டது',
    'Humidity':'ஈரப்பதம்','HUMIDITY':'ஈரப்பதம்','Wind':'காற்று','WIND':'காற்று','Rainfall':'மழைப்பொழிவு','RAINFALL':'மழைப்பொழிவு',
    'Rain Probability':'மழை வாய்ப்பு','Relative Humidity':'சார்பு ஈரப்பதம்','Wind Velocity':'காற்றின் வேகம்','24h Rainfall':'24 மணி நேர மழைப்பொழிவு',
    'Light drizzle':'லேசான தூறல்','Heavy rain':'கனமழை','Moderate rain':'மிதமான மழை','Overcast':'மேகமூட்டம்','Clear sky':'தெளிவான வானம்',
    'Unknown Station':'அறியப்படாத நிலையம்','Normal':'இயல்பு','Weather Warning':'வானிலை எச்சரிக்கை','Advisory issued by India Meteorological Department.':'இந்திய வானிலை ஆய்வு மையம் வழங்கிய ஆலோசனை.',
    'IMD Status: No severe weather warnings active.':'IMD நிலை: கடுமையான வானிலை எச்சரிக்கைகள் எதுவும் செயல்பாட்டில் இல்லை.','Updating...':'புதுப்பிக்கப்படுகிறது...',
    'Copy':'நகலெடு','Copied':'நகலெடுக்கப்பட்டது','Listen':'கேள்','Stop':'நிறுத்து','WeatherGPT is evaluating radar & meteorological data...':'WeatherGPT ரேடார் & வானிலைத் தரவை பகுப்பாய்வு செய்கிறது...',
    'Checking Backend...':'பின்தளத்தைச் சரிபார்க்கிறது...','Backend: Connected':'பின்தளம்: இணைக்கப்பட்டது','Backend: Demo Mode':'பின்தளம்: டெமோ முறை',
    'Connection Issue':'இணைப்பு சிக்கல்','Advisory':'ஆலோசனை','Success':'வெற்றி','Notification':'அறிவிப்பு','Dismiss toast':'செய்தியை மூடு','Use my current GPS location':'எனது தற்போதைய GPS இடத்தைப் பயன்படுத்து',
    'Search History':'தேடல் வரலாறு','No history yet':'இன்னும் வரலாறு இல்லை','Clear history':'வரலாற்றை அழி',
    'Loading telemetry...':'டெலிமெட்ரி ஏற்றப்படுகிறது...','Ask direct questions about rainfall, storms, or temperature. WeatherGPT provides direct humanoid answers, clear advice on what you can and cannot do, and precise charts.':'மழை, புயல் அல்லது வெப்பநிலை பற்றி நேரடியாக கேளுங்கள். WeatherGPT தெளிவான பதில்கள், ஆலோசனைகள் மற்றும் துல்லியமான வரைபடங்கள் வழங்குகிறது.',
    'Yes, it will definitely rain today.':'ஆம், இன்று நிச்சயமாக மழை பெய்யும்.','No rain is expected today.':'இன்று மழை எதிர்பார்க்கப்படவில்லை.',
    'Likelihood:':'வாய்ப்பு:','Expected Window:':'எதிர்பார்க்கப்படும் நேரம்:',
    '✅ What you CAN do:':'✅ நீங்கள் செய்யலாம்:','❌ What to AVOID:':'❌ தவிர்க்க வேண்டியவை:',
    'Finish morning outdoor chores and travel before 2:00 PM.':'காலை வெளி வேலைகளை முடித்து பிற்பகல் 2:00 மணிக்கு முன் பயணியுங்கள்.',
    'Keep field drainage channels open to absorb natural rain.':'இயற்கை மழையை உறிஞ்ச வயல் வடிகால்களை திறந்து வையுங்கள்.',
    'Carry a light umbrella if returning home in the evening.':'மாலையில் வீடு திரும்பினால் இலகுரக குடை கொண்டு செல்லுங்கள்.',
    'Avoid hanging laundry outside after 1:00 PM.':'பிற்பகல் 1:00 மணிக்கு பிறகு வெளியில் துணி காயப் போடவேண்டாம்.',
    'Do NOT spray pesticides or fertilizers (will wash away).':'பூச்சிக்கொல்லி அல்லது உரங்களை தெளிக்கவேண்டாம் (கழுவிச் செல்லும்).',
    'Avoid two-wheeler highway travel during 3:30 PM – 6:00 PM squalls.':'பிற்பகல் 3:30 – மாலை 6:00 இடையே இருசக்கர வாகனத்தில் நெடுஞ்சாலை பயணம் தவிர்க்கவும்.',
    '📊 Rain Probability & Temperature Curve':'📊 மழை வாய்ப்பு மற்றும் வெப்பநிலை வளைவு'
  },
  kn: {
    'Language:':'ಭಾಷೆ:','Travel':'ಪ್ರಯಾಣ','Farming':'ಕೃಷಿ','Outdoor':'ಹೊರಾಂಗಣ','Chat':'ಚಾಟ್','Travelling Mode':'ಪ್ರಯಾಣ ಮೋಡ್',
    'Farming & Agro-Meteorology Mode':'ಕೃಷಿ ಮತ್ತು ಕೃಷಿ-ಹವಾಮಾನ ಮೋಡ್','Outdoor & Activity Mode':'ಹೊರಾಂಗಣ ಮತ್ತು ಚಟುವಟಿಕೆ ಮೋಡ್',
    'Agro & Atmospheric Intelligence':'ಕೃಷಿ ಮತ್ತು ವಾತಾವರಣದ ಬುದ್ಧಿಮತ್ತೆ','AI-Powered Agro-Meteorological & Atmospheric Intelligence':'AI ಆಧಾರಿತ ಕೃಷಿ-ಹವಾಮಾನ ಮತ್ತು ವಾತಾವರಣದ ಬುದ್ಧಿಮತ್ತೆ',
    'Start Chatting':'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ','Click anywhere or wait to enter...':'ಎಲ್ಲಿಯಾದರೂ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಪ್ರವೇಶಿಸಲು ಕಾಯಿರಿ...',
    'Enter WeatherGPT ➔':'WeatherGPT ಪ್ರವೇಶಿಸಿ ➔',
    'Save recovery link':'ಮರುಪಡೆಯುವಿಕೆ ಲಿಂಕ್ ಉಳಿಸಿ', '🔗 Save recovery link':'🔗 ಮರುಪಡೆಯುವಿಕೆ ಲಿಂಕ್ ಉಳಿಸಿ',
    'What would you like to know?':'ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?','Switch to specialized mode:':'ವಿಶೇಷ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ:',
    'Travelling Mode':'ಪ್ರಯಾಣ ಮೋಡ್','Farming Mode':'ಕೃಷಿ ಮೋಡ್','Outdoor Mode':'ಹೊರಾಂಗಣ ಮೋಡ್','Will it rain today?':'ಇಂದು ಮಳೆಯಾಗುತ್ತದೆಯೇ?',
    'Will it rain tomorrow?':'ನಾಳೆ ಮಳೆಯಾಗುತ್ತದೆಯೇ?','Should I spray pesticide today?':'ಇಂದು ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಬೇಕೇ?',
    'Show 24-hour rain graph':'24 ಗಂಟೆಗಳ ಮಳೆ ಗ್ರಾಫ್ ತೋರಿಸಿ','Ask weather question':'ಹವಾಮಾನ ಪ್ರಶ್ನೆ ಕೇಳಿ','Voice input':'ಧ್ವನಿ ಇನ್‌ಪುಟ್','Send query':'ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ',
    'Ask anything about weather... or click mic to speak':'ಹವಾಮಾನದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ... ಅಥವಾ ಮಾತನಾಡಲು ಮೈಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ',
    'Ask anything about the weather (e.g., \'Will it rain tomorrow?\')':'ಹವಾಮಾನದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ (ಉದಾ., \'ನಾಳೆ ಮಳೆಯಾಗುತ್ತದೆಯೇ?\')',
    'Back to Chat':'ಚಾಟ್‌ಗೆ ಹಿಂತಿರುಗಿ','Journey Route & Transit Mode':'ಪ್ರಯಾಣ ಮಾರ್ಗ ಮತ್ತು ಸಾರಿಗೆ ಮೋಡ್','Current Location (Origin)':'ಪ್ರಸ್ತುತ ಸ್ಥಳ (ಆರಂಭ)',
    'Destination Location':'ಗಮ್ಯಸ್ಥಾನ','Popular Routes:':'ಜನಪ್ರಿಯ ಮಾರ್ಗಗಳು:','Mode of Transport':'ಸಾರಿಗೆ ವಿಧಾನ','Car / SUV':'ಕಾರು / SUV','Two-Wheeler':'ದ್ವಿಚಕ್ರ ವಾಹನ',
    'Bus':'ಬಸ್','Train':'ರೈಲು','Flight':'ವಿಮಾನ','Analyze Route & Best Departure Time':'ಮಾರ್ಗ ಮತ್ತು ಉತ್ತಮ ನಿರ್ಗಮನ ಸಮಯವನ್ನು ವಿಶ್ಲೇಷಿಸಿ','Route & Mode':'ಮಾರ್ಗ ಮತ್ತು ಮೋಡ್',
    'Route Distance':'ಮಾರ್ಗದ ದೂರ','Expected Transit Time':'ನಿರೀಕ್ಷಿತ ಪ್ರಯಾಣ ಸಮಯ','MOST ACCURATE TIME TO START':'ಪ್ರಾರಂಭಿಸಲು ಅತ್ಯಂತ ಸೂಕ್ತ ಸಮಯ','Optimal Window:':'ಸೂಕ್ತ ಸಮಯದ ಅವಧಿ:',
    'Why this timing:':'ಈ ಸಮಯ ಏಕೆ:','Avoid Departure:':'ಈ ಸಮಯದಲ್ಲಿ ಹೊರಡುವುದನ್ನು ತಪ್ಪಿಸಿ','Route Weather & Rain Likelihood by Hour':'ಗಂಟೆಯಂತೆ ಮಾರ್ಗ ಹವಾಮಾನ ಮತ್ತು ಮಳೆಯ ಸಾಧ್ಯತೆ',
    'Transit Corridor Weather & Safety Timeline':'ಸಾರಿಗೆ ಮಾರ್ಗ ಹವಾಮಾನ ಮತ್ತು ಸುರಕ್ಷತಾ ಕಾಲರೇಖೆ','Farm & Crop Profile':'ಹೊಲ ಮತ್ತು ಬೆಳೆ ವಿವರ',
    'Location of Agricultural Land':'ಕೃಷಿ ಭೂಮಿಯ ಸ್ಥಳ','Type of Soil':'ಮಣ್ಣಿನ ವಿಧ','Target Crop':'ಆಯ್ದ ಬೆಳೆ','Generate Agro-Advisory Plan':'ಕೃಷಿ ಸಲಹಾ ಯೋಜನೆಯನ್ನು ರಚಿಸಿ',
    'Land Location':'ಭೂಮಿಯ ಸ್ಥಳ','Soil Profile':'ಮಣ್ಣಿನ ವಿವರ','Selected Crop':'ಆಯ್ದ ಬೆಳೆ','1. Best Sowing Time':'1. ಉತ್ತಮ ಬಿತ್ತನೆ ಸಮಯ',
    '2. Best Irrigation Schedule':'2. ಉತ್ತಮ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ','3. Best Crop Cutting / Harvest Window':'3. ಉತ್ತಮ ಕೊಯ್ಲು ಸಮಯ',
    'Recommended Window: Within 48-72 hours post-rain':'ಶಿಫಾರಸು ಸಮಯ: ಮಳೆಯ ನಂತರ 48-72 ಗಂಟೆಗಳೊಳಗೆ','Irrigation Status: PAUSE for 3 Days (Rain forecasted)':'ನೀರಾವರಿ ಸ್ಥಿತಿ: 3 ದಿನ ನಿಲ್ಲಿಸಿ (ಮಳೆಯ ಮುನ್ಸೂಚನೆ)',
    'Safe Harvest Spell: Day 12 to 18 (Dry conditions)':'ಸುರಕ್ಷಿತ ಕೊಯ್ಲು ಅವಧಿ: 12ನೇ ದಿನದಿಂದ 18ನೇ ದಿನದವರೆಗೆ (ಒಣ ಪರಿಸ್ಥಿತಿ)',
    'Field Soil Moisture & Field Capacity':'ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಕ್ಷೇತ್ರ ಸಾಮರ್ಥ್ಯ','Available Soil Moisture':'ಲಭ್ಯವಿರುವ ಮಣ್ಣಿನ ತೇವಾಂಶ',
    'Soil Aeration / Air Pores':'ಮಣ್ಣಿನ ಗಾಳಿಯ ಹರಿವು / ಗಾಳಿಯ ರಂಧ್ರಗಳು','7-Day Rainfall Forecast (Rain Probability %)':'7 ದಿನಗಳ ಮಳೆ ಮುನ್ಸೂಚನೆ (ಮಳೆ ಸಾಧ್ಯತೆ %)',
    'Outdoor Activity & Timing':'ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆ ಮತ್ತು ಸಮಯ','Activity Location':'ಚಟುವಟಿಕೆ ಸ್ಥಳ','What is your planned activity?':'ನಿಮ್ಮ ಯೋಜಿತ ಚಟುವಟಿಕೆ ಏನು?',
    'Planned Time Window':'ಯೋಜಿತ ಸಮಯದ ಅವಧಿ','Check Umbrella, Outfit & Schedule':'ಛತ್ರಿ, ಉಡುಪು ಮತ್ತು ವೇಳಾಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    'DEFINITELY CARRY AN UMBRELLA':'ಖಂಡಿತವಾಗಿಯೂ ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ','NO UMBRELLA NEEDED':'ಛತ್ರಿ ಅಗತ್ಯವಿಲ್ಲ','High Rain Likelihood':'ಹೆಚ್ಚಿನ ಮಳೆಯ ಸಾಧ್ಯತೆ',
    'Clear & Dry Weather':'ಸ್ವಚ್ಛ ಮತ್ತು ಒಣ ಹವಾಮಾನ','Recommended Schedule Modification':'ಶಿಫಾರಸು ಮಾಡಿದ ವೇಳಾಪಟ್ಟಿ ಬದಲಾವಣೆ','Schedule Timing is Optimal':'ವೇಳಾಪಟ್ಟಿ ಸಮಯ ಸೂಕ್ತವಾಗಿದೆ',
    'Recommended Clothes & Gear':'ಶಿಫಾರಸು ಮಾಡಿದ ಉಡುಪು ಮತ್ತು ಸಾಮಗ್ರಿ','Water-Resistant Shoes':'ನೀರು ನಿರೋಧಕ ಶೂಗಳು','Breathable Cap':'ಗಾಳಿ ಹರಿಯುವ ಕ್ಯಾಪ್',
    'UV Sunglasses':'UV ಸನ್‌ಗ್ಲಾಸ್','Compact Umbrella':'ಸಣ್ಣ ಛತ್ರಿ',
    'TARGET LOCATION':'ಗುರಿ ಸ್ಥಳ','Target Location':'ಗುರಿ ಸ್ಥಳ','Current Location:':'ಪ್ರಸ್ತುತ ಸ್ಥಳ:','Enter city or district...':'ನಗರ ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ನಮೂದಿಸಿ...',
    'Detected:':'ಪತ್ತೆಯಾಗಿದೆ:','via GPS':'GPS ಮೂಲಕ','Detected: Warangal via GPS':'GPS ಮೂಲಕ ವಾರಂಗಲ್ ಪತ್ತೆಯಾಗಿದೆ',
    'Humidity':'ಆರ್ದ್ರತೆ','HUMIDITY':'ಆರ್ದ್ರತೆ','Wind':'ಗಾಳಿ','WIND':'ಗಾಳಿ','Rainfall':'ಮಳೆ','RAINFALL':'ಮಳೆ',
    'Rain Probability':'ಮಳೆಯ ಸಾಧ್ಯತೆ','Relative Humidity':'ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ','Wind Velocity':'ಗಾಳಿಯ ವೇಗ','24h Rainfall':'24 ಗಂಟೆಗಳ ಮಳೆ',
    'Light drizzle':'ಹಗುರ ತುಂತುರು ಮಳೆ','Heavy rain':'ಭಾರೀ ಮಳೆ','Moderate rain':'ಮಧ್ಯಮ ಮಳೆ','Overcast':'ಮೋಡ ಕವಿದ','Clear sky':'ಸ್ವಚ್ಛ ಆಕಾಶ',
    'Unknown Station':'ಅಪರಿಚಿತ ಕೇಂದ್ರ','Normal':'ಸಾಮಾನ್ಯ','Weather Warning':'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ','Advisory issued by India Meteorological Department.':'ಭಾರತೀಯ ಹವಾಮಾನ ಇಲಾಖೆ ನೀಡಿದ ಸಲಹೆ.',
    'IMD Status: No severe weather warnings active.':'IMD ಸ್ಥಿತಿ: ತೀವ್ರ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು ಸಕ್ರಿಯವಾಗಿಲ್ಲ.','Updating...':'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
    'Copy':'ನಕಲಿಸಿ','Copied':'ನಕಲಿಸಲಾಗಿದೆ','Listen':'ಆಲಿಸಿ','Stop':'ನಿಲ್ಲಿಸಿ','WeatherGPT is evaluating radar & meteorological data...':'WeatherGPT ರೇಡಾರ್ ಮತ್ತು ಹವಾಮಾನ ದತ್ತಾಂಶವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...',
    'Checking Backend...':'ಬ್ಯಾಕೆಂಡ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...','Backend: Connected':'ಬ್ಯಾಕೆಂಡ್: ಸಂಪರ್ಕಗೊಂಡಿದೆ','Backend: Demo Mode':'ಬ್ಯಾಕೆಂಡ್: ಡೆಮೋ ಮೋಡ್',
    'Connection Issue':'ಸಂಪರ್ಕ ಸಮಸ್ಯೆ','Advisory':'ಸಲಹೆ','Success':'ಯಶಸ್ಸು','Notification':'ಅಧಿಸೂಚನೆ','Dismiss toast':'ಸಂದೇಶ ಮುಚ್ಚಿ','Use my current GPS location':'ನನ್ನ ಪ್ರಸ್ತುತ GPS ಸ್ಥಳವನ್ನು ಬಳಸಿ',
    'Search History':'ಹುಡುಕಾಟ ಇತಿಹಾಸ','No history yet':'ಇನ್ನೂ ಇತಿಹಾಸ ಇಲ್ಲ','Clear history':'ಇತಿಹಾಸ ತೆರವು ಮಾಡಿ',
    'Loading telemetry...':'ಟೆಲಿಮೆಟ್ರಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...','Ask direct questions about rainfall, storms, or temperature. WeatherGPT provides direct humanoid answers, clear advice on what you can and cannot do, and precise charts.':'ಮಳೆ, ಚಂಡಮಾರುತ ಅಥವಾ ತಾಪಮಾನದ ಬಗ್ಗೆ ನೇರ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ. WeatherGPT ಸ್ಪಷ್ಟ ಉತ್ತರಗಳು, ಸಲಹೆ ಮತ್ತು ನಿಖರ ಚಾರ್ಟ್‌ಗಳನ್ನು ನೀಡುತ್ತದೆ.',
    'Yes, it will definitely rain today.':'ಹೌದು, ಇಂದು ಖಂಡಿತವಾಗಿ ಮಳೆಯಾಗುತ್ತದೆ.','No rain is expected today.':'ಇಂದು ಮಳೆಯ ನಿರೀಕ್ಷೆ ಇಲ್ಲ.',
    'Likelihood:':'ಸಾಧ್ಯತೆ:','Expected Window:':'ನಿರೀಕ್ಷಿತ ಸಮಯ:',
    '✅ What you CAN do:':'✅ ನೀವು ಮಾಡಬಹುದಾದದ್ದು:','❌ What to AVOID:':'❌ ತಪ್ಪಿಸಬೇಕಾದದ್ದು:',
    'Finish morning outdoor chores and travel before 2:00 PM.':'ಬೆಳಗಿನ ಹೊರಗಿನ ಕೆಲಸಗಳನ್ನು ಮುಗಿಸಿ ಮಧ್ಯಾಹ್ನ 2:00 ಮೊದಲು ಪ್ರಯಾಣಿಸಿ.',
    'Keep field drainage channels open to absorb natural rain.':'ನೈಸರ್ಗಿಕ ಮಳೆಯನ್ನು ಹೀರಲು ಕ್ಷೇತ್ರ ಒಳಚರಂಡಿ ಕಾಲುವೆಗಳನ್ನು ತೆರೆದಿಡಿ.',
    'Carry a light umbrella if returning home in the evening.':'ಸಂಜೆ ಮನೆಗೆ ಹಿಂದಿರುಗಿದರೆ ಹಗುರ ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.',
    'Avoid hanging laundry outside after 1:00 PM.':'ಮಧ್ಯಾಹ್ನ 1:00 ನಂತರ ಹೊರಗೆ ಬಟ್ಟೆ ಒಣಗಿಸಬೇಡಿ.',
    'Do NOT spray pesticides or fertilizers (will wash away).':'ಕೀಟನಾಶಕ ಅಥವಾ ರಸಗೊಬ್ಬರ ಸಿಂಪಡಿಸಬೇಡಿ (ತೊಳೆದು ಹೋಗುತ್ತದೆ).',
    'Avoid two-wheeler highway travel during 3:30 PM – 6:00 PM squalls.':'ಮಧ್ಯಾಹ್ನ 3:30 – ಸಂಜೆ 6:00 ನಡುವೆ ದ್ವಿಚಕ್ರ ವಾಹನ ಹೆದ್ದಾರಿ ಪ್ರಯಾಣ ತಪ್ಪಿಸಿ.',
    '📊 Rain Probability & Temperature Curve':'📊 ಮಳೆ ಸಾಧ್ಯತೆ ಮತ್ತು ತಾಪಮಾನ ರೇಖೆ'
  }
};

const REPLACEMENTS = {
  'te': [
    ['Updated:', 'నవీకరించబడింది:'], ['rain chance', 'వర్ష అవకాశం'], ['Rain Likelihood', 'వర్ష అవకాశం'],
    ['Takeoff Phase', 'టేకాఫ్ దశ'], ['En-route Sector', 'ప్రయాణ మార్గ విభాగం'], ['Approach & Landing', 'అప్రోచ్ & ల్యాండింగ్'],
    ['Origin', 'ప్రారంభం'], ['Destination', 'గమ్యం'], ['Departure', 'బయలుదేరు'], ['Arrival', 'చేరిక'],
    ['Recommended', 'సిఫార్సు చేసిన'], ['Safe', 'సురక్షితం'], ['Clear', 'స్పష్టం'], ['Dry', 'పొడి'],
    ['Morning', 'ఉదయం'], ['Afternoon', 'మధ్యాహ్నం'], ['Evening', 'సాయంత్రం'], ['Night', 'రాత్రి']
  ],
  'hi': [
    ['Updated:', 'अपडेट किया गया:'], ['rain chance', 'वर्षा संभावना'], ['Rain Likelihood', 'बारिश की संभावना'],
    ['Takeoff Phase', 'टेकऑफ चरण'], ['En-route Sector', 'मार्ग क्षेत्र'], ['Approach & Landing', 'एप्रोच और लैंडिंग'],
    ['Origin', 'प्रारंभ'], ['Destination', 'गंतव्य'], ['Departure', 'प्रस्थान'], ['Arrival', 'आगमन'],
    ['Recommended', 'अनुशंसित'], ['Safe', 'सुरक्षित'], ['Clear', 'साफ़'], ['Dry', 'शुष्क'],
    ['Morning', 'सुबह'], ['Afternoon', 'दोपहर'], ['Evening', 'शाम'], ['Night', 'रात']
  ],
  'ta': [
    ['Updated:', 'புதுப்பிக்கப்பட்டது:'], ['rain chance', 'மழை வாய்ப்பு'], ['Rain Likelihood', 'மழை வாய்ப்பு'],
    ['Takeoff Phase', 'புறப்படும் நிலை'], ['En-route Sector', 'வழிப் பகுதி'], ['Approach & Landing', 'அணுகல் & தரையிறக்கம்'],
    ['Origin', 'தொடக்கம்'], ['Destination', 'செல்லுமிடம்'], ['Departure', 'புறப்பாடு'], ['Arrival', 'வருகை'],
    ['Recommended', 'பரிந்துரைக்கப்பட்டது'], ['Safe', 'பாதுகாப்பான'], ['Clear', 'தெளிவான'], ['Dry', 'வறண்ட'],
    ['Morning', 'காலை'], ['Afternoon', 'மதியம்'], ['Evening', 'மாலை'], ['Night', 'இரவு']
  ],
  'kn': [
    ['Updated:', 'ನವೀಕರಿಸಲಾಗಿದೆ:'], ['rain chance', 'ಮಳೆಯ ಸಾಧ್ಯತೆ'], ['Rain Likelihood', 'ಮಳೆಯ ಸಾಧ್ಯತೆ'],
    ['Takeoff Phase', 'ಟೇಕ್‌ಆಫ್ ಹಂತ'], ['En-route Sector', 'ಮಾರ್ಗ ವಿಭಾಗ'], ['Approach & Landing', 'ಅಪ್ರೋಚ್ ಮತ್ತು ಲ್ಯಾಂಡಿಂಗ್'],
    ['Origin', 'ಆರಂಭ'], ['Destination', 'ಗಮ್ಯಸ್ಥಾನ'], ['Departure', 'ನಿರ್ಗಮನ'], ['Arrival', 'ಆಗಮನ'],
    ['Recommended', 'ಶಿಫಾರಸು ಮಾಡಿದ'], ['Safe', 'ಸುರಕ್ಷಿತ'], ['Clear', 'ಸ್ಪಷ್ಟ'], ['Dry', 'ಒಣ'],
    ['Morning', 'ಬೆಳಗ್ಗೆ'], ['Afternoon', 'ಮಧ್ಯಾಹ್ನ'], ['Evening', 'ಸಂಜೆ'], ['Night', 'ರಾತ್ರಿ']
  ]
};

let currentLanguage = DEFAULT_LANGUAGE;
let observer = null;
const originalText = new WeakMap();
const originalAttr = new WeakMap();

function sourceOfText(node) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  return originalText.get(node);
}
function sourceOfAttr(el, attr) {
  let map = originalAttr.get(el);
  if (!map) { map = {}; originalAttr.set(el, map); }
  if (!(attr in map)) map[attr] = el.getAttribute(attr);
  return map[attr];
}
function translateString(value, lang) {
  if (!value || lang === DEFAULT_LANGUAGE) return value;
  const dict = T[lang] || {};
  const trimmed = value.trim();
  if (dict[trimmed]) {
    const translated = dict[trimmed];
    return value.replace(trimmed, translated);
  }
  let out = value;
  for (const [en, target] of (REPLACEMENTS[lang] || [])) {
    out = out.split(en).join(target);
  }
  return out;
}

function shouldSkip(el) {
  return !el || ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(el.tagName) ||
    el.closest('[data-i18n-ignore="true"]') ||
    el.closest('.message-row') ||
    el.closest('.message-bubble');
}

function translateRoot(root = document.body) {
  if (!root) return;
  const wasObserving = !!observer;
  if (wasObserving) observer.disconnect();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement || shouldSkip(node.parentElement)) continue;
    if (!node.nodeValue.trim()) continue;
    nodes.push(node);
  }
  nodes.forEach(n => {
    n.nodeValue = translateString(sourceOfText(n), currentLanguage);
  });

  root.querySelectorAll?.('input[placeholder], textarea[placeholder], [title], [aria-label]').forEach(el => {
    if (shouldSkip(el)) return;
    for (const attr of ['placeholder','title','aria-label']) {
      if (el.hasAttribute(attr)) {
        const source = sourceOfAttr(el, attr);
        if (source != null) el.setAttribute(attr, translateString(source, currentLanguage));
      }
    }
  });

  // HTML document language is also updated so assistive technology and browser
  // language features know which language the UI is currently using.
  document.documentElement.lang = currentLanguage;
  if (wasObserving) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

export function initI18n(initialLanguage = DEFAULT_LANGUAGE) {
  currentLanguage = LANGUAGES.some(l => l.code === initialLanguage) ? initialLanguage : DEFAULT_LANGUAGE;
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    // Batch DOM mutations so rendering a workspace only causes one translation pass.
    clearTimeout(observer._timer);
    observer._timer = setTimeout(() => translateRoot(document.body), 0);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  translateRoot(document.body);
}

export function setAppLanguage(language) {
  if (!LANGUAGES.some(l => l.code === language)) return;
  currentLanguage = language;
  translateRoot(document.body);
}

export function getAppLanguage() {
  return currentLanguage;
}
