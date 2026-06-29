// src/pages/MissionChatPage.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

import MissionPlayer from "../components/topics/MissionPlayer";
import MissionFeedback from "../components/topics/MissionFeedback";

import {
  getTopicProgress,
  saveTopicMissionProgress
} from "../services/topicProgressService";

const MissionChatPage = () => {
  const { temaTitle, missionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(location.state?.topic || null);
  const [mission, setMission] = useState(location.state?.mission || null);
  const [topicProgress, setTopicProgress] = useState(null);
  const [missionResult, setMissionResult] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [loading, setLoading] = useState(!location.state?.mission);
  const [error, setError] = useState("");

  const userId = auth.currentUser?.uid || null;

  const topicTitle = topic?.title || topic?.titulo || temaTitle || "Topic";

  useEffect(() => {
    const loadRequiredData = async () => {
      try {
        setLoading(true);
        setError("");

        let loadedTopic = topic;

        if (!loadedTopic) {
          const topicRef = doc(db, "temas", temaTitle);
          const topicSnap = await getDoc(topicRef);

          if (topicSnap.exists()) {
            loadedTopic = {
              id: topicSnap.id,
              ...topicSnap.data()
            };

            setTopic(loadedTopic);
          } else {
            loadedTopic = {
              id: temaTitle,
              title: temaTitle,
              icon: "🎯"
            };

            setTopic(loadedTopic);
          }
        }

        if (!mission && missionId) {
          const missionRef = doc(db, "temas", temaTitle, "missions", missionId);
          const missionSnap = await getDoc(missionRef);

          if (!missionSnap.exists()) {
            throw new Error("Mission not found.");
          }

          setMission({
            id: missionSnap.id,
            ...missionSnap.data()
          });
        }

        if (userId) {
          const progress = await getTopicProgress(userId, temaTitle);
          setTopicProgress(progress);
        }
      } catch (error) {
        console.error("Error loading mission chat:", error);
        setError("Could not load this mission.");
      } finally {
        setLoading(false);
      }
    };

    loadRequiredData();
  }, [temaTitle, missionId, mission, topic, userId]);

  const buildMissionContext = (currentMission) => ({
    goal:
      currentMission?.goal ||
      currentMission?.description ||
      "Complete this mission.",
    situation:
      currentMission?.scenario ||
      currentMission?.description ||
      "Practice this real-life situation.",
    level: currentMission?.level || "A1",
    tone: currentMission?.tone || "friendly",
    topicTitle
  });

  const handleCompleteMission = async (result) => {
    try {
      setSavingProgress(true);

      let savedProgress = null;

      if (userId) {
        savedProgress = await saveTopicMissionProgress({
          userId,
          topicId: temaTitle,
          missionId: result.mission.id,
          xpEarned: result.xpEarned,
          answer: result.answer,
          conversation: result.conversation || [],
          userContext: result.userContext || {},
          feedback: result.feedback || {},
          isCustomMission: result.mission.isCustom === true
        });

        setTopicProgress(savedProgress);
      }

      setMissionResult({
        ...result,
        xpEarned: savedProgress?.lastMission?.xpEarned ?? result.xpEarned,
        totalXp: savedProgress?.totalXp ?? topicProgress?.totalXp ?? 0,
        alreadyCompleted: savedProgress?.lastMission?.xpEarned === 0
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      console.error("Error saving mission progress:", error);
      setMissionResult(result);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRetryMission = () => {
    setMissionResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleBackToMissions = () => {
    navigate(`/tema/${temaTitle}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-11 w-11 border-t-2 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-center max-w-md">
          {error || "Mission not available."}

          <button
            type="button"
            onClick={() => navigate(`/tema/${temaTitle}`)}
            className="mt-4 inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-5 py-3"
          >
            Back to missions
          </button>
        </div>
      </div>
    );
  }

  if (savingProgress) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center text-gray-600">
          Saving your progress...
        </div>
      </div>
    );
  }

  if (missionResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-2 pb-6 overflow-x-hidden">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <MissionFeedback
            result={missionResult}
            onRetry={handleRetryMission}
            onBackToMissions={handleBackToMissions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-2 pb-6 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        <MissionPlayer
          mission={mission}
          userContext={buildMissionContext(mission)}
          topic={topic}
          onBack={handleBackToMissions}
          onComplete={handleCompleteMission}
        />
      </div>
    </div>
  );
};

export default MissionChatPage;