// src/components/topics/feedback/MissionStrengthsFeedback.jsx

import {
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

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
      String(item || "")
        .normalize("NFKC")
        .trim()
        .slice(0, 600)
    )
    .filter(Boolean)
    .slice(0, maximumItems);
};

const FeedbackList = ({
  title,
  items,
  icon: Icon,
  containerClass,
  titleClass,
  itemClass
}) => {
  return (
    <article
      className={`rounded-2xl border p-4 md:p-6 ${containerClass}`}
    >
      <h2
        className={`mb-3 text-base font-semibold md:mb-4 md:text-lg ${titleClass}`}
      >
        {title}
      </h2>

      {items.length > 0 ? (
        <ul className="space-y-2 md:space-y-3">
          {items.map(
            (
              item,
              index
            ) => (
              <li
                key={`${title}-${index}`}
                className={`flex items-start gap-2 text-sm md:gap-3 md:text-base ${itemClass}`}
              >
                <Icon
                  className="mt-1 shrink-0"
                  aria-hidden="true"
                />

                <span className="break-words leading-relaxed">
                  {item}
                </span>
              </li>
            )
          )}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-gray-500">
          Brak szczegółowych danych dla tej sekcji.
        </p>
      )}
    </article>
  );
};

const MissionStrengthsFeedback = ({
  strengths = [],
  improvements = [],
  isFinal = true
}) => {
  const normalizedStrengths =
    normalizeStringList(
      strengths,
      10
    );

  const normalizedImprovements =
    normalizeStringList(
      improvements,
      10
    );

  if (
    normalizedStrengths.length ===
      0 &&
    normalizedImprovements.length ===
      0
  ) {
    return null;
  }

  return (
    <section className="mt-5 md:mt-8">
      {!isFinal && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs leading-relaxed text-yellow-800">
          Poniższe uwagi mają charakter tymczasowy, ponieważ ocena nie została
          jeszcze zatwierdzona jako ostateczna.
        </div>
      )}

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <FeedbackList
          title="Mocne strony"
          items={
            normalizedStrengths
          }
          icon={
            FaCheckCircle
          }
          containerClass="border-green-100 bg-green-50"
          titleClass="text-green-800"
          itemClass="text-green-900"
        />

        <FeedbackList
          title="Obszary do poprawy"
          items={
            normalizedImprovements
          }
          icon={
            FaExclamationTriangle
          }
          containerClass="border-orange-100 bg-orange-50"
          titleClass="text-orange-800"
          itemClass="text-orange-900"
        />
      </div>
    </section>
  );
};

export default MissionStrengthsFeedback;