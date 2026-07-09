// src/pages/Welcome.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaEnvelope,
  FaGamepad,
  FaGraduationCap,
  FaRobot,
  FaTimes
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase";

import heroIllustration from "../assets/img/Welcome/hero-illustration.svg";
import aboutIllustration from "../assets/img/Welcome/about-illustration.svg";
import testIllustration from "../assets/img/Welcome/test-illustration.svg";
import contactIllustration from "../assets/img/Welcome/contact-illustration.svg";
import PublicChatbot from "../components/chat/PublicChatbot";

const MotionSection = motion.section;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const quickQuestions = [
  {
    question: "Jak ta platforma pomaga mi w nauce?",
    answer:
      "Platforma prowadzi Cię krok po kroku przez poziomy, moduły, lekcje, ćwiczenia, testy i misje praktyczne. Dzięki temu uczysz się w uporządkowany sposób i możesz śledzić swoje postępy."
  },
  {
    question: "Czy muszę wykonać test?",
    answer:
      "Test pomaga określić Twój aktualny poziom i lepiej dobrać ścieżkę nauki. Zakres testu może być skonfigurowany przez instytucję zgodnie z jej wymaganiami akademickimi."
  },
  {
    question: "Czy mogę ćwiczyć realne sytuacje?",
    answer:
      "Tak. Misje pozwalają ćwiczyć użycie języka angielskiego w codziennych sytuacjach, takich jak podróże, praca, restauracja, zakupy, rodzina i rozmowy społeczne."
  },
  {
    question: "Jak wykorzystywana jest sztuczna inteligencja?",
    answer:
      "Sztuczna inteligencja wspiera praktykę, tworzenie doświadczeń edukacyjnych, misje konwersacyjne i informacje zwrotne. Treści akademickie mogą być nadzorowane i zatwierdzane przez instytucję."
  }
];

const featureCards = [
  {
    icon: FaCheckCircle,
    title: "Uporządkowana ścieżka",
    text: "Przechodź przez poziomy, moduły, lekcje i aktywności w logicznej kolejności."
  },
  {
    icon: FaGamepad,
    title: "Praktyka w kontekście",
    text: "Używaj języka angielskiego w misjach inspirowanych sytuacjami z życia codziennego."
  },
  {
    icon: FaChartLine,
    title: "Widoczny postęp",
    text: "Sprawdzaj swój poziom, zdobyte XP, aktywności i postępy w nauce."
  },
  {
    icon: FaBookOpen,
    title: "Nauka z prowadzeniem",
    text: "Korzystaj z lekcji, ćwiczeń, oceniania i informacji zwrotnej w jednej ścieżce."
  }
];

const InfoModal = ({ modal, onClose }) => {
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
              {modal.label}
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              {modal.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center shrink-0"
            aria-label="Zamknij okno"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          {modal.content}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl"
        >
          Rozumiem
        </button>
      </div>
    </div>
  );
};

const Welcome = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(quickQuestions[0]);
  const [selectedModal, setSelectedModal] = useState(null);
  const [moduleStats, setModuleStats] = useState({
    total: 0,
    byLevel: LEVELS.reduce((acc, level) => ({ ...acc, [level]: 0 }), {})
  });

  useEffect(() => {
    const loadModuleStats = async () => {
      try {
        const byLevel = {};
        let total = 0;

        await Promise.all(
          LEVELS.map(async (level) => {
            const snapshot = await getDocs(
              collection(db, "levels", level, "modules")
            );

            byLevel[level] = snapshot.size;
            total += snapshot.size;
          })
        );

        setModuleStats({ total, byLevel });
      } catch (error) {
        console.error("Error loading module statistics:", error);
      }
    };

    loadModuleStats();
  }, []);

  const infoModals = useMemo(
    () => ({
      levels: {
        label: "Poziomy CEFR",
        title: "Pełna ścieżka od A1 do C2",
        content: (
          <>
            <p>
              Platforma organizuje naukę zgodnie z sześcioma poziomami CEFR:
              A1, A2, B1, B2, C1 i C2. Dzięki temu student może rozwijać się
              stopniowo, od podstawowej komunikacji aż po zaawansowane użycie
              języka.
            </p>

            <p>
              Obecnie ścieżka akademicka zawiera{" "}
              <strong>{moduleStats.total}</strong>{" "}
              {moduleStats.total === 1 ? "moduł" : "modułów"}.
              Liczba ta aktualizuje się automatycznie, gdy instytucja tworzy
              lub usuwa moduły.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {LEVELS.map((level) => (
                <div
                  key={level}
                  className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center"
                >
                  <p className="font-bold text-primary-700">{level}</p>
                  <p className="text-sm text-gray-600">
                    {moduleStats.byLevel[level] || 0} modułów
                  </p>
                </div>
              ))}
            </div>
          </>
        )
      },
      tests: {
        label: "Ewaluacja",
        title: "Testy, które pomagają ukierunkować naukę",
        content: (
          <>
            <p>
              Ewaluacje pozwalają sprawdzić aktualne umiejętności studenta i
              lepiej dopasować dalszą ścieżkę nauki.
            </p>

            <p>
              W zależności od konfiguracji akademickiej instytucji testy mogą
              obejmować pytania wyboru, czytanie ze zrozumieniem oraz zadania
              pisemne.
            </p>

            <p>
              Wyniki pomagają rejestrować postęp, analizować poziom wykonania
              i wspierać decyzje dotyczące dalszego rozwoju językowego.
            </p>
          </>
        )
      },
      missions: {
        label: "Praktyka",
        title: "Angielski w sytuacjach z życia codziennego",
        content: (
          <>
            <p>
              Misje zamieniają naukę w aktywną praktykę. Student może ćwiczyć
              rozmowy związane z podróżami, pracą, restauracją, zakupami,
              rodziną i innymi codziennymi kontekstami.
            </p>

            <p>
              Każda misja ma cel komunikacyjny. Student prowadzi rozmowę,
              realizuje zadanie, otrzymuje informację zwrotną i zdobywa XP.
            </p>

            <p>
              Dzięki temu nauka nie kończy się na zapamiętywaniu słów, ale
              przechodzi w realne użycie języka.
            </p>
          </>
        )
      }
    }),
    [moduleStats]
  );

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
      setError("Uzupełnij wszystkie pola.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Wpisz poprawny adres e-mail.");
      return;
    }

    if (cleanMessage.length < 10) {
      setError("Napisz bardziej szczegółową wiadomość.");
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
      setError("Nie udało się wysłać wiadomości. Spróbuj ponownie później.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <InfoModal
        modal={selectedModal}
        onClose={() => setSelectedModal(null)}
      />

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
                  Uniwersytecka platforma nauki angielskiego
                </span>

                <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary-600 mb-6 leading-tight">
                  Ucz się angielskiego ścieżką zaprojektowaną dla Twojego postępu
                </h1>

                <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl mx-auto md:mx-0">
                  Rozwijaj się od swojego aktualnego poziomu dzięki
                  uporządkowanym lekcjom, ewaluacjom, praktyce w realnych
                  sytuacjach i stałemu śledzeniu postępów.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Utwórz konto
                    <FaArrowRight />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-primary-600 font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-primary-500"
                  >
                    Zaloguj się
                    <FaArrowRight />
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModal(infoModals.levels)}
                    className="bg-white/80 rounded-2xl shadow p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <p className="font-bold text-primary-600">6 poziomów</p>
                    <p className="text-sm text-gray-500">Od A1 do C2</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModal(infoModals.tests)}
                    className="bg-white/80 rounded-2xl shadow p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <p className="font-bold text-primary-600">Ewaluacje</p>
                    <p className="text-sm text-gray-500">
                      Poznaj i sprawdź swój poziom
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModal(infoModals.missions)}
                    className="bg-white/80 rounded-2xl shadow p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <p className="font-bold text-primary-600">Misje</p>
                    <p className="text-sm text-gray-500">
                      Ćwicz realne sytuacje
                    </p>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full opacity-10 blur-3xl transform -rotate-6" />

                <img
                  src={heroIllustration}
                  alt="Nauka języka angielskiego"
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
            {featureCards.map((item) => {
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
                  Pełniejszy sposób nauki angielskiego
                </h2>

                <p className="text-gray-600 leading-relaxed">
                  Nauka języka wymaga więcej niż zapamiętywania słów.
                  Potrzebujesz rozumienia, praktyki, popełniania błędów,
                  informacji zwrotnej i ścieżki dopasowanej do własnego
                  procesu.
                </p>

                <p className="text-gray-600 leading-relaxed mt-4">
                  Ta platforma łączy treści akademickie, ewaluacje, praktykę
                  kontekstową i śledzenie postępów w jednej uporządkowanej
                  i ciągłej ścieżce nauki.
                </p>
              </div>

              <div className="max-w-sm mx-auto">
                <img
                  src={aboutIllustration}
                  alt="O platformie"
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
                  alt="Ewaluacja poziomu"
                  className="w-full h-auto"
                />
              </div>

              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-heading font-semibold text-primary-700 mb-6">
                  Poznaj swój poziom i mierz postęp
                </h2>

                <p className="text-gray-600 leading-relaxed mb-6">
                  Ewaluacje pozwalają sprawdzić Twoje umiejętności w różnych
                  obszarach języka i wspierać dalszą ścieżkę nauki. Każdy test
                  może być skonfigurowany zgodnie z kryteriami określonymi
                  przez instytucję.
                </p>

                <ul className="space-y-3 text-gray-600 mb-8">
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Ocenia różne umiejętności językowe.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Rejestruje wyniki i rozwój akademicki.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="text-green-600 mt-1" />
                    Pomaga ukierunkować poziom i dalszą ścieżkę nauki.
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-xl"
                  >
                    Zaloguj się
                    <FaArrowRight />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl"
                  >
                    Zarejestruj się
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
                  Sztuczna inteligencja wspierająca naukę
                </h2>

                <p className="text-primary-50 leading-relaxed">
                  Platforma wykorzystuje sztuczną inteligencję do wzbogacania
                  praktyki, tworzenia doświadczeń edukacyjnych, misji
                  konwersacyjnych i informacji zwrotnej — w ramach struktury
                  akademickiej nadzorowanej przez instytucję.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 text-gray-800">
                <p className="font-semibold mb-3">
                  Wybierz pytanie:
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
                    Odpowiedź
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
                  Kontakt
                </h2>

                <form onSubmit={sendMessage} className="space-y-5">
                  {messageSent && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                      Dziękujemy za wiadomość. Odpowiemy tak szybko, jak to
                      możliwe.
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Imię i nazwisko"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Adres e-mail"
                    required
                    maxLength={120}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />

                  <textarea
                    placeholder="Wiadomość"
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
                    Wyślij wiadomość
                  </button>
                </form>
              </div>

              <div className="max-w-sm mx-auto">
                <img
                  src={contactIllustration}
                  alt="Kontakt"
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