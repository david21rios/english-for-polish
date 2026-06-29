// src/components/lessons/LessonFiltersPanel.jsx

import { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaLayerGroup
} from "react-icons/fa";

const LessonFiltersPanel = ({
  levels = [],
  modules = [],
  ageGroups = [],
  statusOptions = [],
  activeLevel,
  filterModule,
  filterAgeGroup,
  filterStatus,
  totalLessons = 0,
  filteredLessonsCount = 0,
  onLevelChange,
  onModuleChange,
  onAgeGroupChange,
  onStatusChange
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
            <FaFilter />
          </span>

          <div className="text-left">
            <h2 className="font-bold text-gray-900">
              Filtros de lecciones
            </h2>

            <p className="text-sm text-gray-600">
              Mostrando {filteredLessonsCount} de {totalLessons} lecciones · Nivel{" "}
              {activeLevel}
            </p>
          </div>
        </div>

        <span className="text-gray-500">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Nivel</p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onLevelChange(level)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    activeLevel === level
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Nivel {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Filtrar por módulo
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onModuleChange("all")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  filterModule === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todos
              </button>

              {modules.map((module) => {
                const moduleId = module.moduleId || module.id;

                return (
                  <button
                    key={moduleId}
                    type="button"
                    onClick={() => onModuleChange(moduleId)}
                    className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                      filterModule === moduleId
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span>{module.icon || "📚"}</span>
                    <span>{module.title}</span>
                  </button>
                );
              })}

              {modules.length === 0 && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-500 px-3 py-2">
                  <FaLayerGroup />
                  No hay módulos en este nivel.
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Filtrar por grupo de edad
            </p>

            <div className="flex flex-wrap gap-2">
              {ageGroups.map((group) => (
                <button
                  key={group.value}
                  type="button"
                  onClick={() => onAgeGroupChange(group.value)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    filterAgeGroup === group.value
                      ? "bg-secondary-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </p>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => onStatusChange(status.value)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    filterStatus === status.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LessonFiltersPanel;