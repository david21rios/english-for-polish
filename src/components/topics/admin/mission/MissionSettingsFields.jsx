// src/components/topics/admin/mission/MissionSettingsFields.jsx

import {
  AGE_GROUP_OPTIONS,
  CEFR_LEVEL_OPTIONS,
  DIFFICULTY_OPTIONS,
  MISSION_FIELD_LIMITS,
  MISSION_STATUS_OPTIONS
} from "./missionFormConfig";

const MissionSettingsFields = ({
  formData,
  saving,
  onChange
}) => {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="mission-level"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Poziom
          </label>

          <select
            id="mission-level"
            name="level"
            value={formData.level}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CEFR_LEVEL_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="mission-difficulty"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Trudność
          </label>

          <select
            id="mission-difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {DIFFICULTY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="mission-xp"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            XP
          </label>

          <input
            id="mission-xp"
            type="number"
            name="xpReward"
            min={
              MISSION_FIELD_LIMITS.xpReward.min
            }
            max={
              MISSION_FIELD_LIMITS.xpReward.max
            }
            step="1"
            required
            value={formData.xpReward}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="mission-minutes"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Minuty
          </label>

          <input
            id="mission-minutes"
            type="number"
            name="estimatedMinutes"
            min={
              MISSION_FIELD_LIMITS
                .estimatedMinutes.min
            }
            max={
              MISSION_FIELD_LIMITS
                .estimatedMinutes.max
            }
            step="1"
            required
            value={
              formData.estimatedMinutes
            }
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="mission-order"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Kolejność
          </label>

          <input
            id="mission-order"
            type="number"
            name="order"
            min={
              MISSION_FIELD_LIMITS.order.min
            }
            max={
              MISSION_FIELD_LIMITS.order.max
            }
            step="1"
            required
            value={formData.order}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="mission-age-group"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Grupa wiekowa
          </label>

          <select
            id="mission-age-group"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {AGE_GROUP_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="mission-status"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Status
          </label>

          <select
            id="mission-status"
            name="status"
            value={formData.status}
            onChange={onChange}
            disabled={saving}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {MISSION_STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    </>
  );
};

export default MissionSettingsFields;