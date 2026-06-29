// src/pages/Test.jsx

import { useEffect, useMemo, useState } from "react";
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
  return [...array].sort(() => Math.random() - 0.5);
};

const normalizeTest = (test = {}) => ({
  ...test,
  level: test.level || test.id,
  sections: {
    multipleChoice: test.sections?.multipleChoice || { questions: [] },
    writing: test.sections?.writing || { questions: [] },
    reading: test.sections?.reading || { texts: [] }
  }
});

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

  const availableTestLevels = useMemo(() => {
    return CEFR_LEVELS.filter((level) => tests[level]);
  }, [tests]);

  const testsLoaded = availableTestLevels.length > 0;

  useEffect(() => {
    const loadTests = async () => {
      try {
        setIsLoading(true);

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
        alert("Error al cargar los tests.");
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const alreadyTested = await hasRecentTest(user.uid);

      if (alreadyTested) {
        alert(
          "Ya has realizado un test recientemente. Puedes intentarlo nuevamente en 20 días."
        );
        navigate("/home");
        return;
      }

      await loadTests();
    });

    return () => unsubscribe();
  }, [navigate]);

  const getAvailableTestLevels = () => availableTestLevels;

  const getSelectedSectionQuestions = (level, section) => {
    return selectedQuestions[level]?.[section] || [];
  };

  const startTest = () => {
    const levelToStart = availableTestLevels[0];

    if (!levelToStart || !tests[levelToStart]) {
      alert(
        "No hay tests disponibles. Verifica que existan documentos A1, A2, B1, B2, C1 o C2 en el panel de administración."
      );
      return;
    }

    setCurrentLevel(levelToStart);
    setCurrentSection("multipleChoice");

    setSelectedQuestions({
      [levelToStart]: buildSelectedQuestionsForLevel(levelToStart, tests)
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

  const calculateSectionScore = async (section, level) => {
    try {
      const sectionAnswers = answers[level]?.[section] || {};
      const sectionQuestions = getSelectedSectionQuestions(level, section);

      if (!sectionQuestions.length) return 0;

      if (section === "multipleChoice") {
        const total = sectionQuestions.length;

        const correct = sectionQuestions.filter(
          (question) => sectionAnswers[question.id] === question.correctAnswer
        ).length;

        return total > 0 ? (correct / total) * 100 : 0;
      }

      if (section === "writing") {
        return await calculateWritingSectionScore(
          sectionAnswers,
          sectionQuestions
        );
      }

      if (section === "reading") {
        const total = sectionQuestions.reduce(
          (acc, text) => acc + (text.questions?.length || 0),
          0
        );

        const correct = sectionQuestions.reduce((acc, text) => {
          return (
            acc +
            (text.questions || []).filter(
              (question) =>
                sectionAnswers[question.id] === question.correctAnswer
            ).length
          );
        }, 0);

        return total > 0 ? (correct / total) * 100 : 0;
      }

      return 0;
    } catch (error) {
      console.error("Error calculating section score:", error);
      return 0;
    }
  };

  const calculateLevelScore = async (level) => {
    const scores = await Promise.all(
      TEST_SECTIONS.map((section) => calculateSectionScore(section, level))
    );

    return scores.reduce((acc, score) => acc + score, 0) / TEST_SECTIONS.length;
  };

  const getQuestionsForValidation = (level, section) => {
    const sectionQuestions = getSelectedSectionQuestions(level, section);

    if (section === "reading") {
      return sectionQuestions.flatMap((text) => text.questions || []);
    }

    return sectionQuestions;
  };

  const validateCurrentLevelAnswers = () => {
    return TEST_SECTIONS.every((section) => {
      const sectionQuestions = getQuestionsForValidation(currentLevel, section);
      const sectionAnswers = answers[currentLevel]?.[section] || {};

      if (!sectionQuestions.length) return false;

      return sectionQuestions.every((question) => {
        const answer = sectionAnswers[question.id];

        if (typeof answer === "string") {
          return answer.trim().length > 0;
        }

        return Boolean(answer);
      });
    });
  };

  const handleLevelCompletion = async () => {
    const allQuestionsAnswered = validateCurrentLevelAnswers();

    if (!allQuestionsAnswered) {
      alert("Por favor, responde todas las preguntas visibles antes de continuar.");
      return;
    }

    const currentScore = await calculateLevelScore(currentLevel);

    setLevelResults((prev) => ({
      ...prev,
      [currentLevel]: currentScore
    }));

    setShowLevelResults(true);
  };

  const determineFinalLevel = (results) => {
    if (availableTestLevels.length === 0) {
      return "A1";
    }

    let finalLevel = availableTestLevels[0];

    for (const level of availableTestLevels) {
      if (results[level] && results[level] >= MIN_SCORE_TO_PASS) {
        finalLevel = level;
      } else {
        break;
      }
    }

    return finalLevel;
  };

  const finishTest = async (resultsToSave = levelResults) => {
    try {
      if (!auth.currentUser) {
        throw new Error("Usuario no autenticado");
      }

      const calculatedFinalLevel = determineFinalLevel(resultsToSave);

      const finalTestData = {
        userId: auth.currentUser.uid,
        levelResults: resultsToSave,
        finalLevel: calculatedFinalLevel,
        timeSpent: TEST_DURATION_SECONDS - (timeLeft || 0),
        testDate: new Date().toISOString(),
        completed: true
      };

      await saveUserTestResult(auth.currentUser.uid, finalTestData);

      setFinalResults({
        finalLevel: calculatedFinalLevel,
        filterResults: resultsToSave,
        levelResults: resultsToSave
      });

      setShowResults(true);
      setShowLevelResults(false);
      setTestStarted(false);
    } catch (error) {
      console.error("Error finishing test:", error);
      alert(
        "Hubo un error al guardar los resultados. Por favor, inténtalo de nuevo."
      );
    }
  };

  const handleLevelContinue = async () => {
    setIsLoading(true);

    try {
      const currentScore = levelResults[currentLevel] || 0;
      const currentLevelIndex = availableTestLevels.indexOf(currentLevel);

      if (currentScore >= MIN_SCORE_TO_PASS) {
        const nextLevel = availableTestLevels[currentLevelIndex + 1];

        if (nextLevel) {
          setCurrentLevel(nextLevel);
          setCurrentSection("multipleChoice");
          setShowLevelResults(false);

          setSelectedQuestions((prev) => ({
            ...prev,
            [nextLevel]:
              prev[nextLevel] || buildSelectedQuestionsForLevel(nextLevel, tests)
          }));

          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      await finishTest(levelResults);
    } catch (error) {
      console.error("Error continuing level:", error);
      alert("Ocurrió un error. Por favor, inténtalo de nuevo.");
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
              Comenzar curso
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
            Cargando preguntas del test...
          </h2>

          <p className="text-gray-500 mt-2">
            Estamos preparando la evaluación.
          </p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <TestInstructions onStart={startTest} />

        {!testsLoaded && !isLoading && (
          <div className="container mx-auto px-4 max-w-3xl pb-10">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
              No hay tests disponibles todavía. Crea al menos un test desde el
              panel de administración.
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
          <p className="text-gray-600">Cargando preguntas...</p>
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
              Spanish placement test
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Assessment section
            </h1>

            <p className="text-sm md:text-base text-gray-600 mt-2">
              Complete every question before moving to the next stage.
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