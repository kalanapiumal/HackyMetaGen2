// Vercel Serverless Function
// This replaces server.js for Vercel hosting

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4.5mb', // Vercel has a payload limit of 4.5MB for serverless functions
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

const categoriesString = ADOBE_CATEGORIES.map(c => `${c.id}. ${c.name}`).join('\n');

const generateSystemPrompt = (fileType, isVideo) => `
  You are Hacky MetaGen 3.5, a senior SEO expert for Adobe Stock.
  Your goal is to generate metadata for this ${fileType} to maximize discoverability.
  ${isVideo ? "Note: The input provided is a sequence of 5 frames extracted from the video to represent the WHOLE video action/story." : ""}
  
  STRICT RULES:
  1. **Title**: 100-125 characters. Natural, readable, descriptive. Include high-value keywords. NO keyword stuffing.
  
  2. **Keywords**: Generate EXACTLY 49 keywords. Comma-separated string.
      - **CRITICAL:** Do NOT generate more than 49 keywords. Stop exactly at 49.
      
      **ADOBE STOCK RANKING OPTIMIZATION (CRITICAL):**
      - **The first 5-10 keywords MUST be the most impactful, highly relevant, and descriptive terms.** This primarily determines search ranking.
      - Start with the absolute main subject, core concept, and primary visual elements.
      - Do NOT start with generic terms (like "vector", "illustration", "background") unless they are the primary intent.
      
      **DISTRIBUTION REQUIREMENTS (After the top 10 prioritized keywords):**
      - **Short-tail (1-2 words)**: ~12-13 keywords (25-30%)
      - **Mid-tail (2-3 words)**: ~21-22 keywords (40-45%)
      - **Long-tail (4+ words)**: ~15 keywords (30%)
      
      **CONTENT RULES:**
      - NO brand names, trademarks, or personal names.
      - Describe the subject, style, mood, lighting, and concept.

  3. **Category**: Choose the single most appropriate category ID (1-21) from the list below:
  ${categoriesString}
  
  OUTPUT FORMAT (JSON ONLY):
  {
    "title": "string",
    "keywords": "string (comma separated)",
    "category_id": integer
  }
`;

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { apiKey, mimeType, data, fileType, isVideo } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API Key is required" });
  }

  const contentParts = [{ text: generateSystemPrompt(fileType || 'image', isVideo) }];

  if (isVideo && Array.isArray(data)) {
    data.forEach(frameData => {
      contentParts.push({ inlineData: { mimeType: mimeType, data: frameData } });
    });
  } else {
    contentParts.push({ inlineData: { mimeType: mimeType, data: data } });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: contentParts }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
            error: errorData.error?.message || `API Error: ${response.statusText}` 
        });
    }

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error during processing" });
  }
}