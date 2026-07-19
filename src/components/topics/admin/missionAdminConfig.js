// src/components/topics/admin/missionAdminConfig.js

export const MISSION_STATUS_LABELS = {
  draft: "Szkic",
  published: "Opublikowana",
  archived: "Zarchiwizowana"
};

export const MISSION_DIFFICULTY_LABELS = {
  easy: "Łatwa",
  medium: "Średnia",
  hard: "Trudna",
  adaptive: "Adaptacyjna"
};

export const getMissionStatusLabel = (
  status = "draft"
) => {
  return (
    MISSION_STATUS_LABELS[status] ||
    MISSION_STATUS_LABELS.draft
  );
};

export const getMissionDifficultyLabel = (
  difficulty = "easy"
) => {
  return (
    MISSION_DIFFICULTY_LABELS[difficulty] ||
    MISSION_DIFFICULTY_LABELS.easy
  );
};

export const getMissionStatusBadgeClass = (
  status = "draft"
) => {
  const styles = {
    draft:
      "bg-gray-100 text-gray-700",

    published:
      "bg-green-100 text-green-700",

    archived:
      "bg-yellow-100 text-yellow-700"
  };

  return styles[status] || styles.draft;
};

export const getMissionDifficultyBadgeClass = (
  difficulty = "easy"
) => {
  const styles = {
    easy:
      "bg-blue-50 text-blue-700",

    medium:
      "bg-yellow-50 text-yellow-700",

    hard:
      "bg-red-50 text-red-700",

    adaptive:
      "bg-purple-50 text-purple-700"
  };

  return (
    styles[difficulty] ||
    styles.easy
  );
};