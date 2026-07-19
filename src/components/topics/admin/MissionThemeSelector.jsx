// src/components/topics/admin/MissionThemeSelector.jsx

import {
  FaSpinner
} from "react-icons/fa";

const MissionThemeSelector = ({
  themes = [],
  activeThemeId = "",
  loading = false,
  onSelectTheme
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <FaSpinner className="mx-auto mb-3 animate-spin text-3xl text-primary-600" />

        <p className="text-gray-600">
          Ładowanie tematów...
        </p>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
        Nie ma jeszcze aktywnych tematów. Najpierw utwórz lub przywróć temat
        w panelu tematów.
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
      <p className="mb-3 text-sm font-semibold text-gray-700">
        Wybierz temat
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {themes.map((theme) => {
          const isActive =
            activeThemeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() =>
                onSelectTheme(theme.id)
              }
              aria-pressed={isActive}
              className={`whitespace-nowrap rounded-2xl px-4 py-3 font-semibold transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="mr-1">
                {theme.icon}
              </span>

              {theme.title}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MissionThemeSelector;