// src/components/test/TestInstructions.jsx

import {
  FaBookOpen,
  FaClock,
  FaEdit,
  FaGraduationCap,
  FaHeadphones,
  FaLock,
  FaPlay,
  FaRegCheckCircle,
  FaShieldAlt
} from "react-icons/fa";

const TestInstructions = ({ onStart }) => {
  const testAreas = [
    {
      icon: <FaRegCheckCircle />,
      title: "Multiple Choice",
      description: "Grammar, vocabulary and sentence structure."
    },
    {
      icon: <FaEdit />,
      title: "Writing",
      description: "Short written answers. AI evaluation will be connected later."
    },
    {
      icon: <FaBookOpen />,
      title: "Reading",
      description: "Reading texts with comprehension questions."
    },
    {
      icon: <FaHeadphones />,
      title: "Listening",
      description: "Coming soon. The test architecture is prepared for it.",
      disabled: true
    }
  ];

  const summaryCards = [
    {
      icon: <FaClock />,
      title: "2 hours",
      description: "You have a maximum of 2 hours to complete the test.",
      className: "bg-blue-50 border-blue-100 text-blue-700"
    },
    {
      icon: <FaShieldAlt />,
      title: "Secure mode",
      description: "Copy, cut, right click and text selection are restricted.",
      className: "bg-yellow-50 border-yellow-100 text-yellow-700"
    },
    {
      icon: <FaGraduationCap />,
      title: "CEFR result",
      description: "Your final result will be shown as A1, A2, B1, B2, C1 or C2.",
      className: "bg-green-50 border-green-100 text-green-700"
    }
  ];

  return (
    <section className="w-full bg-gradient-to-b from-primary-50 to-white py-5 md:py-10 px-3 sm:px-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 px-5 py-10 md:px-14 md:py-16 text-white text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-white/15 flex items-center justify-center text-3xl md:text-4xl mb-5 md:mb-6">
              <FaGraduationCap />
            </div>

            <p className="text-xs md:text-sm uppercase tracking-[0.25em] font-semibold text-white/80">
              Spanish placement test
            </p>

            <h1 className="text-3xl md:text-6xl font-bold mt-3 md:mt-4 leading-tight">
              Test Instructions
            </h1>

            <p className="mt-4 md:mt-5 text-base md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              This test estimates your Spanish level and recommends the best
              starting point for your learning path.
            </p>
          </div>

          <div className="p-4 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
              {summaryCards.map((card) => (
                <div
                  key={card.title}
                  className={`border rounded-2xl p-4 md:p-6 ${card.className}`}
                >
                  <div className="text-2xl md:text-3xl mb-3">
                    {card.icon}
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    {card.title}
                  </h3>

                  <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            <section className="mb-6 md:mb-8">
              <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  Skills assessed
                </p>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  What will be evaluated?
                </h2>

                <p className="text-sm md:text-base text-gray-600 mt-2">
                  Complete each section carefully. The exact CEFR level will be
                  revealed only at the end.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
                {testAreas.map((area) => (
                  <div
                    key={area.title}
                    className={`rounded-2xl border p-4 md:p-5 ${
                      area.disabled
                        ? "bg-gray-50 border-gray-100 opacity-75"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl mb-4 ${
                        area.disabled
                          ? "bg-gray-200 text-gray-500"
                          : "bg-primary-100 text-primary-600"
                      }`}
                    >
                      {area.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {area.title}
                      </h3>

                      {area.disabled && (
                        <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-[10px] font-semibold">
                          <FaLock />
                          Later
                        </span>
                      )}
                    </div>

                    <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                Important rules
              </h3>

              <ul className="grid md:grid-cols-2 gap-3 text-sm md:text-base text-gray-700">
                <li>• Answer all visible questions before continuing.</li>
                <li>• Read each instruction carefully.</li>
                <li>• Complete Multiple Choice, Writing and Reading.</li>
                <li>• Use the result as a learning guide, not certification.</li>
                <li>• The exact CEFR level is shown only after completion.</li>
                <li>• Copying, selecting text and right click are restricted.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onStart}
              className="w-full mt-6 md:mt-8 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl transition-colors font-bold text-base md:text-lg inline-flex items-center justify-center gap-3"
            >
              <FaPlay />
              Start test
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestInstructions;