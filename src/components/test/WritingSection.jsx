import { useState } from 'react';
import { analyzeText } from "../../services/languageToolService";

const WritingSection = ({ questions, answers, setAnswers }) => {
  const [validations, setValidations] = useState({});
  const [invalidTexts, setInvalidTexts] = useState({});
  const [errors, setErrors] = useState({});

  // Función mejorada para verificar si una palabra es válida
  const isValidWord = (word) => {
    // Eliminar espacios en blanco y caracteres especiales
    word = word.trim().toLowerCase();

    // Ignorar palabras vacías
    if (!word) return true;

    // Verificar si la palabra contiene caracteres no permitidos
    if (!/^[a-záéíóúüñ]+$/i.test(word)) {
      return false;
    }

    // Debe tener al menos una vocal
    const hasVowel = /[aeiouáéíóúü]/i.test(word);
    if (!hasVowel) {
      return false;
    }

    // Verificar longitud mínima
    if (word.length < 2) {
      return false;
    }

    return true;
  };

  // Función mejorada para verificar la validez del texto
  const checkTextValidity = (text) => {
    if (!text || text.trim().length === 0) return { isValid: true, error: null };

    const words = text.trim().split(/\s+/);
    const invalidWords = words.filter(word => !isValidWord(word));

    if (invalidWords.length > 0) {
      return {
        isValid: false,
        error: `Palabras inválidas detectadas: ${invalidWords.join(', ')}`
      };
    }

    // Verificar si hay demasiados espacios consecutivos
    if (/\s{3,}/.test(text)) {
      return {
        isValid: false,
        error: 'Demasiados espacios consecutivos'
      };
    }

    return { isValid: true, error: null };
  };

  const handleAnswer = async (questionId, text) => {
    try {
      // Actualizar respuesta
      setAnswers(prev => ({
        ...prev,
        writing: {
          ...prev.writing,
          [questionId]: text
        }
      }));

      // Verificar el texto mientras se escribe
      const { isValid, error } = checkTextValidity(text);

      setInvalidTexts(prev => ({
        ...prev,
        [questionId]: !isValid
      }));

      setErrors(prev => ({
        ...prev,
        [questionId]: error
      }));

      // Solo analizar con LanguageTool si el texto es válido y tiene contenido
      if (isValid && text.trim()) {
        const validation = await analyzeText(text);
        setValidations(prev => ({
          ...prev,
          [questionId]: validation
        }));
      } else {
        setValidations(prev => ({
          ...prev,
          [questionId]: null
        }));
      }
    } catch (error) {
      console.error('Error al validar texto:', error);
      setErrors(prev => ({
        ...prev,
        [questionId]: 'Error al validar el texto'
      }));
    }
  };

  return (
    <div className="space-y-8">
      {questions.map((question, index) => {
        const currentText = answers.writing?.[question.id] || "";
        const validation = validations[question.id];
        const isInvalidText = invalidTexts[question.id];
        const error = errors[question.id];
        const wordCount = currentText.split(/\s+/).filter(word => word.trim()).length;

        return (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow">
            <p className="text-lg font-medium mb-2">
              {index + 1}. {question.question}
            </p>
            {question.example && (
              <p className="text-sm text-gray-600 mb-4">
                <strong>Ejemplo:</strong> {question.example}
              </p>
            )}
            <textarea
              className={`w-full p-3 border rounded-lg min-h-[120px] ${isInvalidText
                  ? 'border-red-500 bg-red-50'
                  : validation?.isValid
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              value={currentText}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
            />
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className={`${wordCount < (question.minWords || 0) ? 'text-red-500' : 'text-gray-500'
                  }`}>
                  Palabras totales: {wordCount}
                  {question.minWords && ` (mínimo: ${question.minWords})`}
                </span>
                {validation && (
                  <span className="text-gray-500">
                    Puntuación: {validation.score}%
                  </span>
                )}
              </div>

              {/* Mensajes de error mejorados */}
              {isInvalidText && currentText.trim() && (
                <div className="text-red-500 text-sm font-medium mt-2">
                  {error || 'El texto contiene caracteres o palabras inválidas. Por favor, escribe palabras reales usando solo letras.'}
                </div>
              )}

              {/* Mensaje de longitud mínima */}
              {currentText.trim() && wordCount < (question.minWords || 0) && (
                <div className="text-red-500 text-sm font-medium">
                  Se requieren al menos {question.minWords} palabras.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WritingSection;