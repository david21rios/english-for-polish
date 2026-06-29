// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import LoadingSpinner from "./shared/LoadingSpinner";

function PrivateRoute({ children, requireEmailVerified = true }) {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (requireEmailVerified && !user.emailVerified) {
    return (
      <Navigate
        to="/verification-pending"
        replace
        state={{
          email: user.email,
          from: location
        }}
      />
    );
  }

  return children;
}

export default PrivateRoute;