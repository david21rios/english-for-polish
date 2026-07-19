// src/components/topics/admin/mission/MissionTagsField.jsx

import {
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

const MissionTagsField = ({
  value,
  saving,
  onChange
}) => {
  const parsedTags =
    String(value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor="mission-tags"
          className="block text-sm font-semibold text-gray-700"
        >
          Tagi
        </label>

        <span className="text-xs text-gray-500">
          {parsedTags.length}/
          {
            MISSION_FIELD_LIMITS.tags.maxItems
          }
        </span>
      </div>

      <input
        id="mission-tags"
        type="text"
        name="tags"
        value={value}
        onChange={onChange}
        placeholder="family, introductions, conversation"
        disabled={saving}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Oddziel tagi przecinkami. Zostaną
        zapisane małymi literami, bez
        duplikatów. Maksymalnie{" "}
        {
          MISSION_FIELD_LIMITS.tags.maxItems
        }{" "}
        tagów.
      </p>
    </div>
  );
};

export default MissionTagsField;