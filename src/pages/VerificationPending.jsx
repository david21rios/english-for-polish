import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  sendEmailVerification,
  reload,
  signOut
} from "firebase/auth";

import {
  FaEnvelope,
  FaRedo,
  FaCheckCircle,
  FaArrowLeft,
  FaSignOutAlt
} from "react-icons/fa";

import { auth } from "../firebase";

import {
  handleError
} from "../utils/errorHandling";

function VerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = auth.currentUser;

  const email =
    location.state?.email ||
    user?.email ||
    "";

  const [isSending, setIsSending] =
    useState(false);

  const [isChecking, setIsChecking] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleResendEmail = async () => {
    if (!user) {
      return;
    }

    clearMessages();

    try {
      setIsSending(true);

      await sendEmailVerification(user);

      setSuccessMessage(
        "Wysłaliśmy nową wiadomość weryfikacyjną. Sprawdź swoją skrzynkę odbiorczą oraz folder Spam."
      );
    } catch (error) {
      console.error(
        "Email verification resend failed:",
        error
      );

      setErrorMessage(
        handleError(error)
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) {
      return;
    }

    clearMessages();

    try {
      setIsChecking(true);

      await reload(user);

      if (auth.currentUser?.emailVerified) {
        navigate("/home");
        return;
      }

      setErrorMessage(
        "Adres e-mail nie został jeszcze zweryfikowany. Otwórz wiadomość e-mail, kliknij link weryfikacyjny, a następnie wróć do aplikacji."
      );

    } catch (error) {

      console.error(
        "Email verification check failed:",
        error
      );

      setErrorMessage(
        handleError(error)
      );

    } finally {

      setIsChecking(false);

    }
  };

  const handleLogout = async () => {

    try {

      await signOut(auth);

      navigate("/login");

    } catch (error) {

      console.error(
        "User sign out failed:",
        error
      );

      setErrorMessage(
        handleError(error)
      );

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4 py-12">

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 w-full max-w-lg p-8">

        <div className="text-center">

          <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl mb-6">
            <FaEnvelope />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Zweryfikuj swój adres e-mail
          </h1>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Wysłaliśmy wiadomość weryfikacyjną na adres:
          </p>

          <p className="mt-2 font-semibold text-primary-600 break-all">
            {email}
          </p>

          <p className="mt-6 text-sm text-gray-500 leading-relaxed">
            Przed rozpoczęciem korzystania z platformy musisz zweryfikować swój adres e-mail.
            Otwórz swoją skrzynkę odbiorczą (lub folder Spam), kliknij link weryfikacyjny,
            a następnie wróć tutaj.
          </p>

        </div>

        {successMessage && (

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            {successMessage}

          </div>

        )}

        {errorMessage && (

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {errorMessage}

          </div>

        )}

        <div className="mt-8 space-y-4">

          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={isChecking}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50"
          >

            <FaCheckCircle />

            {isChecking
              ? "Sprawdzanie..."
              : "Adres e-mail został już zweryfikowany"}

          </button>

          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isSending}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50"
          >

            <FaRedo />

            {isSending
              ? "Wysyłanie..."
              : "Wyślij wiadomość ponownie"}

          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-2xl transition-colors"
          >

            <FaSignOutAlt />

            Wyloguj się

          </button>

          <div className="pt-2 text-center">

            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700"
            >

              <FaArrowLeft />

              Powrót do logowania

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default VerificationPending;