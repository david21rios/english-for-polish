// src/components/login/PasswordField.jsx

import {
  FaEye,
  FaEyeSlash,
  FaLock
} from "react-icons/fa";

/**
 * Password input field.
 *
 * Reusable component for authentication pages.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value:string)=>void} props.onChange
 * @param {boolean} props.showPassword
 * @param {()=>void} props.onTogglePassword
 * @param {boolean} props.disabled
 * @param {string} props.autoComplete
 * @param {string} props.placeholder
 */
function PasswordField({
  value = "",
  onChange,
  showPassword = false,
  onTogglePassword,
  disabled = false,
  autoComplete = "current-password",
  placeholder = "Hasło"
}) {
  const handleChange = (event) => {
    if (typeof onChange === "function") {
      onChange(event.target.value);
    }
  };

  const handleToggle = () => {
    if (typeof onTogglePassword === "function") {
      onTogglePassword();
    }
  };

  return (
    <div className="relative">

      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaLock className="h-5 w-5 text-gray-400" />
      </div>

      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={handleChange}
        required
        disabled={disabled}
        autoComplete={autoComplete}
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
          pr-10
          text-gray-900
          placeholder-gray-500
          focus:border-primary-500
          focus:outline-none
          focus:ring-2
          focus:ring-primary-500
          sm:text-sm
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          disabled:opacity-70
        "
      />

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="
          absolute
          inset-y-0
          right-0
          flex
          items-center
          pr-3
          text-gray-400
          transition-colors
          hover:text-primary-600
          disabled:cursor-not-allowed
          disabled:hover:text-gray-400
        "
        aria-label={
          showPassword
            ? "Ukryj hasło"
            : "Pokaż hasło"
        }
      >
        {showPassword ? (
          <FaEyeSlash className="h-5 w-5" />
        ) : (
          <FaEye className="h-5 w-5" />
        )}
      </button>

    </div>
  );
}

export default PasswordField;