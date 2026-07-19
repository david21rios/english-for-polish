// src/components/topics/admin/AdminMissionCard.jsx

import {
  FaArchive,
  FaCopy,
  FaEdit,
  FaUndo
} from "react-icons/fa";

import {
  getMissionDifficultyBadgeClass,
  getMissionDifficultyLabel,
  getMissionStatusBadgeClass,
  getMissionStatusLabel
} from "./missionAdminConfig";

const isArchivedMission = (mission = {}) => {
  return (
    mission.isDeleted === true ||
    mission.status === "archived"
  );
};

const AdminMissionCard = ({
  mission,
  processing = false,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore
}) => {
  const archived =
    isArchivedMission(mission);

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md ${
        archived
          ? "border-orange-200 bg-orange-50/40"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getMissionStatusBadgeClass(
            mission.status
          )}`}
        >
          {getMissionStatusLabel(
            mission.status
          )}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getMissionDifficultyBadgeClass(
            mission.difficulty
          )}`}
        >
          {getMissionDifficultyLabel(
            mission.difficulty
          )}
        </span>

        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          {mission.level || "A1"}
        </span>

        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
          {mission.xpReward || 10} XP
        </span>
      </div>

      <h2 className="break-words text-xl font-bold text-gray-900">
        {mission.title ||
          "Misja bez tytułu"}
      </h2>

      <p className="mt-2 break-words leading-relaxed text-gray-600">
        {mission.description ||
          "Brak opisu."}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p className="break-words">
          <strong>Rola AI:</strong>{" "}
          {mission.aiRole || "N/A"}
        </p>

        <p>
          <strong>Cele:</strong>{" "}
          {mission.objectives?.length || 0}
        </p>

        <p>
          <strong>Czas:</strong>{" "}
          {mission.estimatedMinutes || 5} min
        </p>

        <p>
          <strong>Kolejność:</strong>{" "}
          {mission.order || "N/A"}
        </p>
      </div>

      {!archived ? (
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              onEdit(mission)
            }
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaEdit />
            Edytuj
          </button>

          <button
            type="button"
            onClick={() =>
              onDuplicate(mission)
            }
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-50 px-3 py-3 font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaCopy />
            Kopiuj
          </button>

          <button
            type="button"
            onClick={() =>
              onArchive(mission)
            }
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-3 py-3 font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaArchive />

            {processing
              ? "Archiwizowanie..."
              : "Archiwizuj"}
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <button
            type="button"
            onClick={() =>
              onRestore(mission)
            }
            disabled={processing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaUndo />

            {processing
              ? "Przywracanie..."
              : "Przywróć misję"}
          </button>
        </div>
      )}
    </article>
  );
};

export default AdminMissionCard;