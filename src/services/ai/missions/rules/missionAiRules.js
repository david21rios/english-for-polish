// src/services/ai/missions/rules/missionAiRules.js

import {
  MISSION_CORE_RULES,
  MISSION_SPECIFIC_INSTRUCTION_POLICY
} from "./missionCoreRules";

import {
  MISSION_LANGUAGE_RULES,
  MISSION_RESPONSE_STYLE_RULES
} from "./missionLanguageRules";

import {
  MISSION_CONVERSATION_BOUNDARIES,
  MISSION_DATA_PROTECTION_RULES,
  MISSION_FAILURE_POLICY,
  MISSION_PROMPT_SECURITY_RULES,
  MISSION_RUNTIME_LIMITS_RULES
} from "./missionSecurityRules";

import {
  MISSION_COMPLETION_RULES,
  MISSION_INTEGRITY_RULES
} from "./missionCompletionRules";

import {
  MISSION_EVALUATION_RELIABILITY_RULES,
  MISSION_FEEDBACK_RULES,
  MISSION_SCORING_RULES
} from "./missionEvaluationRules";

export const MISSION_AI_RULES = {
  core:
    MISSION_CORE_RULES,

  languageByLevel:
    MISSION_LANGUAGE_RULES,

  responseStyle:
    MISSION_RESPONSE_STYLE_RULES,

  missionSpecificInstructionPolicy:
    MISSION_SPECIFIC_INSTRUCTION_POLICY,

  promptSecurity:
    MISSION_PROMPT_SECURITY_RULES,

  conversationLimits:
    MISSION_CONVERSATION_BOUNDARIES,

  dataProtection:
    MISSION_DATA_PROTECTION_RULES,

  runtimeLimits:
    MISSION_RUNTIME_LIMITS_RULES,

  failurePolicy:
    MISSION_FAILURE_POLICY,

  completionControl:
    MISSION_COMPLETION_RULES,

  integrity:
    MISSION_INTEGRITY_RULES,

  scoring:
    MISSION_SCORING_RULES,

  feedback:
    MISSION_FEEDBACK_RULES,

  evaluationReliability:
    MISSION_EVALUATION_RELIABILITY_RULES
};

const joinRules = (
  rules = []
) => {
  return rules
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

export const buildMissionRulesText = ({
  missionInstructions = ""
} = {}) => {
  return joinRules([
    MISSION_AI_RULES.core,
    MISSION_AI_RULES.languageByLevel,
    MISSION_AI_RULES.responseStyle,
    MISSION_AI_RULES.promptSecurity,
    MISSION_AI_RULES.conversationLimits,
    MISSION_AI_RULES.dataProtection,
    MISSION_AI_RULES.runtimeLimits,
    MISSION_AI_RULES.completionControl,
    MISSION_AI_RULES.integrity,
    MISSION_AI_RULES
      .missionSpecificInstructionPolicy,

    missionInstructions
      ? `
MISSION-SPECIFIC ADMINISTRATOR INSTRUCTIONS

${String(
  missionInstructions
).trim()}
        `.trim()
      : ""
  ]);
};

export const buildMissionStateRulesText =
  () => {
    return joinRules([
      MISSION_AI_RULES.core,
      MISSION_AI_RULES.languageByLevel,
      MISSION_AI_RULES.promptSecurity,
      MISSION_AI_RULES.completionControl,
      MISSION_AI_RULES.integrity,
      MISSION_AI_RULES
        .evaluationReliability
    ]);
  };

export const buildEvaluationRulesText =
  () => {
    return joinRules([
      MISSION_AI_RULES.core,
      MISSION_AI_RULES.languageByLevel,
      MISSION_AI_RULES.promptSecurity,
      MISSION_AI_RULES.completionControl,
      MISSION_AI_RULES.integrity,
      MISSION_AI_RULES.scoring,
      MISSION_AI_RULES.feedback,
      MISSION_AI_RULES
        .evaluationReliability
    ]);
  };

export const buildPersonalizedMissionRulesText =
  () => {
    return joinRules([
      MISSION_AI_RULES.core,
      MISSION_AI_RULES.languageByLevel,
      MISSION_AI_RULES.promptSecurity,
      MISSION_AI_RULES.conversationLimits,
      MISSION_AI_RULES.dataProtection,
      MISSION_AI_RULES.runtimeLimits,
      MISSION_AI_RULES
        .missionSpecificInstructionPolicy
    ]);
  };

export const buildFailurePolicyText =
  () => {
    return MISSION_AI_RULES
      .failurePolicy;
  };

export default MISSION_AI_RULES;