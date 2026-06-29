// src/components/course/LevelCard.jsx

import {
  FaArrowRight,
  FaBook,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaGraduationCap,
  FaLayerGroup,
  FaLock,
  FaPlay
} from "react-icons/fa";

const getLevelIcon = (levelId = "") => {
  if (levelId.startsWith("A")) return FaBook;
  if (levelId.startsWith("B")) return FaChalkboardTeacher;
  return FaGraduationCap;
};

const getCardStyle = ({ isCompleted, isCurrentLevel, isLocked, hasLessons }) => {
  if (isLocked) return "bg-gray-100 border-gray-200 opacity-70";
  if (isCompleted) return "bg-green-50 border-green-300 hover:shadow-xl";
  if (isCurrentLevel) {
    return "bg-white border-primary-300 ring-2 ring-primary-100 hover:shadow-xl";
  }
  if (!hasLessons) return "bg-white border-gray-200 opacity-75";
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

const LevelCard = ({ level, onOpenLevel }) => {
  const Icon = getLevelIcon(level.id);

  const moduleCount = level.totalModules || level.modules?.length || 0;
  const lessonCount = level.totalLessons || level.lessons?.length || 0;

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
      className={`rounded-3xl shadow-lg p-5 md:p-7 border transition-all duration-300 flex flex-col min-h-[360px] md:min-h-[420px] ${cardClass}`}
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
          <FaLayerGroup />
          {moduleCount} module{moduleCount === 1 ? "" : "s"}
        </span>

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
                level.isCompleted ? "bg-green-500" : "bg-primary-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenLevel(level)}
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
};

export default LevelCard;