// src/components/topics/feedback/MissionFeedbackSummary.jsx

import {
  FaBrain,
  FaChartLine,
  FaComments,
  FaInfoCircle,
  FaShieldAlt
} from "react-icons/fa";

import {
  MISSION_FEEDBACK_VIEW_STATUS
} from "./missionFeedbackUtils";

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  containerClass,
  iconClass,
  valueClass
}) => {
  return (
    <article
      className={`rounded-2xl border p-3 md:p-5 ${containerClass}`}
    >
      <div className="mb-2 flex items-center gap-2 md:mb-3 md:gap-3">
        <Icon
          className={`shrink-0 ${iconClass}`}
          aria-hidden="true"
        />

        <h2 className="text-xs font-semibold text-gray-900 md:text-base">
          {label}
        </h2>
      </div>

      <p
        className={`text-xl font-bold md:text-3xl ${valueClass}`}
      >
        {value}
      </p>
    </article>
  );
};

const MissionFeedbackSummary = ({
  status =
    MISSION_FEEDBACK_VIEW_STATUS
      .passed,

  totalMessages = 0,
  totalWords = 0,
  level = "A1",
  confidence = null,

  alreadyCompleted = false,
  canAwardXp = false,
  xpReason = ""
}) => {
  const showConfidence =
    confidence !== null &&
    confidence !== undefined;

  const isPending =
    status ===
      MISSION_FEEDBACK_VIEW_STATUS
        .pending ||
    status ===
      MISSION_FEEDBACK_VIEW_STATUS
        .review ||
    status ===
      MISSION_FEEDBACK_VIEW_STATUS
        .unavailable;

  return (
    <>
      {alreadyCompleted && (
        <div className="mx-4 mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 md:mx-8 md:mt-6 md:p-4 md:text-sm">
          Ta misja została już wcześniej ukończona. Ponowne ćwiczenie jest
          przydatne, ale nie przyznaje dodatkowych punktów XP.
        </div>
      )}

      {isPending && (
        <div className="mx-4 mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mx-8 md:mt-6">
          <FaInfoCircle className="mt-0.5 shrink-0" />

          <p className="leading-relaxed">
            Wynik nie został zatwierdzony jako ostateczny. Misja nie
            przyznaje jeszcze gwiazdek ani XP.
          </p>
        </div>
      )}

      {!alreadyCompleted &&
        status ===
          MISSION_FEEDBACK_VIEW_STATUS
            .passed &&
        !canAwardXp && (
          <div className="mx-4 mt-5 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 md:mx-8 md:mt-6">
            <FaShieldAlt className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">
                XP nie zostały przyznane
              </p>

              {xpReason && (
                <p className="mt-1 text-xs leading-relaxed">
                  Kod przyczyny:{" "}
                  <code>
                    {xpReason}
                  </code>
                </p>
              )}
            </div>
          </div>
        )}

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        <SummaryCard
          icon={FaComments}
          label="Odpowiedzi"
          value={totalMessages}
          containerClass="border-primary-100 bg-primary-50"
          iconClass="text-primary-600"
          valueClass="text-primary-700"
        />

        <SummaryCard
          icon={FaChartLine}
          label="Słowa"
          value={totalWords}
          containerClass="border-green-100 bg-green-50"
          iconClass="text-green-600"
          valueClass="text-green-700"
        />

        <SummaryCard
          icon={FaBrain}
          label="Poziom"
          value={level}
          containerClass="border-yellow-100 bg-yellow-50"
          iconClass="text-yellow-600"
          valueClass="text-yellow-700"
        />
      </section>

      {showConfidence && (
        <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:mt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-gray-700">
              Pewność oceny AI
            </span>

            <span className="font-bold text-gray-900">
              {confidence}%
            </span>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={
              confidence
            }
            aria-label="Pewność oceny AI"
          >
            <div
              className={`h-2 rounded-full transition-all ${
                confidence >= 70
                  ? "bg-green-500"
                  : confidence >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${confidence}%`
              }}
            />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Wskaźnik opisuje pewność automatycznej analizy. Nie jest oceną
            poziomu językowego studenta.
          </p>
        </section>
      )}
    </>
  );
};

export default MissionFeedbackSummary;