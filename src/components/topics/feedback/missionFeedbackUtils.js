// src/components/topics/feedback/missionFeedbackUtils.js

/*
|--------------------------------------------------------------------------
| Generic normalization
|--------------------------------------------------------------------------
*/

export const clampFeedbackNumber = (
  value,
  {
    minimum = 0,
    maximum = 100,
    fallback = 0,
    integer = true
  } = {}
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  const boundedValue =
    Math.max(
      minimum,
      Math.min(
        maximum,
        numericValue
      )
    );

  return integer
    ? Math.round(
        boundedValue
      )
    : boundedValue;
};

export const normalizeFeedbackText = (
  value = "",
  maximumLength = 2000
) => {
  return String(
    value || ""
  )
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maximumLength
    );
};

export const normalizeFeedbackArray = (
  value,
  maximumItems = 10
) => {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (item) =>
        item !== null &&
        item !== undefined
    )
    .slice(
      0,
      maximumItems
    );
};

/*
|--------------------------------------------------------------------------
| Result accessors
|--------------------------------------------------------------------------
*/

export const getMissionFeedback = (
  result = {}
) => {
  if (
    result?.feedback &&
    typeof result.feedback ===
      "object" &&
    !Array.isArray(
      result.feedback
    )
  ) {
    return result.feedback;
  }

  /*
   * Compatibility:
   * Some future consumers may pass the evaluation itself instead of:
   *
   * {
   *   feedback: evaluation
   * }
   */
  return result &&
    typeof result ===
      "object" &&
    !Array.isArray(result)
    ? result
    : {};
};

export const getMissionFeedbackScore = (
  feedback = {}
) => {
  return clampFeedbackNumber(
    feedback.score ??
      feedback.qualityScore ??
      feedback.totalScore,
    {
      minimum: 0,
      maximum: 100,
      fallback: 0
    }
  );
};

export const getMissionFeedbackStars = (
  feedback = {}
) => {
  const isPending =
    feedback.isFinal !== true ||
    feedback.requiresReview ===
      true ||
    feedback.isFallback === true;

  if (isPending) {
    return 0;
  }

  return clampFeedbackNumber(
    feedback.stars,
    {
      minimum: 0,
      maximum: 5,
      fallback: 0
    }
  );
};

export const getMissionFeedbackXp = ({
  result = {},
  feedback = {}
} = {}) => {
  const alreadyCompleted =
    result.alreadyCompleted ===
      true ||
    feedback.repeatedCompletion ===
      true;

  const canAwardXp =
    feedback.canAwardXp !==
      false &&
    feedback.isFinal === true &&
    feedback.passed === true &&
    feedback.requiresReview !==
      true &&
    feedback.isFallback !== true &&
    !alreadyCompleted;

  const reportedXp =
    feedback.xpAwarded ??
    result.xpEarned ??
    0;

  return {
    alreadyCompleted,

    canAwardXp,

    xpEarned:
      canAwardXp
        ? clampFeedbackNumber(
            reportedXp,
            {
              minimum: 0,
              maximum: 100000,
              fallback: 0
            }
          )
        : 0,

    totalXp:
      clampFeedbackNumber(
        result.totalXp,
        {
          minimum: 0,
          maximum: 100000000,
          fallback: 0
        }
      ),

    reason:
      normalizeFeedbackText(
        feedback.xpReason,
        100
      )
  };
};

/*
|--------------------------------------------------------------------------
| Feedback state
|--------------------------------------------------------------------------
*/

export const MISSION_FEEDBACK_VIEW_STATUS =
  Object.freeze({
    passed: "passed",
    failed: "failed",
    pending: "pending",
    review: "review",
    unavailable: "unavailable"
  });

export const getMissionFeedbackViewStatus = (
  feedback = {}
) => {
  if (
    feedback.isFallback === true ||
    feedback.status ===
      "unavailable"
  ) {
    return MISSION_FEEDBACK_VIEW_STATUS
      .unavailable;
  }

  if (
    feedback.requiresReview ===
      true ||
    feedback.status ===
      "manual_review"
  ) {
    return MISSION_FEEDBACK_VIEW_STATUS
      .review;
  }

  if (
    feedback.isFinal !== true ||
    feedback.status ===
      "pending_evaluation"
  ) {
    return MISSION_FEEDBACK_VIEW_STATUS
      .pending;
  }

  if (
    feedback.passed === true
  ) {
    return MISSION_FEEDBACK_VIEW_STATUS
      .passed;
  }

  return MISSION_FEEDBACK_VIEW_STATUS
    .failed;
};

export const getMissionFeedbackStatusContent = (
  feedback = {}
) => {
  const status =
    getMissionFeedbackViewStatus(
      feedback
    );

  const contentByStatus = {
    [MISSION_FEEDBACK_VIEW_STATUS
      .passed]: {
      eyebrow:
        "Misja ukończona",

      title:
        "Świetna robota!",

      description:
        "Ukończyłeś praktyczną misję opartą na sytuacji z życia codziennego. Poprawki są wyświetlane dopiero po zakończeniu rozmowy, aby zachować jej naturalny przebieg.",

      gradientClass:
        "from-green-600 to-primary-600",

      accentClass:
        "text-green-100",

      iconType:
        "trophy"
    },

    [MISSION_FEEDBACK_VIEW_STATUS
      .failed]: {
      eyebrow:
        "Misja wymaga dalszej pracy",

      title:
        "Spróbuj ponownie",

      description:
        normalizeFeedbackText(
          feedback.feedbackPolish
        ) ||
        "Rozmowa została oceniona, ale cele misji nie zostały jeszcze wystarczająco zrealizowane.",

      gradientClass:
        "from-orange-600 to-red-600",

      accentClass:
        "text-orange-100",

      iconType:
        "retry"
    },

    [MISSION_FEEDBACK_VIEW_STATUS
      .pending]: {
      eyebrow:
        "Ocena w toku",

      title:
        "Wynik nie jest jeszcze ostateczny",

      description:
        normalizeFeedbackText(
          feedback.feedbackPolish
        ) ||
        "Rozmowa została zachowana, ale nie można jeszcze potwierdzić wyniku ani przyznać XP.",

      gradientClass:
        "from-blue-600 to-primary-600",

      accentClass:
        "text-blue-100",

      iconType:
        "clock"
    },

    [MISSION_FEEDBACK_VIEW_STATUS
      .review]: {
      eyebrow:
        "Wymagana dodatkowa weryfikacja",

      title:
        "Ocena oczekuje na potwierdzenie",

      description:
        normalizeFeedbackText(
          feedback.feedbackPolish
        ) ||
        "Rozmowa wymaga dodatkowej weryfikacji. Wynik i XP nie są jeszcze ostateczne.",

      gradientClass:
        "from-yellow-600 to-orange-600",

      accentClass:
        "text-yellow-100",

      iconType:
        "review"
    },

    [MISSION_FEEDBACK_VIEW_STATUS
      .unavailable]: {
      eyebrow:
        "Ocena niedostępna",

      title:
        "Nie udało się zakończyć oceny",

      description:
        normalizeFeedbackText(
          feedback.feedbackPolish
        ) ||
        "Usługa AI jest chwilowo niedostępna. Rozmowa nie została zatwierdzona i XP nie zostały przyznane.",

      gradientClass:
        "from-gray-700 to-gray-900",

      accentClass:
        "text-gray-200",

      iconType:
        "warning"
    }
  };

  return {
    status,
    ...contentByStatus[
      status
    ]
  };
};

/*
|--------------------------------------------------------------------------
| Confidence and level
|--------------------------------------------------------------------------
*/

export const getMissionFeedbackConfidence = (
  feedback = {}
) => {
  const confidence =
    Number(
      feedback.confidence
    );

  if (
    !Number.isFinite(
      confidence
    )
  ) {
    return null;
  }

  return clampFeedbackNumber(
    confidence,
    {
      minimum: 0,
      maximum: 100,
      fallback: 0
    }
  );
};

export const getMissionFeedbackLevel = (
  feedback = {}
) => {
  return (
    normalizeFeedbackText(
      feedback.suggestedLevel ||
        feedback.levelAssessed ||
        feedback.detectedCefrLevel,
      20
    ) ||
    "A1"
  );
};

/*
|--------------------------------------------------------------------------
| Collections
|--------------------------------------------------------------------------
*/

export const getMissionFeedbackCollections = (
  feedback = {}
) => {
  return {
    objectivesCompleted:
      normalizeFeedbackArray(
        feedback.objectivesCompleted,
        20
      ),

    strengths:
      normalizeFeedbackArray(
        feedback.strengths,
        10
      ),

    improvements:
      normalizeFeedbackArray(
        feedback.improvements,
        10
      ),

    corrections:
      normalizeFeedbackArray(
        feedback.corrections,
        15
      ),

    vocabulary:
      normalizeFeedbackArray(
        feedback.vocabulary,
        15
      ),

    grammarTips:
      normalizeFeedbackArray(
        feedback.grammarTips,
        10
      ),

    nextSteps:
      normalizeFeedbackArray(
        feedback.nextSteps,
        10
      )
  };
};

/*
|--------------------------------------------------------------------------
| Main view model
|--------------------------------------------------------------------------
*/

export const buildMissionFeedbackViewModel = (
  result = {}
) => {
  const feedback =
    getMissionFeedback(
      result
    );

  const statusContent =
    getMissionFeedbackStatusContent(
      feedback
    );

  const xp =
    getMissionFeedbackXp({
      result,
      feedback
    });

  return {
    result,
    feedback,

    ...statusContent,
    ...xp,

    score:
      getMissionFeedbackScore(
        feedback
      ),

    stars:
      getMissionFeedbackStars(
        feedback
      ),

    confidence:
      getMissionFeedbackConfidence(
        feedback
      ),

    level:
      getMissionFeedbackLevel(
        feedback
      ),

    totalMessages:
      clampFeedbackNumber(
        feedback.totalMessages,
        {
          minimum: 0,
          maximum: 10000,
          fallback: 0
        }
      ),

    totalWords:
      clampFeedbackNumber(
        feedback.totalWords,
        {
          minimum: 0,
          maximum: 1000000,
          fallback: 0
        }
      ),

    ...getMissionFeedbackCollections(
      feedback
    ),

    conversation:
      Array.isArray(
        result.conversation
      )
        ? result.conversation
        : []
  };
};

export default {
  clampFeedbackNumber,
  normalizeFeedbackText,
  normalizeFeedbackArray,

  getMissionFeedback,
  getMissionFeedbackScore,
  getMissionFeedbackStars,
  getMissionFeedbackXp,

  MISSION_FEEDBACK_VIEW_STATUS,
  getMissionFeedbackViewStatus,
  getMissionFeedbackStatusContent,

  getMissionFeedbackConfidence,
  getMissionFeedbackLevel,
  getMissionFeedbackCollections,

  buildMissionFeedbackViewModel
};