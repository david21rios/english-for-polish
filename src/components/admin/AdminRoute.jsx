// src/components/admin/AdminRoute.jsx

import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "../../firebase";
import LoadingSpinner from "../shared/LoadingSpinner";
import { isUserAdmin } from "../../services/auth/firestoreService";

function AdminRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      try {
        setCheckingRole(true);

        if (!user || !user.emailVerified) {
          if (isMounted) {
            setIsAdmin(false);
          }

          return;
        }

        const adminStatus = await isUserAdmin(user.uid);

        if (isMounted) {
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);

        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setCheckingRole(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading || checkingRole) {
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

  if (!user.emailVerified) {
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

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default AdminRoute;