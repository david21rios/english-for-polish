// src/components/TestsSection.jsx

import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaEdit,
  FaFileAlt,
  FaPenNib,
  FaPlus,
  FaSpinner,
  FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
  getAllTests,
  deleteTest,
  createTest,
  updateTest
} from "../services/auth/firestoreService";

import TestForm from "./testForms/TestForm";

const CEFR_LEVEL_ORDER = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6
};

const getSectionCounts = (test) => {
  return {
    multipleChoice: test.sections?.multipleChoice?.questions?.length || 0,
    writing: test.sections?.writing?.questions?.length || 0,
    reading: test.sections?.reading?.texts?.length || 0
  };
};

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Brak danych";

  return timestamp.toDate().toLocaleString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const sortTestsByLevel = (tests = []) => {
  return [...tests].sort((a, b) => {
    const levelA = CEFR_LEVEL_ORDER[a.level] || 99;
    const levelB = CEFR_LEVEL_ORDER[b.level] || 99;

    return levelA - levelB;
  });
};

const TestsSection = () => {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const sortedTests = useMemo(() => sortTestsByLevel(tests), [tests]);

  const totalQuestions = useMemo(() => {
    return tests.reduce((total, test) => {
      const counts = getSectionCounts(test);

      return (
        total +
        counts.multipleChoice +
        counts.writing +
        counts.reading
      );
    }, 0);
  }, [tests]);

  const closeForm = () => {
    setIsCreating(false);
    setEditingTest(null);
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError("");

      const fetchedTests = await getAllTests();

      setTests(fetchedTests || []);
    } catch (error) {
      console.error("Error loading tests:", error);
      setError("Nie udało się załadować testów.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");

      if (editingTest) {
        await updateTest(editingTest.id, data);
      } else {
        await createTest(data);
      }

      await fetchTests();
      closeForm();
    } catch (error) {
      console.error("Error saving test:", error);
      setError(error.message || "Nie udało się zapisać testu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (testId) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć ten test?"
    );

    if (!confirmDelete) return;

    try {
      setError("");

      await deleteTest(testId);

      setTests((prevTests) =>
        prevTests.filter((test) => test.id !== testId)
      );
    } catch (error) {
      console.error("Error deleting test:", error);
      setError(`Nie udało się usunąć testu: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mb-4" />

          <p className="text-gray-600">
            Ładowanie testów...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-8 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-4 md:mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
        >
          <FaArrowLeft />
          Wróć do panelu administratora
        </button>

        <header className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-5 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Testy administratora
              </p>

              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1 md:mt-2">
                Zarządzanie testami CEFR
              </h1>

              <p className="text-sm md:text-base text-gray-600 mt-2 max-w-2xl leading-relaxed">
                Twórz i zarządzaj testami poziomującymi dla dokładnych
                poziomów CEFR: A1, A2, B1, B2, C1 i C2.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700 shadow-md"
            >
              <FaPlus />
              Nowy test
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <p className="text-xs text-primary-700 font-semibold uppercase">
                Testy
              </p>

              <p className="text-2xl md:text-3xl font-bold text-primary-700 mt-1">
                {tests.length}
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs text-green-700 font-semibold uppercase">
                Elementy
              </p>

              <p className="text-2xl md:text-3xl font-bold text-green-700 mt-1">
                {totalQuestions}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-yellow-700 font-semibold uppercase">
                Poziomy CEFR
              </p>

              <p className="text-xl md:text-2xl font-bold text-yellow-700 mt-1">
                A1 · A2 · B1 · B2 · C1 · C2
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm md:text-base">
            {error}
          </div>
        )}

        {(isCreating || editingTest) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3 sm:px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                    {editingTest ? "Edycja testu" : "Nowy test"}
                  </p>

                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {editingTest
                      ? `Test ${editingTest.level}`
                      : "Utwórz test CEFR"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center shrink-0"
                  aria-label="Zamknij formularz"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto p-4 md:p-6">
                <TestForm
                  initialData={editingTest}
                  onSubmit={handleSubmit}
                  onCancel={closeForm}
                  isSaving={saving}
                />
              </div>
            </div>
          </div>
        )}

        {sortedTests.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto text-3xl mb-4">
              <FaFileAlt />
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Brak dostępnych testów
            </h2>

            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Utwórz pierwszy test, aby rozpocząć ocenę umiejętności
              według poziomów CEFR.
            </p>

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700"
            >
              <FaPlus />
              Utwórz pierwszy test
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {sortedTests.map((test) => {
              const counts = getSectionCounts(test);

              return (
                <article
                  key={test.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                          Test CEFR
                        </p>

                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
                          {test.level || "Brak danych"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Ostatnia aktualizacja:{" "}
                          {formatDate(test.updatedAt)}
                        </p>
                      </div>

                      <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Poziom {test.level || "Brak danych"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 text-center">
                        <FaBookOpen className="mx-auto text-primary-600 mb-2" />
                        <p className="text-xs text-gray-500">
                          Wybór
                        </p>
                        <p className="font-bold text-gray-900">
                          {counts.multipleChoice}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 text-center">
                        <FaPenNib className="mx-auto text-green-600 mb-2" />
                        <p className="text-xs text-gray-500">
                          Pisanie
                        </p>
                        <p className="font-bold text-gray-900">
                          {counts.writing}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 text-center">
                        <FaFileAlt className="mx-auto text-yellow-600 mb-2" />
                        <p className="text-xs text-gray-500">
                          Czytanie
                        </p>
                        <p className="font-bold text-gray-900">
                          {counts.reading}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 px-5 md:px-6 py-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingTest(test)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-blue-600 font-semibold hover:bg-blue-50"
                    >
                      <FaEdit />
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(test.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-red-600 font-semibold hover:bg-red-50"
                    >
                      <FaTrash />
                      Usuń
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

export default TestsSection;