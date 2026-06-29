// src/services/topicMissionService.js

import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";

const normalizeMission = ({ topicId, missionId, missionData = {}, topicData = {} }) => {
  return {
    id: missionId,
    missionId,
    topicId,

    title: missionData.title || "Untitled mission",
    description:
      missionData.description ||
      "Practice a real-life situation with this topic.",
    scenario:
      missionData.scenario ||
      "Practice a short conversation based on this topic.",

    type: missionData.type || "Conversation",
    difficulty: missionData.difficulty || "Easy",
    level: missionData.level || topicData.level || "A1",
    xpReward: Number(missionData.xpReward) || 10,

    status: missionData.status || "published",
    featured: missionData.featured === true,

    topicTitle: topicData.title || topicData.titulo || topicId,
    topicIcon: topicData.icon || "🎯"
  };
};

const shuffleArray = (array = []) => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const getPublishedTopicMissions = async ({ maxResults = 3 } = {}) => {
  try {
    const topicsRef = collection(db, "temas");
    const topicsSnapshot = await getDocs(topicsRef);

    const allMissions = [];

    for (const topicDoc of topicsSnapshot.docs) {
      const topicId = topicDoc.id;
      const topicData = topicDoc.data();

      const missionsRef = collection(db, "temas", topicId, "missions");

      const missionsQuery = query(
        missionsRef,
        where("status", "==", "published"),
        limit(10)
      );

      const missionsSnapshot = await getDocs(missionsQuery);

      missionsSnapshot.docs.forEach((missionDoc) => {
        allMissions.push(
          normalizeMission({
            topicId,
            missionId: missionDoc.id,
            missionData: missionDoc.data(),
            topicData
          })
        );
      });
    }

    return shuffleArray(allMissions).slice(0, maxResults);
  } catch (error) {
    console.error("Error loading published topic missions:", error);
    return [];
  }
};

export const getFeaturedTopicMissions = async ({ maxResults = 3 } = {}) => {
  try {
    const topicsRef = collection(db, "temas");
    const topicsSnapshot = await getDocs(topicsRef);

    const allMissions = [];

    for (const topicDoc of topicsSnapshot.docs) {
      const topicId = topicDoc.id;
      const topicData = topicDoc.data();

      const missionsRef = collection(db, "temas", topicId, "missions");

      const missionsQuery = query(
        missionsRef,
        where("status", "==", "published"),
        where("featured", "==", true),
        limit(10)
      );

      const missionsSnapshot = await getDocs(missionsQuery);

      missionsSnapshot.docs.forEach((missionDoc) => {
        allMissions.push(
          normalizeMission({
            topicId,
            missionId: missionDoc.id,
            missionData: missionDoc.data(),
            topicData
          })
        );
      });
    }

    return shuffleArray(allMissions).slice(0, maxResults);
  } catch (error) {
    console.error("Error loading featured topic missions:", error);
    return [];
  }
};

export const getSuggestedTopicMissions = async ({ maxResults = 3 } = {}) => {
  const featuredMissions = await getFeaturedTopicMissions({ maxResults });

  if (featuredMissions.length >= maxResults) {
    return featuredMissions;
  }

  const publishedMissions = await getPublishedTopicMissions({ maxResults });

  const merged = [...featuredMissions];

  publishedMissions.forEach((mission) => {
    const alreadyExists = merged.some(
      (item) =>
        item.topicId === mission.topicId &&
        item.missionId === mission.missionId
    );

    if (!alreadyExists && merged.length < maxResults) {
      merged.push(mission);
    }
  });

  return merged;
};

export default {
  getPublishedTopicMissions,
  getFeaturedTopicMissions,
  getSuggestedTopicMissions
};