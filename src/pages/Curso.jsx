// src/pages/Curso.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  FaBook,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaArrowRight,
  FaLayerGroup,
  FaLock,
  FaPlay,
  FaCheckCircle
} from "react-icons/fa";

import { auth, db } from "../firebase";
import { getLessonsByLevel } from "../services/firestoreService";
import { getUserLevelProgressSummary } from "../services/progressService";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const getLevelIcon = (levelId = "") => {
  if (levelId.startsWith("A")) return FaBook;
  if (levelId.startsWith("B")) return FaChalkboardTeacher;
  return FaGraduationCap;
};

const getLevelIndex = (levelId = "") => {
  const cleanLevel = levelId?.split("-")?.[0] || levelId;
  const index = LEVEL_ORDER.indexOf(cleanLevel);
  return index === -1 ? 0 : index;
};

const getCardStyle = ({ isCompleted, isCurrentLevel, isLocked, hasLessons }) => {
  if (isLocked) {
    return "bg-gray-100 border-gray-200 opacity-70";
  }

  if (isCompleted) {
    return "bg-green-50 border-green-300 hover:shadow-xl";
  }

  if (isCurrentLevel) {
    return "bg-white border-primary-300 ring-2 ring-primary-100 hover:shadow-xl";
  }

  if (!hasLessons) {
    return "bg-white border-gray-200 opacity-75";
  }

  return "bg-white border-gray-100 hover:-translate-y-1 hover:shadow-xl";
};

const getIconStyle = ({ isCompleted, isCurrentLevel, isLocked, levelId }) => {
  if (isLocked) return "bg-gray-200 text-gray-500";
  if (isCompleted) return "bg-green-100 text-green-700";
  if (isCurrentLevel) return "bg-primary-100 text-primary-700";

  if (levelId.startsWith("A")) return "bg-green-100 text-green-700";
  if (levelId.startsWith("B")) return "bg-blue-100 text-blue-700";

  return "bg-purple-100 text-purple-700";
};

const Curso = () => {
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [userAgeGroup, setUserAgeGroup] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
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
        let userCurrentLevel = null;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          ageGroup = userData.ageGroup || null;
          userCurrentLevel =
            userData.currentLevel ||
            userData.level ||
            userData.finalLevel ||
            null;
        }
        const normalizedCurrentLevel =
          userCurrentLevel?.split("-")?.[0] || userCurrentLevel;

        setUserAgeGroup(ageGroup);
        setCurrentLevel(normalizedCurrentLevel);
        const currentLevelIndex = getLevelIndex(normalizedCurrentLevel ?? "A1");

        const levelsSnapshot = await getDocs(collection(db, "levels"));

        const levelsData = levelsSnapshot.docs
          .map((levelDoc) => ({
            id: levelDoc.id,
            ...levelDoc.data()
          }))
          .sort((a, b) => {
            const indexA = LEVEL_ORDER.indexOf(a.id);
            const indexB = LEVEL_ORDER.indexOf(b.id);

            return (
              (indexA === -1 ? 999 : indexA) -
              (indexB === -1 ? 999 : indexB)
            );
          });

        const levelsWithDetails = await Promise.all(
          levelsData.map(async (level) => {
            const lessons = await getLessonsByLevel(level.id, ageGroup);

            const progressSummary = await getUserLevelProgressSummary({
              userId: user.uid,
              levelId: level.id,
              userAgeGroup: ageGroup
            });

            const levelIndex = getLevelIndex(level.id);
            const hasLessons = (lessons || []).length > 0;
            const isCurrentLevel = normalizedCurrentLevel === level.id;
            const isCompleted =
              progressSummary.totalLessons > 0 &&
              progressSummary.completedLessons >= progressSummary.totalLessons;

            const isLocked = levelIndex > currentLevelIndex;

            return {
              ...level,
              lessons: lessons || [],
              progressSummary,
              hasLessons,
              isCurrentLevel,
              isCompleted,
              isLocked
            };
          })
        );

        setLevels(levelsWithDetails);
      } catch (error) {
        console.error("Error loading levels and lessons:", error);
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
        <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-10 mb-6 md:mb-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Course path
              </p>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-gray-900 mt-2 md:mt-3 mb-4 md:mb-5 leading-tight">
                Start learning Spanish by level
              </h1>

              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Courses are organized by CEFR levels: A1, A2, B1, B2, C1 and C2.
                Your current level is unlocked, previous levels remain available
                for review, and higher levels unlock progressively.
              </p>

              <div className="mt-5 md:mt-6 flex flex-wrap gap-2 md:gap-3 text-sm">
                {currentLevel && (
                  <span className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-semibold">
                    <FaGraduationCap />
                    Current level: {currentLevel}
                  </span>
                )}

                {userAgeGroup && (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                    <FaLayerGroup />
                    Age group: {userAgeGroup}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {LEVEL_ORDER.map((level) => {
                const levelIndex = getLevelIndex(level);
                const currentIndex = getLevelIndex(currentLevel || "A1");
                const isLocked = levelIndex > currentIndex;
                const isCurrent = currentLevel === level;

                return (
                  <div
                    key={level}
                    className={`border rounded-2xl p-4 md:p-5 text-center ${
                      isLocked
                        ? "bg-gray-100 border-gray-200 text-gray-400"
                        : isCurrent
                        ? "bg-primary-50 border-primary-200 text-primary-700"
                        : "bg-gray-50 border-gray-100 text-gray-700"
                    }`}
                  >
                    <p className="text-2xl font-bold">{level}</p>
                    <p className="text-xs mt-1">
                      {isLocked ? "Locked" : isCurrent ? "Current" : "Level"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {levels.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-8 text-center text-gray-500">
            No course levels are available yet.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {levels.map((level) => {
              const Icon = getLevelIcon(level.id);

              const lessonCount = level.lessons?.length || 0;
              const progress = level.progressSummary || {};
              const progressPercent = progress.progressPercent || 0;
              const completedLessons = progress.completedLessons || 0;
              const totalLessons = progress.totalLessons || lessonCount;

              const cardClass = getCardStyle({
                isCompleted: level.isCompleted,
                isCurrentLevel: level.isCurrentLevel,
                isLocked: level.isLocked,
                hasLessons: level.hasLessons
              });

              const iconClass = getIconStyle({
                isCompleted: level.isCompleted,
                isCurrentLevel: level.isCurrentLevel,
                isLocked: level.isLocked,
                levelId: level.id
              });

              return (
                <article
                  key={level.id}
                  className={`rounded-3xl shadow-lg p-5 md:p-7 border transition-all duration-300 flex flex-col min-h-[330px] md:min-h-[390px] ${cardClass}`}
                >
                  <div className="flex items-start justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${iconClass}`}
                    >
                      {level.isCompleted ? (
                        <FaCheckCircle className="w-7 h-7 md:w-8 md:h-8" />
                      ) : level.isLocked ? (
                        <FaLock className="w-7 h-7 md:w-8 md:h-8" />
                      ) : (
                        <Icon className="w-7 h-7 md:w-8 md:h-8" />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {level.isCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                          Completed
                        </span>
                      )}

                      {level.isCurrentLevel && !level.isCompleted && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-semibold">
                          Current
                        </span>
                      )}

                      {level.isLocked && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-semibold">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 mb-2 md:mb-3">
                    Level {level.title || level.id}
                  </h2>

                  <p className="text-gray-600 leading-relaxed flex-grow">
                    {level.description ||
                      "Practice lessons, examples and exercises for this level."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-full">
                      <FaBook />
                      {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                    </span>

                    {!level.isLocked && totalLessons > 0 && (
                      <span className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-full">
                        {completedLessons}/{totalLessons} completed
                      </span>
                    )}
                  </div>

                  {!level.isLocked && totalLessons > 0 && (
                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            level.isCompleted
                              ? "bg-green-500"
                              : "bg-primary-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenLevel(level)}
                    disabled={level.isLocked || !level.hasLessons}
                    className={`w-full mt-5 md:mt-6 inline-flex items-center justify-center gap-2 font-semibold py-3 px-5 md:px-6 rounded-xl transition-colors ${
                      level.isLocked || !level.hasLessons
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : level.isCompleted
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : level.isCurrentLevel
                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                        : "bg-secondary-500 hover:bg-secondary-600 text-white"
                    }`}
                  >
                    {level.isLocked ? (
                      <>
                        <FaLock />
                        Locked
                      </>
                    ) : !level.hasLessons ? (
                      <>
                        <FaLock />
                        No lessons yet
                      </>
                    ) : level.isCompleted ? (
                      <>
                        <FaCheckCircle />
                        Review level
                        <FaArrowRight />
                      </>
                    ) : level.isCurrentLevel ? (
                      <>
                        <FaPlay />
                        Continue level
                        <FaArrowRight />
                      </>
                    ) : (
                      <>
                        <FaPlay />
                        Go to course
                        <FaArrowRight />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

export default Curso;