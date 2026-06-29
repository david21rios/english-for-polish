// src/pages/Home.jsx

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
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

import { auth, db } from "../firebase";
import { getLastLessonProgress } from "../services/progressService";
import { getSuggestedTopicMissions } from "../services/topicMissionService";
import AIChatWidget from "../components/chat/AIChatWidget";

const Home = () => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [latestTest, setLatestTest] = useState(null);
  const [topicXp, setTopicXp] = useState(0);
  const [completedMissions, setCompletedMissions] = useState(0);
  const [loading, setLoading] = useState(true);

  const [lastLesson, setLastLesson] = useState(null);
  const [lastLessonTitle, setLastLessonTitle] = useState("");

  const [suggestedMissions, setSuggestedMissions] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData({
            id: userSnap.id,
            ...userSnap.data()
          });
        }

        const testsRef = collection(db, "userTests");
        const testsQuery = query(
          testsRef,
          where("userId", "==", user.uid),
          orderBy("testDate", "desc"),
          limit(1)
        );

        const testsSnap = await getDocs(testsQuery);

        if (!testsSnap.empty) {
          setLatestTest({
            id: testsSnap.docs[0].id,
            ...testsSnap.docs[0].data()
          });
        }

        const progressRef = collection(db, "users", user.uid, "topicProgress");
        const progressSnap = await getDocs(progressRef);

        let totalXp = 0;
        let missionsCount = 0;

        progressSnap.docs.forEach((progressDoc) => {
          const progress = progressDoc.data();

          totalXp += Number(progress.totalXp || 0);
          missionsCount += Array.isArray(progress.completedMissions)
            ? progress.completedMissions.length
            : 0;
        });

        setTopicXp(totalXp);
        setCompletedMissions(missionsCount);

        const suggested = await getSuggestedTopicMissions({
          maxResults: 3
        });

        setSuggestedMissions(suggested);

        const lastProgress = await getLastLessonProgress(user.uid);

        setLastLesson(lastProgress);
        setLastLessonTitle("");
              
        if (lastProgress?.levelId && lastProgress?.lessonId) {
          const lessonRef = doc(
            db,
            "levels",
            lastProgress.levelId,
            "lessons",
            lastProgress.lessonId
          );
        
          const lessonSnap = await getDoc(lessonRef);
        
          if (lessonSnap.exists()) {
            const lessonData = lessonSnap.data();
          
            setLastLessonTitle(
              lessonData.titulo ||
                lessonData.title ||
                lessonData.lessonTitle ||
                lessonData.name ||
                lessonData.nombre ||
                lastProgress.lessonId
            );
          } else {
            console.warn(
              "Lesson document not found:",
              lastProgress.levelId,
              lastProgress.lessonId
            );
          
            setLastLessonTitle(lastProgress.lessonId);
          }
        }
      } catch (error) {
        console.error("Error loading home dashboard:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const userName = userData?.name || "Student";

  const currentLevel =
    userData?.currentLevel || latestTest?.results?.finalLevel || "Not assigned";

  const latestScore = latestTest?.results?.overallScore
    ? Math.round(latestTest.results.overallScore)
    : null;

  const currentLessonText = lastLesson
    ? `${lastLesson.levelId} · ${
        lastLessonTitle && lastLessonTitle !== lastLesson.lessonId
          ? lastLessonTitle
          : "Lesson unavailable"
      }`
    : "No lesson started yet";

  const stats = [
    {
      title: "Current level",
      value: currentLevel,
      icon: FaUserGraduate,
      color: "bg-primary-100 text-primary-600"
    },
    {
      title: "Total XP",
      value: topicXp,
      icon: FaStar,
      color: "bg-yellow-100 text-yellow-700"
    },
    {
      title: "Completed missions",
      value: completedMissions,
      icon: FaMedal,
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Last test score",
      value: latestScore !== null ? `${latestScore}%` : "Pending",
      icon: FaClipboardCheck,
      color: "bg-blue-100 text-blue-700"
    }
  ];

  const handleContinueCourse = () => {
    if (!lastLesson) {
      navigate("/curso");
      return;
    }

    navigate(`/curso/${lastLesson.levelId}`, {
      state: {
        lessonId: lastLesson.lessonId,
        sectionIndex: lastLesson.currentSectionIndex || 0
      }
    });
  };

  const handleStartMission = (mission) => {
    if (!mission?.topicId || !mission?.missionId) {
      navigate("/temas");
      return;
    }
  
    navigate(`/tema/${mission.topicId}/mission/${mission.missionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-5 md:py-10">
        <section className="bg-white rounded-3xl shadow-lg p-5 md:p-10 mb-6 md:mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Student dashboard
              </p>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-gray-900 mt-2 md:mt-3 leading-tight">
                Welcome, {userName}
              </h1>

              <p className="text-gray-600 text-base md:text-lg mt-3 md:mt-4 leading-relaxed">
                Continue your Spanish learning path, review your progress,
                complete missions and keep improving step by step.
              </p>

              <p className="mt-5 text-sm text-gray-500">
                Current lesson:
                <span className="font-semibold text-primary-600 ml-2">
                  {currentLessonText}
                </span>
              </p>

              <div className="mt-5 md:mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleContinueCourse}
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700"
                >
                  <FaBookOpen />
                  Continue course
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/temas")}
                  className="inline-flex items-center justify-center gap-2 bg-secondary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-secondary-600"
                >
                  <FaGamepad />
                  Practice topics
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}
                    >
                      <Icon />
                    </div>

                    <p className="text-sm text-gray-500">{item.title}</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mb-4">
              <FaClipboardCheck />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Level test
            </h2>

            <p className="text-gray-600 mb-5">
              Check your Spanish level and update your learning route.
            </p>

            <button
              type="button"
              onClick={() => navigate("/test")}
              className="w-full mt-auto bg-accent-yellow hover:bg-accent-yellow-dark text-gray-900 font-semibold py-3 px-6 rounded-xl"
            >
              Open test
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
              <FaBookOpen />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Course path
            </h2>

            <p className="text-gray-600 mb-5">
              Continue studying lessons organized by level from A1 to C2.
            </p>

            <button
              type="button"
              onClick={() => navigate("/curso")}
              className="w-full mt-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl"
            >
              Go to course
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 md:p-6 border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
              <FaGamepad />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Topics and missions
            </h2>

            <p className="text-gray-600 mb-5">
              Practice Spanish in real-life situations and collect XP.
            </p>

            <button
              type="button"
              onClick={() => navigate("/temas")}
              className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl"
            >
              Start missions
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
                Suggested missions
              </h2>
              <p className="text-gray-600 text-sm">
                Choose one activity to keep your progress moving today.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {suggestedMissions.length === 0 ? (
              <div className="md:col-span-3 text-center py-8">
                <p className="text-gray-500">
                  No missions are available today.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/temas")}
                  className="mt-4 bg-primary-600 text-white px-5 py-2 rounded-xl hover:bg-primary-700"
                >
                  Explore topics
                </button>
              </div>
            ) : (
              suggestedMissions.map((mission) => (
                <article
                  key={`${mission.topicId}_${mission.missionId}`}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:bg-white hover:shadow-md transition-all flex flex-col"
                >
                  <p className="text-xs text-primary-600 font-semibold mb-2">
                    {mission.topicTitle || "Topic"}
                  </p>

                  <h3 className="font-bold text-gray-900">
                    {mission.missionTitle || mission.title || "Mission"}
                  </h3>

                  <p className="text-sm text-gray-600 mt-3 mb-5 flex-grow">
                    {mission.missionDescription ||
                      mission.description ||
                      "Practice a real-life situation."}
                  </p>

                  <div className="mb-4">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                      +{mission.xpReward || mission.xp || 10} XP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartMission(mission)}
                    className="w-full mt-auto bg-white border border-gray-200 hover:border-primary-500 text-primary-600 font-semibold py-2 rounded-xl"
                  >
                    Start mission
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <AIChatWidget
        mode="language_tutor"
        title="AI Spanish Tutor"
        currentLevel={userData?.currentLevel || "A1-A2"}
        targetLanguage="Spanish"
        baseLanguage="English"
        context={`
          The student is in the main dashboard.
          Help with Spanish learning, grammar, vocabulary, translation and practice.
        `}
      />
    </div>
  );
};

export default Home;