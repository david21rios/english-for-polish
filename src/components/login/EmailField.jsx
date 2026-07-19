// src/components/login/EmailField.jsx

import { FaEnvelope } from "react-icons/fa";

/**
 * Reusable email input field.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value:string)=>void} props.onChange
 * @param {boolean} props.disabled
 * @param {string} props.placeholder
 * @param {string} props.autoComplete
 */
function EmailField({
  value = "",
  onChange,
  disabled = false,
  placeholder = "Adres e-mail",
  autoComplete = "email"
}) {
  const handleChange = (event) => {
    if (typeof onChange === "function") {
      onChange(event.target.value);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <FaEnvelope
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </div>

      <input
        id="email"
        name="email"
        type="email"
        value={value}
        onChange={handleChange}
        required
        disabled={disabled}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        inputMode="email"
        placeholder={placeholder}
        className="
          appearance-none
          relative
          block
          w-full
          rounded-lg
          border
          border-gray-300
          bg-white/50
          py-2
          pl-10
          pr-3
          text-gray-900
          placeholder-gray-500
          focus:outline-none
          focus:ring-2
          focus:ring-primary-500
          focus:border-primary-500
          disabled:bg-gray-100
          disabled:opacity-70
          disabled:cursor-not-allowed
          sm:text-sm
        "
      />
    </div>
  );
}

export default EmailField;