// src/components/topics/TopicGrid.jsx

import React from "react";
import TopicCard from "./TopicCard";

const TopicGrid = ({
  temas,
  circlesRef,
  handleTemaClick
}) => {
  return (
    <section className="w-full">
      <div className="mb-5 md:mb-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Practice topics
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
          Choose a real-life situation
        </h2>

        <p className="text-gray-600 mt-2 text-sm md:text-base max-w-2xl">
          Start with a topic, personalize your context and practice useful
          conversations through missions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 relative z-10">
        {temas.map((tema, index) => (
          <TopicCard
            key={tema.id}
            ref={(el) => {
              circlesRef.current[index] = el;
            }}
            tema={tema}
            onClick={() => handleTemaClick(tema.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default TopicGrid;