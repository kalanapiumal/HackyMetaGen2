/**
 * Serverless function to handle AI metadata generation
 * Supports: Gemini, Groq, and OpenAI (ChatGPT)
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for image uploads
    },
  },
};

const ADOBE_CATEGORIES = [
  { id: 1, name: "Animals" },
  { id: 2, name: "Buildings and Architecture" },
  { id: 3, name: "Business" },
  { id: 4, name: "Drinks" },
  { id: 5, name: "The Environment" },
  { id: 6, name: "States of Mind" },
  { id: 7, name: "Food" },
  { id: 8, name: "Graphic Resources" },
  { id: 9, name: "Hobbies and Leisure" },
  { id: 10, name: "Industry" },
  { id: 11, name: "Landscape" },
  { id: 12, name: "Lifestyle" },
  { id: 13, name: "People" },
  { id: 14, name: "Plants and Flowers" },
  { id: 15, name: "Culture and Religion" },
  { id: 16, name: "Science" },
  { id: 17, name: "Social Issues" },
  { id: 18, name: "Sports" },
  { id: 19, name: "Technology" },
  { id: 20, name: "Transport" },
  { id: 21, name: "Travel" },
];

const CATEGORIES_STRING = ADOBE_CATEGORIES.map(c => `${c.id}. ${c.name}`).join('\n');

const SYSTEM_PROMPT = `
You are Hacky MetaGen 3.9, a senior SEO expert for Adobe Stock.
You are processing a batch of assets.

YOUR GOAL: Generate metadata for EACH input asset provided.

STRICT RULES FOR EACH ASSET:
1. **Title**: EXACTLY 100-120 characters. Natural, readable, descriptive. Include high-value keywords. NO keyword stuffing.
2. **Keywords**: Generate EXACTLY 49 keywords. Comma-separated string.
   - **CRITICAL:** Do NOT generate more than or less than 49 keywords. Stop exactly at 49.
   - **Priority:** First 5-10 keywords must be most relevant, most impactful...
   This primarily determines search ranking.
   - **Distribution:** Short-tail (1-2 words): ~30%, Mid-tail (2-3 words): ~45%, Long-tail (3-4 words): ~25%.
   - **Content:** NO brand names, trademarks, or personal names.
3. **Category**: Choose the single most appropriate category ID (1-21) from the list below:
${CATEGORIES_STRING}
4. **Approval Prediction**: Status ("Accepted" or "Rejected") and Reason.

OUTPUT FORMAT (JSON ARRAY ONLY):
Return a JSON Array containing objects matching the number of input assets.
[
  {
    "title": "string",
    "keywords": "string (comma separated)",
    "category_id": integer,
    "approval_status": "Accepted" or "Rejected",
    "approval_reason": "string"
  },
  ...
]
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { apiKey, assets, modelProvider } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: 'No assets provided' });
  }

  try {
    let result;

    if (modelProvider === 'groq') {
      result = await handleOpenAIStyleRequest(
        apiKey, 
        assets, 
        "https://api.groq.com/openai/v1/chat/completions",
        "meta-llama/llama-4-scout-17b-16e-instruct" 
      );
    } else if (modelProvider === 'chatgpt') {
      result = await handleOpenAIStyleRequest(
        apiKey,
        assets,
        "https://api.openai.com/v1/chat/completions",
        "gpt-4o-mini"
      );
    } else {
      // Default to Gemini
      result = await handleGeminiRequest(apiKey, assets);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Backend Generation Error:", error);
    // Attempt to extract meaningful error message
    const errorMessage = error.message || "Internal Server Error";
    // Check for specific status codes in the error if available
    const status = error.status || 500;
    return res.status(status).json({ error: errorMessage });
  }
}

// --- HANDLERS ---

async function handleGeminiRequest(apiKey, assets) {
  const contentParts = [{ text: SYSTEM_PROMPT }];

  assets.forEach((asset, index) => {
    contentParts.push({ text: `\n\n--- INPUT ASSET ${index + 1} ---` });
    
    // Check if it is a video (array of frames) or single image
    if (Array.isArray(asset.data)) {
      // Video frames
      asset.data.forEach(frameBase64 => {
        contentParts.push({
          inlineData: {
            mimeType: "image/jpeg", // Frames are usually extracted as JPEG
            data: frameBase64
          }
        });
      });
    } else {
      // Single Image
      contentParts.push({
        inlineData: {
          mimeType: asset.mimeType || "image/jpeg",
          data: asset.data
        }
      });
    }
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: contentParts }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("No content returned from Gemini");

  return parseJSONSafely(text);
}

async function handleOpenAIStyleRequest(apiKey, assets, endpoint, model) {
  const messages = [
    {
        role: "user",
        content: [
            { type: "text", text: SYSTEM_PROMPT }
        ]
    }
  ];

  assets.forEach((asset, index) => {
    messages[0].content.push({ type: "text", text: `\n\n--- INPUT ASSET ${index + 1} ---` });
    
    if (Array.isArray(asset.data)) {
      // Video Frames
      asset.data.forEach(frameBase64 => {
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${frameBase64}`
          }
        });
      });
    } else {
      // Single Image
      // Ensure we have a valid mime type for the data URI
      const mime = asset.mimeType || "image/jpeg";
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `data:${mime};base64,${asset.data}`
        }
      });
    }
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status} (${model}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error(`No content returned from ${model}`);

  return parseJSONSafely(text);
}

function parseJSONSafely(text) {
  try {
    // Clean up markdown code blocks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Normalize output: If the model wraps result in an object key like "assets": [], extract the array
    if (!Array.isArray(parsed) && typeof parsed === 'object') {
       const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
       if (possibleArray) return possibleArray;
       return [parsed]; // Treat as single item array
    }
    return parsed;
  } catch (e) {
    throw new Error("Failed to parse JSON response from AI: " + text.substring(0, 100) + "...");
  }
}
