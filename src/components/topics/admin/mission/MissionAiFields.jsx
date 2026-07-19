// src/components/topics/admin/mission/MissionAiFields.jsx

import {
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

const MissionAiFields = ({
  formData,
  saving,
  onChange
}) => {
  const instructionsLength =
    String(
      formData.aiInstructions || ""
    ).length;

  const required =
    formData.status === "published";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor="mission-ai-instructions"
          className="block text-sm font-semibold text-gray-700"
        >
          Instrukcje dla AI
          {required && (
            <span className="ml-1 text-red-600">
              *
            </span>
          )}
        </label>

        <span
          className={`text-xs ${
            instructionsLength >
            MISSION_FIELD_LIMITS
              .aiInstructions.max
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {instructionsLength}/
          {
            MISSION_FIELD_LIMITS
              .aiInstructions.max
          }
        </span>
      </div>

      <textarea
        id="mission-ai-instructions"
        name="aiInstructions"
        required={required}
        minLength={
          required
            ? MISSION_FIELD_LIMITS
                .aiInstructions.min
            : undefined
        }
        maxLength={
          MISSION_FIELD_LIMITS
            .aiInstructions.max
        }
        value={
          formData.aiInstructions
        }
        onChange={onChange}
        rows="6"
        placeholder="Np. Do not correct during the conversation. Keep the role. Provide feedback only after mission completion."
        disabled={saving}
        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Instrukcje są obowiązkowe dla
        opublikowanej misji. Określ rolę,
        poziom języka, sposób prowadzenia
        rozmowy i moment przekazania
        informacji zwrotnej.
      </p>
    </div>
  );
};

export default MissionAiFields;