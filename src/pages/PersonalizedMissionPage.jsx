// src/pages/PersonalizedMissionPage.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaRedo,
  FaSpinner,
  FaTimes
} from "react-icons/fa";

import { db } from "../firebase";

import PersonalizedMissionWizard from "../components/topics/personalization/PersonalizedMissionWizard";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = "",
  maximumLength = 500
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const createFallbackTopic = (
  topicId = ""
) => {
  const normalizedTopicId =
    normalizeText(
      topicId,
      200
    );

  return {
    id:
      normalizedTopicId ||
      "personalized",

    title:
      normalizedTopicId ||
      "Własna rozmowa",

    titulo:
      normalizedTopicId ||
      "Własna rozmowa",

    icon: "🎯",

    description:
      "Utwórz spersonalizowaną misję konwersacyjną dopasowaną do sytuacji, którą chcesz przećwiczyć.",

    isFallback: true
  };
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const PersonalizedMissionPage = () => {
  const {
    temaTitle
  } = useParams();

  const navigate =
    useNavigate();

  const [
    topic,
    setTopic
  ] = useState(null);

  const [
    loadingTopic,
    setLoadingTopic
  ] = useState(true);

  const [
    topicError,
    setTopicError
  ] = useState("");

  const [
    retryCounter,
    setRetryCounter
  ] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Resolved route values
  |--------------------------------------------------------------------------
  */

  const topicDocumentId =
    useMemo(
      () =>
        normalizeText(
          temaTitle,
          200
        ),
      [temaTitle]
    );

  const topicTitle =
    useMemo(() => {
      return (
        normalizeText(
          topic?.title ||
            topic?.titulo,
          200
        ) ||
        topicDocumentId ||
        "Własna rozmowa"
      );
    }, [
      topic,
      topicDocumentId
    ]);

  const topicIcon =
    normalizeText(
      topic?.icon,
      20
    ) || "🎯";

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBackToTopic =
    useCallback(() => {
      if (topicDocumentId) {
        navigate(
          `/tema/${encodeURIComponent(
            topicDocumentId
          )}`
        );

        return;
      }

      navigate("/temas");
    }, [
      navigate,
      topicDocumentId
    ]);

  const handleCancel =
    useCallback(() => {
      handleBackToTopic();
    }, [
      handleBackToTopic
    ]);

  /*
  |--------------------------------------------------------------------------
  | Load topic
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    const loadTopic =
      async () => {
        setLoadingTopic(true);
        setTopicError("");

        if (!topicDocumentId) {
          if (active) {
            setTopic(
              createFallbackTopic()
            );

            setTopicError(
              "Nie określono tematu misji. Możesz mimo to utworzyć własną rozmowę."
            );

            setLoadingTopic(
              false
            );
          }

          return;
        }

        try {
          const topicReference =
            doc(
              db,
              "temas",
              topicDocumentId
            );

          const topicSnapshot =
            await getDoc(
              topicReference
            );

          if (!active) {
            return;
          }

          if (
            topicSnapshot.exists()
          ) {
            setTopic({
              id:
                topicSnapshot.id,

              ...topicSnapshot.data()
            });

            return;
          }

          setTopic(
            createFallbackTopic(
              topicDocumentId
            )
          );

          setTopicError(
            "Nie znaleziono tego tematu w bazie danych. Misja zostanie utworzona na podstawie nazwy widocznej w adresie."
          );
        } catch (error) {
          console.error(
            "Error loading topic for personalized mission:",
            {
              code:
                error?.code,
              message:
                error?.message,
              topicDocumentId
            }
          );

          if (!active) {
            return;
          }

          setTopic(
            createFallbackTopic(
              topicDocumentId
            )
          );

          setTopicError(
            "Nie udało się pobrać pełnych informacji o temacie. Możesz nadal utworzyć misję albo spróbować ponownie."
          );
        } finally {
          if (active) {
            setLoadingTopic(
              false
            );
          }
        }
      };

    loadTopic();

    return () => {
      active = false;
    };
  }, [
    retryCounter,
    topicDocumentId
  ]);

  /*
  |--------------------------------------------------------------------------
  | Start personalized mission
  |--------------------------------------------------------------------------
  */

  const handleStartMission =
    useCallback(
      async ({
        mission,
        preview,
        formData
      }) => {
        if (
          !mission ||
          typeof mission !==
            "object"
        ) {
          throw new Error(
            "Nie można rozpocząć misji, ponieważ jej dane są nieprawidłowe."
          );
        }

        const destinationTopicId =
          topic?.id ||
          topicDocumentId ||
          "personalized";

        navigate(
          `/tema/${encodeURIComponent(
            destinationTopicId
          )}/mission-chat`,
          {
            state: {
              topic:
                topic ||
                createFallbackTopic(
                  destinationTopicId
                ),

              mission,

              missionPreview:
                preview || null,

              personalizationForm:
                formData || null,

              isCustomMission:
                true,

              isPersonalizedMission:
                true,

              missionSource:
                "ai_personalization"
            }
          }
        );
      },
      [
        navigate,
        topic,
        topicDocumentId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (loadingTopic) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div
          role="status"
          aria-live="polite"
          className="text-center"
        >
          <FaSpinner
            className="mx-auto mb-4 animate-spin text-4xl text-primary-600"
            aria-hidden="true"
          />

          <p className="font-semibold text-gray-800">
            Wczytywanie tematu
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Przygotowujemy kreator misji personalizowanej.
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-primary-50 via-white to-white pb-10 pt-4 md:py-10">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4">
        <button
          type="button"
          onClick={
            handleBackToTopic
          }
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:mb-6"
        >
          <FaArrowLeft
            aria-hidden="true"
          />

          Wróć do misji
        </button>

        <header className="relative mb-5 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:mb-8 md:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-100/60 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-secondary-100/50 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex items-start gap-4 md:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-3xl shadow-inner md:h-20 md:w-20 md:text-5xl">
              {topicIcon}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 md:text-sm">
                Personalizowana misja AI
              </p>

              <h1 className="mt-1 break-words text-2xl font-bold leading-tight text-gray-900 md:text-4xl">
                Utwórz własną misję:
                {" "}
                {topicTitle}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                Opisz sytuację, cel oraz rolę rozmówcy. Sztuczna inteligencja
                przygotuje kompletną misję konwersacyjną, którą sprawdzisz przed
                rozpoczęciem.
              </p>

              {topic?.description && (
                <p className="mt-3 max-w-3xl text-xs leading-relaxed text-gray-500 md:text-sm">
                  {normalizeText(
                    topic.description,
                    1000
                  )}
                </p>
              )}
            </div>
          </div>
        </header>

        {topicError && (
          <section
            role="status"
            aria-live="polite"
            className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900 md:mb-6"
          >
            <div className="flex items-start gap-3">
              <FaExclamationTriangle
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Ograniczone informacje o temacie
                    </p>

                    <p className="mt-1 text-sm leading-relaxed">
                      {topicError}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setTopicError("")
                    }
                    className="shrink-0 rounded-lg p-1.5 transition hover:bg-yellow-100"
                    aria-label="Zamknij komunikat"
                  >
                    <FaTimes />
                  </button>
                </div>

                {topicDocumentId && (
                  <button
                    type="button"
                    onClick={() =>
                      setRetryCounter(
                        (currentValue) =>
                          currentValue +
                          1
                      )
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold transition hover:bg-white"
                  >
                    <FaRedo />

                    Spróbuj ponownie
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <PersonalizedMissionWizard
          topic={
            topic ||
            createFallbackTopic(
              topicDocumentId
            )
          }
          onStartMission={
            handleStartMission
          }
          onCancel={
            handleCancel
          }
        />
      </div>
    </main>
  );
};

export default PersonalizedMissionPage;