// src/services/ai/geminiProvider.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export const sendGeminiMessage = async ({
  systemInstruction = "",
  userMessage = "",
  context = "",
  forceJson = false
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key no configurada.");
  }

  const prompt = `
${systemInstruction}

Context:
${context}

User request:
${userMessage}
`;

  const generationConfig = {
    temperature: forceJson ? 0.2 : 0.7,
    topP: forceJson ? 0.8 : 0.9,
    maxOutputTokens: forceJson ? 4096 : 1200
  };

  if (forceJson) {
    generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("Gemini API error:", errorData);
    throw new Error("Error al comunicarse con Gemini.");
  }

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No pude generar una respuesta."
  );
};

export default {
  sendGeminiMessage
};