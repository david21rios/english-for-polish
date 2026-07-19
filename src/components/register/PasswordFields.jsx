import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

function PasswordFields({
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        <input
          id="register-password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Hasło"
          aria-label="Hasło"
          className="appearance-none relative block w-full pl-10 pr-11 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previousValue) => !previousValue)}
          aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md"
        >
          {showPassword ? (
            <FaEyeSlash className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FaEye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="-mt-2 text-xs text-gray-500">
        Hasło musi zawierać co najmniej 6 znaków.
      </p>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        <input
          id="register-confirm-password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Potwierdź hasło"
          aria-label="Potwierdź hasło"
          className="appearance-none relative block w-full pl-10 pr-11 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />

        <button
          type="button"
          onClick={() =>
            setShowConfirmPassword((previousValue) => !previousValue)
          }
          aria-label={
            showConfirmPassword
              ? "Ukryj potwierdzenie hasła"
              : "Pokaż potwierdzenie hasła"
          }
          aria-pressed={showConfirmPassword}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md"
        >
          {showConfirmPassword ? (
            <FaEyeSlash className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FaEye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default PasswordFields;