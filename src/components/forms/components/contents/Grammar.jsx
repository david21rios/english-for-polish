// src/components/forms/components/Contents/Grammar.jsx

import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const Grammar = ({ gramatica = {}, setFormData }) => {
  const temas = Array.isArray(gramatica?.temas) ? gramatica.temas : [];
  const reglas = Array.isArray(gramatica?.reglas) ? gramatica.reglas : [];

  const updateGrammar = (updatedGrammar) => {
    setFormData((prev) => ({
      ...prev,
      contenidos: {
        ...(prev.contenidos || {}),
        vocabulario: prev.contenidos?.vocabulario || {},
        gramatica: {
          temas: updatedGrammar.temas || [],
          reglas: updatedGrammar.reglas || []
        }
      }
    }));
  };

  const handleAddTema = () => {
    updateGrammar({
      temas: [...temas, ""],
      reglas
    });
  };

  const handleChangeTema = (index, value) => {
    const newTemas = [...temas];
    newTemas[index] = value;

    updateGrammar({
      temas: newTemas,
      reglas
    });
  };

  const handleRemoveTema = (index) => {
    updateGrammar({
      temas: temas.filter((_, i) => i !== index),
      reglas
    });
  };

  const handleAddRegla = () => {
    updateGrammar({
      temas,
      reglas: [
        ...reglas,
        {
          titulo: "",
          explicacion: "",
          ejemplos: []
        }
      ]
    });
  };

  const handleChangeRegla = (index, field, value) => {
    const newReglas = [...reglas];

    newReglas[index] = {
      ...newReglas[index],
      [field]: value
    };

    updateGrammar({
      temas,
      reglas: newReglas
    });
  };

  const handleRemoveRegla = (index) => {
    updateGrammar({
      temas,
      reglas: reglas.filter((_, i) => i !== index)
    });
  };

  const handleAddEjemplo = (reglaIndex) => {
    const newReglas = [...reglas];

    newReglas[reglaIndex] = {
      ...newReglas[reglaIndex],
      ejemplos: [
        ...(newReglas[reglaIndex].ejemplos || []),
        {
          frase: "",
          traduccion: "",
          nota: ""
        }
      ]
    };

    updateGrammar({
      temas,
      reglas: newReglas
    });
  };

  const handleChangeEjemplo = (reglaIndex, ejemploIndex, field, value) => {
    const newReglas = [...reglas];
    const ejemplos = [...(newReglas[reglaIndex].ejemplos || [])];

    ejemplos[ejemploIndex] = {
      ...ejemplos[ejemploIndex],
      [field]: value
    };

    newReglas[reglaIndex] = {
      ...newReglas[reglaIndex],
      ejemplos
    };

    updateGrammar({
      temas,
      reglas: newReglas
    });
  };

  const handleRemoveEjemplo = (reglaIndex, ejemploIndex) => {
    const newReglas = [...reglas];

    newReglas[reglaIndex] = {
      ...newReglas[reglaIndex],
      ejemplos: (newReglas[reglaIndex].ejemplos || []).filter(
        (_, i) => i !== ejemploIndex
      )
    };

    updateGrammar({
      temas,
      reglas: newReglas
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Temas gramaticales
          </h3>

          <button
            type="button"
            onClick={handleAddTema}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Añadir tema
          </button>
        </div>

        {temas.length > 0 ? (
          <div className="space-y-2">
            {temas.map((tema, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={typeof tema === "string" ? tema : tema?.titulo || ""}
                  onChange={(e) => handleChangeTema(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300"
                  placeholder="Ej: Verb ser, subject pronouns..."
                />

                <button
                  type="button"
                  onClick={() => handleRemoveTema(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No hay temas gramaticales definidos.
          </p>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Reglas gramaticales
          </h3>

          <button
            type="button"
            onClick={handleAddRegla}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Añadir regla
          </button>
        </div>

        {reglas.length > 0 ? (
          <div className="space-y-6">
            {reglas.map((regla, reglaIndex) => (
              <div
                key={reglaIndex}
                className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={regla.titulo || ""}
                    onChange={(e) =>
                      handleChangeRegla(reglaIndex, "titulo", e.target.value)
                    }
                    className="flex-1 font-medium rounded-md border-gray-300"
                    placeholder="Título de la regla gramatical"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveRegla(reglaIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Explicación
                  </label>

                  <textarea
                    value={regla.explicacion || ""}
                    onChange={(e) =>
                      handleChangeRegla(
                        reglaIndex,
                        "explicacion",
                        e.target.value
                      )
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Explica la regla gramatical..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Ejemplos
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddEjemplo(reglaIndex)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <FaPlus className="inline mr-2" />
                      Añadir ejemplo
                    </button>
                  </div>

                  {(regla.ejemplos || []).map((ejemplo, ejemploIndex) => (
                    <div
                      key={ejemploIndex}
                      className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          Ejemplo {ejemploIndex + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveEjemplo(reglaIndex, ejemploIndex)
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={ejemplo.frase || ""}
                        onChange={(e) =>
                          handleChangeEjemplo(
                            reglaIndex,
                            ejemploIndex,
                            "frase",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300"
                        placeholder="Frase en español"
                      />

                      <input
                        type="text"
                        value={ejemplo.traduccion || ""}
                        onChange={(e) =>
                          handleChangeEjemplo(
                            reglaIndex,
                            ejemploIndex,
                            "traduccion",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300"
                        placeholder="Traducción"
                      />

                      <input
                        type="text"
                        value={ejemplo.nota || ""}
                        onChange={(e) =>
                          handleChangeEjemplo(
                            reglaIndex,
                            ejemploIndex,
                            "nota",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300"
                        placeholder="Nota pedagógica"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No hay reglas gramaticales definidas.
          </p>
        )}
      </section>
    </div>
  );
};

export default Grammar;