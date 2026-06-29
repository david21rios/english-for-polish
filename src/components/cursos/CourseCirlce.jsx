// src/components/cursos/CourseCirlce.jsx

import React from "react";
import { FaArrowRight, FaBolt, FaStar } from "react-icons/fa";

const CourseCircle = React.forwardRef(({ tema, onClick }, ref) => {
  const xp = tema.xp || tema.xpReward || 20;
  const difficulty = tema.difficulty || "Beginner";
  const missions = tema.missionsCount || tema.missions || 3;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="group relative w-full text-left"
    >
      <div className="relative bg-white border border-gray-100 rounded-3xl shadow-md p-5 min-h-[260px] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary-200">
        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <FaStar />
          +{xp} XP
        </div>

        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 shadow-inner flex items-center justify-center text-5xl mb-5 transition-transform duration-300 group-hover:scale-110">
          {tema.icon || "📘"}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {tema.title || "Tema sin título"}
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed flex-grow line-clamp-3">
          {tema.description || "Practica este tema con misiones interactivas."}
        </p>

        <div className="w-full mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <FaBolt className="text-primary-500" />
              {missions} missions
            </span>

            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {difficulty}
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tema.progress || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-primary-600 font-semibold text-sm group-hover:text-primary-700">
            Start topic
            <FaArrowRight className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
});

CourseCircle.displayName = "CourseCircle";

export default CourseCircle;