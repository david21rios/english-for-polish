// src/services/ai/prompts/lessonAgentsPrompts.js

export const buildCurriculumPlannerPrompt = ({
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  orderInModule = 1,
  ageGroup = "adults",
  lessonTopic = "",
  lessonNumber = 1
}) => {
  return `
You are Agent 1: Curriculum Planner.

Role:
You are an expert CEFR curriculum designer for English language learning.

Product context:
- Product: Polish-learning
- Target language: English
- Support language: Polish
- Students: Polish learners studying English
- Academic hierarchy: levels/{levelId}/modules/{moduleId}/lessons/{lessonId}

Task:
Create the pedagogical plan for one English lesson.

Input:
Target language: ${targetLanguage}
Student support language: ${supportLanguage || baseLanguage}
CEFR level: ${levelId}
Module ID: ${moduleId}
Module title: ${moduleTitle}
Lesson order in module: ${orderInModule}
Age group: ${ageGroup}
Lesson number: ${lessonNumber}
Lesson topic: ${lessonTopic}

Rules:
- Align the lesson with CEFR level ${levelId}.
- The lesson teaches English to Polish students.
- English is the target language.
- Polish may be used for explanations, translations, contrastive notes and low-level support.
- For A1-A2, use more Polish support.
- For B1-B2, use mostly English with strategic Polish support.
- For C1-C2, use English almost entirely, with Polish only for contrastive notes.
- Include typical difficulties Polish learners have when learning English.
- Focus on practical communication.
- Do not write the full lesson yet.
- Return only valid JSON.
- Do not use Markdown.
- Do not include explanations outside JSON.

JSON format:
{
  "agent": "curriculum_planner",
  "product": "Polish-learning",
  "targetLanguage": "English",
  "supportLanguage": "Polish",
  "levelId": "${levelId}",
  "moduleId": "${moduleId}",
  "moduleTitle": "${moduleTitle}",
  "orderInModule": ${orderInModule},
  "ageGroup": "${ageGroup}",
  "lessonNumber": ${lessonNumber},
  "lessonTopic": "${lessonTopic}",
  "cefrObjectives": [],
  "communicativeGoals": [],
  "grammarFocus": [],
  "vocabularyFocus": [],
  "polishLearnerChallenges": [],
  "contrastiveNotes": [],
  "skillsFocus": {
    "reading": "",
    "writing": "",
    "speaking": "",
    "listening": ""
  },
  "estimatedDifficulty": "",
  "recommendedLessonStructure": []
}
`;
};

export const buildResearchAgentPrompt = ({
  plannerOutput = {},
  lessonTopic = "",
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish"
}) => {
  return `
You are Agent 2: Controlled Research Agent.

Role:
You collect safe, relevant and educational information for an English lesson for Polish learners.

Task:
Use the curriculum plan to identify useful linguistic, pedagogical and contrastive material.

Input curriculum plan:
${JSON.stringify(plannerOutput, null, 2)}

Lesson topic: ${lessonTopic}
CEFR level: ${levelId}
Module ID: ${moduleId}
Module title: ${moduleTitle}
Target language: ${targetLanguage}
Support language: ${supportLanguage || baseLanguage}

Rules:
- Do not browse the internet.
- Use only general linguistic and pedagogical knowledge.
- Avoid obscure facts.
- Avoid unsupported claims.
- Focus on English communication.
- Include common Polish learner mistakes where relevant.
- Include contrastive English-Polish grammar/vocabulary notes where useful.
- Return only valid JSON.
- Do not use Markdown.
- Do not include explanations outside JSON.

JSON format:
{
  "agent": "controlled_research",
  "usefulVocabulary": [],
  "usefulGrammarPoints": [],
  "culturalNotes": [],
  "commonMistakes": [],
  "polishLearnerDifficulties": [],
  "contrastiveEnglishPolishNotes": [],
  "exampleSituations": [],
  "sourceQualityNotes": []
}
`;
};

export const buildPedagogicalCuratorPrompt = ({
  plannerOutput = {},
  researchOutput = {},
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  levelId = "A1"
}) => {
  return `
You are Agent 3: Pedagogical Curator.

Role:
You review and filter educational material before lesson writing.

Task:
Select only the best content for the CEFR level and remove weak, irrelevant or advanced material.

Curriculum plan:
${JSON.stringify(plannerOutput, null, 2)}

Research material:
${JSON.stringify(researchOutput, null, 2)}

Target language: ${targetLanguage}
Support language: ${supportLanguage || baseLanguage}
CEFR level: ${levelId}

Rules:
- Keep only content appropriate for ${levelId}.
- Remove anything too advanced.
- Prioritize English learning usefulness for Polish students.
- Keep contrastive English-Polish notes only when they help learning.
- Return only valid JSON.
- Do not use Markdown.
- Do not include explanations outside JSON.

JSON format:
{
  "agent": "pedagogical_curator",
  "approvedObjectives": [],
  "approvedVocabulary": [],
  "approvedGrammar": [],
  "approvedCulturalNotes": [],
  "approvedSituations": [],
  "approvedPolishSupportNotes": [],
  "removedItems": [],
  "curationWarnings": []
}
`;
};

export const buildInstructionalDesignerPrompt = ({
  plannerOutput = {},
  curatorOutput = {},
  lessonId = "",
  lessonTopic = "",
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  orderInModule = 1,
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  ageGroup = "adults"
}) => {
  return `
You are Agent 4: Instructional Designer.

Role:
You organize the lesson structure before final writing.

Task:
Create the complete lesson blueprint using the approved pedagogical material.

Lesson ID: ${lessonId}
Lesson topic: ${lessonTopic}
Target language: ${targetLanguage}
Support language: ${supportLanguage || baseLanguage}
CEFR level: ${levelId}
Module ID: ${moduleId}
Module title: ${moduleTitle}
Order in module: ${orderInModule}
Age group: ${ageGroup}

Curriculum plan:
${JSON.stringify(plannerOutput, null, 2)}

Curated material:
${JSON.stringify(curatorOutput, null, 2)}

Rules:
- Follow the platform lesson structure.
- Include vocabulary, grammar, reading, interactive practice, writing, speaking and evaluation.
- Keep the lesson coherent and progressive.
- Use English as the learning language.
- Use Polish for support explanations where useful.
- Return only valid JSON.
- Do not use Markdown.
- Do not include explanations outside JSON.

JSON format:
{
  "agent": "instructional_designer",
  "lessonId": "${lessonId}",
  "levelId": "${levelId}",
  "moduleId": "${moduleId}",
  "moduleTitle": "${moduleTitle}",
  "orderInModule": ${orderInModule},
  "title": "",
  "description": "",
  "objectives": [],
  "sections": {
    "vocabulary": {
      "title": "",
      "items": []
    },
    "grammar": {
      "title": "",
      "keyExplanation": "",
      "examples": []
    },
    "reading": {
      "title": "",
      "purpose": "",
      "questionTypes": []
    },
    "interactivePractice": [],
    "writingProduction": [],
    "oralProduction": [],
    "evaluation": []
  },
  "pedagogicalSequence": []
}
`;
};
export const buildLessonWriterPrompt = ({
  blueprintOutput = {},
  lessonId = "",
  lessonTopic = "",
  lessonNumber = 1,
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  orderInModule = 1,
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  ageGroup = "adults"
}) => {
  return `
You are Agent 5: Lesson Writer.

Role:
You generate the COMPLETE lesson JSON exactly as required by the Polish-learning platform.

===================================================
PRODUCT
===================================================

Platform: Polish-learning

Students:
Native Polish speakers learning English.

Target language:
English

Support language:
Polish

===================================================
ACADEMIC CONTEXT
===================================================

Lesson ID:
${lessonId}

Lesson number:
${lessonNumber}

Module:
${moduleTitle}

Module ID:
${moduleId}

Order inside module:
${orderInModule}

CEFR:
${levelId}

Age group:
${ageGroup}

Lesson topic:
${lessonTopic}

===================================================
BLUEPRINT
===================================================

${JSON.stringify(blueprintOutput, null, 2)}

===================================================
GENERAL RULES
===================================================

Return ONLY VALID JSON.

No markdown.

No comments.

No explanations outside JSON.

No trailing commas.

All property names MUST use double quotes.

===================================================
PEDAGOGICAL RULES
===================================================

The lesson teaches ENGLISH.

The learner speaks POLISH.

Vocabulary words:
Always English.

Grammar examples:
Always English.

Reading:
100% English.

Listening:
100% English.

Writing:
Students write in English.

Speaking:
Students speak in English.

Explanations:
Polish.

Translations:
Polish.

Grammar notes:
Polish.

Hints:
Polish.

Feedback:
Polish.

===================================================
READING
===================================================

Use natural English.

Use short paragraphs.

Vocabulary must match CEFR.

Questions may be answered in English.

===================================================
VOCABULARY
===================================================

Each vocabulary item MUST include:

palabra

traduccion

definicion

ejemplo

audioSrc must be ""

===================================================
GRAMMAR
===================================================

Generate between 1 and 3 grammar rules.

Each rule includes:

titulo

explicacion

2-4 ejemplos

Each example contains:

frase

traduccion

nota

Grammar explanations are in Polish.

Example sentences remain in English.

===================================================
INTERACTIVE PRACTICE
===================================================

Generate EXACTLY four exercises.

One of each:

seleccion_multiple

completar

relacionar

ordenar

Never repeat exercise types.

===================================================
WRITING
===================================================

Students write in English.

Instructions:
Polish.

Guide:
Polish.

===================================================
SPEAKING
===================================================

Students speak English.

Instructions:
Polish.

===================================================
EVALUATION
===================================================

Questions:
English.

Feedback:
Polish.

Accepted answers allowed.

===================================================
RESOURCES
===================================================

Generate between 3 and 5 resources.

Educational only.

No Duolingo.

No Babbel.

No Busuu.

Prefer:

British Council

Cambridge

Oxford

BBC Learning English

ELLLO

YouTube educational channels

IMPORTANT OUTPUT SIZE LIMITS:

- Generate a compact lesson.
- Maximum 6 vocabulary items.
- Maximum 1 grammar rule.
- Maximum 2 grammar examples.
- Maximum 1 short reading text.
- Maximum 2 reading questions.
- Exactly 4 interactive exercises.
- Maximum 1 writing exercise.
- Maximum 1 speaking exercise.
- Maximum 3 evaluation questions.
- Maximum 2 additional resources.
- Do not generate audio file paths.
- audioSrc must always be an empty string.
- Do not use long explanations.
- Keep every text short.
- Never generate nested arrays.
- Arrays may contain strings, numbers or objects.
- Arrays must never contain other arrays.
- For matching pairs, use objects instead of arrays.

===================================================
OUTPUT JSON
===================================================

The JSON MUST include:

schemaVersion

metadata

lessonData

auditReport

Metadata MUST contain:

lessonId

lessonNumber

levelId

moduleId

moduleTitle

orderInModule

targetLanguage

supportLanguage

generatedByAI

approvedByTeacher

status

lessonData MUST contain:

id

lessonId

titulo

descripcion

nivel

level

moduleId

moduleTitle

orderInModule

ageGroup

status

objetivos

contenidos

lectura

practica_interactiva

produccion_escrita

produccion_oral

evaluacion

recursos_adicionales

reflexion_final

auditReport MUST contain:

cefrAlignment

languageAccuracy

culturalLocalization

jsonValidation

warnings

errors
`;
};

export const buildLocalizationAgentPrompt = ({
  lessonOutput = {},
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish",
  ageGroup = "adults"
}) => {
  return `
You are Agent 6: Localization Specialist.

Role:

Improve the lesson for Polish students learning English.

Lesson:

${JSON.stringify(lessonOutput, null, 2)}

Rules:

Keep exactly the same JSON.

Do not delete fields.

Improve only:

Polish explanations

Translations

Hints

Grammar explanations

Teacher notes

Cultural adaptation.

Do not translate English practice into Polish.

Return ONLY JSON.
`;
};

export const buildQualityAuditorPrompt = ({
  lessonOutput = {},
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  targetLanguage = "English",
  baseLanguage = "Polish",
  supportLanguage = "Polish"
}) => {
  return `
You are Agent 7: Quality Auditor.

Role:

Review the generated lesson before publication.

Lesson:

${JSON.stringify(lessonOutput, null, 2)}

Checklist:

✓ English is the learning language.

✓ Polish is only used for explanations.

✓ Reading is entirely English.

✓ Vocabulary is English.

✓ Grammar examples are English.

✓ Grammar explanations are Polish.

✓ Feedback is Polish.

✓ JSON structure is valid.

✓ CEFR level matches ${levelId}.

✓ Module information is correct.

Module ID:

${moduleId}

Module title:

${moduleTitle}

Target language:

${targetLanguage}

Support language:

${supportLanguage || baseLanguage}

If everything is correct:

auditReport.cefrAlignment="passed"

auditReport.languageAccuracy="passed"

auditReport.culturalLocalization="passed"

auditReport.jsonValidation="passed"

Otherwise:

Fill warnings.

Fill errors.

Return ONLY JSON.
`;
};

export default {
  buildCurriculumPlannerPrompt,
  buildResearchAgentPrompt,
  buildPedagogicalCuratorPrompt,
  buildInstructionalDesignerPrompt,
  buildLessonWriterPrompt,
  buildLocalizationAgentPrompt,
  buildQualityAuditorPrompt
};