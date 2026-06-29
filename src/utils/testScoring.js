// src/utils/testScoring.js
import { analyzeText } from "../services/languageToolService";

const countWords = (text = "") => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const hasInvalidTextPattern = (text = "") => {
  const cleanText = text.trim().toLowerCase();

  if (!cleanText) return true;

  const words = cleanText
    .split(/\s+/)
    .map((word) => word.replace(/[^a-záéíóúüñ]/gi, ""))
    .filter(Boolean);

  if (words.length === 0) return true;

  const invalidWords = words.filter((word) => {
    const hasVowel = /[aeiouáéíóúü]/i.test(word);
    const hasLongConsonantSequence = /[bcdfghjklmnñpqrstvwxyz]{4,}/i.test(word);
    const hasRepeatedChars = /(.)\1{3,}/i.test(word);

    return !hasVowel || hasLongConsonantSequence || hasRepeatedChars;
  });

  return invalidWords.length / words.length >= 0.5;
};

const calculateLocalWritingPenalty = (answer = "", question = {}) => {
  const minWords = question.minWords || 5;
  const words = countWords(answer);

  if (!answer.trim()) return 0;
  if (words < minWords) return 0;
  if (hasInvalidTextPattern(answer)) return 0;

  return 100;
};

export const calculateWritingSectionScore = async (answers = {}, questions = []) => {
  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      return 0;
    }

    const scores = await Promise.all(
      questions.map(async (question) => {
        const answer = answers[question.id] || "";

        const localScore = calculateLocalWritingPenalty(answer, question);

        if (localScore === 0) {
          return 0;
        }

        try {
          const validation = await analyzeText(answer);
          const externalScore = Number(validation?.score);

          if (Number.isNaN(externalScore)) {
            return localScore;
          }

          return Math.max(0, Math.min(100, externalScore));
        } catch (error) {
          console.error(
            `Error analizando respuesta para pregunta ${question.id}:`,
            error
          );

          return localScore;
        }
      })
    );

    const totalScore = scores.reduce((acc, score) => acc + score, 0);

    return totalScore / questions.length;
  } catch (error) {
    console.error("Error al calcular puntuación de escritura:", error);
    return 0;
  }
};