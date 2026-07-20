// src/pages/Home.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "firebase/firestore";

import {
  FaBookOpen,
  FaClipboardCheck,
  FaGamepad,
  FaMedal,
  FaRocket,
  FaStar,
  FaUserGraduate
} from "react-icons/fa";

import {
  auth,
  db
} from "../firebase";

import {
  getLastLessonProgress
} from "../services/progress/progressService";

import {
  getSuggestedTopicMissions
} from "../services/missions/topicMissionService";

import AIChatWidget from "../components/chat/AIChatWidget";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = "",
  maximumLength = 500
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maximumLength
    );
};

const getLessonTitleFromData = ({
  lessonData = {},
  progressData = {},
  fallback = ""
} = {}) => {
  return (
    normalizeText(
      lessonData.title ||
        lessonData.lessonTitle ||
        lessonData.name ||
        lessonData.titulo,
      300
    ) ||
    normalizeText(
      progressData.lessonTitle ||
        progressData.title ||
        progressData.lessonName ||
        progressData.titulo,
      300
    ) ||
    normalizeText(
      fallback,
      150
    )
  );
};

/*
|--------------------------------------------------------------------------
| Lesson resolution
|--------------------------------------------------------------------------
|
| Current structure:
|
| levels/{levelId}/modules/{moduleId}/lessons/{lessonId}
|
| Legacy structure:
|
| levels/{levelId}/lessons/{lessonId}
|
| The legacy lookup remains temporarily available so that old progress
| documents do not break while progress records are migrated.
|
*/

const getModularLessonSnapshot =
  async ({
    levelId,
    moduleId,
    lessonId
  }) => {
    if (
      !levelId ||
      !moduleId ||
      !lessonId
    ) {
      return null;
    }

    const lessonRef =
      doc(
        db,
        "levels",
        levelId,
        "modules",
        moduleId,
        "lessons",
        lessonId
      );

    const lessonSnapshot =
      await getDoc(
        lessonRef
      );

    return lessonSnapshot.exists()
      ? lessonSnapshot
      : null;
  };

const getLegacyLessonSnapshot =
  async ({
    levelId,
    lessonId
  }) => {
    if (
      !levelId ||
      !lessonId
    ) {
      return null;
    }

    const legacyLessonRef =
      doc(
        db,
        "levels",
        levelId,
        "lessons",
        lessonId
      );

    const legacySnapshot =
      await getDoc(
        legacyLessonRef
      );

    return legacySnapshot.exists()
      ? legacySnapshot
      : null;
  };

/*
|--------------------------------------------------------------------------
| Module discovery for old progress records
|--------------------------------------------------------------------------
|
| Some old progress documents may contain levelId and lessonId but no
| moduleId. In that case, inspect the modules of the level and locate the
| lesson once.
|
| New progress documents should always persist moduleId so this discovery
| does not become the normal lookup path.
|
*/

const findLessonInsideLevelModules =
  async ({
    levelId,
    lessonId
  }) => {
    if (
      !levelId ||
      !lessonId
    ) {
      return null;
    }

    const modulesRef =
      collection(
        db,
        "levels",
        levelId,
        "modules"
      );

    const modulesSnapshot =
      await getDocs(
        modulesRef
      );

    for (
      const moduleDocument
      of modulesSnapshot.docs
    ) {
      const candidateLessonRef =
        doc(
          db,
          "levels",
          levelId,
          "modules",
          moduleDocument.id,
          "lessons",
          lessonId
        );

      const candidateLessonSnapshot =
        await getDoc(
          candidateLessonRef
        );

      if (
        candidateLessonSnapshot.exists()
      ) {
        return {
          moduleId:
            moduleDocument.id,

          lessonSnapshot:
            candidateLessonSnapshot
        };
      }
    }

    return null;
  };

const resolveLastLesson =
  async (
    progressData
  ) => {
    const levelId =
      normalizeText(
        progressData?.levelId,
        150
      );

    const moduleId =
      normalizeText(
        progressData?.moduleId,
        150
      );

    const lessonId =
      normalizeText(
        progressData?.lessonId,
        150
      );

    if (
      !levelId ||
      !lessonId
    ) {
      return {
        ...progressData,

        levelId,
        moduleId,
        lessonId,

        lessonTitle:
          getLessonTitleFromData({
            progressData,
            fallback:
              lessonId
          }),

        lessonFound:
          false
      };
    }

    /*
     * 1. Current modular structure.
     */

    if (moduleId) {
      const modularSnapshot =
        await getModularLessonSnapshot({
          levelId,
          moduleId,
          lessonId
        });

      if (modularSnapshot) {
        return {
          ...progressData,

          levelId,
          moduleId,
          lessonId,

          lessonTitle:
            getLessonTitleFromData({
              lessonData:
                modularSnapshot.data(),

              progressData,

              fallback:
                lessonId
            }),

          lessonFound:
            true,

          lessonStructure:
            "modular"
        };
      }
    }

    /*
     * 2. Discover the module for old progress documents that do not yet
     *    contain moduleId.
     */

    if (!moduleId) {
      const discoveredLesson =
        await findLessonInsideLevelModules({
          levelId,
          lessonId
        });

      if (discoveredLesson) {
        return {
          ...progressData,

          levelId,

          moduleId:
            discoveredLesson
              .moduleId,

          lessonId,

          lessonTitle:
            getLessonTitleFromData({
              lessonData:
                discoveredLesson
                  .lessonSnapshot
                  .data(),

              progressData,

              fallback:
                lessonId
            }),

          lessonFound:
            true,

          lessonStructure:
            "modular_discovered"
        };
      }
    }

    /*
     * 3. Temporary compatibility with legacy documents.
     */

    const legacySnapshot =
      await getLegacyLessonSnapshot({
        levelId,
        lessonId
      });

    if (legacySnapshot) {
      return {
        ...progressData,

        levelId,
        moduleId: "",
        lessonId,

        lessonTitle:
          getLessonTitleFromData({
            lessonData:
              legacySnapshot.data(),

            progressData,

            fallback:
              lessonId
          }),

        lessonFound:
          true,

        lessonStructure:
          "legacy"
      };
    }

    /*
     * Do not emit a misleading warning. The progress entry can still be
     * displayed using its stored title or identifier.
     */

    return {
      ...progressData,

      levelId,
      moduleId,
      lessonId,

      lessonTitle:
        getLessonTitleFromData({
          progressData,
          fallback:
            lessonId
        }),

      lessonFound:
        false,

      lessonStructure:
        "unresolved"
    };
  };

/*
|--------------------------------------------------------------------------
| Home
|--------------------------------------------------------------------------
*/

const Home = () => {
  const navigate =
    useNavigate();

  const [
    userData,
    setUserData
  ] = useState(null);

  const [
    latestTest,
    setLatestTest
  ] = useState(null);

  const [
    topicXp,
    setTopicXp
  ] = useState(0);

  const [
    completedMissions,
    setCompletedMissions
  ] = useState(0);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    profileMissing,
    setProfileMissing
  ] = useState(false);

  const [
    lastLesson,
    setLastLesson
  ] = useState(null);

  const [
    suggestedMissions,
    setSuggestedMissions
  ] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | Dashboard loading
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let componentActive =
      true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            navigate(
              "/login"
            );

            return;
          }

          try {
            if (
              componentActive
            ) {
              setLoading(true);
            }

            /*
             * User profile
             */

            const userRef =
              doc(
                db,
                "users",
                user.uid
              );

            const userSnapshot =
              await getDoc(
                userRef
              );
            
            if (!userSnapshot.exists()) {
              if (componentActive) {
                setProfileMissing(true);
                setLoading(false);
              }
            
              return;
            }

            if (componentActive) {
              setProfileMissing(false);
            
              setUserData({
                id: userSnapshot.id,
                ...userSnapshot.data()
              });
            }

            /*
             * Latest placement test
             */

            const testsRef =
              collection(
                db,
                "userTests"
              );

            const testsQuery =
              query(
                testsRef,

                where(
                  "userId",
                  "==",
                  user.uid
                ),

                orderBy(
                  "testDate",
                  "desc"
                ),

                limit(1)
              );

            const testsSnapshot =
              await getDocs(
                testsQuery
              );

            if (
              componentActive &&
              !testsSnapshot.empty
            ) {
              setLatestTest({
                id:
                  testsSnapshot
                    .docs[0]
                    .id,

                ...testsSnapshot
                  .docs[0]
                  .data()
              });
            }

            /*
             * Topic progress
             */

            const progressRef =
              collection(
                db,
                "users",
                user.uid,
                "topicProgress"
              );

            const progressSnapshot =
              await getDocs(
                progressRef
              );

            let totalXp = 0;
            let missionsCount = 0;

            progressSnapshot.docs
              .forEach(
                (
                  progressDocument
                ) => {
                  const progress =
                    progressDocument
                      .data();

                  totalXp +=
                    Number(
                      progress.totalXp ||
                        0
                    );

                  missionsCount +=
                    Array.isArray(
                      progress
                        .completedMissions
                    )
                      ? progress
                          .completedMissions
                          .length
                      : 0;
                }
              );

            if (
              componentActive
            ) {
              setTopicXp(
                totalXp
              );

              setCompletedMissions(
                missionsCount
              );
            }

            /*
             * Suggested missions
             */

            const suggested =
              await getSuggestedTopicMissions({
                maxResults: 3
              });

            if (
              componentActive
            ) {
              setSuggestedMissions(
                Array.isArray(
                  suggested
                )
                  ? suggested
                  : []
              );
            }

            /*
             * Last lesson progress
             */

            const lastProgress =
              await getLastLessonProgress(
                user.uid
              );

            if (!lastProgress) {
              if (
                componentActive
              ) {
                setLastLesson(
                  null
                );
              }

              return;
            }

            try {
              const resolvedLesson =
                await resolveLastLesson(
                  lastProgress
                );

              if (
                componentActive
              ) {
                setLastLesson(
                  resolvedLesson
                );
              }
            } catch (
              lessonResolutionError
            ) {
              /*
               * A lesson lookup failure must not prevent the rest of the
               * dashboard from loading.
               */

              console.error(
                "Error resolving last lesson:",
                {
                  levelId:
                    lastProgress
                      ?.levelId ||
                    null,

                  moduleId:
                    lastProgress
                      ?.moduleId ||
                    null,

                  lessonId:
                    lastProgress
                      ?.lessonId ||
                    null,

                  code:
                    lessonResolutionError
                      ?.code,

                  message:
                    lessonResolutionError
                      ?.message
                }
              );

              if (
                componentActive
              ) {
                setLastLesson({
                  ...lastProgress,

                  lessonTitle:
                    getLessonTitleFromData({
                      progressData:
                        lastProgress,

                      fallback:
                        lastProgress
                          ?.lessonId ||
                        ""
                    }),

                  lessonFound:
                    false,

                  lessonStructure:
                    "lookup_failed"
                });
              }
            }
          } catch (error) {
            console.error(
              "Error loading home dashboard:",
              {
                code:
                  error?.code,

                message:
                  error?.message,

                error
              }
            );
          } finally {
            if (
              componentActive
            ) {
              setLoading(false);
            }
          }
        }
      );

    return () => {
      componentActive =
        false;

      unsubscribe();
    };
  }, [
    navigate
  ]);

  /*
  |--------------------------------------------------------------------------
  | Derived dashboard data
  |--------------------------------------------------------------------------
  */

  const userName =
    userData?.name ||
    "Student";

  const currentLevel =
    userData?.currentLevel ||
    latestTest
      ?.results
      ?.finalLevel ||
    "Nie przypisano";

  const latestScore =
    latestTest
      ?.results
      ?.overallScore !==
      undefined &&
    latestTest
      ?.results
      ?.overallScore !==
      null
      ? Math.round(
          Number(
            latestTest
              .results
              .overallScore
          ) || 0
        )
      : null;

  const lastLessonLevel =
    normalizeText(
      lastLesson?.levelId,
      50
    );

  const lastLessonModule =
    normalizeText(
      lastLesson?.moduleId,
      100
    );

  const lastLessonTitle =
    normalizeText(
      lastLesson?.lessonTitle,
      300
    );

  const currentLessonText =
    lastLesson
      ? [
          lastLessonLevel,

          lastLessonModule
            ? `Moduł ${lastLessonModule}`
            : "",

          lastLessonTitle ||
            normalizeText(
              lastLesson?.lessonId,
              150
            )
        ]
          .filter(Boolean)
          .join(" · ")
      : "Nie rozpoczęto jeszcze lekcji";

  const stats = [
    {
      title:
        "Aktualny poziom",

      value:
        currentLevel,

      icon:
        FaUserGraduate,

      color:
        "bg-primary-100 text-primary-600"
    },
    {
      title:
        "Łączne XP",

      value:
        topicXp,

      icon:
        FaStar,

      color:
        "bg-yellow-100 text-yellow-700"
    },
    {
      title:
        "Ukończone misje",

      value:
        completedMissions,

      icon:
        FaMedal,

      color:
        "bg-green-100 text-green-700"
    },
    {
      title:
        "Ostatni wynik testu",

      value:
        latestScore !== null
          ? `${latestScore}%`
          : "Oczekuje",

      icon:
        FaClipboardCheck,

      color:
        "bg-blue-100 text-blue-700"
    }
  ];

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleContinueCourse =
    () => {
      if (
        !lastLesson?.levelId
      ) {
        navigate(
          "/curso"
        );

        return;
      }

      navigate(
        `/curso/${lastLesson.levelId}`,
        {
          state: {
            levelId:
              lastLesson.levelId,

            moduleId:
              lastLesson.moduleId ||
              null,

            lessonId:
              lastLesson.lessonId ||
              null,

            sectionIndex:
              Number(
                lastLesson
                  .currentSectionIndex
              ) || 0,

            lessonStructure:
              lastLesson
                .lessonStructure ||
              null
          }
        }
      );
    };

  const handleStartMission =
    (
      mission
    ) => {
      if (
        !mission?.topicId ||
        !mission?.missionId
      ) {
        navigate(
          "/temas"
        );

        return;
      }

      navigate(
        `/tema/${mission.topicId}/mission/${mission.missionId}`
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />

          <p className="text-gray-600">
            Ładowanie panelu ucznia...
          </p>
        </div>
      </div>
    );
  }

  if (profileMissing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            Nie znaleziono profilu użytkownika
          </h2>
    
          <p className="text-gray-700 mb-6">
            Twoje konto istnieje w systemie uwierzytelniania, ale nie posiada profilu w bazie danych.
          </p>
    
          <button
            type="button"
            onClick={() => navigate("/welcome")}
            className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-5 md:py-10">
        <section className="bg-white rounded-3xl shadow-lg p-5 md:p-10 mb-6 md:mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Panel ucznia
              </p>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-gray-900 mt-2 md:mt-3 leading-tight">
                Witaj, {userName}
              </h1>

              <p className="text-gray-600 text-base md:text-lg mt-3 md:mt-4 leading-relaxed">
                Kontynuuj naukę języka angielskiego, sprawdzaj swoje postępy,
                wykonuj misje i rozwijaj umiejętności krok po kroku.
              </p>

              <p className="mt-5 text-sm text-gray-500">
                Aktualna lekcja:

                <span className="font-semibold text-primary-600 ml-2">
                  {currentLessonText}
                </span>
              </p>

              <div className="mt-5 md:mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={
                    handleContinueCourse
                  }
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700"
                >
                  <FaBookOpen />

                  Kontynuuj kurs
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/temas"
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 bg-secondary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-secondary-600"
                >
                  <FaGamepad />

                  Ćwicz tematy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {stats.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={
                        item.title
                      }
                      className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}
                      >
                        <Icon />
                      </div>

                      <p className="text-sm text-gray-500">
                        {item.title}
                      </p>

                      <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                        {item.value}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mb-4">
              <FaClipboardCheck />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Test poziomujący
            </h2>

            <p className="text-gray-600 mb-5">
              Sprawdź swój poziom języka angielskiego i zaktualizuj ścieżkę
              nauki.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/test"
                )
              }
              className="w-full mt-auto bg-accent-yellow hover:bg-accent-yellow-dark text-gray-900 font-semibold py-3 px-6 rounded-xl"
            >
              Otwórz test
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
              <FaBookOpen />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ścieżka kursu
            </h2>

            <p className="text-gray-600 mb-5">
              Kontynuuj lekcje języka angielskiego uporządkowane od poziomu A1
              do C2.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/curso"
                )
              }
              className="w-full mt-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl"
            >
              Przejdź do kursu
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
              <FaGamepad />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Tematy i misje
            </h2>

            <p className="text-gray-600 mb-5">
              Ćwicz język angielski w praktycznych sytuacjach i zdobywaj XP.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/temas"
                )
              }
              className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl"
            >
              Rozpocznij misje
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow p-5 md:p-8 border border-gray-100">
          <div className="flex items-start gap-3 mb-5 md:mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <FaRocket />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Sugerowane misje
              </h2>

              <p className="text-gray-600 text-sm">
                Wybierz jedną aktywność, aby kontynuować postęp już dziś.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {suggestedMissions.length ===
            0 ? (
              <div className="md:col-span-3 text-center py-8">
                <p className="text-gray-500">
                  Brak dostępnych misji na dziś.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/temas"
                    )
                  }
                  className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-xl hover:bg-primary-700"
                >
                  Przeglądaj tematy
                </button>
              </div>
            ) : (
              suggestedMissions.map(
                (mission) => (
                  <article
                    key={`${mission.topicId}_${mission.missionId}`}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:bg-white hover:shadow-md transition-all flex flex-col"
                  >
                    <p className="text-xs text-primary-600 font-semibold mb-2">
                      {mission.topicTitle ||
                        "Temat"}
                    </p>

                    <h3 className="font-bold text-gray-900">
                      {mission.missionTitle ||
                        mission.title ||
                        "Misja"}
                    </h3>

                    <p className="text-sm text-gray-600 mt-3 mb-5 flex-grow">
                      {mission.missionDescription ||
                        mission.description ||
                        "Ćwicz praktyczną sytuację komunikacyjną."}
                    </p>

                    <div className="mb-4">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                        +
                        {mission.xpReward ||
                          mission.xp ||
                          10}{" "}
                        XP
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleStartMission(
                          mission
                        )
                      }
                      className="w-full mt-auto bg-white border border-gray-200 hover:border-primary-500 text-primary-600 font-semibold py-2 rounded-xl"
                    >
                      Rozpocznij misję
                    </button>
                  </article>
                )
              )
            )}
          </div>
        </section>
      </div>

      <AIChatWidget
        mode="language_tutor"
        title="AI English Tutor"
        currentLevel={
          userData?.currentLevel ||
          "A1-A2"
        }
        targetLanguage="English"
        baseLanguage="Polish"
        context={`
          The student is in the main dashboard.
          Help with English learning, grammar, vocabulary, translation and practice.
          Use Polish for explanations when helpful.
        `}
      />
    </div>
  );
};

export default Home;