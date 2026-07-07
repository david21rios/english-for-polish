// src/pages/Temas.jsx

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import TopicGrid from "../components/topics/TopicGrid";
import TopicIntro from "../components/topics/TopicIntro";

const Temas = () => {
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const containerRef = useRef(null);
  const circlesRef = useRef([]);

  useEffect(() => {
    const fetchTemas = async () => {
      try {
        setLoading(true);

        const temasSnapshot = await getDocs(collection(db, "temas"));

        const temasData = temasSnapshot.docs.map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }));

        setTemas(temasData);
      } catch (error) {
        console.error("Error loading topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemas();
  }, []);

  const generateLines = () => {
    if (!containerRef.current || circlesRef.current.length === 0) {
      return "";
    }

    return circlesRef.current.slice(0, -1).map((circle, index) => {
      const nextCircle = circlesRef.current[index + 1];

      if (!circle || !nextCircle) {
        return null;
      }

      const rect1 = circle.getBoundingClientRect();
      const rect2 = nextCircle.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const x1 = rect1.left + rect1.width / 2 - containerRect.left;
      const y1 = rect1.top + rect1.height / 2 - containerRect.top;
      const x2 = rect2.left + rect2.width / 2 - containerRect.left;
      const y2 = rect2.top + rect2.height / 2 - containerRect.top;

      return (
        <path
          key={index}
          d={`M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${
            (x1 + x2) / 2
          } ${y2}, ${x2} ${y2}`}
          stroke="#D1D5DB"
          strokeWidth="2"
          fill="none"
        />
      );
    });
  };

  const handleTemaClick = (temaId) => {
    navigate(`/tema/${temaId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-4 md:py-6 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4">
        <TopicIntro />

        <section className="relative bg-white py-6 md:py-12 lg:py-16 px-3 sm:px-6 lg:px-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center min-h-[240px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">
                  Ładowanie tematów...
                </p>
              </div>
            </div>
          ) : temas.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Nie ma jeszcze dostępnych tematów
              </h2>

              <p className="text-gray-600 text-sm">
                Administrator może utworzyć tematy w panelu administracyjnym.
              </p>
            </div>
          ) : (
            <div ref={containerRef} className="relative mx-auto max-w-7xl">
              <svg
                className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                {generateLines()}
              </svg>

              <TopicGrid
                temas={temas}
                circlesRef={circlesRef}
                handleTemaClick={handleTemaClick}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Temas;