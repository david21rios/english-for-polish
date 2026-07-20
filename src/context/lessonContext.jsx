// src/context/lessonContext.jsx

import {
  createContext,
  useMemo,
  useState
} from "react";

export const LessonContext =
  createContext(null);

/**
 * Provides lesson state shared across the application.
 */
export const LessonProvider = ({
  children
}) => {
  const [
    currentLesson,
    setCurrentLesson
  ] = useState(null);

  const [
    userProgress,
    setUserProgress
  ] = useState({});

  /**
   * Memoize the context value to avoid creating
   * a new object on every render.
   */
  const value = useMemo(
    () => ({
      currentLesson,
      setCurrentLesson,
      userProgress,
      setUserProgress
    }),
    [
      currentLesson,
      userProgress
    ]
  );

  return (
    <LessonContext.Provider
      value={value}
    >
      {children}
    </LessonContext.Provider>
  );
};

export default LessonProvider;