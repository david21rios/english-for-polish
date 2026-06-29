// AudioPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const AudioPlayer = ({ text, src, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  // const speechRef = useRef(null);
  const audioRef = useRef(null);

  // Cargar voces disponibles
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Configuración de la voz en español
  const setupSpeech = () => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.lang = 'es-CO'; // Configura el idioma a español colombiano

    // Ajustes para una lectura más fluida
    speech.rate = 0.9; // Velocidad de habla (0.1 a 10)
    speech.pitch = 1; // Tono (0 a 2)
    speech.volume = 1; // Volumen fijo al máximo

    // Buscar una voz en español colombiano
    const colombianVoice = voices.find(voice =>
      voice.lang === 'es-CO' || // Primero busca voz colombiana
      voice.lang === 'es-419' || // Luego español latinoamericano
      voice.lang.startsWith('es') // Finalmente cualquier español
    );

    if (colombianVoice) {
      speech.voice = colombianVoice;
    }

    // Prevenir pausas dividiendo el texto en segmentos más pequeños
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.lang = speech.lang;
      utterance.voice = speech.voice;
      utterance.rate = speech.rate;
      utterance.pitch = speech.pitch;
      utterance.volume = speech.volume;
      return utterance;
    });
  };

  const togglePlay = () => {
    if (src) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else if (text) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      } else {
        const utterances = setupSpeech();
        let currentIndex = 0;

        const speakNext = () => {
          if (currentIndex < utterances.length) {
            const utterance = utterances[currentIndex];
            utterance.onend = () => {
              currentIndex++;
              speakNext();
            };
            window.speechSynthesis.speak(utterance);
          } else {
            setIsPlaying(false);
          }
        };

        speakNext();
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Limpia la síntesis de voz cuando el componente se desmonta
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Mostrar las voces disponibles en la consola (para debugging)
  // useEffect(() => {
  //   if (voices.length > 0) {
  //     console.log('Voces disponibles:', voices.map(voice => ({
  //       name: voice.name,
  //       lang: voice.lang
  //     })));
  //   }
  // }, [voices]);

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>

      <span className="text-sm text-gray-600">{label}</span>

      {src && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};

export default AudioPlayer;