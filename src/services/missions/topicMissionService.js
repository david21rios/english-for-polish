// src/services/topicMissionService.js

import { db } from "../../firebase";

import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "firebase/firestore";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_MAX_RESULTS = 3;
const DEFAULT_MISSIONS_PER_TOPIC_LIMIT = 25;
const MAX_RESULTS_LIMIT = 50;
const MAX_MISSIONS_PER_TOPIC_LIMIT = 100;

const PUBLISHED_STATUS = "published";

const INACTIVE_TOPIC_STATUSES = new Set([
  "archived",
  "deleted",
  "inactive",
  "disabled"
]);

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
    .slice(0, maximumLength);
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

const normalizePositiveInteger = (
  value,
  {
    fallback = 0,
    minimum = 0,
    maximum = Number.MAX_SAFE_INTEGER
  } = {}
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue)
  ) {
    return Math.max(
      minimum,
      Math.min(
        maximum,
        Math.round(
          Number(fallback) || 0
        )
      )
    );
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.round(numericValue)
    )
  );
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

const normalizeStringArray = (
  value,
  maximumItems = 20,
  maximumItemLength = 200
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      normalizeSingleLineText(
        item,
        maximumItemLength
      )
    )
    .filter(Boolean)
    .slice(0, maximumItems);
};

/*
|--------------------------------------------------------------------------
| Topic validation
|--------------------------------------------------------------------------
*/

const normalizeTopicStatus = (
  topicData = {}
) => {
  return normalizeSingleLineText(
    topicData.status ||
      "active",
    30
  ).toLowerCase();
};

const isPublicTopic = (
  topicData = {}
) => {
  if (
    !isPlainObject(topicData)
  ) {
    return false;
  }

  const status =
    normalizeTopicStatus(
      topicData
    );

  const softDeleted =
    topicData.isDeleted === true ||
    topicData.deleted === true ||
    Boolean(topicData.deletedAt);

  const explicitlyHidden =
    topicData.isVisible === false ||
    topicData.published === false;

  return (
    !softDeleted &&
    !explicitlyHidden &&
    !INACTIVE_TOPIC_STATUSES.has(
      status
    )
  );
};

/*
|--------------------------------------------------------------------------
| Objective normalization
|--------------------------------------------------------------------------
*/

const normalizeMissionObjective = (
  objective,
  index
) => {
  if (
    typeof objective === "string"
  ) {
    const text =
      normalizeSingleLineText(
        objective,
        300
      );

    return text
      ? {
          id:
            `objective_${index + 1}`,

          text,

          required: true
        }
      : null;
  }

  if (
    !isPlainObject(objective)
  ) {
    return null;
  }

  const text =
    normalizeSingleLineText(
      objective.text ||
        objective.title ||
        objective.objective,
      300
    );

  if (!text) {
    return null;
  }

  return {
    id:
      normalizeSingleLineText(
        objective.id,
        100
      ) ||
      `objective_${index + 1}`,

    text,

    required:
      objective.required !== false
  };
};

const normalizeMissionObjectives = (
  objectives
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
        normalizeMissionObjective(
          objective,
          index
        )
    )
    .filter(Boolean)
    .slice(0, 20);
};

/*
|--------------------------------------------------------------------------
| Mission normalization
|--------------------------------------------------------------------------
*/

export const normalizeTopicMission = ({
  topicId,
  missionId,
  missionData = {},
  topicData = {}
}) => {
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

  const topicTitle =
    normalizeSingleLineText(
      topicData.title ||
        topicData.titulo ||
        normalizedTopicId,
      150
    );

  const missionTitle =
    normalizeSingleLineText(
      missionData.title,
      150
    ) ||
    "Untitled mission";

  const missionDescription =
    normalizeText(
      missionData.description,
      700
    ) ||
    "Practice a real-life situation with this topic.";

  const scenario =
    normalizeText(
      missionData.scenario,
      2500
    ) ||
    "Practice a short conversation based on this topic.";

  const level =
    normalizeSingleLineText(
      missionData.level ||
        topicData.level ||
        "A1",
      20
    ).toUpperCase();

  const difficulty =
    normalizeSingleLineText(
      missionData.difficulty ||
        "easy",
      30
    ).toLowerCase();

  const status =
    normalizeSingleLineText(
      missionData.status ||
        "draft",
      30
    ).toLowerCase();

  return {
    id:
      normalizedMissionId,

    missionId:
      normalizedMissionId,

    topicId:
      normalizedTopicId,

    themeId:
      normalizeSingleLineText(
        missionData.themeId ||
          normalizedTopicId,
        150
      ),

    title:
      missionTitle,

    description:
      missionDescription,

    scenario,

    goal:
      normalizeText(
        missionData.goal,
        800
      ),

    aiRole:
      normalizeSingleLineText(
        missionData.aiRole ||
          "Conversation partner",
        150
      ),

    /*
     * Private AI instructions are intentionally not exposed here.
     * This service returns the public mission model only.
     */

    missionType:
      normalizeSingleLineText(
        missionData.missionType ||
          missionData.type ||
          "conversation",
        50
      ).toLowerCase(),

    type:
      normalizeSingleLineText(
        missionData.type ||
          missionData.missionType ||
          "conversation",
        50
      ).toLowerCase(),

    difficulty,

    level,

    xpReward:
      normalizePositiveInteger(
        missionData.xpReward ??
          missionData.xp,
        {
          fallback: 10,
          minimum: 0,
          maximum: 1000
        }
      ),

    estimatedMinutes:
      normalizePositiveInteger(
        missionData.estimatedMinutes,
        {
          fallback: 5,
          minimum: 1,
          maximum: 120
        }
      ),

    minReplies:
      normalizePositiveInteger(
        missionData.minReplies ??
          missionData.requiredReplies,
        {
          fallback: 5,
          minimum: 1,
          maximum: 50
        }
      ),

    order:
      normalizePositiveInteger(
        missionData.order,
        {
          fallback: 999,
          minimum: 0,
          maximum: 100000
        }
      ),

    status,

    featured:
      normalizeBoolean(
        missionData.featured,
        false
      ),

    locked:
      normalizeBoolean(
        missionData.locked,
        false
      ),

    ageGroup:
      normalizeSingleLineText(
        missionData.ageGroup ||
          "all",
        50
      ).toLowerCase(),

    objectives:
      normalizeMissionObjectives(
        missionData.objectives
      ),

    unlockAfter:
      normalizeStringArray(
        missionData.unlockAfter,
        20,
        150
      ),

    tags:
      normalizeStringArray(
        missionData.tags,
        20,
        100
      ),

    feedbackMode:
      normalizeSingleLineText(
        missionData.feedbackMode ||
          "after_mission",
        50
      ),

    correctionMode:
      normalizeSingleLineText(
        missionData.correctionMode ||
          "delayed",
        50
      ),

    topicTitle,

    topicDescription:
      normalizeText(
        topicData.description ||
          topicData.descripcion,
        700
      ),

    topicIcon:
      normalizeSingleLineText(
        topicData.icon ||
          "🎯",
        20
      ),

    topicOrder:
      normalizePositiveInteger(
        topicData.order,
        {
          fallback: 999,
          minimum: 0,
          maximum: 100000
        }
      )
  };
};

/*
|--------------------------------------------------------------------------
| Randomization
|--------------------------------------------------------------------------
|
| Fisher-Yates provides an unbiased shuffle compared with:
|
| array.sort(() => Math.random() - 0.5)
|
*/

export const shuffleTopicMissions = (
  missions = []
) => {
  if (!Array.isArray(missions)) {
    return [];
  }

  const shuffled =
    [...missions];

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
};

/*
|--------------------------------------------------------------------------
| Deduplication
|--------------------------------------------------------------------------
*/

const getMissionCompositeId = (
  mission = {}
) => {
  return [
    mission.topicId,
    mission.missionId
  ].join("::");
};

export const deduplicateTopicMissions = (
  missions = []
) => {
  if (!Array.isArray(missions)) {
    return [];
  }

  const missionMap =
    new Map();

  missions.forEach(
    (mission) => {
      const compositeId =
        getMissionCompositeId(
          mission
        );

      if (
        compositeId !== "::" &&
        !missionMap.has(
          compositeId
        )
      ) {
        missionMap.set(
          compositeId,
          mission
        );
      }
    }
  );

  return Array.from(
    missionMap.values()
  );
};

/*
|--------------------------------------------------------------------------
| Topic loading
|--------------------------------------------------------------------------
*/

const getPublicTopics = async () => {
  const topicsSnapshot =
    await getDocs(
      collection(
        db,
        "temas"
      )
    );

  return topicsSnapshot.docs
    .map(
      (topicDocument) => ({
        id:
          topicDocument.id,

        data:
          topicDocument.data()
      })
    )
    .filter((topic) =>
      isPublicTopic(
        topic.data
      )
    );
};

/*
|--------------------------------------------------------------------------
| Mission loading by topic
|--------------------------------------------------------------------------
*/

const getPublishedMissionsForTopic =
  async ({
    topicId,
    topicData,
    featuredOnly = false,
    missionsPerTopicLimit =
      DEFAULT_MISSIONS_PER_TOPIC_LIMIT
  }) => {
    const normalizedLimit =
      normalizePositiveInteger(
        missionsPerTopicLimit,
        {
          fallback:
            DEFAULT_MISSIONS_PER_TOPIC_LIMIT,

          minimum: 1,

          maximum:
            MAX_MISSIONS_PER_TOPIC_LIMIT
        }
      );

    const missionsRef =
      collection(
        db,
        "temas",
        topicId,
        "missions"
      );

    const queryConstraints = [
      where(
        "status",
        "==",
        PUBLISHED_STATUS
      )
    ];

    if (featuredOnly) {
      queryConstraints.push(
        where(
          "featured",
          "==",
          true
        )
      );
    }

    queryConstraints.push(
      limit(
        normalizedLimit
      )
    );

    const missionsSnapshot =
      await getDocs(
        query(
          missionsRef,
          ...queryConstraints
        )
      );

    return missionsSnapshot.docs
      .map((missionDocument) =>
        normalizeTopicMission({
          topicId,

          missionId:
            missionDocument.id,

          missionData:
            missionDocument.data(),

          topicData
        })
      )
      .filter(
        (mission) =>
          mission.status ===
          PUBLISHED_STATUS
      );
  };

/*
|--------------------------------------------------------------------------
| Generic public mission query
|--------------------------------------------------------------------------
*/

const getPublicTopicMissions =
  async ({
    maxResults =
      DEFAULT_MAX_RESULTS,

    missionsPerTopicLimit =
      DEFAULT_MISSIONS_PER_TOPIC_LIMIT,

    featuredOnly = false,

    randomize = true
  } = {}) => {
    const normalizedMaxResults =
      normalizePositiveInteger(
        maxResults,
        {
          fallback:
            DEFAULT_MAX_RESULTS,

          minimum: 0,

          maximum:
            MAX_RESULTS_LIMIT
        }
      );

    if (
      normalizedMaxResults === 0
    ) {
      return [];
    }

    const topics =
      await getPublicTopics();

    if (
      topics.length === 0
    ) {
      return [];
    }

    /*
     * Queries run concurrently rather than sequentially.
     * Firestore still performs one subcollection query per active topic,
     * but the browser does not wait for each query one by one.
     */

    const topicMissionResults =
      await Promise.all(
        topics.map(
          async (topic) => {
            try {
              return await getPublishedMissionsForTopic({
                topicId:
                  topic.id,

                topicData:
                  topic.data,

                featuredOnly,

                missionsPerTopicLimit
              });
            } catch (error) {
              console.error(
                "Error loading missions for topic:",
                {
                  topicId:
                    topic.id,

                  featuredOnly,

                  code:
                    error?.code,

                  message:
                    error?.message
                }
              );

              /*
               * One damaged or temporarily inaccessible topic should not
               * hide missions successfully loaded from other topics.
               */

              return [];
            }
          }
        )
      );

    const missions =
      deduplicateTopicMissions(
        topicMissionResults.flat()
      );

    const orderedMissions =
      randomize
        ? shuffleTopicMissions(
            missions
          )
        : [...missions].sort(
            (
              firstMission,
              secondMission
            ) => {
              if (
                firstMission.topicOrder !==
                secondMission.topicOrder
              ) {
                return (
                  firstMission.topicOrder -
                  secondMission.topicOrder
                );
              }

              if (
                firstMission.order !==
                secondMission.order
              ) {
                return (
                  firstMission.order -
                  secondMission.order
                );
              }

              return firstMission.title.localeCompare(
                secondMission.title
              );
            }
          );

    return orderedMissions.slice(
      0,
      normalizedMaxResults
    );
  };

/*
|--------------------------------------------------------------------------
| Public services
|--------------------------------------------------------------------------
*/

export const getPublishedTopicMissions =
  async ({
    maxResults =
      DEFAULT_MAX_RESULTS,

    missionsPerTopicLimit =
      DEFAULT_MISSIONS_PER_TOPIC_LIMIT,

    randomize = true
  } = {}) => {
    try {
      return await getPublicTopicMissions({
        maxResults,
        missionsPerTopicLimit,
        featuredOnly: false,
        randomize
      });
    } catch (error) {
      console.error(
        "Error loading published topic missions:",
        {
          code:
            error?.code,

          message:
            error?.message
        }
      );

      throw error;
    }
  };

export const getFeaturedTopicMissions =
  async ({
    maxResults =
      DEFAULT_MAX_RESULTS,

    missionsPerTopicLimit =
      DEFAULT_MISSIONS_PER_TOPIC_LIMIT,

    randomize = true
  } = {}) => {
    try {
      return await getPublicTopicMissions({
        maxResults,
        missionsPerTopicLimit,
        featuredOnly: true,
        randomize
      });
    } catch (error) {
      console.error(
        "Error loading featured topic missions:",
        {
          code:
            error?.code,

          message:
            error?.message
        }
      );

      throw error;
    }
  };

export const getSuggestedTopicMissions =
  async ({
    maxResults =
      DEFAULT_MAX_RESULTS,

    missionsPerTopicLimit =
      DEFAULT_MISSIONS_PER_TOPIC_LIMIT
  } = {}) => {
    const normalizedMaxResults =
      normalizePositiveInteger(
        maxResults,
        {
          fallback:
            DEFAULT_MAX_RESULTS,

          minimum: 0,

          maximum:
            MAX_RESULTS_LIMIT
        }
      );

    if (
      normalizedMaxResults === 0
    ) {
      return [];
    }

    try {
      const featuredMissions =
        await getFeaturedTopicMissions({
          maxResults:
            normalizedMaxResults,

          missionsPerTopicLimit,

          randomize: true
        });

      if (
        featuredMissions.length >=
        normalizedMaxResults
      ) {
        return featuredMissions.slice(
          0,
          normalizedMaxResults
        );
      }

      const publishedMissions =
        await getPublishedTopicMissions({
          /*
           * Request more than the missing amount because some published
           * results may duplicate already selected featured missions.
           */
          maxResults:
            Math.min(
              MAX_RESULTS_LIMIT,
              normalizedMaxResults * 3
            ),

          missionsPerTopicLimit,

          randomize: true
        });

      return deduplicateTopicMissions([
        ...featuredMissions,
        ...publishedMissions
      ]).slice(
        0,
        normalizedMaxResults
      );
    } catch (error) {
      console.error(
        "Error loading suggested topic missions:",
        {
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
| Default export
|--------------------------------------------------------------------------
*/

export default {
  normalizeTopicMission,
  shuffleTopicMissions,
  deduplicateTopicMissions,

  getPublishedTopicMissions,
  getFeaturedTopicMissions,
  getSuggestedTopicMissions
};