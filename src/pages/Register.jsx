// src/pages/Register.jsx

import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { FaArrowLeft } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import RegisterForm from "../components/register/RegisterForm";
import { auth } from "../firebase";
import { registerUser } from "../services/auth/authService";
import {
  getFriendlyRegisterError,
  validateEmail,
  validateRegisterForm
} from "../components/register/registerValidation";

function Register() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Email validation is derived directly from the current email value.
   * It does not need separate React state.
   */
  const emailValidation = validateEmail(email);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    if (!currentUser.emailVerified) {
      navigate("/verification-pending", {
        replace: true,
        state: {
          email: currentUser.email,
          from: location.state?.from || null
        }
      });

      return;
    }

    navigate("/home", {
      replace: true
    });
  }, [navigate, location.state]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/welcome");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const validation = validateRegisterForm({
      name,
      lastName,
      email,
      password,
      confirmPassword,
      country,
      age
    });

    if (!validation.isValid || !validation.data) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    const {
      name: cleanName,
      lastName: cleanLastName,
      email: cleanEmail,
      password: validatedPassword,
      country: cleanCountry,
      age: numericAge,
      ageGroup
    } = validation.data;

    try {
      const user = await registerUser(
        cleanEmail,
        validatedPassword,
        {
          name: cleanName,
          lastName: cleanLastName,
          email: cleanEmail,
          country: cleanCountry,
          age: numericAge,
          ageGroup,

          /*
           * Initial multi-tenant preparation.
           * These fields do not change the current independent-user flow.
           */
          accountType: "independent",
          organizationId: null,
          organizationMembershipStatus: "not_applicable"
        }
      );

      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true
      });

      navigate("/verification-pending", {
        replace: true,
        state: {
          email: cleanEmail,
          from: location.state?.from || null
        }
      });
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        getFriendlyRegisterError(
          err?.code,
          err?.message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Props are grouped by responsibility to keep RegisterForm's API
   * compact and maintainable.
   */
  const personalInfo = {
    name,
    lastName,
    age,
    setName,
    setLastName,
    setAge
  };

  const account = {
    email,

    /*
     * AccountSection currently expects an event-based change handler.
     * Validation remains derived and is not stored as duplicated state.
     */
    handleEmailChange: (event) => {
      setEmail(event.target.value);
    },

    emailError: emailValidation.message || "",
    emailWarning: emailValidation.warning || "",
    isEmailValidState: emailValidation.isValid
  };

  const countryData = {
    selectedCountry: country,
    onChange: setCountry
  };

  const passwordData = {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100">
        <div className="absolute inset-0 bg-grid-primary/[0.05] bg-[size:20px_20px]" />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />

        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />

        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-accent-yellow rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={handleGoBack}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium bg-white/70 backdrop-blur px-4 py-2 rounded-full shadow-sm transition-colors duration-200"
      >
        <FaArrowLeft />

        <span>Powrót</span>
      </button>

      {/* Register card */}
      <div className="relative max-w-md w-full">
        <div
          className="
            bg-white/90
            backdrop-blur-xl
            p-8
            rounded-2xl
            shadow-[0_8px_30px_rgb(0,0,0,0.12)]
            transition-all
            duration-300
            hover:bg-white/95
            hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
          "
        >
          <RegisterForm
            handleSubmit={handleSubmit}
            error={error}
            loading={loading}
            personalInfo={personalInfo}
            account={account}
            country={countryData}
            password={passwordData}
          />
        </div>
      </div>
    </div>
  );
}

export default Register;