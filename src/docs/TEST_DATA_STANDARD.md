# TEST DATA STANDARD

## Polish-learning

**Document type:** Architectural Data Contract  
**Subsystem:** CEFR Assessment  
**Version:** 1.0  
**Status:** Active  
**Target language:** English  
**Support language:** Polish  
**CEFR levels:** A1, A2, B1, B2, C1, C2

---

# 1. Purpose

This document defines the canonical data standard for the CEFR test subsystem in Polish-learning.

Its purpose is to ensure that:

- tests use individual CEFR levels;
- test definitions follow one stable structure;
- test results follow one stable structure;
- React components do not depend on legacy data formats;
- Firestore stores predictable and normalized data;
- scoring services use the same contract;
- profile and dashboard components consume the same result model;
- future AI assessment features can be added without breaking existing data;
- legacy grouped levels such as `A1-A2` are not created again.

The canonical CEFR levels are:

```text
A1
A2
B1
B2
C1
C2
```

The following grouped level formats are not valid canonical levels:

```text
A1-A2
B1-B2
C1-C2
```

---

# 2. Architectural Principle

The test subsystem must follow this architecture:

```text
Firestore
    ↓
Test Service / Result Normalization
    ↓
Canonical Test Model
    ↓
Scoring Engine
    ↓
React Components
```

React components must not implement their own interpretation of test data.

The same field must not have different meanings in different components.

---

# 3. CEFR Level Standard

The only valid CEFR levels are:

```js
const VALID_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
];
```

The canonical order is:

```text
A1 → A2 → B1 → B2 → C1 → C2
```

This order must be used for:

- test administration;
- test navigation;
- result calculation;
- level progression;
- profile display;
- dashboard display;
- unlocked levels;
- analytics;
- future adaptive testing.

---

# 4. Firestore Test Architecture

Tests are stored using the CEFR level as the document ID.

```text
tests/{levelId}
```

Example:

```text
tests/A1
tests/A2
tests/B1
tests/B2
tests/C1
tests/C2
```

Each level may have only one canonical test document.

A grouped document ID is invalid:

```text
tests/A1-A2
tests/B1-B2
tests/C1-C2
```

---

# 5. Canonical Test Document

Example:

```js
{
  level: "A1",

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

The document ID and the `level` field must match.

Example:

```text
Document ID: A1
level: A1
```

Invalid example:

```text
Document ID: A1-A2
level: A1
```

---

# 6. Test Sections Architecture

Each test stores its sections in:

```text
tests/{levelId}/sections/{sectionType}
```

Current canonical structure:

```text
tests/A1
    sections/multipleChoice
    sections/writing
    sections/reading
```

Future supported sections may include:

```text
sections/listening
sections/speaking
```

The canonical section names must use English.

Valid:

```text
multipleChoice
writing
reading
listening
speaking
```

Invalid:

```text
opcionMultiple
escritura
lectura
escucha
habla
```

---

# 7. Multiple Choice Section

Firestore path:

```text
tests/{levelId}/sections/multipleChoice
```

Canonical structure:

```js
{
  questions: []
}
```

Each question should follow this structure:

```js
{
  id: "mc_001",

  question: "Choose the correct answer.",

  options: [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],

  correctAnswer: "Option B",

  points: 1
}
```

Recommended extended structure:

```js
{
  id: "mc_001",

  question: "Choose the correct answer.",

  options: [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],

  correctAnswer: "Option B",

  skill: "grammar",

  difficulty: "A1",

  points: 1
}
```

Possible skill values:

```text
grammar
vocabulary
reading
useOfEnglish
```

---

# 8. Writing Section

Firestore path:

```text
tests/{levelId}/sections/writing
```

Canonical structure:

```js
{
  questions: []
}
```

Each writing question should follow this structure:

```js
{
  id: "writing_001",

  prompt: "Write a short text about yourself.",

  minWords: 30,

  maxWords: 80
}
```

Recommended extended structure:

```js
{
  id: "writing_001",

  prompt: "Write a short text about yourself.",

  instructions: "Include your name, country and interests.",

  minWords: 30,

  maxWords: 80,

  skill: "writing",

  difficulty: "A1",

  points: 100
}
```

The student's answer must not be stored inside the test definition.

Student answers belong to the user test attempt.

---

# 9. Reading Section

Firestore path:

```text
tests/{levelId}/sections/reading
```

Canonical structure:

```js
{
  texts: []
}
```

Each reading item should follow this structure:

```js
{
  id: "reading_001",

  title: "A Day at School",

  text: "Reading text in English.",

  questions: []
}
```

Each reading question should follow this structure:

```js
{
  id: "reading_001_q_001",

  question: "Where does the student go in the morning?",

  options: [
    "To school",
    "To work",
    "To the park"
  ],

  correctAnswer: "To school",

  points: 1
}
```

---

# 10. Future Listening Section

Future Firestore path:

```text
tests/{levelId}/sections/listening
```

Recommended canonical structure:

```js
{
  exercises: []
}
```

Example:

```js
{
  id: "listening_001",

  audioUrl: "...",

  transcript: "...",

  questions: []
}
```

The transcript may be hidden from the student during the test.

---

# 11. Future Speaking Section

Future Firestore path:

```text
tests/{levelId}/sections/speaking
```

Recommended canonical structure:

```js
{
  questions: []
}
```

Example:

```js
{
  id: "speaking_001",

  prompt: "Introduce yourself.",

  minSeconds: 10,

  maxSeconds: 60,

  skill: "speaking",

  difficulty: "A1",

  points: 100
}
```

Speaking answers may later be evaluated by AI.

---

# 12. Canonical Test Object Returned to React

The service layer should return:

```js
{
  id: "A1",

  level: "A1",

  sections: {
    multipleChoice: {
      questions: []
    },

    writing: {
      questions: []
    },

    reading: {
      texts: []
    }
  },

  createdAt: Timestamp,

  updatedAt: Timestamp
}
```

React components should consume this canonical structure.

---

# 13. User Test Attempts

User test attempts are stored in:

```text
userTests/{testAttemptId}
```

Every attempt represents one execution of the CEFR assessment process.

Canonical attempt structure:

```js
{
  userId: "USER_UID",

  testDate: Timestamp,

  completed: false,

  testProgress: {},

  createdAt: Timestamp,

  updatedAt: Timestamp
}
```

When completed:

```js
{
  userId: "USER_UID",

  testDate: Timestamp,

  completed: true,

  results: {
    placementLevel: "A1",

    finalLevel: "A1",

    overallScore: 78,

    levelResults: {
      A1: 78
    },

    skillResults: {
      grammar: 80,
      vocabulary: 75,
      reading: 82,
      writing: 74
    },

    timeSpent: 1200
  }
}
```

---

# 14. Canonical Result Model

All completed test results must use:

```js
results: {
  placementLevel: "A1",

  finalLevel: "A1",

  overallScore: 78,

  levelResults: {},

  skillResults: {},

  timeSpent: 0
}
```

The result fields must not be duplicated outside `results`.

Canonical:

```js
test.results.levelResults
```

Invalid:

```js
test.levelResults
```

Canonical:

```js
test.results.overallScore
```

Invalid:

```js
test.overallScore
```

Canonical:

```js
test.results.finalLevel
```

Invalid:

```js
test.finalLevel
```

---

# 15. Placement Level and Current Level

The following concepts must remain separate.

## placementLevel

The level assigned by the diagnostic or placement test.

Example:

```js
placementLevel: "B1"
```

This represents the student's placement result.

---

## currentLevel

The student's current learning level.

Example:

```js
currentLevel: "B1"
```

This value may later change because of course progression.

---

## finalLevel

The final level calculated for one specific test attempt.

Example:

```js
results.finalLevel: "B1"
```

For the initial placement test:

```text
results.finalLevel
        ↓
placementLevel
        ↓
currentLevel
```

Future course progression may change `currentLevel` without changing the original `placementLevel`.

---

# 16. User Academic Level Model

The canonical user document should support:

```js
{
  placementLevel: "A1",

  currentLevel: "A1",

  unlockedLevels: [
    "A1"
  ]
}
```

Example for a B1 student:

```js
{
  placementLevel: "B1",

  currentLevel: "B1",

  unlockedLevels: [
    "A1",
    "A2",
    "B1"
  ]
}
```

The canonical order must always be preserved.

Invalid:

```js
[
  "B1",
  "A1",
  "A2"
]
```

Valid:

```js
[
  "A1",
  "A2",
  "B1"
]
```

---

# 17. Unlocked Levels Rule

When a student receives a placement level, all previous levels should be available.

Example:

```text
Placement A1
```

Result:

```js
["A1"]
```

Example:

```text
Placement A2
```

Result:

```js
["A1", "A2"]
```

Example:

```text
Placement B1
```

Result:

```js
["A1", "A2", "B1"]
```

Example:

```text
Placement C2
```

Result:

```js
[
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]
```

---

# 18. Level Results

`levelResults` stores the score obtained for each CEFR level evaluated.

Example:

```js
{
  A1: 92,
  A2: 81,
  B1: 68
}
```

Grouped level keys are invalid.

Invalid:

```js
{
  "A1-A2": 86
}
```

Valid:

```js
{
  A1: 91,
  A2: 81
}
```

---

# 19. Skill Results

The canonical model should support:

```js
skillResults: {
  grammar: 0,
  vocabulary: 0,
  reading: 0,
  writing: 0,
  listening: 0,
  speaking: 0
}
```

Only evaluated skills need to be stored.

Example:

```js
skillResults: {
  grammar: 84,
  vocabulary: 79,
  reading: 88,
  writing: 71
}
```

This structure will support:

- profile skill progress;
- learning analytics;
- personalized recommendations;
- AI tutor recommendations;
- university reports;
- adaptive testing.

---

# 20. Overall Score

`overallScore` must represent the normalized final score of the test attempt.

Range:

```text
0–100
```

Example:

```js
overallScore: 78
```

The calculation method must be centralized.

React components must not calculate their own alternative overall score.

The scoring engine or test service must provide the canonical value.

---

# 21. Test History

The canonical source of detailed test history is:

```text
userTests
```

Profile and dashboard components should read completed attempts from this collection.

The user document may contain a lightweight summary if needed:

```js
testHistory: [
  {
    date: Timestamp,

    level: "A1",

    score: 78,

    passed: true
  }
]
```

This summary must not replace the canonical detailed test attempt stored in:

```text
userTests/{testAttemptId}
```

---

# 22. Test Availability Rule

Current rule:

```text
20 days between test attempts
```

The restriction must be calculated using completed test attempts.

An abandoned or incomplete attempt should not automatically block the student for 20 days.

Canonical rule:

```text
completed === true
```

before applying the test cooldown.

---

# 23. Scoring Responsibility

Scoring logic must be centralized.

Recommended architecture:

```text
Test Components
    ↓
Student Answers
    ↓
testScoring
    ↓
Canonical Results
    ↓
saveUserTestResult
    ↓
Firestore
```

React components should not independently define scoring rules.

---

# 24. Writing Scoring

Writing evaluation should support progressive evolution.

Current architecture:

```text
Local validation
    ↓
LanguageTool analysis
    ↓
Normalized score
```

Future architecture:

```text
Local validation
    ↓
LanguageTool
    ↓
AI CEFR Assessment
    ↓
Canonical Writing Score
```

The final writing score must use the range:

```text
0–100
```

---

# 25. Language Rules

The Polish-learning test subsystem must follow:

```text
Internal field names:
English

Academic content:
English

Student interface:
Polish
```

Example:

```js
{
  level: "A1",
  question: "Choose the correct answer.",
  correctAnswer: "am"
}
```

Visible interface:

```text
Wybierz poprawną odpowiedź
```

No visible Spanish text should remain in student-facing components.

---

# 26. Legacy Data Policy

The following formats are considered legacy:

```text
A1-A2
B1-B2
C1-C2
```

Legacy grouped levels must not be created by new code.

If legacy data is found, it must be:

1. identified;
2. reviewed;
3. migrated deliberately;
4. never silently interpreted as canonical data.

Temporary UI normalization such as:

```js
level.split("-")[0]
```

may prevent display errors, but it is not the final architectural solution.

The canonical solution is to store:

```text
A1
A2
B1
B2
C1
C2
```

correctly at the data source.

---

# 27. Components Covered by This Standard

This standard applies to:

```text
Test.jsx

TestQuestion.jsx

TestResults.jsx

TestHistory.jsx

TestTimer.jsx

TestProgress.jsx

TestSection.jsx

AdminTestManager.jsx

ProfileStats.jsx

ProfileTestHistory.jsx

ProfileProgress.jsx

Home.jsx
```

It also applies to:

```text
testService.js

testScoring.js

firestoreService.js
```

and any future test-related component or service.

---

# 28. Architectural Validation Checklist

Before the CEFR test hardening phase is considered complete, verify:

```text
[ ] All test IDs are A1, A2, B1, B2, C1 or C2

[ ] No new A1-A2 grouped levels are created

[ ] Test documents use the CEFR level as document ID

[ ] Test sections use canonical English names

[ ] Test results are stored inside results

[ ] Components read results.levelResults

[ ] Components read results.overallScore

[ ] Components read results.finalLevel

[ ] placementLevel is stored

[ ] currentLevel is stored

[ ] unlockedLevels is stored

[ ] unlockedLevels follow CEFR order

[ ] levelResults use individual CEFR keys

[ ] Test UI is visible in Polish

[ ] Academic questions and content are in English

[ ] No visible Spanish text remains

[ ] Scoring is centralized

[ ] Incomplete tests do not incorrectly trigger cooldown

[ ] Profile consumes the canonical result model

[ ] Dashboard consumes the canonical result model

[ ] Test history consumes the canonical result model
```

---

# 29. Final Canonical Architecture

```text
tests/{levelId}
    ↓
sections/{sectionType}
    ↓
testService
    ↓
Canonical Test Object
    ↓
Test UI
    ↓
Student Answers
    ↓
testScoring
    ↓
Canonical Test Results
    ↓
userTests/{attemptId}
    ↓
User Academic State
    ↓
Profile / Dashboard / Analytics
```

---

# 30. Permanent Rule

From this point forward:

```text
No React component should invent its own test data structure.

No service should create grouped CEFR levels.

No component should read duplicated result fields outside results.

No new Spanish field names should be introduced.

No test result should update the user academic state without using
the canonical CEFR level model.
```

The canonical test architecture is:

```text
A1 → A2 → B1 → B2 → C1 → C2
```

and the canonical result access pattern is:

```js
test.results
```

This document is the architectural source of truth for the Polish-learning CEFR assessment subsystem.