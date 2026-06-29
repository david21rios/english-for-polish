// src/pages/Welcome.jsx

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FaArrowRight,
  FaEnvelope,
  FaRobot,
  FaCheckCircle,
  FaShieldAlt,
  FaGraduationCap,
  FaGamepad,
  FaChartLine
} from "react-icons/fa";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import heroIllustration from "../assets/img/Welcome/hero-illustration.svg";
import aboutIllustration from "../assets/img/Welcome/about-illustration.svg";
import testIllustration from "../assets/img/Welcome/test-illustration.svg";
import contactIllustration from "../assets/img/Welcome/contact-illustration.svg";
import PublicChatbot from "../components/chat/PublicChatbot";

const MotionSection = motion.section;

const quickQuestions = [
  {
    question: "How can this app help me?",
    answer:
      "It helps you learn Spanish step by step through levels, lessons, tests, topics, practice missions and progress tracking."
  },
  {
    question: "Do I need to take a test?",
    answer:
      "Yes. The test helps estimate your current level so the app can guide you better."
  },
  {
    question: "Can I practice real situations?",
    answer:
      "Yes. The Topics section lets you practice real-life situations such as family, work, travel, shopping and more."
  },
  {
    question: "Will there be AI support?",
    answer:
      "Yes. The platform is being prepared to include an AI assistant for app guidance and learning support."
  }
];

const Welcome = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(quickQuestions[0]);

  const fadeInUp = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const isValidEmail = (value = "") => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim().toLowerCase());
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    setError("");
    setMessageSent(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setError("Please complete all fields.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (cleanMessage.length < 10) {
      setError("Please write a more detailed message.");
      return;
    }

    try {
      await addDoc(collection(db, "messages"), {
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        source: "welcome",
        createdAt: serverTimestamp(),
        userId: "anon",
        status: "new"
      });

      setMessageSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("There was an error sending your message. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <MotionSection
          id="welcome-title"
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <span className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-full shadow-sm text-sm font-semibold mb-5">
                  <FaGraduationCap />
                  Spanish learning platform
                </span>

                <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary-600 mb-6 leading-tight">
                  Learn Spanish with lessons, tests and real practice
                </h1>

                <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl mx-auto md:mx-0">
                  Start from your current level, follow structured lessons,
                  practice real-life topics and track your progress as you improve.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Create account
                    <FaArrowRight />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-primary-600 font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-primary-500"
                  >
                    Sign in
                    <FaArrowRight />
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/80 rounded-2xl shadow p-4">
                    <p className="font-bold text-primary-600">6 levels</p>
                    <p className="text-sm text-gray-500">A1 to C2</p>
                  </div>

                  <div className="bg-white/80 rounded-2xl shadow p-4">
                    <p className="font-bold text-primary-600">Tests</p>
                    <p className="text-sm text-gray-500">Level diagnosis</p>
                  </div>

                  <div className="bg-white/80 rounded-2xl shadow p-4">
                    <p className="font-bold text-primary-600">Missions</p>
                    <p className="text-sm text-gray-500">Real practice</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full opacity-10 blur-3xl transform -rotate-6" />

                <img
                  src={heroIllustration}
                  alt="Spanish learning"
                  className="relative w-full h-auto max-w-lg mx-auto transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-5">
            {[
              {
                icon: FaCheckCircle,
                title: "Structured path",
                text: "Follow levels, lessons and activities in order."
              },
              {
                icon: FaGamepad,
                title: "Practice missions",
                text: "Use Spanish in real-life contexts."
              },
              {
                icon: FaChartLine,
                title: "Progress tracking",
                text: "Review your level, XP and achievements."
              },
              {
                icon: FaShieldAlt,
                title: "Safe access",
                text: "Account verification and protected routes."
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl shadow p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-xl mb-4">
                    <Icon />
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </MotionSection>

        <MotionSection
          id="about-me"
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-heading font-semibold text-primary-700 mb-6">
                  Why this app exists
                </h2>

                <p className="text-gray-600 leading-relaxed">
                  This platform was created to help students learn Spanish with
                  a clear path: first understand their level, then study lessons,
                  practice through real situations and measure progress over time.
                </p>

                <p className="text-gray-600 leading-relaxed mt-4">
                  The goal is to make learning more practical, interactive and
                  useful than only memorizing isolated words.
                </p>
              </div>

              <div className="max-w-sm mx-auto">
                <img
                  src={aboutIllustration}
                  alt="About the platform"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection
          id="test-info"
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="max-w-sm mx-auto order-2 md:order-1">
                <img
                  src={testIllustration}
                  alt="Level test"
                  className="w-full h-auto"
                />
              </div>

              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-heading font-semibold text-primary-700 mb-6">
                  How does the test work?
                </h2>

                <p className="text-gray-600 leading-relaxed mb-6">
                  The test evaluates your Spanish through multiple choice,
                  writing and reading comprehension. After completing it, the app
                  estimates your level and helps you continue from the right place.
                </p>

                <ul className="space-y-3 text-gray-600 mb-8">
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Estimated level based on your results.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Personalized course starting point.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Retake control to avoid repeating the test too often.
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-xl"
                  >
                    Login
                    <FaArrowRight />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl"
                  >
                    Sign up
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection
          id="public-assistant"
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-primary-600 rounded-3xl shadow-lg p-8 md:p-12 max-w-5xl mx-auto text-white">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-5">
                  <FaRobot />
                </div>

                <h2 className="text-3xl font-bold mb-4">
                  AI-powered learning support
                </h2>

                <p className="text-primary-50 leading-relaxed">
                  The platform is being prepared to include AI support for guided
                  practice, app help, writing feedback, conversation missions and
                  personalized learning recommendations.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 text-gray-800">
                <p className="font-semibold mb-3">
                  Choose a question:
                </p>

                <div className="space-y-2 mb-5">
                  {quickQuestions.map((item) => (
                    <button
                      key={item.question}
                      type="button"
                      onClick={() => setSelectedQuestion(item)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm ${
                        selectedQuestion.question === item.question
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {item.question}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-primary-700 mb-2">
                    Answer
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedQuestion.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection
          id="contact-form"
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-heading font-semibold text-primary-700 mb-6">
                  Contact us
                </h2>

                <form onSubmit={sendMessage} className="space-y-5">
                  {messageSent && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                      Thank you for your message. We will review it soon.
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Your email"
                    required
                    maxLength={120}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />

                  <textarea
                    placeholder="Your message"
                    rows="4"
                    required
                    maxLength={1000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                  />

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-xl w-full sm:w-auto"
                  >
                    <FaEnvelope />
                    Send message
                  </button>
                </form>
              </div>

              <div className="max-w-sm mx-auto">
                <img
                  src={contactIllustration}
                  alt="Contact us"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </MotionSection>
      </div>
      <PublicChatbot />
    </div>
  );
};

export default Welcome;