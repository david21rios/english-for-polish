// src/components/topics/personalization/PersonalizationExamples.jsx
import {
    FaBriefcase,
    FaHotel,
    FaLightbulb,
    FaChalkboardTeacher
} from "react-icons/fa";

import {
  PERSONALIZATION_EXAMPLES
} from "../../../services/ai/missions/personalization/missionPersonalizationDefaults";

const EXAMPLE_ICONS = {
    job_interview: FaBriefcase,
    hotel_problem: FaHotel,
    presentation: FaChalkboardTeacher
};

const PersonalizationExamples = ({
  examples =
    PERSONALIZATION_EXAMPLES,
  selectedExampleId = null,
  disabled = false,
  onSelect
}) => {
  const normalizedExamples =
    Array.isArray(examples)
      ? examples.filter(
          (example) =>
            example &&
            typeof example ===
              "object" &&
            example.id
        )
      : [];

  if (
    normalizedExamples.length ===
    0
  ) {
    return null;
  }

  const handleSelect = (
    example
  ) => {
    if (
      disabled ||
      typeof onSelect !==
        "function"
    ) {
      return;
    }

    onSelect(example);
  };

  return (
    <section
      aria-labelledby="personalization-examples-title"
      className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <FaLightbulb
          className="mt-1 shrink-0 text-yellow-600"
          aria-hidden="true"
        />

        <div>
          <h3
            id="personalization-examples-title"
            className="font-semibold text-yellow-900"
          >
            Potrzebujesz inspiracji?
          </h3>

          <p className="mt-1 text-sm leading-relaxed text-yellow-800">
            Wybierz przykład, aby automatycznie wypełnić formularz. Wszystkie
            dane będzie można później zmienić.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {normalizedExamples.map(
          (example) => {
            const ExampleIcon =
              EXAMPLE_ICONS[
                example.id
              ] ||
              FaLightbulb;

            const selected =
              selectedExampleId ===
              example.id;

            return (
              <button
                key={example.id}
                type="button"
                disabled={disabled}
                aria-pressed={
                  selected
                }
                onClick={() =>
                  handleSelect(
                    example
                  )
                }
                className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "border-yellow-500 bg-white ring-2 ring-yellow-200"
                    : "border-yellow-200 bg-white/80 hover:border-yellow-400 hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-yellow-500 text-white"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                    aria-hidden="true"
                  >
                    <ExampleIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {
                        example.title
                      }
                    </p>

                    {example.topicHint && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-yellow-700">
                        {
                          example.topicHint
                        }
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-600">
                  {
                    example.situation
                  }
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {example.level && (
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold text-primary-700">
                      {example.level}
                    </span>
                  )}

                  {example.missionLength && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                      {
                        example.missionLength
                      }
                    </span>
                  )}

                  {example.complexity && (
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-700">
                      {
                        example.complexity
                      }
                    </span>
                  )}
                </div>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
};

export default PersonalizationExamples;