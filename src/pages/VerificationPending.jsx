// src/pages/VerificationPending.jsx

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

function VerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const user = auth.currentUser;

  const email =
    location.state?.email ||
    user?.email ||
    "your email";

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleResendEmail = async () => {
    try {
      if (!user) return;

      setIsSending(true);
      setSuccessMessage("");

      await sendEmailVerification(user);

      setSuccessMessage(
        "Verification email sent successfully. Please check your inbox."
      );
    } catch (error) {
      console.error("Error sending verification email:", error);

      setSuccessMessage(
        "Could not send verification email right now. Please try again in a moment."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      if (!user) return;

      setIsChecking(true);

      await reload(user);

      if (auth.currentUser.emailVerified) {
        navigate("/home");
      } else {
        setSuccessMessage(
          "Your email is not verified yet. Please check your inbox and click the verification link."
        );
      }
    } catch (error) {
      console.error("Error checking verification:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
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
            Verify your email
          </h1>

          <p className="mt-4 text-gray-600 leading-relaxed">
            We sent a verification link to:
          </p>

          <p className="mt-2 font-semibold text-primary-600 break-all">
            {email}
          </p>

          <p className="mt-6 text-sm text-gray-500 leading-relaxed">
            You must verify your email before accessing the platform.
            Please open your inbox or spam folder, click the verification link,
            and then return here.
          </p>
        </div>

        {successMessage && (
          <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-sm">
            {successMessage}
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
              ? "Checking..."
              : "I already verified my email"}
          </button>

          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isSending}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50"
          >
            <FaRedo />

            {isSending
              ? "Sending..."
              : "Resend verification email"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-2xl transition-colors"
          >
            <FaSignOutAlt />
            Logout
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <FaArrowLeft />
              Back to login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default VerificationPending;