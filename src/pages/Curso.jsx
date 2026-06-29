// src/pages/Curso.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import { getCourseLevelsForUser } from "../services/courseService";

import CourseHero from "../components/cursos/CourseHero";
import CourseLevelsGrid from "../components/cursos/CourseLevelsGrid";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const normalizeCurrentLevel = (level = "") => {
  return level?.split("-")?.[0] || level || "A1";
};

const Curso = () => {
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [userAgeGroup, setUserAgeGroup] = useState(null);
  const [currentLevel, setCurrentLevel] = useState("A1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          navigate("/login");
          return;
        }

        let ageGroup = null;
        let userCurrentLevel = "A1";

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          ageGroup = userData.ageGroup || null;
          userCurrentLevel =
            userData.currentLevel ||
            userData.level ||
            userData.finalLevel ||
            "A1";
        }

        const normalizedLevel = normalizeCurrentLevel(userCurrentLevel);

        setUserAgeGroup(ageGroup);
        setCurrentLevel(normalizedLevel);

        const courseLevels = await getCourseLevelsForUser({
          userId: user.uid,
          currentLevel: normalizedLevel,
          userAgeGroup: ageGroup,
          includeDrafts: false
        });

        setLevels(courseLevels);
      } catch (error) {
        console.error("Error loading course levels:", error);
        setError("Error loading courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleOpenLevel = (level) => {
    if (level.isLocked) return;
    if (!level.hasLessons) return;

    navigate(`/curso/${level.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your course path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-10">
      <div className="container mx-auto px-4">
        <CourseHero
          currentLevel={currentLevel}
          userAgeGroup={userAgeGroup}
          levelOrder={LEVEL_ORDER}
        />

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <CourseLevelsGrid
          levels={levels}
          onOpenLevel={handleOpenLevel}
        />
      </div>
    </div>
  );
};

export default Curso;