// src/components/topics/MissionList.jsx

import React from "react";
import MissionCard from "./MissionCard";

const MissionList = ({ missions = [], onStartMission }) => {
  if (!missions.length) {
    return (
      <section className="bg-white rounded-3xl shadow-sm p-5 md:p-8 border border-gray-100 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
          Nie ma jeszcze dostępnych misji
        </h2>

        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
          Ten temat nie ma jeszcze misji. Administrator może utworzyć misje
          w panelu administracyjnym.
        </p>
      </section>
    );
  }

  const completedCount = missions.filter((mission) => mission.completed).length;
  const lockedCount = missions.filter(
    (mission) => mission.locked && !mission.completed
  ).length;
  const availableCount = missions.filter(
    (mission) => mission.available && !mission.completed
  ).length;

  return (
    <section className="space-y-5 md:space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Wybierz swoje wyzwanie
        </p>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-1">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Wykonuj misje z życia codziennego
            </h2>

            <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed max-w-3xl">
              Wybierz misję, ukończ rozmowę, zdobądź XP i otrzymaj informację
              zwrotną dopiero po zakończeniu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center shrink-0 sm:grid-cols-4">
            <div className="bg-primary-50 text-primary-700 rounded-2xl px-3 py-2">
              <p className="font-bold">{missions.length}</p>
              <p className="text-[11px]">Razem</p>
            </div>

            <div className="bg-green-50 text-green-700 rounded-2xl px-3 py-2">
              <p className="font-bold">{completedCount}</p>
              <p className="text-[11px]">Ukończone</p>
            </div>

            <div className="bg-gray-50 text-gray-600 rounded-2xl px-3 py-2">
              <p className="font-bold">{availableCount}</p>
              <p className="text-[11px]">Dostępne</p>
            </div>

            <div className="bg-gray-100 text-gray-600 rounded-2xl px-3 py-2">
              <p className="font-bold">{lockedCount}</p>
              <p className="text-[11px]">Zablokowane</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onStart={onStartMission}
          />
        ))}
      </div>
    </section>
  );
};

export default MissionList;
