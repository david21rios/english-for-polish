// src/services/chatbotService.js

import { sendAIMessage } from "./ai/aiService";

const PUBLIC_CHATBOT_RESPONSES = [
  {
    intent: "level_test",
    keywords: [
      "test",
      "level",
      "poziom",
      "placement",
      "exam",
      "egzamin",
      "ewaluacja",
      "ocena",
      "diagnosis",
      "diagnostyczny"
    ],
    answer:
      "Test pomaga określić Twój aktualny poziom i lepiej dobrać ścieżkę nauki. Może obejmować pytania wyboru, czytanie i zadania pisemne, zależnie od konfiguracji instytucji."
  },
  {
    intent: "courses",
    keywords: [
      "course",
      "courses",
      "kurs",
      "kursy",
      "lesson",
      "lessons",
      "lekcja",
      "lekcje",
      "module",
      "modules",
      "moduł",
      "moduły"
    ],
    answer:
      "Nauka jest zorganizowana w poziomy CEFR od A1 do C2. Każdy poziom może zawierać moduły, lekcje, ćwiczenia i aktywności przygotowane lub zatwierdzone przez instytucję."
  },
  {
    intent: "topics",
    keywords: [
      "topic",
      "topics",
      "temat",
      "tematy",
      "mission",
      "missions",
      "misja",
      "misje",
      "practice",
      "praktyka"
    ],
    answer:
      "Misje pozwalają ćwiczyć angielski w sytuacjach z życia codziennego. Możesz realizować cele komunikacyjne, prowadzić rozmowy i otrzymywać informację zwrotną po zakończeniu praktyki."
  },
  {
    intent: "xp",
    keywords: ["xp", "points", "punkty", "score", "wynik", "reward", "nagroda"],
    answer:
      "XP pomaga pokazać Twoją aktywność i postęp. Punkty możesz zdobywać za ukończone aktywności, lekcje lub misje, zależnie od konfiguracji platformy."
  },
  {
    intent: "register",
    keywords: [
      "register",
      "signup",
      "sign up",
      "rejestracja",
      "zarejestrować",
      "konto",
      "utwórz konto",
      "crear cuenta",
      "registro",
      "registrarme",
      "account"
    ],
    answer:
      "Aby korzystać z pełnej ścieżki nauki, utwórz konto, zweryfikuj adres e-mail i zaloguj się. Po zalogowaniu możesz przejść do testu, lekcji, misji i profilu postępów."
  },
  {
    intent: "login",
    keywords: [
      "login",
      "signin",
      "sign in",
      "logowanie",
      "zaloguj",
      "zalogować",
      "iniciar sesión",
      "entrar"
    ],
    answer:
      "Aby wejść do platformy, wybierz opcję logowania i użyj zarejestrowanego adresu e-mail oraz hasła."
  },
  {
    intent: "languages",
    keywords: [
      "language",
      "languages",
      "język",
      "języki",
      "idioma",
      "idiomas",
      "english",
      "angielski",
      "spanish",
      "hiszpański"
    ],
    answer:
      "Aktualna wersja platformy jest skonfigurowana do nauki języka angielskiego z językiem polskim jako wsparciem. Architektura może być w przyszłości dostosowana do innych języków."
  },
  {
    intent: "ai",
    keywords: [
      "ai",
      "ia",
      "chatbot",
      "assistant",
      "asystent",
      "sztuczna inteligencja",
      "inteligencja artificial",
      "inteligencia artificial"
    ],
    answer:
      "Sztuczna inteligencja wspiera praktykę, misje konwersacyjne, generowanie doświadczeń edukacyjnych i informacje zwrotne. Treści akademickie mogą być nadzorowane i zatwierdzane przez instytucję."
  },
  {
    intent: "university",
    keywords: [
      "university",
      "universidad",
      "uniwersytet",
      "institution",
      "instytucja",
      "teacher",
      "docente",
      "nauczyciel",
      "profesor"
    ],
    answer:
      "Platforma może działać jako usługa dla instytucji edukacyjnej. Instytucja zarządza treściami, testami i kryteriami akademickimi, a platforma zapewnia technologię, praktykę, IA i śledzenie postępów."
  }
];

const DEFAULT_PUBLIC_RESPONSE =
  "Mogę pomóc w pytaniach o platformę, rejestrację, logowanie, test poziomu, lekcje, moduły, misje, XP, języki i wsparcie AI.";

const PUBLIC_CHATBOT_CONTEXT = `
You are the public assistant of Polish-learning, an institutional language-learning platform.

The visitor is not logged in yet.

Core identity:
- The current platform is configured for learning English.
- The support language is Polish.
- The platform can be offered as a service for universities or educational institutions.
- The institution can manage, review and approve lessons, tests, modules and academic criteria.
- AI can support lesson creation, practice, missions and feedback, but academic authority belongs to the institution.
- The platform uses CEFR levels A1 to C2.
- The visitor may write in any language.
- Questions about learning English, supported languages, courses, tests, accounts, registration, login, lessons, modules, topics, missions, XP, AI, universities or teachers are related to this platform.

Main behavior:
- Answer questions related to this platform, English learning, registration, login, account creation, email verification, level tests, courses, lessons, modules, topics, missions, XP points, supported languages and AI support.
- If the visitor asks what language they can learn, explain that the current version focuses on English with Polish support.
- If the visitor asks whether they can learn every language, any language or several languages, explain that the current version is configured for English, but the architecture can be adapted to other languages in the future.
- If the visitor asks how the platform works, explain the flow: create account, verify email, log in, take or complete evaluations, follow the academic path, study lessons, practice with exercises and missions, and track progress.
- If the visitor asks whether registration is required, say yes: full learning requires account creation, email verification and login.
- If the visitor asks what happens after the test, explain that results help guide the academic path and progress tracking.
- If the visitor asks about AI, explain that AI supports practice, mission conversations, feedback and content generation, while academic validation can remain under institutional control.
- If the visitor asks about universities or institutions, explain that the platform can operate as a technological service where the university manages content, tests and academic approval.
- If the visitor asks if they can use the platform without registration, explain that public information is available before login, but the full learning experience requires registration and email verification.

Out of scope:
- Do not answer unrelated questions.
- If the visitor asks about weather, politics, personal decisions, health, money, news, entertainment, travel planning, programming, sports or anything unrelated to this platform, politely say that you can only help with questions about the language learning platform.
- If the visitor asks for full language lessons before login, give only a brief orientation and invite them to register for the full learning experience.

Language:
- Always answer in the same language used by the visitor.
- If the visitor writes in Polish, answer in Polish.
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
- If the visitor asks whether the test or platform is free, explain that during the current testing, pilot or public preview phase it may be available without cost, but official pricing must be confirmed by the platform owner or institution.
- Do not invent prices.
- Do not promise permanent free access.

Goal:
- Help visitors understand how the platform works.
- Encourage visitors to register when appropriate.
- Keep the conversation focused on the platform.
`;

const normalizeText = (text = "") => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const findLocalResponse = (message = "") => {
  const normalizedMessage = normalizeText(message);

  return PUBLIC_CHATBOT_RESPONSES.find((item) =>
    item.keywords.some((keyword) =>
      normalizedMessage.includes(normalizeText(keyword))
    )
  );
};

export const getPublicChatbotInitialMessage = () => {
  return "Cześć! Mogę pomóc Ci zrozumieć, jak działa platforma do nauki angielskiego.";
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
      targetLanguage: "English",
      baseLanguage: "Polish",
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