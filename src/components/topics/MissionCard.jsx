// src/components/topics/MissionCard.jsx

import React from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaFlagCheckered,
  FaLock,
  FaPlay,
  FaRedo,
  FaStar
} from "react-icons/fa";

const formatDifficulty = (difficulty = "easy") => {
  const labels = {
    easy: "Łatwa",
    medium: "Średnia",
    hard: "Trudna",
    adaptive: "Adaptacyjna"
  };

  return labels[difficulty] || difficulty;
};

const MissionCard = ({ mission, onStart }) => {
  const isLocked = mission.locked === true;
  const isCompleted = mission.completed === true;

  const xpReward = Number(mission.xpReward ?? mission.xp ?? 10);
  const difficulty = formatDifficulty(mission.difficulty || "easy");
  const level = mission.level || "A1";
  const estimatedMinutes = Number(mission.estimatedMinutes || 5);
  const objectivesCount = Array.isArray(mission.objectives)
    ? mission.objectives.length
    : 0;

  return (
    <article
      className={`rounded-3xl border p-4 md:p-5 shadow-sm transition-all flex flex-col min-h-[250px] overflow-hidden ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isLocked
          ? "bg-gray-100 border-gray-200 opacity-75"
          : "bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isCompleted ? "text-green-700" : "text-primary-600"
            }`}
          >
            Misja konwersacyjna
          </p>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-1 leading-snug break-words line-clamp-2">
            {mission.title || "Misja bez tytułu"}
          </h3>
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isCompleted
              ? "bg-green-100 text-green-700"
              : isLocked
              ? "bg-gray-200 text-gray-500"
              : "bg-primary-100 text-primary-600"
          }`}
        >
          {isCompleted ? (
            <FaCheckCircle />
          ) : isLocked ? (
            <FaLock />
          ) : (
            <FaStar />
          )}
        </div>
      </div>

      {mission.description ? (
        <p className="text-sm text-gray-600 mt-3 leading-relaxed break-words line-clamp-3 flex-grow">
          {mission.description}
        </p>
      ) : (
        <p className="text-sm text-gray-500 mt-3 leading-relaxed flex-grow">
          Ukończ realistyczną rozmowę i otrzymaj informację zwrotną na końcu.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-semibold ${
            isCompleted
              ? "bg-gray-100 text-gray-600"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          <FaBolt />
          {isCompleted ? `Zdobyto ${xpReward} XP` : `${xpReward} XP`}
        </span>

        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-semibold">
          <FaFlagCheckered />
          {difficulty}
        </span>

        <span className="bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-full font-semibold">
          {level}
        </span>

        <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-2.5 py-1.5 rounded-full font-semibold">
          <FaClock />
          {estimatedMinutes} min
        </span>
      </div>

      {objectivesCount > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          🎯 Cele do wykonania: {objectivesCount}
        </p>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onStart(mission)}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm md:text-base font-semibold transition-all duration-300 ${
            isLocked
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isCompleted
              ? "bg-white border border-green-300 text-green-700 hover:bg-green-100"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        >
          {isLocked ? (
            <>
              <FaLock />
              Zablokowana
            </>
          ) : isCompleted ? (
            <>
              <FaRedo />
              Ćwicz ponownie
            </>
          ) : (
            <>
              <FaPlay />
              Rozpocznij misję
            </>
          )}
        </button>

        {isCompleted && (
          <p className="mt-2 text-[11px] text-green-700 text-center leading-relaxed">
            Powtórzenie tej misji jest przydatne, ale nie doda ponownie XP.
          </p>
        )}
      </div>
    </article>
  );
};

export default MissionCard;
