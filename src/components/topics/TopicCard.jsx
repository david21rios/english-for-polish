// src/components/topics/TopicCard.jsx

import React, { forwardRef } from "react";
import {
  FaArrowRight,
  FaBolt,
  FaLayerGroup,
  FaTrophy
} from "react-icons/fa";

const TopicCard = forwardRef(({ tema, onClick }, ref) => {
  const title =
    tema.title ||
    tema.titulo ||
    tema.name ||
    "Topic";

  const icon =
    tema.icon ||
    tema.emoji ||
    "🎯";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="
        group
        w-full
        bg-white
        border border-gray-100
        rounded-3xl
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        transition-all
        duration-300
        p-4
        text-left
        flex
        flex-col
        min-h-[200px]
      "
    >
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-[11px] font-semibold px-2 py-1 rounded-full">
          <FaTrophy size={10} />
          XP
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-lg font-bold text-gray-900 leading-snug line-clamp-2">
        {title}
      </h3>

      {/* Badges */}
      <div className="mt-3 flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 w-fit text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">
          <FaBolt size={10} />
          Missions
        </span>

        <span className="inline-flex items-center gap-2 w-fit text-[11px] bg-gray-50 text-gray-700 px-2 py-1 rounded-full font-semibold">
          <FaLayerGroup size={10} />
          Adaptive
        </span>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 flex items-center justify-between text-primary-600 font-semibold text-sm">
        <span>Start</span>

        <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </button>
  );
});

TopicCard.displayName = "TopicCard";

export default TopicCard;