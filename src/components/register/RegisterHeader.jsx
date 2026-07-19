import { Link } from "react-router-dom";

function RegisterHeader({ location }) {
  return (
    <div className="space-y-3">
      <h1 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
        Utwórz konto
      </h1>

      <p className="text-center text-sm text-gray-600 leading-relaxed">
        Załóż bezpłatne konto i rozpocznij naukę języka polskiego.
      </p>

      <p className="text-center text-sm text-gray-600">
        Masz już konto?{" "}
        <Link
          to="/login"
          state={{ from: location?.state?.from || location }}
          className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}

export default RegisterHeader;