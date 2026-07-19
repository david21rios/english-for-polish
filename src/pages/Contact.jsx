// src/pages/Contact.jsx

import {
  useEffect,
  useState
} from "react";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  auth
} from "../firebase";

import {
  SupportHeader,
  SupportInfoCards,
  SupportUserInfo,
  SupportForm,
  SupportSuccess
} from "../components/support";
/**
 * Authenticated support center page.
 *
 * @returns {JSX.Element}
 */
const Contact = () => {
  const [currentUser, setCurrentUser] =
    useState(
      auth.currentUser
    );

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState("");

  const [
    createdTicketId,
    setCreatedTicketId
  ] = useState("");

  const [
    isAuthLoading,
    setIsAuthLoading
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setIsAuthLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  /**
   * Stores the category selected from the
   * support information cards.
   *
   * @param {string} category
   */
  const handleCategorySelect = (
    category
  ) => {
    setSelectedCategory(
      category
    );

    setCreatedTicketId("");

    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            "support-form-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );
  };

  /**
   * Displays the success state after
   * creating a ticket.
   *
   * @param {string} ticketId
   */
  const handleTicketCreated = (
    ticketId
  ) => {
    setCreatedTicketId(
      ticketId
    );

    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            "support-result-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
      }
    );
  };

  /**
   * Restores the form so the user can
   * create another support ticket.
   */
  const handleCreateAnother = () => {
    setCreatedTicketId("");
    setSelectedCategory("");

    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            "support-form-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );
  };

  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center">
          <div
            role="status"
            aria-live="polite"
            className="text-center"
          >
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />

            <p className="mt-4 font-medium text-gray-600">
              Ładowanie centrum pomocy...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Zaloguj się, aby skontaktować się z pomocą
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            Centrum zgłoszeń jest dostępne dla zalogowanych
            użytkowników. Publiczny formularz kontaktowy znajduje
            się na stronie powitalnej.
          </p>

          <a
            href="/welcome#contact"
            className="mt-7 inline-flex rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
          >
            Przejdź do formularza kontaktowego
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <SupportHeader />

        <SupportInfoCards
          selectedCategory={
            selectedCategory
          }
          onSelectCategory={
            handleCategorySelect
          }
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-start">
          <SupportUserInfo
            displayName={
              currentUser.displayName
            }
            email={
              currentUser.email
            }
            uid={
              currentUser.uid
            }
          />

          <div
            id={
              createdTicketId
                ? "support-result-section"
                : "support-form-section"
            }
            className="scroll-mt-28"
          >
            {createdTicketId ? (
              <SupportSuccess
                ticketId={
                  createdTicketId
                }
                onCreateAnother={
                  handleCreateAnother
                }
              />
            ) : (
              <SupportForm
                initialCategory={
                  selectedCategory
                }
                onSuccess={
                  handleTicketCreated
                }
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Contact;