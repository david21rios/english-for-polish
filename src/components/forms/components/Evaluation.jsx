// src/components/forms/components/Evaluation.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeQuestion = (question = {}) => ({
  question: question.question || question.pregunta || "",
  options: Array.isArray(question.options)
    ? question.options
    : Array.isArray(question.opciones)
      ? question.opciones
      : [],
  correctAnswer:
    question.correctAnswer ||
    question.respuesta_correcta ||
    ""
});

const normalizeEvaluation = (evaluation = {}) => ({
  selfAssessment:
    evaluation.selfAssessment ||
    evaluation.autoevaluacion ||
    "",
  quiz: (
    Array.isArray(evaluation.quiz)
      ? evaluation.quiz
      : Array.isArray(evaluation.cuestionario)
        ? evaluation.cuestionario
        : []
  ).map(normalizeQuestion)
});

const buildLegacyEvaluation = (evaluation = {}) => ({
  autoevaluacion: evaluation.selfAssessment || "",
  cuestionario: (evaluation.quiz || []).map((question) => ({
    pregunta: question.question || "",
    opciones: question.options || [],
    respuesta_correcta: question.correctAnswer || ""
  }))
});

const Evaluation = ({ formData, setFormData }) => {
  const evaluation = normalizeEvaluation(
    formData.evaluation || formData.evaluacion || {}
  );

  const updateEvaluation = (updatedEvaluation) => {
    const normalizedEvaluation = normalizeEvaluation(updatedEvaluation);

    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      evaluation: normalizedEvaluation,

      // Legacy compatibility during migration.
      evaluacion: buildLegacyEvaluation(normalizedEvaluation)
    }));
  };

  const handleSelfAssessmentChange = (value) => {
    updateEvaluation({
      ...evaluation,
      selfAssessment: value
    });
  };

  const handleAddQuestion = () => {
    updateEvaluation({
      ...evaluation,
      quiz: [
        ...evaluation.quiz,
        {
          question: "",
          options: [],
          correctAnswer: ""
        }
      ]
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuiz = [...evaluation.quiz];

    newQuiz[index] = {
      ...newQuiz[index],
      [field]: value
    };

    updateEvaluation({
      ...evaluation,
      quiz: newQuiz
    });
  };

  const handleAddOption = (questionIndex) => {
    const newQuiz = [...evaluation.quiz];

    newQuiz[questionIndex] = {
      ...newQuiz[questionIndex],
      options: [
        ...(newQuiz[questionIndex].options || []),
        ""
      ]
    };

    updateEvaluation({
      ...evaluation,
      quiz: newQuiz
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuiz = [...evaluation.quiz];
    const options = [...(newQuiz[questionIndex].options || [])];
    const oldValue = options[optionIndex];

    options[optionIndex] = value;

    newQuiz[questionIndex] = {
      ...newQuiz[questionIndex],
      options
    };

    if (newQuiz[questionIndex].correctAnswer === oldValue) {
      newQuiz[questionIndex].correctAnswer = value;
    }

    updateEvaluation({
      ...evaluation,
      quiz: newQuiz
    });
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const newQuiz = [...evaluation.quiz];
    const options = [...(newQuiz[questionIndex].options || [])];
    const removedValue = options[optionIndex];

    newQuiz[questionIndex] = {
      ...newQuiz[questionIndex],
      options: options.filter((_, index) => index !== optionIndex)
    };

    if (newQuiz[questionIndex].correctAnswer === removedValue) {
      newQuiz[questionIndex].correctAnswer = "";
    }

    updateEvaluation({
      ...evaluation,
      quiz: newQuiz
    });
  };

  const handleRemoveQuestion = (index) => {
    updateEvaluation({
      ...evaluation,
      quiz: evaluation.quiz.filter(
        (_, questionIndex) => questionIndex !== index
      )
    });
  };

  const handleCorrectAnswerChange = (questionIndex, option) => {
    const newQuiz = [...evaluation.quiz];

    newQuiz[questionIndex] = {
      ...newQuiz[questionIndex],
      correctAnswer: option
    };

    updateEvaluation({
      ...evaluation,
      quiz: newQuiz
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Samoocena
        </label>

        <textarea
          value={evaluation.selfAssessment}
          onChange={(event) =>
            handleSelfAssessmentChange(event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Opisz kryteria samooceny..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-medium text-gray-900">
            Quiz
          </h3>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Dodaj pytanie
          </button>
        </div>

        {evaluation.quiz.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nie zdefiniowano jeszcze pytań ewaluacyjnych.
          </p>
        ) : (
          evaluation.quiz.map((question, index) => (
            <div
              key={index}
              className="border border-gray-200 p-4 rounded-lg space-y-4 bg-white"
            >
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={question.question}
                  onChange={(event) =>
                    handleQuestionChange(
                      index,
                      "question",
                      event.target.value
                    )
                  }
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Wpisz pytanie..."
                />

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń pytanie ${index + 1}`}
                  title="Usuń pytanie"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="space-y-2 pl-0 sm:pl-4">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`evaluation-correct-answer-${index}`}
                      checked={
                        question.correctAnswer === option &&
                        option !== ""
                      }
                      onChange={() =>
                        handleCorrectAnswerChange(index, option)
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      aria-label={`Oznacz opcję ${optionIndex + 1} jako poprawną`}
                    />

                    <input
                      type="text"
                      value={option}
                      onChange={(event) =>
                        handleOptionChange(
                          index,
                          optionIndex,
                          event.target.value
                        )
                      }
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder={`Opcja ${optionIndex + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveOption(index, optionIndex)
                      }
                      className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Usuń opcję ${optionIndex + 1}`}
                      title="Usuń opcję"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddOption(index)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <FaPlus className="inline mr-2" />
                  Dodaj opcję
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

Evaluation.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Evaluation;