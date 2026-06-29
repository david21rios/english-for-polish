// src/components/forms/components/Contents/Vocabulary.jsx

import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const normalizeVocabulary = (vocabulario = {}) => {
  const titulo = vocabulario.titulo || vocabulario.title || "Vocabulario";

  const palabras =
    Array.isArray(vocabulario.palabras)
      ? vocabulario.palabras
      : Array.isArray(vocabulario.items)
      ? vocabulario.items
      : [];

  return {
    titulo,
    palabras: palabras.map((item) => ({
      palabra: item.palabra || item.term || item.termino || "",
      termino: item.termino || item.term || item.palabra || "",
      traduccion: item.traduccion || item.translation || "",
      definicion: item.definicion || item.definition || "",
      ejemplo: item.ejemplo || item.example || "",
      audioSrc: item.audioSrc || ""
    }))
  };
};

const Vocabulary = ({ vocabulario = {}, setFormData }) => {
  const normalizedVocabulary = normalizeVocabulary(vocabulario);
  const palabras = normalizedVocabulary.palabras;

  const updateVocabulary = (updatedVocabulary) => {
    setFormData((prev) => ({
      ...prev,
      contenidos: {
        ...(prev.contenidos || {}),
        gramatica: prev.contenidos?.gramatica || {
          temas: [],
          reglas: []
        },
        vocabulario: {
          titulo: updatedVocabulary.titulo || "",
          palabras: updatedVocabulary.palabras || []
        }
      }
    }));
  };

  const handleChangeTitulo = (value) => {
    updateVocabulary({
      ...normalizedVocabulary,
      titulo: value
    });
  };

  const handleAddPalabra = () => {
    updateVocabulary({
      ...normalizedVocabulary,
      palabras: [
        ...palabras,
        {
          palabra: "",
          termino: "",
          traduccion: "",
          definicion: "",
          ejemplo: "",
          audioSrc: ""
        }
      ]
    });
  };

  const handleChangePalabra = (index, field, value) => {
    const newPalabras = [...palabras];

    newPalabras[index] = {
      ...newPalabras[index],
      [field]: value
    };

    updateVocabulary({
      ...normalizedVocabulary,
      palabras: newPalabras
    });
  };

  const handleRemovePalabra = (index) => {
    updateVocabulary({
      ...normalizedVocabulary,
      palabras: palabras.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Vocabulario</h3>
          <p className="text-sm text-gray-500">
            Edita las palabras generadas para esta lección.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPalabra}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FaPlus className="mr-2" />
          Añadir palabra
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de la sección
        </label>

        <input
          type="text"
          value={normalizedVocabulary.titulo}
          onChange={(e) => handleChangeTitulo(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Ej: Key Vocabulary"
        />
      </div>

      {palabras.length > 0 ? (
        <div className="space-y-5">
          {palabras.map((palabra, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">
                  Palabra {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemovePalabra(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Palabra en idioma objetivo
                  </label>

                  <input
                    type="text"
                    value={palabra.palabra || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "palabra", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Ej: Hola"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Término / equivalente
                  </label>

                  <input
                    type="text"
                    value={palabra.termino || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "termino", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Ej: Hello"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Traducción
                  </label>

                  <input
                    type="text"
                    value={palabra.traduccion || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "traduccion", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Ej: Hello"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Audio URL
                  </label>

                  <input
                    type="text"
                    value={palabra.audioSrc || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "audioSrc", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Definición
                  </label>

                  <textarea
                    value={palabra.definicion || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "definicion", e.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Definición o explicación de la palabra"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ejemplo
                  </label>

                  <textarea
                    value={palabra.ejemplo || ""}
                    onChange={(e) =>
                      handleChangePalabra(index, "ejemplo", e.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Ejemplo de uso"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          No hay palabras de vocabulario definidas. Añade una palabra para comenzar.
        </p>
      )}
    </div>
  );
};

export default Vocabulary;