/**
 * Serverless function to handle AI metadata generation
 * Supports: Gemini, Groq (Llama 4 Scout), and OpenAI (ChatGPT)
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow larger payloads for images
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

// Constants for Prompt Construction
const MIN_TITLE_LENGTH = 40;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { apiKey, assets, modelProvider, maxTitleLength = 70, targetKeywordCount = 49 } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: 'No assets provided' });
  }

  // UPDATED PROMPT: Matches the latest frontend strict rules
  const SYSTEM_PROMPT = `
You are Hacky MetaGen 3.9, a senior SEO expert for Adobe Stock.
You are processing a batch of ${assets.length} distinct assets.
YOUR GOAL: Generate metadata for EACH of the ${assets.length} input assets.

STRICT RULES FOR EACH ASSET:
1. **TITLE**:
   - **RULE 1: FORMULA**: [Main Subject] + [Specific Type] + [Action] + [Location/Mood]
     Example: "Golden retriever playing happily in sunny park"
   - **RULE 2: LENGTH**: Strictly ${MIN_TITLE_LENGTH}-${maxTitleLength} characters.
     - **TARGET**: Aim for exactly 65-70 characters.
     - **CRITICAL**: Do NOT generate titles shorter than ${MIN_TITLE_LENGTH} characters.
     - **CRITICAL**: Do NOT generate titles longer than ${maxTitleLength} characters.
   - **RULE 3: 5 QUESTIONS**: Answer: ✓ WHAT? ✓ WHO? ✓ ACTION? ✓ WHERE? ✓ MOOD?
   - **RULE 4: FRONT-LOAD**:
     Position 1-2 = 35% ranking weight (CRITICAL)
     Position 3-4 = 25% ranking weight (IMPORTANT)
     Position 5+ = 40% ranking weight (SUPPORTING)
   - **RULE 5: FORBIDDEN TERMS**:
     ✗ No brands (Apple, Canon, Nike)
     ✗ No specs (4K, 12MP, resolution)
     ✗ No personal names (John, Sarah, celebrities)
     ✗ Not alphabetically ordered
   - **CRITICAL**: Do NOT add a period (.) at the end of the title.
2. **Keywords**: Generate 60 keywords. (We will select the best ${targetKeywordCount}).
   - **MANDATORY COUNT**: You MUST provide at least 60 keywords. Do NOT stop at 30 or 40.
   - **CRITICAL**: Providing fewer than 50 keywords is a FAILURE. Over-generate synonyms and concepts.
   - **EXPANSION STRATEGY**: To reach 60, you must include:
     1. **Visuals**: (e.g., dog, grass, clouds, fur)
     2. **Concepts**: (e.g., friendship, loyalty, freedom, vitality)
     3. **Actions**: (e.g., running, playing, jumping, panting)
     4. **Mood/Style**: (e.g., happy, sunny, vibrant, cinematic, bokeh)
     5. **Broad Categories**: (e.g., mammal, animal, pet, canine, vertebrate)
   - **FORMAT**: Comma-separated string ONLY. No numbered lists. No bullet points.
3. **Category**: Choose the single most appropriate category ID (1-21) from the list below:
${CATEGORIES_STRING}
4. **Approval Prediction**: Status ("Accepted" or "Rejected") and Reason.
   - **MANDATORY ANATOMY MATH CHECK**:
     1. **Count People**: X = Total number of people visible.
     2. **Count Hands**: Y = Total number of hands visible.
     3. **THE RULE**: If Y > (X * 2), REJECT IMMEDIATELY. (e.g. 2 people cannot have 5 hands).
     4. **Finger Count**: Inspect each hand. If != 5 fingers, REJECT.
     5. **Limb Logic**: If arms/legs bend in impossible ways or disappear, REJECT.
   - **Reason**: If rejected, state specific count error (e.g., "Rejected: Anatomy Math - Found 5 hands for 2 people").

OUTPUT FORMAT (JSON ARRAY ONLY):
Return a JSON Array containing exactly ${assets.length} objects.
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

  try {
    let result;

    if (modelProvider === 'groq') {
      result = await handleOpenAIStyleRequest(
        apiKey, 
        assets, 
        "https://api.groq.com/openai/v1/chat/completions",
        "meta-llama/llama-4-scout-17b-16e-instruct", // Fixed model for Groq
        SYSTEM_PROMPT
      );
    } else if (modelProvider === 'chatgpt') {
      result = await handleOpenAIStyleRequest(
        apiKey,
        assets,
        "https://api.openai.com/v1/chat/completions",
        "gpt-4o",
        SYSTEM_PROMPT
      );
    } else {
      // Default to Gemini
      result = await handleGeminiRequest(apiKey, assets, SYSTEM_PROMPT);
    }

    // --- Backend Post-Processing/Sanitization ---
    // This mirrors the frontend safety checks to ensure the API returns clean data
    if (Array.isArray(result)) {
        result = result.map(item => {
            // Normalize keys (lowercase)
            const newItem = {};
            Object.keys(item).forEach(k => newItem[k.toLowerCase()] = item[k]);

            // Truncate Title if needed
            if (newItem.title) {
                let t = String(newItem.title).trim();
                if (t.endsWith('.')) t = t.slice(0, -1);
                if (t.length > maxTitleLength) {
                    const truncated = t.substring(0, maxTitleLength);
                    const lastSpace = truncated.lastIndexOf(' ');
                    if (lastSpace > 0) t = truncated.substring(0, lastSpace);
                    else t = truncated;
                }
                newItem.title = t;
            }

            // Truncate Keywords if needed
            if (newItem.keywords && typeof newItem.keywords === 'string') {
                const splitRegex = /[,;\n\r]+/;
                let kws = newItem.keywords.split(splitRegex).map(k => k.trim()).filter(k => k.length > 0);
                if (kws.length > targetKeywordCount) kws = kws.slice(0, targetKeywordCount);
                newItem.keywords = kws.join(', ');
            }
            return newItem;
        });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Backend Generation Error:", error);
    const errorMessage = error.message || "Internal Server Error";
    const status = error.status || 500;
    return res.status(status).json({ error: errorMessage });
  }
}

// --- HANDLERS ---

async function handleGeminiRequest(apiKey, assets, systemPrompt) {
  const contentParts = [{ text: systemPrompt }];

  assets.forEach((asset, index) => {
    contentParts.push({ text: `\n\n--- INPUT ASSET ${index + 1} ---` });
    
    if (Array.isArray(asset.data)) {
      // Video frames
      asset.data.forEach(frameBase64 => {
        contentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
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
    const error = new Error(`Gemini API Error ${response.status}: ${errText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("No content returned from Gemini");

  return parseJSONSafely(text);
}

async function handleOpenAIStyleRequest(apiKey, assets, endpoint, model, systemPrompt) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: [] }
  ];

  assets.forEach((asset, index) => {
    messages[1].content.push({ type: "text", text: `\n\n--- INPUT ASSET ${index + 1} ---` });
    
    if (Array.isArray(asset.data)) {
      // Video Frames
      asset.data.forEach(frameBase64 => {
        messages[1].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${frameBase64}`
          }
        });
      });
    } else {
      // Single Image
      const mime = asset.mimeType || "image/jpeg";
      messages[1].content.push({
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
    const error = new Error(`API Error ${response.status} (${model}): ${errText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error(`No content returned from ${model}`);

  return parseJSONSafely(text);
}

function parseJSONSafely(text) {
  try {
    // Clean up markdown code blocks if present
    const cleaned = text.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
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
