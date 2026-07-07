// src/services/ai/geminiProvider.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildGeminiApiUrl = () => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
};

const getRetryDelay = (attempt) => {
  return attempt * 3000;
};

const extractGeminiText = (data) => {
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response was generated."
  );
};

export const sendGeminiMessage = async ({
  systemInstruction = "",
  userMessage = "",
  context = "",
  forceJson = false
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
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
    maxOutputTokens: forceJson ? 30000 : 3000
  };

  if (forceJson) {
    generationConfig.responseMimeType = "application/json";
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(buildGeminiApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        return extractGeminiText(data);
      }

      const errorData = await response.json().catch(() => null);
      const status = response.status;

      console.error("Gemini API error:", {
        status,
        attempt,
        errorData
      });

      lastError = new Error(
        errorData?.error?.message || `Gemini API error: ${status}`
      );

      if (
        !RETRYABLE_STATUS_CODES.includes(status) ||
        attempt === MAX_RETRIES
      ) {
        break;
      }

      await wait(getRetryDelay(attempt));
    } catch (error) {
      console.error("Gemini request failed:", {
        attempt,
        error
      });

      lastError = error;

      if (attempt === MAX_RETRIES) {
        break;
      }

      await wait(getRetryDelay(attempt));
    }
  }

  throw new Error(
    lastError?.message ||
      "Gemini is temporarily unavailable. Please try again later."
  );
};

export default {
  sendGeminiMessage
};