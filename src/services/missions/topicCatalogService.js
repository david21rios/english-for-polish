// src/services/topicCatalogService.js

import { db } from "../../firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const TOPICS_COLLECTION =
  "temas";

const DEFAULT_TOPIC_ICON =
  "🎯";

const DEFAULT_TOPIC_STATUS =
  "active";

const PUBLIC_TOPIC_STATUSES =
  new Set([
    "active",
    "published"
  ]);

const INACTIVE_TOPIC_STATUSES =
  new Set([
    "archived",
    "deleted",
    "inactive",
    "disabled",
    "draft"
  ]);

const MAX_PUBLIC_TOPICS = 200;

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
    maximum =
      Number.MAX_SAFE_INTEGER,
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
  {
    maximumItems = 20,
    maximumItemLength = 100
  } = {}
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
            maximumItemLength
          )
        )
        .filter(Boolean)
    )
  ).slice(
    0,
    maximumItems
  );
};

/*
|--------------------------------------------------------------------------
| Status and availability
|--------------------------------------------------------------------------
*/

export const normalizeTopicStatus = (
  topicData = {}
) => {
  return normalizeSingleLineText(
    topicData.status ||
      DEFAULT_TOPIC_STATUS,
    30
  ).toLowerCase();
};

export const isTopicSoftDeleted = (
  topicData = {}
) => {
  if (!isPlainObject(topicData)) {
    return true;
  }

  return (
    topicData.isDeleted === true ||
    topicData.deleted === true ||
    Boolean(topicData.deletedAt)
  );
};

export const isPublicTopic = (
  topicData = {}
) => {
  if (!isPlainObject(topicData)) {
    return false;
  }

  if (
    isTopicSoftDeleted(
      topicData
    )
  ) {
    return false;
  }

  const status =
    normalizeTopicStatus(
      topicData
    );

  if (
    INACTIVE_TOPIC_STATUSES.has(
      status
    )
  ) {
    return false;
  }

  if (
    topicData.isVisible ===
      false ||
    topicData.published ===
      false
  ) {
    return false;
  }

  /*
   * Legacy compatibility:
   *
   * Existing topic documents may not yet contain status.
   * In that case normalizeTopicStatus() returns "active".
   */

  return (
    PUBLIC_TOPIC_STATUSES.has(
      status
    ) ||
    status === ""
  );
};

/*
|--------------------------------------------------------------------------
| Topic normalization
|--------------------------------------------------------------------------
*/

export const normalizePublicTopic = ({
  topicId,
  topicData = {}
} = {}) => {
  const normalizedTopicId =
    normalizeSingleLineText(
      topicId,
      150
    );

  const title =
    normalizeSingleLineText(
      topicData.title ||
        topicData.titulo,
      180
    ) ||
    "Untitled topic";

  const description =
    normalizeText(
      topicData.description ||
        topicData.descripcion,
      1000
    ) ||
    "Practice real-life English communication through interactive missions.";

  const icon =
    normalizeSingleLineText(
      topicData.icon ||
        DEFAULT_TOPIC_ICON,
      30
    ) ||
    DEFAULT_TOPIC_ICON;

  const status =
    normalizeTopicStatus(
      topicData
    );

  return {
    id:
      normalizedTopicId,

    topicId:
      normalizedTopicId,

    title,

    /*
     * Temporary compatibility with older components.
     */
    titulo:
      title,

    description,

    descripcion:
      description,

    icon,

    status,

    order:
      normalizeNumber(
        topicData.order ??
          topicData.numero,
        {
          fallback: 999,
          minimum: 0,
          maximum: 100000
        }
      ),

    level:
      normalizeSingleLineText(
        topicData.level ||
          "A1",
        20
      ).toUpperCase(),

    minimumLevel:
      normalizeSingleLineText(
        topicData.minimumLevel ||
          topicData.minLevel ||
          topicData.level ||
          "A1",
        20
      ).toUpperCase(),

    featured:
      normalizeBoolean(
        topicData.featured,
        false
      ),

    missionCount:
      normalizeNumber(
        topicData.missionCount,
        {
          fallback: 0,
          minimum: 0,
          maximum: 10000
        }
      ),

    estimatedMinutes:
      normalizeNumber(
        topicData.estimatedMinutes,
        {
          fallback: 0,
          minimum: 0,
          maximum: 100000
        }
      ),

    tags:
      normalizeStringArray(
        topicData.tags,
        {
          maximumItems: 20,
          maximumItemLength: 100
        }
      ),

    ageGroup:
      normalizeSingleLineText(
        topicData.ageGroup ||
          "all",
        50
      ).toLowerCase(),

    isVisible:
      topicData.isVisible !==
      false,

    isPublic:
      isPublicTopic(
        topicData
      )
  };
};

/*
|--------------------------------------------------------------------------
| Sorting
|--------------------------------------------------------------------------
*/

export const sortPublicTopics = (
  topics = []
) => {
  if (!Array.isArray(topics)) {
    return [];
  }

  return [...topics].sort(
    (
      firstTopic,
      secondTopic
    ) => {
      /*
       * Featured topics appear first.
       */

      if (
        firstTopic.featured !==
        secondTopic.featured
      ) {
        return firstTopic.featured
          ? -1
          : 1;
      }

      /*
       * Then use the explicit administrative order.
       */

      if (
        firstTopic.order !==
        secondTopic.order
      ) {
        return (
          firstTopic.order -
          secondTopic.order
        );
      }

      /*
       * Stable alphabetical fallback.
       */

      return firstTopic.title.localeCompare(
        secondTopic.title,
        "en",
        {
          sensitivity: "base"
        }
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Read all public topics
|--------------------------------------------------------------------------
*/

export const getPublishedTopics =
  async ({
    maxResults =
      MAX_PUBLIC_TOPICS,
    featuredOnly = false
  } = {}) => {
    const normalizedLimit =
      normalizeNumber(
        maxResults,
        {
          fallback:
            MAX_PUBLIC_TOPICS,
          minimum: 0,
          maximum:
            MAX_PUBLIC_TOPICS
        }
      );

    if (
      normalizedLimit === 0
    ) {
      return [];
    }

    try {
      const topicsSnapshot =
        await getDocs(
          collection(
            db,
            TOPICS_COLLECTION
          )
        );

      const topics =
        topicsSnapshot.docs
          .map(
            (topicDocument) => {
              const topicData =
                topicDocument.data();

              if (
                !isPublicTopic(
                  topicData
                )
              ) {
                return null;
              }

              const normalizedTopic =
                normalizePublicTopic({
                  topicId:
                    topicDocument.id,

                  topicData
                });

              if (
                featuredOnly &&
                normalizedTopic
                  .featured !== true
              ) {
                return null;
              }

              return normalizedTopic;
            }
          )
          .filter(Boolean);

      return sortPublicTopics(
        topics
      ).slice(
        0,
        normalizedLimit
      );
    } catch (error) {
      console.error(
        "Error loading public topics:",
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
| Read featured topics
|--------------------------------------------------------------------------
*/

export const getFeaturedTopics =
  async ({
    maxResults = 6
  } = {}) => {
    return getPublishedTopics({
      maxResults,
      featuredOnly: true
    });
  };

/*
|--------------------------------------------------------------------------
| Read one public topic
|--------------------------------------------------------------------------
*/

export const getPublishedTopicById =
  async (
    topicId
  ) => {
    const normalizedTopicId =
      normalizeSingleLineText(
        topicId,
        150
      );

    if (!normalizedTopicId) {
      return null;
    }

    try {
      const topicReference =
        doc(
          db,
          TOPICS_COLLECTION,
          normalizedTopicId
        );

      const topicSnapshot =
        await getDoc(
          topicReference
        );

      if (
        !topicSnapshot.exists()
      ) {
        return null;
      }

      const topicData =
        topicSnapshot.data();

      if (
        !isPublicTopic(
          topicData
        )
      ) {
        return null;
      }

      return normalizePublicTopic({
        topicId:
          topicSnapshot.id,

        topicData
      });
    } catch (error) {
      console.error(
        "Error loading public topic:",
        {
          topicId:
            normalizedTopicId,

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
| Search public topics
|--------------------------------------------------------------------------
*/

export const searchPublishedTopics =
  async ({
    searchText = "",
    maxResults = 20
  } = {}) => {
    const normalizedSearchText =
      normalizeSingleLineText(
        searchText,
        200
      ).toLocaleLowerCase(
        "en-US"
      );

    const topics =
      await getPublishedTopics({
        maxResults:
          MAX_PUBLIC_TOPICS
      });

    if (!normalizedSearchText) {
      return topics.slice(
        0,
        normalizeNumber(
          maxResults,
          {
            fallback: 20,
            minimum: 0,
            maximum:
              MAX_PUBLIC_TOPICS
          }
        )
      );
    }

    const filteredTopics =
      topics.filter(
        (topic) => {
          const searchableText = [
            topic.title,
            topic.description,
            topic.level,
            topic.minimumLevel,
            ...topic.tags
          ]
            .join(" ")
            .toLocaleLowerCase(
              "en-US"
            );

          return searchableText.includes(
            normalizedSearchText
          );
        }
      );

    return filteredTopics.slice(
      0,
      normalizeNumber(
        maxResults,
        {
          fallback: 20,
          minimum: 0,
          maximum:
            MAX_PUBLIC_TOPICS
        }
      )
    );
  };

/*
|--------------------------------------------------------------------------
| Default export
|--------------------------------------------------------------------------
*/

export default {
  normalizeTopicStatus,
  isTopicSoftDeleted,
  isPublicTopic,
  normalizePublicTopic,
  sortPublicTopics,

  getPublishedTopics,
  getFeaturedTopics,
  getPublishedTopicById,
  searchPublishedTopics
};