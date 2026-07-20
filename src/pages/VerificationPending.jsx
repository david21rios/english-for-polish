// src/pages/VerificationPending.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  reload,
  sendEmailVerification,
  signOut
} from "firebase/auth";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaEnvelope,
  FaRedo,
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

  const [isLeaving, setIsLeaving] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage
  ] = useState("");

  useEffect(() => {
    if (!user) {
      navigate(
        "/login",
        {
          replace: true
        }
      );
    }
  }, [
    navigate,
    user
  ]);

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleResendEmail =
    async () => {
      if (
        !user ||
        isSending
      ) {
        return;
      }

      clearMessages();
      setIsSending(true);

      try {
        await sendEmailVerification(
          user
        );

        setSuccessMessage(
          "Wysłaliśmy nową wiadomość weryfikacyjną. Sprawdź swoją skrzynkę odbiorczą oraz folder Spam."
        );
      } catch (error) {
          console.error(
            "Email verification resend failed:",
            error
          );
        
          if (
            error?.code ===
            "auth/too-many-requests"
          ) {
            setErrorMessage(
              "Wysłano zbyt wiele próśb w krótkim czasie. Poczekaj kilka minut przed ponownym wysłaniem wiadomości weryfikacyjnej."
            );
          
            return;
          }
        
          setErrorMessage(
            handleError(error)
          );
        } finally {
          setIsSending(false);
        }
    };

  const handleCheckVerification =
    async () => {
      if (
        !user ||
        isChecking
      ) {
        return;
      }

      clearMessages();
      setIsChecking(true);

      try {
        await reload(user);

        if (
          auth.currentUser
            ?.emailVerified
        ) {
          navigate(
            "/home",
            {
              replace: true
            }
          );

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

  const signOutAndGoToLogin =
    async () => {
      if (isLeaving) {
        return;
      }

      clearMessages();
      setIsLeaving(true);

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }

        navigate(
          "/login",
          {
            replace: true,
            state: {
              email
            }
          }
        );
      } catch (error) {
        console.error(
          "User sign out failed:",
          error
        );

        setErrorMessage(
          handleError(error)
        );

        setIsLeaving(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-4xl text-primary-600">
            <FaEnvelope />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Zweryfikuj swój adres e-mail
          </h1>

          <p className="mt-4 leading-relaxed text-gray-600">
            Wysłaliśmy wiadomość
            weryfikacyjną na adres:
          </p>

          <p className="mt-2 break-all font-semibold text-primary-600">
            {email}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-gray-500">
            Przed rozpoczęciem korzystania
            z platformy musisz zweryfikować
            swój adres e-mail. Otwórz swoją
            skrzynkę odbiorczą lub folder
            Spam, kliknij link
            weryfikacyjny, a następnie wróć
            tutaj.
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
            onClick={
              handleCheckVerification
            }
            disabled={
              isChecking ||
              isSending ||
              isLeaving
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaCheckCircle />

            {isChecking
              ? "Sprawdzanie..."
              : "Adres e-mail został już zweryfikowany"}
          </button>

          <button
            type="button"
            onClick={
              handleResendEmail
            }
            disabled={
              isSending ||
              isChecking ||
              isLeaving
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaRedo />

            {isSending
              ? "Wysyłanie..."
              : "Wyślij wiadomość ponownie"}
          </button>

          <button
            type="button"
            onClick={
              signOutAndGoToLogin
            }
            disabled={isLeaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSignOutAlt />

            {isLeaving
              ? "Wylogowywanie..."
              : "Wyloguj się"}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={
                signOutAndGoToLogin
              }
              disabled={isLeaving}
              className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaArrowLeft />

              Powrót do logowania
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationPending;