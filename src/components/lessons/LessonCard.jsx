// src/components/lessons/LessonCard.jsx

import {
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaTrash
} from "react-icons/fa";

import AdminLessonPreview from "../admin/AdminLessonPreview";

const LessonCard = ({
  lesson,
  selectedLesson,
  getAgeGroupLabel,
  getStatusLabel,
  getModuleTitle,
  onToggleStatus,
  onEdit,
  onDelete,
  onToggleDetails
}) => {
  const lessonStatus = lesson.status || "draft";
  const isPublished = lessonStatus === "published";
  const isSelected = selectedLesson === lesson.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 break-words">
            {lesson.titulo || "Lekcja bez tytułu"}
          </h3>

          <p className="text-gray-600 text-sm break-all">ID: {lesson.id}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
              Moduł: {getModuleTitle(lesson.moduleId)}
            </span>

            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
              Kolejność: {lesson.orderInModule || "Brak"}
            </span>

            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
              {getAgeGroupLabel(lesson.ageGroup || "all")}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded ${
                isPublished
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {getStatusLabel(lessonStatus)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap lg:justify-end gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(lesson)}
            className={`px-3 py-2 rounded-md text-xs font-medium ${
              isPublished
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {isPublished ? "Przenieś do wersji roboczej" : "Opublikuj"}
          </button>

          <button
            type="button"
            onClick={() => onEdit(lesson)}
            className="p-2 text-blue-600 hover:text-blue-800"
            title="Edytuj lekcję"
            aria-label="Edytuj lekcję"
          >
            <FaEdit />
          </button>

          <button
            type="button"
            onClick={() => onDelete(lesson)}
            className="p-2 text-red-600 hover:text-red-800"
            title="Usuń lekcję"
            aria-label="Usuń lekcję"
          >
            <FaTrash />
          </button>

          <button
            type="button"
            onClick={() => onToggleDetails(lesson.id)}
            className="p-2 text-primary-600 hover:text-primary-800"
            title={isSelected ? "Ukryj szczegóły" : "Pokaż szczegóły"}
            aria-label={isSelected ? "Ukryj szczegóły lekcji" : "Pokaż szczegóły lekcji"}
            aria-expanded={isSelected}
          >
            {isSelected ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 border-t pt-4 overflow-x-auto">
          <AdminLessonPreview lesson={lesson} />
        </div>
      )}
    </div>
  );
};

export default LessonCard;