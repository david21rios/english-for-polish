import React, { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaTrash,
  FaExclamationTriangle
} from "react-icons/fa";

const MIN_RECORDING_SECONDS = 5;

const getMicrophoneErrorMessage = (error) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "Twoja przeglądarka nie obsługuje nagrywania audio. Użyj aktualnej wersji Chrome, Edge lub Firefox.";
  }

  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    return "Nagrywanie audio wymaga bezpiecznego połączenia HTTPS.";
  }

  if (
    error?.name === "NotAllowedError" ||
    error?.name === "PermissionDeniedError"
  ) {
    return "Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.";
  }

  if (
    error?.name === "NotFoundError" ||
    error?.name === "DevicesNotFoundError"
  ) {
    return "Nie znaleziono mikrofonu. Podłącz mikrofon lub sprawdź ustawienia urządzenia.";
  }

  if (
    error?.name === "NotReadableError" ||
    error?.name === "TrackStartError"
  ) {
    return "Mikrofon jest zajęty albo niedostępny. Zamknij inne aplikacje używające mikrofonu.";
  }

  return "Nie udało się rozpocząć nagrywania. Sprawdź mikrofon i spróbuj ponownie.";
};

const AudioRecorder = ({ onRecordingComplete, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const streamRef = useRef(null);
  const recordingTimeRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStreamTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setErrorMessage("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MEDIA_DEVICES_NOT_SUPPORTED");
      }

      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }

      recordingTimeRef.current = 0;
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const duration = recordingTimeRef.current;

        stopStreamTracks();
        clearTimer();

        if (duration < MIN_RECORDING_SECONDS) {
          chunksRef.current = [];
          setAudioURL(null);
          setErrorMessage("Nagranie jest zbyt krótkie. Spróbuj ponownie.");
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);

        setAudioURL(url);
        audioRef.current.src = url;

        onRecordingComplete?.(audioBlob);
        onComplete?.();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);

      setIsRecording(false);
      clearTimer();
      stopStreamTracks();

      setErrorMessage(getMicrophoneErrorMessage(error));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearTimer();
  };

  const playRecording = async () => {
    if (!audioURL) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setErrorMessage("Nie można odtworzyć nagrania. Nagraj odpowiedź ponownie.");
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    setAudioURL(null);
    setIsPlaying(false);
    setErrorMessage("");
    audioRef.current.src = "";
    chunksRef.current = [];
  };

  useEffect(() => {
    const audioElement = audioRef.current;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
      clearTimer();
      stopStreamTracks();

      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {errorMessage && (
        <div className="w-full rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm flex gap-3">
          <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isRecording && !audioURL && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <FaMicrophone />
          <span>Nagraj odpowiedź</span>
        </button>
      )}

      {isRecording && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-red-500 animate-pulse font-medium">
            Nagrywanie: {formatTime(recordingTime)}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaStop />
            <span>Zatrzymaj</span>
          </button>
        </div>
      )}

      {audioURL && !isRecording && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={playRecording}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? <FaStop /> : <FaPlay />}
            <span>{isPlaying ? "Zatrzymaj" : "Odtwórz"}</span>
          </button>

          <button
            type="button"
            onClick={deleteRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaTrash />
            <span>Usuń nagranie</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;