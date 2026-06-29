// src/components/topics/PersonalizedMissionForm.jsx

import React, { useState } from "react";
import {
  FaArrowRight,
  FaBrain,
  FaBullseye,
  FaRobot,
  FaTimes
} from "react-icons/fa";

const CATEGORIES = [
  "Family",
  "Work",
  "Restaurant",
  "Shopping",
  "Travel",
  "Hotel",
  "Doctor",
  "Friends",
  "Other"
];

const AI_ROLES = [
  "Family member",
  "Friend",
  "Teacher",
  "Customer",
  "Waiter",
  "Hotel receptionist",
  "Doctor",
  "Employer",
  "Custom"
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Adaptive"];

const PersonalizedMissionForm = ({
  topic,
  onCreateMission,
  onCancel
}) => {
  const topicTitle = topic?.title || topic?.titulo || "Topic";

  const [category, setCategory] = useState("Family");
  const [level, setLevel] = useState("Adaptive");
  const [aiRole, setAiRole] = useState("Family member");
  const [customAiRole, setCustomAiRole] = useState("");
  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  const finalAiRole =
    aiRole === "Custom" ? customAiRole.trim() : aiRole;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!situation.trim()) {
      setError("Please describe the situation you want to practice.");
      return;
    }

    if (!goal.trim()) {
      setError("Please write your goal for this mission.");
      return;
    }

    if (!finalAiRole) {
      setError("Please select or write the AI role.");
      return;
    }

    const personalizedMission = {
      id: `custom_${Date.now()}`,
      title: `Personalized ${topicTitle} mission`,
      description:
        "A personalized AI mission created from your own context and goal.",
      scenario: situation.trim(),
      goal: goal.trim(),
      aiRole: finalAiRole,
      aiInstructions:
        "Stay in character. Do not correct the student during the conversation. Help the student complete the goal naturally. Give corrections only in the final feedback.",
      category,
      level,
      difficulty: "adaptive",
      xpReward: 15,
      estimatedMinutes: 5,
      minReplies: 3,
      status: "custom",
      missionType: "conversation",
      feedbackMode: "after_mission",
      correctionMode: "delayed",
      isCustom: true,
      objectives: [
        {
          id: "objective_1",
          text: `Communicate the main goal: ${goal.trim()}`,
          required: true
        },
        {
          id: "objective_2",
          text: `Respond naturally to the ${finalAiRole}`,
          required: true
        },
        {
          id: "objective_3",
          text: "Keep the conversation going for several turns",
          required: true
        }
      ]
    };

    onCreateMission(personalizedMission);
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-primary-100">
              Personalized AI mission
            </p>

            <h2 className="text-2xl md:text-3xl font-bold mt-1">
              Create your own mission
            </h2>

            <p className="text-sm md:text-base text-primary-50 mt-2 max-w-2xl leading-relaxed">
              Practice exactly the situation you need. The AI will become a
              character and talk with you naturally.
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
              aria-label="Close personalized mission form"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Situation type
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              AI role
            </label>

            <select
              value={aiRole}
              onChange={(event) => setAiRole(event.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {AI_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Level
            </label>

            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {aiRole === "Custom" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom AI role
            </label>

            <input
              type="text"
              value={customAiRole}
              onChange={(event) => setCustomAiRole(event.target.value)}
              placeholder="Example: immigration officer, coworker, client..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FaBrain className="text-primary-600" />
            Describe your situation
          </label>

          <textarea
            rows="4"
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="Example: I am going to meet my partner's family for the first time and I want to introduce myself politely."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FaBullseye className="text-primary-600" />
            What is your goal?
          </label>

          <input
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Example: I want to introduce myself and ask simple family questions."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <FaRobot className="mt-1 shrink-0" />

            <p className="leading-relaxed">
              The AI will talk with you naturally. It will not correct you
              during the conversation. You will receive feedback at the end.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            Create mission
            <FaArrowRight />
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl px-6 py-3 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
};

export default PersonalizedMissionForm;