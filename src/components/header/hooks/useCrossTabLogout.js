// src/components/header/hooks/useCrossTabLogout.js

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../../../firebase";

export const LOGOUT_EVENT_KEY =
  "english-for-polish:logout";

/**
 * Synchronizes logout between browser tabs.
 *
 * When logout occurs in one tab, all other tabs receive
 * a StorageEvent, clear their Firebase session (if needed),
 * close local UI state and redirect to the public landing page.
 *
 * @param {object} options
 * @param {Function} options.onLogout
 */
function useCrossTabLogout({
  onLogout
} = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange =
      async (event) => {
        if (
          event.key !==
            LOGOUT_EVENT_KEY ||
          !event.newValue
        ) {
          return;
        }

        try {
          if (auth.currentUser) {
            await signOut(auth);
          }
        } catch (error) {
          console.error(
            "Cross-tab logout error:",
            error
          );
        } finally {
          if (
            typeof onLogout ===
            "function"
          ) {
            onLogout();
          }

          navigate(
            "/welcome",
            {
              replace: true
            }
          );
        }
      };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [
    navigate,
    onLogout
  ]);
}

export default useCrossTabLogout;