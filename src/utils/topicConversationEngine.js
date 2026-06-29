//src/utils/topicConversationEngine.js

const normalizeText = (text = "") => {
  return text.toLowerCase().trim();
};

const hasAnyKeyword = (text = "", keywords = []) => {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
};

const getCleanWords = (text = "") => {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ""))
    .filter((word) => word.length > 1);
};

const hasTooMuchGibberish = (text = "") => {
  const words = getCleanWords(text);

  if (words.length === 0) return true;

  const suspiciousWords = words.filter((word) => {
    const normalized = normalizeText(word);

    const hasVowel = /[aeiouáéíóú]/i.test(normalized);
    const hasTooManyConsonants = /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(
      normalized
    );
    const hasRepeatedChars = /(.)\1{2,}/i.test(normalized);

    return !hasVowel || hasTooManyConsonants || hasRepeatedChars;
  });

  return suspiciousWords.length / words.length >= 0.5;
};

const getContextType = (userContext = {}, topic = {}) => {
  const combinedText = normalizeText(
    `${userContext.profession || ""} ${userContext.situation || ""} ${
      userContext.goal || ""
    } ${topic.title || ""}`
  );

  if (
    hasAnyKeyword(combinedText, [
      "psychologist",
      "psychology",
      "patient",
      "therapy",
      "therapist",
      "mental",
      "anxiety",
      "stress",
      "depression"
    ])
  ) {
    return "psychology";
  }

  if (
    hasAnyKeyword(combinedText, [
      "restaurant",
      "waiter",
      "waitress",
      "food",
      "menu",
      "order",
      "table",
      "bill"
    ])
  ) {
    return "restaurant";
  }

  if (
    hasAnyKeyword(combinedText, [
      "store",
      "shop",
      "customer",
      "clothes",
      "clothing",
      "shirt",
      "pants",
      "size",
      "primark",
      "jacket",
      "dress"
    ])
  ) {
    return "store";
  }

  if (
    hasAnyKeyword(combinedText, [
      "airport",
      "hotel",
      "travel",
      "trip",
      "flight",
      "ticket",
      "reservation",
      "passport"
    ])
  ) {
    return "travel";
  }

  if (
    hasAnyKeyword(combinedText, [
      "work",
      "job",
      "factory",
      "boss",
      "coworker",
      "meeting",
      "interview",
      "company"
    ])
  ) {
    return "work";
  }

  return "general";
};

export const buildFirstNpcMessage = ({ mission, userContext, topic }) => {
  const contextType = getContextType(userContext, topic);
  const goal = userContext?.goal || "practice this situation";

  const messages = {
    psychology:
      "Hello. I am your patient today. I’m feeling a little overwhelmed, and I’m not sure how to explain what is happening to me. Could you help me?",
    restaurant:
      "Hello! Welcome to our restaurant. Would you like a table, or are you ready to order?",
    store:
      "Hello! Welcome to the store. What kind of clothes are you looking for today?",
    travel:
      "Hello! How can I help you with your trip or reservation today?",
    work:
      "Hello. I understand this is a work situation. Can you explain what you need or what happened?",
    general: `Hello! Let’s practice this real-life situation. What would you say first to achieve your goal: "${goal}"?`
  };

  if (mission?.type === "Survival") {
    return `This is a fast situation. ${messages[contextType]}`;
  }

  if (mission?.type === "Challenge") {
    return `There is a small problem to solve. ${messages[contextType]}`;
  }

  return messages[contextType];
};

export const buildNpcReply = ({
  userText,
  turnNumber,
  userContext,
  topic
}) => {
  const contextType = getContextType(userContext, topic);
  const text = normalizeText(userText);

  if (!text || text.length < 4) {
    return "Good start. Try to say a little more so the conversation can continue.";
  }

  if (hasTooMuchGibberish(userText)) {
    return "I am not sure I understood. Try writing a clearer sentence with real words.";
  }

  const flows = {
    psychology: [
      "Thank you for listening. I have been feeling stressed lately. What should I do first?",
      "Sometimes I cannot sleep well. How could I explain this better?",
      "I understand. Could you ask me one more question to understand my situation?",
      "That helps. Can you summarize what you understood from me?"
    ],
    restaurant: [
      "Sure. Would you like something to drink first?",
      "Great. Do you have any allergies or dietary restrictions?",
      "Perfect. Would you like to order now or do you need a few more minutes?",
      "Thank you. Would you like anything else?"
    ],
    store: [
      "Sure. What size are you looking for?",
      "We have that in black, blue, and white. Which color do you prefer?",
      "Would you like to try it on?",
      "Great. Do you want to pay by card or cash?"
    ],
    travel: [
      "Of course. What date do you need?",
      "Do you have your passport or reservation number with you?",
      "Would you prefer a cheaper option or a more comfortable one?",
      "Perfect. Can you confirm your full name, please?"
    ],
    work: [
      "I understand. Is this about your schedule, your task, or a problem with a coworker?",
      "Can you explain what happened in a clear and polite way?",
      "What solution would you like to propose?",
      "Good. Can you say that again in a more professional tone?"
    ],
    general: [
      "Good. Can you give me one more detail?",
      "I understand. What do you need next?",
      "Can you ask a polite question about that?",
      "Great. Can you close the conversation naturally?"
    ]
  };

  const currentFlow = flows[contextType] || flows.general;
  return currentFlow[Math.min(turnNumber - 1, currentFlow.length - 1)];
};

export const evaluateConversationQuality = ({ conversation = [] }) => {
  const userMessages = conversation.filter((item) => item.sender === "user");
  const joinedText = userMessages.map((item) => item.text).join(" ");
  const words = getCleanWords(joinedText);

  let score = 100;
  const problems = [];

  if (userMessages.length < 3) {
    score -= 30;
    problems.push("You need at least 3 meaningful replies.");
  }

  if (words.length < 15) {
    score -= 35;
    problems.push("Your conversation is too short. Try using more complete sentences.");
  }

  if (hasTooMuchGibberish(joinedText)) {
    score -= 45;
    problems.push("Some answers look unclear or random. Try using real words.");
  }

  const averageWordsPerReply =
    userMessages.length > 0 ? words.length / userMessages.length : 0;

  if (averageWordsPerReply < 4) {
    score -= 20;
    problems.push("Each reply should be a little more complete.");
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    passed: finalScore >= 60,
    xpMultiplier:
      finalScore >= 80 ? 1 : finalScore >= 60 ? 0.5 : 0,
    problems,
    totalWords: words.length,
    totalMessages: userMessages.length,
    suggestedLevel: words.length >= 30 ? "A2/B1" : "A1/A2"
  };
};

export const buildBasicFeedback = ({ conversation = [], userContext = {} }) => {
  const quality = evaluateConversationQuality({ conversation });

  const strengths = [];
  const improvements = [...quality.problems];

  if (quality.totalMessages >= 3) {
    strengths.push("You maintained the conversation for several turns.");
  }

  if (quality.totalWords >= 20) {
    strengths.push("You used enough words to express your idea.");
  }

  if (userContext?.goal) {
    strengths.push(`You practiced your goal: ${userContext.goal}.`);
  }

  if (quality.passed) {
    strengths.push("Your conversation had enough quality to complete the mission.");
  } else {
    improvements.push("Improve the conversation before earning full XP.");
  }

  improvements.push(
    "Try to use complete sentences instead of isolated words."
  );

  return {
    strengths,
    improvements,
    totalWords: quality.totalWords,
    totalMessages: quality.totalMessages,
    suggestedLevel: quality.suggestedLevel,
    qualityScore: quality.score,
    passed: quality.passed,
    xpMultiplier: quality.xpMultiplier
  };
};