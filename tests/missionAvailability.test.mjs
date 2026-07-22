import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CEFR_LEVEL_ORDER,
  evaluateMissionAvailability,
  getCefrLevelRank,
  normalizeCefrLevel,
  resolveUserCefrLevel,
  sortMissionsForAvailability
} from "../src/services/missions/missionAvailability.js";

const missions = CEFR_LEVEL_ORDER.map((level, index) => ({
  id: `mission_${level}`,
  level,
  order: index + 1
}));

test("normalizes and ranks CEFR levels canonically", () => {
  assert.equal(normalizeCefrLevel(" b1 "), "B1");
  assert.equal(normalizeCefrLevel("invalid"), null);
  assert.deepEqual(
    CEFR_LEVEL_ORDER.map(getCefrLevelRank),
    [1, 2, 3, 4, 5, 6]
  );
});

test("resolves the user level using the documented priority", () => {
  assert.equal(
    resolveUserCefrLevel({
      placementLevel: "B1",
      currentLevel: "C2",
      level: "A2",
      finalLevel: "A1"
    }),
    "B1"
  );
  assert.equal(
    resolveUserCefrLevel({ placementLevel: "invalid", currentLevel: "A2" }),
    "A2"
  );
});

test("sorts missions by numeric order and then title", () => {
  assert.deepEqual(
    sortMissionsForAvailability([
      { id: "c", order: 2, title: "Zulu" },
      { id: "b", order: 1, title: "Beta" },
      { id: "a", order: 1, title: "Alpha" }
    ]).map((mission) => mission.id),
    ["a", "b", "c"]
  );
});

for (const [userLevel, highestAvailableIndex] of [
  ["A1", 0],
  ["A2", 1],
  ["B1", 2],
  ["B2", 3],
  ["C1", 4],
  ["C2", 5]
]) {
  test(`${userLevel} unlocks missions at or below its CEFR rank`, () => {
    missions.forEach((mission, missionIndex) => {
      const result = evaluateMissionAvailability({
        mission,
        missionIndex,
        orderedMissions: missions,
        completedMissionIds: [],
        userLevel
      });

      assert.equal(result.available, missionIndex <= highestAvailableIndex);
      assert.equal(result.completed, false);
    });
  });
}

test("preserves sequential unlocking without a diagnostic result", () => {
  const first = evaluateMissionAvailability({
    mission: missions[0],
    missionIndex: 0,
    orderedMissions: missions
  });
  const secondLocked = evaluateMissionAvailability({
    mission: missions[1],
    missionIndex: 1,
    orderedMissions: missions
  });
  const secondUnlocked = evaluateMissionAvailability({
    mission: missions[1],
    missionIndex: 1,
    orderedMissions: missions,
    completedMissionIds: [missions[0].id]
  });

  assert.equal(first.available, true);
  assert.equal(first.initialFallback, true);
  assert.equal(secondLocked.locked, true);
  assert.equal(secondUnlocked.available, true);
  assert.equal(secondUnlocked.availableByProgression, true);
});

test("supports explicit unlockAfter dependencies", () => {
  const mission = { id: "advanced", level: "C2", unlockAfter: ["one", "two"] };

  assert.equal(
    evaluateMissionAvailability({
      mission,
      missionIndex: 2,
      orderedMissions: [{ id: "one" }, { id: "two" }, mission],
      completedMissionIds: ["one"]
    }).locked,
    true
  );
  assert.equal(
    evaluateMissionAvailability({
      mission,
      missionIndex: 2,
      orderedMissions: [{ id: "one" }, { id: "two" }, mission],
      completedMissionIds: ["one", "two"]
    }).available,
    true
  );
});

test("keeps completed separate from administrative availability", () => {
  const result = evaluateMissionAvailability({
    mission: { id: "done", level: "A1", locked: true },
    missionIndex: 0,
    orderedMissions: [{ id: "done", level: "A1", locked: true }],
    completedMissionIds: ["done"],
    userLevel: "C2"
  });

  assert.deepEqual(
    {
      completed: result.completed,
      available: result.available,
      locked: result.locked,
      administrativelyLocked: result.administrativelyLocked,
      unlockReason: result.unlockReason
    },
    {
      completed: true,
      available: false,
      locked: true,
      administrativelyLocked: true,
      unlockReason: "administratively_locked"
    }
  );
});

test("a missing mission level safely falls back to A1", () => {
  const result = evaluateMissionAvailability({
    mission: { id: "legacy" },
    missionIndex: 3,
    orderedMissions: [{ id: "one" }, { id: "two" }, { id: "three" }, { id: "legacy" }],
    userLevel: "A1"
  });

  assert.equal(result.missionLevel, "A1");
  assert.equal(result.availableByLevel, true);
});

test("invalid levels never unlock missions by CEFR", () => {
  const result = evaluateMissionAvailability({
    mission: { id: "invalid", level: "Z9" },
    missionIndex: 1,
    orderedMissions: [{ id: "first", level: "A1" }, { id: "invalid", level: "Z9" }],
    userLevel: "C2"
  });

  assert.equal(result.availableByLevel, false);
  assert.equal(result.locked, true);
});

test("level eligibility does not mark a mission as completed", () => {
  const result = evaluateMissionAvailability({
    mission: missions[2],
    missionIndex: 2,
    orderedMissions: missions,
    userLevel: "B1"
  });

  assert.equal(result.available, true);
  assert.equal(result.completed, false);
});
