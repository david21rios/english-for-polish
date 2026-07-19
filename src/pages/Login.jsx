// src/pages/Login.jsx

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import { auth, db } from "../firebase";

import LoginHeader from "../components/login/LoginHeader";
import LoginForm from "../components/login/LoginForm";

import {
  getFriendlyLoginError,
  resolveRedirectPath,
  validateLoginForm
} from "../components/login/loginValidation";

function Login() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const requestedPath =
    location.state?.from?.pathname;

  const redirectPath = useMemo(
    () =>
      resolveRedirectPath(
        requestedPath
      ),
    [requestedPath]
  );

  useEffect(() => {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      return;
    }

    if (
      !currentUser.emailVerified
    ) {
      navigate(
        "/verification-pending",
        {
          replace: true,
          state: {
            email:
              currentUser.email,
            from:
              location.state?.from ||
              null
          }
        }
      );

      return;
    }

    navigate(
      redirectPath,
      {
        replace: true
      }
    );
  }, [
    navigate,
    redirectPath,
    location.state
  ]);

  const handleGoBack = () => {
    if (
      window.history.length > 1
    ) {
      navigate(-1);
      return;
    }

    navigate("/welcome");
  };

  const handleTogglePassword =
    () => {
      setShowPassword(
        (currentValue) =>
          !currentValue
      );
    };

  const updateLastLogin =
    async (userId) => {
      try {
        const userRef = doc(
          db,
          "users",
          userId
        );

        await updateDoc(
          userRef,
          {
            lastLogin:
              serverTimestamp()
          }
        );
      } catch (updateError) {
        console.error(
          "Failed to update last login:",
          updateError
        );
      }
    };

  const handleLogin =
    async (event) => {
      event.preventDefault();

      if (loading) {
        return;
      }

      setError("");

      const validation =
        validateLoginForm({
          email,
          password
        });

      if (
        !validation.isValid
      ) {
        setError(
          validation.message
        );
        return;
      }

      setLoading(true);

      try {
        const userCredential =
          await signInWithEmailAndPassword(
            auth,
            validation.normalizedEmail,
            password
          );

        const loggedUser =
          userCredential.user;

        if (
          !loggedUser.emailVerified
        ) {
          await signOut(auth);

          navigate(
            "/verification-pending",
            {
              replace: true,
              state: {
                email:
                  loggedUser.email,
                from:
                  location.state
                    ?.from ||
                  null
              }
            }
          );

          return;
        }

        await updateLastLogin(
          loggedUser.uid
        );

        navigate(
          redirectPath,
          {
            replace: true
          }
        );
      } catch (
        loginError
      ) {
        console.error(
          "Login error:",
          loginError
        );

        setError(
          getFriendlyLoginError(
            loginError.code
          )
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100">
        <div className="absolute inset-0 bg-grid-primary/[0.05] bg-[size:20px_20px]" />
      </div>

      <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 animate-blob rounded-full bg-primary-300 opacity-70 mix-blend-multiply blur-xl" />

        <div className="animation-delay-2000 absolute -right-40 -top-40 h-80 w-80 animate-blob rounded-full bg-secondary-300 opacity-70 mix-blend-multiply blur-xl" />

        <div className="animation-delay-4000 absolute -bottom-40 left-20 h-80 w-80 animate-blob rounded-full bg-accent-yellow opacity-70 mix-blend-multiply blur-xl" />
      </div>

      <LoginHeader
        onGoBack={
          handleGoBack
        }
        registerState={{
          from:
            location.state?.from ||
            location
        }}
      />

      <main className="relative w-full max-w-md">
        <section className="space-y-8 rounded-2xl bg-white/90 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:bg-white/95 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <LoginForm
            onSubmit={
              handleLogin
            }
            email={email}
            onEmailChange={
              setEmail
            }
            password={
              password
            }
            onPasswordChange={
              setPassword
            }
            showPassword={
              showPassword
            }
            onTogglePassword={
              handleTogglePassword
            }
            loading={
              loading
            }
            error={error}
            forgotPasswordState={{
              from:
                location.state
                  ?.from ||
                location
            }}
          />
        </section>
      </main>
    </div>
  );
}

export default Login;