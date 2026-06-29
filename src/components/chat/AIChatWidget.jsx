// src/components/chat/AIChatWidget.jsx

import { useState } from "react";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import { sendAIMessage } from "../../services/ai/aiService";

const AIChatWidget = ({
  context = "",
  mode = "language_tutor",
  title = "AI Tutor",
  currentLevel = "A1-A2",
  targetLanguage = "Spanish",
  baseLanguage = "English",
  lessonTitle = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am your AI tutor. Ask me about vocabulary, grammar, translation or practice."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (event) => {
    event?.preventDefault();

    const cleanMessage = input.trim();

    if (!cleanMessage || loading) return;

    const userMessage = {
      role: "user",
      text: cleanMessage
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const aiResponse = await sendAIMessage({
        userMessage: cleanMessage,
        context,
        mode,
        currentLevel,
        targetLanguage,
        baseLanguage,
        lessonTitle
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: aiResponse
        }
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Sorry, I could not connect with the AI tutor right now. Please try again in a few minutes."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[90] bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-2xl transition"
          aria-label="Open AI tutor"
        >
          <FaRobot />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[90] w-[92vw] max-w-md h-[620px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          <header className="bg-primary-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <FaRobot className="text-2xl" />

              <div>
                <h2 className="font-bold text-lg">{title}</h2>
                <p className="text-xs text-primary-100">
                  {targetLanguage} tutor · Level {currentLevel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
              aria-label="Close AI tutor"
            >
              <FaTimes />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-800 border border-gray-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500 shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="border-t bg-white p-4 shrink-0"
          >
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows="2"
                maxLength={1000}
                placeholder="Ask your AI tutor..."
                className="flex-1 min-h-[58px] max-h-[120px] border border-gray-300 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Enter para enviar. Shift + Enter para nueva línea.
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;