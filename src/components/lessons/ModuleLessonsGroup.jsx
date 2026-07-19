// src/components/lessons/ModuleLessonsGroup.jsx

import { FaBookOpen, FaLayerGroup } from "react-icons/fa";
import LessonCard from "./LessonCard";

const ModuleLessonsGroup = ({
  module,
  lessons = [],
  selectedLesson,
  getAgeGroupLabel,
  getStatusLabel,
  getModuleTitle,
  onToggleStatus,
  onEdit,
  onDelete,
  onToggleDetails
}) => {
  const moduleId = module?.moduleId || module?.id || "without_module";
  const moduleTitle = module?.title || "Bez modułu";
  const moduleIcon = module?.icon || "📚";

  const publishedCount = lessons.filter(
    (lesson) => lesson.status === "published"
  ).length;

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <header className="bg-gray-50 border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl shrink-0">
              {moduleIcon}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 flex items-center gap-2">
                <FaLayerGroup />
                Moduł
              </p>

              <h2 className="text-xl font-bold text-gray-900 break-words">
                {moduleTitle}
              </h2>

              <p className="text-xs text-gray-500 break-all">
                ID: {moduleId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-full">
              <FaBookOpen />
              {lessons.length}{" "}
              {lessons.length === 1
                ? "lekcja"
                : lessons.length >= 2 && lessons.length <= 4
                  ? "lekcje"
                  : "lekcji"}
            </span>

            <span className="inline-flex items-center gap-2 text-sm bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-full">
              {publishedCount}{" "}
              {publishedCount === 1
                ? "opublikowana"
                : publishedCount >= 2 && publishedCount <= 4
                  ? "opublikowane"
                  : "opublikowanych"}
            </span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {lessons.length === 0 ? (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            Ten moduł nie zawiera jeszcze żadnych lekcji.
          </div>
        ) : (
          lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              selectedLesson={selectedLesson}
              getAgeGroupLabel={getAgeGroupLabel}
              getStatusLabel={getStatusLabel}
              getModuleTitle={getModuleTitle}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleDetails={onToggleDetails}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default ModuleLessonsGroup;