// src/components/Lessons.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import LessonForm from "../components/forms/LessonsForm";
import { createNewLesson, cleanLessonData } from "../utils/lessonStructure";
import AIGeneratedLessonsReview from "./admin/AIGeneratedLessonsReview";

import LessonFiltersPanel from "./lessons/LessonFiltersPanel";
import ModuleLessonsGroup from "./lessons/ModuleLessonsGroup";

import {
  createLesson,
  getLessonContent,
  deleteLesson,
  updateLesson,
  getLessonsByLevel,
  getNextLessonNumber,
  getNextLessonOrderInModule
} from "../services/lessonManager";

import {
  getModulesByLevel,
  refreshModuleLessonCount
} from "../services/moduleService";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const AGE_GROUPS = [
  { value: "all", label: "Todos" },
  { value: "kids_early", label: "Niños 5–7" },
  { value: "kids", label: "Niños 8–12" },
  { value: "teens", label: "Jóvenes 13–17" },
  { value: "adults", label: "Adultos 18+" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Borradores" }
];

const Lessons = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(createNewLesson());

  const [error, setError] = useState(null);
  const [activeLevel, setActiveLevel] = useState("A1");
  const [activeModuleId, setActiveModuleId] = useState("");

  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");

  const getAgeGroupLabel = (value) =>
    AGE_GROUPS.find((group) => group.value === value)?.label || "Todos";

  const getStatusLabel = (value) => {
    const labels = {
      published: "Publicada",
      draft: "Borrador",
      all: "Todos"
    };

    return labels[value] || "Borrador";
  };

  const getModuleTitle = (moduleId) => {
    if (!moduleId) return "Sin módulo";

    return (
      modules.find(
        (module) => module.moduleId === moduleId || module.id === moduleId
      )?.title || moduleId
    );
  };

  const fetchModules = useCallback(async () => {
    try {
      const modulesData = await getModulesByLevel(activeLevel, {
        includeDrafts: true
      });

      setModules(modulesData || []);

      if (!activeModuleId && modulesData?.length > 0) {
        setActiveModuleId(modulesData[0].moduleId || modulesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      setError("Error al cargar los módulos.");
    }
  }, [activeLevel, activeModuleId]);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const lessonsData = await getLessonsByLevel(activeLevel);

      setLessons(lessonsData || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setError("Error al cargar las lecciones. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [activeLevel]);

  useEffect(() => {
    fetchModules();
    fetchLessons();
  }, [fetchModules, fetchLessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const lessonAgeGroup = lesson.ageGroup || "all";
      const lessonStatus = lesson.status || "published";
      const lessonModuleId = lesson.moduleId || "";

      const matchesAgeGroup =
        filterAgeGroup === "all" || lessonAgeGroup === filterAgeGroup;

      const matchesStatus =
        filterStatus === "all" || lessonStatus === filterStatus;

      const matchesModule =
        filterModule === "all" || lessonModuleId === filterModule;

      return matchesAgeGroup && matchesStatus && matchesModule;
    });
  }, [lessons, filterAgeGroup, filterStatus, filterModule]);

  const lessonsByModule = useMemo(() => {
    const grouped = new Map();

    modules.forEach((module) => {
      const moduleId = module.moduleId || module.id;
      grouped.set(moduleId, {
        module,
        lessons: []
      });
    });

    filteredLessons.forEach((lesson) => {
      const moduleId = lesson.moduleId || "without_module";

      if (!grouped.has(moduleId)) {
        grouped.set(moduleId, {
          module: {
            id: moduleId,
            moduleId,
            title: moduleId === "without_module" ? "Sin módulo" : getModuleTitle(moduleId),
            icon: "📚"
          },
          lessons: []
        });
      }

      grouped.get(moduleId).lessons.push(lesson);
    });

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        lessons: [...group.lessons].sort((a, b) => {
          const orderA = Number(a.orderInModule) || 999;
          const orderB = Number(b.orderInModule) || 999;

          if (orderA !== orderB) return orderA - orderB;

          const numA = parseInt((a.id || "").split("_").pop()) || 0;
          const numB = parseInt((b.id || "").split("_").pop()) || 0;

          return numA - numB;
        })
      }))
      .filter((group) => filterModule === "all" || group.lessons.length > 0);
  }, [modules, filteredLessons, filterModule]);

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

      if (!LEVELS.includes(activeLevel)) {
        throw new Error("Nivel no válido.");
      }

      if (!lessonData.moduleId) {
        throw new Error("Debes seleccionar un módulo para la lección.");
      }

      const nextNumber = await getNextLessonNumber(activeLevel);
      const nextOrderInModule = await getNextLessonOrderInModule(
        activeLevel,
        lessonData.moduleId
      );

      const newLessonData = {
        ...lessonData,
        id: lessonData.id || `${activeLevel}_${nextNumber}`,
        lessonId: lessonData.lessonId || lessonData.id || `${activeLevel}_${nextNumber}`,
        nivel: activeLevel,
        level: activeLevel,
        moduleId: lessonData.moduleId,
        orderInModule: lessonData.orderInModule || nextOrderInModule,
        ageGroup: lessonData.ageGroup || "all",
        status: lessonData.status || "draft"
      };

      await createLesson(newLessonData);
      await refreshModuleLessonCount(activeLevel, lessonData.moduleId);

      await fetchLessons();
      await fetchModules();

      setIsCreating(false);
      setFormData(createNewLesson());
    } catch (error) {
      console.error("Error creating lesson:", error);
      setError(error.message || "Error al crear la lección.");
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

      const lessonLevel = lesson.nivel || lesson.level || activeLevel;
      const moduleId = lesson.moduleId || "";

      await deleteLesson(lessonLevel, lesson.id, moduleId);

      if (moduleId) {
        await refreshModuleLessonCount(lessonLevel, moduleId);
      }

      setSelectedLesson(null);

      await fetchLessons();
      await fetchModules();
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
      const moduleId = lesson.moduleId || "";

      const fullContent = await getLessonContent(
        lessonLevel,
        lesson.id,
        moduleId
      );

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
        moduleId: fullContent.moduleId || lesson.moduleId || "",
        orderInModule: fullContent.orderInModule || lesson.orderInModule || 1,
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

      if (!updatedData.moduleId) {
        throw new Error("Debes seleccionar un módulo para la lección.");
      }

      const cleanedData = cleanLessonData({
        ...updatedData,
        id: updatedData.id || updatedData.lessonId,
        lessonId: updatedData.lessonId || updatedData.id,
        nivel: updatedData.nivel || activeLevel,
        level: updatedData.level || updatedData.nivel || activeLevel,
        moduleId: updatedData.moduleId,
        orderInModule: Number(updatedData.orderInModule) || 1,
        ageGroup: updatedData.ageGroup || "all",
        status: updatedData.status || "draft"
      });

      await updateLesson(cleanedData);
      await refreshModuleLessonCount(cleanedData.nivel, cleanedData.moduleId);

      setEditingLesson(null);
      setFormData(createNewLesson());

      await fetchLessons();
      await fetchModules();
    } catch (error) {
      console.error("Error updating lesson:", error);
      setError(error.message || "Error al actualizar la lección.");
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

        if (!confirmPublish) return;
      }

      const lessonLevel = lesson.nivel || lesson.level || activeLevel;
      const moduleId = lesson.moduleId || "";

      const fullContent = await getLessonContent(
        lessonLevel,
        lesson.id,
        moduleId
      );

      if (!fullContent) {
        setError("No se encontró el contenido completo de la lección.");
        return;
      }

      await updateLesson({
        ...fullContent,
        id: lesson.id,
        lessonId: lesson.id,
        nivel: lessonLevel,
        level: lessonLevel,
        moduleId,
        titulo: fullContent.titulo || lesson.titulo || "",
        descripcion: fullContent.descripcion || lesson.descripcion || "",
        ageGroup: fullContent.ageGroup || lesson.ageGroup || "all",
        status: newStatus
      });

      if (moduleId) {
        await refreshModuleLessonCount(lessonLevel, moduleId);
      }

      await fetchLessons();
      await fetchModules();
    } catch (error) {
      console.error("Error changing lesson status:", error);
      setError("Error al cambiar el estado de la lección.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewLessonClick = async () => {
    setEditingLesson(null);
    setSelectedLesson(null);
    setError(null);

    if (!modules.length) {
      setError(
        "Primero debes crear al menos un módulo para este nivel antes de crear lecciones."
      );
      return;
    }

    const selectedModuleId =
      activeModuleId || modules[0]?.moduleId || modules[0]?.id || "";

    const nextNumber = await getNextLessonNumber(activeLevel);

    const nextOrderInModule = await getNextLessonOrderInModule(
      activeLevel,
      selectedModuleId
    );

    setFormData({
      ...createNewLesson(),
      id: `${activeLevel}_${nextNumber}`,
      lessonId: `${activeLevel}_${nextNumber}`,
      nivel: activeLevel,
      level: activeLevel,
      moduleId: selectedModuleId,
      orderInModule: nextOrderInModule,
      ageGroup: "all",
      status: "draft"
    });

    setIsCreating(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleLevelChange = (level) => {
    setActiveLevel(level);
    setActiveModuleId("");
    setFilterModule("all");
    setFilterAgeGroup("all");
    setFilterStatus("all");
    resetFormState();
  };

  const handleModuleFilterChange = (moduleId) => {
    setFilterModule(moduleId);

    if (moduleId !== "all") {
      setActiveModuleId(moduleId);
    }
  };

  const handleToggleDetails = (lessonId) => {
    setSelectedLesson((prev) => (prev === lessonId ? null : lessonId));
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
            Administra las lecciones por nivel, módulo, edad y estado.
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

      <LessonFiltersPanel
        levels={LEVELS}
        modules={modules}
        ageGroups={AGE_GROUPS}
        statusOptions={STATUS_OPTIONS}
        activeLevel={activeLevel}
        filterModule={filterModule}
        filterAgeGroup={filterAgeGroup}
        filterStatus={filterStatus}
        totalLessons={lessons.length}
        filteredLessonsCount={filteredLessons.length}
        onLevelChange={handleLevelChange}
        onModuleChange={handleModuleFilterChange}
        onAgeGroupChange={setFilterAgeGroup}
        onStatusChange={setFilterStatus}
      />

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
            key={formData.id || "new-lesson"}
            isEditing={!!editingLesson}
            initialData={formData}
            activeLevel={activeLevel}
            modules={modules}
            onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
            onCancel={resetFormState}
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
        <div className="space-y-6">
          {lessonsByModule.map((group) => (
            <ModuleLessonsGroup
              key={group.module.moduleId || group.module.id}
              module={group.module}
              lessons={group.lessons}
              selectedLesson={selectedLesson}
              getAgeGroupLabel={getAgeGroupLabel}
              getStatusLabel={getStatusLabel}
              getModuleTitle={getModuleTitle}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditLesson}
              onDelete={handleDeleteLesson}
              onToggleDetails={handleToggleDetails}
            />
          ))}
        </div>
      )}

      <AIGeneratedLessonsReview onPublished={fetchLessons} />
    </div>
  );
};

export default Lessons;