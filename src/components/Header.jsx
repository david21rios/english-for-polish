// src/components/Header.jsx

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  FaBars,
  FaTimes,
  FaUserCircle
} from "react-icons/fa";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

import logo from "../assets/img/Logo/LearnSpanish3.png";
import useCrossTabLogout, {LOGOUT_EVENT_KEY} from "./header/hooks/useCrossTabLogout";
import {
  auth,
  db
} from "../firebase";

const PUBLIC_SECTIONS = {
  home: "welcome",
  about: "about",
  test: "test-info",
  contact: "contact-form"
};

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen
  ] = useState(false);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const isLoggedIn =
    Boolean(currentUser);

  const isEmailVerified =
    Boolean(
      currentUser?.emailVerified
    );

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          setCurrentUser(user);
          setIsAdmin(false);

          if (!user) {
            setIsLoading(false);
            return;
          }

          try {
            const userRef = doc(
              db,
              "users",
              user.uid
            );

            const userSnap =
              await getDoc(userRef);

            if (userSnap.exists()) {
              setIsAdmin(
                userSnap.data().role ===
                  "admin"
              );
            }
          } catch (error) {
            console.error(
              "Error checking admin status:",
              error
            );

            setIsAdmin(false);
          } finally {
            setIsLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  /**
   * Handles hash navigation when the user arrives
   * at /welcome from another route.
   */
  useEffect(() => {
    if (
      location.pathname !==
      "/welcome"
    ) {
      return;
    }

    const sectionId =
      location.hash.replace(
        "#",
        ""
      );

    if (!sectionId) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        if (
          sectionId ===
          PUBLIC_SECTIONS.home
        ) {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

          return;
        }

        const section =
          document.getElementById(
            sectionId
          );

        section?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    location.pathname,
    location.hash
  ]);

  const closeMenus = useCallback(
    () => {
      setIsMenuOpen(false);
      setIsMobileMenuOpen(false);
    },
    []
  );

  useCrossTabLogout({
    onLogout: closeMenus
  });

  /**
   * Navigates visitors to a section of Welcome.
   *
   * @param {string} sectionId
   */
  const handlePublicNavigation = (
    sectionId
  ) => {
    closeMenus();

    const isWelcomePage =
      location.pathname ===
      "/welcome";

    if (!isWelcomePage) {
      navigate(
        `/welcome#${sectionId}`
      );

      return;
    }

    if (
      sectionId ===
      PUBLIC_SECTIONS.home
    ) {
      window.history.replaceState(
        null,
        "",
        "/welcome"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    window.history.replaceState(
      null,
      "",
      `/welcome#${sectionId}`
    );

    const section =
      document.getElementById(
        sectionId
      );

    section?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const handleLogout = async () => {
    const confirmLogout =
      window.confirm(
        "Czy na pewno chcesz się wylogować?"
      );

    if (!confirmLogout) {
      return;
    }

    try {
      await signOut(auth);

      localStorage.setItem(
        LOGOUT_EVENT_KEY,
        Date.now().toString()
      );

      closeMenus();

      navigate(
        "/welcome",
        {
          replace: true
        }
      );
    } catch (error) {
      console.error(
        "Error during logout:",
        error
      );
    }
  };

  const handleLogin = () => {
    closeMenus();

    navigate(
      "/login",
      {
        state: {
          from: location
        }
      }
    );
  };

  const handleRegister = () => {
    closeMenus();

    navigate(
      "/register",
      {
        state: {
          from: location
        }
      }
    );
  };

  const NavLinks = ({
    isMobile = false
  }) => {
    const linkClass = isMobile
      ? "block w-full px-4 py-3 rounded-xl text-left text-gray-700 font-medium hover:bg-primary-50 hover:text-primary-700"
      : "nav-link";

    if (
      isLoggedIn &&
      isEmailVerified
    ) {
      return (
        <>
          <Link
            to="/home"
            className={linkClass}
            onClick={closeMenus}
          >
            Home
          </Link>

          <Link
            to="/curso"
            className={linkClass}
            onClick={closeMenus}
          >
            Course
          </Link>

          <Link
            to="/temas"
            className={linkClass}
            onClick={closeMenus}
          >
            Topics
          </Link>

          <Link
            to="/test"
            className={linkClass}
            onClick={closeMenus}
          >
            Test
          </Link>

          <Link
            to="/foro"
            className={linkClass}
            onClick={closeMenus}
          >
            Forum
          </Link>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          className={linkClass}
          onClick={() =>
            handlePublicNavigation(
              PUBLIC_SECTIONS.home
            )
          }
        >
          Home
        </button>

        <button
          type="button"
          className={linkClass}
          onClick={() =>
            handlePublicNavigation(
              PUBLIC_SECTIONS.about
            )
          }
        >
          About
        </button>

        <button
          type="button"
          className={linkClass}
          onClick={() =>
            handlePublicNavigation(
              PUBLIC_SECTIONS.test
            )
          }
        >
          Test
        </button>

        <button
          type="button"
          className={linkClass}
          onClick={() =>
            handlePublicNavigation(
              PUBLIC_SECTIONS.contact
            )
          }
        >
          Contact
        </button>
      </>
    );
  };

  const ProfileMenu = ({
    isMobile = false
  }) => {
    const itemClass = isMobile
      ? "block w-full text-left px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-primary-50 hover:text-primary-700"
      : "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100";

    const wrapperClass = isMobile
      ? "mt-3 pt-3 border-t border-gray-100 space-y-1"
      : "absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100";

    return (
      <div className={wrapperClass}>
        {isLoggedIn ? (
          <>
            {isEmailVerified && (
              <>
                <Link
                  to="/profile"
                  className={
                    itemClass
                  }
                  onClick={
                    closeMenus
                  }
                >
                  Profile
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={
                      itemClass
                    }
                    onClick={
                      closeMenus
                    }
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            {!isEmailVerified && (
              <Link
                to="/verification-pending"
                state={{
                  email:
                    currentUser.email,
                  from: location
                }}
                className={
                  itemClass
                }
                onClick={
                  closeMenus
                }
              >
                Verify Email
              </Link>
            )}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className={
                itemClass
              }
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={
                handleLogin
              }
              className={
                itemClass
              }
            >
              Log in
            </button>

            <button
              type="button"
              onClick={
                handleRegister
              }
              className={
                itemClass
              }
            >
              Register
            </button>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-14 bg-primary-50 shadow-md md:h-16" />
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-primary-50 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between md:h-16">
          <div className="flex-shrink-0">
            {isLoggedIn &&
            isEmailVerified ? (
              <Link
                to="/home"
                onClick={
                  closeMenus
                }
              >
                <img
                  src={logo}
                  alt="English for Polish"
                  className="h-9 w-auto md:h-10"
                />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handlePublicNavigation(
                    PUBLIC_SECTIONS.home
                  )
                }
                aria-label="Przejdź do strony głównej"
              >
                <img
                  src={logo}
                  alt="English for Polish"
                  className="h-9 w-auto md:h-10"
                />
              </button>
            )}
          </div>

          <nav className="hidden items-center space-x-8 md:flex">
            <NavLinks />
          </nav>

          <div className="hidden items-center md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsMenuOpen(
                    (currentValue) =>
                      !currentValue
                  )
                }
                className="text-2xl text-primary-600 hover:text-primary-700"
                aria-label="Otwórz menu użytkownika"
                aria-expanded={
                  isMenuOpen
                }
              >
                <FaUserCircle />
              </button>

              {isMenuOpen && (
                <ProfileMenu />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen(
                (currentValue) =>
                  !currentValue
              )
            }
            className="rounded-xl p-2 text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-700 md:hidden"
            aria-label="Otwórz menu nawigacji"
            aria-expanded={
              isMobileMenuOpen
            }
          >
            {isMobileMenuOpen ? (
              <FaTimes size={24} />
            ) : (
              <FaBars size={24} />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white shadow-xl md:hidden">
          <div className="max-h-[calc(100vh-56px)] space-y-1 overflow-y-auto px-4 py-4">
            <NavLinks isMobile />
            <ProfileMenu isMobile />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;