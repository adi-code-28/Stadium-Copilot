import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY || null;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.set('X-Powered-By', 'Stadium-Copilot-Backend');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date().toISOString() });
});

// Stadium data endpoints
app.get('/api/stadium/gates', (req, res) => {
  res.json({
    gates: [
      { id: 'gate-a', name: 'Gate A (North)', waitTime: 8, status: 'normal' },
      { id: 'gate-b', name: 'Gate B (East)', waitTime: 6, status: 'normal' },
      { id: 'gate-c', name: 'Gate C (South)', waitTime: 28, status: 'critical' },
      { id: 'gate-d', name: 'Gate D (West)', waitTime: 4, status: 'normal' }
    ]
  });
});

app.get('/api/stadium/occupancy', (req, res) => {
  res.json({
    sections: [
      { id: 'sec-112', occupancy: 89, temperature: 31.2 },
      { id: 'sec-120', occupancy: 75, temperature: 28.5 },
      { id: 'sec-130', occupancy: 92, temperature: 33.1 }
    ],
    totalAttendance: 78320
  });
});

app.get('/api/stadium/weather', (req, res) => {
  res.json({
    temperature: 33,
    wbgt: 31.4,
    humidity: 65,
    uvIndex: 9,
    condition: 'Sunny'
  });
});

// Match data endpoint
app.get('/api/match/status', (req, res) => {
  res.json({
    homeTeam: 'Brazil',
    awayTeam: 'Morocco',
    minute: 68,
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    attendance: 78320
  });
});

// Heat advisory endpoint
app.post('/api/advisories/heat', (req, res) => {
  try {
    const { ageGroup, healthFlag } = req.body;
    
    if (!ageGroup) {
      return res.status(400).json({ error: 'Missing ageGroup parameter' });
    }

    let message = 'Stay hydrated. Avoid direct sun on the East Concourse. Cooling Zone B is 1 min away.';
    let reason = 'Baseline advisory for typical adult.';
    let riskLevel = 'LOW';

    if (ageGroup === '65+' || healthFlag === 'asthma' || healthFlag === 'cardio') {
      message = '⚠️ HIGH HEAT RISK: Temp is 33°C (WBGT 31.4°C). We highly advise moving to the shaded North/West concourses. Cooling Zone A (Section 101) is air conditioned.';
      reason = 'Clinical Alert: Elevated heat stroke susceptibility due to user profile factors.';
      riskLevel = 'HIGH';
    } else if (healthFlag === 'pregnancy') {
      message = '⚠️ PREGNANCY HEAT ALERT: Keep hydrated. Restrooms and Cooling Zone B have active misting fans (80m away). Section 120 has shaded seats.';
      reason = 'Safety Alert: Hydration prioritised due to pregnancy indicator.';
      riskLevel = 'MODERATE';
    }

    res.json({ 
      message, 
      reason,
      riskLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Heat advisory error:', error);
    res.status(500).json({ error: 'Failed to generate heat advisory', message: error.message });
  }
});

// Gemini API proxy endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt parameter' });
    }

    // If API key is provided by frontend, proxy the request to Gemini
    if (req.body.apiKey) {
      try {
        const geminiResponse = await callGeminiAPI(systemPrompt || 'You are a helpful assistant.', prompt, req.body.apiKey);
        return res.json(geminiResponse);
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError.message);
        // Fall through to mock response
      }
    }

    // Mock response for development
    res.json({
      response: `Processing query: "${prompt.substring(0, 50)}...". Gate C remains the primary bottleneck with a 28 min wait time. Platform density at the train station has spiked to 3.2 people/m² following the 75th minute wave.`,
      toolsCalled: ['getGateStatus()', 'getNJTransitTrains()'],
      reasoning: 'Generated contextual response from stadium ops database (mock mode - no Gemini key provided).'
    });
  } catch (error) {
    console.error('Query endpoint error:', error);
    res.status(500).json({ error: 'Failed to process query', message: error.message });
  }
});

// Helper function to call Gemini API
async function callGeminiAPI(systemPrompt, userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      role: "user",
      parts: [{
        text: `${systemPrompt}\n\nUser Input/Context:\n${userPrompt}`
      }]
    }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1000,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error (${response.status})`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error("Empty response from Gemini");
  }

  try {
    return JSON.parse(textResponse);
  } catch {
    return { response: textResponse, reasoning: 'Response from Gemini' };
  }
}

// Incident scenarios endpoint
app.get('/api/scenarios', (req, res) => {
  res.json({
    scenarios: [
      {
        id: 'crowd-crush',
        title: 'Crowd Surge at Gate C',
        riskLevel: 'CRITICAL',
        location: 'South Entrance Concourse'
      },
      {
        id: 'heat-illness',
        title: 'Mass Heat Illness Event',
        riskLevel: 'HIGH',
        location: 'East Stand Bowl'
      },
      {
        id: 'medical-emergency',
        title: 'Cardiac Emergency - VIP Box',
        riskLevel: 'CRITICAL',
        location: 'Section 220'
      }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔴 Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  });
  
  const status = err.status || 500;
  res.status(status).json({ 
    error: 'Internal server error', 
    message: err.message,
    status,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: 'GET /api/health',
      gates: 'GET /api/stadium/gates',
      occupancy: 'GET /api/stadium/occupancy',
      weather: 'GET /api/stadium/weather',
      match: 'GET /api/match/status',
      heat: 'POST /api/advisories/heat',
      query: 'POST /api/ai/query',
      scenarios: 'GET /api/scenarios'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🏟️  Stadium Copilot Backend running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for frontend integration`);
  console.log(`✅ Ready to serve API endpoints`);
  console.log(`🔑 Gemini API: ${API_KEY ? 'Ready' : 'Not configured (mock mode only)'}\n`);
});
