// src/components/nivel/LessonProgress.jsx

const LessonProgress = ({
  currentSectionIndex = 0,
  totalSections = 0,
  currentSectionTitle = "",
  sectionProgress = 0,
  lessonCompleted = false
}) => {
  const safeProgress = Math.min(Math.max(Number(sectionProgress) || 0, 0), 100);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2 gap-3">
        <span className="break-words">
          Sekcja {currentSectionIndex + 1} z {totalSections}:{" "}
          <strong>{currentSectionTitle || "Bez tytułu"}</strong>
        </span>

        <span className="font-semibold shrink-0">{safeProgress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            lessonCompleted ? "bg-green-600" : "bg-primary-600"
          }`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      {lessonCompleted && (
        <p className="mt-2 text-xs font-semibold text-green-700">
          Lekcja ukończona.
        </p>
      )}
    </div>
  );
};

export default LessonProgress;