// src/components/topics/player/useMissionPlayer.js

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  MISSION_LIMITS
} from "../../../services/ai/missions/missionLimits";

import {
  finalizeMission,
  generateMissionOpening,
  generateMissionReplyResult,
} from "../../../services/ai/missions/missionAiService";

import {
  buildMissionFullAnswer,
  calculateLocalMissionProgress,
  countPlayerUserMessages,
  createMissionMessageId,
  getMinimumMissionReplies,
  getMissionEvaluationMessage,
  getRemainingMissionReplies,
  validateMissionUserMessage
} from "./missionPlayerUtils";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const OPENING_REQUEST_CACHE_TTL_MS =
  30_000;

/*
|--------------------------------------------------------------------------
| Opening request deduplication
|--------------------------------------------------------------------------
|
| React StrictMode executes passive effects twice in development.
|
| A ref inside the hook is not always enough because another effect can reset
| it during the StrictMode verification cycle.
|
| This map ensures that simultaneous requests for the same mission share one
| promise instead of generating several Gemini requests.
|
*/

const openingRequestCache =
  new Map();

const getOpeningCacheKey = ({
  mission,
  topic
}) => {
  const missionId =
    String(
      mission?.id || ""
    ).trim();

  const topicId =
    String(
      topic?.id ||
        mission?.topicId ||
        mission?.themeId ||
        ""
    ).trim();

  if (!missionId) {
    return "";
  }

  return `${topicId || "topic"}::${missionId}`;
};

const getOrCreateOpeningRequest = ({
  cacheKey,
  requestFactory
}) => {
  if (!cacheKey) {
    return requestFactory();
  }

  const now =
    Date.now();

  const cachedRequest =
    openingRequestCache.get(
      cacheKey
    );

  if (
    cachedRequest &&
    now - cachedRequest.createdAt <
      OPENING_REQUEST_CACHE_TTL_MS
  ) {
    return cachedRequest.promise;
  }

  const promise =
    Promise.resolve()
      .then(requestFactory);

  openingRequestCache.set(
    cacheKey,
    {
      createdAt: now,
      promise
    }
  );

  window.setTimeout(() => {
    const currentEntry =
      openingRequestCache.get(
        cacheKey
      );

    if (
      currentEntry?.promise ===
      promise
    ) {
      openingRequestCache.delete(
        cacheKey
      );
    }
  }, OPENING_REQUEST_CACHE_TTL_MS);

  return promise;
};

/*
|--------------------------------------------------------------------------
| Warning messages
|--------------------------------------------------------------------------
*/

const AI_REPLY_WARNING =
  "Nie udało się uzyskać odpowiedzi AI. Twoja wiadomość została zachowana. Spróbuj ponownie za chwilę.";

const AI_RATE_LIMIT_WARNING =
  "Usługa AI otrzymała zbyt wiele żądań w krótkim czasie. Odczekaj kilkanaście sekund i spróbuj ponownie.";

const AI_QUOTA_WARNING =
  "Limit usługi AI został tymczasowo wyczerpany. Spróbuj ponownie później.";

const AI_MAX_TOKENS_WARNING =
  "Odpowiedź AI została przerwana przed zakończeniem. Spróbuj ponownie.";

const AI_NETWORK_WARNING =
  "Nie udało się połączyć z usługą AI. Sprawdź połączenie internetowe i spróbuj ponownie.";

const OPENING_WARNING =
  "Nie udało się w pełni połączyć z usługą AI. Rozmowa została rozpoczęta przy użyciu bezpiecznej wiadomości zastępczej.";

const STATE_WARNING =
  "Nie udało się teraz potwierdzić postępu misji. Twoja rozmowa została zachowana.";

const EVALUATION_WARNING =
  "Nie udało się przeprowadzić wiarygodnej oceny. Misja nie została zakończona i XP nie zostały przyznane.";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = "",
  maximumLength = 3000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const getErrorCode = (
  error
) => {
  return normalizeText(
    error?.code ||
      error?.errorCode ||
      error?.details?.code ||
      "",
    100
  ).toUpperCase();
};

const getErrorStatus = (
  error
) => {
  const numericStatus =
    Number(
      error?.status ||
        error?.httpStatus ||
        error?.details?.status
    );

  return Number.isFinite(
    numericStatus
  )
    ? numericStatus
    : 0;
};

const getErrorMessage = (
  error
) => {
  return normalizeText(
    error?.message ||
      error?.details?.message ||
      "",
    2000
  );
};

const getAiErrorWarning = (
  error,
  fallbackMessage
) => {
  const code =
    getErrorCode(error);

  const status =
    getErrorStatus(error);

  const message =
    getErrorMessage(
      error
    ).toUpperCase();

  if (
    code.includes(
      "MAX_TOKENS"
    ) ||
    message.includes(
      "MAX_TOKENS"
    )
  ) {
    return {
      type: "warning",
      message:
        AI_MAX_TOKENS_WARNING
    };
  }

  if (
    status === 429 ||
    code.includes(
      "RESOURCE_EXHAUSTED"
    ) ||
    code.includes(
      "RATE_LIMIT"
    ) ||
    message.includes(
      "TOO MANY REQUESTS"
    )
  ) {
    const appearsToBeQuota =
      message.includes(
        "QUOTA"
      ) ||
      message.includes(
        "EXCEEDED YOUR CURRENT QUOTA"
      ) ||
      code.includes(
        "QUOTA"
      );

    return {
      type: "warning",
      message:
        appearsToBeQuota
          ? AI_QUOTA_WARNING
          : AI_RATE_LIMIT_WARNING
    };
  }

  if (
    code.includes(
      "NETWORK"
    ) ||
    code.includes(
      "FETCH"
    ) ||
    message.includes(
      "FAILED TO FETCH"
    ) ||
    message.includes(
      "NETWORKERROR"
    )
  ) {
    return {
      type: "error",
      message:
        AI_NETWORK_WARNING
    };
  }

  return {
    type: "error",
    message:
      fallbackMessage
  };
};

const createNpcMessage = ({
  text,
  prefix = "npc"
}) => {
  return {
    id:
      createMissionMessageId(
        prefix
      ),

    sender: "npc",

    text:
      normalizeText(
        text,
        5000
      )
  };
};

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

const useMissionPlayer = ({
  mission,
  userContext,
  topic,
  onComplete
}) => {
  const [
    message,
    setMessage
  ] = useState("");

  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    validationMessage,
    setValidationMessage
  ] = useState("");

  const [
    warningMessage,
    setWarningMessage
  ] = useState("");

  const [
    warningType,
    setWarningType
  ] = useState(
    "warning"
  );

  const [
    openingLoading,
    setOpeningLoading
  ] = useState(true);

  const [
    aiLoading,
    setAiLoading
  ] = useState(false);

  const [
    finishingMission,
    setFinishingMission
  ] = useState(false);

  const [
    lastFailedUserMessage,
    setLastFailedUserMessage
  ] = useState("");

  const chatEndRef =
    useRef(null);

  /*
   * Stores the mission key for which this hook already requested an opening.
   */
  const openingMissionKeyRef =
    useRef("");

  /*
   * Prevents simultaneous student-message requests.
   */
  const sendingRef =
    useRef(false);

  /*
   * Prevents simultaneous completion requests.
   */
  const completionRef =
    useRef(false);

  /*
   * Incremented whenever the active mission changes.
   *
   * Async requests capture the current value. If the mission changes before
   * they finish, their results are ignored.
   */
  const requestGenerationRef =
    useRef(0);

  const missionId =
    normalizeText(
      mission?.id,
      200
    );

  const openingCacheKey =
    useMemo(
      () =>
        getOpeningCacheKey({
          mission,
          topic
        }),
      [
        mission,
        topic
      ]
    );

  const minimumReplies =
    useMemo(
      () =>
        getMinimumMissionReplies(
          mission
        ),
      [mission]
    );

  const userMessagesCount =
    useMemo(
      () =>
        countPlayerUserMessages(
          messages
        ),
      [messages]
    );

  const minimumReplyCountReached =
    userMessagesCount >=
    minimumReplies;

  const remainingReplies =
    useMemo(
      () =>
        getRemainingMissionReplies({
          messages,
          minimumReplies
        }),
      [
        messages,
        minimumReplies
      ]
    );

  const localProgressPercent =
    useMemo(
      () =>
        calculateLocalMissionProgress({
          messages,
          minimumReplies
        }),
      [
        messages,
        minimumReplies
      ]
    );

  const displayedProgressPercent =
    localProgressPercent;

  const interactionDisabled =
    openingLoading ||
    aiLoading ||
    finishingMission;

  /*
  |--------------------------------------------------------------------------
  | Reset when mission changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    requestGenerationRef.current +=
      1;

    openingMissionKeyRef.current =
      "";

    sendingRef.current =
      false;

    completionRef.current =
      false;

    setMessage("");
    setMessages([]);

    setValidationMessage("");
    setWarningMessage("");
    setWarningType(
      "warning"
    );

    setLastFailedUserMessage(
      ""
    );

    setOpeningLoading(
      Boolean(missionId)
    );

    setAiLoading(false);

    setFinishingMission(
      false
    );
  }, [missionId]);

  /*
  |--------------------------------------------------------------------------
  | Opening
  |--------------------------------------------------------------------------
  */

  const loadOpeningMessage =
    useCallback(async () => {
      if (
        !mission ||
        !missionId ||
        !openingCacheKey
      ) {
        setOpeningLoading(
          false
        );

        return;
      }

      /*
       * Local protection for normal rerenders.
       */
      if (
        openingMissionKeyRef.current ===
        openingCacheKey
      ) {
        return;
      }

      openingMissionKeyRef.current =
        openingCacheKey;

      const requestGeneration =
        requestGenerationRef.current;

      try {
        setOpeningLoading(
          true
        );

        setWarningMessage("");

        const openingText =
          await getOrCreateOpeningRequest({
            cacheKey:
              openingCacheKey,

            requestFactory: () =>
              generateMissionOpening({
                mission,
                userContext,
                topic
              })
          });

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return;
        }

        const normalizedOpening =
          normalizeText(
            openingText,
            5000
          );

        if (!normalizedOpening) {
          throw Object.assign(
            new Error(
              "Mission opening response was empty."
            ),
            {
              code:
                "EMPTY_MISSION_OPENING"
            }
          );
        }

        setMessages([
          createNpcMessage({
            prefix:
              "npc-opening",

            text:
              normalizedOpening
          })
        ]);
      } catch (error) {
        console.error(
          "Mission opening failed:",
          {
            code:
              error?.code,

            status:
              error?.status,

            message:
              error?.message,

            missionId
          }
        );

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return;
        }

        const warning =
          getAiErrorWarning(
            error,
            OPENING_WARNING
          );

        setWarningType(
          warning.type
        );

        setWarningMessage(
          warning.message
        );
      } finally {
        if (
          requestGeneration ===
          requestGenerationRef.current
        ) {
          setOpeningLoading(
            false
          );
        }
      }
    }, [
      mission,
      missionId,
      openingCacheKey,
      topic,
      userContext
    ]);

  useEffect(() => {
    loadOpeningMessage();
  }, [loadOpeningMessage]);

  /*
  |--------------------------------------------------------------------------
  | Automatic scrolling
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    chatEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
  }, [
    messages,
    aiLoading
  ]);

  /*
  |--------------------------------------------------------------------------
  | Generate NPC reply
  |--------------------------------------------------------------------------
  */

  const requestNpcReply =
    useCallback(
      async ({
        conversation,
        userText,
        messagePrefix
      }) => {
        const requestGeneration =
          requestGenerationRef.current;

        const result =
          await generateMissionReplyResult({
            mission,
            userContext,
            topic,

            conversation,

            userMessage:
              userText,

            allowFallback: true
          });

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return {
            ignored: true,
            appended: false
          };
        }

        const responseText =
          normalizeText(
            result?.message,
            5000
          );

        if (
          result
            ?.shouldAppendToConversation ===
            true &&
          responseText
        ) {
          setMessages(
            (currentMessages) => [
              ...currentMessages,

              createNpcMessage({
                prefix:
                  messagePrefix,

                text:
                  responseText
              })
            ]
          );

          return {
            ignored: false,
            appended: true,
            result
          };
        }

        const resultWarning =
          normalizeText(
            result?.message,
            1000
          );

        setWarningType(
          "warning"
        );

        setWarningMessage(
          resultWarning ||
            AI_REPLY_WARNING
        );

        return {
          ignored: false,
          appended: false,
          result
        };
      },
      [
        mission,
        topic,
        userContext
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  */

  const sendMissionMessage =
    useCallback(
      async (
        explicitText = null
      ) => {
        if (
          sendingRef.current ||
          interactionDisabled
        ) {
          return;
        }

        const sourceText =
          explicitText !== null
            ? explicitText
            : message;

        const validation =
          validateMissionUserMessage({
            text:
              sourceText,

            messages
          });

        if (
          !validation.isValid
        ) {
          setValidationMessage(
            validation.message
          );

          return;
        }

        sendingRef.current =
          true;

        const requestGeneration =
          requestGenerationRef.current;

        const userText =
          validation.normalizedText;

        const userMessage = {
          id:
            createMissionMessageId(
              "user"
            ),

          sender: "user",

          text: userText
        };

        const conversationWithUser =
          [
            ...messages,
            userMessage
          ];

        setValidationMessage("");
        setWarningMessage("");

        setLastFailedUserMessage(
          ""
        );

        setMessages(
          conversationWithUser
        );

        setMessage("");

        setAiLoading(true);

        try {
          const replyResult =
            await requestNpcReply({
              conversation:
                conversationWithUser,

              userText,

              messagePrefix:
                "npc"
            });

          if (
            requestGeneration !==
            requestGenerationRef.current ||
            replyResult.ignored
          ) {
            return;
          }

          if (
            !replyResult.appended
          ) {
            setLastFailedUserMessage(
              userText
            );
          }
        } catch (error) {
          console.error(
            "Mission reply failed:",
            {
              code:
                error?.code,

              status:
                error?.status,

              message:
                error?.message,

              missionId
            }
          );

          if (
            requestGeneration !==
            requestGenerationRef.current
          ) {
            return;
          }

          setLastFailedUserMessage(
            userText
          );

          const warning =
            getAiErrorWarning(
              error,
              AI_REPLY_WARNING
            );

          setWarningType(
            warning.type
          );

          setWarningMessage(
            warning.message
          );
        } finally {
          if (
            requestGeneration ===
            requestGenerationRef.current
          ) {
            setAiLoading(
              false
            );
          }

          sendingRef.current =
            false;
        }
      },
      [
        interactionDisabled,
        message,
        messages,
        missionId,
        requestNpcReply
      ]
    );

  const handleSubmitMessage =
    useCallback(
      async (event) => {
        event?.preventDefault?.();

        await sendMissionMessage();
      },
      [sendMissionMessage]
    );

  /*
  |--------------------------------------------------------------------------
  | Retry last user message
  |--------------------------------------------------------------------------
  */

  const retryLastMessage =
    useCallback(async () => {
      if (
        !lastFailedUserMessage ||
        interactionDisabled ||
        sendingRef.current
      ) {
        return;
      }

      sendingRef.current =
        true;

      const requestGeneration =
        requestGenerationRef.current;

      setWarningMessage("");
      setAiLoading(true);

      try {
        const replyResult =
          await requestNpcReply({
            conversation:
              messages,

            userText:
              lastFailedUserMessage,

            messagePrefix:
              "npc-retry"
          });

        if (
          requestGeneration !==
          requestGenerationRef.current ||
          replyResult.ignored
        ) {
          return;
        }

        if (
          replyResult.appended
        ) {
          setLastFailedUserMessage(
            ""
          );
        }
      } catch (error) {
        console.error(
          "Mission reply retry failed:",
          {
            code:
              error?.code,

            status:
              error?.status,

            message:
              error?.message,

            missionId
          }
        );

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return;
        }

        const warning =
          getAiErrorWarning(
            error,
            AI_REPLY_WARNING
          );

        setWarningType(
          warning.type
        );

        setWarningMessage(
          warning.message
        );
      } finally {
        if (
          requestGeneration ===
          requestGenerationRef.current
        ) {
          setAiLoading(
            false
          );
        }

        sendingRef.current =
          false;
      }
    }, [
      interactionDisabled,
      lastFailedUserMessage,
      messages,
      missionId,
      requestNpcReply
    ]);

  /*
  |--------------------------------------------------------------------------
  | Completion
  |--------------------------------------------------------------------------
  */

  const handleCompleteMission =
    useCallback(async () => {
      if (
        !minimumReplyCountReached ||
        completionRef.current ||
        interactionDisabled
      ) {
        return;
      }

      completionRef.current =
        true;

      const requestGeneration =
        requestGenerationRef.current;

      setValidationMessage("");
      setWarningMessage("");

      setFinishingMission(
        true
      );

      try {
        const evaluation =
          await finalizeMission({
            mission,
            userContext,
            topic,

            conversation:
              messages,

            missionState:
              null,

            repeatedCompletion:
              mission?.completed ===
              true,

            allowFallback:
              true
          });

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return;
        }

        if (
          evaluation?.isFinal !==
            true ||
          evaluation?.requiresReview ===
            true ||
          evaluation?.isFallback ===
            true
        ) {
          setWarningType(
            evaluation
              ?.isFallback === true
              ? "warning"
              : "info"
          );

          setWarningMessage(
            getMissionEvaluationMessage(
              evaluation
            ) ||
              EVALUATION_WARNING
          );

          return;
        }

        if (
          evaluation?.passed !== true
        ) {
          setValidationMessage(
            getMissionEvaluationMessage(
              evaluation
            ) ||
              "Misja nie została jeszcze ukończona. Kontynuuj rozmowę i spróbuj ponownie."
          );

          return;
        }

        const fullAnswer =
          buildMissionFullAnswer(
            messages
          );

        if (
          typeof onComplete ===
          "function"
        ) {
          await onComplete({
            mission,

            answer:
              fullAnswer,

            conversation:
              messages,

            feedback:
              evaluation,

            userContext,

            xpEarned:
              Number(
                evaluation
                  ?.xpAwarded
              ) || 0,

            completedAt:
              new Date()
                .toISOString()
          });
        }
      } catch (error) {
        console.error(
          "Mission completion failed:",
          {
            code:
              error?.code,

            status:
              error?.status,

            message:
              error?.message,

            missionId
          }
        );

        if (
          requestGeneration !==
          requestGenerationRef.current
        ) {
          return;
        }

        const warning =
          getAiErrorWarning(
            error,
            EVALUATION_WARNING
          );

        setWarningType(
          warning.type
        );

        setWarningMessage(
          warning.message
        );
      } finally {
        if (
          requestGeneration ===
          requestGenerationRef.current
        ) {
          setFinishingMission(
            false
          );
        }

        completionRef.current =
          false;
      }
    }, [
      interactionDisabled,
      messages,
      minimumReplyCountReached,
      mission,
      missionId,
      onComplete,
      topic,
      userContext
    ]);

  /*
  |--------------------------------------------------------------------------
  | Public hook API
  |--------------------------------------------------------------------------
  */

  return {
    message,
    setMessage,

    messages,

    validationMessage,
    setValidationMessage,

    warningMessage,
    warningType,

    dismissWarning: () =>
      setWarningMessage(""),

    retryLastMessage,

    openingLoading,
    aiLoading,
    finishingMission,

    minimumReplies,
    userMessagesCount,
    minimumReplyCountReached,
    remainingReplies,

    progressPercent:
      displayedProgressPercent,

    maximumMessageCharacters:
      MISSION_LIMITS
        .message
        .maxCharacters,

    interactionDisabled,

    chatEndRef,

    handleSubmitMessage,
    handleCompleteMission
  };
};

export default useMissionPlayer;