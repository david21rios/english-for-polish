// src/components/login/LoginButton.jsx

/**
 * Submit button used by the login form.
 *
 * @param {object} props
 * @param {boolean} props.loading
 */
function LoginButton({
  loading = false
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        group
        relative
        flex
        w-full
        justify-center
        rounded-lg
        border
        border-transparent
        bg-primary-600
        px-4
        py-3
        text-sm
        font-medium
        text-white
        transition-all
        duration-200
        hover:scale-[1.02]
        hover:bg-primary-700
        focus:outline-none
        focus:ring-2
        focus:ring-primary-500
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:hover:scale-100
        disabled:hover:bg-primary-600
      "
      aria-busy={loading}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-white/40
              border-t-white
            "
            aria-hidden="true"
          />

          <span>
            Logowanie...
          </span>
        </span>
      ) : (
        "Zaloguj się"
      )}
    </button>
  );
}

export default LoginButton;