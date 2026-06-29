// src/pages/ForgotPassword.jsx

import { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

const validateEmail = (email = "") => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().toLowerCase());
};

const getFriendlyResetError = (errorCode) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "El correo electrónico no tiene un formato válido.";

    case "auth/too-many-requests":
      return "Has realizado demasiados intentos. Espera un momento e inténtalo nuevamente.";

    default:
      return "Si el correo está registrado, recibirás las instrucciones de recuperación.";
  }
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/login");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmail(cleanEmail)) {
      setError("Ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: `${window.location.origin}/login`
      });

      setMessage(
        "Si el correo está registrado, recibirás un enlace de recuperación en tu bandeja de entrada."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setError(getFriendlyResetError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100">
        <div className="absolute inset-0 bg-grid-primary/[0.05] bg-[size:20px_20px]" />
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-accent-yellow rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <button
        type="button"
        onClick={handleGoBack}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium bg-white/70 backdrop-blur px-4 py-2 rounded-full shadow-sm"
      >
        <FaArrowLeft />
        Back
      </button>

      <div className="relative max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
              Recuperar contraseña
            </h1>

            <p className="mt-2 text-center text-sm text-gray-600 leading-relaxed">
              Ingresa tu correo electrónico. Si está registrado, enviaremos un
              enlace para restablecer tu contraseña.
            </p>
          </div>

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="rounded-md space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                state={{ from: location.state?.from || null }}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;