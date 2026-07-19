// src/services/topicMissionAttemptService.js

import { db } from "../../firebase";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_ATTEMPTS_LIMIT = 20;
const MAX_ATTEMPTS_LIMIT = 100;

const MAX_ANSWER_CHARACTERS = 12000;
const MAX_CONVERSATION_MESSAGES = 80;
const MAX_MESSAGE_CHARACTERS = 3000;

const MAX_FEEDBACK_ARRAY_ITEMS = 20;
const MAX_OBJECTIVES = 20;
const MAX_CRITERIA = 12;

/*
|--------------------------------------------------------------------------
| Attempt status
|--------------------------------------------------------------------------
*/

export const TOPIC_MISSION_ATTEMPT_STATUS =
  Object.freeze({
    completed: "completed",
    failed: "failed",
    pending: "pending_evaluation",
    review: "manual_review",
    unavailable: "unavailable"
  });

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const isPlainObject = (
  value
) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maximumLength
    );
};

const normalizeSingleLineText = (
  value = "",
  maximumLength = 1000
) => {
  return normalizeText(
    value,
    maximumLength
  ).replace(/\s+/g, " ");
};

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;
};

const normalizeNumber = (
  value,
  {
    fallback = 0,
    minimum = 0,
    maximum = Number.MAX_SAFE_INTEGER,
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

const normalizeStringArray = (
  value,
  maximumItems =
    MAX_FEEDBACK_ARRAY_ITEMS,
  maximumItemLength = 600
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      normalizeText(
        item,
        maximumItemLength
      )
    )
    .filter(Boolean)
    .slice(
      0,
      maximumItems
    );
};

/*
|--------------------------------------------------------------------------
| Firestore paths
|--------------------------------------------------------------------------
*/

export const getTopicProgressDocId = (
  topicId
) => {
  const normalizedTopicId =
    normalizeSingleLineText(
      topicId,
      150
    );

  return `topic_${normalizedTopicId}`;
};

export const getTopicProgressReference = ({
  userId,
  topicId
}) => {
  return doc(
    db,
    "users",
    userId,
    "topicProgress",
    getTopicProgressDocId(
      topicId
    )
  );
};

export const getTopicMissionAttemptsReference =
  ({
    userId,
    topicId
  }) => {
    return collection(
      getTopicProgressReference({
        userId,
        topicId
      }),
      "attempts"
    );
  };

/*
|--------------------------------------------------------------------------
| Conversation normalization
|--------------------------------------------------------------------------
*/

const normalizeConversationSender = (
  sender = ""
) => {
  const normalizedSender =
    String(sender || "")
      .trim()
      .toLowerCase();

  if (
    normalizedSender === "user" ||
    normalizedSender === "student"
  ) {
    return "user";
  }

  return "npc";
};

const normalizeConversationMessage = (
  message = {},
  index = 0
) => {
  if (
    !isPlainObject(message)
  ) {
    return null;
  }

  const text =
    normalizeText(
      message.text ||
        message.content ||
        message.message,
      MAX_MESSAGE_CHARACTERS
    );

  if (!text) {
    return null;
  }

  const sender =
    normalizeConversationSender(
      message.sender ||
        message.role
    );

  return {
    id:
      normalizeSingleLineText(
        message.id,
        150
      ) ||
      `${sender}_${index + 1}`,

    sender,

    text
  };
};

export const normalizeAttemptConversation = (
  conversation = []
) => {
  if (!Array.isArray(conversation)) {
    return [];
  }

  /*
   * Preserve the latest messages if a malformed or abnormally large
   * conversation reaches this service.
   */
  return conversation
    .slice(
      -MAX_CONVERSATION_MESSAGES
    )
    .map(
      (
        message,
        index
      ) =>
        normalizeConversationMessage(
          message,
          index
        )
    )
    .filter(Boolean);
};

/*
|--------------------------------------------------------------------------
| Objective normalization
|--------------------------------------------------------------------------
*/

const normalizeObjectiveResult = (
  objective = {},
  index = 0
) => {
  if (
    typeof objective === "string"
  ) {
    const objectiveText =
      normalizeSingleLineText(
        objective,
        300
      );

    return objectiveText
      ? {
          id:
            `objective_${index + 1}`,

          objective:
            objectiveText,

          required: true,
          attempted: false,
          completed: false,
          evidence: "",
          confidence: null
        }
      : null;
  }

  if (
    !isPlainObject(objective)
  ) {
    return null;
  }

  const objectiveText =
    normalizeSingleLineText(
      objective.objective ||
        objective.text ||
        objective.title,
      300
    );

  if (!objectiveText) {
    return null;
  }

  const confidence =
    Number(
      objective.confidence
    );

  return {
    id:
      normalizeSingleLineText(
        objective.id ||
          objective.objectiveId,
        150
      ) ||
      `objective_${index + 1}`,

    objective:
      objectiveText,

    required:
      normalizeBoolean(
        objective.required,
        true
      ),

    attempted:
      normalizeBoolean(
        objective.attempted,
        objective.completed ===
          true
      ),

    completed:
      normalizeBoolean(
        objective.completed,
        false
      ),

    evidence:
      normalizeText(
        objective.evidence,
        800
      ),

    confidence:
      Number.isFinite(
        confidence
      )
        ? normalizeNumber(
            confidence,
            {
              minimum: 0,
              maximum: 100,
              fallback: 0
            }
          )
        : null
  };
};

const normalizeObjectiveResults = (
  objectives = []
) => {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return objectives
    .map(
      (
        objective,
        index
      ) =>
        normalizeObjectiveResult(
          objective,
          index
        )
    )
    .filter(Boolean)
    .slice(0, MAX_OBJECTIVES);
};

/*
|--------------------------------------------------------------------------
| Correction normalization
|--------------------------------------------------------------------------
*/

const normalizeCorrection = (
  correction = {},
  index = 0
) => {
  if (!isPlainObject(correction)) {
    return null;
  }

  const original =
    normalizeText(
      correction.original ||
        correction.before ||
        correction.studentText,
      600
    );

  const suggested =
    normalizeText(
      correction.suggested ||
        correction.corrected ||
        correction.after,
      600
    );

  if (
    !original ||
    !suggested
  ) {
    return null;
  }

  return {
    id:
      normalizeSingleLineText(
        correction.id,
        120
      ) ||
      `correction_${index + 1}`,

    original,

    suggested,

    explanation:
      normalizeText(
        correction.explanation ||
          correction.reason,
        800
      )
  };
};

const normalizeCorrections = (
  corrections = []
) => {
  if (!Array.isArray(corrections)) {
    return [];
  }

  return corrections
    .map(
      (
        correction,
        index
      ) =>
        normalizeCorrection(
          correction,
          index
        )
    )
    .filter(Boolean)
    .slice(
      0,
      MAX_FEEDBACK_ARRAY_ITEMS
    );
};

/*
|--------------------------------------------------------------------------
| Vocabulary normalization
|--------------------------------------------------------------------------
*/

const normalizeVocabularyItem = (
  item = {},
  index = 0
) => {
  if (typeof item === "string") {
    const word =
      normalizeSingleLineText(
        item,
        200
      );

    return word
      ? {
          id:
            `vocabulary_${index + 1}`,

          word,

          meaning: ""
        }
      : null;
  }

  if (!isPlainObject(item)) {
    return null;
  }

  const word =
    normalizeSingleLineText(
      item.word ||
        item.phrase ||
        item.expression,
      200
    );

  if (!word) {
    return null;
  }

  return {
    id:
      normalizeSingleLineText(
        item.id,
        120
      ) ||
      `vocabulary_${index + 1}`,

    word,

    meaning:
      normalizeText(
        item.meaning ||
          item.definition ||
          item.explanation,
        600
      )
  };
};

const normalizeVocabulary = (
  vocabulary = []
) => {
  if (!Array.isArray(vocabulary)) {
    return [];
  }

  return vocabulary
    .map(
      (
        item,
        index
      ) =>
        normalizeVocabularyItem(
          item,
          index
        )
    )
    .filter(Boolean)
    .slice(
      0,
      MAX_FEEDBACK_ARRAY_ITEMS
    );
};

/*
|--------------------------------------------------------------------------
| Criteria normalization
|--------------------------------------------------------------------------
*/

const normalizeCriterion = (
  criterion
) => {
  if (
    typeof criterion === "number" ||
    typeof criterion === "string"
  ) {
    return {
      score:
        normalizeNumber(
          criterion,
          {
            minimum: 0,
            maximum: 100,
            fallback: 0
          }
        ),

      weight: null
    };
  }

  if (!isPlainObject(criterion)) {
    return {
      score: 0,
      weight: null
    };
  }

  const numericWeight =
    Number(
      criterion.weight
    );

  return {
    score:
      normalizeNumber(
        criterion.score ??
          criterion.value ??
          criterion.rating,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      ),

    weight:
      Number.isFinite(
        numericWeight
      )
        ? normalizeNumber(
            numericWeight,
            {
              minimum: 0,
              maximum: 100,
              fallback: 0
            }
          )
        : null
  };
};

const normalizeCriteria = (
  criteria = {}
) => {
  if (!isPlainObject(criteria)) {
    return {};
  }

  return Object.entries(
    criteria
  )
    .slice(0, MAX_CRITERIA)
    .reduce(
      (
        normalizedCriteria,
        [
          criterionKey,
          criterion
        ]
      ) => {
        const normalizedKey =
          normalizeSingleLineText(
            criterionKey,
            100
          );

        if (normalizedKey) {
          normalizedCriteria[
            normalizedKey
          ] =
            normalizeCriterion(
              criterion
            );
        }

        return normalizedCriteria;
      },
      {}
    );
};

/*
|--------------------------------------------------------------------------
| Feedback normalization
|--------------------------------------------------------------------------
|
| Only pedagogically useful, bounded data is stored in the attempt.
| Large diagnostics and raw model responses are intentionally excluded.
|
*/

export const normalizeAttemptFeedback = (
  feedback = {}
) => {
  if (!isPlainObject(feedback)) {
    return {};
  }

  return {
    status:
      normalizeSingleLineText(
        feedback.status,
        50
      ),

    provider:
      normalizeSingleLineText(
        feedback.provider,
        50
      ),

    isFinal:
      normalizeBoolean(
        feedback.isFinal,
        false
      ),

    passed:
      normalizeBoolean(
        feedback.passed,
        false
      ),

    requiresReview:
      normalizeBoolean(
        feedback.requiresReview,
        false
      ),

    isFallback:
      normalizeBoolean(
        feedback.isFallback,
        false
      ),

    score:
      normalizeNumber(
        feedback.score,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      ),

    criteriaScore:
      normalizeNumber(
        feedback.criteriaScore,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      ),

    stars:
      normalizeNumber(
        feedback.stars,
        {
          minimum: 0,
          maximum: 5,
          fallback: 0
        }
      ),

    confidence:
      normalizeNumber(
        feedback.confidence,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      ),

    suggestedLevel:
      normalizeSingleLineText(
        feedback.suggestedLevel ||
          feedback.levelAssessed,
        20
      ),

    levelAssessed:
      normalizeSingleLineText(
        feedback.levelAssessed,
        20
      ),

    totalMessages:
      normalizeNumber(
        feedback.totalMessages,
        {
          minimum: 0,
          maximum: 10000,
          fallback: 0
        }
      ),

    totalWords:
      normalizeNumber(
        feedback.totalWords,
        {
          minimum: 0,
          maximum: 1000000,
          fallback: 0
        }
      ),

    xpMultiplier:
      normalizeNumber(
        feedback.xpMultiplier,
        {
          minimum: 0,
          maximum: 10,
          fallback: 0,
          integer: false
        }
      ),

    xpAwarded:
      normalizeNumber(
        feedback.xpAwarded,
        {
          minimum: 0,
          maximum: 100000,
          fallback: 0
        }
      ),

    xpReason:
      normalizeSingleLineText(
        feedback.xpReason,
        100
      ),

    canAwardXp:
      normalizeBoolean(
        feedback.canAwardXp,
        false
      ),

    feedbackPolish:
      normalizeText(
        feedback.feedbackPolish,
        3000
      ),

    criteria:
      normalizeCriteria(
        feedback.criteria
      ),

    objectivesCompleted:
      normalizeObjectiveResults(
        feedback.objectivesCompleted
      ),

    strengths:
      normalizeStringArray(
        feedback.strengths
      ),

    improvements:
      normalizeStringArray(
        feedback.improvements
      ),

    corrections:
      normalizeCorrections(
        feedback.corrections
      ),

    vocabulary:
      normalizeVocabulary(
        feedback.vocabulary
      ),

    grammarTips:
      normalizeStringArray(
        feedback.grammarTips
      ),

    nextSteps:
      normalizeStringArray(
        feedback.nextSteps
      )
  };
};

/*
|--------------------------------------------------------------------------
| Attempt status resolution
|--------------------------------------------------------------------------
*/

export const resolveTopicMissionAttemptStatus = (
  feedback = {}
) => {
  if (
    feedback.isFallback === true ||
    feedback.status ===
      "unavailable"
  ) {
    return TOPIC_MISSION_ATTEMPT_STATUS
      .unavailable;
  }

  if (
    feedback.requiresReview ===
      true ||
    feedback.status ===
      "manual_review"
  ) {
    return TOPIC_MISSION_ATTEMPT_STATUS
      .review;
  }

  if (
    feedback.isFinal !== true ||
    feedback.status ===
      "pending_evaluation"
  ) {
    return TOPIC_MISSION_ATTEMPT_STATUS
      .pending;
  }

  if (feedback.passed === true) {
    return TOPIC_MISSION_ATTEMPT_STATUS
      .completed;
  }

  return TOPIC_MISSION_ATTEMPT_STATUS
    .failed;
};

/*
|--------------------------------------------------------------------------
| Attempt validation
|--------------------------------------------------------------------------
*/

const validateAttemptIdentifiers = ({
  userId,
  topicId,
  missionId
}) => {
  if (
    !normalizeSingleLineText(
      userId,
      150
    )
  ) {
    throw new Error(
      "A valid userId is required to save a mission attempt."
    );
  }

  if (
    !normalizeSingleLineText(
      topicId,
      150
    )
  ) {
    throw new Error(
      "A valid topicId is required to save a mission attempt."
    );
  }

  if (
    !normalizeSingleLineText(
      missionId,
      150
    )
  ) {
    throw new Error(
      "A valid missionId is required to save a mission attempt."
    );
  }
};

/*
|--------------------------------------------------------------------------
| Attempt payload
|--------------------------------------------------------------------------
*/

export const buildTopicMissionAttemptData = ({
  userId,
  topicId,
  missionId,

  mission = {},
  answer = "",
  conversation = [],
  userContext = {},
  feedback = {},

  isCustomMission = false,
  alreadyCompleted = false,

  xpAwarded = null,
  attemptSource = "mission_player"
}) => {
  validateAttemptIdentifiers({
    userId,
    topicId,
    missionId
  });

  const normalizedFeedback =
    normalizeAttemptFeedback(
      feedback
    );

  const attemptStatus =
    resolveTopicMissionAttemptStatus(
      normalizedFeedback
    );

  const isReliableCompletion =
    attemptStatus ===
    TOPIC_MISSION_ATTEMPT_STATUS
      .completed;

  const safeXpAwarded =
    isReliableCompletion &&
    normalizedFeedback
      .canAwardXp === true &&
    alreadyCompleted !== true &&
    isCustomMission !== true
      ? normalizeNumber(
          xpAwarded ??
            normalizedFeedback.xpAwarded,
          {
            minimum: 0,
            maximum: 100000,
            fallback: 0
          }
        )
      : 0;

  return {
    userId:
      normalizeSingleLineText(
        userId,
        150
      ),

    topicId:
      normalizeSingleLineText(
        topicId,
        150
      ),

    missionId:
      normalizeSingleLineText(
        missionId,
        150
      ),

    missionTitle:
      normalizeSingleLineText(
        mission.title,
        200
      ),

    missionLevel:
      normalizeSingleLineText(
        mission.level ||
          normalizedFeedback
            .levelAssessed,
        20
      ),

    missionType:
      normalizeSingleLineText(
        mission.missionType ||
          mission.type ||
          "conversation",
        50
      ).toLowerCase(),

    isCustomMission:
      normalizeBoolean(
        isCustomMission,
        false
      ),

    alreadyCompleted:
      normalizeBoolean(
        alreadyCompleted,
        false
      ),

    attemptSource:
      normalizeSingleLineText(
        attemptSource,
        100
      ),

    status:
      attemptStatus,

    isFinal:
      normalizedFeedback
        .isFinal === true,

    passed:
      normalizedFeedback
        .passed === true,

    requiresReview:
      normalizedFeedback
        .requiresReview === true,

    isFallback:
      normalizedFeedback
        .isFallback === true,

    score:
      normalizedFeedback.score,

    stars:
      normalizedFeedback.stars,

    suggestedLevel:
      normalizedFeedback
        .suggestedLevel ||
      null,

    xpAwarded:
      safeXpAwarded,

    answer:
      normalizeText(
        answer,
        MAX_ANSWER_CHARACTERS
      ),

    conversation:
      normalizeAttemptConversation(
        conversation
      ),

    userContext:
      {
        level:
          normalizeSingleLineText(
            userContext.level,
            20
          ),

        ageGroup:
          normalizeSingleLineText(
            userContext.ageGroup,
            50
          ),

        learningLanguage:
          normalizeSingleLineText(
            userContext.learningLanguage,
            50
          ),

        baseLanguage:
          normalizeSingleLineText(
            userContext.baseLanguage,
            50
          )
      },

    feedback:
      normalizedFeedback,

    createdAt:
      serverTimestamp()
  };
};

/*
|--------------------------------------------------------------------------
| Save attempt
|--------------------------------------------------------------------------
*/

export const saveTopicMissionAttempt =
  async ({
    userId,
    topicId,
    missionId,

    mission = {},
    answer = "",
    conversation = [],
    userContext = {},
    feedback = {},

    isCustomMission = false,
    alreadyCompleted = false,
    xpAwarded = null,

    attemptSource =
      "mission_player"
  } = {}) => {
    try {
      const attemptData =
        buildTopicMissionAttemptData({
          userId,
          topicId,
          missionId,

          mission,
          answer,
          conversation,
          userContext,
          feedback,

          isCustomMission,
          alreadyCompleted,
          xpAwarded,
          attemptSource
        });

      const attemptsRef =
        getTopicMissionAttemptsReference({
          userId,
          topicId
        });

      const createdAttempt =
        await addDoc(
          attemptsRef,
          attemptData
        );

      return {
        id:
          createdAttempt.id,

        ...attemptData,

        /*
         * Useful to consumers before the server timestamp resolves.
         */
        createdAtLocal:
          new Date().toISOString()
      };
    } catch (error) {
      console.error(
        "Error saving topic mission attempt:",
        {
          userId,
          topicId,
          missionId,

          code:
            error?.code,

          message:
            error?.message
        }
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Read one attempt
|--------------------------------------------------------------------------
*/

export const getTopicMissionAttempt =
  async ({
    userId,
    topicId,
    attemptId
  } = {}) => {
    if (
      !userId ||
      !topicId ||
      !attemptId
    ) {
      return null;
    }

    try {
      const attemptRef =
        doc(
          getTopicMissionAttemptsReference({
            userId,
            topicId
          }),
          attemptId
        );

      const attemptSnapshot =
        await getDoc(
          attemptRef
        );

      if (
        !attemptSnapshot.exists()
      ) {
        return null;
      }

      return {
        id:
          attemptSnapshot.id,

        ...attemptSnapshot.data()
      };
    } catch (error) {
      console.error(
        "Error getting topic mission attempt:",
        {
          userId,
          topicId,
          attemptId,

          code:
            error?.code,

          message:
            error?.message
        }
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Read recent topic attempts
|--------------------------------------------------------------------------
*/

export const getTopicMissionAttempts =
  async ({
    userId,
    topicId,
    missionId = null,
    status = null,
    maxResults =
      DEFAULT_ATTEMPTS_LIMIT
  } = {}) => {
    if (!userId || !topicId) {
      return [];
    }

    const normalizedLimit =
      normalizeNumber(
        maxResults,
        {
          minimum: 1,
          maximum:
            MAX_ATTEMPTS_LIMIT,
          fallback:
            DEFAULT_ATTEMPTS_LIMIT
        }
      );

    try {
      const queryConstraints = [];

      if (missionId) {
        queryConstraints.push(
          where(
            "missionId",
            "==",
            missionId
          )
        );
      }

      if (status) {
        queryConstraints.push(
          where(
            "status",
            "==",
            status
          )
        );
      }

      queryConstraints.push(
        orderBy(
          "createdAt",
          "desc"
        ),

        limit(
          normalizedLimit
        )
      );

      const attemptsSnapshot =
        await getDocs(
          query(
            getTopicMissionAttemptsReference({
              userId,
              topicId
            }),
            ...queryConstraints
          )
        );

      return attemptsSnapshot.docs.map(
        (attemptDocument) => ({
          id:
            attemptDocument.id,

          ...attemptDocument.data()
        })
      );
    } catch (error) {
      console.error(
        "Error getting topic mission attempts:",
        {
          userId,
          topicId,
          missionId,
          status,

          code:
            error?.code,

          message:
            error?.message
        }
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Read attempts for one mission
|--------------------------------------------------------------------------
*/

export const getAttemptsByMission =
  async ({
    userId,
    topicId,
    missionId,
    maxResults =
      DEFAULT_ATTEMPTS_LIMIT
  } = {}) => {
    if (!missionId) {
      return [];
    }

    return getTopicMissionAttempts({
      userId,
      topicId,
      missionId,
      maxResults
    });
  };

/*
|--------------------------------------------------------------------------
| Default export
|--------------------------------------------------------------------------
*/

export default {
  TOPIC_MISSION_ATTEMPT_STATUS,

  getTopicProgressDocId,
  getTopicProgressReference,
  getTopicMissionAttemptsReference,

  normalizeAttemptConversation,
  normalizeAttemptFeedback,
  resolveTopicMissionAttemptStatus,
  buildTopicMissionAttemptData,

  saveTopicMissionAttempt,
  getTopicMissionAttempt,
  getTopicMissionAttempts,
  getAttemptsByMission
};