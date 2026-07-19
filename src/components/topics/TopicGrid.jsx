// src/components/topics/TopicGrid.jsx

import TopicCard from "./TopicCard";

const TopicGrid = ({
  temas = [],
  handleTemaClick
}) => {
  const topics =
    Array.isArray(temas)
      ? temas
      : [];

  const handleTopicClick = (
    topic
  ) => {
    if (
      !topic?.id ||
      typeof handleTemaClick !==
        "function"
    ) {
      return;
    }

    handleTemaClick(
      topic.id
    );
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full"
      aria-labelledby="topics-grid-title"
    >
      <header className="mb-6 md:mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Tematy do ćwiczeń
        </p>

        <h2
          id="topics-grid-title"
          className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl"
        >
          Wybierz sytuację z życia codziennego
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
          Wybierz interesujący Cię temat, wykonuj realistyczne misje i ćwicz
          komunikację dopasowaną do Twojego poziomu językowego.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            tema={topic}
            onClick={() =>
              handleTopicClick(
                topic
              )
            }
          />
        ))}
      </div>
    </section>
  );
};

export default TopicGrid;