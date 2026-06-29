// src/components/Header.jsx

import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/img/Logo/LearnSpanish3.png";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const hideHeaderRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/verification-pending"
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = Boolean(currentUser);
  const isEmailVerified = Boolean(currentUser?.emailVerified);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAdmin(false);

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setIsAdmin(userSnap.data().role === "admin");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  if (hideHeaderRoutes.includes(location.pathname)) return null;

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "¿Estás seguro de que quieres cerrar sesión?"
    );

    if (!confirmLogout) return;

    try {
      await signOut(auth);
      closeMenus();
      navigate("/welcome");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleLogin = () => {
    closeMenus();
    navigate("/login", {
      state: { from: location }
    });
  };

  const handleRegister = () => {
    closeMenus();
    navigate("/register", {
      state: { from: location }
    });
  };

  const NavLinks = ({ isMobile = false }) => {
    const linkClass = isMobile
      ? "block w-full px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-primary-50 hover:text-primary-700"
      : "nav-link";

    if (isLoggedIn && isEmailVerified) {
      return (
        <>
          <Link to="/home" className={linkClass} onClick={closeMenus}>
            Home
          </Link>

          <Link to="/curso" className={linkClass} onClick={closeMenus}>
            Course
          </Link>

          <Link to="/temas" className={linkClass} onClick={closeMenus}>
            Topics
          </Link>

          <Link to="/test" className={linkClass} onClick={closeMenus}>
            Test
          </Link>

          <Link to="/foro" className={linkClass} onClick={closeMenus}>
            Forum
          </Link>

          <Link to="/contact" className={linkClass} onClick={closeMenus}>
            Contact
          </Link>
        </>
      );
    }

    return (
      <>
        <Link to="/welcome" className={linkClass} onClick={closeMenus}>
          Home
        </Link>

        <a href="/welcome#about-me" className={linkClass} onClick={closeMenus}>
          About
        </a>

        <a href="/welcome#test-info" className={linkClass} onClick={closeMenus}>
          Test
        </a>

        <a href="/welcome#contact-form" className={linkClass} onClick={closeMenus}>
          Contact
        </a>
      </>
    );
  };

  const ProfileMenu = ({ isMobile = false }) => {
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
                <Link to="/profile" className={itemClass} onClick={closeMenus}>
                  Profile
                </Link>

                {isAdmin && (
                  <Link to="/admin" className={itemClass} onClick={closeMenus}>
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            {!isEmailVerified && (
              <Link
                to="/verification-pending"
                state={{
                  email: currentUser.email,
                  from: location
                }}
                className={itemClass}
                onClick={closeMenus}
              >
                Verify Email
              </Link>
            )}

            <button type="button" onClick={handleLogout} className={itemClass}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={handleLogin} className={itemClass}>
              Log in
            </button>

            <button type="button" onClick={handleRegister} className={itemClass}>
              Register
            </button>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="h-14 md:h-16 bg-primary-50 shadow-md" />;
  }

  return (
    <header className="bg-primary-50 shadow-md sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex-shrink-0">
            <Link
              to={isLoggedIn && isEmailVerified ? "/home" : "/welcome"}
              onClick={closeMenus}
            >
              <img
                src={logo}
                alt="Logo"
                className="h-9 md:h-10 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </nav>

          <div className="hidden md:flex items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="text-primary-600 text-2xl hover:text-primary-700"
                aria-label="Open user menu"
              >
                <FaUserCircle />
              </button>

              {isMenuOpen && <ProfileMenu />}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-primary-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-56px)] overflow-y-auto">
            <NavLinks isMobile />
            <ProfileMenu isMobile />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;