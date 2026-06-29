// src/services/missionAiService.js

import {
  buildEvaluationRulesText,
  buildMissionRulesText
} from "./missionAiRules";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

const GEMINI_FALLBACK_MODEL =
  import.meta.env.VITE_GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const cleanJsonText = (text = "") => {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};

const safeJsonParse = (text = "") => {
  try {
    return JSON.parse(cleanJsonText(text));
  } catch {
    return null;
  }
};

const buildConversationText = (conversation = []) => {
  return conversation
    .map((message) => {
      const speaker = message.sender === "user" ? "Student" : "NPC";
      return `${speaker}: ${message.text}`;
    })
    .join("\n");
};

const getObjectiveText = (objective) => {
  if (typeof objective === "string") return objective;
  return objective?.text || objective?.title || "";
};

const buildObjectivesText = (objectives = []) => {
  if (!Array.isArray(objectives) || objectives.length === 0) {
    return "Keep a natural conversation and complete the situation.";
  }

  return objectives
    .map((objective, index) => `${index + 1}. ${getObjectiveText(objective)}`)
    .join("\n");
};

const buildMissionContext = ({ mission = {}, userContext = {}, topic = {} }) => {
  return `
MISSION CONTEXT

Topic:
${topic?.title || topic?.titulo || userContext?.topicTitle || "General"}

Mission title:
${mission.title || "Conversation mission"}

Mission description:
${mission.description || "Practice a real-life conversation."}

Scenario:
${mission.scenario || userContext?.situation || "A realistic daily-life situation."}

Goal:
${mission.goal || userContext?.goal || "Complete the situation through conversation."}

NPC role:
${mission.aiRole || "A realistic conversation partner"}

Student level:
${mission.level || userContext?.level || "A1"}

Difficulty:
${mission.difficulty || "adaptive"}

Minimum meaningful replies:
${mission.minReplies || mission.requiredReplies || "AI decides based on quality"}

Objectives:
${buildObjectivesText(mission.objectives)}
`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildGeminiEndpoint = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const callGemini = async (prompt, maxOutputTokens = 900) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const modelsToTry = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL].filter(
    (model, index, array) => model && array.indexOf(model) === index
  );

  let lastError = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(buildGeminiEndpoint(model), {
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
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
              maxOutputTokens
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();

          if ([429, 500, 502, 503, 504].includes(response.status)) {
            lastError = new Error(
              `Gemini temporary error with model ${model}: ${errorText}`
            );

            await sleep(800 * attempt);
            continue;
          }

          throw new Error(`Gemini request failed: ${errorText}`);
        }

        const data = await response.json();

        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim() || "";

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        return text;
      } catch (error) {
        lastError = error;
        await sleep(800 * attempt);
      }
    }
  }

  throw lastError || new Error("Gemini request failed.");
};

export const generatePersonalizedMission = async ({
  topic = {},
  formData = {}
}) => {
  const topicTitle = topic?.title || topic?.titulo || "General";

  const prompt = `
You are an expert instructional designer for language-learning missions.

Create a personalized conversation mission from the student's request.

Topic:
${topicTitle}

Student situation:
${formData.situation || ""}

Student goal:
${formData.goal || ""}

AI/NPC role requested by student:
${formData.aiRole || ""}

Student level:
${formData.level || "Adaptive"}

Rules:
${buildMissionRulesText()}

Return ONLY valid JSON with this exact structure:

{
  "title": "short mission title",
  "description": "short description",
  "scenario": "clear mission scenario",
  "goal": "student goal",
  "aiRole": "NPC role",
  "level": "A1",
  "difficulty": "adaptive",
  "xpReward": 15,
  "estimatedMinutes": 8,
  "minReplies": 6,
  "objectives": [
    {
      "id": "objective_1",
      "text": "objective text",
      "required": true
    }
  ],
  "briefing": {
    "studentInstructions": "short instructions for the student",
    "successCriteria": [
      "criterion 1",
      "criterion 2"
    ]
  }
}

Important:
- minReplies must be between 5 and 10.
- Do not make the mission too easy.
- Objectives must be measurable.
- The mission must stay inside the selected topic.
- The student should review this summary before starting.
`;

  const rawResponse = await callGemini(prompt, 1200);
  const parsed = safeJsonParse(rawResponse);

  if (!parsed) {
    throw new Error("Gemini returned invalid personalized mission JSON.");
  }

  const now = Date.now();

  return {
    id: `custom_${now}`,
    title: parsed.title || `Personalized ${topicTitle} mission`,
    description:
      parsed.description ||
      "A personalized AI mission created from your own context and goal.",
    scenario: parsed.scenario || formData.situation || "",
    goal: parsed.goal || formData.goal || "",
    aiRole: parsed.aiRole || formData.aiRole || "Conversation partner",
    level: parsed.level || formData.level || "Adaptive",
    difficulty: parsed.difficulty || "adaptive",
    xpReward: Number(parsed.xpReward) || 15,
    estimatedMinutes: Number(parsed.estimatedMinutes) || 8,
    minReplies: Math.max(5, Math.min(10, Number(parsed.minReplies) || 6)),
    status: "custom",
    missionType: "conversation",
    feedbackMode: "after_mission",
    correctionMode: "delayed",
    isCustom: true,
    topicId: topic?.id || "",
    topicTitle,
    objectives: Array.isArray(parsed.objectives)
      ? parsed.objectives
      : [
          {
            id: "objective_1",
            text: parsed.goal || formData.goal || "Complete the conversation goal.",
            required: true
          }
        ],
    briefing: {
      studentInstructions:
        parsed.briefing?.studentInstructions ||
        "Complete the conversation naturally. Focus on communication.",
      successCriteria: Array.isArray(parsed.briefing?.successCriteria)
        ? parsed.briefing.successCriteria
        : [
            "Stay inside the mission scenario.",
            "Answer with meaningful replies.",
            "Try to achieve your goal."
          ]
    },
    createdAt: new Date().toISOString()
  };
};

export const generateMissionOpening = async ({
  mission,
  userContext,
  topic
}) => {
  const missionContext = buildMissionContext({
    mission,
    userContext,
    topic
  });

  const prompt = `
You are the NPC in a language-learning mission.

${missionContext}

Rules:
${buildMissionRulesText()}

Write the FIRST NPC message.

Requirements:
- Stay fully in character as: ${mission?.aiRole || "NPC"}.
- Start the situation naturally.
- Do not explain grammar.
- Do not correct anything.
- Keep it short: 1 or 2 sentences.
- Use language appropriate for level: ${mission?.level || userContext?.level || "A1"}.
- Return only the NPC message. No JSON.
`;

  return await callGemini(prompt, 500);
};

export const generateMissionReply = async ({
  mission,
  userContext,
  topic,
  conversation = [],
  userMessage = ""
}) => {
  const missionContext = buildMissionContext({
    mission,
    userContext,
    topic
  });

  const conversationText = buildConversationText(conversation);

  const prompt = `
You are the NPC in a language-learning mission.

${missionContext}

Rules:
${buildMissionRulesText()}

Conversation so far:
${conversationText}

Latest student message:
${userMessage}

Write the next NPC reply.

Important:
- Stay in character as: ${mission?.aiRole || "NPC"}.
- Continue the situation naturally.
- Do NOT correct the student's grammar during the conversation.
- If the student goes off-topic, redirect them to the mission.
- If the student's message is meaningless or unrelated, ask them to answer according to the mission.
- Ask natural follow-up questions.
- Help the student move toward the mission goal.
- Keep the reply short: 1 or 2 sentences.
- Return only the NPC message. No JSON.
`;

  return await callGemini(prompt, 700);
};

export const analyzeMissionState = async ({
  mission,
  userContext,
  topic,
  conversation = []
}) => {
  const missionContext = buildMissionContext({
    mission,
    userContext,
    topic
  });

  const conversationText = buildConversationText(conversation);

  const prompt = `
You are an internal mission controller.

Analyze whether the student can complete this mission yet.

${missionContext}

Rules:
${buildMissionRulesText()}

Conversation:
${conversationText}

Return ONLY valid JSON:

{
  "canComplete": false,
  "progressScore": 0,
  "meaningfulReplies": 0,
  "offTopicReplies": 0,
  "nonsenseReplies": 0,
  "goalProgress": "none",
  "reason": "short reason",
  "nextRequiredAction": "what the student should do next"
}

Decision rules:
- canComplete must be true only if the student has made enough meaningful, relevant replies.
- Do not allow completion if the replies are vague, random, unrelated, or only say things like "yes", "I want", "please".
- For A1/A2, be supportive but still require meaningful communication.
- For B1 or higher, require better quality.
`;

  const rawResponse = await callGemini(prompt, 700);
  const parsed = safeJsonParse(rawResponse);

  if (!parsed) {
    throw new Error("Gemini returned invalid mission state JSON.");
  }

  return {
    canComplete: Boolean(parsed.canComplete),
    progressScore: Number(parsed.progressScore) || 0,
    meaningfulReplies: Number(parsed.meaningfulReplies) || 0,
    offTopicReplies: Number(parsed.offTopicReplies) || 0,
    nonsenseReplies: Number(parsed.nonsenseReplies) || 0,
    goalProgress: parsed.goalProgress || "none",
    reason: parsed.reason || "",
    nextRequiredAction:
      parsed.nextRequiredAction ||
      "Continue the conversation with a more complete answer."
  };
};

export const evaluateMissionConversation = async ({
  mission,
  userContext,
  topic,
  conversation = []
}) => {
  const missionContext = buildMissionContext({
    mission,
    userContext,
    topic
  });

  const conversationText = buildConversationText(conversation);

  const prompt = `
You are an expert language teacher evaluating a completed language-learning mission.

${missionContext}

Evaluation rules:
${buildEvaluationRulesText()}

Conversation:
${conversationText}

Return ONLY valid JSON with this exact structure:

{
  "passed": true,
  "score": 0,
  "stars": 0,
  "xpMultiplier": 0,
  "suggestedLevel": "A1",
  "totalMessages": 0,
  "totalWords": 0,
  "objectivesCompleted": [
    {
      "objective": "objective text",
      "completed": true,
      "evidence": "short evidence"
    }
  ],
  "strengths": [
    "short strength"
  ],
  "improvements": [
    "short improvement"
  ],
  "corrections": [
    {
      "original": "student phrase",
      "suggested": "better phrase",
      "explanation": "brief explanation"
    }
  ],
  "vocabulary": [
    {
      "word": "word or phrase",
      "meaning": "brief meaning"
    }
  ],
  "grammarTips": [
    "short grammar tip"
  ],
  "nextSteps": [
    "short next step"
  ]
}

Important:
- If the conversation was mostly meaningless or unrelated, score must be below 40, passed must be false, stars must be 1, xpMultiplier must be 0.
- If the student did not really achieve the goal, passed must be false.
- Do not reward random messages.
- Be fair but not harsh.
`;

  const rawResponse = await callGemini(prompt, 1500);
  const parsed = safeJsonParse(rawResponse);

  if (!parsed) {
    throw new Error("Gemini returned invalid feedback JSON.");
  }

  return {
    passed: Boolean(parsed.passed),
    score: Number(parsed.score) || 0,
    stars: Number(parsed.stars) || 1,
    xpMultiplier: Number(parsed.xpMultiplier) || 0,
    suggestedLevel: parsed.suggestedLevel || mission?.level || "A1",
    totalMessages: Number(parsed.totalMessages) || 0,
    totalWords: Number(parsed.totalWords) || 0,
    objectivesCompleted: Array.isArray(parsed.objectivesCompleted)
      ? parsed.objectivesCompleted
      : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements)
      ? parsed.improvements
      : [],
    corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
    grammarTips: Array.isArray(parsed.grammarTips)
      ? parsed.grammarTips
      : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
  };
};

export const buildLocalFallbackReply = () => {
  return "I’m having trouble connecting to the AI right now. Please wait a moment and try again.";
};

export const buildLocalFallbackFeedback = ({
  conversation = [],
  mission = {}
}) => {
  const userMessages = conversation.filter(
    (message) => message.sender === "user"
  );

  const totalWords = userMessages
    .map((message) => message.text || "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const passed = userMessages.length >= 5 && totalWords >= 35;

  return {
    passed,
    score: passed ? 65 : 25,
    stars: passed ? 3 : 1,
    xpMultiplier: passed ? 0.5 : 0,
    suggestedLevel: mission?.level || "A1",
    totalMessages: userMessages.length,
    totalWords,
    objectivesCompleted: [],
    strengths: passed
      ? ["You completed a basic conversation and kept the interaction going."]
      : ["You started the conversation."],
    improvements: [
      "Try to write more complete and relevant answers.",
      "Stay focused on the mission scenario."
    ],
    corrections: [],
    vocabulary: [],
    grammarTips: ["Use complete sentences when possible."],
    nextSteps: [
      "Practice the mission again and give more specific answers."
    ]
  };
};

export default {
  generatePersonalizedMission,
  generateMissionOpening,
  generateMissionReply,
  analyzeMissionState,
  evaluateMissionConversation,
  buildLocalFallbackReply,
  buildLocalFallbackFeedback
};