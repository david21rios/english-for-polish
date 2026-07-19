import { FaEnvelope } from "react-icons/fa";

function AccountSection({
  email,
  setEmail,
  handleEmailChange,
  emailError,
  emailWarning,
  isEmailValidState
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaEnvelope
          className={`h-5 w-5 ${
            emailError
              ? "text-red-400"
              : isEmailValidState
              ? "text-green-500"
              : "text-gray-400"
          }`}
        />
      </div>

      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="Adres e-mail"
        className={`appearance-none relative block w-full pl-10 pr-3 py-2
          rounded-lg
          placeholder-gray-500
          text-gray-900
          bg-white/50
          border
          ${
            emailError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : isEmailValidState
              ? "border-green-300 focus:border-green-500 focus:ring-green-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          }
          focus:outline-none
          focus:ring-2
          sm:text-sm`}
      />

      {emailError && (
        <p className="mt-1 text-sm text-red-600">
          {emailError}
        </p>
      )}

      {!emailError && emailWarning && (
        <p className="mt-1 text-sm text-yellow-600">
          {emailWarning}
        </p>
      )}

      {!emailError && !emailWarning && isEmailValidState && (
        <p className="mt-1 text-sm text-green-600">
          Adres e-mail wygląda poprawnie.
        </p>
      )}
    </div>
  );
}

export default AccountSection;