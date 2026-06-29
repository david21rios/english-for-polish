// src/pages/Nivel.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getLessonsByLevel, getLessonContent } from "../services/lessonManager";
import {
  getLessonProgress,
  saveLessonProgress,
  markLessonAsCompleted
} from "../services/progressService";
import { auth, db } from "../firebase";

import LessonProgress from "../components/nivel/LessonProgress";
import LessonSidebar from "../components/nivel/LessonSidebar";
import LessonNavigation from "../components/nivel/LessonNavigation";
import LessonSectionRenderer from "../components/nivel/LessonSectionRenderer";

const lessonSections = [
  { id: "intro", title: "Introducción" },
  { id: "vocabulary", title: "Vocabulario" },
  { id: "grammar", title: "Gramática" },
  { id: "reading", title: "Lectura" },
  { id: "practice", title: "Práctica Interactiva" },
  { id: "writing", title: "Producción Escrita" },
  { id: "speaking", title: "Producción Oral" },
  { id: "evaluation", title: "Evaluación" },
  { id: "resources", title: "Recursos" },
  { id: "reflection", title: "Cierre" }
];

const sortLessons = (lessonsToSort = []) => {
  return [...lessonsToSort].sort((a, b) => {
    const numA = parseInt((a.id || "").split("_")[1], 10) || 0;
    const numB = parseInt((b.id || "").split("_")[1], 10) || 0;
    return numA - numB;
  });
};

const filterPublishedLessonsByAgeGroup = (lessonsToFilter = [], userAgeGroup) => {
  return lessonsToFilter.filter((lesson) => {
    const lessonAgeGroup = lesson.ageGroup || "all";
    const lessonStatus = lesson.status || "draft";
    const isPublished = lessonStatus === "published";

    const matchesAgeGroup = !userAgeGroup
      ? lessonAgeGroup === "all"
      : lessonAgeGroup === userAgeGroup || lessonAgeGroup === "all";

    return isPublished && matchesAgeGroup;
  });
};

const processExercises = (ejercicios) => {
  if (!Array.isArray(ejercicios)) return [];

  return ejercicios.filter(Boolean).map((ejercicio) => {
    const tipo =
      ejercicio.tipo?.toLowerCase() ||
      ejercicio.type?.toLowerCase() ||
      "seleccion_multiple";

    return {
      ...ejercicio,
      tipo,
      pregunta: ejercicio.pregunta || ejercicio.question || "",
      instrucciones: ejercicio.instrucciones || "",
      opciones: ejercicio.opciones || ejercicio.options || [],
      respuesta_correcta:
        ejercicio.respuesta_correcta ||
        ejercicio.answer ||
        ejercicio.correctAnswer ||
        "",
      respuestas: ejercicio.respuestas || ejercicio.respuestas_correctas || {},
      respuestas_correctas:
        ejercicio.respuestas_correctas || ejercicio.respuestas || {},
      respuestas_aceptadas: ejercicio.respuestas_aceptadas || {},
      elementos: ejercicio.elementos || ejercicio.items || [],
      orden_correcto: ejercicio.orden_correcto || ejercicio.correctOrder || [],
      pares_izquierda:
        ejercicio.pares_izquierda ||
        ejercicio.elementos_izquierda ||
        ejercicio.leftItems ||
        [],
      pares_derecha:
        ejercicio.pares_derecha ||
        ejercicio.elementos_derecha ||
        ejercicio.rightItems ||
        [],
      pares_correctos: ejercicio.pares_correctos || {}
    };
  });
};

const buildLessonDetails = (baseLesson, lessonContent) => {
  if (!lessonContent) return baseLesson;

  const practiceExercises = processExercises(
    lessonContent.practica_interactiva?.ejercicios
  );

  return {
    ...baseLesson,
    ...lessonContent,

    contenidos: {
      vocabulario: lessonContent.contenidos?.vocabulario || {},
      gramatica: lessonContent.contenidos?.gramatica || {
        temas: [],
        reglas: []
      }
    },

    lectura: lessonContent.lectura || {
      titulo: "",
      autor: "",
      contenido: "",
      preguntas: []
    },

    practica_interactiva: {
      titulo:
        lessonContent.practica_interactiva?.titulo || "Práctica Interactiva",
      descripcion: lessonContent.practica_interactiva?.descripcion || "",
      ejercicios: practiceExercises
    },

    produccion_escrita: {
      titulo: lessonContent.produccion_escrita?.titulo || "",
      descripcion: lessonContent.produccion_escrita?.descripcion || "",
      ejercicios: lessonContent.produccion_escrita?.ejercicios || []
    },

    produccion_oral: {
      titulo: lessonContent.produccion_oral?.titulo || "",
      descripcion: lessonContent.produccion_oral?.descripcion || "",
      ejercicios: lessonContent.produccion_oral?.ejercicios || []
    },

    evaluacion: {
      autoevaluacion: lessonContent.evaluacion?.autoevaluacion || "",
      cuestionario: lessonContent.evaluacion?.cuestionario || []
    },

    recursos_adicionales: lessonContent.recursos_adicionales || [],
    reflexion_final: lessonContent.reflexion_final || ""
  };
};

const Nivel = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUserProfile, setLoadingUserProfile] = useState(true);
  const [error, setError] = useState(null);
  const [ageGroup, setAgeGroup] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [userId, setUserId] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);

  const currentSection = lessonSections[currentSectionIndex];

  const sectionHasRequiredWork = useCallback(
    (sectionId) => {
      if (!lessonDetails) return false;

      if (sectionId === "practice") {
        return lessonDetails.practica_interactiva?.ejercicios?.length > 0;
      }

      if (sectionId === "writing") {
        return lessonDetails.produccion_escrita?.ejercicios?.length > 0;
      }

      if (sectionId === "speaking") {
        return lessonDetails.produccion_oral?.ejercicios?.length > 0;
      }

      if (sectionId === "evaluation") {
        return lessonDetails.evaluacion?.cuestionario?.length > 0;
      }

      return false;
    },
    [lessonDetails]
  );

  const canAdvanceCurrentSection = useCallback(() => {
    if (!currentSection) return false;

    const sectionId = currentSection.id;

    if (!sectionHasRequiredWork(sectionId)) {
      return true;
    }

    return completedSections.includes(sectionId);
  }, [currentSection, sectionHasRequiredWork, completedSections]);

  const loadLessonDetails = useCallback(
    async (lesson) => {
      const lessonContent = await getLessonContent(levelId, lesson.id);
      return lessonContent ? buildLessonDetails(lesson, lessonContent) : lesson;
    },
    [levelId]
  );

  const markSectionCompleted = useCallback(
    async (sectionId) => {
      if (!currentLesson || !sectionId) return;

      if (completedSections.includes(sectionId)) {
        return;
      }

      const updatedCompletedSections = Array.from(
        new Set([...completedSections, sectionId])
      );

      setCompletedSections(updatedCompletedSections);

      try {
        if (userId) {
          await saveLessonProgress({
            userId,
            levelId,
            lessonId: currentLesson.id,
            currentSectionIndex,
            completedSections: updatedCompletedSections,
            totalSections: lessonSections.length,
            completed: currentSectionIndex === lessonSections.length - 1
          });
        }
      } catch (err) {
        console.error("Error marking section as completed:", err);
      }
    },
    [currentLesson, completedSections, userId, levelId, currentSectionIndex]
  );

  useEffect(() => {
    const loadUserAgeGroup = async () => {
      try {
        setLoadingUserProfile(true);

        const user = auth.currentUser;
        setUserId(user?.uid || null);

        if (!user) {
          setAgeGroup(null);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        setAgeGroup(userSnap.exists() ? userSnap.data().ageGroup || null : null);
      } catch (err) {
        console.error("Error loading user ageGroup:", err);
        setAgeGroup(null);
      } finally {
        setLoadingUserProfile(false);
      }
    };

    loadUserAgeGroup();
  }, []);

  const fetchLessons = useCallback(async () => {
    if (loadingUserProfile) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentLesson(null);
      setLessonDetails(null);

      const levelLessons = await getLessonsByLevel(levelId);

      const filteredLessons = filterPublishedLessonsByAgeGroup(
        levelLessons,
        ageGroup
      );

      if (!filteredLessons.length) {
        throw new Error("No se encontraron lecciones publicadas para este nivel.");
      }

      const sortedLessons = sortLessons(filteredLessons);
      setLessons(sortedLessons);

      const requestedLessonId = location.state?.lessonId;

      const lessonToOpen =
        sortedLessons.find((lesson) => lesson.id === requestedLessonId) ||
        sortedLessons[0];

      setCurrentLesson(lessonToOpen);

      const savedProgress = await getLessonProgress(
        auth.currentUser?.uid,
        levelId,
        lessonToOpen.id
      );

      const requestedSection = location.state?.sectionIndex;

      const safeSectionIndex =
        Number.isInteger(
          savedProgress?.currentSectionIndex
        )
          ? savedProgress.currentSectionIndex
          : 0;
      
      const safeCompletedSections =
        Array.isArray(
          savedProgress?.completedSections
        )
          ? savedProgress.completedSections
          : [];
      
      setCurrentSectionIndex(
        requestedSection ?? safeSectionIndex
      );

      setCompletedSections(
        safeCompletedSections
      );

      const details = await loadLessonDetails(lessonToOpen);
      setLessonDetails(details);
    } catch (err) {
      console.error("Error en fetchLessons:", err);
      setError("No hay lecciones publicadas disponibles para este nivel y perfil.");
    } finally {
      setLoading(false);
    }
  }, [levelId, ageGroup, loadingUserProfile, loadLessonDetails, location.state]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleLessonClick = useCallback(
    async (lessonId) => {
      try {
        setError(null);

        const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);

        if (!selectedLesson) {
          throw new Error("Lección no encontrada");
        }

        setCurrentLesson(selectedLesson);

        const savedProgress = await getLessonProgress(
          auth.currentUser?.uid,
          levelId,
          lessonId
        );

        const safeSectionIndex =
          Number.isInteger(savedProgress?.currentSectionIndex)
            ? savedProgress.currentSectionIndex
            : 0;

        const safeCompletedSections =
          Array.isArray(savedProgress?.completedSections)
            ? savedProgress.completedSections
            : [];

        setCurrentSectionIndex(safeSectionIndex);
        setCompletedSections(safeCompletedSections);

        const details = await loadLessonDetails(selectedLesson);
        setLessonDetails(details);

        setSidebarOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Error al cambiar de lección:", err);
        setError(err.message);
      }
    },
    [lessons, levelId, loadLessonDetails]
  );

  const isSectionAccessible = useCallback(
    (index) => {
      if (index === 0) return true;
      if (index <= currentSectionIndex) return true;

      const previousSection = lessonSections[index - 1];

      if (!previousSection) return false;

      if (!sectionHasRequiredWork(previousSection.id)) {
        return index <= currentSectionIndex + 1;
      }

      return completedSections.includes(previousSection.id);
    },
    [currentSectionIndex, completedSections, sectionHasRequiredWork]
  );

  const handleSectionClick = async (index) => {
    if (!currentLesson || !isSectionAccessible(index)) return;

    setCurrentSectionIndex(index);

    try {
      if (userId) {
        await saveLessonProgress({
          userId,
          levelId,
          lessonId: currentLesson.id,
          currentSectionIndex: index,
          completedSections,
          totalSections: lessonSections.length,
          completed: index === lessonSections.length - 1
        });
      }
    } catch (err) {
      console.error("Error saving section navigation:", err);
    }

    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getNextLevel = (currentLevel) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const handleNextLesson = async () => {
    if (!currentLesson) return;

    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === currentLesson.id
    );

    try {
      if (userId) {
        await markLessonAsCompleted({
          userId,
          levelId,
          lessonId: currentLesson.id,
          completedSections: lessonSections.map((section) => section.id),
          totalSections: lessonSections.length
        });
      }
    } catch (err) {
      console.error("Error marking lesson as completed:", err);
    }

    if (currentIndex < lessons.length - 1) {
      handleLessonClick(lessons[currentIndex + 1].id);
      return;
    }

    const nextLevel = getNextLevel(levelId);

    if (nextLevel) {
      navigate(`/curso/${nextLevel}`);
    }
  };

  const handlePreviousLesson = () => {
    if (!currentLesson) return;

    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === currentLesson.id
    );

    if (currentIndex > 0) {
      handleLessonClick(lessons[currentIndex - 1].id);
    }
  };

  const goToNextSection = async () => {
    if (!currentLesson || !canAdvanceCurrentSection()) return;

    const currentSectionId = lessonSections[currentSectionIndex]?.id;

    const updatedCompletedSections = Array.from(
      new Set([...completedSections, currentSectionId])
    );

    const nextIndex =
      currentSectionIndex < lessonSections.length - 1
        ? currentSectionIndex + 1
        : currentSectionIndex;

    setCompletedSections(updatedCompletedSections);
    setCurrentSectionIndex(nextIndex);

    try {
      if (userId) {
        await saveLessonProgress({
          userId,
          levelId,
          lessonId: currentLesson.id,
          currentSectionIndex: nextIndex,
          completedSections: updatedCompletedSections,
          totalSections: lessonSections.length,
          completed: nextIndex === lessonSections.length - 1
        });
      }
    } catch (err) {
      console.error("Error saving progress:", err);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading || loadingUserProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-red-600 bg-red-100 p-4 rounded-lg text-center text-sm md:text-base">
          {error}
        </div>
      </div>
    );
  }

  const currentLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === currentLesson?.id
  );

  const sectionProgress = Math.round(
    ((currentSectionIndex + 1) / lessonSections.length) * 100
  );

  const nextLevel = getNextLevel(levelId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex-1 w-full">
        <div className="flex relative">
          <button
            type="button"
            className="
              fixed
              top-[3.4rem]
              left-1
              z-40
              md:hidden
              w-8
              h-8
              rounded-xl
              bg-primary-300
              text-white
              shadow-lg
              flex
              items-center
              justify-center
              hover:bg-primary-700
              transition-all
              "
            onClick={() => setSidebarOpen(true)}
            title="Abrir menú de lecciones"
            aria-label="Abrir menú de lecciones"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <div
                className="
                absolute
                inset-0
                bg-black/50
                backdrop-blur-[1px]
                "
              />

              <div
                className="absolute left-0 top-0 w-[92vw] max-w-[360px] h-full bg-white shadow-xl overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold text-primary-600">
                    Nivel {levelId}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-500 hover:text-primary-600 text-2xl font-bold"
                    title="Cerrar menú"
                    aria-label="Cerrar menú de lecciones"
                  >
                    ×
                  </button>
                </div>

                <nav className="p-2">
                  <LessonSidebar
                    lessons={lessons}
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
                </nav>
              </div>
            </div>
          )}

          {isDesktopSidebarOpen && (
            <div className="hidden md:block w-72 bg-white shadow-lg overflow-y-auto fixed h-[calc(100vh-4rem)]">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-600">
                  Nivel {levelId}
                </h2>

                <button
                  type="button"
                  onClick={() => setDesktopSidebarOpen(false)}
                  className="text-gray-500 hover:text-primary-600 text-xl font-bold"
                  title="Cerrar menú"
                >
                  ×
                </button>
              </div>

              <nav className="p-2">
                <LessonSidebar
                  lessons={lessons}
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
              </nav>
            </div>
          )}

          {!isDesktopSidebarOpen && (
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(true)}
              className="hidden md:flex fixed top-24 left-4 z-40 bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg hover:bg-primary-700"
              title="Abrir menú"
            >
              ☰
            </button>
          )}

          <main
            className={`
              w-full
              px-2
              py-3
              sm:px-4
              sm:py-4
              md:p-8
              transition-all
              duration-300
              ${
                isDesktopSidebarOpen
                  ? "md:ml-72"
                  : "md:ml-0"
              }
            `}
          >
            {currentLesson && lessonDetails ? (
              <div
                className="
                max-w-4xl
                mx-auto
                w-full
                space-y-5
                md:space-y-8
                "
              >
                <LessonProgress
                  currentSectionIndex={currentSectionIndex}
                  totalSections={lessonSections.length}
                  currentSectionTitle={currentSection?.title}
                  sectionProgress={sectionProgress}
                />

                <LessonSectionRenderer
                  currentSection={currentSection}
                  lessonDetails={lessonDetails}
                  levelId={levelId}
                  currentLesson={currentLesson}
                  markSectionCompleted={markSectionCompleted}
                />

                {!canAdvanceCurrentSection() && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 md:p-4 text-xs sm:text-sm">
                    Para avanzar debes completar esta actividad primero.
                  </div>
                )}

                <LessonNavigation
                  currentSectionIndex={currentSectionIndex}
                  totalSections={lessonSections.length}
                  canAdvanceCurrentSection={canAdvanceCurrentSection}
                  goToPreviousSection={goToPreviousSection}
                  goToNextSection={goToNextSection}
                  handlePreviousLesson={handlePreviousLesson}
                  handleNextLesson={handleNextLesson}
                  currentLessonIndex={currentLessonIndex}
                  totalLessons={lessons.length}
                  nextLevel={nextLevel}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center min-h-[60vh] px-4">
                <p className="text-gray-500 text-base md:text-lg text-center">
                  Selecciona una lección para ver su contenido.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Nivel;