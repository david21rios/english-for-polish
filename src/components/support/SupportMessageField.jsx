// src/components/support/SupportMessageField.jsx

/**
 * Displays the support ticket message field.
 *
 * @param {{
 *   value: string,
 *   onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
 *   error?: string,
 *   disabled?: boolean,
 *   maxLength?: number,
 *   minLength?: number
 * }} props
 * @returns {JSX.Element}
 */
const SupportMessageField = ({
  value,
  onChange,
  error = "",
  disabled = false,
  maxLength = 1000,
  minLength = 20
}) => {
  const currentLength =
    typeof value === "string"
      ? value.length
      : 0;

  const hasMinimumLength =
    currentLength >= minLength;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor="support-message"
          className="block text-sm font-semibold text-gray-700"
        >
          Opis zgłoszenia
        </label>

        <span
          className={`
            shrink-0
            text-xs
            ${
              currentLength > 0 &&
              !hasMinimumLength
                ? "text-amber-600"
                : "text-gray-500"
            }
          `}
        >
          {currentLength}/{maxLength}
        </span>
      </div>

      <textarea
        id="support-message"
        name="message"
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={7}
        minLength={minLength}
        maxLength={maxLength}
        placeholder="Opisz dokładnie, co się wydarzyło, jakiego rezultatu oczekiwałeś i jakie kroki wykonałeś..."
        aria-invalid={Boolean(error)}
        aria-describedby={[
          "support-message-help",
          error
            ? "support-message-error"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        className={`
          min-h-44
          w-full
          resize-y
          rounded-xl
          border
          bg-white
          px-4
          py-3
          leading-7
          text-gray-900
          placeholder:text-gray-400
          transition
          focus:outline-none
          focus:ring-2
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
          }
        `}
      />

      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <p
          id="support-message-help"
          className="text-sm leading-6 text-gray-500"
        >
          Podaj szczegóły, które pomogą nam odtworzyć i rozwiązać problem.
        </p>

        {currentLength > 0 &&
          !hasMinimumLength &&
          !error && (
            <p className="shrink-0 text-sm text-amber-600">
              Minimum: {minLength} znaków
            </p>
          )}
      </div>

      {error && (
        <p
          id="support-message-error"
          role="alert"
          className="mt-2 text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default SupportMessageField;