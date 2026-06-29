// src/components/forum/ForumLevelTabs.jsx

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const ForumLevelTabs = ({
  selectedLevel,
  allowedLevels = [],
  onSelectLevel
}) => {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-5">
        <div>
          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Available forums
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            Choose your level
          </h2>
        </div>

        <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
          You can access forums up to your current level.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
        {LEVELS.map((level) => {
          const isAllowed = allowedLevels.includes(level);
          const isActive = selectedLevel === level;

          return (
            <button
              key={level}
              type="button"
              disabled={!isAllowed}
              onClick={() => onSelectLevel(level)}
              className={`px-3 py-3 rounded-2xl text-sm md:text-base font-bold transition-all ${
                !isAllowed
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isActive
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-primary-50 text-primary-700 hover:bg-primary-100"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ForumLevelTabs;