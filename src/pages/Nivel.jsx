// src/pages/Nivel.jsx

import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import useCourseNavigation from "../hooks/useCourseNavigation";

import LessonProgress from "../components/nivel/LessonProgress";
import LessonSidebar from "../components/nivel/LessonSidebar";
import LessonNavigation from "../components/nivel/LessonNavigation";
import LessonSectionRenderer from "../components/nivel/LessonSectionRenderer";

const Nivel = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const {
    modules,
    lessons,
    currentLesson,
    lessonDetails,

    lessonSections,
    currentSection,
    currentSectionIndex,
    completedSections,
    activityResults,
    currentLessonIndex,
    sectionProgress,
    lessonCompleted,
    nextLevel,

    loading,
    error,

    sectionHasRequiredWork,
    isSectionAccessible,
    canAdvanceCurrentSection,

    changeLesson,
    goToSection,
    goToNextSection,
    goToPreviousSection,
    goToNextLesson,
    goToPreviousLesson,
    markSectionCompleted,
    registerActivityResult
  } = useCourseNavigation({
    levelId,
    locationState: location.state
  });

  const handleLessonClick = async (lessonId) => {
    await changeLesson(lessonId);
    setSidebarOpen(false);
  };

  const handleSectionClick = async (index) => {
    await goToSection(index);
    setSidebarOpen(false);
  };

  const handleNextLesson = async () => {
    const result = await goToNextLesson();

    if (result?.type === "level" && result.levelId) {
      navigate(`/curso/${result.levelId}`);
    }
  };

  const handlePreviousLesson = async () => {
    await goToPreviousLesson();
  };

  const handleCloseMobileSidebar = () => {
    setSidebarOpen(false);
  };

  const renderLevelSummary = () => {
    return `${modules.length} moduł(y) · ${lessons.length} lekcja(e)`;
  };

  if (loading) {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex-1 w-full">
        <div className="flex relative">
          <button
            type="button"
            className="
              fixed top-[3.4rem] left-1 z-40 md:hidden
              w-8 h-8 rounded-xl bg-primary-600 text-white shadow-lg
              flex items-center justify-center hover:bg-primary-700 transition-all
            "
            onClick={() => setSidebarOpen(true)}
            title="Otwórz menu lekcji"
            aria-label="Otwórz menu lekcji"
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
              onClick={handleCloseMobileSidebar}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

              <div
                className="absolute left-0 top-0 w-[92vw] max-w-[380px] h-full bg-white shadow-xl overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-primary-600">
                      Poziom {levelId}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {renderLevelSummary()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseMobileSidebar}
                    className="text-gray-500 hover:text-primary-600 text-2xl font-bold"
                    title="Zamknij menu"
                    aria-label="Zamknij menu lekcji"
                  >
                    ×
                  </button>
                </div>

                <nav className="p-2">
                  <LessonSidebar
                    modules={modules}
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
            <aside className="hidden md:block w-80 bg-white shadow-lg overflow-y-auto fixed h-[calc(100vh-4rem)]">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary-600">
                    Poziom {levelId}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {renderLevelSummary()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDesktopSidebarOpen(false)}
                  className="text-gray-500 hover:text-primary-600 text-xl font-bold"
                  title="Zamknij menu"
                  aria-label="Zamknij menu lekcji"
                >
                  ×
                </button>
              </div>

              <nav className="p-2">
                <LessonSidebar
                  modules={modules}
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
            </aside>
          )}

          {!isDesktopSidebarOpen && (
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(true)}
              className="hidden md:flex fixed top-24 left-4 z-40 bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg hover:bg-primary-700"
              title="Otwórz menu"
              aria-label="Otwórz menu lekcji"
            >
              ☰
            </button>
          )}

          <main
            className={`
              w-full px-2 py-3 sm:px-4 sm:py-4 md:p-8
              transition-all duration-300
              ${isDesktopSidebarOpen ? "md:ml-80" : "md:ml-0"}
            `}
          >
            {currentLesson && lessonDetails ? (
              <div className="max-w-4xl mx-auto w-full space-y-5 md:space-y-8">
                <LessonProgress
                  currentSectionIndex={currentSectionIndex}
                  totalSections={lessonSections.length}
                  currentSectionTitle={currentSection?.title}
                  sectionProgress={sectionProgress}
                  lessonCompleted={lessonCompleted}
                />

                <LessonSectionRenderer
                  currentSection={currentSection}
                  lessonDetails={lessonDetails}
                  levelId={levelId}
                  currentLesson={currentLesson}
                  completedSections={completedSections}
                  activityResults={activityResults}
                  markSectionCompleted={markSectionCompleted}
                  registerActivityResult={registerActivityResult}
                />

                {!canAdvanceCurrentSection() && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 md:p-4 text-xs sm:text-sm">
                    Aby przejść dalej, musisz najpierw ukończyć tę aktywność.
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
                  Wybierz lekcję, aby zobaczyć jej treść.
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