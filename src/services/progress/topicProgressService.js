// src/services/topicProgressService.js

import { db } from "../../firebase";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

import {
  buildTopicMissionAttemptData,
  getTopicMissionAttemptsReference,
  getTopicProgressDocId,
  getTopicProgressReference
} from "../missions/topicMissionAttemptService";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const MAX_COMPLETED_MISSIONS = 1000;
const MAX_BEST_RESULTS = 1000;

const MAX_SCORE = 100;
const MAX_STARS = 5;
const MAX_XP_PER_ATTEMPT = 1000;
const MAX_TOTAL_XP = 100000000;

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
    MAX_COMPLETED_MISSIONS
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          normalizeSingleLineText(
            item,
            150
          )
        )
        .filter(Boolean)
    )
  ).slice(
    0,
    maximumItems
  );
};

const normalizeNumericMap = (
  value,
  {
    maximumItems =
      MAX_BEST_RESULTS,

    maximumValue =
      MAX_SCORE
  } = {}
) => {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value)
    .slice(0, maximumItems)
    .reduce(
      (
        normalizedMap,
        [key, mapValue]
      ) => {
        const normalizedKey =
          normalizeSingleLineText(
            key,
            150
          );

        if (!normalizedKey) {
          return normalizedMap;
        }

        normalizedMap[
          normalizedKey
        ] = normalizeNumber(
          mapValue,
          {
            minimum: 0,
            maximum:
              maximumValue,
            fallback: 0
          }
        );

        return normalizedMap;
      },
      {}
    );
};

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const validateProgressIdentifiers = ({
  userId,
  topicId,
  missionId = null
}) => {
  if (
    !normalizeSingleLineText(
      userId,
      150
    )
  ) {
    throw new Error(
      "A valid userId is required."
    );
  }

  if (
    !normalizeSingleLineText(
      topicId,
      150
    )
  ) {
    throw new Error(
      "A valid topicId is required."
    );
  }

  if (
    missionId !== null &&
    !normalizeSingleLineText(
      missionId,
      150
    )
  ) {
    throw new Error(
      "A valid missionId is required."
    );
  }
};

/*
|--------------------------------------------------------------------------
| Evaluation validation
|--------------------------------------------------------------------------
|
| A mission may update official progress only when its evaluation is:
|
| - final;
| - passed;
| - not a fallback;
| - not waiting for manual review.
|
*/

export const isReliableMissionCompletion = (
  feedback = {}
) => {
  return (
    isPlainObject(feedback) &&
    feedback.isFinal === true &&
    feedback.passed === true &&
    feedback.requiresReview !==
      true &&
    feedback.isFallback !== true
  );
};

export const canAwardTopicMissionXp = ({
  feedback = {},
  alreadyCompleted = false,
  isCustomMission = false
} = {}) => {
  return (
    isReliableMissionCompletion(
      feedback
    ) &&
    feedback.canAwardXp === true &&
    Number(
      feedback.xpAwarded
    ) > 0 &&
    alreadyCompleted !== true &&
    isCustomMission !== true
  );
};

/*
|--------------------------------------------------------------------------
| Existing progress normalization
|--------------------------------------------------------------------------
*/

const normalizeCurrentProgress = (
  progressData = {}
) => {
  const completedMissions =
    normalizeStringArray(
      progressData
        .completedMissions
    );

  return {
    totalXp:
      normalizeNumber(
        progressData.totalXp,
        {
          minimum: 0,
          maximum:
            MAX_TOTAL_XP,
          fallback: 0
        }
      ),

    completedMissions,

    completedCount:
      completedMissions.length,

    attemptCount:
      normalizeNumber(
        progressData
          .attemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    successfulAttemptCount:
      normalizeNumber(
        progressData
          .successfulAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    failedAttemptCount:
      normalizeNumber(
        progressData
          .failedAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    pendingAttemptCount:
      normalizeNumber(
        progressData
          .pendingAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    reviewAttemptCount:
      normalizeNumber(
        progressData
          .reviewAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    unavailableAttemptCount:
      normalizeNumber(
        progressData
          .unavailableAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    customAttemptCount:
      normalizeNumber(
        progressData
          .customAttemptCount,
        {
          minimum: 0,
          maximum:
            Number.MAX_SAFE_INTEGER,
          fallback: 0
        }
      ),

    bestScores:
      normalizeNumericMap(
        progressData.bestScores,
        {
          maximumValue:
            MAX_SCORE
        }
      ),

    bestStars:
      normalizeNumericMap(
        progressData.bestStars,
        {
          maximumValue:
            MAX_STARS
        }
      ),

    lastMissionSummary:
      isPlainObject(
        progressData
          .lastMissionSummary
      )
        ? progressData
            .lastMissionSummary
        : null,

    createdAt:
      progressData.createdAt ||
      null
  };
};

/*
|--------------------------------------------------------------------------
| Attempt counters
|--------------------------------------------------------------------------
*/

const buildUpdatedAttemptCounters = ({
  currentProgress,
  attemptStatus,
  isCustomMission
}) => {
  const counters = {
    attemptCount:
      currentProgress
        .attemptCount + 1,

    successfulAttemptCount:
      currentProgress
        .successfulAttemptCount,

    failedAttemptCount:
      currentProgress
        .failedAttemptCount,

    pendingAttemptCount:
      currentProgress
        .pendingAttemptCount,

    reviewAttemptCount:
      currentProgress
        .reviewAttemptCount,

    unavailableAttemptCount:
      currentProgress
        .unavailableAttemptCount,

    customAttemptCount:
      currentProgress
        .customAttemptCount +
      (
        isCustomMission
          ? 1
          : 0
      )
  };

  switch (attemptStatus) {
    case "completed":
      counters.successfulAttemptCount +=
        1;
      break;

    case "failed":
      counters.failedAttemptCount +=
        1;
      break;

    case "manual_review":
      counters.reviewAttemptCount +=
        1;
      break;

    case "unavailable":
      counters.unavailableAttemptCount +=
        1;
      break;

    case "pending_evaluation":
    default:
      counters.pendingAttemptCount +=
        1;
      break;
  }

  return counters;
};

/*
|--------------------------------------------------------------------------
| Last mission summary
|--------------------------------------------------------------------------
|
| The summary document intentionally excludes:
|
| - complete conversation;
| - complete feedback;
| - raw AI response;
| - diagnostics.
|
| Those fields remain in the attempts subcollection.
|
*/

const buildLastMissionSummary = ({
  attemptId,
  missionId,
  mission,
  attemptData,
  xpAwarded,
  alreadyCompleted
}) => {
  return {
    attemptId,

    missionId:
      normalizeSingleLineText(
        missionId,
        150
      ),

    missionTitle:
      normalizeSingleLineText(
        mission?.title ||
          attemptData
            ?.missionTitle,
        200
      ),

    missionType:
      normalizeSingleLineText(
        mission?.missionType ||
          mission?.type ||
          attemptData
            ?.missionType ||
          "conversation",
        50
      ).toLowerCase(),

    level:
      normalizeSingleLineText(
        mission?.level ||
          attemptData
            ?.missionLevel,
        20
      ),

    status:
      normalizeSingleLineText(
        attemptData?.status,
        50
      ),

    isFinal:
      attemptData?.isFinal ===
      true,

    passed:
      attemptData?.passed ===
      true,

    requiresReview:
      attemptData
        ?.requiresReview ===
      true,

    isFallback:
      attemptData?.isFallback ===
      true,

    isCustomMission:
      attemptData
        ?.isCustomMission ===
      true,

    alreadyCompleted:
      normalizeBoolean(
        alreadyCompleted,
        false
      ),

    score:
      normalizeNumber(
        attemptData?.score,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      ),

    stars:
      normalizeNumber(
        attemptData?.stars,
        {
          minimum: 0,
          maximum: 5,
          fallback: 0
        }
      ),

    xpAwarded:
      normalizeNumber(
        xpAwarded,
        {
          minimum: 0,
          maximum:
            MAX_XP_PER_ATTEMPT,
          fallback: 0
        }
      ),

    completedAt:
      new Date().toISOString()
  };
};

/*
|--------------------------------------------------------------------------
| Read progress
|--------------------------------------------------------------------------
*/

export const getTopicProgress = async (
  userId,
  topicId
) => {
  if (!userId || !topicId) {
    return null;
  }

  validateProgressIdentifiers({
    userId,
    topicId
  });

  try {
    const progressRef =
      getTopicProgressReference({
        userId,
        topicId
      });

    const progressSnapshot =
      await getDoc(
        progressRef
      );

    if (
      !progressSnapshot.exists()
    ) {
      return null;
    }

    return {
      id:
        progressSnapshot.id,

      ...progressSnapshot.data()
    };
  } catch (error) {
    console.error(
      "Error getting topic progress:",
      {
        userId,
        topicId,

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
| Save mission progress and attempt atomically
|--------------------------------------------------------------------------
|
| This transaction:
|
| 1. Reads the latest topic progress.
| 2. Detects whether the official mission was already completed.
| 3. Calculates safe XP.
| 4. Creates a separate attempt document.
| 5. Updates the compact topic summary.
|
| Both writes succeed or both writes fail.
|
*/

export const saveTopicMissionProgress =
  async ({
    userId,
    topicId,
    missionId,

    mission = {},

    xpEarned = null,

    answer = "",
    conversation = [],
    userContext = {},
    feedback = {},

    isCustomMission = false,

    attemptSource =
      "mission_player"
  } = {}) => {
    validateProgressIdentifiers({
      userId,
      topicId,
      missionId
    });

    const normalizedUserId =
      normalizeSingleLineText(
        userId,
        150
      );

    const normalizedTopicId =
      normalizeSingleLineText(
        topicId,
        150
      );

    const normalizedMissionId =
      normalizeSingleLineText(
        missionId,
        150
      );

    const normalizedIsCustomMission =
      normalizeBoolean(
        isCustomMission,
        false
      );

    const progressRef =
      getTopicProgressReference({
        userId:
          normalizedUserId,

        topicId:
          normalizedTopicId
      });

    /*
     * Pre-generate the attempt reference so it can be written inside the
     * same transaction as the progress summary.
     */

    const attemptRef =
      doc(
        getTopicMissionAttemptsReference({
          userId:
            normalizedUserId,

          topicId:
            normalizedTopicId
        })
      );

    try {
      return await runTransaction(
        db,
        async (transaction) => {
          const progressSnapshot =
            await transaction.get(
              progressRef
            );

          const currentProgress =
            normalizeCurrentProgress(
              progressSnapshot.exists()
                ? progressSnapshot.data()
                : {}
            );

          const alreadyCompleted =
            !normalizedIsCustomMission &&
            currentProgress
              .completedMissions
              .includes(
                normalizedMissionId
              );

          const reliableCompletion =
            isReliableMissionCompletion(
              feedback
            );

          /*
           * xpEarned is accepted only for temporary compatibility.
           * The deterministic evaluation value feedback.xpAwarded has
           * priority.
           */

          const reportedXp =
            feedback?.xpAwarded ??
            xpEarned ??
            0;

          const shouldAwardXp =
            canAwardTopicMissionXp({
              feedback,
              alreadyCompleted,
              isCustomMission:
                normalizedIsCustomMission
            });

          const xpToAdd =
            shouldAwardXp
              ? normalizeNumber(
                  reportedXp,
                  {
                    minimum: 0,
                    maximum:
                      MAX_XP_PER_ATTEMPT,
                    fallback: 0
                  }
                )
              : 0;

          const newTotalXp =
            normalizeNumber(
              currentProgress
                .totalXp +
                xpToAdd,
              {
                minimum: 0,
                maximum:
                  MAX_TOTAL_XP,
                fallback:
                  currentProgress
                    .totalXp
              }
            );

          /*
           * Official missions are marked as completed only once.
           *
           * Personalized missions are stored as attempts but do not enter
           * completedMissions and do not award XP in this version.
           */

          const shouldAddCompletion =
            reliableCompletion &&
            !normalizedIsCustomMission &&
            !alreadyCompleted;

          const updatedCompletedMissions =
            shouldAddCompletion
              ? normalizeStringArray([
                  ...currentProgress
                    .completedMissions,

                  normalizedMissionId
                ])
              : currentProgress
                  .completedMissions;

          const score =
            reliableCompletion
              ? normalizeNumber(
                  feedback?.score,
                  {
                    minimum: 0,
                    maximum:
                      MAX_SCORE,
                    fallback: 0
                  }
                )
              : 0;

          const stars =
            reliableCompletion
              ? normalizeNumber(
                  feedback?.stars,
                  {
                    minimum: 0,
                    maximum:
                      MAX_STARS,
                    fallback: 0
                  }
                )
              : 0;

          const previousBestScore =
            normalizeNumber(
              currentProgress
                .bestScores[
                  normalizedMissionId
                ],
              {
                minimum: 0,
                maximum:
                  MAX_SCORE,
                fallback: 0
              }
            );

          const previousBestStars =
            normalizeNumber(
              currentProgress
                .bestStars[
                  normalizedMissionId
                ],
              {
                minimum: 0,
                maximum:
                  MAX_STARS,
                fallback: 0
              }
            );

          /*
           * Only reliable, non-custom evaluations affect best-result maps.
           */

          const shouldUpdateBestResults =
            reliableCompletion &&
            !normalizedIsCustomMission;

          const updatedBestScores =
            shouldUpdateBestResults
              ? {
                  ...currentProgress
                    .bestScores,

                  [normalizedMissionId]:
                    Math.max(
                      previousBestScore,
                      score
                    )
                }
              : currentProgress
                  .bestScores;

          const updatedBestStars =
            shouldUpdateBestResults
              ? {
                  ...currentProgress
                    .bestStars,

                  [normalizedMissionId]:
                    Math.max(
                      previousBestStars,
                      stars
                    )
                }
              : currentProgress
                  .bestStars;

          const attemptData =
            buildTopicMissionAttemptData({
              userId:
                normalizedUserId,

              topicId:
                normalizedTopicId,

              missionId:
                normalizedMissionId,

              mission,

              answer,
              conversation,
              userContext,
              feedback,

              isCustomMission:
                normalizedIsCustomMission,

              alreadyCompleted,

              xpAwarded:
                xpToAdd,

              attemptSource
            });

          const updatedCounters =
            buildUpdatedAttemptCounters({
              currentProgress,

              attemptStatus:
                attemptData.status,

              isCustomMission:
                normalizedIsCustomMission
            });

          const lastMissionSummary =
            buildLastMissionSummary({
              attemptId:
                attemptRef.id,

              missionId:
                normalizedMissionId,

              mission,

              attemptData,

              xpAwarded:
                xpToAdd,

              alreadyCompleted
            });

          const progressData = {
            userId:
              normalizedUserId,

            topicId:
              normalizedTopicId,

            totalXp:
              newTotalXp,

            completedMissions:
              updatedCompletedMissions,

            completedCount:
              updatedCompletedMissions
                .length,

            bestScores:
              updatedBestScores,

            bestStars:
              updatedBestStars,

            ...updatedCounters,

            lastMissionSummary,

            /*
             * Compatibility field for components that still read
             * topicProgress.lastMission.
             */

            lastMission:
              lastMissionSummary,

            updatedAt:
              serverTimestamp()
          };

          if (
            !progressSnapshot.exists()
          ) {
            progressData.createdAt =
              serverTimestamp();
          }

          transaction.set(
            attemptRef,
            attemptData
          );

          transaction.set(
            progressRef,
            progressData,
            {
              merge: true
            }
          );

          return {
            id:
              getTopicProgressDocId(
                normalizedTopicId
              ),

            attemptId:
              attemptRef.id,

            userId:
              normalizedUserId,

            topicId:
              normalizedTopicId,

            missionId:
              normalizedMissionId,

            totalXp:
              newTotalXp,

            xpEarned:
              xpToAdd,

            alreadyCompleted,

            newlyCompleted:
              shouldAddCompletion,

            completedMissions:
              updatedCompletedMissions,

            completedCount:
              updatedCompletedMissions
                .length,

            bestScores:
              updatedBestScores,

            bestStars:
              updatedBestStars,

            lastMission:
              lastMissionSummary,

            lastMissionSummary,

            attempt:
              {
                id:
                  attemptRef.id,

                ...attemptData,

                createdAtLocal:
                  new Date().toISOString()
              },

            ...updatedCounters,

            updatedAtLocal:
              new Date().toISOString()
          };
        }
      );
    } catch (error) {
      console.error(
        "Error saving topic mission progress:",
        {
          userId:
            normalizedUserId,

          topicId:
            normalizedTopicId,

          missionId:
            normalizedMissionId,

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
| Completion helpers
|--------------------------------------------------------------------------
*/

export const hasCompletedTopicMission =
  async ({
    userId,
    topicId,
    missionId
  } = {}) => {
    if (
      !userId ||
      !topicId ||
      !missionId
    ) {
      return false;
    }

    const progress =
      await getTopicProgress(
        userId,
        topicId
      );

    return (
      Array.isArray(
        progress
          ?.completedMissions
      ) &&
      progress.completedMissions.includes(
        missionId
      )
    );
  };

export const getTopicMissionBestResult =
  async ({
    userId,
    topicId,
    missionId
  } = {}) => {
    if (
      !userId ||
      !topicId ||
      !missionId
    ) {
      return null;
    }

    const progress =
      await getTopicProgress(
        userId,
        topicId
      );

    if (!progress) {
      return null;
    }

    const completed =
      Array.isArray(
        progress.completedMissions
      ) &&
      progress.completedMissions.includes(
        missionId
      );

    return {
      missionId,

      completed,

      bestScore:
        normalizeNumber(
          progress
            ?.bestScores?.[
              missionId
            ],
          {
            minimum: 0,
            maximum: 100,
            fallback: 0
          }
        ),

      bestStars:
        normalizeNumber(
          progress
            ?.bestStars?.[
              missionId
            ],
          {
            minimum: 0,
            maximum: 5,
            fallback: 0
          }
        )
    };
  };

/*
|--------------------------------------------------------------------------
| Default export
|--------------------------------------------------------------------------
*/

export default {
  getTopicProgressDocId,

  isReliableMissionCompletion,
  canAwardTopicMissionXp,

  getTopicProgress,
  saveTopicMissionProgress,

  hasCompletedTopicMission,
  getTopicMissionBestResult
};