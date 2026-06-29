// services/languageToolService.js

// Configuración
const LANGUAGE_TOOL_API_URL = import.meta.env.VITE_LANGUAGE_TOOL_API_URL || 'https://api.languagetool.org/v2/check';
const REQUESTS_LIMIT = parseInt(import.meta.env.VITE_API_REQUESTS_LIMIT || '20');
const TIME_WINDOW = parseInt(import.meta.env.VITE_API_TIME_WINDOW || '60000');
const MAX_TEXT_LENGTH = parseInt(import.meta.env.VITE_MAX_TEXT_LENGTH || '20000');
const CACHE_DURATION = parseInt(import.meta.env.VITE_CACHE_DURATION || '3600000');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_CACHE_SIZE = 100; // Límite máximo de entradas en caché

// Estado del servicio
let requestCount = 0;
let lastRequestTime = Date.now();
const textCache = new Map();

// Utilidades
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Gestión de caché mejorada
class CacheManager {
  static cleanup() {
    const now = Date.now();
    for (const [key, { timestamp }] of textCache) {
      if (now - timestamp > CACHE_DURATION) {
        textCache.delete(key);
      }
    }
  }

  static get(key) {
    this.cleanup();
    const cached = textCache.get(key);
    return cached && Date.now() - cached.timestamp < CACHE_DURATION ? cached.result : null;
  }

  static set(key, result) {
    if (textCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(textCache.keys())[0];
      textCache.delete(oldestKey);
    }
    textCache.set(key, { result, timestamp: Date.now() });
  }
}

// Función mejorada de reintento
const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      console.log(`Intento ${i + 1}/${retries} fallido. Estado: ${response.status}`);
      if (i < retries - 1) await wait(RETRY_DELAY * (i + 1));
    } catch (error) {
      console.error(`Error en intento ${i + 1}/${retries}:`, error);
      if (i === retries - 1) throw error;
      await wait(RETRY_DELAY * (i + 1));
    }
  }
  throw new Error(`Failed after ${retries} retries`);
};

// Control de límites de API mejorado
const checkApiLimit = () => {
  const currentTime = Date.now();
  if (currentTime - lastRequestTime >= TIME_WINDOW) {
    requestCount = 0;
    lastRequestTime = currentTime;
  }
  return requestCount < REQUESTS_LIMIT;
};

// Función principal de análisis
export const analyzeText = async (text, language = 'es') => {
  try {
    // Validaciones
    if (!text?.trim()) {
      return handleError(new Error('Texto vacío o inválido'));
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return handleError(new Error(`Texto excede ${MAX_TEXT_LENGTH} caracteres`));
    }

    // Verificar caché
    const cacheKey = `${text}-${language}`;
    const cachedResult = CacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    // Verificar límites de API
    if (!checkApiLimit()) {
      return handleError(new Error('Límite de solicitudes alcanzado'));
    }

    requestCount++;

    // Realizar petición
    const response = await fetchWithRetry(LANGUAGE_TOOL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        text,
        language,
        enabledOnly: 'false'
      })
    });

    const data = await response.json();
    const result = processAnalysis(data, text);

    // Guardar en caché
    CacheManager.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error en analyzeText:', error);
    return handleError(error);
  }
};

// Procesamiento de análisis mejorado
const processAnalysis = (data, text) => {
  try {
    const errors = data.matches || [];
    const words = text.split(/\s+/).filter(word => word.trim());
    const textLength = words.length;
    const errorWeight = calculateErrorWeight(errors);
    const score = calculateScore(textLength, errorWeight);

    return {
      isValid: score >= 70,
      score,
      errorCount: errors.length,
      details: errors,
      textLength,
      timestamp: Date.now(),
      words
    };
  } catch (error) {
    console.error('Error en processAnalysis:', error);
    return handleError(error);
  }
};

// Cálculo de peso de errores mejorado
const calculateErrorWeight = (errors) => {
  const weights = {
    GRAMMAR: 2,
    TYPOS: 1,
    PUNCTUATION: 0.5,
    DEFAULT: 1
  };

  return errors.reduce((weight, error) => {
    try {
      const category = error.rule?.category?.id || 'DEFAULT';
      return weight + (weights[category] || weights.DEFAULT);
    } catch (err) {
      console.error('Error al calcular peso:', err);
      return weight + weights.DEFAULT;
    }
  }, 0);
};

// Cálculo de puntuación mejorado
const calculateScore = (textLength, errorWeight) => {
  if (textLength === 0) return 0;
  const score = Math.max(0, 100 - (errorWeight / textLength) * 100);
  return Math.round(score);
};

// Manejo de errores mejorado
const handleError = (error) => ({
  isValid: true,
  score: 70,
  errorCount: 0,
  details: [],
  error: error.message,
  isDefaultValue: true,
  timestamp: Date.now()
});

// Funciones de utilidad
export const resetApiLimits = () => {
  requestCount = 0;
  lastRequestTime = Date.now();
};

export const clearCache = () => {
  textCache.clear();
};

export const getCacheStats = () => ({
  size: textCache.size,
  maxSize: MAX_CACHE_SIZE
});