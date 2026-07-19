// src/components/login/ForgotPasswordForm.jsx

import EmailField from "./EmailField";
import ResetPasswordButton from "./ResetPasswordButton";

/**
 * Forgot password form.
 *
 * @param {object} props
 * @param {Function} props.onSubmit
 * @param {string} props.email
 * @param {Function} props.onEmailChange
 * @param {boolean} props.loading
 * @param {string} props.error
 * @param {string} props.success
 */
function ForgotPasswordForm({
  onSubmit,
  email,
  onEmailChange,
  loading = false,
  error = "",
  success = ""
}) {
  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={onSubmit}
      noValidate
    >
      <div>
        <p className="text-sm text-center text-gray-600 leading-relaxed">
          Podaj adres e-mail powiązany z kontem.
          Wyślemy Ci wiadomość z linkiem umożliwiającym
          ustawienie nowego hasła.
        </p>
      </div>

      <EmailField
        value={email}
        onChange={onEmailChange}
        disabled={loading}
      />

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

      {success && (
        <div
          className="rounded-md bg-green-50 p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-green-700">
            {success}
          </p>
        </div>
      )}

      <ResetPasswordButton
        loading={loading}
      />
    </form>
  );
}

export default ForgotPasswordForm;