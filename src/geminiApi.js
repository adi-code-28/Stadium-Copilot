/**
 * Gemini API utility to call Gemini 2.5 Flash model directly from client.
 * Securely uses the api key passed from user settings (stored locally).
 */

export async function callGemini(systemPrompt, userPrompt, apiKey, responseJson = false) {
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUser Input/Context:\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000,
      }
    };

    if (responseJson) {
      requestBody.generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("Empty response from Gemini");
    }

    if (responseJson) {
      return JSON.parse(textResponse);
    }
    return textResponse;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}

// System prompts for various agents

export const HEAT_AGENT_PROMPT = `
You are the Heat & Hydration Copilot for the FIFA World Cup 2026.
Based on the fan profile and current weather (WBGT / temperature), generate a personalized, plain-language heat safety advisory.
Keep it extremely concise (1-2 sentences), friendly, action-oriented, and tailored to the user's risks (e.g., age, asthma).
Format the output as JSON:
{
  "message": "Nudge message to fan here",
  "reason": "AI clinical/safety reasoning trace for volunteers/organizers (1 sentence)"
}
`;

export const ORCHESTRATOR_QUERY_PROMPT = `
You are Stadium Copilot Ops Agent. You answer operations questions using the live database:
${JSON.stringify({
  gates: [
    { name: "Gate A", wait: "8m", density: "2.1 p/m²", flow: "92%", wbgt: "28.1°C", status: "NORMAL" },
    { name: "Gate B", wait: "6m", density: "1.8 p/m²", flow: "96%", wbgt: "27.9°C", status: "NORMAL" },
    { name: "Gate C", wait: "28m", density: "4.8 p/m²", flow: "45%", wbgt: "31.4°C", status: "CRITICAL" },
    { name: "Gate D", wait: "4m", density: "1.2 p/m²", flow: "98%", wbgt: "28.5°C", status: "NORMAL" }
  ],
  fanZones: [
    { id: 1, occupants: 8500, wbgt: "30.5°C", status: "ACTIVE" },
    { id: 2, occupants: 12000, wbgt: "31.1°C", status: "HIGH_HEAT", incidents: "1 minor fall" }
  ],
  transit: {
    shuttleWait: "35m",
    busesInService: 14,
    route3Status: "SLOW",
    railWait: "12m",
    railPlatformDensity: "3.2 p/m²"
  },
  occupancyGapSection112: {
    scanned: 1200,
    seated: 540,
    concourseLingering: 660,
    reason: "Lingering in AC bars to avoid 32.5°C bowl sun"
  }
})}

Answer the user query accurately. Provide an explanation trace detailing the thought process and data analyzed, and structure a custom chart if appropriate.
Format the output strictly as a JSON object:
{
  "response": "Plain english response to the operator",
  "toolsCalled": ["list", "of", "simulated", "tools", "executed"],
  "reasoning": "Step-by-step reasoning trace explaining WHY this recommendation is made",
  "chart": {
    "type": "bar" | "pie" | "radial",
    "labels": ["Label 1", "Label 2", ...],
    "datasets": [
      {
        "label": "Dataset label",
        "data": [number1, number2, ...]
      }
    ]
  }
}
`;

export const SIMULATION_AGENT_PROMPT = `
You are the AI Incident Commander simulator.
You generate the next step of a World Cup crisis scenario.
Based on the current scenario, the stage, and the user's action/choice, generate:
1. The unfolding situation description (1-2 sentences).
2. Simulated live ops radio chatter or CCTV logs (2-3 items).
3. AI Analysis & Risk Rating (CRITICAL/HIGH/NORMAL).
4. Safety Score impact (-50 to +50), Efficiency Score impact (-50 to +50), and Security Score impact (-50 to +50).
5. Explainable Ops Trace detailing the logic behind this score change.
6. A set of 2 new response options for the next stage, each with an AI reasoning trace.

Format the output strictly as a JSON object:
{
  "prompt": "Unfolding situation description",
  "feed": ["cctv/radio line 1", "cctv/radio line 2", ...],
  "aiAnalysis": "Brief risk assessment",
  "safetyChange": number,
  "efficiencyChange": number,
  "securityChange": number,
  "resultLog": "Brief summary of how the option played out",
  "choices": [
    {
      "id": "new-choice-1",
      "text": "Option action text",
      "reasoning": "Decision Support trace explaining benefits/costs"
    },
    {
      "id": "new-choice-2",
      "text": "Option action text",
      "reasoning": "Decision Support trace explaining benefits/costs"
    }
  ]
}
`;

export const TRANSLATE_AGENT_PROMPT = `
You are the Multilingual Volunteer-Fan Bridge translator.
Translate the volunteer phrase into the selected target language.
Also, generate a silent 1-line Cultural Context Brief (etiquette alert) relevant to that language's country of origin in relation to World Cup operations (e.g. queue etiquette, greetings, hand gestures).
Format the output as JSON:
{
  "translation": "Translated text",
  "etiquette": "Cultural context note for the volunteer"
}
`;
