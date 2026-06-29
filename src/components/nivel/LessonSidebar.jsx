// src/components/nivel/LessonSidebar.jsx

const LessonSidebar = ({
  lessons,
  currentLesson,
  currentSectionIndex,
  completedSections,
  lessonSections,
  sectionHasRequiredWork,
  isSectionAccessible,
  handleLessonClick,
  handleSectionClick,
  setSidebarOpen
}) => {
  const renderLessonMenu = (closeMobile = false) => {
    return lessons.map((lesson) => {
      const isCurrentLesson = currentLesson?.id === lesson.id;

      return (
        <div
          key={lesson.id}
          className="mb-2"
        >
          {/* LECCIÓN */}
          <button
            type="button"
            onClick={() => {
              handleLessonClick(lesson.id);

              if (closeMobile) {
                setSidebarOpen(false);
              }
            }}
            className={`
              w-full
              text-left
              px-3
              py-3
              rounded-xl
              transition-all
              duration-200
              break-words
              min-w-0
              ${
                isCurrentLesson
                  ? "bg-primary-100 text-primary-700 font-semibold shadow-sm border border-primary-200"
                  : "hover:bg-gray-100 text-gray-700"
              }
            `}
          >
            <span className="block text-sm leading-5 break-words">
              {lesson.title || lesson.titulo}
            </span>
          </button>

          {/* SECCIONES */}
          {isCurrentLesson && (
            <div className="ml-3 mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
              {lessonSections.map((section, index) => {
                const isCurrentSection =
                  currentSectionIndex === index;

                const isCompleted =
                  completedSections.includes(section.id);

                const isAccessible =
                  isSectionAccessible(index);

                const isLocked = !isAccessible;

                const requiresWork =
                  sectionHasRequiredWork(section.id);

                return (
                  <button
                    key={section.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        handleSectionClick(index);

                        if (closeMobile) {
                          setSidebarOpen(false);
                        }
                      }
                    }}
                    className={`
                      w-full
                      text-left
                      px-3
                      py-3
                      rounded-lg
                      text-sm
                      transition-all
                      duration-200
                      flex
                      items-start
                      gap-2
                      break-words
                      min-w-0
                      ${
                        isCurrentSection
                          ? "bg-primary-600 text-white font-semibold shadow"
                          : isCompleted
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : isLocked
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : requiresWork
                          ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    <span className="shrink-0 mt-0.5">
                      {isCompleted
                        ? "✅"
                        : isCurrentSection
                        ? "▶"
                        : isLocked
                        ? "🔒"
                        : requiresWork
                        ? "📝"
                        : "○"}
                    </span>

                    <span className="flex-1 break-words leading-5">
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full overflow-x-hidden">
      {renderLessonMenu(true)}
    </div>
  );
};

export default LessonSidebar;