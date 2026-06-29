// src/pages/PersonalizedMissionPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaBrain,
  FaBullseye,
  FaCheckCircle,
  FaClock,
  FaRobot,
  FaSpinner
} from "react-icons/fa";

import { db } from "../firebase";
import { generatePersonalizedMission } from "../services/missionAiService";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Adaptive"];

const PersonalizedMissionPage = () => {
  const { temaTitle } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [level, setLevel] = useState("Adaptive");
  const [generatedMission, setGeneratedMission] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [generatingMission, setGeneratingMission] = useState(false);
  const [error, setError] = useState("");

  const topicTitle = topic?.title || topic?.titulo || temaTitle || "Topic";

  useEffect(() => {
    const loadTopic = async () => {
      try {
        setLoadingTopic(true);

        const topicRef = doc(db, "temas", temaTitle);
        const topicSnap = await getDoc(topicRef);

        if (topicSnap.exists()) {
          setTopic({
            id: topicSnap.id,
            ...topicSnap.data()
          });
        } else {
          setTopic({
            id: temaTitle,
            title: temaTitle,
            icon: "🎯",
            description: "Personalized mission topic."
          });
        }
      } catch (error) {
        console.error("Error loading topic:", error);
        setError("Could not load the topic.");
      } finally {
        setLoadingTopic(false);
      }
    };

    loadTopic();
  }, [temaTitle]);

  const handleGenerateMission = async (event) => {
    event.preventDefault();
    setError("");
    setGeneratedMission(null);

    if (!situation.trim()) {
      setError("Please describe the situation you want to practice.");
      return;
    }

    if (!goal.trim()) {
      setError("Please write your goal for this mission.");
      return;
    }

    if (!aiRole.trim()) {
      setError("Please describe who the AI should become.");
      return;
    }

    try {
      setGeneratingMission(true);

      const mission = await generatePersonalizedMission({
        topic,
        formData: {
          situation: situation.trim(),
          goal: goal.trim(),
          aiRole: aiRole.trim(),
          level
        }
      });

      setGeneratedMission(mission);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      console.error("Error generating personalized mission:", error);
      setError("Could not generate the personalized mission. Please try again.");
    } finally {
      setGeneratingMission(false);
    }
  };

  const handleStartMission = () => {
    if (!generatedMission) return;

    navigate(`/tema/${temaTitle}/mission-chat`, {
      state: {
        topic,
        mission: generatedMission,
        isCustomMission: true
      }
    });
  };

  if (loadingTopic) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-4 pb-8 md:py-10 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(`/tema/${temaTitle}`)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 font-medium mb-4 md:mb-6"
        >
          <FaArrowLeft />
          Back to missions
        </button>

        <header className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-5 md:mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl md:text-4xl shrink-0">
              {topic?.icon || "🎯"}
            </div>

            <div>
              <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Personalized AI mission
              </p>

              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1">
                Create a {topicTitle} mission
              </h1>

              <p className="text-sm md:text-base text-gray-600 mt-3 leading-relaxed max-w-3xl">
                Describe the exact situation you want to practice. The AI will
                create a mission summary and you can review it before starting.
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        {!generatedMission && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 md:p-6">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-primary-100">
                Mission builder
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mt-1">
                Tell the AI what you need
              </h2>

              <p className="text-sm md:text-base text-primary-50 mt-2 max-w-2xl leading-relaxed">
                The category is already based on the topic you selected:
                {" "}
                <strong>{topicTitle}</strong>.
              </p>
            </div>

            <form onSubmit={handleGenerateMission} className="p-5 md:p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaBrain className="text-primary-600" />
                  Describe your situation
                </label>

                <textarea
                  rows="5"
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                  placeholder="Example: I am going to speak with my girlfriend's family for the first time and I want to introduce myself politely."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaRobot className="text-primary-600" />
                  Who should the AI become?
                </label>

                <input
                  type="text"
                  value={aiRole}
                  onChange={(event) => setAiRole(event.target.value)}
                  placeholder="Example: my friend's mother, a strict employer, a hotel receptionist..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Conversation level
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

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <FaRobot className="mt-1 shrink-0" />

                  <p className="leading-relaxed">
                    The AI will create the mission structure first. You will
                    review the summary before entering the chat.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingMission}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingMission ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Generating mission...
                  </>
                ) : (
                  <>
                    Generate mission summary
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {generatedMission && (
          <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 md:p-8">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-primary-100">
                Mission summary
              </p>

              <h2 className="text-2xl md:text-4xl font-bold mt-2">
                {generatedMission.title}
              </h2>

              <p className="text-sm md:text-base text-primary-50 mt-3 leading-relaxed max-w-3xl">
                {generatedMission.description}
              </p>

              <div className="grid grid-cols-3 gap-2 md:gap-3 mt-6 max-w-xl">
                <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
                  <p className="text-lg md:text-2xl font-bold">
                    {generatedMission.xpReward}
                  </p>
                  <p className="text-[10px] md:text-xs text-primary-100">XP</p>
                </div>

                <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
                  <p className="text-lg md:text-2xl font-bold">
                    {generatedMission.level}
                  </p>
                  <p className="text-[10px] md:text-xs text-primary-100">Level</p>
                </div>

                <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
                  <p className="text-lg md:text-2xl font-bold">
                    {generatedMission.estimatedMinutes}
                  </p>
                  <p className="text-[10px] md:text-xs text-primary-100">Min</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 space-y-5">
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-gray-900 mb-2">Scenario</h3>
                <p className="text-gray-700 leading-relaxed">
                  {generatedMission.scenario}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-gray-900 mb-3">AI role</h3>
                <p className="text-gray-700">{generatedMission.aiRole}</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-gray-900 mb-3">Objectives</h3>

                <ul className="space-y-3">
                  {(generatedMission.objectives || []).map((objective, index) => (
                    <li
                      key={objective.id || index}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <FaCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>{objective.text || objective.title || objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {generatedMission.briefing && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 md:p-5">
                  <h3 className="font-bold text-gray-900 mb-2">Briefing</h3>

                  <p className="text-gray-700 leading-relaxed">
                    {generatedMission.briefing.studentInstructions}
                  </p>

                  {generatedMission.briefing.successCriteria?.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {generatedMission.briefing.successCriteria.map(
                        (criterion, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 text-sm text-gray-700"
                          >
                            <span className="text-yellow-700 font-bold">
                              {index + 1}.
                            </span>
                            <span>{criterion}</span>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedMission(null)}
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                  Edit request
                </button>

                <button
                  type="button"
                  onClick={handleStartMission}
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
                >
                  Start mission
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PersonalizedMissionPage;