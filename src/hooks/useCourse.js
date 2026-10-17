import { useContext } from "react";
import { CourseContext } from "../context/CourseContext.jsx";

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === null) {
    throw new Error("useCourse must be used within a CourseProvider.");
  }
  return context;
};

export default useCourse;
