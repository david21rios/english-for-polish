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
  FiHome,
  FiInfo,
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

const PUBLIC_SECTIONS = {
  home: "welcome",
  about: "about",
  test: "test-info",
  contact: "contact-form"
};

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

function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const [
    isAuthenticated,
    setIsAuthenticated
  ] = useState(
    Boolean(
      auth.currentUser
        ?.emailVerified
    )
  );

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setIsAuthenticated(
            Boolean(
              user?.emailVerified
            )
          );
        }
      );

    return unsubscribe;
  }, []);

  /**
   * Handles section navigation after arriving
   * at the public Welcome page.
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

  if (
    shouldHideFooter(
      location.pathname
    )
  ) {
    return null;
  }

  /**
   * Navigates a public visitor to a section
   * of Welcome.
   *
   * @param {React.MouseEvent} event
   * @param {string} sectionId
   */
  const handlePublicNavigation = (
    event,
    sectionId
  ) => {
    event.preventDefault();

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

  const publicLinkClass =
    "group inline-flex items-center gap-2 transition-colors hover:text-white";

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <section>
            {isAuthenticated ? (
              <Link
                to="/home"
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
            ) : (
              <button
                type="button"
                onClick={(event) =>
                  handlePublicNavigation(
                    event,
                    PUBLIC_SECTIONS.home
                  )
                }
                className="inline-flex items-center gap-3 text-left"
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
              </button>
            )}

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Ucz się języka angielskiego krok po kroku
              poprzez kursy, praktyczne tematy, testy
              poziomujące i interaktywne misje.
            </p>
          </section>

          {/* Navigation */}
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              {isAuthenticated
                ? "Nauka"
                : "Nawigacja"}
            </h2>

            <ul className="space-y-3 text-sm">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/home"
                      className={
                        publicLinkClass
                      }
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
                      className={
                        publicLinkClass
                      }
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
                      className={
                        publicLinkClass
                      }
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
                      className={
                        publicLinkClass
                      }
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
                      className={
                        publicLinkClass
                      }
                    >
                      <FiMessageSquare
                        className="text-slate-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />

                      Forum
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a
                      href="/welcome"
                      onClick={(event) =>
                        handlePublicNavigation(
                          event,
                          PUBLIC_SECTIONS.home
                        )
                      }
                      className={
                        publicLinkClass
                      }
                    >
                      <FiHome
                        className="text-slate-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />

                      Strona główna
                    </a>
                  </li>

                  <li>
                    <a
                      href="/welcome#about"
                      onClick={(event) =>
                        handlePublicNavigation(
                          event,
                          PUBLIC_SECTIONS.about
                        )
                      }
                      className={
                        publicLinkClass
                      }
                    >
                      <FiInfo
                        className="text-slate-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />

                      O platformie
                    </a>
                  </li>

                  <li>
                    <a
                      href="/welcome#test-info"
                      onClick={(event) =>
                        handlePublicNavigation(
                          event,
                          PUBLIC_SECTIONS.test
                        )
                      }
                      className={
                        publicLinkClass
                      }
                    >
                      <FiShield
                        className="text-slate-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />

                      Test
                    </a>
                  </li>

                  <li>
                    <a
                      href="/welcome#contact-form"
                      onClick={(event) =>
                        handlePublicNavigation(
                          event,
                          PUBLIC_SECTIONS.contact
                        )
                      }
                      className={
                        publicLinkClass
                      }
                    >
                      <FiMail
                        className="text-slate-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />

                      Kontakt
                    </a>
                  </li>
                </>
              )}
            </ul>
          </section>

          {/* Help */}
          <section>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Pomoc
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                {isAuthenticated ? (
                  <Link
                    to="/contact"
                    className={
                      publicLinkClass
                    }
                  >
                    <FiMail
                      className="text-slate-500 transition-colors group-hover:text-blue-400"
                      aria-hidden="true"
                    />

                    Pomoc i kontakt
                  </Link>
                ) : (
                  <a
                    href="/welcome#contact-form"
                    onClick={(event) =>
                      handlePublicNavigation(
                        event,
                        PUBLIC_SECTIONS.contact
                      )
                    }
                    className={
                      publicLinkClass
                    }
                  >
                    <FiMail
                      className="text-slate-500 transition-colors group-hover:text-blue-400"
                      aria-hidden="true"
                    />

                    Pomoc i kontakt
                  </a>
                )}
              </li>

              <li>
                {isAuthenticated ? (
                  <Link
                    to="/contact?category=technical"
                    className={
                      publicLinkClass
                    }
                  >
                    <FiShield
                      className="text-slate-500 transition-colors group-hover:text-blue-400"
                      aria-hidden="true"
                    />

                    Zgłoś problem
                  </Link>
                ) : (
                  <a
                    href="/welcome#contact-form"
                    onClick={(event) =>
                      handlePublicNavigation(
                        event,
                        PUBLIC_SECTIONS.contact
                      )
                    }
                    className={
                      publicLinkClass
                    }
                  >
                    <FiShield
                      className="text-slate-500 transition-colors group-hover:text-blue-400"
                      aria-hidden="true"
                    />

                    Zgłoś problem
                  </a>
                )}
              </li>
            </ul>
          </section>
        </div>

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