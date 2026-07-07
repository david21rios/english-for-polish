// src/components/forms/components/Reading.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeQuestion = (question = {}) => ({
  question: question.question || question.pregunta || "",
  answer: question.answer || question.respuesta || "",
  options: Array.isArray(question.options)
    ? question.options
    : Array.isArray(question.opciones)
      ? question.opciones
      : [],
  correctAnswer:
    question.correctAnswer ||
    question.respuesta_correcta ||
    question.answer ||
    question.respuesta ||
    "",
  type: question.type || question.tipo || "comprehension"
});

const normalizeReading = (reading = {}) => ({
  title: reading.title || reading.titulo || "",
  author: reading.author || reading.autor || "AI Tutor",
  content: reading.content || reading.contenido || "",
  questions: (
    Array.isArray(reading.questions)
      ? reading.questions
      : Array.isArray(reading.preguntas)
        ? reading.preguntas
        : []
  ).map(normalizeQuestion)
});

const buildLegacyReading = (reading) => ({
  titulo: reading.title || "",
  autor: reading.author || "",
  contenido: reading.content || "",
  preguntas: reading.questions.map((question) => ({
    pregunta: question.question || "",
    respuesta: question.answer || "",
    opciones: question.options || [],
    respuesta_correcta: question.correctAnswer || "",
    tipo: question.type || "comprehension"
  }))
});

const Reading = ({
  formData,
  setFormData
}) => {
  const reading = normalizeReading(
    formData.reading || formData.lectura || {}
  );

  const updateReading = (updatedReading) => {
    const normalizedReading = normalizeReading(updatedReading);

    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      reading: normalizedReading,

      // Legacy compatibility during migration.
      lectura: buildLegacyReading(normalizedReading)
    }));
  };

  const handleChange = (field, value) => {
    updateReading({
      ...reading,
      [field]: value
    });
  };

  const handleAddQuestion = () => {
    updateReading({
      ...reading,
      questions: [
        ...reading.questions,
        {
          question: "",
          answer: "",
          options: [],
          correctAnswer: "",
          type: "comprehension"
        }
      ]
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...reading.questions];

    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };

    if (field === "answer") {
      newQuestions[index].correctAnswer = value;
    }

    updateReading({
      ...reading,
      questions: newQuestions
    });
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...reading.questions];

    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: [
        ...(newQuestions[questionIndex].options || []),
        ""
      ]
    };

    updateReading({
      ...reading,
      questions: newQuestions
    });
  };

  const handleOptionChange = (
    questionIndex,
    optionIndex,
    value
  ) => {
    const newQuestions = [...reading.questions];
    const options = [
      ...(newQuestions[questionIndex].options || [])
    ];

    const oldValue = options[optionIndex];

    options[optionIndex] = value;

    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options
    };

    if (
      newQuestions[questionIndex].correctAnswer === oldValue
    ) {
      newQuestions[questionIndex].correctAnswer = value;
      newQuestions[questionIndex].answer = value;
    }

    updateReading({
      ...reading,
      questions: newQuestions
    });
  };

  const handleRemoveOption = (
    questionIndex,
    optionIndex
  ) => {
    const newQuestions = [...reading.questions];
    const options = [
      ...(newQuestions[questionIndex].options || [])
    ];

    const removedValue = options[optionIndex];

    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: options.filter(
        (_, index) => index !== optionIndex
      )
    };

    if (
      newQuestions[questionIndex].correctAnswer ===
      removedValue
    ) {
      newQuestions[questionIndex].correctAnswer = "";
      newQuestions[questionIndex].answer = "";
    }

    updateReading({
      ...reading,
      questions: newQuestions
    });
  };

  const handleRemoveQuestion = (index) => {
    updateReading({
      ...reading,
      questions: reading.questions.filter(
        (_, questionIndex) => questionIndex !== index
      )
    });
  };

  const handleCorrectAnswerChange = (
    questionIndex,
    option
  ) => {
    const newQuestions = [...reading.questions];

    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      correctAnswer: option,
      answer: option
    };

    updateReading({
      ...reading,
      questions: newQuestions
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł tekstu
        </label>

        <input
          type="text"
          value={reading.title}
          onChange={(event) =>
            handleChange("title", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz tytuł tekstu..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Autor
        </label>

        <input
          type="text"
          value={reading.author}
          onChange={(event) =>
            handleChange("author", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz autora..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Treść
        </label>

        <textarea
          value={reading.content}
          onChange={(event) =>
            handleChange("content", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={8}
          placeholder="Wpisz tekst do czytania..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pytania sprawdzające zrozumienie tekstu
            </label>

            <p className="text-sm text-gray-500">
              Możesz dodać pytania otwarte lub pytania z opcjami odpowiedzi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center justify-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <FaPlus className="mr-2" />
            Dodaj pytanie
          </button>
        </div>

        {reading.questions.length > 0 ? (
          <div className="space-y-4">
            {reading.questions.map((question, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Pytanie {index + 1}
                    </label>

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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Wpisz pytanie..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveQuestion(index)
                    }
                    className="mt-7 p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Usuń pytanie ${index + 1}`}
                    title="Usuń pytanie"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Oczekiwana odpowiedź
                  </label>

                  <input
                    type="text"
                    value={question.answer}
                    onChange={(event) =>
                      handleQuestionChange(
                        index,
                        "answer",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Wpisz oczekiwaną odpowiedź..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Opcje odpowiedzi
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddOption(index)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <FaPlus className="inline mr-2" />
                      Dodaj opcję
                    </button>
                  </div>

                  {question.options.map(
                    (option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          name={`correct-answer-${index}`}
                          checked={
                            question.correctAnswer === option &&
                            option !== ""
                          }
                          onChange={() =>
                            handleCorrectAnswerChange(
                              index,
                              option
                            )
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
                            handleRemoveOption(
                              index,
                              optionIndex
                            )
                          }
                          className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Usuń opcję ${optionIndex + 1}`}
                          title="Usuń opcję"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )
                  )}

                  {question.options.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Brak opcji odpowiedzi. To pytanie będzie pytaniem otwartym.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Nie zdefiniowano jeszcze pytań do tekstu.
          </p>
        )}
      </div>
    </div>
  );
};

Reading.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Reading;