// src/pages/Profile.jsx

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import LoadingSpinner from "../components/shared/LoadingSpinner";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileProgress from "../components/profile/ProfileProgress";
import ProfileActivity from "../components/profile/ProfileActivity";
import ProfileSettings from "../components/profile/ProfileSettings";
import ProfileTestHistory from "../components/profile/ProfileTestHistory";
import ProfileMissionHistory from "../components/profile/ProfileMissionHistory";
import EditProfileModal from "../components/profile/EditProfileModal";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";

import { getUserTestHistory } from "../services/firestoreService";
import {
  getUserLevelProgressSummary,
  getUserLearningActivitySummary
} from "../services/progressService";
import { countries } from "../utils/countries";

const buildMissionHistory = async (userId) => {
  const progressRef = collection(db, "users", userId, "topicProgress");
  const progressSnap = await getDocs(progressRef);

  const missions = [];

  progressSnap.docs.forEach((progressDoc) => {
    const progress = progressDoc.data();
    const topicId = progress.topicId || progressDoc.id;

    const attempts = Array.isArray(progress.missionAttempts)
      ? progress.missionAttempts
      : progress.lastMission
      ? [progress.lastMission]
      : [];

    attempts.forEach((attempt) => {
      missions.push({
        topicId,
        missionId: attempt.missionId,
        missionTitle:
          attempt.feedback?.missionTitle ||
          attempt.userContext?.missionTitle ||
          attempt.missionTitle ||
          "Ukończona misja",
        topicTitle:
          attempt.userContext?.topicTitle || progress.topicTitle || topicId,
        score: Number(attempt.score || attempt.feedback?.score || 0),
        stars: Number(attempt.stars || attempt.feedback?.stars || 0),
        xpEarned: Number(attempt.xpEarned || 0),
        passed: attempt.passed === true || attempt.feedback?.passed === true,
        isCustomMission: attempt.isCustomMission === true,
        completedAt: attempt.completedAt || null
      });
    });
  });

  return missions
    .filter((mission) => mission.missionId)
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || 0).getTime();
      const dateB = new Date(b.completedAt || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 8);
};

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [missionHistory, setMissionHistory] = useState([]);
  const [levelProgress, setLevelProgress] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setError("Brak zalogowanego użytkownika.");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError("Nie znaleziono profilu użytkownika.");
          return;
        }

        const userInfo = userDoc.data();
        setUserData(userInfo);

        const tests = await getUserTestHistory(currentUser.uid);
        setTestHistory(tests);

        const progressSummary = await getUserLevelProgressSummary({
          userId: currentUser.uid,
          levelId: userInfo.currentLevel || "A1",
          userAgeGroup: userInfo.ageGroup || null
        });

        setLevelProgress(progressSummary);

        const learningActivity = await getUserLearningActivitySummary(
          currentUser.uid
        );

        setActivitySummary(learningActivity);

        const missions = await buildMissionHistory(currentUser.uid);
        setMissionHistory(missions);
      } catch (err) {
        console.error(err);
        setError("Nie udało się załadować profilu.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const getCountryInfo = (countryCode) => {
    return (
      countries.find((country) => country.code === countryCode) || {
        name: "Nie określono",
        flag: "🌎"
      }
    );
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-center text-sm md:text-base">
          {error}
        </div>
      </div>
    );
  }

  const userCountry = getCountryInfo(userData?.country);
  const currentUserId = auth.currentUser?.uid;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-10 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="space-y-5 md:space-y-8">
          <ProfileHeader userData={userData} userCountry={userCountry} />

          <ProfileStats userData={userData} testHistory={testHistory} />

          <ProfileTestHistory testHistory={testHistory} />

          <ProfileProgress
            userData={userData}
            testHistory={testHistory}
            levelProgress={levelProgress}
          />

          <ProfileMissionHistory missionHistory={missionHistory} />

          <ProfileActivity activitySummary={activitySummary} />

          <ProfileSettings
            onEditProfile={() => setShowEditModal(true)}
            onChangePassword={() => setShowPasswordModal(true)}
          />
        </div>

        {showEditModal && currentUserId && (
          <EditProfileModal
            userId={currentUserId}
            userData={userData}
            onClose={() => setShowEditModal(false)}
            onSaved={(updatedData) => {
              setUserData((prev) => ({
                ...prev,
                ...updatedData
              }));
            }}
          />
        )}

        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </div>
    </div>
  );
};

export default Profile;