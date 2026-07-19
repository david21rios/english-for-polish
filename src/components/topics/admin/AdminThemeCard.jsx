// src/components/topics/admin/ThemeCard.jsx

import {
  FaArchive,
  FaEdit,
  FaGamepad
} from "react-icons/fa";

const ThemeCard = ({
  theme,
  archiving = false,
  onEdit,
  onOpenMissions,
  onArchive
}) => {
  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-3xl">
          {theme.icon || "📚"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Temat #{theme.numero || "N/A"}
          </p>

          <h3 className="mt-1 break-words text-xl font-bold text-gray-900">
            {theme.title ||
              "Temat bez tytułu"}
          </h3>

          <p className="mt-2 break-words text-sm leading-relaxed text-gray-600">
            {theme.description ||
              "Brak opisu."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onEdit(theme)}
          disabled={archiving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <FaEdit />
          Edytuj
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenMissions(theme)
          }
          disabled={archiving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-3 py-3 font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          <FaGamepad />
          Misje
        </button>

        <button
          type="button"
          onClick={() =>
            onArchive(theme)
          }
          disabled={archiving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-50 px-3 py-3 font-semibold text-yellow-800 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaArchive />

          {archiving
            ? "Archiwizowanie..."
            : "Archiwizuj"}
        </button>
      </div>
    </article>
  );
};

export default ThemeCard;