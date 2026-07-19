// src/components/support/SupportCategorySelect.jsx

import {
  SUPPORT_CATEGORIES
} from "../../services/support";

/**
 * Displays the support category selector.
 *
 * @param {{
 *   value: string,
 *   onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void,
 *   error?: string,
 *   disabled?: boolean
 * }} props
 * @returns {JSX.Element}
 */
const SupportCategorySelect = ({
  value,
  onChange,
  error = "",
  disabled = false
}) => {
  return (
    <div>

      <label
        htmlFor="support-category"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Kategoria zgłoszenia
      </label>

      <select
        id="support-category"
        name="category"
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? "support-category-error"
            : undefined
        }
        className={`
          w-full
          rounded-xl
          border
          bg-white
          px-4
          py-3
          text-gray-900
          transition
          focus:outline-none
          focus:ring-2
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          ${
            error
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
          }
        `}
      >

        <option value="">
          Wybierz kategorię...
        </option>

        {SUPPORT_CATEGORIES.map(
          (
            category
          ) => (
            <option
              key={category.value}
              value={category.value}
            >
              {category.label}
            </option>
          )
        )}

      </select>

      {error && (
        <p
          id="support-category-error"
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

    </div>
  );
};

export default SupportCategorySelect;