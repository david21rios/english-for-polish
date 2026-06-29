// src/components/nivel/LessonNavigation.jsx

const LessonNavigation = ({
  currentSectionIndex,
  totalSections,
  canAdvanceCurrentSection,
  goToPreviousSection,
  goToNextSection,
  handleNextLesson,
  currentLessonIndex,
  totalLessons,
  nextLevel
}) => {
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === totalSections - 1;
  const isLastLesson = currentLessonIndex === totalLessons - 1;

  const canAdvance = canAdvanceCurrentSection();

  return (
    <div className="mt-6 md:mt-8 pb-4">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          {!isFirstSection && (
            <button
              type="button"
              onClick={goToPreviousSection}
              className="
                w-full
                px-4
                md:px-6
                py-3
                rounded-xl
                font-semibold
                text-sm
                md:text-base
                bg-primary-600
                text-white
                hover:bg-primary-700
                transition
              "
            >
              <span className="hidden sm:inline">← Sección anterior</span>
              <span className="sm:hidden">← Sección</span>
            </button>
          )}
        </div>

        <div>
          {!isLastSection && (
            <button
              type="button"
              onClick={goToNextSection}
              disabled={!canAdvance}
              className={`
                w-full
                px-4
                md:px-6
                py-3
                rounded-xl
                font-semibold
                text-sm
                md:text-base
                transition
                ${
                  !canAdvance
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }
              `}
            >
              <span className="hidden sm:inline">Siguiente sección →</span>
              <span className="sm:hidden">Siguiente</span>
            </button>
          )}

          {isLastSection && (
            <button
              type="button"
              onClick={handleNextLesson}
              className="
                w-full
                px-4
                md:px-6
                py-3
                rounded-xl
                font-semibold
                text-sm
                md:text-base
                text-white
                bg-green-600
                hover:bg-green-700
                transition
              "
            >
              {isLastLesson
                ? nextLevel
                  ? (
                    <>
                      <span className="hidden sm:inline">
                        Ir al nivel {nextLevel} →
                      </span>
                      <span className="sm:hidden">
                        Nivel {nextLevel} →
                      </span>
                    </>
                  )
                  : "Curso completado"
                : (
                  <>
                    <span className="hidden sm:inline">
                      Siguiente lección →
                    </span>
                    <span className="sm:hidden">
                      Lección →
                    </span>
                  </>
                )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonNavigation;