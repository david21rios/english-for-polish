// src/components/support/SupportSubmitButton.jsx

import { FaPaperPlane } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

/**
 * Displays the submit button for the support form.
 *
 * @param {{
 *   isSubmitting?: boolean,
 *   disabled?: boolean,
 *   label?: string
 * }} props
 * @returns {JSX.Element}
 */
const SupportSubmitButton = ({
  isSubmitting = false,
  disabled = false,
  label = "Wyślij zgłoszenie"
}) => {
  const isDisabled =
    disabled || isSubmitting;

  return (
    <div className="flex justify-end">

      <button
        type="submit"
        disabled={isDisabled}
        className="
          inline-flex
          min-w-[220px]
          items-center
          justify-center
          gap-3
          rounded-xl
          bg-primary-600
          px-6
          py-3
          font-semibold
          text-white
          shadow-md
          transition-all
          duration-200
          hover:bg-primary-700
          hover:shadow-lg
          focus:outline-none
          focus:ring-4
          focus:ring-primary-200
          disabled:cursor-not-allowed
          disabled:bg-gray-400
          disabled:shadow-none
        "
      >
        {isSubmitting ? (
          <>
            <ImSpinner2
              className="animate-spin text-lg"
              aria-hidden="true"
            />

            <span>
              Wysyłanie...
            </span>
          </>
        ) : (
          <>
            <FaPaperPlane
              aria-hidden="true"
            />

            <span>
              {label}
            </span>
          </>
        )}
      </button>

    </div>
  );
};

export default SupportSubmitButton;