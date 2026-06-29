// src/services/chatbotService.js

import { sendAIMessage } from "./ai/aiService";

const PUBLIC_CHATBOT_RESPONSES = [
  {
    intent: "level_test",
    keywords: ["test", "level", "nivel", "placement", "exam", "prueba", "examen"],
    answer:
      "El test de nivel ayuda a estimar tu nivel de español. Después del test, la plataforma recomienda desde dónde empezar."
  },
  {
    intent: "courses",
    keywords: [
      "course",
      "curso",
      "lesson",
      "lessons",
      "leccion",
      "lección",
      "clases"
    ],
    answer:
      "El curso está organizado por niveles desde A1 hasta C2. Cada nivel contiene lecciones, actividades y práctica."
  },
  {
    intent: "topics",
    keywords: [
      "topic",
      "topics",
      "tema",
      "temas",
      "mission",
      "missions",
      "misión",
      "mision"
    ],
    answer:
      "La sección de temas permite practicar situaciones reales mediante misiones, conversaciones y retos."
  },
  {
    intent: "xp",
    keywords: ["xp", "points", "puntos", "score", "reward", "recompensa"],
    answer:
      "Los puntos XP se ganan al completar actividades y misiones. Ayudan a medir tu avance y mantener la motivación."
  },
  {
    intent: "register",
    keywords: [
      "register",
      "signup",
      "sign up",
      "registro",
      "registrarme",
      "registrar",
      "crear cuenta",
      "account"
    ],
    answer:
      "Sí. Para usar la plataforma completa debes crear una cuenta, verificar tu correo electrónico e iniciar sesión."
  },
  {
    intent: "login",
    keywords: ["login", "signin", "sign in", "iniciar sesión", "entrar"],
    answer:
      "Para ingresar, usa la opción Login e introduce tu correo y contraseña registrados."
  },
  {
    intent: "languages",
    keywords: ["language", "languages", "idioma", "idiomas"],
    answer:
      "La versión actual se enfoca en aprender español. Más adelante la plataforma podrá adaptarse a otros idiomas."
  },
  {
    intent: "ai",
    keywords: [
      "ai",
      "ia",
      "chatbot",
      "assistant",
      "asistente",
      "inteligencia artificial"
    ],
    answer:
      "La plataforma incluye apoyo con IA para practicar español, entender gramática, traducir frases y recibir orientación de aprendizaje."
  }
];

const DEFAULT_PUBLIC_RESPONSE =
  "Puedo ayudarte con preguntas sobre la plataforma, registro, inicio de sesión, test de nivel, cursos, temas, misiones, XP, idiomas disponibles y tutor con IA.";

const PUBLIC_CHATBOT_CONTEXT = `
You are the public assistant of a global language learning platform.

The visitor is not logged in yet.

Core identity:
- The current version of the platform focuses on learning Spanish.
- The platform is designed with a future multilingual architecture.
- In the future, the platform may support other target languages, but currently the available learning language is Spanish.
- The visitor may write in any language.
- Questions about learning languages, supported languages, courses, tests, accounts, registration, login, lessons, topics, missions, XP or AI tutor are considered related to this platform, even if the visitor does not explicitly say "app" or "platform".
- The words "platform", "app", "application", "course", "test", "registration", "lesson", "language", "learn", "study", "account", "AI tutor", and equivalent words in any language usually refer to this platform.

Main behavior:
- Answer questions related to this platform, language learning, Spanish learning, registration, login, account creation, email verification, level test, courses, lessons, topics, missions, XP points, supported languages and AI tutor.
- If the visitor asks what language they can learn, explain that the current version focuses on Spanish.
- If the visitor asks whether they can learn every language, any language, or several languages, explain that the current version focuses on Spanish, but the platform is designed so it can be adapted to other languages in the future.
- If the visitor asks how the platform works, explain the flow: create account, verify email, log in, take level test, follow recommended course path, practice with lessons, topics and missions, use AI tutor.
- If the visitor asks whether registration is required, say yes: first create an account, verify email, then log in.
- If the visitor asks whether the test comes after registration, say yes: after logging in, the student can take the level test.
- If the visitor asks what happens after the test, explain that the platform recommends a starting level and learning path.
- If the visitor asks about the AI tutor, explain that it helps with Spanish questions, translation, grammar, vocabulary and practice after login.
- If the visitor asks if they can use the platform without registration, explain that public information is available before login, but the full learning experience requires registration and email verification.

Out of scope:
- Do not answer unrelated questions.
- If the visitor asks about weather, politics, personal decisions, health, money, news, entertainment, travel, programming, sports, or anything unrelated to this platform, politely say that you can only help with questions about the language learning platform.
- If the visitor asks for general language lessons before login, give only a brief orientation and invite them to register for the full learning experience.

Language:
- Always answer in the same language used by the visitor.
- If the visitor writes in Spanish, answer in Spanish.
- If the visitor writes in English, answer in English.
- If the visitor writes in another language, answer in that same language if possible.
- Do not assume the visitor's country from the language.

Style:
- Answer in a maximum of 3 short sentences.
- Do not start every answer with "Hola".
- Be brief, clear and helpful.
- Do not use Markdown formatting.
- Do not use asterisks, markdown bullets, tables or code blocks.
- Use plain text only.
- Do not provide technical implementation details.
- Do not mention internal files, APIs, Gemini, OpenAI, Firebase, React or source code.

Pricing:
- Official pricing has not been configured yet.
- If the visitor asks whether the test or platform is free, explain that during the current testing or public preview phase it may be available without cost, but official pricing should be confirmed by the platform owner.
- Do not invent prices.
- Do not promise permanent free access.

Goal:
- Help visitors understand how the platform works.
- Encourage visitors to register when appropriate.
- Keep the conversation focused on the platform.
`;

const normalizeText = (text = "") => {
  return text.toLowerCase().trim();
};

const findLocalResponse = (message = "") => {
  const normalizedMessage = normalizeText(message);

  return PUBLIC_CHATBOT_RESPONSES.find((item) =>
    item.keywords.some((keyword) => normalizedMessage.includes(keyword))
  );
};

export const getPublicChatbotInitialMessage = () => {
  return "Hi! I can help you understand how this Spanish learning platform works.";
};

export const getPublicChatbotResponse = (message = "") => {
  const matchedResponse = findLocalResponse(message);

  if (matchedResponse) {
    return {
      intent: matchedResponse.intent,
      answer: matchedResponse.answer,
      source: "local_faq"
    };
  }

  return {
    intent: "fallback",
    answer: DEFAULT_PUBLIC_RESPONSE,
    source: "local_faq"
  };
};

export const getPublicChatbotAIResponse = async (message = "") => {
  try {
    const aiAnswer = await sendAIMessage({
      userMessage: message,
      mode: "language_tutor",
      currentLevel: "A1-A2",
      targetLanguage: "Spanish",
      baseLanguage: "English",
      context: PUBLIC_CHATBOT_CONTEXT
    });

    return {
      intent: "ai_public_chatbot",
      answer: aiAnswer,
      source: "gemini"
    };
  } catch (error) {
    console.error("Public chatbot AI error:", error);

    const matchedResponse = findLocalResponse(message);

    if (matchedResponse) {
      return {
        intent: matchedResponse.intent,
        answer: matchedResponse.answer,
        source: "local_faq"
      };
    }

    return {
      intent: "fallback",
      answer: DEFAULT_PUBLIC_RESPONSE,
      source: "local_faq"
    };
  }
};