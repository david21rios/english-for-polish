function RegisterButton({ loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
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
      "
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />

            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>

          Tworzenie konta...
        </span>
      ) : (
        "Utwórz konto"
      )}
    </button>
  );
}

export default RegisterButton;