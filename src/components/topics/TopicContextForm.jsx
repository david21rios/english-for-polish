// src/components/topics/TopicContextForm.jsx

import React, { useState } from "react";
import {
  FaArrowRight,
  FaBullseye,
  FaComments,
  FaGlobeAmericas,
  FaUserEdit
} from "react-icons/fa";

const TopicContextForm = ({ topicTitle, onStart }) => {
  const [goal, setGoal] = useState("");
  const [situation, setSituation] = useState("");
  const [level, setLevel] = useState("A1");
  const [tone, setTone] = useState("friendly");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!goal.trim() || !situation.trim()) {
      setError("Please complete your goal and situation before starting.");
      return;
    }

    onStart({
      goal: goal.trim(),
      situation: situation.trim(),
      level,
      tone,
      topicTitle
    });
  };

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 md:p-8">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/15 flex items-center justify-center text-xl md:text-2xl shrink-0">
            <FaGlobeAmericas />
          </div>

          <div>
            <p className="text-xs md:text-sm uppercase tracking-wide text-primary-100 font-semibold">
              Mission setup
            </p>

            <h2 className="text-xl md:text-3xl font-bold leading-tight">
              Personalize your practice
            </h2>
          </div>
        </div>

        <p className="text-primary-50 leading-relaxed text-sm md:text-base max-w-3xl mt-4">
          Tell the app what kind of situation you want to practice so the
          conversation feels more realistic.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-5 md:space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FaBullseye className="text-primary-600 shrink-0" />
            What is your goal?
          </label>

          <input
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Example: I want to practice asking for information."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FaComments className="text-primary-600 shrink-0" />
            Describe your situation
          </label>

          <textarea
            rows="3"
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="Example: I am traveling and need to speak with someone at a hotel."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FaUserEdit className="text-primary-600 shrink-0" />
              Practice level
            </label>

            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Proficient</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FaComments className="text-primary-600 shrink-0" />
              Conversation tone
            </label>

            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 md:p-4 text-xs md:text-sm text-blue-800 leading-relaxed">
          This context will be used for the current practice session. Later, it
          can also be sent to an AI backend to generate more personalized
          conversations.
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          Start missions
          <FaArrowRight />
        </button>
      </form>
    </section>
  );
};

export default TopicContextForm;