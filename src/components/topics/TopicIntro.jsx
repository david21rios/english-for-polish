// src/components/topics/TopicIntro.jsx

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  FaBolt,
  FaCheckCircle,
  FaComments,
  FaGamepad,
  FaRobot,
  FaTimes,
  FaTools
} from "react-icons/fa";

/*
|--------------------------------------------------------------------------
| Feature catalog
|--------------------------------------------------------------------------
*/

const FEATURES = [
  {
    id: "real_situations",

    icon: FaComments,

    title:
      "Sytuacje z życia",

    description:
      "Ćwicz angielski w codziennych kontekstach.",

    details:
      "Ćwicz angielski w realistycznych sytuacjach, takich jak rodzina, podróże, zakupy, praca, jedzenie czy rozmowy społeczne. Celem nie jest wyłącznie zapamiętywanie słownictwa, ale używanie języka w kontekście podobnym do prawdziwego życia.",

    status:
      "available",

    statusLabel:
      "Dostępne teraz"
  },

  {
    id: "missions",

    icon: FaGamepad,

    title:
      "Misje",

    description:
      "Wykonuj krótkie wyzwania konwersacyjne.",

    details:
      "Każdy temat zawiera prowadzone misje konwersacyjne, scenariusze, role oraz mierzalne cele. Asystent AI pozostaje w swojej roli, prowadzi naturalną rozmowę i przekazuje informację zwrotną dopiero po zakończeniu misji.",

    status:
      "available",

    statusLabel:
      "Dostępne teraz"
  },

  {
    id: "xp",

    icon: FaBolt,

    title:
      "Punkty XP",

    description:
      "Zdobywaj punkty za ukończone misje.",

    details:
      "Punkty XP są przyznawane za pierwsze prawidłowe ukończenie opublikowanej misji. Liczba punktów zależy od wyniku, realizacji celów i jakości komunikacji. Ponowne ćwiczenie ukończonej misji nie przyznaje ponownie XP.",

    status:
      "available",

    statusLabel:
      "Dostępne teraz"
  },

  {
    id: "ai_support",

    icon: FaRobot,

    title:
      "Wsparcie AI",

    description:
      "Rozmawiaj z AI w realistycznym scenariuszu.",

    details:
      "AI prowadzi rozmowę jako postać z określoną rolą, dostosowuje język do poziomu CEFR i pomaga utrzymać rozmowę w ramach scenariusza. Po zakończeniu analizuje realizację celów, komunikację, gramatykę, słownictwo i spójność wypowiedzi.",

    status:
      "available",

    statusLabel:
      "Dostępne teraz"
  },

  {
    id: "future_features",

    icon: FaTools,

    title:
      "Dalszy rozwój",

    description:
      "Głos, wymowa i bardziej rozbudowane scenariusze.",

    details:
      "W kolejnych etapach mogą zostać dodane rozmowy głosowe, analiza wymowy, kilka postaci AI w jednym scenariuszu, osiągnięcia, serie nauki oraz bardziej rozbudowane ścieżki edukacyjne.",

    status:
      "development",

    statusLabel:
      "W trakcie rozwoju"
  }
];

/*
|--------------------------------------------------------------------------
| Feature status
|--------------------------------------------------------------------------
*/

const getFeatureStatusConfiguration = (
  status
) => {
  if (status === "available") {
    return {
      icon: FaCheckCircle,

      containerClass:
        "bg-green-50 text-green-700",

      label:
        "Dostępne teraz"
    };
  }

  return {
    icon: FaTools,

    containerClass:
      "bg-yellow-50 text-yellow-700",

    label:
      "W trakcie rozwoju"
  };
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const TopicIntro = () => {
  const [
    selectedFeature,
    setSelectedFeature
  ] = useState(null);

  const closeButtonRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Modal keyboard and scroll behavior
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedFeature) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        setSelectedFeature(
          null
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.requestAnimationFrame(
      () => {
        closeButtonRef.current
          ?.focus();
      }
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedFeature]);

  const closeModal = () => {
    setSelectedFeature(
      null
    );
  };

  return (
    <section className="mb-6 md:mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 px-5 py-8 shadow-xl sm:px-8 md:px-12 md:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          aria-hidden="true"
        >
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white blur-3xl" />

          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
            <FaComments className="shrink-0" />

            Praktyka angielskiego w realnych sytuacjach
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Ćwicz angielski przez codzienne sytuacje
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-primary-50 md:text-lg">
            Wybierz temat, wykonuj realistyczne misje, rozmawiaj z AI i
            otrzymuj szczegółową informację zwrotną dopasowaną do Twojego
            poziomu.
          </p>

          <div className="mt-6 grid grid-cols-2 justify-center gap-2 md:flex md:flex-wrap md:gap-3">
            {FEATURES.map(
              (feature) => {
                const FeatureIcon =
                  feature.icon;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() =>
                      setSelectedFeature(
                        feature
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70 sm:text-sm"
                  >
                    <FeatureIcon className="shrink-0" />

                    <span>
                      {feature.title}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onMouseDown={
            closeModal
          }
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-feature-title"
            aria-describedby="topic-feature-description"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl text-primary-600"
                  aria-hidden="true"
                >
                  {(() => {
                    const FeatureIcon =
                      selectedFeature.icon;

                    return (
                      <FeatureIcon />
                    );
                  })()}
                </div>

                <div className="min-w-0">
                  <h2
                    id="topic-feature-title"
                    className="break-words text-2xl font-bold text-gray-900"
                  >
                    {
                      selectedFeature.title
                    }
                  </h2>

                  {(() => {
                    const configuration =
                      getFeatureStatusConfiguration(
                        selectedFeature.status
                      );

                    const StatusIcon =
                      configuration.icon;

                    return (
                      <div
                        className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${configuration.containerClass}`}
                      >
                        <StatusIcon />

                        {selectedFeature.statusLabel ||
                          configuration.label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={
                  closeModal
                }
                className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Zamknij okno"
              >
                <FaTimes />
              </button>
            </div>

            <p
              id="topic-feature-description"
              className="leading-relaxed text-gray-600"
            >
              {
                selectedFeature.details
              }
            </p>

            <button
              type="button"
              onClick={
                closeModal
              }
              className="mt-8 w-full rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopicIntro;