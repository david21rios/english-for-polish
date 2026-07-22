export const CEFR_LEVEL_ORDER = Object.freeze([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

const CEFR_LEVEL_RANK = new Map(
  CEFR_LEVEL_ORDER.map((level, index) => [level, index + 1])
);

const normalizeText = (value) =>
  typeof value === "string" ? value.normalize("NFKC").trim() : "";

export const sortMissionsForAvailability = (missions = []) => {
  if (!Array.isArray(missions)) {
    return [];
  }

  return [...missions].sort((firstMission, secondMission) => {
    const firstOrder = Number(firstMission?.order);
    const secondOrder = Number(secondMission?.order);
    const normalizedFirstOrder = Number.isFinite(firstOrder)
      ? firstOrder
      : 999;
    const normalizedSecondOrder = Number.isFinite(secondOrder)
      ? secondOrder
      : 999;

    if (normalizedFirstOrder !== normalizedSecondOrder) {
      return normalizedFirstOrder - normalizedSecondOrder;
    }

    return normalizeText(firstMission?.title).localeCompare(
      normalizeText(secondMission?.title)
    );
  });
};

export const normalizeCefrLevel = (value) => {
  const normalizedLevel = normalizeText(value).toUpperCase();

  return CEFR_LEVEL_RANK.has(normalizedLevel)
    ? normalizedLevel
    : null;
};

export const getCefrLevelRank = (value) => {
  const normalizedLevel = normalizeCefrLevel(value);

  return normalizedLevel ? CEFR_LEVEL_RANK.get(normalizedLevel) : null;
};

export const resolveUserCefrLevel = (userData = {}) => {
  const candidates = [
    userData?.placementLevel,
    userData?.currentLevel,
    userData?.level,
    userData?.finalLevel
  ];

  for (const candidate of candidates) {
    const normalizedLevel = normalizeCefrLevel(candidate);

    if (normalizedLevel) {
      return normalizedLevel;
    }
  }

  return null;
};

const normalizeCompletedMissionIds = (completedMissionIds) => {
  const values =
    completedMissionIds instanceof Set
      ? [...completedMissionIds]
      : Array.isArray(completedMissionIds)
        ? completedMissionIds
        : [];

  return new Set(values.map(normalizeText).filter(Boolean));
};

const normalizeUnlockAfter = (unlockAfter) =>
  Array.isArray(unlockAfter)
    ? unlockAfter.map(normalizeText).filter(Boolean)
    : [];

export const evaluateMissionAvailability = ({
  mission = {},
  missionIndex = -1,
  orderedMissions = [],
  completedMissionIds = [],
  userLevel = null
} = {}) => {
  const completedMissionSet = normalizeCompletedMissionIds(
    completedMissionIds
  );
  const missionId = normalizeText(mission?.id || mission?.missionId);
  const completed = Boolean(
    missionId && completedMissionSet.has(missionId)
  );
  const administrativelyLocked = mission?.locked === true;
  const unlockAfter = normalizeUnlockAfter(mission?.unlockAfter);
  const hasExplicitRequirements = unlockAfter.length > 0;
  const explicitRequirementsMet =
    hasExplicitRequirements &&
    unlockAfter.every((requiredMissionId) =>
      completedMissionSet.has(requiredMissionId)
    );

  const resolvedIndex = Number.isInteger(missionIndex) && missionIndex >= 0
    ? missionIndex
    : orderedMissions.findIndex(
        (candidate) =>
          normalizeText(candidate?.id || candidate?.missionId) === missionId
      );
  const previousMission = orderedMissions[resolvedIndex - 1];
  const previousMissionId = normalizeText(
    previousMission?.id || previousMission?.missionId
  );
  const initialMission = resolvedIndex === 0;
  const previousMissionCompleted = Boolean(
    previousMissionId && completedMissionSet.has(previousMissionId)
  );
  const availableByProgression = hasExplicitRequirements
    ? explicitRequirementsMet
    : initialMission || previousMissionCompleted;

  const normalizedUserLevel = normalizeCefrLevel(userLevel);
  const rawMissionLevel = normalizeText(mission?.level);
  const normalizedMissionLevel = rawMissionLevel
    ? normalizeCefrLevel(rawMissionLevel)
    : "A1";
  const userLevelRank = getCefrLevelRank(normalizedUserLevel);
  const missionLevelRank = getCefrLevelRank(normalizedMissionLevel);
  const availableByLevel = Boolean(
    userLevelRank &&
      missionLevelRank &&
      missionLevelRank <= userLevelRank
  );
  const initialFallback = !normalizedUserLevel && initialMission;
  const pedagogicallyAvailable =
    completed ||
    availableByLevel ||
    availableByProgression ||
    initialFallback;
  const available = !administrativelyLocked && pedagogicallyAvailable;
  const locked = !available;

  let unlockReason = null;

  if (administrativelyLocked) {
    unlockReason = "administratively_locked";
  } else if (completed) {
    unlockReason = "completed";
  } else if (availableByLevel) {
    unlockReason = "cefr_level";
  } else if (hasExplicitRequirements && explicitRequirementsMet) {
    unlockReason = "required_missions_completed";
  } else if (previousMissionCompleted) {
    unlockReason = "previous_mission_completed";
  } else if (initialFallback || initialMission) {
    unlockReason = "initial_mission";
  } else if (hasExplicitRequirements) {
    unlockReason = "required_missions_incomplete";
  } else {
    unlockReason = "previous_mission_incomplete";
  }

  return {
    completed,
    available,
    locked,
    administrativelyLocked,
    unlockReason,
    availableByLevel,
    availableByProgression,
    initialFallback,
    userLevel: normalizedUserLevel,
    missionLevel: normalizedMissionLevel
  };
};

export default evaluateMissionAvailability;
