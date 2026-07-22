// src/services/ai/geminiProvider.js

const DEFAULT_MODEL =
  "gemini-2.5-flash";

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 3000;
const DEFAULT_REQUEST_TIMEOUT = 45000;

const MAX_RETRY_DELAY = 65000;

let geminiAuditRequestSequence = 0;

const GEMINI_API_KEY = String(
  import.meta.env.VITE_GEMINI_API_KEY ||
    ""
).trim();

const GEMINI_MODEL = String(
  import.meta.env.VITE_GEMINI_MODEL ||
    DEFAULT_MODEL
).trim();

/*
|--------------------------------------------------------------------------
| Environment configuration
|--------------------------------------------------------------------------
*/

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsedValue =
    Number.parseInt(
      value,
      10
    );

  return (
    Number.isFinite(
      parsedValue
    ) &&
    parsedValue > 0
  )
    ? parsedValue
    : fallback;
};

const MAX_RETRIES =
  parsePositiveInteger(
    import.meta.env
      .VITE_GEMINI_MAX_RETRIES,
    DEFAULT_MAX_RETRIES
  );

const RETRY_DELAY =
  parsePositiveInteger(
    import.meta.env
      .VITE_GEMINI_RETRY_DELAY,
    DEFAULT_RETRY_DELAY
  );

const REQUEST_TIMEOUT =
  parsePositiveInteger(
    import.meta.env
      .VITE_GEMINI_TIMEOUT,
    DEFAULT_REQUEST_TIMEOUT
  );

/*
|--------------------------------------------------------------------------
| Retry configuration
|--------------------------------------------------------------------------
*/

const RETRYABLE_STATUS_CODES =
  new Set([
    408,
    425,
    429,
    500,
    502,
    503,
    504
  ]);

const SUCCESS_FINISH_REASONS =
  new Set([
    "",
    "STOP"
  ]);

const NON_RETRYABLE_FINISH_REASONS =
  new Set([
    "MAX_TOKENS",
    "SAFETY",
    "RECITATION",
    "LANGUAGE",
    "BLOCKLIST",
    "PROHIBITED_CONTENT",
    "SPII",
    "MALFORMED_FUNCTION_CALL",
    "IMAGE_SAFETY",
    "IMAGE_PROHIBITED_CONTENT"
  ]);

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = ""
) => {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim();
};

const clampNumber = ({
  value,
  minimum,
  maximum,
  fallback
}) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      numericValue
    )
  );
};

const parseThinkingBudget = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    Number(value);

  if (
    !Number.isInteger(
      numericValue
    )
  ) {
    return null;
  }

  return Math.max(
    -1,
    numericValue
  );
};

const wait = (
  milliseconds
) => {
  return new Promise(
    (resolve) => {
      globalThis.setTimeout(
        resolve,
        Math.max(
          Number(
            milliseconds
          ) || 0,
          0
        )
      );
    }
  );
};

const shouldSkipAutomaticRetry = (
  error
) => {
  return (
    Number(error?.status) ===
      429 ||
    String(
      error?.code || ""
    ).toUpperCase() ===
      "RESOURCE_EXHAUSTED"
  );
};

const normalizeAuditContext = (
  auditContext = {}
) => {
  const normalizeCount = (value) => {
    const count = Number(value);

    return Number.isFinite(count)
      ? Math.max(0, Math.round(count))
      : null;
  };

  return {
    operation:
      String(
        auditContext?.operation ||
          "unknown"
      ).trim().slice(0, 80) ||
      "unknown",
    missionId:
      String(
        auditContext?.missionId || ""
      ).trim().slice(0, 150) ||
      null,
    conversationMessageCount:
      normalizeCount(
        auditContext
          ?.conversationMessageCount
      ),
    userMessageCount:
      normalizeCount(
        auditContext?.userMessageCount
      )
  };
};

/*
|--------------------------------------------------------------------------
| Gemini endpoint
|--------------------------------------------------------------------------
*/

const buildGeminiApiUrl =
  () => {
    const encodedModel =
      encodeURIComponent(
        GEMINI_MODEL
      );

    const queryParameters =
      new URLSearchParams({
        key:
          GEMINI_API_KEY
      });

    return (
      "https://generativelanguage.googleapis.com/" +
      `v1beta/models/${encodedModel}:generateContent?` +
      queryParameters.toString()
    );
  };

/*
|--------------------------------------------------------------------------
| Retry delay
|--------------------------------------------------------------------------
*/

const parseRetryAfter = (
  retryAfterHeader
) => {
  if (!retryAfterHeader) {
    return null;
  }

  const retryAfterSeconds =
    Number(
      retryAfterHeader
    );

  if (
    Number.isFinite(
      retryAfterSeconds
    ) &&
    retryAfterSeconds >= 0
  ) {
    return (
      retryAfterSeconds *
      1000
    );
  }

  const retryDateMilliseconds =
    Date.parse(
      retryAfterHeader
    );

  if (
    Number.isFinite(
      retryDateMilliseconds
    )
  ) {
    return Math.max(
      retryDateMilliseconds -
        Date.now(),
      0
    );
  }

  return null;
};

const parseRetryDelayFromMessage = (
  message = ""
) => {
  const normalizedMessage =
    normalizeText(
      message
    );

  const match =
    normalizedMessage.match(
      /retry\s+in\s+([\d.]+)\s*s/i
    );

  if (!match) {
    return null;
  }

  const seconds =
    Number(match[1]);

  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds < 0
  ) {
    return null;
  }

  return Math.ceil(
    seconds * 1000
  );
};

const getRetryDelay = ({
  attempt,
  retryAfterHeader = null,
  errorMessage = ""
}) => {
  const retryAfterMilliseconds =
    parseRetryAfter(
      retryAfterHeader
    );

  if (
    retryAfterMilliseconds !==
    null
  ) {
    return Math.min(
      retryAfterMilliseconds,
      MAX_RETRY_DELAY
    );
  }

  const messageRetryDelay =
    parseRetryDelayFromMessage(
      errorMessage
    );

  if (
    messageRetryDelay !==
    null
  ) {
    return Math.min(
      messageRetryDelay,
      MAX_RETRY_DELAY
    );
  }

  const exponentialDelay =
    RETRY_DELAY *
    2 **
      Math.max(
        attempt - 1,
        0
      );

  const jitter =
    Math.floor(
      Math.random() * 500
    );

  return Math.min(
    exponentialDelay +
      jitter,
    MAX_RETRY_DELAY
  );
};

/*
|--------------------------------------------------------------------------
| Gemini response helpers
|--------------------------------------------------------------------------
*/

const extractGeminiText = (
  data = {}
) => {
  const candidate =
    data?.candidates?.[0];

  const parts =
    candidate?.content
      ?.parts;

  if (
    !Array.isArray(parts)
  ) {
    return "";
  }

  return parts
    .map((part) => {
      return typeof part
        ?.text === "string"
        ? part.text
        : "";
    })
    .join("")
    .trim();
};

const getFinishReason = (
  data = {}
) => {
  return String(
    data?.candidates?.[0]
      ?.finishReason || ""
  ).trim();
};

const getPromptBlockReason = (
  data = {}
) => {
  return String(
    data?.promptFeedback
      ?.blockReason || ""
  ).trim();
};

const getSafetyRatings = (
  data = {}
) => {
  const ratings =
    data?.candidates?.[0]
      ?.safetyRatings;

  return Array.isArray(
    ratings
  )
    ? ratings
    : [];
};

const getUsageMetadata = (
  data = {}
) => {
  const usageMetadata =
    data?.usageMetadata;

  if (
    !usageMetadata ||
    typeof usageMetadata !==
      "object"
  ) {
    return null;
  }

  return {
    promptTokenCount:
      Number(
        usageMetadata
          .promptTokenCount
      ) || 0,

    candidatesTokenCount:
      Number(
        usageMetadata
          .candidatesTokenCount
      ) || 0,

    thoughtsTokenCount:
      Number(
        usageMetadata
          .thoughtsTokenCount
      ) || 0,

    totalTokenCount:
      Number(
        usageMetadata
          .totalTokenCount
      ) || 0
  };
};

/*
|--------------------------------------------------------------------------
| Request construction
|--------------------------------------------------------------------------
*/

const buildUserContentText = ({
  context = "",
  userMessage = ""
}) => {
  const normalizedContext =
    normalizeText(
      context
    );

  const normalizedUserMessage =
    normalizeText(
      userMessage
    );

  return [
    normalizedContext
      ? `Context:\n${normalizedContext}`
      : "",

    `User request:\n${normalizedUserMessage}`
  ]
    .filter(Boolean)
    .join("\n\n");
};

const buildGenerationConfig = ({
  forceJson = false,
  temperature = null,
  topP = null,
  maxOutputTokens = null,
  thinkingBudget = null
}) => {
  const generationConfig = {
    temperature:
      clampNumber({
        value:
          temperature,

        minimum: 0,
        maximum: 2,

        fallback:
          forceJson
            ? 0.1
            : 0.7
      }),

    topP:
      clampNumber({
        value:
          topP,

        minimum: 0,
        maximum: 1,

        fallback:
          forceJson
            ? 0.8
            : 0.9
      }),

    maxOutputTokens:
      parsePositiveInteger(
        maxOutputTokens,
        forceJson
          ? 30000
          : 3000
      )
  };

  const normalizedThinkingBudget =
    parseThinkingBudget(
      thinkingBudget
    );

  if (
    normalizedThinkingBudget !==
    null
  ) {
    generationConfig.thinkingConfig = {
      thinkingBudget:
        normalizedThinkingBudget
    };
  }

  if (forceJson) {
    generationConfig.responseMimeType =
      "application/json";
  }

  return generationConfig;
};

const buildRequestBody = ({
  systemInstruction = "",
  userMessage = "",
  context = "",
  generationConfig
}) => {
  const normalizedSystemInstruction =
    normalizeText(
      systemInstruction
    );

  const userContentText =
    buildUserContentText({
      context,
      userMessage
    });

  const requestBody = {
    contents: [
      {
        role: "user",

        parts: [
          {
            text:
              userContentText
          }
        ]
      }
    ],

    generationConfig
  };

  if (
    normalizedSystemInstruction
  ) {
    requestBody.systemInstruction = {
      role: "system",

      parts: [
        {
          text:
            normalizedSystemInstruction
        }
      ]
    };
  }

  return requestBody;
};

/*
|--------------------------------------------------------------------------
| Fetch
|--------------------------------------------------------------------------
*/

const fetchWithTimeout =
  async (
    url,
    options,
    timeout =
      REQUEST_TIMEOUT
  ) => {
    const controller =
      new AbortController();

    const timeoutId =
      globalThis.setTimeout(
        () => {
          controller.abort();
        },
        timeout
      );

    try {
      return await fetch(
        url,
        {
          ...options,

          signal:
            controller.signal
        }
      );
    } finally {
      globalThis.clearTimeout(
        timeoutId
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Provider errors
|--------------------------------------------------------------------------
*/

const buildProviderError = ({
  message,
  status = null,
  code = "",
  retryable = false,
  details = null,
  retryAfterMs = null
}) => {
  const error =
    new Error(message);

  error.name =
    "GeminiProviderError";

  error.provider =
    "gemini";

  error.status =
    status;

  error.code =
    code;

  error.retryable =
    retryable;

  error.details =
    details;

  error.retryAfterMs =
    retryAfterMs;

  return error;
};

const parseErrorResponse =
  async (
    response
  ) => {
    const rawText =
      await response
        .text()
        .catch(() => "");

    let errorData =
      null;

    if (rawText) {
      try {
        errorData =
          JSON.parse(
            rawText
          );
      } catch {
        errorData = {
          rawResponse:
            rawText
        };
      }
    }

    const status =
      response.status;

    const message =
      errorData?.error
        ?.message ||
      `Gemini API error: ${status}`;

    const code =
      errorData?.error
        ?.status ||
      `HTTP_${status}`;

    const retryAfterHeader =
      response.headers.get(
        "Retry-After"
      );

    const retryAfterMs =
      parseRetryAfter(
        retryAfterHeader
      ) ??
      parseRetryDelayFromMessage(
        message
      );

    return buildProviderError({
      message,
      status,
      code,

      retryable:
        RETRYABLE_STATUS_CODES.has(
          status
        ),

      retryAfterMs,

      details:
        errorData
    });
  };

/*
|--------------------------------------------------------------------------
| Successful response validation
|--------------------------------------------------------------------------
*/

const validateSuccessfulResponse = ({
  data,
  responseStatus,
  forceJson
}) => {
  const blockReason =
    getPromptBlockReason(
      data
    );

  if (blockReason) {
    throw buildProviderError({
      message:
        `Gemini blocked the prompt: ${blockReason}.`,

      status:
        responseStatus,

      code:
        "PROMPT_BLOCKED",

      retryable:
        false,

      details: {
        blockReason,

        promptFeedback:
          data?.promptFeedback ||
          null
      }
    });
  }

  const responseText =
    extractGeminiText(
      data
    );

  const finishReason =
    getFinishReason(
      data
    );

  const usageMetadata =
    getUsageMetadata(
      data
    );

  if (!responseText) {
    throw buildProviderError({
      message:
        "Gemini returned an empty response.",

      status:
        responseStatus,

      code:
        finishReason
          ? `FINISH_REASON_${finishReason}`
          : "EMPTY_RESPONSE",

      retryable:
        false,

      details: {
        finishReason,

        safetyRatings:
          getSafetyRatings(
            data
          ),

        usageMetadata
      }
    });
  }

  if (
    finishReason &&
    !SUCCESS_FINISH_REASONS.has(
      finishReason
    )
  ) {
    throw buildProviderError({
      message:
        `Gemini response ended with finish reason: ${finishReason}.`,

      status:
        responseStatus,

      code:
        `FINISH_REASON_${finishReason}`,

      /*
       * Repeating the same request does not fix a token ceiling,
       * safety block or malformed output.
       */
      retryable:
        !NON_RETRYABLE_FINISH_REASONS.has(
          finishReason
        ),

      details: {
        finishReason,

        safetyRatings:
          getSafetyRatings(
            data
          ),

        usageMetadata,

        partialResponse:
          responseText
      }
    });
  }

  if (forceJson) {
    try {
      JSON.parse(
        responseText
      );
    } catch (error) {
      throw buildProviderError({
        message:
          "Gemini returned invalid JSON.",

        status:
          responseStatus,

        code:
          "INVALID_JSON_RESPONSE",

        retryable:
          false,

        details: {
          finishReason,

          parseError:
            error instanceof
              Error
              ? error.message
              : String(error),

          responsePreview:
            responseText.slice(
              0,
              1000
            ),

          usageMetadata
        }
      });
    }
  }

  return responseText;
};

/*
|--------------------------------------------------------------------------
| Error normalization
|--------------------------------------------------------------------------
*/

const normalizeRequestError = (
  error
) => {
  if (
    error?.name ===
    "AbortError"
  ) {
    return buildProviderError({
      message:
        "Gemini request timed out.",

      code:
        "REQUEST_TIMEOUT",

      retryable:
        true
    });
  }

  if (
    error?.name ===
    "GeminiProviderError"
  ) {
    return error;
  }

  return buildProviderError({
    message:
      error instanceof Error
        ? error.message
        : String(error),

    code:
      "NETWORK_OR_RUNTIME_ERROR",

    retryable:
      true,

    details:
      error
  });
};

/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
*/

export const sendGeminiMessage =
  async ({
    systemInstruction = "",
    userMessage = "",
    context = "",
    forceJson = false,
    temperature = null,
    topP = null,
    maxOutputTokens = null,
    thinkingBudget = null,
    auditContext = {}
  } = {}) => {
    if (!GEMINI_API_KEY) {
      throw buildProviderError({
        message:
          "Gemini API key is not configured.",

        code:
          "MISSING_API_KEY",

        retryable:
          false
      });
    }

    if (!GEMINI_MODEL) {
      throw buildProviderError({
        message:
          "Gemini model is not configured.",

        code:
          "MISSING_MODEL",

        retryable:
          false
      });
    }

    const normalizedUserMessage =
      normalizeText(
        userMessage
      );

    if (
      !normalizedUserMessage
    ) {
      throw buildProviderError({
        message:
          "Gemini user message is empty.",

        code:
          "EMPTY_MESSAGE",

        retryable:
          false
      });
    }

    const generationConfig =
      buildGenerationConfig({
        forceJson:
          Boolean(forceJson),

        temperature,
        topP,
        maxOutputTokens,
        thinkingBudget
      });

    const requestBody =
      buildRequestBody({
        systemInstruction,

        userMessage:
          normalizedUserMessage,

        context,
        generationConfig
      });

    let lastError =
      null;

    for (
      let attempt = 1;
      attempt <= MAX_RETRIES;
      attempt += 1
    ) {
      geminiAuditRequestSequence += 1;

      const requestId =
        `gemini-${geminiAuditRequestSequence}`;
      const requestStartedAt =
        Date.now();
      const normalizedAuditContext =
        normalizeAuditContext(
          auditContext
        );

      console.info(
        "[GeminiAudit] request-start",
        {
          requestId,
          ...normalizedAuditContext,
          model: GEMINI_MODEL,
          timestamp:
            new Date(
              requestStartedAt
            ).toISOString(),
          attempt
        }
      );

      try {
        const response =
          await fetchWithTimeout(
            buildGeminiApiUrl(),

            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json"
              },

              body:
                JSON.stringify(
                  requestBody
                )
            }
          );

        if (!response.ok) {
          const providerError =
            await parseErrorResponse(
              response
            );

          lastError =
            providerError;

          console.info(
            "[GeminiAudit] request-failure",
            {
              requestId,
              operation:
                normalizedAuditContext
                  .operation,
              status:
                providerError.status,
              code:
                providerError.code,
              durationMs:
                Date.now() -
                requestStartedAt,
              attempt
            }
          );

          providerError.auditLogged =
            true;

          console.error(
            "Gemini API error:",
            {
              status:
                providerError
                  .status,

              code:
                providerError
                  .code,

              attempt,

              retryable:
                providerError
                  .retryable,

              retryAfterMs:
                providerError
                  .retryAfterMs,

              details:
                providerError
                  .details
            }
          );

          if (
            shouldSkipAutomaticRetry(
              providerError
            ) ||
            !providerError
              .retryable ||
            attempt ===
              MAX_RETRIES
          ) {
            throw providerError;
          }

          const delay =
            providerError
              .retryAfterMs ??
            getRetryDelay({
              attempt,

              errorMessage:
                providerError
                  .message
            });

          await wait(delay);

          continue;
        }

        const data =
          await response.json();

        const responseText =
          validateSuccessfulResponse({
            data,

            responseStatus:
              response.status,

            forceJson:
              Boolean(
                forceJson
              )
          });

        console.info(
          "[GeminiAudit] request-success",
          {
            requestId,
            operation:
              normalizedAuditContext
                .operation,
            status:
              response.status,
            durationMs:
              Date.now() -
              requestStartedAt,
            attempt
          }
        );

        return responseText;
      } catch (error) {
        const normalizedError =
          normalizeRequestError(
            error
          );

        lastError =
          normalizedError;

        if (
          normalizedError
            .auditLogged !== true
        ) {
          console.info(
            "[GeminiAudit] request-failure",
            {
              requestId,
              operation:
                normalizedAuditContext
                  .operation,
              status:
                normalizedError.status,
              code:
                normalizedError.code,
              durationMs:
                Date.now() -
                requestStartedAt,
              attempt
            }
          );
        }

        console.error(
          "Gemini request failed:",
          {
            attempt,

            code:
              normalizedError
                .code,

            message:
              normalizedError
                .message,

            retryable:
              normalizedError
                .retryable,

            retryAfterMs:
              normalizedError
                .retryAfterMs,

            usageMetadata:
              normalizedError
                ?.details
                ?.usageMetadata ||
              null
          }
        );

        if (
          shouldSkipAutomaticRetry(
            normalizedError
          ) ||
          attempt ===
            MAX_RETRIES ||
          normalizedError
            .retryable ===
            false
        ) {
          break;
        }

        const delay =
          normalizedError
            .retryAfterMs ??
          getRetryDelay({
            attempt,

            errorMessage:
              normalizedError
                .message
          });

        await wait(delay);
      }
    }

    throw (
      lastError ||
      buildProviderError({
        message:
          "Gemini is temporarily unavailable.",

        code:
          "SERVICE_UNAVAILABLE",

        retryable:
          true
      })
    );
  };

export const getGeminiConfiguration =
  () => {
    return {
      model:
        GEMINI_MODEL,

      maxRetries:
        MAX_RETRIES,

      retryDelay:
        RETRY_DELAY,

      requestTimeout:
        REQUEST_TIMEOUT,

      apiKeyConfigured:
        Boolean(
          GEMINI_API_KEY
        )
    };
  };

const geminiProvider = {
  sendGeminiMessage,
  getGeminiConfiguration
};

export default geminiProvider;
