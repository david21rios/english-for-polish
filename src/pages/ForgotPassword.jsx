// src/pages/ForgotPassword.jsx

import { useState } from "react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";
import {
  sendPasswordResetEmail
} from "firebase/auth";

import { auth } from "../firebase";

import LoginHeader from "../components/login/LoginHeader";
import ForgotPasswordForm from "../components/login/ForgotPasswordForm";

import {
  validateForgotPasswordForm,
  getFriendlyForgotPasswordError,
  getForgotPasswordSuccessMessage
} from "../components/login/forgotPasswordValidation";

/**
 * Password recovery page.
 *
 * Allows the user to request a Firebase Authentication
 * password reset email.
 */
function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState(location.state?.email || "");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /**
   * Updates the email field and clears old messages.
   *
   * @param {string} value
   */
  const handleEmailChange = (value) => {
    setEmail(value);

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  /**
   * Returns the user to the login page.
   */
  const handleGoBack = () => {
    navigate("/login", {
      state: {
        from:
          location.state?.from ||
          location
      }
    });
  };

  /**
   * Sends the password reset email.
   *
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const validation =
      validateForgotPasswordForm({
        email
      });

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(
        auth,
        validation.normalizedEmail
      );

      setEmail(
        validation.normalizedEmail
      );

      setSuccess(
        getForgotPasswordSuccessMessage()
      );
    } catch (firebaseError) {
      console.error(
        "Password reset request failed:",
        firebaseError
      );

      setError(
        getFriendlyForgotPasswordError(
          firebaseError?.code
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-gradient-to-br
        from-primary-50
        via-white
        to-secondary-50
        px-4
        py-12
        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          absolute
          -left-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-primary-200/40
          blur-3xl
        "
        aria-hidden="true"
      />

      <div
        className="
          absolute
          -bottom-24
          -right-24
          h-72
          w-72
          rounded-full
          bg-secondary-200/40
          blur-3xl
        "
        aria-hidden="true"
      />

      <LoginHeader
        onGoBack={handleGoBack}
        title="Reset hasła"
        subtitle="Pamiętasz już hasło?"
        linkText="Zaloguj się"
        linkTo="/login"
        linkState={{
          from:
            location.state?.from ||
            location,
          email
        }}
      />

      <main
        className="
          relative
          z-10
          flex
          min-h-[calc(100vh-6rem)]
          items-center
          justify-center
        "
      >
        <section
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-white/60
            bg-white/80
            px-6
            py-8
            shadow-xl
            backdrop-blur-md
            sm:px-10
          "
          aria-labelledby="forgot-password-title"
        >
          <div className="text-center">
            <h2
              id="forgot-password-title"
              className="
                text-2xl
                font-heading
                font-bold
                text-gray-900
              "
            >
              Odzyskaj dostęp do konta
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-gray-600
              "
            >
              Wprowadź adres e-mail użyty podczas
              rejestracji.
            </p>
          </div>

          <ForgotPasswordForm
            onSubmit={handleSubmit}
            email={email}
            onEmailChange={handleEmailChange}
            loading={loading}
            error={error}
            success={success}
          />
        </section>
      </main>
    </div>
  );
}

export default ForgotPassword;