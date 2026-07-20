// src/components/login/LoginHeader.jsx

import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

/**
 * Reusable authentication page header.
 *
 * @param {object} props
 * @param {Function} props.onGoBack
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} props.linkText
 * @param {string} props.linkTo
 * @param {object|null} props.linkState
 */
function LoginHeader({
  onGoBack,
  title,
  subtitle,
  linkText,
  linkTo,
  linkState = null
}) {
  const handleGoBack = () => {
    if (typeof onGoBack === "function") {
      onGoBack();
    }
  };

  return (
    <>
      {typeof onGoBack === "function" && (
        <button
          type="button"
          onClick={handleGoBack}
          className="
            absolute
            top-6
            left-6
            z-20
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-white/70
            px-4
            py-2
            font-medium
            text-gray-700
            shadow-sm
            backdrop-blur
            transition-colors
            duration-200
            hover:text-primary-600
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
          "
        >
          <FaArrowLeft aria-hidden="true" />
            
          <span>Wstecz</span>
        </button>
      )}

      <header>
        <h1 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
          {title}
        </h1>

        {(subtitle || linkText) && (
          <p className="mt-2 text-center text-sm text-gray-600">

            {subtitle}{" "}

            {linkText && (
              <Link
                to={linkTo}
                state={linkState}
                className="
                  font-medium
                  text-primary-600
                  transition-colors
                  duration-200
                  hover:text-primary-500
                  focus:outline-none
                  focus:underline
                "
              >
                {linkText}
              </Link>
            )}

          </p>
        )}
      </header>
    </>
  );
}

export default LoginHeader;