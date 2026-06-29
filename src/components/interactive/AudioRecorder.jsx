import React, { useState, useRef, useEffect } from "react";
import {
  FaMicrophone,
  FaStop,
  FaPlay,
  FaTrash,
  FaExclamationTriangle
} from "react-icons/fa";

const getMicrophoneErrorMessage = (error) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "Tu navegador no permite grabar audio desde esta página. Prueba con Chrome, Edge o Firefox actualizado.";
  }

  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    return "La grabación de audio requiere una conexión segura HTTPS. Abre la aplicación desde una dirección segura.";
  }

  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "No se pudo acceder al micrófono porque el permiso fue denegado. Revisa si aceptaste el uso del micrófono en el navegador.";
  }

  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No se encontró un micrófono disponible. Conecta un micrófono o revisa la configuración de audio del dispositivo.";
  }

  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "El micrófono está ocupado o no se puede usar en este momento. Cierra otras aplicaciones que puedan estar usando el micrófono.";
  }

  return "No se pudo iniciar la grabación. Revisa los permisos del micrófono e intenta nuevamente.";
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
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);

        setAudioURL(url);
        audioRef.current.src = url;

        stopStreamTracks();
        clearTimer();

        onRecordingComplete?.(audioBlob);
        onComplete?.();
      };

      mediaRecorderRef.current.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearTimer();
    }
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
      setErrorMessage("No se pudo reproducir la grabación. Intenta grabar nuevamente.");
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
          <span>Grabar</span>
        </button>
      )}

      {isRecording && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-red-500 animate-pulse font-medium">
            Grabando: {formatTime(recordingTime)}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaStop />
            <span>Detener</span>
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
            <span>{isPlaying ? "Detener" : "Reproducir"}</span>
          </button>

          <button
            type="button"
            onClick={deleteRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaTrash />
            <span>Eliminar</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;