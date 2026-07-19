// src/services/ai/missions/rules/missionEvaluationRules.js

export const MISSION_SCORING_RULES = `
SCORING PRINCIPLES

Evaluate:

- Mission relevance.
- Goal achievement.
- Required objective completion.
- Communicative effectiveness.
- Coherence.
- Vocabulary appropriate to the CEFR level.
- Grammar appropriate to the CEFR level.
- Interaction quality.
- Genuine effort.
- Meaningful participation.

REFERENCE SCORE RANGES

0–39:
- Mostly meaningless, unrelated or insufficient communication.
- Mission goal was not genuinely attempted.
- Required objectives were largely unaddressed.

40–59:
- Some valid communication occurred.
- Participation or goal achievement remains insufficient.
- Important objectives are incomplete.

60–74:
- Acceptable communication.
- Reasonable participation.
- The main situation was handled with limitations.

75–89:
- Good communication.
- Clear goal progress.
- Relevant interaction and generally successful task completion.

90–100:
- Excellent performance for the configured CEFR level.
- Strong communicative effectiveness.
- Clear objective achievement and natural interaction.

IMPORTANT

- Do not reward message quantity alone.
- Do not reward random or unrelated messages.
- Do not require grammatical perfection at lower CEFR levels.
- Judge language relative to the configured CEFR level.
- A strong A1 performance may be simple and short.
- A strong C1 or C2 performance must show substantially greater range, precision and independence.
- The evaluator should return evidence and criterion scores.
- The application should calculate final stars, pass status and XP deterministically whenever possible.
`;

export const MISSION_FEEDBACK_RULES = `
FEEDBACK POLICY

Language:

- Student-facing feedback must be written in Polish.
- Original student phrases must remain in English.
- Suggested corrections must remain in English.
- Vocabulary items must remain in English.
- Explanations and meanings must be written in Polish.

Timing:

- Give corrections only after the mission has finished.
- Do not interrupt the mission conversation with language corrections.

Feedback priorities:

1. Recognise successful communication.
2. Explain the most important improvements.
3. Prioritise errors that affected meaning or natural communication.
4. Give practical next steps appropriate to the CEFR level.

Do not:

- List every minor error.
- Shame or discourage the student.
- Give generic feedback unrelated to the conversation.
- Claim that an objective was completed without evidence.
- Invent student phrases that did not appear.

Corrections must include:

- Original English phrase.
- Improved English phrase.
- Brief explanation in Polish.

Vocabulary feedback must include:

- English word or expression.
- Brief Polish meaning or usage explanation.

Grammar tips:

- Must be based on errors or patterns present in the conversation.
- Must be concise.
- Must be written in Polish.

Next steps:

- Must be specific.
- Must be actionable.
- Must reflect the student's demonstrated needs.
`;

export const MISSION_EVALUATION_RELIABILITY_RULES = `
EVALUATION RELIABILITY

Set manual review or low confidence when:

- The conversation is too short to evaluate reliably.
- Messages are ambiguous.
- There is excessive repetition.
- The conversation is mostly irrelevant.
- The student mixes languages so heavily that English competence cannot be assessed.
- The evidence for objectives is unclear.
- The conversation contains contradictory signals.
- The model cannot determine whether the student genuinely achieved the goal.

Never produce a confident final evaluation when evidence is insufficient.
`;

export default {
  scoring:
    MISSION_SCORING_RULES,

  feedback:
    MISSION_FEEDBACK_RULES,

  reliability:
    MISSION_EVALUATION_RELIABILITY_RULES
};