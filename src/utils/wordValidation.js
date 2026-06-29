import { distance } from 'fastest-levenshtein';

/**
 * Limpia y prepara el texto para análisis.
 * - Elimina acentos
 * - Elimina signos de puntuación
 * - Convierte a minúsculas
 * - Divide en palabras
 */
export const preprocessText = (text) => {
  return text
    .normalize("NFD") // Normaliza caracteres Unicode (por ejemplo: á -> a + ´)
    .replace(/[\u0300-\u036f]/g, "") // Elimina los signos diacríticos (acentos)
    .replace(/[.,;!?¿¡]/g, "") // Elimina signos de puntuación comunes
    .toLowerCase() // Convierte a minúsculas
    .split(/\s+/) // Divide por espacios
    .filter(Boolean); // Elimina cadenas vacías
};

/**
 * Verifica si una palabra es válida comparándola con un diccionario
 * usando distancia de Levenshtein.
 */
export const isValidWord = (word, dictionary, tolerance = 1) => {
  return dictionary.some(dictWord => distance(word, dictWord) <= tolerance);
};

/**
 * Cuenta cuántas palabras del texto son válidas según el diccionario.
 */
export const getRealWordCount = (text, dictionary, tolerance = 1) => {
  const words = preprocessText(text);
  return words.filter(word => isValidWord(word, dictionary, tolerance)).length;
};

/**
 * Evalúa un texto y devuelve un puntaje de validez.
 */
export const getWordValidationScore = (text, dictionary, config) => {
  const words = preprocessText(text);
  const realCount = getRealWordCount(text, dictionary, config.tolerance);
  const ratio = words.length === 0 ? 0 : realCount / words.length;

  return {
    totalWords: words.length,
    realWords: realCount,
    ratio,
    isValid: words.length >= config.minWords && ratio >= config.minRealRatio
  };
};
