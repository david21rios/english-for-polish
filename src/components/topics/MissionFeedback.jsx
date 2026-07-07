// src/components/topics/MissionFeedback.jsx

import React from "react";
import {
  FaArrowLeft,
  FaBrain,
  FaChartLine,
  FaCheckCircle,
  FaComments,
  FaLightbulb,
  FaRedo,
  FaRocket,
  FaStar,
  FaTrophy
} from "react-icons/fa";

const renderStars = (stars = 1) => {
  const safeStars = Math.max(1, Math.min(5, Number(stars) || 1));

  return Array.from({ length: 5 }).map((_, index) => (
    <FaStar
      key={index}
      className={index < safeStars ? "text-yellow-300" : "text-white/30"}
    />
  ));
};

const MissionFeedback = ({ result, onRetry, onBackToMissions }) => {
  if (!result) return null;

  const feedback = result.feedback || {};
  const alreadyCompleted = result.alreadyCompleted === true;
  const xpEarned = result.xpEarned || 0;
  const totalXp = result.totalXp || 0;

  const score = Number(feedback.score || feedback.qualityScore || 0);
  const stars = Number(feedback.stars || 1);

  const strengths =
    feedback.strengths?.length > 0
      ? feedback.strengths
      : ["Ukończyłeś misję i aktywnie uczestniczyłeś w rozmowie."];

  const improvements =
    feedback.improvements?.length > 0
      ? feedback.improvements
      : ["Następnym razem spróbuj pisać dłuższe i jaśniejsze odpowiedzi."];

  const objectivesCompleted = Array.isArray(feedback.objectivesCompleted)
    ? feedback.objectivesCompleted
    : [];

  const corrections = Array.isArray(feedback.corrections)
    ? feedback.corrections
    : [];

  const vocabulary = Array.isArray(feedback.vocabulary)
    ? feedback.vocabulary
    : [];

  const grammarTips = Array.isArray(feedback.grammarTips)
    ? feedback.grammarTips
    : [];

  const nextSteps = Array.isArray(feedback.nextSteps)
    ? feedback.nextSteps
    : [];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-green-600 to-primary-600 text-white p-5 md:p-8 text-center">
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-3xl md:text-5xl mb-4 md:mb-6">
          <FaTrophy />
        </div>

        <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-green-100">
          Misja ukończona
        </p>

        <h2 className="text-2xl md:text-4xl font-bold mt-2">
          Świetna robota!
        </h2>

        <div className="mt-4 flex justify-center gap-1 text-2xl">
          {renderStars(stars)}
        </div>

        <p className="text-sm md:text-base text-green-50 mt-3 max-w-2xl mx-auto leading-relaxed">
          Ukończyłeś praktyczną misję opartą na sytuacji z życia codziennego.
          Poprawki są wyświetlane dopiero teraz, po zakończeniu rozmowy, aby
          zachować jej naturalny przebieg.
        </p>

        <div className="mt-5 md:mt-8 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          <div className="bg-white/15 border border-white/10 rounded-2xl px-3 md:px-6 py-3 md:py-4">
            <div className="text-xl md:text-2xl font-bold">
              {score}%
            </div>

            <p className="text-xs md:text-sm text-green-100 mt-1">
              Wynik
            </p>
          </div>

          <div className="bg-white/15 border border-white/10 rounded-2xl px-3 md:px-6 py-3 md:py-4">
            <div className="inline-flex items-center justify-center gap-2 text-xl md:text-2xl font-bold">
              <FaStar />
              +{xpEarned}
            </div>

            <p className="text-xs md:text-sm text-green-100 mt-1">
              {alreadyCompleted ? "Już ukończona" : "Zdobyte XP"}
            </p>
          </div>

          <div className="bg-white/15 border border-white/10 rounded-2xl px-3 md:px-6 py-3 md:py-4">
            <div className="text-xl md:text-2xl font-bold">
              {totalXp}
            </div>

            <p className="text-xs md:text-sm text-green-100 mt-1">
              XP tematu
            </p>
          </div>
        </div>
      </div>

      {alreadyCompleted && (
        <div className="mx-4 md:mx-8 mt-5 md:mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-3 md:p-4 text-xs md:text-sm">
          Ta misja została już wcześniej ukończona. Ponowne ćwiczenie jest
          przydatne, ale nie przyznaje dodatkowych punktów XP.
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-primary-50 rounded-2xl p-3 md:p-5 border border-primary-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <FaComments className="text-primary-600 shrink-0" />

              <h3 className="font-semibold text-gray-900 text-xs md:text-base">
                Odpowiedzi
              </h3>
            </div>

            <p className="text-xl md:text-3xl font-bold text-primary-700">
              {feedback.totalMessages || 0}
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-3 md:p-5 border border-green-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <FaChartLine className="text-green-600 shrink-0" />

              <h3 className="font-semibold text-gray-900 text-xs md:text-base">
                Słowa
              </h3>
            </div>

            <p className="text-xl md:text-3xl font-bold text-green-700">
              {feedback.totalWords || 0}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-3 md:p-5 border border-yellow-100">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <FaBrain className="text-yellow-600 shrink-0" />

              <h3 className="font-semibold text-gray-900 text-xs md:text-base">
                Poziom
              </h3>
            </div>

            <p className="text-xl md:text-3xl font-bold text-yellow-700">
              {feedback.suggestedLevel || "A1"}
            </p>
          </div>
        </div>

        {objectivesCompleted.length > 0 && (
          <div className="mt-5 md:mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-4">
              Cele misji
            </h3>

            <ul className="space-y-3">
              {objectivesCompleted.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm md:text-base text-blue-900"
                >
                  <span className="mt-1">
                    {item.completed ? "✅" : "⬜"}
                  </span>

                  <div>
                    <p className="font-semibold">
                      {item.objective}
                    </p>

                    {item.evidence && (
                      <p className="text-blue-700 text-sm mt-1">
                        {item.evidence}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mt-5 md:mt-8">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-green-800 mb-3 md:mb-4">
              Mocne strony
            </h3>

            <ul className="space-y-2 md:space-y-3">
              {strengths.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 md:gap-3 text-green-900 text-sm md:text-base"
                >
                  <FaCheckCircle className="mt-1 shrink-0" />
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-orange-800 mb-3 md:mb-4">
              Obszary do poprawy
            </h3>

            <ul className="space-y-2 md:space-y-3">
              {improvements.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 md:gap-3 text-orange-900 text-sm md:text-base"
                >
                  <span className="mt-1 shrink-0">⚡</span>
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {corrections.length > 0 && (
          <div className="mt-5 md:mt-8 bg-red-50 border border-red-100 rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-red-800 mb-4">
              Sugerowane poprawki
            </h3>

            <div className="space-y-4">
              {corrections.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-red-100 rounded-xl p-4"
                >
                  <p className="text-sm text-red-700">
                    Oryginał:
                  </p>

                  <p className="font-semibold text-gray-900">
                    {item.original}
                  </p>

                  <p className="text-sm text-green-700 mt-3">
                    Lepsza wersja:
                  </p>

                  <p className="font-semibold text-gray-900">
                    {item.suggested}
                  </p>

                  {item.explanation && (
                    <p className="text-sm text-gray-600 mt-3">
                      {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(vocabulary.length > 0 || grammarTips.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mt-5 md:mt-8">
            {vocabulary.length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-purple-800 mb-4">
                  Słownictwo
                </h3>

                <ul className="space-y-3">
                  {vocabulary.map((item, index) => (
                    <li
                      key={index}
                      className="bg-white rounded-xl border border-purple-100 p-3"
                    >
                      <p className="font-semibold text-gray-900">
                        {item.word}
                      </p>

                      <p className="text-sm text-gray-600">
                        {item.meaning}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {grammarTips.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-indigo-800 mb-4">
                  Wskazówki gramatyczne
                </h3>

                <ul className="space-y-3">
                  {grammarTips.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm md:text-base text-indigo-900"
                    >
                      <FaLightbulb className="mt-1 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {nextSteps.length > 0 && (
          <div className="mt-5 md:mt-8 bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaRocket className="text-primary-600" />
              Kolejne kroki
            </h3>

            <ul className="space-y-3">
              {nextSteps.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm md:text-base text-gray-700"
                >
                  <span className="text-primary-600 font-bold">
                    {index + 1}.
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 md:mt-8 bg-gray-50 rounded-2xl p-4 md:p-5 text-left border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Twoja rozmowa
          </h3>

          <div className="space-y-3 max-h-[360px] md:max-h-[420px] overflow-y-auto pr-1">
            {(result.conversation || []).map((message) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={message.id}
                  className={`rounded-xl px-3 md:px-4 py-3 text-sm md:text-base break-words ${
                    isUser
                      ? "bg-primary-600 text-white ml-4 md:ml-8"
                      : "bg-white border border-gray-200 mr-4 md:mr-8 text-gray-800"
                  }`}
                >
                  <p className="text-xs md:text-sm font-semibold mb-1">
                    {isUser ? "Ty" : "Asystent"}
                  </p>

                  <p className="leading-relaxed">{message.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 md:px-6 py-3 font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <FaRedo />
            Ćwicz ponownie
          </button>

          <button
            type="button"
            onClick={onBackToMissions}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 md:px-6 py-3 font-semibold bg-primary-600 text-white hover:bg-primary-700"
          >
            <FaArrowLeft />
            Powrót do misji
          </button>
        </div>
      </div>
    </section>
  );
};

export default MissionFeedback;