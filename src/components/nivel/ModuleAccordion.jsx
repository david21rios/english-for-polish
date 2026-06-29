// src/components/nivel/ModuleAccordion.jsx

import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaLayerGroup } from "react-icons/fa";
import LessonSidebarItem from "./LessonSidebarItem";

const ModuleAccordion = ({
  module,
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
  const lessons = module?.lessons || [];
  const moduleId = module?.moduleId || module?.id || "";
  const moduleTitle = module?.title || "Untitled module";
  const moduleIcon = module?.icon || "📚";

  const hasCurrentLesson = lessons.some(
    (lesson) => lesson.id === currentLesson?.id
  );

  const [isOpen, setIsOpen] = useState(hasCurrentLesson || true);

  return (
    <section className="mb-3 border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            {moduleIcon || <FaLayerGroup />}
          </span>

          <div className="text-left min-w-0">
            <p className="text-xs text-primary-600 font-semibold uppercase">
              Module
            </p>

            <h3 className="font-semibold text-gray-900 truncate">
              {moduleTitle}
            </h3>

            <p className="text-xs text-gray-500">
              {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <span className="text-gray-500 shrink-0">
          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
        </span>
      </button>

      {isOpen && (
        <div className="p-2 space-y-2">
          {lessons.length === 0 ? (
            <div className="text-sm text-gray-500 px-3 py-3 bg-gray-50 rounded-xl">
              This module has no available lessons.
            </div>
          ) : (
            lessons.map((lesson) => (
              <LessonSidebarItem
                key={lesson.id}
                lesson={lesson}
                moduleId={moduleId}
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
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default ModuleAccordion;