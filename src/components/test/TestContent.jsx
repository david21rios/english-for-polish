// src/components/test/TestContent.jsx
import { useState } from 'react';
import MultipleChoiceSection from './MultipleChoiceSection';
import WritingSection from './WritingSection';
import ReadingSection from './ReadingSection';

const TestContent = ({ filter, answers, setAnswers, onNext, onPrevious }) => {
  const [section, setSection] = useState('multipleChoice');

  const handleNextSection = () => {
    if (section === 'multipleChoice') {
      setSection('writing');
    } else if (section === 'writing') {
      setSection('reading');
    } else {
      onNext();
    }
  };

  const handlePreviousSection = () => {
    if (section === 'reading') {
      setSection('writing');
    } else if (section === 'writing') {
      setSection('multipleChoice');
    } else {
      onPrevious();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {section === 'multipleChoice' ? 'Selección Múltiple' :
            section === 'writing' ? 'Escritura' : 'Comprensión Lectora'}
        </h2>
        <div className="flex space-x-2">
          <span className={`w-3 h-3 rounded-full ${section === 'multipleChoice' ? 'bg-primary-500' : 'bg-gray-300'
            }`} />
          <span className={`w-3 h-3 rounded-full ${section === 'writing' ? 'bg-primary-500' : 'bg-gray-300'
            }`} />
          <span className={`w-3 h-3 rounded-full ${section === 'reading' ? 'bg-primary-500' : 'bg-gray-300'
            }`} />
        </div>
      </div>

      {section === 'multipleChoice' && (
        <MultipleChoiceSection
          questions={filter.questions.multipleChoice}
          answers={answers}
          setAnswers={setAnswers}
        />
      )}
      {section === 'writing' && (
        <WritingSection
          questions={filter.questions.writing}
          answers={answers}
          setAnswers={setAnswers}
        />
      )}
      {section === 'reading' && (
        <ReadingSection
          questions={filter.questions.reading}
          answers={answers}
          setAnswers={setAnswers}
        />
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePreviousSection}
          disabled={section === 'multipleChoice'}
          className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={handleNextSection}
          className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
        >
          {section === 'reading' ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

export default TestContent;