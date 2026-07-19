// src/components/test/TestInstructions.jsx

import PropTypes from "prop-types";

import {
  FaBookOpen,
  FaClock,
  FaEdit,
  FaGraduationCap,
  FaHeadphones,
  FaLock,
  FaPlay,
  FaRegCheckCircle,
  FaRoute,
  FaShieldAlt
} from "react-icons/fa";

const TEST_AREAS = [
  {
    id: "multipleChoice",
    icon: FaRegCheckCircle,
    title: "Wybór odpowiedzi",
    description:
      "Pytania sprawdzające gramatykę, słownictwo, strukturę zdań i praktyczne użycie języka."
  },
  {
    id: "writing",
    icon: FaEdit,
    title: "Pisanie",
    description:
      "Zadania pisemne oceniane według kryteriów odpowiednich dla danego poziomu CEFR."
  },
  {
    id: "reading",
    icon: FaBookOpen,
    title: "Czytanie",
    description:
      "Teksty w języku angielskim oraz pytania sprawdzające rozumienie ogólne, szczegóły i znaczenie w kontekście."
  },
  {
    id: "listening",
    icon: FaHeadphones,
    title: "Słuchanie",
    description:
      "Ta część zostanie dodana w kolejnej wersji testu.",
    disabled: true
  }
];

const SUMMARY_CARDS = [
  {
    id: "duration",
    icon: FaClock,
    title: "Do 2 godzin",
    description:
      "Maksymalny czas całego testu wynosi 120 minut. Test może zakończyć się wcześniej zależnie od wyniku.",
    className:
      "border-blue-100 bg-blue-50 text-blue-700"
  },
  {
    id: "adaptivePath",
    icon: FaRoute,
    title: "Ścieżka A1–C2",
    description:
      "Test rozpoczyna się od pierwszego dostępnego poziomu i przechodzi dalej po uzyskaniu wymaganego wyniku.",
    className:
      "border-purple-100 bg-purple-50 text-purple-700"
  },
  {
    id: "cefrResult",
    icon: FaGraduationCap,
    title: "Zalecany poziom CEFR",
    description:
      "Wynik wskaże najbardziej odpowiedni poziom rozpoczęcia lub kontynuowania nauki.",
    className:
      "border-green-100 bg-green-50 text-green-700"
  }
];

const IMPORTANT_RULES = [
  "Odpowiedz na wszystkie pytania widoczne w danej części przed przejściem dalej.",
  "Czytaj uważnie polecenia oraz wszystkie warianty odpowiedzi.",
  "Pisz samodzielnie po angielsku i przestrzegaj wymaganej liczby słów.",
  "Nie odświeżaj ani nie zamykaj strony bez potrzeby. Czas testu nie zostanie zresetowany.",
  "Po ukończeniu poziomu zobaczysz wynik i informację, czy możesz kontynuować test.",
  "Jeżeli nie osiągniesz wymaganego wyniku, test zakończy się i wskaże zalecany poziom nauki.",
  "Ocena części pisemnej może być początkowo wynikiem szacowanym i zostać później zweryfikowana automatycznie lub przez nauczyciela.",
  "Wynik jest narzędziem diagnostycznym i nie stanowi formalnego certyfikatu CEFR."
];

const TestInstructions = ({
  onStart,
  disabled = false,
  isStarting = false
}) => {
  return (
    <section className="w-full bg-gradient-to-b from-primary-50 to-white px-3 py-5 sm:px-4 md:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
          <header className="bg-gradient-to-br from-primary-600 to-secondary-600 px-5 py-10 text-center text-white md:px-14 md:py-16">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl md:mb-6 md:h-20 md:w-20 md:text-4xl">
              <FaGraduationCap />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 md:text-sm">
              Test poziomujący z języka angielskiego
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight md:mt-4 md:text-6xl">
              Instrukcja testu
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/90 md:mt-5 md:text-xl">
              Test oceni Twoje aktualne umiejętności językowe i pomoże wskazać
              najbardziej odpowiedni poziom rozpoczęcia nauki.
            </p>
          </header>

          <div className="p-4 md:p-10">
            <section
              aria-labelledby="test-summary-title"
              className="mb-7 md:mb-9"
            >
              <h2 id="test-summary-title" className="sr-only">
                Najważniejsze informacje o teście
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
                {SUMMARY_CARDS.map((card) => {
                  const CardIcon = card.icon;

                  return (
                    <article
                      key={card.id}
                      className={`rounded-2xl border p-4 md:p-6 ${card.className}`}
                    >
                      <CardIcon className="mb-3 text-2xl md:text-3xl" />

                      <h3 className="text-base font-bold text-gray-900 md:text-lg">
                        {card.title}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">
                        {card.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              aria-labelledby="assessed-skills-title"
              className="mb-7 md:mb-9"
            >
              <div className="mb-4 md:mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 md:text-sm">
                  Oceniane umiejętności
                </p>

                <h2
                  id="assessed-skills-title"
                  className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl"
                >
                  Co będzie oceniane?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">
                  Każdy poziom zawiera trzy aktywne części. Ich wyniki są
                  łączone zgodnie z wagą przypisaną do danej umiejętności.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 xl:grid-cols-4">
                {TEST_AREAS.map((area) => {
                  const AreaIcon = area.icon;

                  return (
                    <article
                      key={area.id}
                      className={`rounded-2xl border p-4 md:p-5 ${
                        area.disabled
                          ? "border-gray-100 bg-gray-50 opacity-75"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl md:h-14 md:w-14 md:text-2xl ${
                          area.disabled
                            ? "bg-gray-200 text-gray-500"
                            : "bg-primary-100 text-primary-600"
                        }`}
                      >
                        <AreaIcon />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                          {area.title}
                        </h3>

                        {area.disabled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600">
                            <FaLock />
                            Wkrótce
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">
                        {area.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              aria-labelledby="test-process-title"
              className="mb-7 rounded-2xl border border-blue-100 bg-blue-50 p-4 md:mb-9 md:p-6"
            >
              <div className="flex items-start gap-3">
                <FaRoute className="mt-1 shrink-0 text-xl text-blue-700" />

                <div>
                  <h2
                    id="test-process-title"
                    className="text-lg font-bold text-gray-900 md:text-xl"
                  >
                    Jak przebiega test?
                  </h2>

                  <ol className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 md:text-base">
                    <li>
                      <strong>1.</strong> Rozpoczynasz od pierwszego dostępnego
                      poziomu CEFR.
                    </li>

                    <li>
                      <strong>2.</strong> Rozwiązujesz kolejno część wyboru
                      odpowiedzi, pisania i czytania.
                    </li>

                    <li>
                      <strong>3.</strong> Po ukończeniu poziomu system oblicza
                      wynik łączny.
                    </li>

                    <li>
                      <strong>4.</strong> Wynik co najmniej 70% umożliwia
                      przejście do następnego dostępnego poziomu.
                    </li>

                    <li>
                      <strong>5.</strong> Wynik poniżej wymaganego minimum
                      kończy test i wskazuje zalecaną ścieżkę nauki.
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="important-rules-title"
              className="rounded-2xl border border-primary-100 bg-primary-50 p-4 md:p-6"
            >
              <div className="flex items-start gap-3">
                <FaShieldAlt className="mt-1 shrink-0 text-xl text-primary-700" />

                <div className="w-full">
                  <h2
                    id="important-rules-title"
                    className="text-lg font-bold text-gray-900 md:text-xl"
                  >
                    Ważne zasady
                  </h2>

                  <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-gray-700 md:grid-cols-2 md:text-base">
                    {IMPORTANT_RULES.map((rule) => (
                      <li key={rule} className="flex items-start gap-2">
                        <FaRegCheckCircle className="mt-1 shrink-0 text-primary-600" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-900 md:mt-8 md:p-5">
              <div className="flex items-start gap-3">
                <FaClock className="mt-1 shrink-0" />

                <p>
                  Po rozpoczęciu testu licznik czasu działa nieprzerwanie.
                  Odświeżenie strony nie przywróci pełnych 120 minut. Po
                  wyczerpaniu czasu test zostanie automatycznie zakończony, a
                  zapisane odpowiedzi zostaną wykorzystane do obliczenia
                  dostępnego wyniku.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              disabled={disabled || isStarting}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-base font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:mt-8 md:text-lg"
            >
              <FaPlay />

              {isStarting
                ? "Przygotowywanie testu..."
                : disabled
                  ? "Nowa próba jest niedostępna"
                  : "Rozpocznij test"}
            </button>

            <p className="mt-3 text-center text-xs leading-relaxed text-gray-500 md:text-sm">
              Rozpoczęcie testu oznacza akceptację przedstawionych zasad i
              uruchomienie limitu czasu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

TestInstructions.propTypes = {
  onStart: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isStarting: PropTypes.bool
};

export default TestInstructions;