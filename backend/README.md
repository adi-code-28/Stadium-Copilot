# Stadium Copilot Backend

Enhanced Express.js API server for the Stadium Copilot WC2026 orchestration platform.

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:3001`

## Features

### ✨ Improvements Made:
- ✅ **Better Error Handling**: All endpoints now have try-catch blocks and validation
- ✅ **Request Validation**: Parameters are validated before processing
- ✅ **Gemini API Integration**: Proxy endpoint supports real Gemini API calls (when API key provided)
- ✅ **Enhanced Responses**: All responses include timestamps and status information
- ✅ **Comprehensive Logging**: Better error logging for debugging
- ✅ **404 Handler**: Shows available endpoints when route not found
- ✅ **CORS Support**: Full CORS enabled for frontend integration
- ✅ **Risk Level Classification**: Heat advisories now include risk levels

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check with timestamp

### Stadium Data
- `GET /api/stadium/gates` - Gate wait times and status
- `GET /api/stadium/occupancy` - Section occupancy and temperature data
- `GET /api/stadium/weather` - Current weather conditions (temp, WBGT, humidity)
- `GET /api/match/status` - Live match information

### Intelligence & Advisory
- `POST /api/advisories/heat` - Personalized heat risk advisories
  - Required: `ageGroup` (string: "Under 18", "18-64", "65+")
  - Optional: `healthFlag` (string: "none", "asthma", "pregnancy", "cardio")
  - Returns: message, reason, riskLevel, timestamp

- `POST /api/ai/query` - Natural language ops queries
  - Required: `prompt` (string)
  - Optional: `apiKey` (string - for Gemini integration), `systemPrompt` (string)
  - Returns: response, toolsCalled, reasoning

### Simulation & Training
- `GET /api/scenarios` - Incident scenarios for the simulator

## Configuration

### Enable Gemini API

1. Add your API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

2. Restart the server:
```bash
npm start
```

The `/api/ai/query` endpoint will now use real Gemini API responses instead of mocked data.

## Response Format

All responses include proper HTTP status codes and structured JSON:

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-07-13T14:30:00.000Z"
}
```

Errors include:
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "status": 400,
  "timestamp": "2026-07-13T14:30:00.000Z"
}
```

## Frontend Integration

The frontend (port 5173) automatically connects to this backend for:
- Real-time stadium operations data
- Heat risk assessments
- AI-powered incident simulations
- Personalized fan advisories

CORS is fully enabled - no additional configuration needed.

## Error Handling

All endpoints now include:
- Input validation
- Error logging with full context
- Graceful fallbacks to mock data (when Gemini unavailable)
- Descriptive error messages

## Logging

The server logs errors with full context:
```
🔴 Error: {
  timestamp: "2026-07-13T14:30:00.000Z",
  method: "POST",
  path: "/api/advisories/heat",
  error: "Missing ageGroup parameter",
  stack: "..."
}
```

---

**Backend Status**: ✅ Production Ready
