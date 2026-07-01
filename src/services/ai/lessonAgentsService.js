// src/services/ai/lessonAgentsService.js

import { sendAIMessage } from "./aiService";

import {
  buildCurriculumPlannerPrompt,
  buildResearchAgentPrompt,
  buildLessonWriterPrompt,
  buildQualityAuditorPrompt
} from "./prompts/lessonAgentsPrompts";

import { validateGeneratedLessonSchema } from "./schemas/lessonSchema";

const DEBUG_AI_AGENTS = true;
const AGENT_DELAY_MS = 8000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractJson = (responseText = "") => {
  try {
    let cleaned = String(responseText)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in AI response.");
    }

    cleaned = cleaned.slice(firstBrace, lastBrace + 1);

    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON parsing error:", error);
    console.error("Raw AI response:", responseText);

    throw new Error(
      "The AI response was incomplete or did not match the required JSON format. The lesson was not saved. Try again with a more specific topic or a simpler lesson scope."
    );
  }
};

const runAgent = async (agentName, prompt) => {
  await wait(AGENT_DELAY_MS);

  const response = await sendAIMessage({
    userMessage: prompt,
    mode: "lesson_generator",
    forceJson: true,
    context:
      "Return only valid JSON. Do not use Markdown. Do not include comments. Do not include trailing commas. Use double quotes for all property names and string values."
  });

  const parsedJson = extractJson(response);

  if (DEBUG_AI_AGENTS) {
    console.log(`${agentName} size:`, JSON.stringify(parsedJson).length);
    console.log(`${agentName} output:`, parsedJson);
  }

  return parsedJson;
};

const compactResearchOutput = (researchOutput = {}) => {
  return {
    agent: researchOutput.agent || "controlled_research",
    usefulVocabulary: (researchOutput.usefulVocabulary || []).slice(0, 12),
    usefulGrammarPoints: (researchOutput.usefulGrammarPoints || []).slice(0, 4),
    culturalNotes: (researchOutput.culturalNotes || []).slice(0, 3),
    commonMistakes: (researchOutput.commonMistakes || []).slice(0, 4),
    exampleSituations: (researchOutput.exampleSituations || []).slice(0, 3),
    sourceQualityNotes: (researchOutput.sourceQualityNotes || []).slice(0, 2)
  };
};

const buildCompactBlueprint = ({
  plannerOutput,
  researchOutput,
  lessonId,
  lessonTopic,
  lessonNumber,
  levelId,
  moduleId,
  moduleTitle,
  orderInModule,
  targetLanguage,
  baseLanguage,
  supportLanguage,
  ageGroup
}) => {
  return {
    agent: "compact_blueprint",
    product: "Polish-learning",

    lessonId,
    lessonNumber,
    orderInModule,
    title: lessonTopic,
    description: `Lesson about ${lessonTopic} for ${levelId} learners.`,

    levelId,
    moduleId,
    moduleTitle,

    targetLanguage,
    baseLanguage,
    supportLanguage,

    ageGroup,

    pedagogicalContext: {
      targetLanguage: "English",
      supportLanguage: "Polish",
      audience: "Polish students learning English",
      cefrLevel: levelId,
      moduleTitle
    },

    objectives: plannerOutput.cefrObjectives || [],
    communicativeGoals: plannerOutput.communicativeGoals || [],
    grammarFocus: plannerOutput.grammarFocus || [],
    vocabularyFocus: plannerOutput.vocabularyFocus || [],
    skillsFocus: plannerOutput.skillsFocus || {},
    approvedMaterial: researchOutput,

    requiredLimits: {
      maxObjectives: 4,
      maxVocabularyItems: 10,
      maxGrammarRules: 2,
      maxGrammarExamplesPerRule: 3,
      maxReadingParagraphs: 3,
      maxReadingQuestions: 3,
      maxPracticeExercises: 5,
      maxWritingExercises: 1,
      maxSpeakingExercises: 1,
      maxEvaluationQuestions: 5
    }
  };
};

const enforcePolishLearningMetadata = ({
  lesson,
  lessonId,
  lessonTopic,
  lessonNumber,
  levelId,
  moduleId,
  moduleTitle,
  orderInModule,
  targetLanguage,
  baseLanguage,
  supportLanguage,
  ageGroup
}) => {
  const lessonData = lesson.lessonData || {};

  return {
    ...lesson,

    lessonData: {
      ...lessonData,
      id: lessonId,
      lessonId,
      titulo: lessonData.titulo || lessonTopic,
      title: lessonData.title || lessonData.titulo || lessonTopic,
      nivel: levelId,
      level: levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      ageGroup,
      status: "draft"
    },

    metadata: {
      ...(lesson.metadata || {}),
      product: "Polish-learning",
      status: "pending_review",
      lessonId,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      audience: "Polish students learning English"
    }
  };
};

export const generateLessonWithAgents = async ({
  lessonId,
  lessonTopic,
  lessonNumber = 1,
  levelId,
  moduleId,
  moduleTitle = "",
  orderInModule = 1,
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  ageGroup = "all"
}) => {
  const executionLog = [];

  try {
    const plannerPrompt = buildCurriculumPlannerPrompt({
      lessonTopic,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      ageGroup
    });

    const plannerOutput = await runAgent("curriculum_planner", plannerPrompt);

    executionLog.push({
      agent: "curriculum_planner",
      status: "completed"
    });

    const researchPrompt = buildResearchAgentPrompt({
      plannerOutput,
      lessonTopic,
      levelId,
      moduleId,
      moduleTitle,
      targetLanguage,
      baseLanguage,
      supportLanguage
    });

    const rawResearchOutput = await runAgent("research_agent", researchPrompt);
    const researchOutput = compactResearchOutput(rawResearchOutput);

    executionLog.push({
      agent: "research_agent",
      status: "completed"
    });

    const compactBlueprint = buildCompactBlueprint({
      plannerOutput,
      researchOutput,
      lessonId,
      lessonTopic,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      ageGroup
    });

    const writerPrompt = buildLessonWriterPrompt({
      blueprintOutput: compactBlueprint,
      lessonId,
      lessonTopic,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      ageGroup
    });

    const lessonOutput = await runAgent("lesson_writer", writerPrompt);

    executionLog.push({
      agent: "lesson_writer",
      status: "completed"
    });

    const auditPrompt = buildQualityAuditorPrompt({
      lessonOutput,
      levelId,
      moduleId,
      moduleTitle,
      targetLanguage,
      baseLanguage,
      supportLanguage
    });

    const auditedLesson = await runAgent("quality_auditor", auditPrompt);

    executionLog.push({
      agent: "quality_auditor",
      status: "completed"
    });

    const finalLesson = enforcePolishLearningMetadata({
      lesson: auditedLesson,
      lessonId,
      lessonTopic,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      ageGroup
    });

    const validation = validateGeneratedLessonSchema(finalLesson);

    if (!validation.valid) {
      return {
        success: false,
        stage: "schema_validation",
        errors: validation.errors,
        executionLog
      };
    }

    return {
      success: true,
      lesson: finalLesson,
      executionLog
    };
  } catch (error) {
    console.error("generateLessonWithAgents error:", error);

    return {
      success: false,
      error: error.message,
      executionLog
    };
  }
};

export default {
  generateLessonWithAgents
};