// src/components/Footer.jsx

import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  FiBookOpen,
  FiHelpCircle,
  FiHome,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiTarget
} from "react-icons/fi";

import {
  auth
} from "../firebase";

const HIDDEN_FOOTER_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verification-pending"
];

const CONTACT_SECTION_ID =
  "contact";

/**
 * Determines whether the footer should be hidden
 * for the current route.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
const shouldHideFooter = (
  pathname
) => {
  return HIDDEN_FOOTER_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  );
};

/**
 * Scrolls smoothly to the public contact section.
 *
 * @returns {boolean}
 */
const scrollToContactSection = () => {
  const contactSection =
    document.getElementById(
      CONTACT_SECTION_ID
    );

  if (!contactSection) {
    return false;
  }

  contactSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  return true;
};

function Footer() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    isAuthenticated,
    setIsAuthenticated
  ] = useState(
    Boolean(auth.currentUser)
  );

  /**
   * Keeps the authentication state synchronized
   * with Firebase Authentication.
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setIsAuthenticated(
            Boolean(user)
          );
        }
      );

    return unsubscribe;
  }, []);

  /**
   * Handles navigation to hash sections after
   * React Router updates the current location.
   */
  useEffect(() => {
    if (
      location.pathname !==
        "/welcome" ||
      location.hash !==
        `#${CONTACT_SECTION_ID}`
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () => {
          scrollToContactSection();
        },
        100
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    location.pathname,
    location.hash
  ]);

  if (
    shouldHideFooter(
      location.pathname
    )
  ) {
    return null;
  }

  /**
   * Sends authenticated users to the private
   * support page and visitors to the public
   * contact section on the welcome page.
   */
  const handleContactNavigation = (
    event
  ) => {
    event.preventDefault();

    if (isAuthenticated) {
      navigate("/contact");
      return;
    }

    const isAlreadyOnWelcome =
      location.pathname ===
      "/welcome";

    if (isAlreadyOnWelcome) {
      window.history.replaceState(
        null,
        "",
        `/welcome#${CONTACT_SECTION_ID}`
      );

      const sectionFound =
        scrollToContactSection();

      if (!sectionFound) {
        navigate(
          `/welcome#${CONTACT_SECTION_ID}`
        );
      }

      return;
    }

    navigate(
      `/welcome#${CONTACT_SECTION_ID}`
    );
  };

  const contactDestination =
    isAuthenticated
      ? "/contact"
      : `/welcome#${CONTACT_SECTION_ID}`;

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <section className="lg:col-span-1">
            <Link
              to={
                isAuthenticated
                  ? "/home"
                  : "/welcome"
              }
              className="inline-flex items-center gap-3"
              aria-label="English for Polish"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
                <FiBookOpen
                  size={22}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-lg font-bold text-white">
                  English for Polish
                </p>

                <p className="text-xs text-slate-400">
                  Platforma do nauki języka angielskiego
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Ucz się języka angielskiego krok po kroku
              poprzez kursy, praktyczne tematy, testy
              poziomujące i interaktywne misje.
            </p>
          </section>

          {/* Learning */}
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Nauka
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to={
                    isAuthenticated
                      ? "/home"
                      : "/welcome"
                  }
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiHome
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Strona główna
                </Link>
              </li>

              <li>
                <Link
                  to="/curso"
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiBookOpen
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Kurs
                </Link>
              </li>

              <li>
                <Link
                  to="/temas"
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiTarget
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Tematy i misje
                </Link>
              </li>

              <li>
                <Link
                  to="/test"
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiShield
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Test poziomujący
                </Link>
              </li>

              <li>
                <Link
                  to="/foro"
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiMessageSquare
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Forum
                </Link>
              </li>
            </ul>
          </section>

          {/* Help */}
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Pomoc
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to={contactDestination}
                  onClick={
                    handleContactNavigation
                  }
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiMail
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Pomoc i kontakt
                </Link>
              </li>

              <li>
                <Link
                  to="/faq"
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiHelpCircle
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Najczęściej zadawane pytania
                </Link>
              </li>

              <li>
                <Link
                  to={
                    isAuthenticated
                      ? "/contact?category=technical"
                      : `/welcome#${CONTACT_SECTION_ID}`
                  }
                  onClick={
                    isAuthenticated
                      ? undefined
                      : handleContactNavigation
                  }
                  className="group inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FiShield
                    className="text-slate-500 transition-colors group-hover:text-blue-400"
                    aria-hidden="true"
                  />

                  Zgłoś problem
                </Link>
              </li>
            </ul>
          </section>

          {/* Legal */}
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Informacje prawne
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="transition-colors hover:text-white"
                >
                  Polityka prywatności
                </Link>
              </li>

              <li>
                <Link
                  to="/terms"
                  className="transition-colors hover:text-white"
                >
                  Regulamin
                </Link>
              </li>

              <li>
                <Link
                  to="/security"
                  className="transition-colors hover:text-white"
                >
                  Bezpieczeństwo
                </Link>
              </li>

              <li>
                <Link
                  to="/community-guidelines"
                  className="transition-colors hover:text-white"
                >
                  Zasady społeczności
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} English for Polish.
            Wszelkie prawa zastrzeżone.
          </p>

          <p>
            Nauka języka angielskiego dla polskojęzycznych uczniów.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;