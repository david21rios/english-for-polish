// src/components/forms/components/Contents/index.jsx
import React, { useState } from 'react';
import Vocabulary from './Vocabulary';
import Grammar from './Grammar';

const Contents = ({ formData, setFormData }) => {
  const [activeSection, setActiveSection] = useState('vocabulary');

  const contenidos = formData.contenidos || {};
  const vocabulario = contenidos.vocabulario || {};
  const gramatica = contenidos.gramatica || { temas: [] };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveSection('vocabulary')}
            className={`${
              activeSection === 'vocabulary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Vocabulario
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('grammar')}
            className={`${
              activeSection === 'grammar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gramática
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeSection === 'vocabulary' && (
          <Vocabulary
            vocabulario={vocabulario}
            setFormData={setFormData}
          />
        )}

        {activeSection === 'grammar' && (
          <Grammar
            gramatica={gramatica}
            setFormData={setFormData}
          />
        )}
      </div>
    </div>
  );
};

export default Contents;