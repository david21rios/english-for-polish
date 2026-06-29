// src/services/topicProgressService.js

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

const getTopicProgressDocId = (topicId) => {
  return `topic_${topicId}`;
};

const buildMissionAttempt = ({
  missionId,
  answer = "",
  conversation = [],
  userContext = {},
  feedback = {},
  xpEarned = 0,
  alreadyCompleted = false,
  isCustomMission = false
}) => {
  return {
    missionId,
    answer,
    conversation,
    userContext,
    feedback,
    isCustomMission,
    xpEarned,
    alreadyCompleted,
    score: Number(feedback?.score || 0),
    stars: Number(feedback?.stars || 0),
    passed: feedback?.passed === true,
    suggestedLevel: feedback?.suggestedLevel || null,
    objectivesCompleted: feedback?.objectivesCompleted || [],
    completedAt: new Date().toISOString()
  };
};

export const getTopicProgress = async (userId, topicId) => {
  if (!userId || !topicId) return null;

  try {
    const progressRef = doc(
      db,
      "users",
      userId,
      "topicProgress",
      getTopicProgressDocId(topicId)
    );

    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) return null;

    return {
      id: progressSnap.id,
      ...progressSnap.data()
    };
  } catch (error) {
    console.error("Error getting topic progress:", error);
    return null;
  }
};

export const saveTopicMissionProgress = async ({
  userId,
  topicId,
  missionId,
  xpEarned = 0,
  answer = "",
  conversation = [],
  userContext = {},
  feedback = {},
  isCustomMission = false
}) => {
  if (!userId || !topicId || !missionId) return null;

  try {
    const progressRef = doc(
      db,
      "users",
      userId,
      "topicProgress",
      getTopicProgressDocId(topicId)
    );

    const currentProgress = await getTopicProgress(userId, topicId);

    const previousXp = Number(currentProgress?.totalXp || 0);
    const previousCompletedMissions =
      currentProgress?.completedMissions || [];

    const previousAttempts = Array.isArray(currentProgress?.missionAttempts)
      ? currentProgress.missionAttempts
      : [];

    const previousBestScores = currentProgress?.bestScores || {};
    const previousBestStars = currentProgress?.bestStars || {};

    const alreadyCompleted =
      !isCustomMission && previousCompletedMissions.includes(missionId);

    const updatedCompletedMissions =
      alreadyCompleted || isCustomMission
        ? previousCompletedMissions
        : [...previousCompletedMissions, missionId];

    const xpToAdd = alreadyCompleted ? 0 : Number(xpEarned || 0);
    const newTotalXp = previousXp + xpToAdd;

    const score = Number(feedback?.score || 0);
    const stars = Number(feedback?.stars || 0);

    const previousBestScore = Number(previousBestScores[missionId] || 0);
    const previousBestStar = Number(previousBestStars[missionId] || 0);

    const updatedBestScores = {
      ...previousBestScores,
      [missionId]: Math.max(previousBestScore, score)
    };

    const updatedBestStars = {
      ...previousBestStars,
      [missionId]: Math.max(previousBestStar, stars)
    };

    const attempt = buildMissionAttempt({
      missionId,
      answer,
      conversation,
      userContext,
      feedback,
      xpEarned: xpToAdd,
      alreadyCompleted,
      isCustomMission
    });

    const progressData = {
      userId,
      topicId,
      totalXp: newTotalXp,
      completedMissions: updatedCompletedMissions,
      bestScores: updatedBestScores,
      bestStars: updatedBestStars,
      missionAttempts: [...previousAttempts, attempt].slice(-20),
      lastMission: attempt,
      updatedAt: serverTimestamp()
    };

    await setDoc(progressRef, progressData, { merge: true });

    return progressData;
  } catch (error) {
    console.error("Error saving topic mission progress:", error);
    throw error;
  }
};

export default {
  getTopicProgress,
  saveTopicMissionProgress
};