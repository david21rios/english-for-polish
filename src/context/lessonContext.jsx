// src/context/lessonContext.jsx
import React, { createContext, useState } from 'react';

export const LessonContext = createContext();

export const LessonProvider = ({ children }) => {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userProgress, setUserProgress] = useState({});

  const value = {
    currentLesson,
    setCurrentLesson,
    userProgress,
    setUserProgress
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};