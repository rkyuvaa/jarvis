const API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

function getApiUrl() {
  return API_BASE + import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Extract event data from an image using Gemini multimodal API.
 * @param {string} base64Data - Base64-encoded image data
 * @param {string} mimeType - MIME type (e.g. "image/jpeg")
 * @returns {Promise<object>} Parsed event JSON
 */
export async function extractEventFromImage(base64Data, mimeType) {
  const prompt = `Analyze this image and extract all event information.
Return ONLY a valid JSON object. No markdown. No explanation.
Structure:
{
  "event_type": "wedding|birthday|meeting|party|anniversary|concert|conference|other",
  "title": "string — event name",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "venue_name": "string or null",
  "address": "full address string or null",
  "host_names": ["array of strings"],
  "notes": "any other visible detail",
  "confidence": 0.0 to 1.0,
  "auto_reminders": [
    {
      "type": "string",
      "title": "string",
      "recurrence": "YEARLY|MONTHLY|WEEKLY|DAILY|NONE",
      "advance_days": 7
    }
  ]
}
If this is a wedding invite, always add a yearly anniversary reminder.
If this is a birthday invite, always add a yearly birthday reminder.
If this is a meeting or conference, add a 1-day-before reminder.
Return the raw JSON only, no code fences.`;

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
    },
  };

  const res = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

/**
 * Send a conversational message to Gemini with schedule context.
 * @param {string} userMessage - The user's message
 * @param {Array} history - Previous messages [{role, parts}]
 * @param {object} context - { events, reminders }
 * @returns {Promise<string>} JARVIS response text
 */
export async function chatWithJarvis(userMessage, history = [], context = {}) {
  const { events = [], reminders = [] } = context;

  const systemContext = `You are JARVIS, a personal life assistant AI. You are precise, direct, and efficient. You speak like a sophisticated AI assistant — not chatty, but warm. Never say "I cannot" — find a way.

Current date/time: ${new Date().toISOString()}

User's upcoming events (next 30 days):
${JSON.stringify(events.slice(0, 20), null, 2)}

User's active reminders:
${JSON.stringify(reminders.slice(0, 20), null, 2)}

When the user asks to add an event or reminder, respond with a special JSON action block:
<action>{"type":"create_event","data":{"title":"string","event_date":"ISO string","event_time":"HH:MM","location_name":"string","description":"string","event_type":"general"}}</action>

Or for reminders:
<action>{"type":"create_reminder","data":{"title":"string","remind_at":"ISO string","event_id":null}}</action>

Always acknowledge the action was taken after the <action> tag. Keep responses concise and factual.`;

  const contents = [
    { role: 'user', parts: [{ text: systemContext }] },
    { role: 'model', parts: [{ text: 'JARVIS online. All systems nominal. How can I assist?' }] },
    ...history.map((m) => ({
      role: m.role === 'jarvis' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
}
