// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowLeft
} from "react-icons/fa";
import { registerUser } from "../services/authService";
import { getAgeGroup } from "../utils/ageGroup";
import Select from "react-select";
import { countries } from "../utils/countries";

const isValidEmail = (email) => {
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const commonDomains = [
    "gmail.com",
    "hotmail.com",
    "yahoo.com",
    "outlook.com",
    "icloud.com"
  ];

  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      message: "Invalid email format"
    };
  }

  const domain = cleanEmail.split("@")[1];

  if (!commonDomains.includes(domain)) {
    return {
      isValid: true,
      warning: "Make sure this email is valid and accessible"
    };
  }

  return {
    isValid: true,
    message: "",
    warning: ""
  };
};

const getFriendlyRegisterError = (errorCode, fallbackMessage) => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/weak-password":
      return "The password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return fallbackMessage || "Could not create the account. Please try again.";
  }
};

function Register() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");

  const [emailError, setEmailError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [isEmailValidState, setIsEmailValidState] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

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

    navigate("/home", { replace: true });
  }, [navigate, location.state]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/welcome");
  };

  const handleEmailChange = (event) => {
    const newEmail = event.target.value;
    setEmail(newEmail);

    const cleanEmail = newEmail.trim().toLowerCase();

    if (cleanEmail) {
      const validation = isValidEmail(cleanEmail);
      setIsEmailValidState(validation.isValid);
      setEmailError(validation.isValid ? "" : validation.message);
      setEmailWarning(validation.warning || "");
    } else {
      setIsEmailValidState(false);
      setEmailError("");
      setEmailWarning("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const cleanName = name.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const numericAge = Number(age);

    if (
      !cleanName ||
      !cleanLastName ||
      !cleanEmail ||
      !password ||
      !confirmPassword ||
      !country ||
      !age
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (!isEmailValidState) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!Number.isInteger(numericAge) || numericAge < 5 || numericAge > 120) {
      setError("Please enter a valid age between 5 and 120.");
      setLoading(false);
      return;
    }

    const ageGroup = getAgeGroup(numericAge);

    if (ageGroup === "invalid") {
      setError("La edad mínima para usar la plataforma es de 5 años.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const user = await registerUser(cleanEmail, password, {
        name: cleanName,
        lastName: cleanLastName,
        email: cleanEmail,
        country,
        age: numericAge,
        ageGroup
      });

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
      console.error("Register error:", err);
      setError(getFriendlyRegisterError(err.code, err.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryOption = countries
    .map(({ code, name }) => ({
      value: code,
      label: name,
      code
    }))
    .find((option) => option.value === country);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
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
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-white/95">
          <div>
            <h1 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
              Create Account
            </h1>

            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                state={{ from: location.state?.from || location }}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="First name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="text"
                  required
                  autoComplete="family-name"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope
                    className={`h-5 w-5 ${
                      emailError
                        ? "text-red-400"
                        : isEmailValidState
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  />
                </div>

                <input
                  type="email"
                  required
                  autoComplete="email"
                  className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                    emailError
                      ? "border-red-300"
                      : isEmailValidState
                      ? "border-green-300"
                      : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 ${
                    emailError
                      ? "focus:ring-red-500 focus:border-red-500"
                      : isEmailValidState
                      ? "focus:ring-green-500 focus:border-green-500"
                      : "focus:ring-primary-500 focus:border-primary-500"
                  } sm:text-sm bg-white/50`}
                  placeholder="Email address"
                  value={email}
                  onChange={handleEmailChange}
                />

                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}

                {emailWarning && !emailError && (
                  <p className="mt-1 text-sm text-yellow-600">
                    {emailWarning}
                  </p>
                )}

                {isEmailValidState && !emailWarning && (
                  <p className="mt-1 text-sm text-green-600">Valid email</p>
                )}
              </div>

              <div className="relative z-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🌍</span>
                </div>

                <div className="pl-8">
                  <Select
                    value={selectedCountryOption || null}
                    options={countries.map(({ code, name }) => ({
                      value: code,
                      label: name,
                      code
                    }))}
                    getOptionLabel={(option) => (
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                          alt={option.label}
                          className="w-5 h-4 rounded-sm"
                        />
                        {option.label}
                      </div>
                    )}
                    onChange={(selected) => setCountry(selected?.value || "")}
                    placeholder="Select country"
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🎂</span>
                </div>

                <input
                  type="number"
                  name="age"
                  min="5"
                  max="120"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/50"
                  placeholder="Edad"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;