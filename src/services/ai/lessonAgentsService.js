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

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Limpia respuestas Gemini y extrae JSON válido.
 */
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
      "No se pudo crear la lección porque la respuesta de la IA llegó incompleta o no tenía el formato requerido por la plataforma. " +
      "La lección no fue guardada. Intenta nuevamente. Si vuelve a fallar, escribe un tema más específico, reduce la complejidad o verifica el nivel, idioma objetivo, idioma base y grupo de edad."
    );
  }
};

/**
 * Ejecuta un agente IA.
 */
const runAgent = async (agentName, prompt) => {
  await wait(AGENT_DELAY_MS);

  const response = await sendAIMessage({
    userMessage: prompt,
    mode: "lesson_generator",
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

/**
 * Reduce el tamaño del output del Research Agent para evitar prompts gigantes.
 */
const compactResearchOutput = (researchOutput = {}) => {
  return {
    agent: researchOutput.agent || "controlled_research",

    usefulVocabulary: (researchOutput.usefulVocabulary || []).slice(0, 12),

    usefulGrammarPoints: (researchOutput.usefulGrammarPoints || []).slice(0, 4),

    culturalNotes: (researchOutput.culturalNotes || []).slice(0, 2),

    commonMistakes: (researchOutput.commonMistakes || []).slice(0, 3),

    exampleSituations: (researchOutput.exampleSituations || []).slice(0, 2),

    sourceQualityNotes: (researchOutput.sourceQualityNotes || []).slice(0, 2)
  };
};

/**
 * Blueprint mínimo para que el Writer pueda construir la lección final
 * sin depender del Instructional Designer en esta primera versión.
 */
const buildCompactBlueprint = ({
  plannerOutput,
  researchOutput,
  lessonId,
  lessonTopic,
  levelId,
  targetLanguage,
  baseLanguage,
  ageGroup
}) => {
  return {
    agent: "compact_blueprint",
    lessonId,
    title: lessonTopic,
    description: `Introductory lesson about ${lessonTopic} for ${levelId} learners.`,
    targetLanguage,
    baseLanguage,
    levelId,
    ageGroup,
    objectives: plannerOutput.cefrObjectives || [],
    communicativeGoals: plannerOutput.communicativeGoals || [],
    grammarFocus: plannerOutput.grammarFocus || [],
    vocabularyFocus: plannerOutput.vocabularyFocus || [],
    skillsFocus: plannerOutput.skillsFocus || {},
    approvedMaterial: researchOutput,
    requiredLimits: {
      maxObjectives: 4,
      maxVocabularyItems: 10,
      maxGrammarExamples: 4,
      maxReadingParagraphs: 2,
      maxPracticeExercises: 4,
      maxEvaluationQuestions: 4
    }
  };
};

/**
 * Pipeline estable de generación:
 * 1. Curriculum Planner
 * 2. Controlled Research
 * 3. Lesson Writer
 * 4. Quality Auditor
 */
export const generateLessonWithAgents = async ({
  lessonId,
  lessonTopic,
  levelId,
  targetLanguage,
  baseLanguage,
  ageGroup,
  lessonNumber = 1
}) => {
  const executionLog = [];

  try {
    /*
    ==========================================
    AGENTE 1: Curriculum Planner
    ==========================================
    */
    const plannerPrompt = buildCurriculumPlannerPrompt({
      lessonTopic,
      lessonNumber,
      levelId,
      targetLanguage,
      baseLanguage,
      ageGroup
    });

    const plannerOutput = await runAgent(
      "curriculum_planner",
      plannerPrompt
    );

    executionLog.push({
      agent: "curriculum_planner",
      status: "completed"
    });

    /*
    ==========================================
    AGENTE 2: Controlled Research
    ==========================================
    */
    const researchPrompt = buildResearchAgentPrompt({
      plannerOutput,
      targetLanguage,
      baseLanguage
    });

    const rawResearchOutput = await runAgent(
      "research_agent",
      researchPrompt
    );

    const researchOutput = compactResearchOutput(rawResearchOutput);

    executionLog.push({
      agent: "research_agent",
      status: "completed"
    });

    /*
    ==========================================
    AGENTE 3: Lesson Writer
    ==========================================
    */
    const compactBlueprint = buildCompactBlueprint({
      plannerOutput,
      researchOutput,
      lessonId,
      lessonTopic,
      levelId,
      targetLanguage,
      baseLanguage,
      ageGroup
    });

    const writerPrompt = buildLessonWriterPrompt({
      blueprintOutput: compactBlueprint,
      lessonId,
      lessonTopic,
      levelId,
      targetLanguage,
      baseLanguage,
      ageGroup
    });

    const lessonOutput = await runAgent(
      "lesson_writer",
      writerPrompt
    );

    executionLog.push({
      agent: "lesson_writer",
      status: "completed"
    });

    /*
    ==========================================
    AGENTE 4: Quality Auditor
    ==========================================
    */
    const auditPrompt = buildQualityAuditorPrompt({
      lessonOutput,
      levelId,
      targetLanguage,
      baseLanguage
    });

    const finalLesson = await runAgent(
      "quality_auditor",
      auditPrompt
    );

    executionLog.push({
      agent: "quality_auditor",
      status: "completed"
    });

    /*
    ==========================================
    VALIDACIÓN LOCAL
    ==========================================
    */
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