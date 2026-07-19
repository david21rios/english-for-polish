// src/components/topics/feedback/MissionLanguageFeedback.jsx

import {
  FaBookOpen,
  FaLightbulb,
  FaRocket
} from "react-icons/fa";

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const normalizeStringList = (
  value,
  maximumItems = 10
) => {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map((item) =>
      normalizeText(
        item,
        600
      )
    )
    .filter(Boolean)
    .slice(0, maximumItems);
};

const normalizeVocabularyItem = (
  item = {},
  index = 0
) => {
  if (
    typeof item === "string"
  ) {
    const word =
      normalizeText(
        item,
        200
      );

    return word
      ? {
          id:
            `vocabulary_${index + 1}`,

          word,

          meaning: ""
        }
      : null;
  }

  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return null;
  }

  const word =
    normalizeText(
      item.word ||
        item.phrase ||
        item.expression,
      200
    );

  if (!word) {
    return null;
  }

  return {
    id:
      normalizeText(
        item.id,
        120
      ) ||
      `vocabulary_${index + 1}`,

    word,

    meaning:
      normalizeText(
        item.meaning ||
          item.definition ||
          item.explanation,
        600
      )
  };
};

const VocabularySection = ({
  vocabulary
}) => {
  if (
    vocabulary.length === 0
  ) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-purple-100 bg-purple-50 p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <FaBookOpen
          className="shrink-0 text-purple-600"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-base font-semibold text-purple-900 md:text-lg">
            Słownictwo
          </h2>

          <p className="mt-1 text-xs text-purple-700">
            Przydatne słowa i wyrażenia związane z rozmową.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {vocabulary.map(
          (item) => (
            <li
              key={item.id}
              className="rounded-xl border border-purple-100 bg-white p-3"
            >
              <p className="break-words font-semibold text-gray-900">
                {item.word}
              </p>

              {item.meaning && (
                <p className="mt-1 break-words text-sm leading-relaxed text-gray-600">
                  {item.meaning}
                </p>
              )}
            </li>
          )
        )}
      </ul>
    </article>
  );
};

const GrammarSection = ({
  grammarTips
}) => {
  if (
    grammarTips.length === 0
  ) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <FaLightbulb
          className="shrink-0 text-indigo-600"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-base font-semibold text-indigo-900 md:text-lg">
            Wskazówki gramatyczne
          </h2>

          <p className="mt-1 text-xs text-indigo-700">
            Najważniejsze elementy gramatyczne wynikające z tej rozmowy.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {grammarTips.map(
          (
            item,
            index
          ) => (
            <li
              key={`grammar_${index + 1}`}
              className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-3 text-sm text-indigo-900 md:text-base"
            >
              <FaLightbulb
                className="mt-1 shrink-0 text-indigo-600"
                aria-hidden="true"
              />

              <span className="break-words leading-relaxed">
                {item}
              </span>
            </li>
          )
        )}
      </ul>
    </article>
  );
};

const NextStepsSection = ({
  nextSteps
}) => {
  if (
    nextSteps.length === 0
  ) {
    return null;
  }

  return (
    <article className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:mt-6 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <FaRocket
          className="shrink-0 text-primary-600"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-base font-semibold text-gray-900 md:text-lg">
            Kolejne kroki
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Konkretne działania, które pomogą poprawić komunikację.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {nextSteps.map(
          (
            item,
            index
          ) => (
            <li
              key={`next_step_${index + 1}`}
              className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm text-gray-700 md:text-base"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {index + 1}
              </span>

              <span className="break-words leading-relaxed">
                {item}
              </span>
            </li>
          )
        )}
      </ol>
    </article>
  );
};

const MissionLanguageFeedback = ({
  vocabulary = [],
  grammarTips = [],
  nextSteps = [],
  isFinal = true
}) => {
  const normalizedVocabulary =
    Array.isArray(vocabulary)
      ? vocabulary
          .map(
            (
              item,
              index
            ) =>
              normalizeVocabularyItem(
                item,
                index
              )
          )
          .filter(Boolean)
          .slice(0, 15)
      : [];

  const normalizedGrammarTips =
    normalizeStringList(
      grammarTips,
      10
    );

  const normalizedNextSteps =
    normalizeStringList(
      nextSteps,
      10
    );

  if (
    normalizedVocabulary.length ===
      0 &&
    normalizedGrammarTips.length ===
      0 &&
    normalizedNextSteps.length ===
      0
  ) {
    return null;
  }

  return (
    <section className="mt-5 md:mt-8">
      {!isFinal && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs leading-relaxed text-yellow-800">
          Sugestie językowe są tymczasowe, ponieważ ocena nie została jeszcze
          zatwierdzona jako ostateczna.
        </div>
      )}

      {(normalizedVocabulary.length >
        0 ||
        normalizedGrammarTips.length >
          0) && (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <VocabularySection
            vocabulary={
              normalizedVocabulary
            }
          />

          <GrammarSection
            grammarTips={
              normalizedGrammarTips
            }
          />
        </div>
      )}

      <NextStepsSection
        nextSteps={
          normalizedNextSteps
        }
      />
    </section>
  );
};

export default MissionLanguageFeedback;