// src/components/forms/components/Contents/Grammar.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExample = (example = {}) => ({
  sentence: example.sentence || example.frase || "",
  translation: example.translation || example.traduccion || "",
  note: example.note || example.nota || ""
});

const normalizeRule = (rule = {}) => ({
  title: rule.title || rule.titulo || "",
  explanation: rule.explanation || rule.explicacion || "",
  examples: (
    Array.isArray(rule.examples)
      ? rule.examples
      : Array.isArray(rule.ejemplos)
        ? rule.ejemplos
        : []
  ).map(normalizeExample)
});

const normalizeGrammar = (grammar = {}) => ({
  topics: (
    Array.isArray(grammar.topics)
      ? grammar.topics
      : Array.isArray(grammar.temas)
        ? grammar.temas
        : []
  ).map((topic) =>
    typeof topic === "string"
      ? topic
      : topic?.title || topic?.titulo || ""
  ),

  rules: (
    Array.isArray(grammar.rules)
      ? grammar.rules
      : Array.isArray(grammar.reglas)
        ? grammar.reglas
        : []
  ).map(normalizeRule)
});

const buildLegacyGrammar = (grammar = {}) => ({
  temas: grammar.topics || [],

  reglas: (grammar.rules || []).map((rule) => ({
    titulo: rule.title || "",
    explicacion: rule.explanation || "",

    ejemplos: (rule.examples || []).map((example) => ({
      frase: example.sentence || "",
      traduccion: example.translation || "",
      nota: example.note || ""
    }))
  }))
});

const Grammar = ({ grammar = {}, setFormData }) => {
  const normalizedGrammar = normalizeGrammar(grammar);

  const topics = normalizedGrammar.topics;
  const rules = normalizedGrammar.rules;

  const updateGrammar = (updatedGrammar) => {
    const canonicalGrammar = normalizeGrammar(updatedGrammar);

    setFormData((prev) => {
      const currentContents = prev.contents || {};
      const legacyContents = prev.contenidos || {};

      return {
        ...prev,

        // Canonical model.
        contents: {
          ...currentContents,
          grammar: canonicalGrammar
        },

        // Legacy compatibility during migration.
        contenidos: {
          ...legacyContents,
          gramatica: buildLegacyGrammar(canonicalGrammar)
        }
      };
    });
  };

  const handleAddTopic = () => {
    updateGrammar({
      topics: [...topics, ""],
      rules
    });
  };

  const handleTopicChange = (index, value) => {
    const newTopics = [...topics];

    newTopics[index] = value;

    updateGrammar({
      topics: newTopics,
      rules
    });
  };

  const handleRemoveTopic = (index) => {
    updateGrammar({
      topics: topics.filter(
        (_, topicIndex) => topicIndex !== index
      ),
      rules
    });
  };

  const handleAddRule = () => {
    updateGrammar({
      topics,
      rules: [
        ...rules,
        {
          title: "",
          explanation: "",
          examples: []
        }
      ]
    });
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];

    newRules[index] = {
      ...newRules[index],
      [field]: value
    };

    updateGrammar({
      topics,
      rules: newRules
    });
  };

  const handleRemoveRule = (index) => {
    updateGrammar({
      topics,
      rules: rules.filter(
        (_, ruleIndex) => ruleIndex !== index
      )
    });
  };

  const handleAddExample = (ruleIndex) => {
    const newRules = [...rules];

    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      examples: [
        ...(newRules[ruleIndex].examples || []),
        {
          sentence: "",
          translation: "",
          note: ""
        }
      ]
    };

    updateGrammar({
      topics,
      rules: newRules
    });
  };

  const handleExampleChange = (
    ruleIndex,
    exampleIndex,
    field,
    value
  ) => {
    const newRules = [...rules];
    const examples = [
      ...(newRules[ruleIndex].examples || [])
    ];

    examples[exampleIndex] = {
      ...examples[exampleIndex],
      [field]: value
    };

    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      examples
    };

    updateGrammar({
      topics,
      rules: newRules
    });
  };

  const handleRemoveExample = (
    ruleIndex,
    exampleIndex
  ) => {
    const newRules = [...rules];

    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      examples: (
        newRules[ruleIndex].examples || []
      ).filter(
        (_, index) => index !== exampleIndex
      )
    };

    updateGrammar({
      topics,
      rules: newRules
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Tematy gramatyczne
            </h3>

            <p className="text-sm text-gray-500">
              Określ główne zagadnienia gramatyczne omawiane w lekcji.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTopic}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Dodaj temat
          </button>
        </div>

        {topics.length > 0 ? (
          <div className="space-y-2">
            {topics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-500 min-w-6">
                  {index + 1}.
                </span>

                <input
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    handleTopicChange(
                      index,
                      event.target.value
                    )
                  }
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Np. czasownik to be, zaimki osobowe..."
                />

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveTopic(index)
                  }
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń temat ${index + 1}`}
                  title="Usuń temat"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Nie zdefiniowano jeszcze tematów gramatycznych.
          </p>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Reguły gramatyczne
            </h3>

            <p className="text-sm text-gray-500">
              Dodaj wyjaśnienia i przykłady dla każdej reguły.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRule}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Dodaj regułę
          </button>
        </div>

        {rules.length > 0 ? (
          <div className="space-y-6">
            {rules.map((rule, ruleIndex) => (
              <div
                key={ruleIndex}
                className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule.title}
                    onChange={(event) =>
                      handleRuleChange(
                        ruleIndex,
                        "title",
                        event.target.value
                      )
                    }
                    className="flex-1 font-medium rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Tytuł reguły gramatycznej..."
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveRule(ruleIndex)
                    }
                    className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Usuń regułę ${ruleIndex + 1}`}
                    title="Usuń regułę"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Wyjaśnienie
                  </label>

                  <textarea
                    value={rule.explanation}
                    onChange={(event) =>
                      handleRuleChange(
                        ruleIndex,
                        "explanation",
                        event.target.value
                      )
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Wyjaśnij regułę gramatyczną..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Przykłady
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        handleAddExample(ruleIndex)
                      }
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <FaPlus className="inline mr-2" />
                      Dodaj przykład
                    </button>
                  </div>

                  {rule.examples.length > 0 ? (
                    rule.examples.map(
                      (example, exampleIndex) => (
                        <div
                          key={exampleIndex}
                          className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">
                              Przykład {exampleIndex + 1}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveExample(
                                  ruleIndex,
                                  exampleIndex
                                )
                              }
                              className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label={`Usuń przykład ${exampleIndex + 1}`}
                              title="Usuń przykład"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Zdanie w języku angielskim
                            </label>

                            <input
                              type="text"
                              value={example.sentence}
                              onChange={(event) =>
                                handleExampleChange(
                                  ruleIndex,
                                  exampleIndex,
                                  "sentence",
                                  event.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              placeholder="Np. I am a student."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Tłumaczenie na język polski
                            </label>

                            <input
                              type="text"
                              value={example.translation}
                              onChange={(event) =>
                                handleExampleChange(
                                  ruleIndex,
                                  exampleIndex,
                                  "translation",
                                  event.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              placeholder="Np. Jestem uczniem."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Notatka dydaktyczna
                            </label>

                            <input
                              type="text"
                              value={example.note}
                              onChange={(event) =>
                                handleExampleChange(
                                  ruleIndex,
                                  exampleIndex,
                                  "note",
                                  event.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              placeholder="Opcjonalna wskazówka lub uwaga..."
                            />
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Nie dodano jeszcze przykładów.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Nie zdefiniowano jeszcze reguł gramatycznych.
          </p>
        )}
      </section>
    </div>
  );
};

Grammar.propTypes = {
  grammar: PropTypes.object,
  setFormData: PropTypes.func.isRequired
};

export default Grammar;