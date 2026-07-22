// src/pages/MissionChatPage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  auth,
  db
} from "../firebase";

import MissionFeedback from "../components/topics/MissionFeedback";
import MissionPlayer from "../components/topics/MissionPlayer";

import {
  getTopicProgress,
  saveTopicMissionProgress
} from "../services/progress/topicProgressService";

import {
  getMissionsByTheme
} from "../services/auth/firestoreService";

import {
  evaluateMissionAvailability,
  resolveUserCefrLevel,
  sortMissionsForAvailability
} from "../services/missions/missionAvailability";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const INACTIVE_TOPIC_STATUSES =
  new Set([
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
  maximumLength = 2000
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

const normalizeNumber = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
};

const isTopicAvailable = (
  topicData = {}
) => {
  if (!isPlainObject(topicData)) {
    return false;
  }

  const status =
    normalizeSingleLineText(
      topicData.status ||
        "active",
      30
    ).toLowerCase();

  const softDeleted =
    topicData.isDeleted ===
      true ||
    topicData.deleted ===
      true ||
    Boolean(
      topicData.deletedAt
    );

  const explicitlyHidden =
    topicData.isVisible ===
      false ||
    topicData.published ===
      false;

  return (
    !softDeleted &&
    !explicitlyHidden &&
    !INACTIVE_TOPIC_STATUSES.has(
      status
    )
  );
};

const isMissionAvailable = (
  missionData = {}
) => {
  if (!isPlainObject(missionData)) {
    return false;
  }

  const status =
    normalizeSingleLineText(
      missionData.status ||
        "draft",
      30
    ).toLowerCase();

  const softDeleted =
    missionData.isDeleted ===
      true ||
    missionData.deleted ===
      true ||
    Boolean(
      missionData.deletedAt
    );

  return (
    status === "published" &&
    !softDeleted
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const MissionChatPage = () => {
  const {
    temaTitle: topicId,
    missionId
  } = useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const initialTopic =
    isPlainObject(
      location.state?.topic
    )
      ? location.state.topic
      : null;

  const initialMission =
    isPlainObject(
      location.state?.mission
    )
      ? location.state.mission
      : null;

  const isPersonalizedMission =
    location.state
      ?.isPersonalizedMission ===
      true ||
    location.state
      ?.isCustomMission ===
      true ||
    initialMission?.isCustom ===
      true ||
    initialMission
      ?.isCustomMission ===
      true;

  const initialMissionId =
    normalizeSingleLineText(
      initialMission?.id,
      150
    );

  const [
    userId,
    setUserId
  ] = useState(
    auth.currentUser?.uid ||
      null
  );

  const [
    authResolved,
    setAuthResolved
  ] = useState(false);

  const [
    topic,
    setTopic
  ] = useState(
    initialTopic
  );

  const [
    mission,
    setMission
  ] = useState(
    initialMission
  );

  const [
    topicProgress,
    setTopicProgress
  ] = useState(null);

  const [
    missionResult,
    setMissionResult
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    savingProgress,
    setSavingProgress
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    progressError,
    setProgressError
  ] = useState("");

  const [
    saveWarning,
    setSaveWarning
  ] = useState("");

  const completionSavingRef =
    useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Normalized route identifiers
  |--------------------------------------------------------------------------
  */

  const normalizedTopicId =
    useMemo(
      () =>
        normalizeSingleLineText(
          topicId,
          150
        ),
      [topicId]
    );

  const normalizedMissionId =
    useMemo(() => {
      return (
        normalizeSingleLineText(
          missionId,
          150
        ) ||
        (
          isPersonalizedMission
            ? initialMissionId
            : ""
        )
      );
    }, [
      initialMissionId,
      isPersonalizedMission,
      missionId
    ]);

  /*
  |--------------------------------------------------------------------------
  | Authentication observer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUserId(
            currentUser?.uid ||
              null
          );

          setAuthResolved(true);
        }
      );

    return unsubscribe;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load topic and mission
  |--------------------------------------------------------------------------
  */

  const loadMissionData =
    useCallback(async () => {
      /*
       * El tema siempre debe existir en la URL.
       *
       * Una misión normal necesita missionId en la ruta.
       * Una misión personalizada puede recibir la misión completa
       * mediante location.state.
       */

      if (!authResolved) {
        return;
      }

      if (!normalizedTopicId) {
        setError(
          "Nieprawidłowy identyfikator tematu."
        );

        setLoading(false);
        return;
      }

      if (
        isPersonalizedMission &&
        !initialMission
      ) {
        setError(
          "Nie znaleziono danych misji personalizowanej. Utwórz misję ponownie."
        );

        setLoading(false);
        return;
      }

      if (
        !isPersonalizedMission &&
        !normalizedMissionId
      ) {
        setError(
          "Nieprawidłowy identyfikator misji."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        let loadedTopic =
          initialTopic;

        let loadedMission =
          initialMission;

        /*
         * Topic
         * --------------------------------------------------------------
         * Navigation state is an optimization.
         * Firestore remains the source of truth for public topics.
         */

        const suppliedTopicId =
          normalizeSingleLineText(
            loadedTopic?.id,
            150
          );

        const shouldLoadTopic =
          !loadedTopic ||
          suppliedTopicId !==
            normalizedTopicId ||
          !isTopicAvailable(
            loadedTopic
          );

        if (shouldLoadTopic) {
          const topicReference =
            doc(
              db,
              "temas",
              normalizedTopicId
            );

          const topicSnapshot =
            await getDoc(
              topicReference
            );

          if (
            !topicSnapshot.exists()
          ) {
            throw new Error(
              "TOPIC_NOT_FOUND"
            );
          }

          loadedTopic = {
            id:
              topicSnapshot.id,

            ...topicSnapshot.data()
          };
        }

        if (
          !isTopicAvailable(
            loadedTopic
          )
        ) {
          throw new Error(
            "TOPIC_NOT_AVAILABLE"
          );
        }

        /*
         * Personalized mission
         * --------------------------------------------------------------
         * It is generated at runtime and arrives through navigation state.
         * It must not be fetched from the public Firestore mission catalog.
         */

        if (isPersonalizedMission) {
          if (
            !isPlainObject(
              loadedMission
            )
          ) {
            throw new Error(
              "PERSONALIZED_MISSION_MISSING"
            );
          }

          const resolvedMissionId =
            normalizeSingleLineText(
              loadedMission.id ||
                normalizedMissionId ||
                `personalized_${Date.now()}`,
              150
            );

          if (!resolvedMissionId) {
            throw new Error(
              "PERSONALIZED_MISSION_INVALID"
            );
          }

          loadedMission = {
            ...loadedMission,

            id:
              resolvedMissionId,

            topicId:
              normalizedTopicId,

            themeId:
              normalizeSingleLineText(
                loadedMission.themeId ||
                  loadedMission.topicId ||
                  normalizedTopicId,
                150
              ),

            status:
              loadedMission.status ||
              "custom",

            isCustom: true,

            isCustomMission: true,

            isPersonalizedMission:
              true,

            missionSource:
              loadedMission
                .missionSource ||
              location.state
                ?.missionSource ||
              "ai_personalization",

            /*
             * Personalized missions currently do not award XP.
             */
            xpReward: 0
          };

          const missionTopicId =
            normalizeSingleLineText(
              loadedMission.themeId ||
                loadedMission.topicId,
              150
            );

          if (
            missionTopicId &&
            missionTopicId !==
              normalizedTopicId
          ) {
            throw new Error(
              "MISSION_TOPIC_MISMATCH"
            );
          }

          setTopic(
            loadedTopic
          );

          setMission(
            loadedMission
          );

          return;
        }

        /*
         * Published catalog mission
         * --------------------------------------------------------------
         */

        const suppliedMissionId =
          normalizeSingleLineText(
            loadedMission?.id,
            150
          );

        const shouldLoadMission =
          !loadedMission ||
          suppliedMissionId !==
            normalizedMissionId ||
          !isMissionAvailable(
            loadedMission
          );

        if (shouldLoadMission) {
          const missionReference =
            doc(
              db,
              "temas",
              normalizedTopicId,
              "missions",
              normalizedMissionId
            );

          const missionSnapshot =
            await getDoc(
              missionReference
            );

          if (
            !missionSnapshot.exists()
          ) {
            throw new Error(
              "MISSION_NOT_FOUND"
            );
          }

          loadedMission = {
            id:
              missionSnapshot.id,

            ...missionSnapshot.data()
          };
        }

        if (
          !isMissionAvailable(
            loadedMission
          )
        ) {
          throw new Error(
            "MISSION_NOT_AVAILABLE"
          );
        }

        if (
          loadedMission.themeId &&
          normalizeSingleLineText(
            loadedMission.themeId,
            150
          ) !== normalizedTopicId
        ) {
          throw new Error(
            "MISSION_TOPIC_MISMATCH"
          );
        }

        const orderedMissions =
          sortMissionsForAvailability(
            await getMissionsByTheme(
              normalizedTopicId,
              {
                includeDrafts: false
              }
            )
          );

        const missionIndex =
          orderedMissions.findIndex(
            (catalogMission) =>
              normalizeSingleLineText(
                catalogMission?.id,
                150
              ) ===
              normalizedMissionId
          );

        if (missionIndex < 0) {
          throw new Error(
            "MISSION_NOT_FOUND"
          );
        }

        let accessProgress = null;
        let userLevel = null;

        if (userId) {
          const [progress, userSnapshot] =
            await Promise.all([
              getTopicProgress(
                userId,
                normalizedTopicId
              ),
              getDoc(
                doc(
                  db,
                  "users",
                  userId
                )
              )
            ]);

          accessProgress = progress;
          userLevel =
            userSnapshot.exists()
              ? resolveUserCefrLevel(
                  userSnapshot.data()
                )
              : null;
        }

        const availability =
          evaluateMissionAvailability({
            mission:
              orderedMissions[
                missionIndex
              ],
            missionIndex,
            orderedMissions,
            completedMissionIds:
              accessProgress
                ?.completedMissions,
            userLevel
          });

        if (!availability.available) {
          throw new Error(
            "MISSION_LOCKED"
          );
        }

        setTopicProgress(
          accessProgress
        );

        setTopic(
          loadedTopic
        );

        setMission({
          ...loadedMission,
          ...availability,

          topicId:
            normalizedTopicId,

          themeId:
            normalizeSingleLineText(
              loadedMission.themeId ||
                normalizedTopicId,
              150
            )
        });
      } catch (loadError) {
        console.error(
          "Error loading mission chat:",
          {
            topicId:
              normalizedTopicId,

            missionId:
              normalizedMissionId,

            personalized:
              isPersonalizedMission,

            code:
              loadError?.code,

            message:
              loadError?.message
          }
        );

        switch (
          loadError?.message
        ) {
          case "TOPIC_NOT_FOUND":
            setError(
              "Ten temat nie istnieje."
            );
            break;

          case "TOPIC_NOT_AVAILABLE":
            setError(
              "Ten temat nie jest obecnie dostępny."
            );
            break;

          case "MISSION_NOT_FOUND":
            setError(
              "Ta misja nie istnieje."
            );
            break;

          case "MISSION_NOT_AVAILABLE":
            setError(
              "Ta misja nie jest obecnie dostępna."
            );
            break;

          case "MISSION_LOCKED":
            setError(
              "Ta misja jest zablokowana. UkoÅ„cz wymagane misje lub sprawdÅº swÃ³j poziom."
            );
            break;

          case "PERSONALIZED_MISSION_MISSING":
            setError(
              "Nie znaleziono danych misji personalizowanej. Utwórz misję ponownie."
            );
            break;

          case "PERSONALIZED_MISSION_INVALID":
            setError(
              "Dane misji personalizowanej są nieprawidłowe."
            );
            break;

          case "MISSION_TOPIC_MISMATCH":
            setError(
              "Ta misja nie należy do wybranego tematu."
            );
            break;

          default:
            setError(
              "Nie udało się załadować tej misji."
            );
            break;
        }

        setTopic(null);
        setMission(null);
      } finally {
        setLoading(false);
      }
    }, [
      authResolved,
      initialMission,
      initialTopic,
      isPersonalizedMission,
      location.state,
      normalizedMissionId,
      normalizedTopicId,
      userId
    ]);

  useEffect(() => {
    loadMissionData();
  }, [loadMissionData]);

  /*
  |--------------------------------------------------------------------------
  | Load progress independently
  |--------------------------------------------------------------------------
  */

  const loadTopicProgress =
    useCallback(async () => {
      if (
        !authResolved ||
        !normalizedTopicId
      ) {
        return;
      }

      if (!userId) {
        setTopicProgress(null);
        setProgressError("");
        return;
      }

      try {
        setProgressError("");

        const progress =
          await getTopicProgress(
            userId,
            normalizedTopicId
          );

        setTopicProgress(
          progress
        );
      } catch (loadError) {
        console.error(
          "Error loading mission topic progress:",
          {
            userId,
            topicId:
              normalizedTopicId,

            code:
              loadError?.code,

            message:
              loadError?.message
          }
        );

        setTopicProgress(null);

        setProgressError(
          "Nie udało się załadować wcześniejszego postępu. Możesz nadal ćwiczyć, ale zapis wyniku może wymagać ponowienia."
        );
      }
    }, [
      authResolved,
      normalizedTopicId,
      userId
    ]);

  useEffect(() => {
    loadTopicProgress();
  }, [loadTopicProgress]);

  /*
  |--------------------------------------------------------------------------
  | Mission context
  |--------------------------------------------------------------------------
  */

  const buildMissionContext =
    useCallback(
      (
        currentMission
      ) => {
        return {
          goal:
            normalizeText(
              currentMission?.goal ||
                currentMission?.description ||
                "Complete this mission.",
              1000
            ),

          situation:
            normalizeText(
              currentMission?.scenario ||
                currentMission?.description ||
                "Practice this real-life situation.",
              2500
            ),

          level:
            normalizeSingleLineText(
              currentMission?.level ||
                "A1",
              20
            ).toUpperCase(),

          tone:
            normalizeSingleLineText(
              currentMission?.tone ||
                "friendly",
              50
            ),

          aiRole:
            normalizeSingleLineText(
              currentMission?.aiRole ||
                currentMission?.npc?.role ||
                "conversation partner",
              200
            ),
          
          conversationType:
            normalizeSingleLineText(
              currentMission
                ?.conversationType ||
                "role_play",
              50
            ),
          
          isCustomMission:
            currentMission?.isCustom ===
              true ||
            currentMission
              ?.isCustomMission ===
              true,
          
          isPersonalizedMission:
            currentMission
              ?.isPersonalizedMission ===
            true,
          
          allowPolishSupport:
            currentMission
              ?.allowPolishSupport !==
            false,

          topicId:
            normalizedTopicId,

          topicTitle:
            normalizeSingleLineText(
              topic?.title ||
                topic?.titulo ||
                normalizedTopicId,
              150
            ),

          learningLanguage:
            "English",

          baseLanguage:
            "Polish"
        };
      },
      [
        normalizedTopicId,
        topic
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Complete and persist mission
  |--------------------------------------------------------------------------
  */

  const handleCompleteMission =
    useCallback(
      async (
        result
      ) => {
        if (
          completionSavingRef.current ||
          savingProgress
        ) {
          return;
        }

        if (
          !result ||
          !isPlainObject(
            result
          )
        ) {
          return;
        }

        completionSavingRef.current =
          true;

        setSavingProgress(true);
        setSaveWarning("");

        try {
          const resultMission =
            isPlainObject(
              result.mission
            )
              ? result.mission
              : mission;

          const feedback =
            isPlainObject(
              result.feedback
            )
              ? result.feedback
              : {};

          /*
           * Every trustworthy completed evaluation reaches this boundary,
           * including failed missions. Persistence remains restricted to
           * final passed results.
           */

          const reliableResult =
            feedback.isFinal ===
              true &&
            feedback.passed ===
              true &&
            feedback.requiresReview !==
              true &&
            feedback.isFallback !==
              true;

          const personalizedResult =
            resultMission
              ?.isPersonalizedMission ===
              true ||
            resultMission
              ?.isCustomMission ===
              true ||
            resultMission?.isCustom ===
              true;

          if (!reliableResult) {
            setMissionResult({
              ...result,

              mission:
                resultMission,

              feedback,

              xpEarned: 0,

              totalXp:
                normalizeNumber(
                  topicProgress
                    ?.totalXp,
                  0
                ),

              alreadyCompleted:
                false,

              persistenceStatus:
                "not_persisted",

              persistenceMessage:
                "Wynik nie jest ostateczny i nie został zapisany jako ukończenie."
            });

            return;
          }

          if (personalizedResult) {
            setMissionResult({
              ...result,
            
              mission:
                resultMission,
            
              feedback: {
                ...feedback,
              
                canAwardXp: false,
              
                xpAwarded: 0,
              
                xpReason:
                  "personalized_mission_no_xp"
              },
            
              xpEarned: 0,
            
              totalXp:
                normalizeNumber(
                  topicProgress
                    ?.totalXp,
                  0
                ),
              
              alreadyCompleted:
                false,
              
              newlyCompleted:
                false,
              
              persistenceStatus:
                "personalized_not_persisted",
              
              persistenceMessage:
                "Misje personalizowane nie przyznają XP i nie są zapisywane jako ukończenie misji katalogowej."
            });
          
            return;
          }

          /*
           * Authenticated users receive persisted progress.
           *
           * If authentication is unavailable, the final feedback can still
           * be displayed, but no completion or XP is claimed as persisted.
           */

          if (!userId) {
            setSaveWarning(
              "Nie jesteś zalogowany. Wynik zostanie wyświetlony, ale postęp i XP nie zostały zapisane."
            );

            setMissionResult({
              ...result,

              mission:
                resultMission,

              feedback: {
                ...feedback,

                canAwardXp: false,

                xpAwarded: 0,

                xpReason:
                  "authentication_required"
              },

              xpEarned: 0,

              totalXp:
                normalizeNumber(
                  topicProgress
                    ?.totalXp,
                  0
                ),

              alreadyCompleted:
                false,

              persistenceStatus:
                "authentication_required"
            });

            return;
          }

          const savedProgress =
            await saveTopicMissionProgress({
              userId,

              topicId:
                normalizedTopicId,

              missionId:
                resultMission?.id ||
                normalizedMissionId,

              mission:
                resultMission,

              /*
               * Temporary compatibility value.
               * topicProgressService gives priority to feedback.xpAwarded.
               */
              xpEarned:
                result.xpEarned,

              answer:
                result.answer ||
                "",

              conversation:
                Array.isArray(
                  result.conversation
                )
                  ? result.conversation
                  : [],

              userContext:
                isPlainObject(
                  result.userContext
                )
                  ? result.userContext
                  : buildMissionContext(
                      resultMission
                    ),

              feedback,

              isCustomMission:
                resultMission
                  ?.isCustom ===
                  true ||
                resultMission
                  ?.isCustomMission ===
                  true,

              attemptSource:
                "mission_chat_page"
            });

          setTopicProgress({
            ...topicProgress,

            ...savedProgress
          });

          /*
           * The persistence result is the source of truth for awarded XP
           * and previous completion status.
           */

          const persistedFeedback = {
            ...feedback,

            canAwardXp:
              savedProgress
                .xpEarned > 0,

            xpAwarded:
              savedProgress
                .xpEarned,

            xpReason:
              savedProgress
                .alreadyCompleted
                ? "already_completed"
                : savedProgress
                      .xpEarned >
                    0
                  ? "xp_awarded"
                  : feedback
                      .xpReason ||
                    "no_xp_awarded",

            repeatedCompletion:
              savedProgress
                .alreadyCompleted ===
              true
          };

          setMissionResult({
            ...result,

            mission:
              resultMission,

            feedback:
              persistedFeedback,

            xpEarned:
              savedProgress
                .xpEarned,

            totalXp:
              savedProgress
                .totalXp,

            alreadyCompleted:
              savedProgress
                .alreadyCompleted,

            newlyCompleted:
              savedProgress
                .newlyCompleted,

            attemptId:
              savedProgress
                .attemptId,

            persistenceStatus:
              "saved",

            savedProgress
          });
        } catch (saveError) {
          console.error(
            "Error saving mission progress:",
            {
              userId,
              topicId:
                normalizedTopicId,

              missionId:
                normalizedMissionId,

              code:
                saveError?.code,

              message:
                saveError?.message
            }
          );

          setSaveWarning(
            "Ocena została zakończona, ale nie udało się zapisać postępu. Nie przyznano zapisanych XP. Spróbuj ponownie później."
          );

          /*
           * Do not claim XP that Firestore failed to persist.
           * Keep the pedagogical evaluation visible.
           */

          setMissionResult({
            ...result,

            mission:
              result.mission ||
              mission,

            feedback: {
              ...(
                result.feedback ||
                {}
              ),

              canAwardXp: false,

              xpAwarded: 0,

              xpReason:
                "progress_save_failed"
            },

            xpEarned: 0,

            totalXp:
              normalizeNumber(
                topicProgress
                  ?.totalXp,
                0
              ),

            alreadyCompleted:
              false,

            persistenceStatus:
              "save_failed",

            persistenceError: {
              code:
                saveError?.code ||
                "TOPIC_PROGRESS_SAVE_FAILED",

              message:
                saveError instanceof
                  Error
                  ? saveError.message
                  : String(
                      saveError
                    )
            }
          });
        } finally {
          completionSavingRef.current =
            false;

          setSavingProgress(false);

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      },
      [
        buildMissionContext,
        mission,
        normalizedMissionId,
        normalizedTopicId,
        savingProgress,
        topicProgress,
        userId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Retry and navigation
  |--------------------------------------------------------------------------
  */

  const handleRetryMission =
    useCallback(() => {
      setMissionResult(null);
      setSaveWarning("");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, []);

  const handleBackToMissions =
    useCallback(() => {
      navigate(
        `/tema/${normalizedTopicId}`
      );
    }, [
      navigate,
      normalizedTopicId
    ]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    loading ||
    !authResolved
  ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />

          <p className="text-sm text-gray-600">
            Ładowanie misji...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !mission ||
    !topic
  ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">
          <p>
            {error ||
              "Ta misja nie jest dostępna."}
          </p>

          <button
            type="button"
            onClick={
              handleBackToMissions
            }
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
          >
            Powrót do misji
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Saving state
  |--------------------------------------------------------------------------
  */

  if (savingProgress) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />

          <p className="font-medium">
            Zapisywanie postępu...
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Nie zamykaj tej strony.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Feedback view
  |--------------------------------------------------------------------------
  */

  if (missionResult) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-primary-50 to-white pb-6 pt-2">
        <div className="container mx-auto max-w-5xl px-3 sm:px-4">
          {(saveWarning ||
            progressError) && (
            <div
              role="status"
              className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm leading-relaxed text-yellow-800"
            >
              {saveWarning ||
                progressError}
            </div>
          )}

          <MissionFeedback
            result={
              missionResult
            }
            onRetry={
              handleRetryMission
            }
            onBackToMissions={
              handleBackToMissions
            }
          />
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Player view
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-primary-50 to-white pb-6 pt-2">
      <div className="container mx-auto max-w-5xl px-3 sm:px-4">
        {progressError && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm leading-relaxed text-yellow-800"
          >
            {progressError}
          </div>
        )}

        <MissionPlayer
          mission={mission}
          userContext={
            buildMissionContext(
              mission
            )
          }
          topic={topic}
          onBack={
            handleBackToMissions
          }
          onComplete={
            handleCompleteMission
          }
        />
      </div>
    </div>
  );
};

export default MissionChatPage;
