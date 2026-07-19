// src/components/topics/admin/MissionStatusFilter.jsx

const MissionStatusFilter = ({
  value = "active",
  activeCount = 0,
  archivedCount = 0,
  totalCount = 0,
  onChange
}) => {
  const filters = [
    {
      value: "active",
      label: `Aktywne (${activeCount})`
    },
    {
      value: "archived",
      label: `Zarchiwizowane (${archivedCount})`
    },
    {
      value: "all",
      label: `Wszystkie (${totalCount})`
    }
  ];

  return (
    <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selected =
            value === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                onChange(filter.value)
              }
              aria-pressed={selected}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MissionStatusFilter;