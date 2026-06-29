// src/components/nivel/LessonProgress.jsx

const LessonProgress = ({
  currentSectionIndex,
  totalSections,
  currentSectionTitle,
  sectionProgress
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>
          Sección {currentSectionIndex + 1} de {totalSections}:{" "}
          <strong>{currentSectionTitle}</strong>
        </span>

        <span>{sectionProgress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${sectionProgress}%` }}
        />
      </div>
    </div>
  );
};

export default LessonProgress;