// src/pages/TemaDetalle.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import MissionList from "../components/topics/MissionList";
import TopicProgress from "../components/topics/TopicProgress";

import { getMissionsByTheme } from "../services/firestoreService";
import { getTopicProgress } from "../services/topicProgressService";

const TemaDetalle = () => {
  const { temaTitle } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState(null);
  const [missions, setMissions] = useState([]);
  const [topicProgress, setTopicProgress] = useState(null);
  const [pendingMissionId, setPendingMissionId] = useState(
    location.state?.missionId || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = auth.currentUser?.uid || null;
  const topicTitle = topic?.title || topic?.titulo || temaTitle || "Topic";

  const loadTopicAndMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const topicRef = doc(db, "temas", temaTitle);
      const topicSnap = await getDoc(topicRef);

      if (topicSnap.exists()) {
        setTopic({
          id: topicSnap.id,
          ...topicSnap.data()
        });
      } else {
        setTopic({
          id: temaTitle,
          title: temaTitle,
          description: "Practice real-life situations through missions.",
          icon: "🎯"
        });
      }

      const missionsData = await getMissionsByTheme(temaTitle, {
        includeDrafts: false
      });

      setMissions(missionsData || []);

      if (userId) {
        const progress = await getTopicProgress(userId, temaTitle);
        setTopicProgress(progress);
      }
    } catch (error) {
      console.error("Error loading topic missions:", error);
      setError("Error loading topic missions.");
    } finally {
      setLoading(false);
    }
  }, [temaTitle, userId]);

  useEffect(() => {
    loadTopicAndMissions();
  }, [loadTopicAndMissions]);

  const completedMissions = topicProgress?.completedMissions || [];
  const totalXp = topicProgress?.totalXp || 0;

  const publishedMissionIds = useMemo(
    () => missions.map((mission) => mission.id),
    [missions]
  );

  const completedCount = completedMissions.filter((missionId) =>
    publishedMissionIds.includes(missionId)
  ).length;

  const totalMissions = missions.length;

  const missionsWithProgress = useMemo(() => {
    return missions.map((mission, index) => {
      const isCompleted = completedMissions.includes(mission.id);
      const previousMission = missions[index - 1];

      const previousMissionCompleted =
        index === 0 || completedMissions.includes(previousMission?.id);

      const unlockAfter = Array.isArray(mission.unlockAfter)
        ? mission.unlockAfter
        : [];

      const unlockAfterCompleted =
        unlockAfter.length === 0 ||
        unlockAfter.every((missionId) => completedMissions.includes(missionId));

      return {
        ...mission,
        completed: isCompleted,
        locked:
          mission.locked === true ||
          !previousMissionCompleted ||
          !unlockAfterCompleted
      };
    });
  }, [missions, completedMissions]);

  const handleStartMission = (mission) => {
    if (mission.locked) return;

    navigate(`/tema/${temaTitle}/mission/${mission.id}`);
  };

  const handleCreatePersonalizedMission = () => {
    navigate(`/tema/${temaTitle}/custom-mission`);
  };

  useEffect(() => {
    if (!pendingMissionId || missionsWithProgress.length === 0) {
      return;
    }

    const requestedMission = missionsWithProgress.find(
      (mission) => mission.id === pendingMissionId
    );

    if (!requestedMission || requestedMission.locked) {
      setPendingMissionId(null);
      return;
    }

    setPendingMissionId(null);
    navigate(`/tema/${temaTitle}/mission/${requestedMission.id}`);
  }, [pendingMissionId, missionsWithProgress, navigate, temaTitle]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-11 w-11 border-t-2 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl text-sm text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-2 pb-5 md:py-10 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/temas")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 font-medium mb-3 md:mb-6"
        >
          ← Back to topics
        </button>

        <header className="mb-5 md:mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl md:text-4xl shrink-0">
                {topic?.icon || "🎯"}
              </div>

              <div className="min-w-0">
                <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  Real world missions
                </p>

                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1 md:mt-2 leading-tight break-words">
                  {topicTitle}
                </h1>

                <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed text-sm md:text-base break-words">
                  {topic?.description ||
                    topic?.descripcion ||
                    "Choose a mission, complete the conversation and receive feedback at the end."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-xs font-semibold">
                    🎮 Game-based practice
                  </span>

                  <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-2 rounded-full text-xs font-semibold">
                    💬 Conversation flow
                  </span>

                  <span className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-full text-xs font-semibold">
                    🏆 XP rewards
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-yellow-50 text-yellow-700 px-4 py-3 rounded-2xl font-bold text-sm md:text-base w-fit">
              ⚡ {totalXp} XP
            </div>
          </div>
        </header>

        <TopicProgress
          completedCount={completedCount}
          totalMissions={totalMissions}
          totalXp={totalXp}
        />

        <div className="space-y-5 md:space-y-8 mt-5 md:mt-8">
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  Personalized practice
                </p>

                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  Create your own AI mission
                </h2>

                <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed max-w-3xl">
                  Build a custom conversation based on your own situation, goal,
                  level and AI role.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreatePersonalizedMission}
                className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
              >
                Create personalized AI mission
              </button>
            </div>
          </section>

          <MissionList
            missions={missionsWithProgress}
            onStartMission={handleStartMission}
          />
        </div>
      </div>
    </div>
  );
};

export default TemaDetalle;