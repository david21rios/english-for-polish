// src/components/Lessons.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import LessonForm from "./forms/LessonsForm";
import LessonFiltersPanel from "./lessons/LessonFiltersPanel";
import ModuleLessonsGroup from "./lessons/ModuleLessonsGroup";

import {
  createLesson,
  deleteLesson,
  getLessonContent,
  getLessonsByLevel,
  getNextLessonNumber,
  getNextLessonOrderInModule,
  updateLesson
} from "../services/lessonManager";

import {
  getModulesByLevel,
  refreshModuleLessonCount
} from "../services/moduleService";

import {
  cleanLessonData,
  createNewLesson
} from "../utils/lessonStructure";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const AGE_GROUPS = [
  { value: "all", label: "Wszystkie" },
  { value: "kids_early", label: "Dzieci 5–7 lat" },
  { value: "kids", label: "Dzieci 8–12 lat" },
  { value: "teens", label: "Młodzież 13–17 lat" },
  { value: "adults", label: "Dorośli 18+" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "Wszystkie" },
  { value: "published", label: "Opublikowane" },
  { value: "draft", label: "Wersje robocze" }
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

  const getLessonTitle = (lesson) =>
    lesson?.title || lesson?.titulo || lesson?.lessonId || lesson?.id || "";

  const getLessonDescription = (lesson) =>
    lesson?.description || lesson?.descripcion || "";

  const getLessonLevel = (lesson) =>
    lesson?.level || lesson?.nivel || activeLevel;

  const getAgeGroupLabel = (value) =>
    AGE_GROUPS.find((group) => group.value === value)?.label || "Wszystkie";

  const getStatusLabel = (value) => {
    const labels = {
      published: "Opublikowana",
      draft: "Wersja robocza",
      all: "Wszystkie"
    };

    return labels[value] || "Wersja robocza";
  };

  const getModuleTitle = useCallback(
    (moduleId) => {
      if (!moduleId) return "Bez modułu";

      return (
        modules.find(
          (module) =>
            module.moduleId === moduleId || module.id === moduleId
        )?.title || moduleId
      );
    },
    [modules]
  );

  const fetchModules = useCallback(async () => {
    try {
      const modulesData = await getModulesByLevel(activeLevel, {
        includeDrafts: true
      });

      const safeModules = modulesData || [];

      setModules(safeModules);

      if (!activeModuleId && safeModules.length > 0) {
        setActiveModuleId(
          safeModules[0].moduleId || safeModules[0].id || ""
        );
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      setError("Nie udało się załadować modułów.");
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
      setError(
        "Nie udało się załadować lekcji. Spróbuj ponownie."
      );
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
        filterAgeGroup === "all" ||
        lessonAgeGroup === filterAgeGroup;

      const matchesStatus =
        filterStatus === "all" ||
        lessonStatus === filterStatus;

      const matchesModule =
        filterModule === "all" ||
        lessonModuleId === filterModule;

      return matchesAgeGroup && matchesStatus && matchesModule;
    });
  }, [
    lessons,
    filterAgeGroup,
    filterStatus,
    filterModule
  ]);

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
            title:
              moduleId === "without_module"
                ? "Bez modułu"
                : getModuleTitle(moduleId),
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

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          const numA =
            parseInt((a.id || "").split("_").pop(), 10) || 0;

          const numB =
            parseInt((b.id || "").split("_").pop(), 10) || 0;

          return numA - numB;
        })
      }))
      .filter(
        (group) =>
          filterModule === "all" || group.lessons.length > 0
      );
  }, [
    modules,
    filteredLessons,
    filterModule,
    getModuleTitle
  ]);

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
        throw new Error("Invalid level.");
      }

      if (!lessonData.moduleId) {
        throw new Error("Wybierz moduł dla lekcji.");
      }

      const nextNumber = await getNextLessonNumber(activeLevel);

      const nextOrderInModule =
        await getNextLessonOrderInModule(
          activeLevel,
          lessonData.moduleId
        );

      const lessonId =
        lessonData.lessonId ||
        lessonData.id ||
        `${activeLevel}_${nextNumber}`;

      const newLessonData = {
        ...lessonData,
        id: lessonId,
        lessonId,
        level: activeLevel,

        // Legacy compatibility during migration.
        nivel: activeLevel,

        moduleId: lessonData.moduleId,
        orderInModule:
          Number(lessonData.orderInModule) ||
          nextOrderInModule,
        ageGroup: lessonData.ageGroup || "all",
        status: lessonData.status || "draft"
      };

      await createLesson(newLessonData);

      await refreshModuleLessonCount(
        activeLevel,
        lessonData.moduleId
      );

      await fetchLessons();
      await fetchModules();

      setIsCreating(false);
      setFormData(createNewLesson());
    } catch (error) {
      console.error("Error creating lesson:", error);
      setError(error.message || "Nie udało się utworzyć lekcji.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const lessonTitle = getLessonTitle(lesson);

    const confirmDelete = window.confirm(
      `Czy na pewno chcesz usunąć lekcję „${lessonTitle}”?`
    );

    if (!confirmDelete) return;

    try {
      setError(null);
      setLoading(true);

      const lessonLevel = getLessonLevel(lesson);
      const moduleId = lesson.moduleId || "";

      await deleteLesson(
        lessonLevel,
        lesson.id || lesson.lessonId,
        moduleId
      );

      if (moduleId) {
        await refreshModuleLessonCount(
          lessonLevel,
          moduleId
        );
      }

      setSelectedLesson(null);

      await fetchLessons();
      await fetchModules();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setError(
        "Nie udało się usunąć lekcji. Spróbuj ponownie."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditLesson = async (lesson) => {
    try {
      setError(null);

      const lessonLevel = getLessonLevel(lesson);
      const lessonId = lesson.lessonId || lesson.id;
      const moduleId = lesson.moduleId || "";

      const fullContent = await getLessonContent(
        lessonLevel,
        lessonId,
        moduleId
      );
      
      if (!fullContent) {
        setError("Nie znaleziono pełnej zawartości lekcji.");
        return;
      }

      setEditingLesson(lesson);
      setIsCreating(false);

      const dataForForm = {
        ...fullContent,

        id: lessonId,
        lessonId,

        title:
          fullContent.title ||
          fullContent.titulo ||
          getLessonTitle(lesson),

        description:
          fullContent.description ||
          fullContent.descripcion ||
          getLessonDescription(lesson),

        level: lessonLevel,
        moduleId:
          fullContent.moduleId ||
          lesson.moduleId ||
          "",

        orderInModule:
          Number(fullContent.orderInModule) ||
          Number(lesson.orderInModule) ||
          1,

        ageGroup:
          fullContent.ageGroup ||
          lesson.ageGroup ||
          "all",

        status:
          fullContent.status ||
          lesson.status ||
          "draft",

        titulo:
          fullContent.titulo ||
          fullContent.title ||
          getLessonTitle(lesson),

        descripcion:
          fullContent.descripcion ||
          fullContent.description ||
          getLessonDescription(lesson),

        nivel: lessonLevel
      };


setFormData(dataForForm);

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
      setError("Nie udało się załadować zawartości lekcji.");
    }
  };

  const handleUpdateLesson = async (updatedData) => {
    try {
      setError(null);
      setLoading(true);

      if (!updatedData.moduleId) {
        throw new Error("Wybierz moduł dla lekcji.");
      }

      const lessonId =
        updatedData.lessonId || updatedData.id;

      const lessonLevel =
        updatedData.level ||
        updatedData.nivel ||
        activeLevel;

      const cleanedData = cleanLessonData({
        ...updatedData,

        id: lessonId,
        lessonId,

        level: lessonLevel,

        // Legacy compatibility during migration.
        nivel: lessonLevel,

        moduleId: updatedData.moduleId,

        orderInModule:
          Number(updatedData.orderInModule) || 1,

        ageGroup:
          updatedData.ageGroup || "all",

        status:
          updatedData.status || "draft"
      });

      await updateLesson(cleanedData);

      await refreshModuleLessonCount(
        lessonLevel,
        cleanedData.moduleId
      );

      setEditingLesson(null);
      setFormData(createNewLesson());

      await fetchLessons();
      await fetchModules();
    } catch (error) {
      console.error("Error updating lesson:", error);
      setError(
        error.message || "Nie udało się zaktualizować lekcji."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (lesson) => {
    try {
      setError(null);
      setLoading(true);

      const currentStatus = lesson.status || "draft";

      const newStatus =
        currentStatus === "published"
          ? "draft"
          : "published";

      if (newStatus === "published") {
        const confirmPublish = window.confirm(
          `Czy na pewno chcesz opublikować lekcję „${getLessonTitle(
            lesson
          )}”?\n\n` +
            "Przed publikacją sprawdź:\n" +
            "• czy treść jest poprawna,\n" +
            "• czy zasoby i linki działają,\n" +
            "• czy teksty, ćwiczenia i test zostały sprawdzone."
        );

        if (!confirmPublish) return;
      }

      const lessonLevel = getLessonLevel(lesson);
      const lessonId = lesson.lessonId || lesson.id;
      const moduleId = lesson.moduleId || "";

      const fullContent = await getLessonContent(
        lessonLevel,
        lessonId,
        moduleId
      );
      
      if (!fullContent) {
        setError("Nie znaleziono pełnej zawartości lekcji.");
        return;
      }

      await updateLesson({
        ...fullContent,

        id: lessonId,
        lessonId,

        level: lessonLevel,

        // Legacy compatibility during migration.
        nivel: lessonLevel,

        moduleId,

        title:
          fullContent.title ||
          fullContent.titulo ||
          getLessonTitle(lesson),

        description:
          fullContent.description ||
          fullContent.descripcion ||
          getLessonDescription(lesson),

        ageGroup:
          fullContent.ageGroup ||
          lesson.ageGroup ||
          "all",

        status: newStatus
      });

      if (moduleId) {
        await refreshModuleLessonCount(
          lessonLevel,
          moduleId
        );
      }

      await fetchLessons();
      await fetchModules();
    } catch (error) {
      console.error("Error changing lesson status:", error);
      setError("Nie udało się zmienić statusu lekcji.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewLessonClick = async () => {
    try {
      setEditingLesson(null);
      setSelectedLesson(null);
      setError(null);

      if (!modules.length) {
        setError(
          "Najpierw utwórz co najmniej jeden moduł dla tego poziomu."
        );
        return;
      }

      const selectedModuleId =
        activeModuleId ||
        modules[0]?.moduleId ||
        modules[0]?.id ||
        "";

      const nextNumber =
        await getNextLessonNumber(activeLevel);

      const nextOrderInModule =
        await getNextLessonOrderInModule(
          activeLevel,
          selectedModuleId
        );

      const lessonId = `${activeLevel}_${nextNumber}`;

      setFormData({
        ...createNewLesson(),

        id: lessonId,
        lessonId,

        level: activeLevel,

        // Legacy compatibility during migration.
        nivel: activeLevel,

        moduleId: selectedModuleId,
        orderInModule: nextOrderInModule,
        ageGroup: "all",
        status: "draft"
      });

      setIsCreating(true);

      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 0);
    } catch (error) {
      console.error("Error preparing new lesson:", error);
      setError(
        "Nie udało się przygotować formularza nowej lekcji."
      );
    }
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
    setSelectedLesson((previousLessonId) =>
      previousLessonId === lessonId
        ? null
        : lessonId
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
        Wróć do panelu administratora
      </button>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Zarządzanie lekcjami
          </h1>

          <p className="text-gray-600 text-sm mt-1">
            Zarządzaj lekcjami według poziomu, modułu,
            grupy wiekowej i statusu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleNewLessonClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            <FaPlus />
            <span>Nowa lekcja ręczna</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/ai-lessons")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            <FaPlus />
            <span>Nowa lekcja z AI</span>
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
        <div
          ref={formRef}
          className="mb-8 p-4 bg-white rounded-2xl shadow"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson
              ? "Edytuj lekcję"
              : `Utwórz nową lekcję — poziom ${activeLevel}`}
          </h2>

          <LessonForm
            key={formData.id || "new-lesson"}
            isEditing={Boolean(editingLesson)}
            initialData={formData}
            activeLevel={activeLevel}
            modules={modules}
            onSubmit={
              editingLesson
                ? handleUpdateLesson
                : handleCreateLesson
            }
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
          Brak lekcji spełniających wybrane kryteria.
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
    </div>
  );
};

export default Lessons;