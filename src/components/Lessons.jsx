// src/components/Lessons.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import LessonForm from "../components/forms/LessonsForm";
import LessonContent from "../components/content/LessonContent";
import { createNewLesson, cleanLessonData } from "../utils/lessonStructure";
import AIGeneratedLessonsReview from "./admin/AIGeneratedLessonsReview";
import {
  createLesson,
  getLessonContent,
  deleteLesson,
  updateLesson,
  getLessonsByLevel,
  getNextLessonNumber
} from "../services/lessonManager";

const Lessons = () => {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(createNewLesson());
  const [error, setError] = useState(null);
  const [activeLevel, setActiveLevel] = useState("A1");
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const formRef = useRef(null);

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const ageGroups = [
    { value: "all", label: "Todos" },
    { value: "kids_early", label: "Niños 5–7" },
    { value: "kids", label: "Niños 8–12" },
    { value: "teens", label: "Jóvenes 13–17" },
    { value: "adults", label: "Adultos 18+" }
  ];

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "published", label: "Publicadas" },
    { value: "draft", label: "Borradores" }
  ];

  const getAgeGroupLabel = (value) => {
    return ageGroups.find((group) => group.value === value)?.label || "Todos";
  };

  const getStatusLabel = (value) => {
    const labels = {
      published: "Publicada",
      draft: "Borrador",
      all: "Todos"
    };

    return labels[value] || "Borrador";
  };

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const lessonsData = await getLessonsByLevel(activeLevel);

      const sortedLessons = [...lessonsData].sort((a, b) => {
        const numA = parseInt((a.id || "").split("_").pop()) || 0;
        const numB = parseInt((b.id || "").split("_").pop()) || 0;
        return numA - numB;
      });

      setLessons(sortedLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setError("Error al cargar las lecciones. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [activeLevel]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const filteredLessons = lessons.filter((lesson) => {
    const lessonAgeGroup = lesson.ageGroup || "all";
    const lessonStatus = lesson.status || "published";

    const matchesAgeGroup =
      filterAgeGroup === "all" || lessonAgeGroup === filterAgeGroup;

    const matchesStatus =
      filterStatus === "all" || lessonStatus === filterStatus;

    return matchesAgeGroup && matchesStatus;
  });

  const resetFormState = () => {
    setIsCreating(false);
    setEditingLesson(null);
    setSelectedLesson(null);
    setFormData(createNewLesson());
    setError(null);
  };

  const handleCreateLesson = async (lessonData) => {
    try {
      setError(null);
      setLoading(true);

      if (!levels.includes(activeLevel)) {
        throw new Error("Nivel no válido");
      }

      const nextNumber = await getNextLessonNumber(activeLevel);

      const newLessonData = {
        ...lessonData,
        id: `${activeLevel}_${nextNumber}`,
        lessonId: `${activeLevel}_${nextNumber}`,
        nivel: activeLevel,
        level: activeLevel,
        ageGroup: lessonData.ageGroup || "all",
        status: lessonData.status || "draft"
      };

      await createLesson(newLessonData);
      await fetchLessons();

      setIsCreating(false);
      setFormData(createNewLesson());
    } catch (error) {
      console.error("Error creating lesson:", error);
      setError("Error al crear la lección. Verifica los datos e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la lección "${lesson.titulo || lesson.id}"?`
    );

    if (!confirmDelete) return;

    try {
      setError(null);
      setLoading(true);

      await deleteLesson(lesson.nivel || activeLevel, lesson.id);

      setSelectedLesson(null);
      await fetchLessons();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setError("Error al eliminar la lección. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLesson = async (lesson) => {
    try {
      setError(null);

      const lessonLevel = lesson.nivel || lesson.level || activeLevel;
      const fullContent = await getLessonContent(lessonLevel, lesson.id);

      if (!fullContent) {
        setError("No se encontró el contenido completo de la lección.");
        return;
      }

      setEditingLesson(lesson);
      setIsCreating(false);

      setFormData({
        ...createNewLesson(),
        ...fullContent,
        id: lesson.id,
        lessonId: lesson.id,
        titulo: fullContent.titulo || lesson.titulo || "",
        descripcion: fullContent.descripcion || lesson.descripcion || "",
        nivel: lessonLevel,
        level: lessonLevel,
        ageGroup: fullContent.ageGroup || lesson.ageGroup || "all",
        status: fullContent.status || lesson.status || "draft"
      });

      requestAnimationFrame(() => {
        setTimeout(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 50);
      });
    } catch (error) {
      console.error("Error loading lesson content:", error);
      setError("Error al cargar el contenido de la lección.");
    }
  };

  const handleUpdateLesson = async (updatedData) => {
    try {
      setError(null);
      setLoading(true);

      const cleanedData = cleanLessonData({
        ...updatedData,
        id: updatedData.id || updatedData.lessonId,
        lessonId: updatedData.lessonId || updatedData.id,
        nivel: updatedData.nivel || activeLevel,
        level: updatedData.level || updatedData.nivel || activeLevel,
        ageGroup: updatedData.ageGroup || "all",
        status: updatedData.status || "draft"
      });

      await updateLesson(cleanedData);

      setEditingLesson(null);
      setFormData(createNewLesson());

      await fetchLessons();
    } catch (error) {
      console.error("Error updating lesson:", error);
      setError("Error al actualizar la lección. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (lesson) => {
    try {
      setError(null);
      setLoading(true);

      const currentStatus = lesson.status || "draft";
      const newStatus = currentStatus === "published" ? "draft" : "published";

      if (newStatus === "published") {
        const confirmPublish = window.confirm(
          `¿Seguro que deseas publicar la lección "${lesson.titulo || lesson.id}"?\n\n` +
          "Antes de publicar verifica:\n" +
          "- Que el contenido sea correcto.\n" +
          "- Que los recursos y enlaces funcionen.\n" +
          "- Que la lectura, ejercicios y evaluación estén revisados."
        );
      
        if (!confirmPublish) {
          return;
        }
      }

      const lessonLevel = lesson.nivel || lesson.level || activeLevel;
      const fullContent = await getLessonContent(lessonLevel, lesson.id);

      if (!fullContent) {
        setError("No se encontró el contenido completo de la lección.");
        return;
      }

      const updatedLesson = {
        ...fullContent,
        id: lesson.id,
        lessonId: lesson.id,
        nivel: lessonLevel,
        level: lessonLevel,
        titulo: fullContent.titulo || lesson.titulo || "",
        descripcion: fullContent.descripcion || lesson.descripcion || "",
        ageGroup: fullContent.ageGroup || lesson.ageGroup || "all",
        status: newStatus
      };

      await updateLesson(updatedLesson);
      await fetchLessons();
    } catch (error) {
      console.error("Error changing lesson status:", error);
      setError("Error al cambiar el estado de la lección.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewLessonClick = () => {
    setIsCreating(true);
    setEditingLesson(null);
    setSelectedLesson(null);
    setError(null);

    setFormData({
      ...createNewLesson(),
      nivel: activeLevel,
      level: activeLevel,
      ageGroup: "all",
      status: "draft"
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleLevelChange = (level) => {
    setActiveLevel(level);
    setFilterAgeGroup("all");
    setFilterStatus("all");
    resetFormState();
  };

  const handleCancelForm = () => {
    resetFormState();
  };

  const LevelTabs = () => (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-2">Nivel</p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleLevelChange(level)}
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
  );

  const AgeGroupFilter = () => (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Filtrar por grupo de edad
      </p>

      <div className="flex flex-wrap gap-2">
        {ageGroups.map((group) => (
          <button
            key={group.value}
            type="button"
            onClick={() => setFilterAgeGroup(group.value)}
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
  );

  const StatusFilter = () => (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-2">Filtrar por estado</p>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setFilterStatus(status.value)}
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
  );

  const LessonCard = ({ lesson }) => {
    const lessonStatus = lesson.status || "draft";
    const isPublished = lessonStatus === "published";

    return (
      <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              {lesson.titulo || "Lección sin título"}
            </h3>

            <p className="text-gray-600 text-sm break-all">ID: {lesson.id}</p>

            <div className="flex flex-wrap gap-2 mt-2">
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
              onClick={() => handleToggleStatus(lesson)}
              className={`px-3 py-2 rounded-md text-xs font-medium ${
                isPublished
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isPublished ? "Pasar a borrador" : "Publicar"}
            </button>

            <button
              type="button"
              onClick={() => handleEditLesson(lesson)}
              className="p-2 text-blue-600 hover:text-blue-800"
              title="Editar lección"
            >
              <FaEdit />
            </button>

            <button
              type="button"
              onClick={() => handleDeleteLesson(lesson)}
              className="p-2 text-red-600 hover:text-red-800"
              title="Eliminar lección"
            >
              <FaTrash />
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)
              }
              className="p-2 text-primary-600 hover:text-primary-800"
              title="Ver detalles"
            >
              {selectedLesson === lesson.id ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>

        {selectedLesson === lesson.id && (
          <div className="mt-4 border-t pt-4 overflow-x-auto">
            <LessonContent lesson={lesson} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Volver al panel admin
      </button>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Lecciones</h1>
          <p className="text-gray-600 text-sm mt-1">
            Administra las lecciones por nivel, edad y estado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleNewLessonClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            <FaPlus />
            <span>Nueva Lección Manual</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/ai-lessons")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            <FaPlus />
            <span>Nueva Lección con IA</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <LevelTabs />
        <AgeGroupFilter />
        <StatusFilter />

        <div className="text-sm text-gray-600">
          Mostrando {filteredLessons.length} de {lessons.length} lecciones del
          nivel {activeLevel}
        </div>
      </div>
    
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {(isCreating || editingLesson) && (
        <div ref={formRef} className="mb-8 p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson
              ? "Editar Lección"
              : `Crear Nueva Lección - Nivel ${activeLevel}`}
          </h2>

          <LessonForm
            isEditing={!!editingLesson}
            initialData={formData}
            activeLevel={activeLevel}
            onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-2xl shadow">
          No hay lecciones disponibles para este filtro.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
      <AIGeneratedLessonsReview onPublished={fetchLessons} />
    </div>
  );
};

export default Lessons;