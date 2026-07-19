// src/pages/Test.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

import { auth } from "../firebase";

import {
  getAllTests,
  hasRecentTest,
  saveUserTestResult
} from "../services/auth/firestoreService";

import {
  evaluateWritingSection
} from "../utils/testScoring";

import TestInstructions from "../components/test/TestInstructions";
import TestLevelResultModal from "../components/test/TestLevelResultModal";
import TestNavigation from "../components/test/TestNavigation";
import TestProgress from "../components/test/TestProgress";
import TestResults from "../components/test/TestResults";
import TestSectionRenderer from "../components/test/TestSectionRenderer";
import Timer from "../components/test/Timer";

const CEFR_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
];

const TEST_SECTIONS = [
  "multipleChoice",
  "writing",
  "reading"
];

const MIN_SCORE_TO_PASS = 70;
const TEST_DURATION_SECONDS = 7200;

/*
 * Ponderación provisional del Placement Test.
 *
 * Writing conserva un peso menor mientras la evaluación automática
 * continúa en proceso de calibración académica.
 */
const SECTION_WEIGHTS = {
  multipleChoice: 0.425,
  writing: 0.15,
  reading: 0.425
};

/*
 * Configuración provisional del contenido mostrado por nivel.
 *
 * Estas cantidades se consolidarán posteriormente en
 * CEFR_PLACEMENT_TEST_BLUEPRINT.md.
 */
const TEST_BLUEPRINT = {
  A1: {
    multipleChoice: 10,
    writing: 2,
    reading: 1
  },

  A2: {
    multipleChoice: 10,
    writing: 2,
    reading: 1
  },

  B1: {
    multipleChoice: 12,
    writing: 2,
    reading: 2
  },

  B2: {
    multipleChoice: 12,
    writing: 2,
    reading: 2
  },

  C1: {
    multipleChoice: 14,
    writing: 2,
    reading: 2
  },

  C2: {
    multipleChoice: 14,
    writing: 2,
    reading: 2
  }
};

const clampScore = (score) => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(numericScore))
  );
};

const shuffleArray = (array = []) => {
  const shuffled = [...array];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
};

const normalizeAnswer = (value = "") =>
  String(value)
    .trim()
    .toLowerCase();

const normalizeMultipleChoiceQuestion = (
  question = {},
  index = 0
) => ({
  ...question,

  id:
    question.id ||
    `multiple_choice_${index}`,

  question:
    question.question || "",

  options:
    Array.isArray(question.options)
      ? question.options
      : [],

  correctAnswer:
    question.correctAnswer ??
    question.correct_answer ??
    question.answer ??
    ""
});

const normalizeWritingQuestion = (
  question = {},
  index = 0
) => {
  const taskText =
    question.question ||
    question.prompt ||
    question.task ||
    question.instructions ||
    question.trescZadania ||
    question.treśćZadania ||
    "";

  const expectedAnswer =
    question.example ||
    question.expectedAnswer ||
    question.expected_answer ||
    question.sampleAnswer ||
    question.modelAnswer ||
    question.przykladOczekiwanejOdpowiedzi ||
    question.przykładOczekiwanejOdpowiedzi ||
    "";

  const minWords = Number(
    question.minWords ??
    question.minimumWords ??
    question.min_words ??
    question.minimalnaLiczbaSlow ??
    0
  );

  const maxWords = Number(
    question.maxWords ??
    question.maximumWords ??
    question.max_words ??
    question.maksymalnaLiczbaSlow ??
    0
  );

  const criteria =
    question.criteria ||
    question.assessmentCriteria ||
    question.assessment_criteria ||
    question.kryteria ||
    [];

  const keywordCategories =
    question.keywordCategories ||
    question.keyword_categories ||
    question.categories ||
    question.keywordGroups ||
    [];

  const keywords =
    question.keywords ||
    question.requiredKeywords ||
    question.required_keywords ||
    [];

  return {
    ...question,

    id:
      question.id ||
      question.questionId ||
      `writing_${index}`,

    question: taskText,
    prompt: taskText,

    instructions:
      question.instructions || "",

    example: expectedAnswer,
    expectedAnswer,

    minWords:
      Number.isFinite(minWords) &&
      minWords > 0
        ? minWords
        : 0,

    maxWords:
      Number.isFinite(maxWords) &&
      maxWords > 0
        ? maxWords
        : 0,

    criteria,
    assessmentCriteria: criteria,

    keywords,
    keywordCategories
  };
};

const normalizeReadingText = (
  text = {},
  textIndex = 0
) => ({
  ...text,

  id:
    text.id ||
    `reading_${textIndex}`,

  title:
    text.title || "",

  author:
    text.author || "",

  text:
    text.text || "",

  questions:
    Array.isArray(text.questions)
      ? text.questions.map(
          (question, questionIndex) => ({
            ...question,

            id:
              question.id ||
              `reading_${textIndex}_question_${questionIndex}`,

            question:
              question.question || "",

            options:
              Array.isArray(question.options)
                ? question.options
                : [],

            correctAnswer:
              question.correctAnswer ??
              question.correct_answer ??
              question.answer ??
              ""
          })
        )
      : []
});

const normalizeTest = (test = {}) => {
  const level =
    test.level || test.id;

  return {
    ...test,
    level,

    sections: {
      multipleChoice: {
        questions:
          Array.isArray(
            test.sections?.multipleChoice?.questions
          )
            ? test.sections.multipleChoice.questions.map(
                normalizeMultipleChoiceQuestion
              )
            : []
      },

      writing: {
        questions:
          Array.isArray(
            test.sections?.writing?.questions
          )
            ? test.sections.writing.questions.map(
                normalizeWritingQuestion
              )
            : []
      },

      reading: {
        texts:
          Array.isArray(
            test.sections?.reading?.texts
          )
            ? test.sections.reading.texts.map(
                normalizeReadingText
              )
            : []
      }
    }
  };
};

const buildSelectedQuestionsForLevel = (
  level,
  testsSource
) => {
  const levelTest =
    testsSource[level];

  const blueprint =
    TEST_BLUEPRINT[level] ||
    TEST_BLUEPRINT.A1;

  if (!levelTest) {
    return {
      multipleChoice: [],
      writing: [],
      reading: []
    };
  }

  return {
    multipleChoice: shuffleArray(
      levelTest.sections
        ?.multipleChoice
        ?.questions || []
    ).slice(
      0,
      blueprint.multipleChoice
    ),

    writing: shuffleArray(
      levelTest.sections
        ?.writing
        ?.questions || []
    ).slice(
      0,
      blueprint.writing
    ),

    reading: shuffleArray(
      levelTest.sections
        ?.reading
        ?.texts || []
    ).slice(
      0,
      blueprint.reading
    )
  };
};

const shouldAllowBrowserAction = (
  event
) => {
  const tagName =
    event.target
      ?.tagName
      ?.toLowerCase();

  return [
    "input",
    "textarea",
    "select"
  ].includes(tagName);
};

const hasSectionQuestions = (
  selectedLevelQuestions = {},
  section
) => {
  const sectionQuestions =
    selectedLevelQuestions[section] ||
    [];

  if (section === "reading") {
    return sectionQuestions.some(
      (text) =>
        Array.isArray(text.questions) &&
        text.questions.length > 0
    );
  }

  return sectionQuestions.length > 0;
};

const buildWritingCacheKey = ({
  level,
  questions,
  answers
}) => {
  const questionIds =
    questions.map(
      (question) => question.id
    );

  const answerValues =
    questionIds.map(
      (questionId) =>
        answers?.[questionId] || ""
    );

  return JSON.stringify({
    level,
    questionIds,
    answerValues
  });
};

const Test = () => {
  const navigate = useNavigate();

  const writingEvaluationCache =
    useRef(new Map());

  const isFinishingRef =
    useRef(false);

  const [tests, setTests] =
    useState({});

  const [
    selectedQuestions,
    setSelectedQuestions
  ] = useState({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    currentLevel,
    setCurrentLevel
  ] = useState("");

  const [
    currentSection,
    setCurrentSection
  ] = useState("multipleChoice");

  const [answers, setAnswers] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(null);

  const [
    testStarted,
    setTestStarted
  ] = useState(false);

  const [
    showResults,
    setShowResults
  ] = useState(false);

  const [
    showLevelResults,
    setShowLevelResults
  ] = useState(false);

  const [
    levelResults,
    setLevelResults
  ] = useState({});

  const [
    levelDetails,
    setLevelDetails
  ] = useState({});

  const [
    currentLevelEvaluation,
    setCurrentLevelEvaluation
  ] = useState(null);

  const [
    finalResults,
    setFinalResults
  ] = useState(null);

  const [loadError, setLoadError] =
    useState("");

  const [
    retakeBlocked,
    setRetakeBlocked
  ] = useState(false);

  const availableTestLevels =
    useMemo(() => {
      return CEFR_LEVELS.filter(
        (level) => tests[level]
      );
    }, [tests]);

  const testsLoaded =
    availableTestLevels.length > 0;

  const getSelectedSectionQuestions =
    useCallback(
      (level, section) => {
        return (
          selectedQuestions
            ?.[level]
            ?.[section] ||
          []
        );
      },
      [selectedQuestions]
    );

  const getQuestionsForValidation =
    useCallback(
      (level, section) => {
        const sectionQuestions =
          getSelectedSectionQuestions(
            level,
            section
          );

        if (section === "reading") {
          return sectionQuestions.flatMap(
            (text) =>
              text.questions || []
          );
        }

        return sectionQuestions;
      },
      [
        getSelectedSectionQuestions
      ]
    );

  const calculateObjectiveSectionScore =
    useCallback(
      (
        section,
        level
      ) => {
        const sectionAnswers =
          answers
            ?.[level]
            ?.[section] ||
          {};

        const sectionQuestions =
          getSelectedSectionQuestions(
            level,
            section
          );

        if (
          !Array.isArray(
            sectionQuestions
          ) ||
          sectionQuestions.length === 0
        ) {
          return null;
        }

        if (
          section ===
          "multipleChoice"
        ) {
          const total =
            sectionQuestions.length;

          const correct =
            sectionQuestions.filter(
              (question) =>
                normalizeAnswer(
                  sectionAnswers[
                    question.id
                  ]
                ) ===
                normalizeAnswer(
                  question.correctAnswer
                )
            ).length;

          return total > 0
            ? (correct / total) * 100
            : null;
        }

        if (section === "reading") {
          const questions =
            sectionQuestions.flatMap(
              (text) =>
                text.questions || []
            );

          if (
            questions.length === 0
          ) {
            return null;
          }

          const correct =
            questions.filter(
              (question) =>
                normalizeAnswer(
                  sectionAnswers[
                    question.id
                  ]
                ) ===
                normalizeAnswer(
                  question.correctAnswer
                )
            ).length;

          return (
            (correct /
              questions.length) *
            100
          );
        }

        return null;
      },
      [
        answers,
        getSelectedSectionQuestions
      ]
    );

  const getWritingEvaluation =
    useCallback(
      async (level) => {
        const questions =
          getSelectedSectionQuestions(
            level,
            "writing"
          );

        if (
          !Array.isArray(questions) ||
          questions.length === 0
        ) {
          return {
            status: "unavailable",
            score: null,
            totalScore: null,
            provider: null,

            isFinal: false,

            requiresReview: true,
            requiresManualReview: true,

            totalQuestions: 0,
            evaluatedQuestions: 0,
            finalQuestions: 0,
            estimatedQuestions: 0,
            invalidQuestions: 0,
            pendingQuestions: 0,

            results: [],

            evaluatedAt:
              new Date().toISOString()
          };
        }

        const writingAnswers =
          answers
            ?.[level]
            ?.writing ||
          {};

        const cacheKey =
          buildWritingCacheKey({
            level,
            questions,
            answers:
              writingAnswers
          });

        const cachedEvaluation =
          writingEvaluationCache.current.get(
            cacheKey
          );

        if (cachedEvaluation) {
          return cachedEvaluation;
        }

        const evaluation =
          await evaluateWritingSection(
            writingAnswers,
            questions,
            {
              level,

              useAI: true,

              /*
               * Evita enviar simultáneamente varias respuestas a Gemini.
               * Esto reduce errores 429 y facilita el uso de la cuota gratuita.
               */
              sequential: true
            }
          );

        writingEvaluationCache.current.set(
          cacheKey,
          evaluation
        );

        return evaluation;
      },
      [
        answers,
        getSelectedSectionQuestions
      ]
    );

  const calculateSectionScore =
    useCallback(
      async (
        section,
        level
      ) => {
        try {
          if (
            section === "writing"
          ) {
            const evaluation =
              await getWritingEvaluation(
                level
              );

            return typeof
              evaluation?.score ===
              "number"
              ? evaluation.score
              : null;
          }

          return calculateObjectiveSectionScore(
            section,
            level
          );
        } catch (error) {
          console.error(
            "Error calculating section score:",
            error
          );

          return null;
        }
      },
      [
        calculateObjectiveSectionScore,
        getWritingEvaluation
      ]
    );

  const calculateLevelEvaluation =
    useCallback(
      async (
        level,
        {
          allowIncomplete = false
        } = {}
      ) => {
        const [
          multipleChoiceScore,
          writingEvaluation,
          readingScore
        ] = await Promise.all([
          calculateSectionScore(
            "multipleChoice",
            level
          ),
        
          getWritingEvaluation(
            level
          ),
        
          calculateSectionScore(
            "reading",
            level
          )
        ]);
      
        const writingScore =
          typeof
            writingEvaluation?.score ===
            "number" &&
          Number.isFinite(
            writingEvaluation.score
          )
            ? writingEvaluation.score
            : null;
        
        const sectionScores = {
          multipleChoice:
            multipleChoiceScore,
        
          writing:
            writingScore,
        
          reading:
            readingScore
        };
      
        const availableSections =
          Object.entries(
            sectionScores
          ).filter(
            ([, score]) =>
              typeof score ===
                "number" &&
              Number.isFinite(score)
          );
        
        if (
          availableSections.length ===
          0
        ) {
          return {
            level,
          
            score: 0,
          
            sectionScores,
          
            weights:
              SECTION_WEIGHTS,
          
            writingEvaluation,
          
            status:
              "unavailable",
          
            isFinal: false,
          
            requiresReview: true,
            requiresManualReview: true,
          
            allowIncomplete,
          
            evaluatedAt:
              new Date().toISOString()
          };
        }
      
        const availableWeight =
          availableSections.reduce(
            (
              total,
              [section]
            ) => {
              return (
                total +
                SECTION_WEIGHTS[
                  section
                ]
              );
            },
            0
          );
        
        const weightedScore =
          availableSections.reduce(
            (
              total,
              [
                section,
                score
              ]
            ) => {
              const weight =
                SECTION_WEIGHTS[
                  section
                ];
              
              return (
                total +
                score * weight
              );
            },
            0
          );
        
        const normalizedScore =
          availableWeight > 0
            ? weightedScore /
              availableWeight
            : 0;
        
        const writingIsFinal =
          writingEvaluation
            ?.isFinal === true;
        
        const writingRequiresReview =
          writingEvaluation
            ?.requiresReview === true ||
          writingEvaluation
            ?.requiresManualReview ===
            true;
        
        const writingStatus =
          writingEvaluation
            ?.status ||
          "unavailable";
        
        let evaluationStatus =
          "estimated";
        
        if (
          writingIsFinal &&
          !writingRequiresReview
        ) {
          evaluationStatus =
            "evaluated";
        } else if (
          writingStatus ===
          "partially_evaluated"
        ) {
          evaluationStatus =
            "partially_evaluated";
        } else if (
          writingStatus ===
          "unavailable"
        ) {
          evaluationStatus =
            "estimated";
        }
      
        return {
          level,
        
          score:
            clampScore(
              normalizedScore
            ),
          
          sectionScores: {
            multipleChoice:
              multipleChoiceScore ===
              null
                ? null
                : clampScore(
                    multipleChoiceScore
                  ),
                
            writing:
              writingScore === null
                ? null
                : clampScore(
                    writingScore
                  ),
                
            reading:
              readingScore === null
                ? null
                : clampScore(
                    readingScore
                  )
          },
        
          weights:
            SECTION_WEIGHTS,
        
          writingEvaluation,
        
          writingStatus,
        
          status:
            evaluationStatus,
        
          isFinal:
            writingIsFinal &&
            !writingRequiresReview,
        
          requiresReview:
            writingRequiresReview,
        
          requiresManualReview:
            writingRequiresReview,
        
          allowIncomplete,
        
          evaluatedAt:
            new Date().toISOString()
        };
      },
      [
        calculateSectionScore,
        getWritingEvaluation
      ]
    );

  const validateCurrentLevelAnswers =
    useCallback(() => {
      return TEST_SECTIONS.every(
        (section) => {
          const questions =
            getQuestionsForValidation(
              currentLevel,
              section
            );

          const sectionAnswers =
            answers
              ?.[currentLevel]
              ?.[section] ||
            {};

          if (
            questions.length === 0
          ) {
            return false;
          }

          return questions.every(
            (question) => {
              const answer =
                sectionAnswers[
                  question.id
                ];

              if (
                typeof answer ===
                "string"
              ) {
                return (
                  answer.trim()
                    .length > 0
                );
              }

              return Boolean(answer);
            }
          );
        }
      );
    }, [
      answers,
      currentLevel,
      getQuestionsForValidation
    ]);

  const determineFinalLevel =
    useCallback(
      (results) => {
        if (
          availableTestLevels.length ===
          0
        ) {
          return "A1";
        }

        let finalLevel =
          availableTestLevels[0];

        for (
          const level of
          availableTestLevels
        ) {
          const score =
            Number(
              results?.[level]
            );

          if (
            Number.isFinite(score) &&
            score >=
              MIN_SCORE_TO_PASS
          ) {
            finalLevel = level;
            continue;
          }

          break;
        }

        return finalLevel;
      },
      [availableTestLevels]
    );

  const finishTest =
    useCallback(
      async ({
        resultsToSave =
          levelResults,

        detailsToSave =
          levelDetails
      } = {}) => {
        if (
          isFinishingRef.current
        ) {
          return;
        }

        isFinishingRef.current =
          true;

        try {
          if (!auth.currentUser) {
            throw new Error(
              "Authenticated user not found."
            );
          }

          const safeResults =
            resultsToSave || {};

          const safeDetails =
            detailsToSave || {};

          const calculatedFinalLevel =
            determineFinalLevel(
              safeResults
            );

          const timeSpent =
            TEST_DURATION_SECONDS -
            Math.max(
              Number(timeLeft) || 0,
              0
            );

          const evaluatedLevels =
            Object.values(
              safeDetails
            );

          const hasPendingWriting =
            evaluatedLevels.some(
              (detail) =>
                detail
                  ?.writingEvaluation
                  ?.isFinal !== true
            );

          const resultStatus =
            hasPendingWriting
              ? "estimated"
              : "final";

          const skillResults =
            Object.fromEntries(
              Object.entries(
                safeDetails
              ).map(
                ([
                  level,
                  detail
                ]) => [
                  level,
                  detail
                    ?.sectionScores ||
                    {}
                ]
              )
            );

          const finalTestData = {
            userId:
              auth.currentUser.uid,

            placementLevel:
              calculatedFinalLevel,

            finalLevel:
              calculatedFinalLevel,

            resultStatus,

            levelResults:
              safeResults,

            levelDetails:
              safeDetails,

            skillResults,

            timeSpent,

            timeLimit:
              TEST_DURATION_SECONDS,

            passingScore:
              MIN_SCORE_TO_PASS,

            sectionWeights:
              SECTION_WEIGHTS,

            testDate:
              new Date().toISOString(),

            completed: true,

            requiresReview:
              hasPendingWriting
          };

          await saveUserTestResult(
            auth.currentUser.uid,
            finalTestData
          );

          const scoreValues =
            Object.values(
              safeResults
            ).filter(
              (score) =>
                Number.isFinite(
                  Number(score)
                )
            );

          const overallScore =
            scoreValues.length > 0
              ? clampScore(
                  scoreValues.reduce(
                    (
                      total,
                      score
                    ) =>
                      total +
                      Number(score),
                    0
                  ) /
                    scoreValues.length
                )
              : 0;

          setFinalResults({
            placementLevel:
              calculatedFinalLevel,

            finalLevel:
              calculatedFinalLevel,

            overallScore,

            levelResults:
              safeResults,

            levelDetails:
              safeDetails,

            skillResults,

            resultStatus,

            requiresReview:
              hasPendingWriting,

            timeSpent
          });

          setShowResults(true);
          setShowLevelResults(
            false
          );
          setTestStarted(false);
        } catch (error) {
          console.error(
            "Error finishing test:",
            error
          );

          alert(
            "Nie udało się zapisać wyników testu. Spróbuj ponownie."
          );
        } finally {
          isFinishingRef.current =
            false;
        }
      },
      [
        determineFinalLevel,
        levelDetails,
        levelResults,
        timeLeft
      ]
    );

  useEffect(() => {
    const loadTests = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const allTests =
          await getAllTests();

        const testsObject =
          allTests.reduce(
            (
              accumulator,
              test
            ) => {
              const normalizedTest =
                normalizeTest(test);

              if (
                CEFR_LEVELS.includes(
                  normalizedTest.level
                )
              ) {
                accumulator[
                  normalizedTest.level
                ] = normalizedTest;
              }

              return accumulator;
            },
            {}
          );

        setTests(testsObject);

        const firstAvailableLevel =
          CEFR_LEVELS.find(
            (level) =>
              testsObject[level]
          );

        if (
          firstAvailableLevel
        ) {
          setCurrentLevel(
            firstAvailableLevel
          );
        }
      } catch (error) {
        console.error(
          "Error loading tests:",
          error
        );

        setLoadError(
          "Nie udało się załadować testów. Spróbuj ponownie później."
        );
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            setIsLoading(true);

            if (!user) {
              navigate("/login");
              return;
            }

            const alreadyTested =
              await hasRecentTest(
                user.uid
              );

            /*
             * El usuario puede ingresar a la página aunque aún no
             * pueda iniciar un nuevo intento.
             *
             * El acceso al historial se completará al actualizar
             * firestoreService y la pantalla de resultados.
             */
            setRetakeBlocked(
              Boolean(
                alreadyTested
              )
            );

            await loadTests();
          } catch (error) {
            console.error(
              "Error preparing test:",
              error
            );

            setLoadError(
              "Nie udało się przygotować testu. Spróbuj ponownie później."
            );

            setIsLoading(false);
          }
        }
      );

    return () =>
      unsubscribe();
  }, [navigate]);

  const getAvailableTestLevels =
    useCallback(
      () =>
        availableTestLevels,
      [availableTestLevels]
    );

  const startTest = () => {
    if (retakeBlocked) {
      alert(
        "Nie możesz jeszcze rozpocząć nowego testu. Poprzedni wynik pozostaje zapisany."
      );

      return;
    }

    const levelToStart =
      availableTestLevels[0];

    if (
      !levelToStart ||
      !tests[levelToStart]
    ) {
      alert(
        "Brak dostępnych testów. Utwórz co najmniej jeden test A1, A2, B1, B2, C1 lub C2 w panelu administracyjnym."
      );

      return;
    }

    const initialQuestions =
      buildSelectedQuestionsForLevel(
        levelToStart,
        tests
      );

    const allSectionsAvailable =
      TEST_SECTIONS.every(
        (section) =>
          hasSectionQuestions(
            initialQuestions,
            section
          )
      );

    if (!allSectionsAvailable) {
      alert(
        "Wybrany test nie ma kompletu sekcji. Sprawdź pytania w panelu administracyjnym."
      );

      return;
    }

    writingEvaluationCache
      .current
      .clear();

    isFinishingRef.current =
      false;

    setCurrentLevel(
      levelToStart
    );

    setCurrentSection(
      "multipleChoice"
    );

    setSelectedQuestions({
      [levelToStart]:
        initialQuestions
    });

    setAnswers({});
    setLevelResults({});
    setLevelDetails({});
    setCurrentLevelEvaluation(
      null
    );
    setFinalResults(null);
    setShowResults(false);
    setShowLevelResults(
      false
    );

    setTestStarted(true);
    setTimeLeft(
      TEST_DURATION_SECONDS
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleAnswerSelect = (
    questionId,
    answer
  ) => {
    if (
      currentSection ===
      "writing"
    ) {
      writingEvaluationCache
        .current
        .clear();

      setCurrentLevelEvaluation(
        null
      );
    }

    setAnswers((previous) => ({
      ...previous,

      [currentLevel]: {
        ...previous[
          currentLevel
        ],

        [currentSection]: {
          ...previous[
            currentLevel
          ]?.[currentSection],

          [questionId]:
            answer
        }
      }
    }));
  };

  const handleLevelCompletion =
    async () => {
      const allQuestionsAnswered =
        validateCurrentLevelAnswers();

      if (!allQuestionsAnswered) {
        alert(
          "Odpowiedz na wszystkie widoczne pytania przed przejściem dalej."
        );

        return;
      }

      setIsLoading(true);

      try {
        const evaluation =
          await calculateLevelEvaluation(
            currentLevel
          );

        setCurrentLevelEvaluation(
          evaluation
        );

        setLevelResults(
          (previous) => ({
            ...previous,

            [currentLevel]:
              evaluation.score
          })
        );

        setLevelDetails(
          (previous) => ({
            ...previous,

            [currentLevel]:
              evaluation
          })
        );

        setShowLevelResults(
          true
        );
      } catch (error) {
        console.error(
          "Error completing level:",
          error
        );

        alert(
          "Nie udało się obliczyć wyniku poziomu. Spróbuj ponownie."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleLevelContinue =
    async () => {
      setIsLoading(true);

      try {
        const evaluation =
          currentLevelEvaluation ||
          (await calculateLevelEvaluation(
            currentLevel
          ));

        const currentScore =
          evaluation.score;

        const updatedLevelResults = {
          ...levelResults,

          [currentLevel]:
            currentScore
        };

        const updatedLevelDetails = {
          ...levelDetails,

          [currentLevel]:
            evaluation
        };

        setLevelResults(
          updatedLevelResults
        );

        setLevelDetails(
          updatedLevelDetails
        );

        const currentLevelIndex =
          availableTestLevels.indexOf(
            currentLevel
          );

        if (
          currentScore >=
          MIN_SCORE_TO_PASS
        ) {
          const nextLevel =
            availableTestLevels[
              currentLevelIndex + 1
            ];

          if (nextLevel) {
            const nextQuestions =
              selectedQuestions[
                nextLevel
              ] ||
              buildSelectedQuestionsForLevel(
                nextLevel,
                tests
              );

            const allSectionsAvailable =
              TEST_SECTIONS.every(
                (section) =>
                  hasSectionQuestions(
                    nextQuestions,
                    section
                  )
              );

            if (
              !allSectionsAvailable
            ) {
              await finishTest({
                resultsToSave:
                  updatedLevelResults,

                detailsToSave:
                  updatedLevelDetails
              });

              return;
            }

            setCurrentLevel(
              nextLevel
            );

            setCurrentSection(
              "multipleChoice"
            );

            setCurrentLevelEvaluation(
              null
            );

            setShowLevelResults(
              false
            );

            setSelectedQuestions(
              (previous) => ({
                ...previous,

                [nextLevel]:
                  nextQuestions
              })
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });

            return;
          }
        }

        await finishTest({
          resultsToSave:
            updatedLevelResults,

          detailsToSave:
            updatedLevelDetails
        });
      } catch (error) {
        console.error(
          "Error continuing level:",
          error
        );

        alert(
          "Wystąpił błąd. Spróbuj ponownie."
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleTimeUp =
    useCallback(async () => {
      if (
        isFinishingRef.current
      ) {
        return;
      }

      setIsLoading(true);

      try {
        let updatedResults = {
          ...levelResults
        };

        let updatedDetails = {
          ...levelDetails
        };

        if (
          currentLevel &&
          selectedQuestions[
            currentLevel
          ]
        ) {
          const evaluation =
            await calculateLevelEvaluation(
              currentLevel,
              {
                allowIncomplete: true
              }
            );

          updatedResults = {
            ...updatedResults,

            [currentLevel]:
              evaluation.score
          };

          updatedDetails = {
            ...updatedDetails,

            [currentLevel]:
              evaluation
          };

          setLevelResults(
            updatedResults
          );

          setLevelDetails(
            updatedDetails
          );
        }

        await finishTest({
          resultsToSave:
            updatedResults,

          detailsToSave:
            updatedDetails
        });
      } catch (error) {
        console.error(
          "Error handling test timeout:",
          error
        );

        alert(
          "Czas testu upłynął. Nie udało się automatycznie zapisać wszystkich wyników."
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      calculateLevelEvaluation,
      currentLevel,
      finishTest,
      levelDetails,
      levelResults,
      selectedQuestions
    ]);

  const handleNextSection =
    () => {
      const currentIndex =
        TEST_SECTIONS.indexOf(
          currentSection
        );

      if (
        currentIndex ===
        TEST_SECTIONS.length - 1
      ) {
        handleLevelCompletion();
        return;
      }

      setCurrentSection(
        TEST_SECTIONS[
          currentIndex + 1
        ]
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };

  const handlePreviousSection =
    () => {
      const currentIndex =
        TEST_SECTIONS.indexOf(
          currentSection
        );

      if (currentIndex > 0) {
        setCurrentSection(
          TEST_SECTIONS[
            currentIndex - 1
          ]
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    };

  const handleBlockedCopy =
    (event) => {
      if (
        shouldAllowBrowserAction(
          event
        )
      ) {
        return;
      }

      event.preventDefault();
    };

  const handleBlockedKeyDown =
    (event) => {
      if (
        shouldAllowBrowserAction(
          event
        )
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        [
          "a",
          "c",
          "x",
          "s",
          "p"
        ].includes(key)
      ) {
        event.preventDefault();
      }
    };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <TestResults
            results={finalResults}
          />

          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() =>
                navigate("/curso")
              }
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-4 px-8 rounded-2xl"
            >
              Rozpocznij kurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    !testStarted &&
    isLoading
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full">
          <FaSpinner className="animate-spin text-primary-600 text-4xl mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-gray-800">
            Ładowanie pytań
            testowych...
          </h2>

          <p className="text-gray-500 mt-2">
            Przygotowujemy test
            poziomujący.
          </p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <TestInstructions
          onStart={startTest}
        />

        {retakeBlocked && (
          <div className="container mx-auto px-4 max-w-3xl pb-5">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm">
              Poprzedni test został
              zapisany. Obecnie nie
              możesz rozpocząć nowej
              próby. Dostęp do historii
              wyników zostanie pokazany
              w tej sekcji po zakończeniu
              aktualizacji modułu.
            </div>
          </div>
        )}

        {loadError && (
          <div className="container mx-auto px-4 max-w-3xl pb-5">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {loadError}
            </div>
          </div>
        )}

        {!testsLoaded &&
          !isLoading &&
          !loadError && (
            <div className="container mx-auto px-4 max-w-3xl pb-10">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
                Brak dostępnych testów.
                Utwórz co najmniej jeden
                test w panelu
                administracyjnym.
              </div>
            </div>
          )}
      </div>
    );
  }

  if (
    isLoading ||
    !tests[currentLevel]
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary-600 text-4xl mx-auto mb-4" />

          <p className="text-gray-600">
            Ładowanie pytań...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-8 select-none"
      onCopy={handleBlockedCopy}
      onCut={handleBlockedCopy}
      onContextMenu={
        handleBlockedCopy
      }
      onKeyDown={
        handleBlockedKeyDown
      }
      onDragStart={(event) =>
        event.preventDefault()
      }
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        {showLevelResults && (
          <TestLevelResultModal
            currentLevel={
              currentLevel
            }
            isLoading={
              isLoading
            }
            calculateSectionScore={
              calculateSectionScore
            }
            getAvailableTestLevels={
              getAvailableTestLevels
            }
            handleLevelContinue={
              handleLevelContinue
            }
            levelEvaluation={
              currentLevelEvaluation
            }
          />
        )}

        <Timer
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onTimeUp={handleTimeUp}
        />

        <div className="mb-5 md:mb-8">
          <TestProgress
            currentFilter={
              currentLevel
            }
            currentSection={
              currentSection
            }
            totalFilters={tests}
          />
        </div>

        <main className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
          <div className="mb-5 md:mb-8">
            <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Test poziomujący CEFR
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Sekcja testu
            </h1>

            <p className="text-sm md:text-base text-gray-600 mt-2">
              Odpowiedz na wszystkie
              pytania przed przejściem
              do kolejnej części.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            <TestSectionRenderer
              currentLevel={
                currentLevel
              }
              currentSection={
                currentSection
              }
              selectedQuestions={
                selectedQuestions
              }
              answers={answers}
              handleAnswerSelect={
                handleAnswerSelect
              }
            />
          </div>

          <TestNavigation
            currentSection={
              currentSection
            }
            handlePreviousSection={
              handlePreviousSection
            }
            handleNextSection={
              handleNextSection
            }
          />
        </main>
      </div>
    </div>
  );
};

export default Test;