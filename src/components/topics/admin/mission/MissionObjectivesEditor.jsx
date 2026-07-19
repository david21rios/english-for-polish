// src/components/topics/admin/mission/MissionObjectivesEditor.jsx

import {
  FaPlus,
  FaTrash
} from "react-icons/fa";

import {
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

const MissionObjectivesEditor = ({
  objectives,
  saving,
  onAdd,
  onChange,
  onRemove
}) => {
  const maximumReached =
    objectives.length >=
    MISSION_FIELD_LIMITS.objectives.max;

  return (
    <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-gray-900">
            Cele misji
          </h3>

          <p className="text-sm text-gray-600">
            AI będzie oceniać ich realizację
            w tle podczas rozmowy.
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Maksymalnie{" "}
            {
              MISSION_FIELD_LIMITS
                .objectives.max
            }{" "}
            celów.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={
            saving ||
            maximumReached
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPlus />
          Dodaj cel
        </button>
      </div>

      <div className="space-y-3">
        {objectives.map(
          (objective, index) => (
            <div
              key={objective.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 md:flex-row"
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label
                    htmlFor={`mission-objective-${objective.id}`}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Cel {index + 1}
                  </label>

                  <span className="text-xs text-gray-500">
                    {
                      String(
                        objective.text || ""
                      ).length
                    }
                    /
                    {
                      MISSION_FIELD_LIMITS
                        .objective.max
                    }
                  </span>
                </div>

                <input
                  id={`mission-objective-${objective.id}`}
                  type="text"
                  required
                  minLength={
                    MISSION_FIELD_LIMITS
                      .objective.min
                  }
                  maxLength={
                    MISSION_FIELD_LIMITS
                      .objective.max
                  }
                  value={objective.text}
                  onChange={(event) =>
                    onChange(
                      index,
                      "text",
                      event.target.value
                    )
                  }
                  placeholder={`Cel ${index + 1}`}
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 md:self-end md:pb-3">
                <input
                  type="checkbox"
                  checked={
                    objective.required !==
                    false
                  }
                  onChange={(event) =>
                    onChange(
                      index,
                      "required",
                      event.target.checked
                    )
                  }
                  disabled={saving}
                />

                Wymagany
              </label>

              <button
                type="button"
                onClick={() =>
                  onRemove(index)
                }
                disabled={
                  saving ||
                  objectives.length === 1
                }
                className="inline-flex items-center justify-center gap-2 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40 md:self-end md:pb-3"
                aria-label={`Usuń cel ${index + 1}`}
              >
                <FaTrash />
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default MissionObjectivesEditor;