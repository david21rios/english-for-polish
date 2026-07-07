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
    title: "Sytuacje z życia",
    description: "Ćwicz angielski w codziennych kontekstach.",
    details:
      "Ćwicz angielski w realnych sytuacjach, takich jak rodzina, podróże, zakupy, praca, jedzenie, zdrowie i rozmowy społeczne. Celem nie jest tylko zapamiętywanie słownictwa, ale używanie angielskiego naturalnie w sytuacjach, które mogą pojawić się w prawdziwym życiu.",
    status: "Dostępne teraz"
  },
  {
    icon: <FaGamepad />,
    title: "Misje",
    description: "Wykonuj krótkie wyzwania według tematów.",
    details:
      "Każdy temat może zawierać prowadzone misje, krótkie rozmowy, pytania, odgrywanie ról i praktyczne wyzwania. Dzięki temu nauka jest bardziej aktywna i mniej monotonna.",
    status: "Dostępne teraz"
  },
  {
    icon: <FaBolt />,
    title: "Punkty XP",
    description: "Zdobywaj punkty podczas ćwiczeń.",
    details:
      "Punkty XP są częścią systemu grywalizacji. Pomagają pokazać wysiłek i postęp. W kolejnych etapach XP mogą zostać połączone z seriami nauki, osiągnięciami, rankingiem i spersonalizowanymi celami edukacyjnymi.",
    status: "W trakcie rozwoju"
  },
  {
    icon: <FaRobot />,
    title: "Wsparcie AI",
    description: "Przyszła pomoc kontekstowa.",
    details:
      "Platforma jest przygotowywana do obsługi AI w zakresie pomocy kontekstowej, informacji zwrotnej do pisania, ćwiczeń prowadzonych oraz przyszłych aktywności konwersacyjnych. Funkcja będzie dodawana ostrożnie, aby odpowiedzi były bezpieczne, użyteczne i dopasowane do ucznia.",
    status: "Funkcja planowana"
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
            Praktyka angielskiego w realnych sytuacjach
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-4xl mx-auto">
            Ćwicz angielski przez codzienne sytuacje
          </h1>

          <p className="mt-4 text-base md:text-lg text-primary-50 leading-relaxed max-w-3xl mx-auto">
            Wybierz temat z życia codziennego, wykonuj misje, zdobywaj XP
            i ćwicz rozmowy dopasowane do Twojego poziomu.
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
                aria-label="Zamknij okno"
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
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopicIntro;