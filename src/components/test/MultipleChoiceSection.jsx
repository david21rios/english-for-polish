// src/components/test/MultipleChoiceSection.jsx
const MultipleChoiceSection = ({ questions, answers, setAnswers }) => {
  const handleAnswer = (questionId, selectedAnswer) => {
    setAnswers(prev => ({
      ...prev,
      multipleChoice: {
        ...prev.multipleChoice,
        [questionId]: selectedAnswer
      }
    }));
  };

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={question.id} className="bg-white p-6 rounded-lg shadow">
          <p className="text-lg font-medium mb-4">
            {index + 1}. {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full text-left p-3 rounded transition-colors ${answers.multipleChoice?.[question.id] === option
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultipleChoiceSection;