import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let evaluationModule;
let classifierModule;
let jsonModule;
let fallbackModule;
let feedbackUtilsModule;

before(async () => {
  server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });

  [
    evaluationModule,
    classifierModule,
    jsonModule,
    fallbackModule,
    feedbackUtilsModule
  ] = await Promise.all([
    server.ssrLoadModule(
      "/src/services/ai/missions/evaluation/missionEvaluation.js"
    ),
    server.ssrLoadModule(
      "/src/services/ai/missions/evaluation/missionResultClassifier.js"
    ),
    server.ssrLoadModule(
      "/src/services/ai/missions/missionJson.js"
    ),
    server.ssrLoadModule(
      "/src/services/ai/missions/missionFallbacks.js"
    ),
    server.ssrLoadModule(
      "/src/components/topics/feedback/missionFeedbackUtils.js"
    )
  ]);
});

after(async () => {
  await server?.close();
});

const criteriaAt = (score) => ({
  taskAchievement: { score },
  communication: { score },
  relevance: { score },
  grammar: { score },
  vocabulary: { score },
  coherence: { score },
  interaction: { score }
});

const missionWithObjectives = ({ completed = 4, score = 89 } = {}) => {
  const objectives = Array.from({ length: 4 }, (_, index) => ({
    id: `objective_${index + 1}`,
    text: `Required objective ${index + 1}`,
    required: true
  }));

  return {
    mission: {
      id: "result-test",
      title: "Result test",
      description: "Complete the test mission.",
      scenario: "A short professional conversation.",
      goal: "Complete every required objective.",
      aiRole: "manager",
      level: "A1",
      xpReward: 10,
      objectives
    },
    rawEvaluation: {
      passed: false,
      score,
      confidence: 95,
      requiresReview: false,
      criteria: criteriaAt(score),
      objectivesCompleted: objectives.map((objective, index) => ({
        id: objective.id,
        objective: objective.text,
        attempted: true,
        completed: index < completed,
        evidence: index < completed ? "Evidence" : "Not completed",
        confidence: 95
      })),
      strengths: ["Clear communication"],
      improvements: ["Keep practising"]
    },
    conversation: Array.from({ length: 6 }, (_, index) => ({
      sender: "user",
      text: `This is a meaningful answer number ${index + 1}.`
    }))
  };
};

const buildEvaluation = ({
  score,
  completed,
  missionState = {
    canComplete: false,
    progressScore: 10,
    meaningfulReplies: 0,
    offTopicReplies: 6,
    nonsenseReplies: 6,
    goalProgress: "none",
    confidence: 10,
    requiresReview: false
  },
  repeatedCompletion = false,
  externalRequiresReview = false
}) => {
  const fixture = missionWithObjectives({ score, completed });
  fixture.rawEvaluation.requiresReview = externalRequiresReview;

  return evaluationModule.buildMissionEvaluation({
    ...fixture,
    missionState,
    repeatedCompletion
  });
};

test("passes an 89 score with all required objectives despite inconsistent missionState", () => {
  const evaluation = buildEvaluation({ score: 89, completed: 4 });
  const classification = classifierModule.classifyMissionResult(evaluation);

  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.stars, 4);
  assert.equal(evaluation.xpAwarded, 10);
  assert.equal(classification.key, "good");
  assert.equal(classification.visualVariant, "positive");
  assert.notEqual(classification.primaryAction, "retry");

  const content =
    feedbackUtilsModule.getMissionFeedbackStatusContent(
      evaluation
    );

  assert.equal(content.title, "Bardzo dobry wynik");
  assert.doesNotMatch(content.gradientClass, /red/);
});

test("classifies 55 with incomplete objectives as developing", () => {
  const evaluation = buildEvaluation({ score: 55, completed: 2 });
  const classification = classifierModule.classifyMissionResult(evaluation);

  assert.equal(evaluation.passed, false);
  assert.equal(classification.key, "developing");
  assert.equal(classification.stars, 2);
  assert.equal(classification.visualVariant, "warning");
  assert.equal(evaluation.xpAwarded, 0);
});

test("classifies 30 with no objectives as not passed", () => {
  const evaluation = buildEvaluation({ score: 30, completed: 0 });
  const classification = classifierModule.classifyMissionResult(evaluation);

  assert.equal(evaluation.passed, false);
  assert.equal(classification.key, "not_passed");
  assert.equal(classification.stars, 1);
  assert.equal(classification.visualVariant, "danger");
  assert.equal(evaluation.xpAwarded, 0);
});

test("awards the existing partial XP policy at score 72", () => {
  const evaluation = buildEvaluation({ score: 72, completed: 4 });

  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.stars, 3);
  assert.equal(evaluation.xpAwarded, 8);
  assert.equal(classifierModule.classifyMissionResult(evaluation).key, "passed");
});

test("awards excellent stars and XP bonus at score 95", () => {
  const evaluation = buildEvaluation({ score: 95, completed: 4 });

  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.stars, 5);
  assert.equal(evaluation.xpAwarded, 12);
  assert.equal(classifierModule.classifyMissionResult(evaluation).key, "excellent");
});

test("does not approve a high score when a required objective is incomplete", () => {
  const evaluation = buildEvaluation({ score: 95, completed: 3 });
  const classification = classifierModule.classifyMissionResult(evaluation);

  assert.equal(evaluation.passed, false);
  assert.ok(
    evaluation.completionEvaluation.blockerCodes.includes(
      "REQUIRED_OBJECTIVES_NOT_COMPLETED"
    )
  );
  assert.equal(classification.key, "developing");
  assert.equal(classification.stars, 2);
  assert.equal(evaluation.xpAwarded, 0);
});

test("keeps review and fallback results technical and non-awarding", () => {
  const review = buildEvaluation({
    score: 89,
    completed: 4,
    externalRequiresReview: true
  });

  assert.equal(
    classifierModule.classifyMissionResult(review).key,
    "review_required"
  );
  assert.equal(review.xpAwarded, 0);

  const unavailable = classifierModule.classifyMissionResult({
    isFallback: true,
    evaluationCompleted: false,
    isFinal: false,
    passed: false,
    score: null
  });

  assert.equal(unavailable.key, "unavailable");
  assert.equal(unavailable.passed, false);
  assert.equal(unavailable.stars, 0);
  assert.equal(
    classifierModule.classifyMissionResult({}).key,
    "unavailable"
  );
});

test("does not award XP for an already completed mission", () => {
  const evaluation = buildEvaluation({
    score: 89,
    completed: 4,
    repeatedCompletion: true
  });

  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.xpAwarded, 0);
  assert.equal(evaluation.xpReason, "already_completed");
});

test("preserves objective id, attempted and normalized confidence", () => {
  const normalized = jsonModule.normalizeMissionEvaluationJson({
    score: 80,
    objectivesCompleted: [
      {
        id: "goal_1",
        objective: "Introduce yourself",
        attempted: true,
        completed: true,
        evidence: "The student introduced herself.",
        confidence: 0.95
      },
      {
        id: "goal_2",
        objective: "Ask a question",
        attempted: false,
        completed: false,
        evidence: "",
        confidence: "80"
      },
      {
        id: "goal_3",
        objective: "Say goodbye",
        completed: false
      }
    ]
  });

  assert.deepEqual(normalized.objectivesCompleted, [
    {
      id: "goal_1",
      objective: "Introduce yourself",
      attempted: true,
      completed: true,
      evidence: "The student introduced herself.",
      confidence: 95
    },
    {
      id: "goal_2",
      objective: "Ask a question",
      attempted: false,
      completed: false,
      evidence: null,
      confidence: 80
    },
    {
      id: "goal_3",
      objective: "Say goodbye",
      attempted: false,
      completed: false,
      evidence: null,
      confidence: null
    }
  ]);
});

const openingFor = (mission) =>
  fallbackModule.buildLocalFallbackOpening({ mission });

test("builds contextual local openings for supported intentions", () => {
  assert.equal(
    openingFor({
      title: "My first day at work",
      scenario: "It is the employee's first day at a new company and induction begins.",
      goal: "Introduce yourself and answer simple questions.",
      aiRole: "Office manager",
      level: "A1"
    }),
    "Good morning. Welcome to your first day at work. I am the office manager. Can you introduce yourself?"
  );

  assert.match(
    openingFor({
      title: "Company induction",
      scenario: "A new employee begins onboarding at the company.",
      aiRole: "Manager",
      level: "B2"
    }),
    /Before we begin your induction/
  );

  const fixtures = [
    ["counselling_session", { scenario: "A patient discusses feelings in a psychology consultation.", aiRole: "Psychologist" }],
    ["healthcare_intake", { scenario: "A patient arrives with symptoms at a hospital.", aiRole: "Nurse" }],
    ["restaurant_service", { scenario: "A guest arrives at a restaurant and wants a table.", aiRole: "Waiter" }],
    ["airport_control", { scenario: "A passenger is at passport control before a flight.", aiRole: "Airport officer" }],
    ["technical_meeting", { scenario: "Engineers review a system issue and server outage.", aiRole: "Engineer" }],
    ["job_interview", { scenario: "A candidate attends a job interview with a manager.", aiRole: "Manager" }],
    ["academic_conversation", { scenario: "A student discusses university studies with a teacher.", aiRole: "Teacher" }],
    ["customer_support", { scenario: "A customer reports a product problem to support.", aiRole: "Support agent" }]
  ];

  for (const [intent, mission] of fixtures) {
    assert.equal(
      fallbackModule.inferMissionOpeningIntent({ level: "A1", ...mission }),
      intent
    );
    assert.ok(openingFor({ level: "A1", ...mission }).length > 20);
  }
});

test("resolves opening conflicts safely and supports explicit and generic fallbacks", () => {
  assert.equal(
    fallbackModule.inferMissionOpeningIntent({
      scenario: "A candidate attends an interview for a new job.",
      aiRole: "Office manager"
    }),
    "job_interview"
  );

  assert.equal(
    fallbackModule.inferMissionOpeningIntent({
      scenario: "The engineering team investigates a server outage and system failure.",
      aiRole: "Server specialist"
    }),
    "technical_meeting"
  );

  assert.equal(
    fallbackModule.inferMissionOpeningIntent({
      scenario: "A restaurant server welcomes a guest who wants to order dinner.",
      aiRole: "Server"
    }),
    "restaurant_service"
  );

  assert.equal(
    openingFor({
      openingMessage: "Welcome. Please begin when you are ready.",
      scenario: "Anything",
      level: "A1"
    }),
    "Welcome. Please begin when you are ready."
  );

  assert.match(
    openingFor({
      title: "Unknown role",
      scenario: "",
      description: "",
      aiRole: "Unrecognized specialist",
      level: "invalid"
    }),
    /Let's begin/
  );

  const openingWithoutInventedName = openingFor({
    title: "My first day at work",
    scenario: "A new employee starts induction on the first day.",
    goal: "Introduce yourself.",
    aiRole: "Office manager",
    level: "A1",
    studentName: "David"
  });

  assert.doesNotMatch(openingWithoutInventedName, /David/);
});
