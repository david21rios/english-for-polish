// src/components/course/CourseLevelsGrid.jsx

import LevelCard from "./LevelCard";

const CourseLevelsGrid = ({ levels = [], onOpenLevel }) => {
  if (levels.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow p-8 text-center text-gray-500">
        Brak dostępnych poziomów kursu.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
      {levels.map((level) => (
        <LevelCard key={level.id} level={level} onOpenLevel={onOpenLevel} />
      ))}
    </section>
  );
};

export default CourseLevelsGrid;