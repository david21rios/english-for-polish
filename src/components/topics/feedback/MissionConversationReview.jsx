// src/components/topics/feedback/MissionConversationReview.jsx

import {
  FaRobot,
  FaUser
} from "react-icons/fa";

const normalizeText = (
  value = "",
  maximumLength = 2000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const normalizeSender = (
  sender = ""
) => {
  const normalizedSender =
    String(sender || "")
      .trim()
      .toLowerCase();

  if (
    normalizedSender === "user" ||
    normalizedSender ===
      "student"
  ) {
    return "user";
  }

  return "npc";
};

const normalizeConversationMessage = (
  message = {},
  index = 0
) => {
  if (
    !message ||
    typeof message !== "object" ||
    Array.isArray(message)
  ) {
    return null;
  }

  const text =
    normalizeText(
      message.text ||
        message.content ||
        message.message,
      3000
    );

  if (!text) {
    return null;
  }

  const sender =
    normalizeSender(
      message.sender ||
        message.role
    );

  return {
    id:
      normalizeText(
        message.id,
        150
      ) ||
      `${sender}_message_${index + 1}`,

    sender,

    text
  };
};

const MissionConversationReview = ({
  conversation = []
}) => {
  const normalizedConversation =
    Array.isArray(conversation)
      ? conversation
          .map(
            (
              message,
              index
            ) =>
              normalizeConversationMessage(
                message,
                index
              )
          )
          .filter(Boolean)
      : [];

  if (
    normalizedConversation.length ===
    0
  ) {
    return null;
  }

  const userMessages =
    normalizedConversation.filter(
      (message) =>
        message.sender === "user"
    ).length;

  const npcMessages =
    normalizedConversation.length -
    userMessages;

  return (
    <section className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:mt-8 md:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">
            Twoja rozmowa
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Pełny przebieg ukończonej próby misji.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary-100 px-3 py-1 font-semibold text-primary-700">
            Twoje odpowiedzi:{" "}
            {userMessages}
          </span>

          <span className="rounded-full bg-gray-200 px-3 py-1 font-semibold text-gray-700">
            Odpowiedzi AI:{" "}
            {npcMessages}
          </span>
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {normalizedConversation.map(
          (message) => {
            const isUser =
              message.sender ===
              "user";

            return (
              <article
                key={message.id}
                className={`flex items-start gap-2 md:gap-3 ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"
                    aria-hidden="true"
                  >
                    <FaRobot />
                  </div>
                )}

                <div
                  className={`max-w-[86%] rounded-2xl px-3 py-3 text-sm md:px-4 md:text-base ${
                    isUser
                      ? "rounded-br-sm bg-primary-600 text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isUser
                        ? "text-primary-100"
                        : "text-gray-500"
                    }`}
                  >
                    {isUser
                      ? "Ty"
                      : "Asystent"}
                  </p>

                  <p className="break-words leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>

                {isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600"
                    aria-hidden="true"
                  >
                    <FaUser />
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
};

export default MissionConversationReview;