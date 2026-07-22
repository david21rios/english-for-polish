const INTENTS = Object.freeze({
  workplaceOnboarding: "workplace_onboarding",
  jobInterview: "job_interview",
  healthcareIntake: "healthcare_intake",
  counsellingSession: "counselling_session",
  restaurantService: "restaurant_service",
  hotelReception: "hotel_reception",
  airportControl: "airport_control",
  customerSupport: "customer_support",
  technicalMeeting: "technical_meeting",
  academicConversation: "academic_conversation",
  emergency: "emergency",
  socialConversation: "social_conversation",
  genericRoleplay: "generic_roleplay"
});

export const MISSION_OPENING_INTENTS = INTENTS;

const TEMPLATES = Object.freeze({
  workplace_onboarding: {
    basic: "Good morning. Welcome to your first day at work. I am the office manager. Can you introduce yourself?",
    intermediate: "Good morning and welcome to the company. Before we begin your induction, could you introduce yourself and tell me a little about your background?",
    advanced: "Good morning and welcome aboard. Before we go through your induction and responsibilities, could you introduce yourself and briefly describe your professional background?"
  },
  job_interview: {
    basic: "Good morning. Thank you for coming. Can you tell me a little about yourself?",
    intermediate: "Good morning, and thank you for coming today. Could you introduce yourself and briefly describe your relevant experience?",
    advanced: "Good morning, and thank you for joining us. Could you introduce yourself and outline the experience most relevant to this position?"
  },
  healthcare_intake: {
    basic: "Hello. I am the nurse on duty. Can you tell me what symptoms you have?",
    intermediate: "Hello. I am the nurse on duty. Could you describe your symptoms and tell me when they started?",
    advanced: "Hello. I am the nurse on duty. Could you describe your symptoms, when they began, and whether anything makes them better or worse?"
  },
  counselling_session: {
    basic: "Good morning. Please have a seat. What would you like to talk about today?",
    intermediate: "Good morning. Please have a seat. What would you like us to focus on during today's conversation?",
    advanced: "Good morning. Please make yourself comfortable. What would you find most helpful to explore during today's session?"
  },
  restaurant_service: {
    basic: "Good evening. Welcome to our restaurant. Do you have a reservation?",
    intermediate: "Good evening and welcome. Do you have a reservation, or would you like me to find you a table?",
    advanced: "Good evening and welcome to our restaurant. May I ask whether you have a reservation or any particular seating preference?"
  },
  hotel_reception: {
    basic: "Good afternoon. Welcome to the hotel. Do you have a reservation?",
    intermediate: "Good afternoon and welcome to the hotel. Could I have your name and reservation details, please?",
    advanced: "Good afternoon and welcome. May I have your reservation details so that I can assist you with check-in?"
  },
  airport_control: {
    basic: "Good afternoon. May I see your passport and boarding pass, please?",
    intermediate: "Good afternoon. May I see your passport and boarding pass, and could you confirm your destination?",
    advanced: "Good afternoon. May I inspect your passport and boarding pass before confirming the details of your journey?"
  },
  customer_support: {
    basic: "Hello. I am here to help you. Can you explain the problem?",
    intermediate: "Hello. I am here to help. Could you describe the problem and tell me when it started?",
    advanced: "Hello. I will help you investigate this issue. Could you describe what happened and any troubleshooting you have already tried?"
  },
  technical_meeting: {
    basic: "Good morning. We need to review the system problem. Can you tell me what happened?",
    intermediate: "Good morning. We need to review the reported system issue. Could you explain what you found?",
    advanced: "Good morning. We need to review the system incident reported today. Could you summarize your findings and the likely technical impact?"
  },
  academic_conversation: {
    basic: "Good morning. Today we will talk about your studies. Can you tell me what you are learning?",
    intermediate: "Good morning. Today we will discuss your studies. Could you tell me what you are currently learning and how it is going?",
    advanced: "Good morning. I would like to discuss your academic work today. Could you outline what you are studying and the main challenges you have encountered?"
  },
  emergency: {
    basic: "Hello. I am here to help. Can you tell me what happened?",
    intermediate: "Hello. I am here to help. Please explain what happened and whether anyone is in immediate danger.",
    advanced: "Hello. I am here to assist. Please describe what happened and identify any immediate risks we need to address."
  },
  social_conversation: {
    basic: "Hi. It is good to see you. How are you today?",
    intermediate: "Hi. It is good to see you. How have things been going lately?",
    advanced: "Hi. It is good to see you again. What has been keeping you busy lately?"
  },
  generic_roleplay: {
    basic: "Hello. Let's begin. Can you tell me about the situation?",
    intermediate: "Hello. Let's begin. Could you explain the situation from your point of view?",
    advanced: "Hello. Let's begin. Could you outline the situation and explain what you would like to achieve?"
  }
});

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesTerm = (text, terms) => {
  const padded = ` ${text} `;
  return terms.some((term) =>
    padded.includes(` ${normalizeSearchText(term)} `)
  );
};

const buildSearchContext = (mission = {}) => {
  const objectives = Array.isArray(mission.objectives)
    ? mission.objectives.map((objective) =>
        typeof objective === "string"
          ? objective
          : objective?.text || objective?.objective || objective?.title
      ).filter(Boolean)
    : [];
  const tags = Array.isArray(mission.tags) ? mission.tags : [mission.tags];

  return {
    context: normalizeSearchText([
      mission.scenario,
      mission.goal,
      objectives.join(" "),
      mission.title,
      mission.description,
      tags.filter(Boolean).join(" "),
      mission.conversationType,
      mission.missionType,
      mission.type
    ].filter(Boolean).join(" ")),
    role: normalizeSearchText(mission.aiRole || mission.npc?.role)
  };
};

export const inferMissionOpeningIntent = (mission = {}) => {
  const { context, role } = buildSearchContext(mission);

  if (includesTerm(context, ["emergency", "urgent help", "accident", "immediate danger"])) return INTENTS.emergency;
  if (includesTerm(context, ["job interview", "interview for", "job candidate", "hiring interview"]) || includesTerm(role, ["interviewer", "recruiter"])) return INTENTS.jobInterview;
  if (includesTerm(context, ["first day", "new employee", "new company", "workplace onboarding", "company onboarding", "induction"])) return INTENTS.workplaceOnboarding;
  if (includesTerm(context, ["counselling", "counseling", "psychology consultation", "therapy session", "mental health", "discusses feelings"]) || includesTerm(role, ["psychologist", "therapist", "counsellor", "counselor"])) return INTENTS.counsellingSession;
  if (includesTerm(context, ["medical appointment", "hospital", "clinic", "symptoms", "health consultation"]) || includesTerm(role, ["doctor", "nurse"])) return INTENTS.healthcareIntake;
  if (includesTerm(context, ["restaurant", "dinner reservation", "order dinner", "order food", "restaurant menu"]) || includesTerm(role, ["waiter"])) return INTENTS.restaurantService;
  if (includesTerm(context, ["hotel check in", "hotel reservation", "hotel reception"]) || includesTerm(role, ["hotel receptionist"])) return INTENTS.hotelReception;
  if (includesTerm(context, ["airport", "passport control", "boarding pass", "flight check in"]) || includesTerm(role, ["airport officer", "border officer"])) return INTENTS.airportControl;
  if (includesTerm(context, ["system issue", "system problem", "technical review", "server outage", "system failure", "software bug", "technical meeting"]) || includesTerm(role, ["engineer", "technical lead"])) return INTENTS.technicalMeeting;
  if (includesTerm(context, ["customer support", "support request", "customer complaint", "product problem", "account problem"]) || includesTerm(role, ["support agent", "customer service agent"])) return INTENTS.customerSupport;
  if (includesTerm(context, ["university studies", "academic discussion", "school lesson", "talk about your studies", "what you are learning"]) || includesTerm(role, ["teacher", "professor", "academic tutor"])) return INTENTS.academicConversation;
  if (includesTerm(context, ["casual conversation", "meeting a friend", "social conversation"]) || includesTerm(role, ["friend"])) return INTENTS.socialConversation;
  return INTENTS.genericRoleplay;
};

const getLevelGroup = (level) => {
  if (level === "C1" || level === "C2") return "advanced";
  if (level === "B1" || level === "B2") return "intermediate";
  return "basic";
};

export const buildMissionOpeningTemplate = ({
  mission = {},
  level = "A1"
} = {}) => {
  const intent = inferMissionOpeningIntent(mission);
  const levelGroup = getLevelGroup(level);

  return TEMPLATES[intent]?.[levelGroup] ||
    TEMPLATES.generic_roleplay[levelGroup];
};

export default {
  MISSION_OPENING_INTENTS,
  inferMissionOpeningIntent,
  buildMissionOpeningTemplate
};
