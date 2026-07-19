// src/components/support/SupportSubjectField.jsx

/**
 * Displays the support ticket subject field.
 *
 * @param {{
 *   value: string,
 *   onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
 *   error?: string,
 *   disabled?: boolean,
 *   maxLength?: number
 * }} props
 * @returns {JSX.Element}
 */
const SupportSubjectField = ({
  value,
  onChange,
  error = "",
  disabled = false,
  maxLength = 120
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="support-subject"
          className="block text-sm font-semibold text-gray-700"
        >
          Temat zgłoszenia
        </label>

        <span className="text-xs text-gray-500">
          {value.length}/{maxLength}
        </span>
      </div>

      <input
        id="support-subject"
        name="subject"
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
        placeholder="Krótko opisz problem..."
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? "support-subject-error"
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
          placeholder:text-gray-400
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
      />

      {error && (
        <p
          id="support-subject-error"
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default SupportSubjectField;