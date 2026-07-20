// src/pages/NotFound.jsx

import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/home", {
      replace: true
    });
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">
          Błąd 404
        </p>

        <h1 className="mt-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          Nie znaleziono strony
        </h1>

        <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
          Strona, której szukasz, nie istnieje, została przeniesiona
          albo podany adres jest nieprawidłowy.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGoHome}
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              bg-primary-600
              px-6
              py-3
              font-medium
              text-white
              transition-colors
              hover:bg-primary-700
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500
              focus:ring-offset-2
            "
          >
            Przejdź do strony głównej
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              border
              border-gray-300
              bg-white
              px-6
              py-3
              font-medium
              text-gray-700
              transition-colors
              hover:bg-gray-50
              focus:outline-none
              focus:ring-2
              focus:ring-gray-400
              focus:ring-offset-2
            "
          >
            Wróć
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;