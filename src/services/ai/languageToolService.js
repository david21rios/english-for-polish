// src/services/languageToolService.js

const LANGUAGE_TOOL_API_URL =
  import.meta.env.VITE_LANGUAGE_TOOL_API_URL ||
  "https://api.languagetool.org/v2/check";

const REQUESTS_LIMIT = Number.parseInt(
  import.meta.env.VITE_API_REQUESTS_LIMIT || "20",
  10
);

const TIME_WINDOW = Number.parseInt(
  import.meta.env.VITE_API_TIME_WINDOW || "60000",
  10
);

const MAX_TEXT_LENGTH = Number.parseInt(
  import.meta.env.VITE_MAX_TEXT_LENGTH || "20000",
  10
);

const CACHE_DURATION = Number.parseInt(
  import.meta.env.VITE_CACHE_DURATION || "3600000",
  10
);

const MAX_RETRIES = Number.parseInt(
  import.meta.env.VITE_LANGUAGE_TOOL_MAX_RETRIES || "3",
  10
);

const RETRY_DELAY = Number.parseInt(
  import.meta.env.VITE_LANGUAGE_TOOL_RETRY_DELAY || "1000",
  10
);

const REQUEST_TIMEOUT = Number.parseInt(
  import.meta.env.VITE_LANGUAGE_TOOL_TIMEOUT || "12000",
  10
);

const MAX_CACHE_SIZE = Number.parseInt(
  import.meta.env.VITE_LANGUAGE_TOOL_MAX_CACHE_SIZE || "100",
  10
);

const DEFAULT_LANGUAGE =
  import.meta.env.VITE_LANGUAGE_TOOL_DEFAULT_LANGUAGE || "en-US";

const PASSING_SCORE = Number.parseInt(
  import.meta.env.VITE_LANGUAGE_TOOL_PASSING_SCORE || "70",
  10
);

let requestCount = 0;
let requestWindowStartedAt = Date.now();

const textCache = new Map();

const wait = (milliseconds) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const clampScore = (score) =>
  Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

const countWords = (text = "") =>
  String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const normalizeLanguage = (language = DEFAULT_LANGUAGE) => {
  const normalizedLanguage = String(language || DEFAULT_LANGUAGE).trim();

  return normalizedLanguage || DEFAULT_LANGUAGE;
};

const normalizeText = (text = "") =>
  String(text)
    .replace(/\r\n/g, "\n")
    .trim();

const createCacheKey = (text, language) =>
  `${language}::${text}`;

const buildUnavailableResult = ({
  error,
  text = "",
  language = DEFAULT_LANGUAGE,
  reason = "service_unavailable"
}) => ({
  status: "unavailable",
  provider: "languageTool",
  language,
  isValid: false,
  score: null,
  errorCount: null,
  details: [],
  textLength: countWords(text),
  words: normalizeText(text)
    .split(/\s+/)
    .filter(Boolean),
  error:
    error instanceof Error
      ? error.message
      : String(error || "LanguageTool service unavailable."),
  reason,
  isDefaultValue: false,
  timestamp: Date.now()
});

class CacheManager {
  static cleanup() {
    const now = Date.now();

    for (const [key, cachedEntry] of textCache.entries()) {
      if (
        !cachedEntry ||
        now - cachedEntry.timestamp > CACHE_DURATION
      ) {
        textCache.delete(key);
      }
    }
  }

  static get(key) {
    this.cleanup();

    const cachedEntry = textCache.get(key);

    if (!cachedEntry) {
      return null;
    }

    if (Date.now() - cachedEntry.timestamp >= CACHE_DURATION) {
      textCache.delete(key);
      return null;
    }

    return cachedEntry.result;
  }

  static set(key, result) {
    this.cleanup();

    if (textCache.has(key)) {
      textCache.delete(key);
    }

    while (textCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = textCache.keys().next().value;

      if (!oldestKey) break;

      textCache.delete(oldestKey);
    }

    textCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  static clear() {
    textCache.clear();
  }

  static getStats() {
    this.cleanup();

    return {
      size: textCache.size,
      maxSize: MAX_CACHE_SIZE,
      cacheDuration: CACHE_DURATION
    };
  }
}

const resetRequestWindowIfNeeded = () => {
  const now = Date.now();

  if (now - requestWindowStartedAt >= TIME_WINDOW) {
    requestCount = 0;
    requestWindowStartedAt = now;
  }
};

const canMakeRequest = () => {
  resetRequestWindowIfNeeded();

  return requestCount < REQUESTS_LIMIT;
};

const registerRequest = () => {
  resetRequestWindowIfNeeded();
  requestCount += 1;
};

const shouldRetryResponse = (status) =>
  status === 408 ||
  status === 425 ||
  status === 429 ||
  status >= 500;

const fetchWithTimeout = async (
  url,
  options,
  timeout = REQUEST_TIMEOUT
) => {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const fetchWithRetry = async (
  url,
  options,
  retries = MAX_RETRIES
) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (response.ok) {
        return response;
      }

      const responseText = await response.text().catch(() => "");

      const requestError = new Error(
        `LanguageTool request failed with status ${response.status}${
          responseText ? `: ${responseText.slice(0, 300)}` : ""
        }`
      );

      requestError.status = response.status;
      lastError = requestError;

      if (
        attempt >= retries ||
        !shouldRetryResponse(response.status)
      ) {
        throw requestError;
      }
    } catch (error) {
      lastError = error;

      const isAbortError = error?.name === "AbortError";
      const status = Number(error?.status);

      const retryable =
        isAbortError ||
        !status ||
        shouldRetryResponse(status);

      if (attempt >= retries || !retryable) {
        throw error;
      }
    }

    await wait(RETRY_DELAY * attempt);
  }

  throw lastError || new Error("LanguageTool request failed.");
};

const getErrorCategory = (match = {}) =>
  String(
    match.rule?.category?.id ||
      match.rule?.issueType ||
      "DEFAULT"
  ).toUpperCase();

const calculateErrorWeight = (matches = []) => {
  const categoryWeights = {
    GRAMMAR: 2.5,
    TYPOGRAPHY: 0.5,
    TYPOS: 1,
    MISSPELLING: 1.25,
    PUNCTUATION: 0.5,
    STYLE: 0.35,
    CASING: 0.5,
    REDUNDANCY: 0.5,
    CONFUSED_WORDS: 1.5,
    DEFAULT: 1
  };

  return matches.reduce((totalWeight, match) => {
    const category = getErrorCategory(match);

    const categoryWeight =
      categoryWeights[category] ||
      categoryWeights.DEFAULT;

    return totalWeight + categoryWeight;
  }, 0);
};

const calculateLanguageToolScore = ({
  wordCount,
  errorWeight
}) => {
  if (wordCount <= 0) {
    return 0;
  }

  const weightedErrorsPerWord = errorWeight / wordCount;

  const rawScore = 100 - weightedErrorsPerWord * 100;

  return clampScore(rawScore);
};

const normalizeMatch = (match = {}) => ({
  message: match.message || "",
  shortMessage: match.shortMessage || "",
  offset: Number(match.offset) || 0,
  length: Number(match.length) || 0,
  replacements: Array.isArray(match.replacements)
    ? match.replacements
        .map((replacement) => replacement?.value)
        .filter(Boolean)
    : [],
  ruleId: match.rule?.id || "",
  category:
    match.rule?.category?.id ||
    match.rule?.issueType ||
    "DEFAULT",
  issueType: match.rule?.issueType || "",
  sentence: match.sentence || "",
  context: match.context || null
});

const processAnalysis = ({
  data,
  text,
  language
}) => {
  const matches = Array.isArray(data?.matches)
    ? data.matches
    : [];

  const words = normalizeText(text)
    .split(/\s+/)
    .filter(Boolean);

  const wordCount = words.length;
  const errorWeight = calculateErrorWeight(matches);

  const score = calculateLanguageToolScore({
    wordCount,
    errorWeight
  });

  return {
    status: "evaluated",
    provider: "languageTool",
    language,
    isValid: score >= PASSING_SCORE,
    score,
    passingScore: PASSING_SCORE,
    errorCount: matches.length,
    weightedErrorCount: errorWeight,
    details: matches.map(normalizeMatch),
    textLength: wordCount,
    words,
    timestamp: Date.now(),
    isDefaultValue: false
  };
};

const validateAnalysisInput = (text) => {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return {
      valid: false,
      reason: "empty_text",
      error: new Error("Text is empty.")
    };
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      reason: "text_too_long",
      error: new Error(
        `Text exceeds the maximum length of ${MAX_TEXT_LENGTH} characters.`
      )
    };
  }

  return {
    valid: true,
    text: normalizedText
  };
};

export const analyzeText = async (
  text,
  language = DEFAULT_LANGUAGE
) => {
  const normalizedLanguage = normalizeLanguage(language);

  const validation = validateAnalysisInput(text);

  if (!validation.valid) {
    return buildUnavailableResult({
      error: validation.error,
      text,
      language: normalizedLanguage,
      reason: validation.reason
    });
  }

  const normalizedText = validation.text;

  const cacheKey = createCacheKey(
    normalizedText,
    normalizedLanguage
  );

  const cachedResult = CacheManager.get(cacheKey);

  if (cachedResult) {
    return {
      ...cachedResult,
      fromCache: true
    };
  }

  if (!canMakeRequest()) {
    return buildUnavailableResult({
      error: new Error(
        "Local LanguageTool request limit reached."
      ),
      text: normalizedText,
      language: normalizedLanguage,
      reason: "local_rate_limit"
    });
  }

  registerRequest();

  try {
    const response = await fetchWithRetry(
      LANGUAGE_TOOL_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json"
        },
        body: new URLSearchParams({
          text: normalizedText,
          language: normalizedLanguage,
          enabledOnly: "false"
        })
      }
    );

    const data = await response.json();

    const result = processAnalysis({
      data,
      text: normalizedText,
      language: normalizedLanguage
    });

    CacheManager.set(cacheKey, result);

    return {
      ...result,
      fromCache: false
    };
  } catch (error) {
    console.error("LanguageTool analysis failed:", error);

    return buildUnavailableResult({
      error,
      text: normalizedText,
      language: normalizedLanguage,
      reason:
        error?.name === "AbortError"
          ? "request_timeout"
          : error?.status === 429
          ? "provider_rate_limit"
          : "service_unavailable"
    });
  }
};

export const isLanguageToolAvailableResult = (result) =>
  result?.status === "evaluated" &&
  typeof result?.score === "number" &&
  Number.isFinite(result.score);

export const resetApiLimits = () => {
  requestCount = 0;
  requestWindowStartedAt = Date.now();
};

export const clearCache = () => {
  CacheManager.clear();
};

export const getCacheStats = () =>
  CacheManager.getStats();

export const getApiLimitStats = () => {
  resetRequestWindowIfNeeded();

  return {
    requestCount,
    requestLimit: REQUESTS_LIMIT,
    remainingRequests: Math.max(
      REQUESTS_LIMIT - requestCount,
      0
    ),
    timeWindow: TIME_WINDOW,
    windowStartedAt: requestWindowStartedAt
  };
};

export const getLanguageToolConfiguration = () => ({
  apiUrl: LANGUAGE_TOOL_API_URL,
  defaultLanguage: DEFAULT_LANGUAGE,
  requestLimit: REQUESTS_LIMIT,
  timeWindow: TIME_WINDOW,
  maxTextLength: MAX_TEXT_LENGTH,
  cacheDuration: CACHE_DURATION,
  maxRetries: MAX_RETRIES,
  retryDelay: RETRY_DELAY,
  requestTimeout: REQUEST_TIMEOUT,
  passingScore: PASSING_SCORE
});

export default {
  analyzeText,
  isLanguageToolAvailableResult,
  resetApiLimits,
  clearCache,
  getCacheStats,
  getApiLimitStats,
  getLanguageToolConfiguration
};