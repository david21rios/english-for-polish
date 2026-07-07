// src/components/forms/components/Contents/index.jsx

import { useState } from "react";
import PropTypes from "prop-types";

import Grammar from "./Grammar";
import Vocabulary from "./Vocabulary";

const Contents = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState("vocabulary");

  const contents = formData.contents || formData.contenidos || {};

  const vocabulary =
    contents.vocabulary || contents.vocabulario || {};

  const grammar =
    contents.grammar ||
    contents.gramatica || {
      topics: [],
      rules: []
    };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveSection("vocabulary")}
            className={`${
              activeSection === "vocabulary"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Słownictwo
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("grammar")}
            className={`${
              activeSection === "grammar"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gramatyka
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeSection === "vocabulary" && (
          <Vocabulary
            vocabulary={vocabulary}
            setFormData={setFormData}
          />
        )}

        {activeSection === "grammar" && (
          <Grammar
            grammar={grammar}
            setFormData={setFormData}
          />
        )}
      </div>
    </div>
  );
};

Contents.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Contents;