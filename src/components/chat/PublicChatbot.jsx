// src/components/chat/PublicChatbot.jsx

import { useState } from "react";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import {
  getPublicChatbotInitialMessage,
  getPublicChatbotAIResponse
} from "../../services/chatbotService";

const PublicChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: getPublicChatbotInitialMessage()
    }
  ]);

  const handleSend = async (event) => {
    event.preventDefault();

    const cleanMessage = inputMessage.trim();

    if (!cleanMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: cleanMessage
      }
    ]);

    setInputMessage("");
    setLoading(true);

    try {
      const botResponse = await getPublicChatbotAIResponse(cleanMessage);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botResponse.answer,
          intent: botResponse.intent,
          source: botResponse.source
        }
      ]);
    } catch (error) {
      console.error("Public chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I could not answer right now. Please try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden origin-bottom-right">
          <div className="bg-primary-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaRobot />

              <div>
                <h3 className="font-bold">App Assistant</h3>
                <p className="text-xs text-primary-100">
                  Public guidance assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/90 hover:text-white"
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((message, index) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={`${message.sender}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-white text-gray-700 border border-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl px-4 py-3 text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                placeholder="Ask about the app..."
                disabled={loading}
                className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className={`px-4 rounded-xl ${
                  inputMessage.trim() && !loading
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-16 h-16 rounded-full bg-primary-600 text-white shadow-xl flex items-center justify-center text-2xl hover:bg-primary-700 transition-transform hover:scale-105"
        aria-label="Open chat assistant"
      >
        <FaRobot />
      </button>
    </div>
  );
};

export default PublicChatbot;