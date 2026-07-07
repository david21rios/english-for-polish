// src/components/forms/components/Contents/Vocabulary.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeVocabularyItem = (item = {}) => ({
  word: item.word || item.palabra || item.term || item.termino || "",
  term: item.term || item.termino || item.word || item.palabra || "",
  translation: item.translation || item.traduccion || "",
  definition: item.definition || item.definicion || "",
  example: item.example || item.ejemplo || "",
  audioSrc: item.audioSrc || ""
});

const normalizeVocabulary = (vocabulary = {}) => ({
  title: vocabulary.title || vocabulary.titulo || "Vocabulary",
  words: (
    Array.isArray(vocabulary.words)
      ? vocabulary.words
      : Array.isArray(vocabulary.palabras)
        ? vocabulary.palabras
        : Array.isArray(vocabulary.items)
          ? vocabulary.items
          : []
  ).map(normalizeVocabularyItem)
});

const buildLegacyVocabulary = (vocabulary = {}) => ({
  titulo: vocabulary.title || "",
  palabras: (vocabulary.words || []).map((item) => ({
    palabra: item.word || "",
    termino: item.term || "",
    traduccion: item.translation || "",
    definicion: item.definition || "",
    ejemplo: item.example || "",
    audioSrc: item.audioSrc || ""
  }))
});

const Vocabulary = ({ vocabulary = {}, setFormData }) => {
  const normalizedVocabulary = normalizeVocabulary(vocabulary);
  const words = normalizedVocabulary.words;

  const updateVocabulary = (updatedVocabulary) => {
    const canonicalVocabulary = normalizeVocabulary(updatedVocabulary);

    setFormData((prev) => {
      const currentContents = prev.contents || {};
      const legacyContents = prev.contenidos || {};

      return {
        ...prev,

        // Canonical model.
        contents: {
          ...currentContents,
          vocabulary: canonicalVocabulary
        },

        // Legacy compatibility during migration.
        contenidos: {
          ...legacyContents,
          vocabulario: buildLegacyVocabulary(canonicalVocabulary)
        }
      };
    });
  };

  const handleTitleChange = (value) => {
    updateVocabulary({
      ...normalizedVocabulary,
      title: value
    });
  };

  const handleAddWord = () => {
    updateVocabulary({
      ...normalizedVocabulary,
      words: [
        ...words,
        {
          word: "",
          term: "",
          translation: "",
          definition: "",
          example: "",
          audioSrc: ""
        }
      ]
    });
  };

  const handleWordChange = (index, field, value) => {
    const newWords = [...words];

    newWords[index] = {
      ...newWords[index],
      [field]: value
    };

    updateVocabulary({
      ...normalizedVocabulary,
      words: newWords
    });
  };

  const handleRemoveWord = (index) => {
    updateVocabulary({
      ...normalizedVocabulary,
      words: words.filter((_, wordIndex) => wordIndex !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Słownictwo
          </h3>

          <p className="text-sm text-gray-500">
            Edytuj słowa i zwroty przygotowane dla tej lekcji.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddWord}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FaPlus className="mr-2" />
          Dodaj słowo
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł sekcji
        </label>

        <input
          type="text"
          value={normalizedVocabulary.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Np. Key Vocabulary"
        />
      </div>

      {words.length > 0 ? (
        <div className="space-y-5">
          {words.map((wordItem, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-center gap-3">
                <h4 className="font-semibold text-gray-900">
                  Słowo {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveWord(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń słowo ${index + 1}`}
                  title="Usuń słowo"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Słowo w języku angielskim
                  </label>

                  <input
                    type="text"
                    value={wordItem.word}
                    onChange={(event) =>
                      handleWordChange(index, "word", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Np. Hello"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Termin / wariant
                  </label>

                  <input
                    type="text"
                    value={wordItem.term}
                    onChange={(event) =>
                      handleWordChange(index, "term", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Np. greeting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tłumaczenie na polski
                  </label>

                  <input
                    type="text"
                    value={wordItem.translation}
                    onChange={(event) =>
                      handleWordChange(index, "translation", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Np. Cześć"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Audio URL
                  </label>

                  <input
                    type="text"
                    value={wordItem.audioSrc}
                    onChange={(event) =>
                      handleWordChange(index, "audioSrc", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Opcjonalnie"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Definicja
                  </label>

                  <textarea
                    value={wordItem.definition}
                    onChange={(event) =>
                      handleWordChange(index, "definition", event.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Krótka definicja lub wyjaśnienie..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Przykład użycia
                  </label>

                  <textarea
                    value={wordItem.example}
                    onChange={(event) =>
                      handleWordChange(index, "example", event.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Przykład użycia w zdaniu..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Nie zdefiniowano jeszcze słownictwa. Dodaj pierwsze słowo, aby rozpocząć.
        </p>
      )}
    </div>
  );
};

Vocabulary.propTypes = {
  vocabulary: PropTypes.object,
  setFormData: PropTypes.func.isRequired
};

export default Vocabulary;