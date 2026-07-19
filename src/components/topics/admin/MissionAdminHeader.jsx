// src/components/topics/admin/MissionAdminHeader.jsx

import {
  FaLayerGroup,
  FaPlus
} from "react-icons/fa";

const MissionAdminHeader = ({
  activeTheme,
  totalMissions = 0,
  publishedMissions = 0,
  draftMissions = 0,
  archivedMissions = 0,
  onOpenThemes,
  onCreateMission
}) => {
  return (
    <header className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Tematy i misje
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Zarządzanie misjami
          </h1>

          <p className="mt-3 max-w-3xl leading-relaxed text-gray-600">
            Twórz gamifikowane misje konwersacyjne przypisane do tematów
            nauki języka angielskiego.
          </p>

          {activeTheme && (
            <p className="mt-3 text-sm text-gray-600">
              Aktywny temat:{" "}
              <span className="font-semibold">
                {activeTheme.icon}{" "}
                {activeTheme.title}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onOpenThemes}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <FaLayerGroup />
            Tematy
          </button>

          <button
            type="button"
            onClick={onCreateMission}
            disabled={!activeTheme}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlus />
            Utwórz misję
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
          <p className="text-xs font-semibold uppercase text-primary-600">
            Wszystkie
          </p>

          <p className="mt-1 text-2xl font-bold text-primary-700">
            {totalMissions}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase text-green-600">
            Opublikowane
          </p>

          <p className="mt-1 text-2xl font-bold text-green-700">
            {publishedMissions}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Szkice
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-700">
            {draftMissions}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase text-orange-600">
            Zarchiwizowane
          </p>

          <p className="mt-1 text-2xl font-bold text-orange-700">
            {archivedMissions}
          </p>
        </div>
      </div>
    </header>
  );
};

export default MissionAdminHeader;