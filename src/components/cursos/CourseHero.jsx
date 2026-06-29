// src/components/course/CourseHero.jsx

import { FaGraduationCap, FaLayerGroup } from "react-icons/fa";

const CourseHero = ({ currentLevel, userAgeGroup, levelOrder = [] }) => {
  const getLevelIndex = (levelId = "") => {
    const cleanLevel = levelId?.split("-")?.[0] || levelId;
    const index = levelOrder.indexOf(cleanLevel);
    return index === -1 ? 0 : index;
  };

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-10 mb-6 md:mb-10">
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
        <div>
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Course path
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-gray-900 mt-2 md:mt-3 mb-4 md:mb-5 leading-tight">
            Start learning English by level
          </h1>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Courses are organized by CEFR levels and academic modules, designed
            for Polish students learning English progressively.
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
          {levelOrder.map((level) => {
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
  );
};

export default CourseHero;