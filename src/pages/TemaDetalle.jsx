// src/pages/TemaDetalle.jsx

import {
  useCallback,
  useEffect,
  useMemo,
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

import MissionList from "../components/topics/MissionList";
import TopicProgress from "../components/topics/TopicProgress";

import {
  getMissionsByTheme
} from "../services/auth/firestoreService";

import {
  getTopicProgress
} from "../services/progress/topicProgressService";

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

const normalizeText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim();
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
  const status =
    normalizeText(
      topicData.status ||
        "active"
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

const sortMissions = (
  missions = []
) => {
  if (!Array.isArray(missions)) {
    return [];
  }

  return [...missions].sort(
    (
      firstMission,
      secondMission
    ) => {
      const firstOrder =
        normalizeNumber(
          firstMission.order,
          999
        );

      const secondOrder =
        normalizeNumber(
          secondMission.order,
          999
        );

      if (
        firstOrder !==
        secondOrder
      ) {
        return (
          firstOrder -
          secondOrder
        );
      }

      return normalizeText(
        firstMission.title
      ).localeCompare(
        normalizeText(
          secondMission.title
        )
      );
    }
  );
};

const normalizeCompletedMissions = (
  completedMissions
) => {
  if (
    !Array.isArray(
      completedMissions
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      completedMissions
        .map(normalizeText)
        .filter(Boolean)
    )
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const TemaDetalle = () => {
  const {
    temaTitle: topicId
  } = useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [userId, setUserId] =
    useState(
      auth.currentUser?.uid ||
        null
    );

  const [authResolved, setAuthResolved] =
    useState(false);

  const [topic, setTopic] =
    useState(null);

  const [missions, setMissions] =
    useState([]);

  const [
    topicProgress,
    setTopicProgress
  ] = useState(null);

  const [
    pendingMissionId,
    setPendingMissionId
  ] = useState(
    normalizeText(
      location.state?.missionId
    ) || null
  );

  const [loading, setLoading] =
    useState(true);

  const [
    progressLoading,
    setProgressLoading
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    progressError,
    setProgressError
  ] = useState("");

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
  | Load public topic and missions
  |--------------------------------------------------------------------------
  */

  const loadTopicAndMissions =
    useCallback(async () => {
      const normalizedTopicId =
        normalizeText(topicId);

      if (!normalizedTopicId) {
        setError(
          "Nieprawidłowy identyfikator tematu."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

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

        const topicData = {
          id:
            topicSnapshot.id,

          ...topicSnapshot.data()
        };

        if (
          !isTopicAvailable(
            topicData
          )
        ) {
          throw new Error(
            "TOPIC_NOT_AVAILABLE"
          );
        }

        const missionsData =
          await getMissionsByTheme(
            normalizedTopicId,
            {
              includeDrafts:
                false
            }
          );

        const publishedMissions =
          sortMissions(
            (
              Array.isArray(
                missionsData
              )
                ? missionsData
                : []
            ).filter(
              (mission) =>
                normalizeText(
                  mission.status ||
                    "draft"
                ).toLowerCase() ===
                "published"
            )
          );

        setTopic(topicData);
        setMissions(
          publishedMissions
        );
      } catch (loadError) {
        console.error(
          "Error loading topic missions:",
          loadError
        );

        if (
          loadError?.message ===
          "TOPIC_NOT_FOUND"
        ) {
          setError(
            "Ten temat nie istnieje."
          );
        } else if (
          loadError?.message ===
          "TOPIC_NOT_AVAILABLE"
        ) {
          setError(
            "Ten temat nie jest obecnie dostępny."
          );
        } else {
          setError(
            "Nie udało się załadować misji dla tego tematu."
          );
        }

        setTopic(null);
        setMissions([]);
      } finally {
        setLoading(false);
      }
    }, [topicId]);

  useEffect(() => {
    loadTopicAndMissions();
  }, [loadTopicAndMissions]);

  /*
  |--------------------------------------------------------------------------
  | Load user progress independently
  |--------------------------------------------------------------------------
  |
  | A progress read failure must not hide the public mission list.
  |
  */

  const loadProgress =
    useCallback(async () => {
      const normalizedTopicId =
        normalizeText(topicId);

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
        setProgressLoading(true);
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
          "Error loading topic progress:",
          loadError
        );

        setTopicProgress(null);

        setProgressError(
          "Nie udało się załadować Twojego postępu. Misje nadal są dostępne."
        );
      } finally {
        setProgressLoading(false);
      }
    }, [
      authResolved,
      topicId,
      userId
    ]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  /*
  |--------------------------------------------------------------------------
  | Derived topic data
  |--------------------------------------------------------------------------
  */

  const topicTitle =
    normalizeText(
      topic?.title ||
        topic?.titulo ||
        topicId
    ) ||
    "Temat";

  const completedMissions =
    useMemo(
      () =>
        normalizeCompletedMissions(
          topicProgress
            ?.completedMissions
        ),
      [
        topicProgress
          ?.completedMissions
      ]
    );

  const completedMissionSet =
    useMemo(
      () =>
        new Set(
          completedMissions
        ),
      [completedMissions]
    );

  const totalXp =
    normalizeNumber(
      topicProgress?.totalXp,
      0
    );

  const publishedMissionIds =
    useMemo(
      () =>
        missions.map(
          (mission) =>
            mission.id
        ),
      [missions]
    );

  const completedCount =
    useMemo(
      () =>
        publishedMissionIds.filter(
          (missionId) =>
            completedMissionSet.has(
              missionId
            )
        ).length,
      [
        completedMissionSet,
        publishedMissionIds
      ]
    );

  const totalMissions =
    missions.length;

  /*
  |--------------------------------------------------------------------------
  | Mission unlocking
  |--------------------------------------------------------------------------
  |
  | Rules:
  |
  | 1. mission.locked === true always blocks the mission.
  | 2. unlockAfter takes precedence when configured.
  | 3. Without unlockAfter, sequential progression is used.
  |
  */

  const missionsWithProgress =
    useMemo(() => {
      return missions.map(
        (
          mission,
          index
        ) => {
          const isCompleted =
            completedMissionSet.has(
              mission.id
            );

          const unlockAfter =
            Array.isArray(
              mission.unlockAfter
            )
              ? mission.unlockAfter
                  .map(
                    normalizeText
                  )
                  .filter(Boolean)
              : [];

          const hasExplicitUnlockRules =
            unlockAfter.length >
            0;

          const explicitRequirementsMet =
            !hasExplicitUnlockRules ||
            unlockAfter.every(
              (
                requiredMissionId
              ) =>
                completedMissionSet.has(
                  requiredMissionId
                )
            );

          const previousMission =
            missions[index - 1];

          const previousMissionCompleted =
            index === 0 ||
            completedMissionSet.has(
              previousMission?.id
            );

          const progressionRequirementMet =
            hasExplicitUnlockRules
              ? explicitRequirementsMet
              : previousMissionCompleted;

          const locked =
            mission.locked ===
              true ||
            !progressionRequirementMet;

          return {
            ...mission,

            completed:
              isCompleted,

            locked,

            unlockReason:
              locked &&
              mission.locked !==
                true
                ? hasExplicitUnlockRules
                  ? "required_missions_incomplete"
                  : "previous_mission_incomplete"
                : null
          };
        }
      );
    }, [
      completedMissionSet,
      missions
    ]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleStartMission = (
    mission
  ) => {
    if (
      !mission ||
      mission.locked === true
    ) {
      return;
    }

    navigate(
      `/tema/${topicId}/mission/${mission.id}`,
      {
        state: {
          topicId,
          missionId:
            mission.id
        }
      }
    );
  };

  const handleCreatePersonalizedMission =
    () => {
      navigate(
        `/tema/${topicId}/custom-mission`,
        {
          state: {
            topic
          }
        }
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Open requested mission
  |--------------------------------------------------------------------------
  |
  | Used when the user enters from Home or a suggested mission card.
  |
  */

  useEffect(() => {
    if (
      !pendingMissionId ||
      missionsWithProgress.length ===
        0
    ) {
      return;
    }

    const requestedMission =
      missionsWithProgress.find(
        (mission) =>
          mission.id ===
          pendingMissionId
      );

    setPendingMissionId(null);

    /*
     * Remove transient navigation state so browser navigation does not
     * repeatedly reopen the mission.
     */

    navigate(
      location.pathname,
      {
        replace: true,
        state: null
      }
    );

    if (
      !requestedMission ||
      requestedMission.locked ===
        true
    ) {
      return;
    }

    navigate(
      `/tema/${topicId}/mission/${requestedMission.id}`,
      {
        replace: true,
        state: {
          topicId,
          missionId:
            requestedMission.id
        }
      }
    );
  }, [
    location.pathname,
    missionsWithProgress,
    navigate,
    pendingMissionId,
    topicId
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading and error states
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />

          <p className="text-sm text-gray-600">
            Ładowanie tematu...
          </p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm text-red-700">
            {error ||
              "Nie udało się znaleźć tematu."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/temas")
            }
            className="mt-4 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Powrót do tematów
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | View
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-primary-50 to-white pb-5 pt-2 md:py-10">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4">
        <button
          type="button"
          onClick={() =>
            navigate("/temas")
          }
          className="mb-3 inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 md:mb-6"
        >
          ← Powrót do tematów
        </button>

        <header className="mb-5 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:mb-8 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-3xl md:h-16 md:w-16 md:text-4xl">
                {topic.icon ||
                  "🎯"}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 md:text-sm">
                  Misje w realnych sytuacjach
                </p>

                <h1 className="mt-1 break-words text-2xl font-bold leading-tight text-gray-900 md:mt-2 md:text-4xl">
                  {topicTitle}
                </h1>

                <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-gray-600 md:text-base">
                  {topic.description ||
                    topic.descripcion ||
                    "Wybierz misję, ukończ rozmowę i otrzymaj informację zwrotną na końcu."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    🎮 Nauka przez grę
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700">
                    💬 Ćwiczenie rozmowy
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700">
                    🏆 Punkty XP
                  </span>
                </div>
              </div>
            </div>

            <div className="w-fit shrink-0 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700 md:text-base">
              {progressLoading
                ? "⚡ ..."
                : `⚡ ${totalXp} XP`}
            </div>
          </div>
        </header>

        {progressError && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
          >
            {progressError}
          </div>
        )}

        <TopicProgress
          completedCount={
            completedCount
          }
          totalMissions={
            totalMissions
          }
          totalXp={
            totalXp
          }
        />

        <div className="mt-5 space-y-5 md:mt-8 md:space-y-8">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 md:text-sm">
                  Praktyka personalizowana
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900 md:text-2xl">
                  Utwórz własną misję AI
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                  Zbuduj własną rozmowę na podstawie Twojej sytuacji, celu,
                  poziomu i roli AI.
                </p>

                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Misje personalizowane służą do ćwiczeń i obecnie nie
                  przyznają punktów XP.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCreatePersonalizedMission
                }
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Utwórz personalizowaną misję AI
              </button>
            </div>
          </section>

          {missionsWithProgress.length ===
          0 ? (
            <section className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Brak dostępnych misji
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                W tym temacie nie opublikowano jeszcze żadnych misji.
              </p>
            </section>
          ) : (
            <MissionList
              missions={
                missionsWithProgress
              }
              onStartMission={
                handleStartMission
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TemaDetalle;