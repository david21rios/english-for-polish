// src/components/topics/TopicProgress.jsx

import React from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaGift,
  FaRoute
} from "react-icons/fa";

const TopicProgress = ({
  completedCount = 0,
  totalMissions = 0,
  totalXp = 0
}) => {
  const safeTotal = totalMissions > 0 ? totalMissions : 1;
  const progressPercent = Math.round((completedCount / safeTotal) * 100);

  const nextReward =
    progressPercent >= 100
      ? "Topic completed"
      : "Next reward at 100%";

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Topic progress
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2 leading-tight">
            Your mission journey
          </h2>

          <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
            Complete missions, earn XP and unlock more practice challenges.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3 md:p-4 text-center">
            <FaRoute className="mx-auto text-primary-600 mb-1 md:mb-2" />
            <p className="text-base md:text-xl font-bold text-primary-700">
              {completedCount}/{totalMissions}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              Missions
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-3 md:p-4 text-center">
            <FaBolt className="mx-auto text-yellow-600 mb-1 md:mb-2" />
            <p className="text-base md:text-xl font-bold text-yellow-700">
              {totalXp}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              XP
            </p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 md:p-4 text-center">
            <FaCheckCircle className="mx-auto text-green-600 mb-1 md:mb-2" />
            <p className="text-base md:text-xl font-bold text-green-700">
              {progressPercent}%
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              Complete
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 md:mt-7">
        <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
          <span>Overall progress</span>
          <span>{progressPercent}%</span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 md:mt-5 bg-gray-50 border border-gray-100 rounded-2xl p-3 md:p-4 flex items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white text-primary-600 flex items-center justify-center shadow-sm shrink-0">
          <FaGift />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm md:text-base">
            {nextReward}
          </p>

          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Keep practicing to strengthen your real-world Spanish skills.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TopicProgress;