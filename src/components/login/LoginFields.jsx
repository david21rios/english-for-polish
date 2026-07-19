// src/components/login/LoginFields.jsx

import { FaEnvelope } from "react-icons/fa";

import PasswordField from "./PasswordField";

/**
 * Input fields used by the login form.
 *
 * @param {object} props
 * @param {string} props.email
 * @param {(value: string) => void} props.onEmailChange
 * @param {string} props.password
 * @param {(value: string) => void} props.onPasswordChange
 * @param {boolean} props.showPassword
 * @param {() => void} props.onTogglePassword
 * @param {boolean} props.disabled
 */
function LoginFields({
  email = "",
  onEmailChange,
  password = "",
  onPasswordChange,
  showPassword = false,
  onTogglePassword,
  disabled = false
}) {
  const handleEmailChange = (event) => {
    if (typeof onEmailChange === "function") {
      onEmailChange(event.target.value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FaEnvelope
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>

        <input
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
          disabled={disabled}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          inputMode="email"
          placeholder="Adres e-mail"
          className="
            relative
            block
            w-full
            appearance-none
            rounded-lg
            border
            border-gray-300
            bg-white/50
            py-2
            pl-10
            pr-3
            text-gray-900
            placeholder-gray-500
            focus:border-primary-500
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            disabled:opacity-70
            sm:text-sm
          "
        />
      </div>

      <PasswordField
        value={password}
        onChange={onPasswordChange}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        disabled={disabled}
        autoComplete="current-password"
        placeholder="Hasło"
      />
    </div>
  );
}

export default LoginFields;