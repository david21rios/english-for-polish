// src/components/login/LoginForm.jsx

import { Link } from "react-router-dom";

import LoginFields from "./LoginFields";
import LoginButton from "./LoginButton";

/**
 * Login form component.
 *
 * @param {object} props
 * @param {Function} props.onSubmit
 * @param {string} props.email
 * @param {Function} props.onEmailChange
 * @param {string} props.password
 * @param {Function} props.onPasswordChange
 * @param {boolean} props.showPassword
 * @param {Function} props.onTogglePassword
 * @param {boolean} props.loading
 * @param {string} props.error
 * @param {object|null} props.forgotPasswordState
 */
function LoginForm({
  onSubmit,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  loading = false,
  error = "",
  forgotPasswordState = null
}) {
  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={onSubmit}
      noValidate
    >
      <LoginFields
        email={email}
        onEmailChange={onEmailChange}
        password={password}
        onPasswordChange={onPasswordChange}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        disabled={loading}
      />

      <div className="flex items-center justify-between">
        <Link
          to="/forgot-password"
          state={forgotPasswordState}
          className="
            text-sm
            font-medium
            text-primary-600
            transition-colors
            duration-200
            hover:text-primary-500
            focus:outline-none
            focus:underline
          "
        >
          Nie pamiętasz hasła?
        </Link>
      </div>

      {error && (
        <div
          className="rounded-md bg-red-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <LoginButton
        loading={loading}
      />
    </form>
  );
}

export default LoginForm;