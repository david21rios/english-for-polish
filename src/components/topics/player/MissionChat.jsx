// src/components/topics/player/MissionChat.jsx

import {
  FaRobot,
  FaSpinner,
  FaUser
} from "react-icons/fa";

const normalizeSender = (
  sender = ""
) => {
  const normalizedSender =
    String(sender)
      .trim()
      .toLowerCase();

  return normalizedSender === "user"
    ? "user"
    : "npc";
};

const MissionChat = ({
  messages = [],
  openingLoading = false,
  aiLoading = false,
  chatEndRef
}) => {
  const normalizedMessages =
    Array.isArray(messages)
      ? messages
      : [];

  return (
    <div
      className="min-h-[300px] max-h-[480px] space-y-4 overflow-y-auto rounded-3xl border border-gray-100 bg-gray-50 p-3 md:p-6"
      aria-live="polite"
      aria-busy={
        openingLoading ||
        aiLoading
      }
    >
      {openingLoading ? (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <FaSpinner className="animate-spin text-primary-600" />

          <span>
            Przygotowywanie postaci AI...
          </span>
        </div>
      ) : normalizedMessages.length ===
        0 ? (
        <div className="flex min-h-[220px] items-center justify-center text-center">
          <div>
            <FaRobot className="mx-auto text-3xl text-primary-500" />

            <p className="mt-3 text-sm text-gray-500">
              Rozmowa jeszcze się nie rozpoczęła.
            </p>
          </div>
        </div>
      ) : (
        normalizedMessages.map(
          (item, index) => {
            const isUser =
              normalizeSender(
                item?.sender
              ) === "user";

            const messageId =
              item?.id ||
              `${isUser ? "user" : "npc"}-${index}`;

            const messageText =
              String(
                item?.text || ""
              ).trim();

            if (!messageText) {
              return null;
            }

            return (
              <div
                key={messageId}
                className={`flex gap-2 md:gap-3 ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 md:h-9 md:w-9"
                    aria-hidden="true"
                  >
                    <FaRobot />
                  </div>
                )}

                <div
                  className={`max-w-[84%] break-words rounded-2xl px-3 py-3 text-sm leading-relaxed md:px-4 md:text-base ${
                    isUser
                      ? "rounded-br-sm bg-primary-600 text-white"
                      : "rounded-bl-sm border border-gray-100 bg-white text-gray-800"
                  }`}
                >
                  {messageText}
                </div>

                {isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 md:h-9 md:w-9"
                    aria-hidden="true"
                  >
                    <FaUser />
                  </div>
                )}
              </div>
            );
          }
        )
      )}

      {aiLoading && (
        <div className="flex justify-start gap-2 md:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 md:h-9 md:w-9"
            aria-hidden="true"
          >
            <FaRobot />
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500">
            <FaSpinner className="animate-spin text-primary-600" />

            <span>AI pisze...</span>
          </div>
        </div>
      )}

      <div
        ref={chatEndRef}
        aria-hidden="true"
      />
    </div>
  );
};

export default MissionChat;