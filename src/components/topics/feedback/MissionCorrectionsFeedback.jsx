// src/components/topics/feedback/MissionCorrectionsFeedback.jsx

import {
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle
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

const normalizeCorrection = (
  correction = {},
  index = 0
) => {
  if (
    !correction ||
    typeof correction !== "object" ||
    Array.isArray(correction)
  ) {
    return null;
  }

  const original =
    normalizeText(
      correction.original ||
        correction.studentText ||
        correction.before,
      600
    );

  const suggested =
    normalizeText(
      correction.suggested ||
        correction.corrected ||
        correction.after,
      600
    );

  if (
    !original ||
    !suggested
  ) {
    return null;
  }

  return {
    id:
      normalizeText(
        correction.id,
        120
      ) ||
      `correction_${index + 1}`,

    original,

    suggested,

    explanation:
      normalizeText(
        correction.explanation ||
          correction.reason,
        800
      )
  };
};

const MissionCorrectionsFeedback = ({
  corrections = [],
  isFinal = true
}) => {
  const normalizedCorrections =
    Array.isArray(corrections)
      ? corrections
          .map(
            (
              correction,
              index
            ) =>
              normalizeCorrection(
                correction,
                index
              )
          )
          .filter(Boolean)
      : [];

  if (
    normalizedCorrections.length ===
    0
  ) {
    return null;
  }

  return (
    <section className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 md:mt-8 md:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-red-900 md:text-lg">
          Sugerowane poprawki
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-red-700">
          Poprawki dotyczą najważniejszych elementów wpływających na
          zrozumiałość i naturalność komunikacji.
        </p>
      </div>

      {!isFinal && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
          <FaExclamationCircle className="mt-0.5 shrink-0" />

          <p className="leading-relaxed">
            Poniższe poprawki mają charakter tymczasowy, ponieważ ocena nie
            została jeszcze zatwierdzona jako ostateczna.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {normalizedCorrections.map(
          (
            correction,
            index
          ) => (
            <article
              key={correction.id}
              className="rounded-xl border border-red-100 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Poprawka {index + 1}
                </p>

                <FaCheckCircle
                  className="shrink-0 text-green-600"
                  aria-hidden="true"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <div className="min-w-0 rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Oryginał
                  </p>

                  <p className="mt-1 break-words text-sm font-medium leading-relaxed text-gray-900 md:text-base">
                    {correction.original}
                  </p>
                </div>

                <FaArrowRight
                  className="hidden text-gray-400 lg:block"
                  aria-hidden="true"
                />

                <div className="min-w-0 rounded-xl border border-green-100 bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-700">
                    Lepsza wersja
                  </p>

                  <p className="mt-1 break-words text-sm font-medium leading-relaxed text-gray-900 md:text-base">
                    {correction.suggested}
                  </p>
                </div>
              </div>

              {correction.explanation && (
                <div className="mt-3 rounded-xl bg-gray-50 px-3 py-3">
                  <p className="text-xs font-semibold text-gray-600">
                    Wyjaśnienie
                  </p>

                  <p className="mt-1 break-words text-sm leading-relaxed text-gray-700">
                    {correction.explanation}
                  </p>
                </div>
              )}
            </article>
          )
        )}
      </div>
    </section>
  );
};

export default MissionCorrectionsFeedback;