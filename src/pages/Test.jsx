// src/pages/Test.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

import { auth } from "../firebase";

import {
  saveUserTestResult,
  hasRecentTest
} from "../services/firestoreService";

import { getAllTests } from "../utils/testService";

import TestProgress from "../components/test/TestProgress";
import TestInstructions from "../components/test/TestInstructions";
import TestResults from "../components/test/TestResults";
import Timer from "../components/test/Timer";
import TestLevelResultModal from "../components/test/TestLevelResultModal";
import TestSectionRenderer from "../components/test/TestSectionRenderer";
import TestNavigation from "../components/test/TestNavigation";

import { calculateWritingSectionScore } from "../utils/testScoring";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TEST_SECTIONS = ["multipleChoice", "writing", "reading"];

const MIN_SCORE_TO_PASS = 70;
const QUESTIONS_PER_SECTION = 10;
const TEST_DURATION_SECONDS = 7200;

const shuffleArray = (array = []) => {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
};

const normalizeAnswer = (value = "") =>
  value.toString().trim().toLowerCase();

const normalizeMultipleChoiceQuestion = (question = {}, index = 0) => ({
  ...question,
  id: question.id || `multiple_choice_${index}`,
  question: question.question || "",
  options: Array.isArray(question.options) ? question.options : [],
  correctAnswer:
    question.correctAnswer ??
    question.correct_answer ??
    question.answer ??
    ""
});

const normalizeWritingQuestion = (question = {}, index = 0) => ({
  ...question,
  id: question.id || `writing_${index}`,
  question: question.question || question.prompt || "",
  prompt: question.prompt || question.question || "",
  minWords: Number(question.minWords) || 0,
  maxWords: Number(question.maxWords) || 0
});

const normalizeReadingText = (text = {}, textIndex = 0) => ({
  ...text,
  id: text.id || `reading_${textIndex}`,
  title: text.title || "",
  author: text.author || "",
  text: text.text || "",
  questions: Array.isArray(text.questions)
    ? text.questions.map((question, questionIndex) => ({
        ...question,
        id:
          question.id ||
          `reading_${textIndex}_question_${questionIndex}`,
        question: question.question || "",
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer:
          question.correctAnswer ??
          question.correct_answer ??
          question.answer ??
          ""
      }))
    : []
});

const normalizeTest = (test = {}) => {
  const level = test.level || test.id;

  return {
    ...test,
    level,
    sections: {
      multipleChoice: {
        questions: Array.isArray(test.sections?.multipleChoice?.questions)
          ? test.sections.multipleChoice.questions.map(
              normalizeMultipleChoiceQuestion
            )
          : []
      },
      writing: {
        questions: Array.isArray(test.sections?.writing?.questions)
          ? test.sections.writing.questions.map(normalizeWritingQuestion)
          : []
      },
      reading: {
        texts: Array.isArray(test.sections?.reading?.texts)
          ? test.sections.reading.texts.map(normalizeReadingText)
          : []
      }
    }
  };
};

const buildSelectedQuestionsForLevel = (level, testsSource) => {
  const levelTest = testsSource[level];

  if (!levelTest) {
    return {
      multipleChoice: [],
      writing: [],
      reading: []
    };
  }

  return {
    multipleChoice: shuffleArray(
      levelTest.sections?.multipleChoice?.questions || []
    ).slice(0, QUESTIONS_PER_SECTION),

    writing: shuffleArray(
      levelTest.sections?.writing?.questions || []
    ).slice(0, QUESTIONS_PER_SECTION),

    reading: shuffleArray(levelTest.sections?.reading?.texts || [])
  };
};

const shouldAllowBrowserAction = (event) => {
  const tagName = event.target?.tagName?.toLowerCase();

  return ["input", "textarea", "select"].includes(tagName);
};

const hasSectionQuestions = (selectedLevelQuestions = {}, section) => {
  const sectionQuestions = selectedLevelQuestions[section] || [];

  if (section === "reading") {
    return sectionQuestions.some((text) => {
      return Array.isArray(text.questions) && text.questions.length > 0;
    });
  }

  return sectionQuestions.length > 0;
};

const Test = () => {
  const navigate = useNavigate();

  const [tests, setTests] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [currentLevel, setCurrentLevel] = useState("");
  const [currentSection, setCurrentSection] = useState("multipleChoice");

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [showLevelResults, setShowLevelResults] = useState(false);

  const [levelResults, setLevelResults] = useState({});
  const [finalResults, setFinalResults] = useState(null);
  const [loadError, setLoadError] = useState("");

  const availableTestLevels = useMemo(() => {
    return CEFR_LEVELS.filter((level) => tests[level]);
  }, [tests]);

  const testsLoaded = availableTestLevels.length > 0;

  const getSelectedSectionQuestions = useCallback(
    (level, section) => {
      return selectedQuestions?.[level]?.[section] || [];
    },
    [selectedQuestions]
  );

  const getQuestionsForValidation = useCallback(
    (level, section) => {
      const sectionQuestions = getSelectedSectionQuestions(level, section);

      if (section === "reading") {
        return sectionQuestions.flatMap((text) => text.questions || []);
      }

      return sectionQuestions;
    },
    [getSelectedSectionQuestions]
  );

  const calculateSectionScore = useCallback(
    async (section, level) => {
      try {
        const sectionAnswers = answers?.[level]?.[section] || {};
        const sectionQuestions = getSelectedSectionQuestions(level, section);

        if (!sectionQuestions.length) return null;

        if (section === "multipleChoice") {
          const total = sectionQuestions.length;

          const correct = sectionQuestions.filter((question) => {
            return (
              normalizeAnswer(sectionAnswers[question.id]) ===
              normalizeAnswer(question.correctAnswer)
            );
          }).length;

          return total > 0 ? (correct / total) * 100 : null;
        }

        if (section === "writing") {
          return await calculateWritingSectionScore(
            sectionAnswers,
            sectionQuestions
          );
        }

        if (section === "reading") {
          const allReadingQuestions = sectionQuestions.flatMap(
            (text) => text.questions || []
          );

          const total = allReadingQuestions.length;

          const correct = allReadingQuestions.filter((question) => {
            return (
              normalizeAnswer(sectionAnswers[question.id]) ===
              normalizeAnswer(question.correctAnswer)
            );
          }).length;

          return total > 0 ? (correct / total) * 100 : null;
        }

        return null;
      } catch (error) {
        console.error("Error calculating section score:", error);
        return null;
      }
    },
    [answers, getSelectedSectionQuestions]
  );

  const calculateLevelScore = useCallback(
    async (level) => {
      const sectionScores = await Promise.all(
        TEST_SECTIONS.map(async (section) => {
          const score = await calculateSectionScore(section, level);

          return score === null ? null : Number(score);
        })
      );

      const validScores = sectionScores.filter(
        (score) => typeof score === "number" && !Number.isNaN(score)
      );

      if (validScores.length === 0) return 0;

      return (
        validScores.reduce((sum, score) => sum + score, 0) /
        validScores.length
      );
    },
    [calculateSectionScore]
  );

  const validateCurrentLevelAnswers = useCallback(() => {
    return TEST_SECTIONS.every((section) => {
      const sectionQuestions = getQuestionsForValidation(
        currentLevel,
        section
      );

      const sectionAnswers = answers?.[currentLevel]?.[section] || {};

      if (!sectionQuestions.length) return false;

      return sectionQuestions.every((question) => {
        const answer = sectionAnswers[question.id];

        if (typeof answer === "string") {
          return answer.trim().length > 0;
        }

        return Boolean(answer);
      });
    });
  }, [answers, currentLevel, getQuestionsForValidation]);

  const determineFinalLevel = useCallback(
    (results) => {
      if (availableTestLevels.length === 0) {
        return "A1";
      }

      let finalLevel = availableTestLevels[0];

      for (const level of availableTestLevels) {
        const score = Number(results?.[level]);

        if (!Number.isNaN(score) && score >= MIN_SCORE_TO_PASS) {
          finalLevel = level;
          continue;
        }

        break;
      }

      return finalLevel;
    },
    [availableTestLevels]
  );

  const finishTest = useCallback(
    async (resultsToSave = levelResults) => {
      try {
        if (!auth.currentUser) {
          throw new Error("Authenticated user not found.");
        }

        const safeResults = resultsToSave || {};
        const calculatedFinalLevel = determineFinalLevel(safeResults);
        const timeSpent = TEST_DURATION_SECONDS - Math.max(timeLeft || 0, 0);

        const finalTestData = {
          userId: auth.currentUser.uid,
          placementLevel: calculatedFinalLevel,
          finalLevel: calculatedFinalLevel,
          levelResults: safeResults,
          skillResults: {},
          timeSpent,
          testDate: new Date().toISOString(),
          completed: true
        };

        await saveUserTestResult(auth.currentUser.uid, finalTestData);

        setFinalResults({
          placementLevel: calculatedFinalLevel,
          finalLevel: calculatedFinalLevel,
          overallScore:
            Object.values(safeResults).length > 0
              ? Math.round(
                  Object.values(safeResults).reduce(
                    (sum, score) => sum + Number(score || 0),
                    0
                  ) / Object.values(safeResults).length
                )
              : 0,
          levelResults: safeResults
        });

        setShowResults(true);
        setShowLevelResults(false);
        setTestStarted(false);
      } catch (error) {
        console.error("Error finishing test:", error);
        alert(
          "Nie udało się zapisać wyników testu. Spróbuj ponownie."
        );
      }
    },
    [determineFinalLevel, levelResults, timeLeft]
  );

  useEffect(() => {
    const loadTests = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const allTests = await getAllTests();

        const testsObject = allTests.reduce((acc, test) => {
          const normalizedTest = normalizeTest(test);

          if (CEFR_LEVELS.includes(normalizedTest.level)) {
            acc[normalizedTest.level] = normalizedTest;
          }

          return acc;
        }, {});

        setTests(testsObject);

        const firstAvailableLevel = CEFR_LEVELS.find(
          (level) => testsObject[level]
        );

        if (firstAvailableLevel) {
          setCurrentLevel(firstAvailableLevel);
        }
      } catch (error) {
        console.error("Error loading tests:", error);
        setLoadError(
          "Nie udało się załadować testów. Spróbuj ponownie później."
        );
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setIsLoading(true);

        if (!user) {
          navigate("/login");
          return;
        }

        const alreadyTested = await hasRecentTest(user.uid);

        if (alreadyTested) {
          alert(
            "Test został już wykonany niedawno. Możesz spróbować ponownie za 20 dni."
          );

          navigate("/home");
          return;
        }

        await loadTests();
      } catch (error) {
        console.error("Error preparing test:", error);
        setLoadError(
          "Nie udało się przygotować testu. Spróbuj ponownie później."
        );
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const getAvailableTestLevels = () => availableTestLevels;

  const startTest = () => {
    const levelToStart = availableTestLevels[0];

    if (!levelToStart || !tests[levelToStart]) {
      alert(
        "Brak dostępnych testów. Utwórz co najmniej jeden test A1, A2, B1, B2, C1 lub C2 w panelu administracyjnym."
      );

      return;
    }

    const initialSelectedQuestions = buildSelectedQuestionsForLevel(
      levelToStart,
      tests
    );

    const allSectionsAvailable = TEST_SECTIONS.every((section) =>
      hasSectionQuestions(initialSelectedQuestions, section)
    );

    if (!allSectionsAvailable) {
      alert(
        "Wybrany test nie ma kompletu sekcji. Sprawdź pytania w panelu administracyjnym."
      );

      return;
    }

    setCurrentLevel(levelToStart);
    setCurrentSection("multipleChoice");

    setSelectedQuestions({
      [levelToStart]: initialSelectedQuestions
    });

    setAnswers({});
    setLevelResults({});
    setFinalResults(null);
    setShowResults(false);
    setShowLevelResults(false);

    setTestStarted(true);
    setTimeLeft(TEST_DURATION_SECONDS);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentLevel]: {
        ...prev[currentLevel],
        [currentSection]: {
          ...prev[currentLevel]?.[currentSection],
          [questionId]: answer
        }
      }
    }));
  };

  const handleLevelCompletion = async () => {
    const allQuestionsAnswered = validateCurrentLevelAnswers();

    if (!allQuestionsAnswered) {
      alert(
        "Odpowiedz na wszystkie widoczne pytania przed przejściem dalej."
      );

      return;
    }

    const currentScore = await calculateLevelScore(currentLevel);
    const roundedScore = Math.round(currentScore);

    setLevelResults((prev) => ({
      ...prev,
      [currentLevel]: roundedScore
    }));

    setShowLevelResults(true);
  };

  const handleLevelContinue = async () => {
    setIsLoading(true);

    try {
      const currentScore = Math.round(
        await calculateLevelScore(currentLevel)
      );

      const updatedLevelResults = {
        ...levelResults,
        [currentLevel]: currentScore
      };

      setLevelResults(updatedLevelResults);

      const currentLevelIndex = availableTestLevels.indexOf(currentLevel);

      if (currentScore >= MIN_SCORE_TO_PASS) {
        const nextLevel = availableTestLevels[currentLevelIndex + 1];

        if (nextLevel) {
          const nextSelectedQuestions =
            selectedQuestions[nextLevel] ||
            buildSelectedQuestionsForLevel(nextLevel, tests);

          const allSectionsAvailable = TEST_SECTIONS.every((section) =>
            hasSectionQuestions(nextSelectedQuestions, section)
          );

          if (!allSectionsAvailable) {
            await finishTest(updatedLevelResults);
            return;
          }

          setCurrentLevel(nextLevel);
          setCurrentSection("multipleChoice");
          setShowLevelResults(false);

          setSelectedQuestions((prev) => ({
            ...prev,
            [nextLevel]: nextSelectedQuestions
          }));

          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      await finishTest(updatedLevelResults);
    } catch (error) {
      console.error("Error continuing level:", error);
      alert("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSection = () => {
    const currentIndex = TEST_SECTIONS.indexOf(currentSection);

    if (currentIndex === TEST_SECTIONS.length - 1) {
      handleLevelCompletion();
      return;
    }

    setCurrentSection(TEST_SECTIONS[currentIndex + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousSection = () => {
    const currentIndex = TEST_SECTIONS.indexOf(currentSection);

    if (currentIndex > 0) {
      setCurrentSection(TEST_SECTIONS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBlockedCopy = (event) => {
    if (shouldAllowBrowserAction(event)) return;
    event.preventDefault();
  };

  const handleBlockedKeyDown = (event) => {
    if (shouldAllowBrowserAction(event)) return;

    const key = event.key.toLowerCase();

    if (
      (event.ctrlKey || event.metaKey) &&
      ["a", "c", "x", "s", "p"].includes(key)
    ) {
      event.preventDefault();
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <TestResults results={finalResults} />

          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => navigate("/curso")}
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-4 px-8 rounded-2xl"
            >
              Rozpocznij kurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center max-w-md w-full">
          <FaSpinner className="animate-spin text-primary-600 text-4xl mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-gray-800">
            Ładowanie pytań testowych...
          </h2>

          <p className="text-gray-500 mt-2">
            Przygotowujemy test poziomujący.
          </p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <TestInstructions onStart={startTest} />

        {loadError && (
          <div className="container mx-auto px-4 max-w-3xl pb-5">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {loadError}
            </div>
          </div>
        )}

        {!testsLoaded && !isLoading && !loadError && (
          <div className="container mx-auto px-4 max-w-3xl pb-10">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
              Brak dostępnych testów. Utwórz co najmniej jeden test w panelu
              administracyjnym.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoading || !tests[currentLevel]) {
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
      onContextMenu={handleBlockedCopy}
      onKeyDown={handleBlockedKeyDown}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        {showLevelResults && (
          <TestLevelResultModal
            currentLevel={currentLevel}
            isLoading={isLoading}
            calculateSectionScore={calculateSectionScore}
            getAvailableTestLevels={getAvailableTestLevels}
            handleLevelContinue={handleLevelContinue}
          />
        )}

        <Timer
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onTimeUp={() => finishTest(levelResults)}
        />

        <div className="mb-5 md:mb-8">
          <TestProgress
            currentFilter={currentLevel}
            currentSection={currentSection}
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
              Odpowiedz na wszystkie pytania przed przejściem do kolejnej
              części.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            <TestSectionRenderer
              currentLevel={currentLevel}
              currentSection={currentSection}
              selectedQuestions={selectedQuestions}
              answers={answers}
              handleAnswerSelect={handleAnswerSelect}
            />
          </div>

          <TestNavigation
            currentSection={currentSection}
            handlePreviousSection={handlePreviousSection}
            handleNextSection={handleNextSection}
          />
        </main>
      </div>
    </div>
  );
};

export default Test;