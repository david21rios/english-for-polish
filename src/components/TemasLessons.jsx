// src/components/TemasLessons.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
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

import {
  createNewThemeLessonTemplate as createNewLesson,
  cleanLessonData,
  getNextThemeLessonNumber
} from "../utils/lessonStructure";

import {
  createNewThemeLesson,
  getThemeLessonById,
  deleteThemeLesson,
  updateThemeLesson,
  getLessonsByTheme
} from "../services/firestoreService";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const AdminThemeLessons = () => {
  const navigate = useNavigate();

  const [activeTheme, setActiveTheme] = useState(null);
  const [temas, setTemas] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(createNewLesson());
  const [error, setError] = useState(null);

  const formRef = useRef(null);

  const sortThemeLessons = (lessonsToSort = []) => {
    return [...lessonsToSort].sort((a, b) => {
      const numA = parseInt((a.id || "").split("_").pop()) || 0;
      const numB = parseInt((b.id || "").split("_").pop()) || 0;
      return numA - numB;
    });
  };

  const resetEditorState = () => {
    setSelectedLesson(null);
    setIsCreating(false);
    setEditingLesson(null);
    setFormData(createNewLesson());
    setError(null);
  };

  const fetchTemas = useCallback(async () => {
    try {
      setLoadingThemes(true);
      setError(null);

      const temasSnapshot = await getDocs(collection(db, "temas"));

      const temasData = temasSnapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data()
        }))
        .sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));

      setTemas(temasData);

      if (temasData.length > 0) {
        setActiveTheme((prev) => prev || temasData[0].id);
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
      setError("Error al cargar los temas.");
    } finally {
      setLoadingThemes(false);
    }
  }, []);

  const fetchLessons = useCallback(async () => {
    if (!activeTheme) {
      setLessons([]);
      setLoadingLessons(false);
      return;
    }

    try {
      setLoadingLessons(true);
      setError(null);

      const lessonsData = await getLessonsByTheme(activeTheme);

      setLessons(sortThemeLessons(lessonsData || []));
    } catch (error) {
      console.error("Error fetching theme lessons:", error);
      setLessons([]);
      setError("Error al cargar las lecciones del tema seleccionado.");
    } finally {
      setLoadingLessons(false);
    }
  }, [activeTheme]);

  useEffect(() => {
    fetchTemas();
  }, [fetchTemas]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleThemeChange = (temaId) => {
    setActiveTheme(temaId);
    resetEditorState();
  };

  const handleStartCreate = () => {
    if (!activeTheme) {
      setError("Primero debes seleccionar un tema.");
      return;
    }

    setIsCreating(true);
    setEditingLesson(null);
    setSelectedLesson(null);
    setFormData({
      ...createNewLesson(),
      tema: activeTheme,
      status: "published",
      ageGroup: "all"
    });
    setError(null);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleCreateThemeLesson = async (lessonData) => {
    try {
      if (!activeTheme) {
        setError("Primero debes seleccionar un tema.");
        return;
      }

      setError(null);
      setLoadingLessons(true);

      const nextNumber = getNextThemeLessonNumber(lessons, activeTheme);

      const newLessonData = {
        ...lessonData,
        id: `${activeTheme}_${nextNumber}`,
        lessonId: `${activeTheme}_${nextNumber}`,
        tema: activeTheme,
        status: lessonData.status || "published",
        ageGroup: lessonData.ageGroup || "all"
      };

      await createNewThemeLesson(activeTheme, newLessonData);

      await fetchLessons();

      setIsCreating(false);
      setFormData(createNewLesson());
    } catch (error) {
      console.error("Error creating theme lesson:", error);
      setError("Error al crear la lección. Verifica los datos e intenta nuevamente.");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleEditThemeLesson = async (lesson) => {
    try {
      if (!activeTheme || !lesson?.id) {
        setError("No se pudo identificar el tema o la lección.");
        return;
      }

      setError(null);

      const fullContent = await getThemeLessonById(activeTheme, lesson.id);

      if (!fullContent) {
        setError("No se encontró el contenido completo de la lección.");
        return;
      }

      setEditingLesson(lesson);
      setIsCreating(false);
      setSelectedLesson(null);

      setFormData({
        ...createNewLesson(),
        ...fullContent,
        id: lesson.id,
        lessonId: lesson.id,
        titulo: fullContent.titulo || lesson.titulo || "",
        descripcion: fullContent.descripcion || lesson.descripcion || "",
        tema: activeTheme,
        status: fullContent.status || lesson.status || "published",
        ageGroup: fullContent.ageGroup || lesson.ageGroup || "all"
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
      console.error("Error loading theme lesson content:", error);
      setError("Error al cargar el contenido de la lección.");
    }
  };

  const handleUpdateThemeLesson = async (updatedData) => {
    try {
      if (!activeTheme) {
        setError("Primero debes seleccionar un tema.");
        return;
      }

      setError(null);
      setLoadingLessons(true);

      const cleanedData = cleanLessonData(updatedData);
      const lessonId = cleanedData.id || cleanedData.lessonId;

      if (!lessonId) {
        throw new Error("La lección no tiene un ID válido.");
      }

      const dataToUpdate = {
        ...cleanedData,
        id: lessonId,
        lessonId,
        tema: activeTheme,
        status: cleanedData.status || "published",
        ageGroup: cleanedData.ageGroup || "all"
      };

      await updateThemeLesson(activeTheme, lessonId, dataToUpdate);

      setEditingLesson(null);
      setFormData(createNewLesson());

      await fetchLessons();
    } catch (error) {
      console.error("Error updating theme lesson:", error);
      setError("Error al actualizar la lección. Por favor, intenta nuevamente.");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleDeleteThemeLesson = async (lesson) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la lección "${
        lesson.titulo || lesson.id
      }"?`
    );

    if (!confirmDelete) return;

    try {
      if (!activeTheme || !lesson?.id) {
        setError("No se pudo identificar el tema o la lección.");
        return;
      }

      setError(null);
      setLoadingLessons(true);

      await deleteThemeLesson(activeTheme, lesson.id);

      setSelectedLesson(null);
      await fetchLessons();
    } catch (error) {
      console.error("Error deleting theme lesson:", error);
      setError("Error al eliminar la lección. Por favor, intenta nuevamente.");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingLesson(null);
    setFormData(createNewLesson());
    setError(null);
  };

  const activeThemeData = temas.find((tema) => tema.id === activeTheme);

  const LessonCard = ({ lesson }) => (
    <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 break-words">
            {lesson.titulo || "Lección sin título"}
          </h3>

          <p className="text-gray-600 text-sm break-all">ID: {lesson.id}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
              Estado: {lesson.status || "published"}
            </span>

            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
              Grupo: {lesson.ageGroup || "all"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap lg:justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditThemeLesson(lesson)}
            className="p-2 text-blue-600 hover:text-blue-800"
            title="Editar lección"
          >
            <FaEdit />
          </button>

          <button
            type="button"
            onClick={() => handleDeleteThemeLesson(lesson)}
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

      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Lecciones del Tema</h1>

          <p className="text-gray-600 text-sm mt-1">
            Administra las lecciones asociadas a cada tema.
          </p>

          {activeThemeData && (
            <p className="text-sm text-gray-600 mt-2">
              Tema activo:{" "}
              <span className="font-semibold">
                {activeThemeData.icon} {activeThemeData.title}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!activeTheme}
          onClick={handleStartCreate}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${
            !activeTheme
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        >
          <FaPlus />
          <span>Nueva Lección</span>
        </button>
      </div>

      {loadingThemes ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : temas.length === 0 ? (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-xl">
          No hay temas creados. Primero crea un tema en la sección de temas.
        </div>
      ) : (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Selecciona un tema
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {temas.map((tema) => (
              <button
                key={tema.id}
                type="button"
                onClick={() => handleThemeChange(tema.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTheme === tema.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="mr-1">{tema.icon}</span>
                {tema.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {(isCreating || editingLesson) && (
        <div ref={formRef} className="mb-8 p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson ? "Editar Lección" : "Crear Nueva Lección"}
          </h2>

          <LessonForm
            isEditing={!!editingLesson}
            initialData={formData}
            onSubmit={
              editingLesson ? handleUpdateThemeLesson : handleCreateThemeLesson
            }
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {loadingLessons ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : !activeTheme ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-2xl shadow">
          Selecciona un tema para administrar sus lecciones.
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-2xl shadow">
          No hay lecciones disponibles para este tema. Crea una nueva lección.
        </div>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminThemeLessons;