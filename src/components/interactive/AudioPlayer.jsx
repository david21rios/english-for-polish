import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.65, label: "0.65x" },
  { value: 0.75, label: "0.75x" },
  { value: 0.9, label: "0.9x" },
  { value: 1, label: "1x" },
  { value: 1.1, label: "1.1x" },
  { value: 1.25, label: "1.25x" }
];

const splitTextIntoChunks = (text = "") =>
  text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const AudioPlayer = ({
  text = "",
  src = "",
  label = "Posłuchaj tekstu",
  lang = "en-GB"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [rate, setRate] = useState(0.75);

  const audioRef = useRef(null);
  const speakingRef = useRef(false);
  const rateRef = useRef(rate);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis?.getVoices?.() || []);
    };

    loadVoices();

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis?.cancel?.();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getEnglishVoice = () => {
    const preferredNames = [
      "Google UK English Female",
      "Google UK English Male",
      "Google US English",
      "Microsoft Sonia",
      "Microsoft Libby",
      "Microsoft Jenny",
      "Microsoft Aria",
      "Samantha",
      "Daniel",
      "Karen"
    ];

    return (
      voices.find(
        (voice) =>
          voice.lang?.startsWith("en") &&
          preferredNames.some((name) =>
            voice.name?.toLowerCase().includes(name.toLowerCase())
          )
      ) ||
      voices.find((voice) => voice.lang === "en-GB") ||
      voices.find((voice) => voice.lang === "en-US") ||
      voices.find((voice) => voice.lang?.startsWith("en")) ||
      null
    );
  };

  const stopAudio = () => {
    speakingRef.current = false;

    if (src && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    window.speechSynthesis?.cancel?.();
    setIsPlaying(false);
  };

  const playText = () => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const chunks = splitTextIntoChunks(text);
    const voice = getEnglishVoice();

    let currentIndex = 0;
    speakingRef.current = true;
    setIsPlaying(true);

    const speakNext = () => {
      if (!speakingRef.current || currentIndex >= chunks.length) {
        speakingRef.current = false;
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);

      utterance.lang = lang;
      utterance.voice = voice;
      utterance.rate = rateRef.current;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        currentIndex += 1;
        speakNext();
      };

      utterance.onerror = () => {
        speakingRef.current = false;
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const togglePlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (src && audioRef.current) {
      audioRef.current.playbackRate = rate;
      await audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    playText();
  };

  const handleRateChange = (event) => {
    const newRate = Number(event.target.value);

    rateRef.current = newRate;
    setRate(newRate);

    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }

    if (isPlaying && text && !src) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setIsPlaying(false);

      setTimeout(() => {
        rateRef.current = newRate;
        playText();
      }, 150);
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-100 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          title={isPlaying ? "Pauza" : "Odtwórz"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button
          type="button"
          onClick={stopAudio}
          className="p-3 rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
          title="Zatrzymaj"
        >
          <FaStop />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 break-words">
          {label}
        </p>
        <p className="text-xs text-gray-500">Język nagrania: English</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <span>Prędkość</span>
        <select
          value={rate}
          onChange={handleRateChange}
          className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

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