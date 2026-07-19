// src/components/topics/admin/mission/MissionBasicFields.jsx

import {
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

const CharacterCounter = ({
  value,
  maximum
}) => {
  const length =
    String(value || "").length;

  return (
    <span
      className={`text-xs ${
        length > maximum
          ? "text-red-600"
          : "text-gray-500"
      }`}
    >
      {length}/{maximum}
    </span>
  );
};

const MissionBasicFields = ({
  formData,
  saving,
  onChange
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="mission-title"
              className="block text-sm font-semibold text-gray-700"
            >
              Tytuł
            </label>

            <CharacterCounter
              value={formData.title}
              maximum={
                MISSION_FIELD_LIMITS.title.max
              }
            />
          </div>

          <input
            id="mission-title"
            type="text"
            name="title"
            required
            minLength={
              MISSION_FIELD_LIMITS.title.min
            }
            maxLength={
              MISSION_FIELD_LIMITS.title.max
            }
            value={formData.title}
            onChange={onChange}
            placeholder="Np. Meeting your partner's parents"
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="mission-ai-role"
              className="block text-sm font-semibold text-gray-700"
            >
              Rola AI
            </label>

            <CharacterCounter
              value={formData.aiRole}
              maximum={
                MISSION_FIELD_LIMITS.aiRole.max
              }
            />
          </div>

          <input
            id="mission-ai-role"
            type="text"
            name="aiRole"
            required
            minLength={
              MISSION_FIELD_LIMITS.aiRole.min
            }
            maxLength={
              MISSION_FIELD_LIMITS.aiRole.max
            }
            value={formData.aiRole}
            onChange={onChange}
            placeholder="Np. Mother of your partner"
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="mission-description"
            className="block text-sm font-semibold text-gray-700"
          >
            Krótki opis
          </label>

          <CharacterCounter
            value={formData.description}
            maximum={
              MISSION_FIELD_LIMITS.description.max
            }
          />
        </div>

        <textarea
          id="mission-description"
          name="description"
          required
          minLength={
            MISSION_FIELD_LIMITS.description.min
          }
          maxLength={
            MISSION_FIELD_LIMITS.description.max
          }
          value={formData.description}
          onChange={onChange}
          rows="3"
          placeholder="Opisz, co student będzie ćwiczyć."
          disabled={saving}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="mission-scenario"
            className="block text-sm font-semibold text-gray-700"
          >
            Scenariusz
          </label>

          <CharacterCounter
            value={formData.scenario}
            maximum={
              MISSION_FIELD_LIMITS.scenario.max
            }
          />
        </div>

        <textarea
          id="mission-scenario"
          name="scenario"
          required
          minLength={
            MISSION_FIELD_LIMITS.scenario.min
          }
          maxLength={
            MISSION_FIELD_LIMITS.scenario.max
          }
          value={formData.scenario}
          onChange={onChange}
          rows="5"
          placeholder="Np. You are visiting your partner's parents for the first time..."
          disabled={saving}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </>
  );
};

export default MissionBasicFields;