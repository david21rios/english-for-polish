// src/components/topics/personalization/PersonalizedMissionPreview.jsx

import {
  FaArrowLeft,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaExclamationTriangle,
  FaLanguage,
  FaMagic,
  FaPlay,
  FaRedo,
  FaRobot,
  FaShieldAlt,
  FaSpinner,
  FaStar,
  FaUserTie
} from "react-icons/fa";

const normalizeText = (
  value = "",
  maximumLength = 3000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const normalizeItems = (
  items = []
) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item &&
      typeof item === "object"
  );
};

const MetricIcon = ({
  metricId
}) => {
  const icons = {
    level: FaLanguage,
    duration: FaClock,
    turns: FaComments,
    xp: FaStar
  };

  const Icon =
    icons[metricId] ||
    FaCheckCircle;

  return (
    <Icon aria-hidden="true" />
  );
};

const ParameterIcon = ({
  parameterId
}) => {
  const icons = {
    conversationType:
      FaComments,

    npcStyle:
      FaRobot,

    complexity:
      FaShieldAlt,

    vocabulary:
      FaBookOpen,

    grammar:
      FaLanguage
  };

  const Icon =
    icons[parameterId] ||
    FaCheckCircle;

  return (
    <Icon aria-hidden="true" />
  );
};

const PersonalizedMissionPreview = ({
  preview = null,
  mission = null,

  generating = false,
  starting = false,

  onEdit,
  onRegenerate,
  onStart
}) => {
  if (
    !preview ||
    typeof preview !== "object"
  ) {
    return null;
  }

  const metrics =
    normalizeItems(
      preview.metrics
    );

  const parameters =
    normalizeItems(
      preview.parameters
    );

  const objectives =
    normalizeItems(
      preview.objectives
    );

  const successCriteria =
    Array.isArray(
      preview.briefing
        ?.successCriteria
    )
      ? preview.briefing
          .successCriteria
          .map((item) =>
            normalizeText(
              item,
              500
            )
          )
          .filter(Boolean)
      : [];

  const isReady =
    preview.readyToStart ===
    true;

  const canEdit =
    typeof onEdit ===
    "function";

  const canRegenerate =
    typeof onRegenerate ===
    "function";

  const canStart =
    typeof onStart ===
      "function" &&
    isReady &&
    !generating &&
    !starting;

  const npcRole =
    normalizeText(
      preview.npc?.role,
      200
    ) ||
    "Rozmówca AI";

  const npcStyle =
    normalizeText(
      preview.npc
        ?.styleLabel,
      100
    ) ||
    "Adaptacyjny";

  return (
    <section
      aria-labelledby="personalized-mission-preview-title"
      className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg"
    >
      <header className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-5 text-white md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-100 md:text-sm">
              Podgląd misji personalizowanej
            </p>

            <h2
              id="personalized-mission-preview-title"
              className="mt-2 break-words text-2xl font-bold leading-tight md:text-4xl"
            >
              {preview.title}
            </h2>

            <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-primary-50 md:text-base">
              {preview.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-2 text-xs font-semibold">
                <span className="text-lg">
                  {preview.topic?.icon ||
                    "🎯"}
                </span>

                {preview.topic?.title ||
                  "Temat"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-2 text-xs font-semibold">
                <FaUserTie />

                {npcRole}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-2 text-xs font-semibold">
                <FaRobot />

                {npcStyle}
              </span>
            </div>
          </div>

          <div className="flex h-24 w-24 shrink-0 items-center justify-center self-center rounded-3xl border border-white/20 bg-white/15 text-5xl shadow-inner lg:self-start">
            {preview.topic?.icon ||
              "🎯"}
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(
              (metric) => (
                <article
                  key={metric.id}
                  className="rounded-2xl border border-white/10 bg-white/15 p-4"
                >
                  <div className="flex items-center gap-2 text-primary-100">
                    <MetricIcon
                      metricId={
                        metric.id
                      }
                    />

                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {metric.label}
                    </p>
                  </div>

                  <p className="mt-2 break-words text-xl font-bold">
                    {metric.value}
                  </p>

                  {metric.helperText && (
                    <p className="mt-1 text-[11px] leading-relaxed text-primary-100">
                      {
                        metric.helperText
                      }
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </header>

      <div className="space-y-6 p-5 md:p-8">
        {!isReady && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Misja nie jest jeszcze gotowa
                </p>

                <p className="mt-1 text-sm leading-relaxed">
                  Brakuje wymaganych elementów. Wróć do formularza lub wygeneruj
                  misję ponownie.
                </p>

                {Array.isArray(
                  preview.missingFields
                ) &&
                  preview
                    .missingFields
                    .length > 0 && (
                    <p className="mt-2 text-xs">
                      Brakujące pola:{" "}
                      {preview.missingFields.join(
                        ", "
                      )}
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-primary-100 bg-primary-50 p-4 md:p-5">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <FaMagic className="text-primary-600" />

            Scenariusz
          </h3>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 md:text-base">
            {preview.scenario ||
              "Brak scenariusza."}
          </p>
        </section>

        {preview.goal && (
          <section className="rounded-2xl border border-green-100 bg-green-50 p-4 md:p-5">
            <h3 className="flex items-center gap-2 font-bold text-green-900">
              <FaCheckCircle />

              Główny cel
            </h3>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-green-900 md:text-base">
              {preview.goal}
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-purple-100 bg-purple-50 p-4 md:p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-700">
              <FaRobot />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                Twój rozmówca AI
              </p>

              <h3 className="mt-1 break-words text-xl font-bold text-gray-900">
                {preview.npc
                  ?.displayName ||
                  npcRole}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {preview.npc
                  ?.description ||
                  `${npcRole} · ${npcStyle}`}
              </p>
            </div>
          </div>
        </section>

        {objectives.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-gray-900">
                <FaCheckCircle className="text-green-600" />

                Cele misji
              </h3>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {objectives.length}
              </span>
            </div>

            <ul className="space-y-3">
              {objectives.map(
                (
                  objective,
                  index
                ) => (
                  <li
                    key={
                      objective.id ||
                      `objective_${index}`
                    }
                    className="flex items-start gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="break-words text-sm leading-relaxed text-gray-700 md:text-base">
                        {objective.text}
                      </p>

                      {objective.required ===
                        false && (
                        <span className="mt-1 inline-block text-xs text-gray-500">
                          Cel opcjonalny
                        </span>
                      )}
                    </div>
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        {preview.briefing
          ?.studentInstructions && (
          <section className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 md:p-5">
            <h3 className="font-bold text-yellow-900">
              Instrukcja przed rozpoczęciem
            </h3>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-yellow-900">
              {
                preview.briefing
                  .studentInstructions
              }
            </p>

            {successCriteria.length >
              0 && (
              <div className="mt-4 border-t border-yellow-200 pt-4">
                <p className="text-sm font-semibold text-yellow-900">
                  Kryteria sukcesu
                </p>

                <ol className="mt-3 space-y-2">
                  {successCriteria.map(
                    (
                      criterion,
                      index
                    ) => (
                      <li
                        key={`${criterion}-${index}`}
                        className="flex items-start gap-3 text-sm text-yellow-900"
                      >
                        <span className="font-bold">
                          {index + 1}.
                        </span>

                        <span className="break-words leading-relaxed">
                          {criterion}
                        </span>
                      </li>
                    )
                  )}
                </ol>
              </div>
            )}
          </section>
        )}

        {parameters.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              Parametry rozmowy
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              {parameters.map(
                (parameter) => (
                  <article
                    key={parameter.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                        <ParameterIcon
                          parameterId={
                            parameter.id
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {parameter.label}
                        </p>

                        <p className="mt-1 break-words font-semibold text-gray-900">
                          {parameter.value}
                        </p>

                        {parameter.description && (
                          <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            {
                              parameter.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <FaShieldAlt className="mt-0.5 shrink-0 text-blue-700" />

            <div>
              <p className="font-semibold text-blue-900">
                Zasady tej misji
              </p>

              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-blue-900">
                <li>
                  • Informacja zwrotna pojawi się po zakończeniu rozmowy.
                </li>

                <li>
                  • AI nie będzie poprawiać każdego błędu podczas rozmowy.
                </li>

                <li>
                  • Ograniczone wsparcie po polsku:{" "}
                  <strong>
                    {preview.policy
                      ?.polishSupport
                      ? "włączone"
                      : "wyłączone"}
                  </strong>
                </li>

                <li>
                  •{" "}
                  {preview.policy
                    ?.xpMessage ||
                    "Misja personalizowana nie przyznaje XP."}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-3">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={
                generating ||
                starting
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaArrowLeft />

              Edytuj dane
            </button>
          )}

          {canRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={
                generating ||
                starting
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-5 py-3 font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaRedo />
              )}

              {generating
                ? "Generowanie..."
                : "Wygeneruj ponownie"}
            </button>
          )}

          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {starting ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPlay />
            )}

            {starting
              ? "Uruchamianie..."
              : "Rozpocznij misję"}
          </button>
        </footer>

        {mission?.id && (
          <p className="text-center text-[10px] text-gray-400">
            Identyfikator sesji:{" "}
            {mission.id}
          </p>
        )}
      </div>
    </section>
  );
};

export default PersonalizedMissionPreview;