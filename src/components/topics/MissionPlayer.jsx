// src/components/topics/MissionPlayer.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBolt,
  FaCheckCircle,
  FaFlagCheckered,
  FaLightbulb,
  FaPaperPlane,
  FaRobot,
  FaSpinner,
  FaUser
} from "react-icons/fa";

import {
  buildLocalFallbackFeedback,
  buildLocalFallbackReply,
  evaluateMissionConversation,
  generateMissionOpening,
  generateMissionReply
} from "../../services/missionAiService";

const DEFAULT_MIN_USER_REPLIES = 3;

const validateUserMessage = (text = "") => {
  const cleanedText = text.trim().replace(/\s+/g, " ");

  const words = cleanedText
    .split(" ")
    .filter(
      (word) =>
        word.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ'-]/g, "").length > 1
    );

  const usefulCharacters = cleanedText.replace(
    /[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
    ""
  );

  const repeatedSingleLetters = /^[a-zA-Z](\s+[a-zA-Z]){1,}$/i.test(
    cleanedText
  );

  const randomShortText = usefulCharacters.length < 10;
  const tooFewWords = words.length < 3;

  if (repeatedSingleLetters || randomShortText || tooFewWords) {
    return {
      isValid: false,
      message:
        'Napisz pełniejszą odpowiedź. Użyj co najmniej 3 prawdziwych słów. Przykład: „I want to talk with my friend.”'
    };
  }

  return {
    isValid: true,
    message: ""
  };
};

const formatDifficulty = (difficulty = "easy") => {
  const labels = {
    easy: "Łatwa",
    medium: "Średnia",
    hard: "Trudna",
    adaptive: "Adaptacyjna"
  };

  return labels[difficulty] || difficulty;
};

const MissionPlayer = ({
  mission,
  userContext,
  topic,
  onBack,
  onComplete
}) => {
  const minUserReplies =
    Number(mission?.minReplies) ||
    Number(mission?.requiredReplies) ||
    DEFAULT_MIN_USER_REPLIES;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [openingLoading, setOpeningLoading] = useState(true);
  const [finishingMission, setFinishingMission] = useState(false);
  const [aiWarning, setAiWarning] = useState("");

  const chatEndRef = useRef(null);
  const openingLoadedRef = useRef(false);
  const sendingRef = useRef(false);
  const evaluatingRef = useRef(false);

  const objectives = Array.isArray(mission?.objectives)
    ? mission.objectives
    : [];

  const userMessagesCount = useMemo(
    () => messages.filter((item) => item.sender === "user").length,
    [messages]
  );

  const canFinish = userMessagesCount >= minUserReplies;

  const remainingReplies = Math.max(minUserReplies - userMessagesCount, 0);

  const progressPercent = Math.min(
    Math.round((userMessagesCount / minUserReplies) * 100),
    100
  );

  useEffect(() => {
    openingLoadedRef.current = false;
  }, [mission?.id]);

  useEffect(() => {
    const loadOpeningMessage = async () => {
      if (!mission || openingLoadedRef.current) return;

      openingLoadedRef.current = true;

      try {
        setOpeningLoading(true);
        setAiWarning("");
        setMessages([]);

        const openingText = await generateMissionOpening({
          mission,
          userContext,
          topic
        });

        setMessages([
          {
            id: `npc-opening-${Date.now()}`,
            sender: "npc",
            text: openingText
          }
        ]);
      } catch (error) {
        console.error("Error generating mission opening:", error);

        setAiWarning(
          "Sztuczna inteligencja jest chwilowo niedostępna. Użyto lokalnej wiadomości zastępczej."
        );

        setMessages([
          {
            id: `npc-opening-fallback-${Date.now()}`,
            sender: "npc",
            text: buildLocalFallbackReply()
          }
        ]);
      } finally {
        setOpeningLoading(false);
      }
    };

    loadOpeningMessage();
  }, [mission?.id, userContext, topic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages, aiLoading]);

  if (!mission) return null;

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (
      !message.trim() ||
      aiLoading ||
      openingLoading ||
      finishingMission ||
      sendingRef.current
    ) {
      return;
    }

    sendingRef.current = true;

    const validation = validateUserMessage(message);

    if (!validation.isValid) {
      setValidationMessage(validation.message);
      sendingRef.current = false;
      return;
    }

    setValidationMessage("");
    setAiWarning("");

    const userText = message.trim().replace(/\s+/g, " ");

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText
    };

    const conversationWithUserMessage = [...messages, userMessage];

    setMessages(conversationWithUserMessage);
    setMessage("");
    setAiLoading(true);

    try {
      const npcReply = await generateMissionReply({
        mission,
        userContext,
        topic,
        conversation: conversationWithUserMessage,
        userMessage: userText
      });

      const npcMessage = {
        id: `npc-${Date.now()}`,
        sender: "npc",
        text: npcReply
      };

      setMessages((prev) => [...prev, npcMessage]);
    } catch (error) {
      console.error("Error generating mission reply:", error);

      setAiWarning(
        "Nie udało się uzyskać odpowiedzi AI. Aby kontynuować misję, użyto odpowiedzi zastępczej."
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `npc-fallback-${Date.now()}`,
          sender: "npc",
          text: buildLocalFallbackReply()
        }
      ]);
    } finally {
      setAiLoading(false);
      sendingRef.current = false;
    }
  };

  const handleCompleteMission = async () => {
    if (!canFinish || finishingMission || evaluatingRef.current) return;

    evaluatingRef.current = true;

    try {
      setFinishingMission(true);
      setValidationMessage("");
      setAiWarning("");

      const fullAnswer = messages
        .filter((item) => item.sender === "user")
        .map((item) => item.text)
        .join("\n");

      let feedback;

      try {
        feedback = await evaluateMissionConversation({
          mission,
          userContext,
          topic,
          conversation: messages
        });
      } catch (error) {
        console.error("Error evaluating mission with AI:", error);

        setAiWarning(
          "Ocena AI nie powiodła się. Użyto lokalnej oceny zastępczej."
        );

        feedback = buildLocalFallbackFeedback({
          conversation: messages,
          mission
        });
      }

      if (!feedback.passed) {
        setValidationMessage(
          "Rozmowa jest jeszcze zbyt krótka, aby ukończyć misję. Spróbuj używać jaśniejszych i pełniejszych zdań."
        );
        return;
      }

      const baseXp = Number(mission.xpReward) || 10;
      const calculatedXp = Math.round(baseXp * (feedback.xpMultiplier || 0));

      onComplete({
        mission,
        answer: fullAnswer,
        conversation: messages,
        feedback,
        userContext,
        xpEarned: calculatedXp,
        completedAt: new Date().toISOString()
      });
    } finally {
      setFinishingMission(false);
      evaluatingRef.current = false;
    }
  };

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-5 md:p-8">
        <button
          type="button"
          onClick={onBack}
          disabled={aiLoading || finishingMission}
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white mb-4 md:mb-6 disabled:opacity-50"
        >
          <FaArrowLeft />
          Powrót do misji
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 md:gap-6">
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-primary-100">
              Misja konwersacyjna z AI
            </p>

            <h2 className="text-2xl md:text-4xl font-bold mt-2 leading-tight break-words">
              {mission.title}
            </h2>

            {mission.description && (
              <p className="text-sm md:text-base text-primary-50 mt-3 leading-relaxed max-w-3xl break-words">
                {mission.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3 lg:min-w-[300px]">
            <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
              <p className="text-lg md:text-2xl font-bold">
                {mission.xpReward || 10}
              </p>
              <p className="text-[10px] md:text-xs text-primary-100">XP</p>
            </div>

            <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
              <p className="text-lg md:text-2xl font-bold">
                {mission.level || "A1"}
              </p>
              <p className="text-[10px] md:text-xs text-primary-100">
                Poziom
              </p>
            </div>

            <div className="bg-white/15 border border-white/10 rounded-2xl p-3 md:p-4 text-center">
              <p className="text-lg md:text-2xl font-bold truncate">
                {formatDifficulty(mission.difficulty || "easy")}
              </p>
              <p className="text-[10px] md:text-xs text-primary-100">
                Trudność
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="bg-primary-50 rounded-2xl p-4 md:p-5 mb-5 md:mb-6 border border-primary-100">
          <div className="flex items-start gap-3">
            <FaLightbulb className="text-primary-600 mt-1 shrink-0" />

            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">Sytuacja</h3>

              <p className="text-sm md:text-base text-gray-700 mt-1 leading-relaxed break-words">
                {mission.scenario ||
                  "Odpowiadaj naturalnie, zgodnie z przedstawioną sytuacją."}
              </p>
            </div>
          </div>
        </div>

        {objectives.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Cele misji
            </h3>

            <ul className="space-y-2 text-sm text-gray-700">
              {objectives.map((objective, index) => (
                <li
                  key={objective.id || index}
                  className="flex items-start gap-2"
                >
                  <span className="text-primary-600 mt-0.5">🎯</span>
                  <span>{objective.text || objective.title || objective}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-gray-500 mt-3">
              Asystent nie będzie poprawiał Cię podczas rozmowy. Informację
              zwrotną otrzymasz po ukończeniu misji.
            </p>
          </div>
        )}

        {aiWarning && (
          <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
            {aiWarning}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 md:mb-6">
          <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
            <span className="font-medium">Postęp rozmowy</span>

            <span>
              {userMessagesCount}/{minUserReplies} odpowiedzi
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-3 md:p-6 space-y-4 min-h-[300px] max-h-[480px] overflow-y-auto border border-gray-100">
          {openingLoading ? (
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaSpinner className="animate-spin text-primary-600" />
              Przygotowywanie postaci AI...
            </div>
          ) : (
            messages.map((item) => {
              const isUser = item.sender === "user";

              return (
                <div
                  key={item.id}
                  className={`flex gap-2 md:gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <FaRobot />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] rounded-2xl px-3 md:px-4 py-3 leading-relaxed text-sm md:text-base break-words ${
                      isUser
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {item.text}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                      <FaUser />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {aiLoading && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <FaRobot />
              </div>

              <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm inline-flex items-center gap-2">
                <FaSpinner className="animate-spin text-primary-600" />
                AI pisze...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 md:mt-5">
          <div className="flex flex-col md:flex-row gap-3">
            <textarea
              rows="2"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);

                if (validationMessage) {
                  setValidationMessage("");
                }
              }}
              placeholder="Napisz odpowiedź po angielsku. Skup się na komunikacji, nie na perfekcji..."
              disabled={openingLoading || aiLoading || finishingMission}
              className="flex-1 border rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:bg-gray-100 disabled:text-gray-500"
            />

            <button
              type="submit"
              disabled={
                !message.trim() ||
                openingLoading ||
                aiLoading ||
                finishingMission
              }
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 md:px-6 py-3 font-semibold transition-colors ${
                message.trim() &&
                !openingLoading &&
                !aiLoading &&
                !finishingMission
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {aiLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane />
              )}
              Wyślij
            </button>
          </div>

          {validationMessage && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
              {validationMessage}
            </div>
          )}
        </form>

        <div className="mt-5 md:mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="text-sm text-gray-600">
            {canFinish ? (
              <span className="inline-flex items-center gap-2 text-green-700 font-medium">
                <FaCheckCircle />
                Możesz teraz ukończyć tę misję.
              </span>
            ) : (
              <span className="inline-flex items-start gap-2">
                <FaFlagCheckered className="text-primary-600 mt-0.5 shrink-0" />
                Udziel jeszcze co najmniej {remainingReplies}{" "}
                {remainingReplies === 1 ? "odpowiedzi" : "odpowiedzi"}.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCompleteMission}
            disabled={
              !canFinish ||
              openingLoading ||
              aiLoading ||
              finishingMission
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 md:px-6 py-3 font-semibold transition-colors ${
              canFinish && !openingLoading && !aiLoading && !finishingMission
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {finishingMission ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCheckCircle />
            )}

            {finishingMission ? "Ocenianie..." : "Ukończ misję"}
          </button>
        </div>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs md:text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <FaBolt className="mt-1 shrink-0" />

            <p className="leading-relaxed">
              Skup się na wykonaniu zadania. Poprawki otrzymasz dopiero w
              końcowej informacji zwrotnej, aby rozmowa była naturalna.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionPlayer;