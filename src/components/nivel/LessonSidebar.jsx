// src/components/nivel/LessonSidebar.jsx

import ModuleAccordion from "./ModuleAccordion";

const LessonSidebar = ({
  modules = [],
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
  if (!modules.length) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-6 text-center">
        <p className="text-gray-500">
          No modules available for this level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-x-hidden">
      {modules.map((module) => (
        <ModuleAccordion
          key={module.moduleId || module.id}
          module={module}
          currentLesson={currentLesson}
          currentSectionIndex={currentSectionIndex}
          completedSections={completedSections}
          lessonSections={lessonSections}
          sectionHasRequiredWork={sectionHasRequiredWork}
          isSectionAccessible={isSectionAccessible}
          handleLessonClick={handleLessonClick}
          handleSectionClick={handleSectionClick}
          setSidebarOpen={setSidebarOpen}
        />
      ))}
    </div>
  );
};

export default LessonSidebar;