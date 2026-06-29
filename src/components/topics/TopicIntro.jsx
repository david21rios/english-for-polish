// src/components/topics/TopicIntro.jsx

import React, { useState } from "react";
import {
  FaBolt,
  FaRobot,
  FaComments,
  FaGamepad,
  FaTimes,
  FaCheckCircle
} from "react-icons/fa";

const features = [
  {
    icon: <FaComments />,
    title: "Real situations",
    description: "Practice Spanish in daily-life contexts.",
    details:
      "Practice Spanish in real contexts such as family, travel, shopping, work, food, health and social conversations. The goal is not only to memorize vocabulary, but to use Spanish naturally in situations that may happen in real life.",
    status: "Available now"
  },
  {
    icon: <FaGamepad />,
    title: "Missions",
    description: "Complete short challenges by topic.",
    details:
      "Each topic can include guided missions, short conversations, questions, roleplay activities and practical challenges. This makes learning more active and less repetitive.",
    status: "Available now"
  },
  {
    icon: <FaBolt />,
    title: "XP rewards",
    description: "Earn points as you practice.",
    details:
      "XP points are part of the gamification system. They help represent effort and progress. Later, XP can be connected to streaks, achievements, ranking and personalized learning goals.",
    status: "In progress"
  },
  {
    icon: <FaRobot />,
    title: "AI support",
    description: "Future guided assistance.",
    details:
      "The platform is being prepared to include AI support for contextual help, writing feedback, guided practice and future conversation activities. This will be added carefully to keep responses safe, useful and adapted to the learner.",
    status: "Future feature"
  }
];

const TopicIntro = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <section className="mb-6 md:mb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 rounded-3xl shadow-xl px-5 py-8 sm:px-8 md:px-12 md:py-12">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs sm:text-sm font-medium mb-4">
            <FaComments className="shrink-0" />
            Real world Spanish practice
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-4xl mx-auto">
            Practice Spanish through real situations
          </h1>

          <p className="mt-4 text-base md:text-lg text-primary-50 leading-relaxed max-w-3xl mx-auto">
            Choose a daily-life topic, complete missions, earn XP and practice
            conversations adapted to your level.
          </p>

          <div className="mt-6 grid grid-cols-2 md:flex md:flex-wrap justify-center gap-2 md:gap-3">
            {features.map((feature) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => setSelectedFeature(feature)}
                className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/10 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 transition"
              >
                <span className="shrink-0">{feature.icon}</span>
                <span>{feature.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl shrink-0">
                  {selectedFeature.icon}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedFeature.title}
                  </h2>

                  <div className="inline-flex items-center gap-2 mt-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <FaCheckCircle />
                    {selectedFeature.status}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-gray-600 leading-relaxed">
              {selectedFeature.details}
            </p>

            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="mt-8 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopicIntro;