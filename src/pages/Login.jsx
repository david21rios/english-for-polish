// src/pages/Login.jsx

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  useNavigate,
  Link,
  useLocation
} from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaArrowLeft
} from "react-icons/fa";

import { auth, db } from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fromPath =
    location.state?.from?.pathname &&
    location.state.from.pathname !== "/welcome" &&
    location.state.from.pathname !== "/register" &&
    location.state.from.pathname !== "/forgot-password"
      ? location.state.from.pathname
      : "/home";

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

    navigate(fromPath, { replace: true });
  }, [navigate, fromPath, location.state]);

  const getFriendlyAuthError = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "The email address is not valid.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";

      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a moment and try again.";

      default:
        return "Could not sign in. Please check your information and try again.";
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/welcome");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const loggedUser = userCredential.user;

      if (!loggedUser.emailVerified) {
        await signOut(auth);

        navigate("/verification-pending", {
          replace: true,
          state: {
            email: loggedUser.email,
            from: location.state?.from || null
          }
        });

        return;
      }

      const userRef = doc(db, "users", loggedUser.uid);

      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });

      navigate(fromPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(getFriendlyAuthError(err.code));
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
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-white/95">
          <div>
            <h1 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
              Sign In
            </h1>

            <p className="mt-2 text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <Link
                to="/register"
                state={{ from: location.state?.from || location }}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Register now
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
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
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                state={{ from: location }}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;