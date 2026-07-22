// src/services/ai/missions/missionOpeningService.js

import {
  buildLocalFallbackOpening
} from "./missionFallbacks";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| The opening message is generated locally.
| It must be brief, safe and suitable for the mission context.
|
*/

const MAX_OPENING_CHARACTERS =
  280;

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeOpeningText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .replace(/```(?:text)?/gi, "")
    .replace(/```/g, "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(
      0,
      MAX_OPENING_CHARACTERS
    );
};

const buildMissionOpeningError = ({
  message,
  code,
  cause = null,
  retryable = true,
  status = null,
  details = null
}) => {
  const error =
    new Error(message);

  error.name =
    "MissionOpeningError";

  error.code =
    code;

  error.cause =
    cause;

  error.retryable =
    retryable;

  error.status =
    status;

  error.details =
    details;

  error.operation =
    "mission_opening";

  return error;
};

const validateOpeningInput = ({
  mission
}) => {
  if (
    !mission ||
    typeof mission !==
      "object" ||
    Array.isArray(mission)
  ) {
    throw buildMissionOpeningError({
      message:
        "A valid mission is required to generate the opening message.",

      code:
        "INVALID_MISSION",

      retryable:
        false
    });
  }

  const missionContext =
    String(
      mission.scenario ||
        mission.description ||
        mission.openingMessage ||
        mission.title ||
        mission.aiRole ||
        ""
    ).trim();

  if (!missionContext) {
    throw buildMissionOpeningError({
      message:
        "The mission requires a scenario or description.",

      code:
        "MISSING_MISSION_CONTEXT",

      retryable:
        false
    });
  }
};

/*
|--------------------------------------------------------------------------
| Opening validation
|--------------------------------------------------------------------------
*/

const isValidMissionOpening = (
  openingText
) => {
  const normalizedText =
    normalizeOpeningText(
      openingText
    );

  if (
    normalizedText.length <
    2
  ) {
    return false;
  }

  const forbiddenPatterns = [
    /```/i,
    /^\s*\{/,
    /^\s*\[/,
    /system prompt/i,
    /hidden instructions/i,
    /as an ai language model/i,
    /xp rules/i,
    /scoring rules/i,
    /mission evaluation/i,
    /student feedback/i
  ];

  return !forbiddenPatterns.some(
    (pattern) =>
      pattern.test(
        normalizedText
      )
  );
};

/*
|--------------------------------------------------------------------------
| Public service
|--------------------------------------------------------------------------
*/

export const generateMissionOpening =
  async ({
    mission = {}
  } = {}) => {
    validateOpeningInput({
      mission
    });

    const opening =
      normalizeOpeningText(
        buildLocalFallbackOpening({
          mission
        })
      );

    if (
      !isValidMissionOpening(
        opening
      )
    ) {
      throw buildMissionOpeningError({
        message:
          "The local mission opening is invalid.",

        code:
          "INVALID_LOCAL_MISSION_OPENING",

        retryable:
          false,

        details: {
          responsePreview:
            opening.slice(
              0,
              MAX_OPENING_CHARACTERS
            )
        }
      });
    }

    return opening;
  };

export default {
  generateMissionOpening
};
