# MASTER_PLACEMENT_TEST_ARCHITECTURE.md

Version 2.0

## Official CEFR Placement Test Specification for Polish-learning

This document defines the official architecture for every placement test
generated for the platform.

### Objectives

-   Diagnose English proficiency.
-   Follow official CEFR descriptors.
-   Produce university-level assessments.
-   Keep all A1--C2 tests consistent.
-   Prepare Writing for AI evaluation.

## Languages

Student language: Polish

Target language: English

Instructions: Polish

Assessment content: English

Never use Spanish.

## Sections

Every level contains exactly:

1.  Multiple Choice
2.  Writing
3.  Reading

Listening will be incorporated in a future version.

## Number of Tasks

A1 - 20 Multiple Choice - 3 Writing - 3 Reading texts - 3 questions per
text

A2 - 22 Multiple Choice - 3 Writing - 3 Reading texts - 4 questions per
text

B1 - 24 Multiple Choice - 3 Writing - 4 Reading texts - 4 questions each

B2 - 26 Multiple Choice - 3 Writing - 4 Reading texts - 5 questions each

C1 - 28 Multiple Choice - 4 Writing - 5 Reading texts - 5 questions each

C2 - 30 Multiple Choice - 4 Writing - 5 Reading texts - 6 questions each

## Quality Rules

-   One competency per question.
-   Progressive difficulty.
-   Authentic English.
-   No trick questions.
-   Plausible distractors.
-   No unnecessary repetition.

## Writing

Each task includes:

-   Polish instructions
-   English task
-   Minimum words
-   Maximum words
-   Sample answer
-   Grammar objective
-   Vocabulary objective
-   Communicative objective
-   CEFR descriptor
-   AI evaluation criteria

AI criteria:

-   Grammar 30%
-   Vocabulary 20%
-   Task completion 20%
-   Coherence 15%
-   Spelling 10%
-   Naturalness 5%

If AI is unavailable:

-   Validate locally.
-   Mark Pending AI Review.
-   Show estimated score without technical errors.

## Reading

Evaluate:

-   Main idea
-   Details
-   Vocabulary in context
-   Logical inference when allowed

## Multiple Choice

Evaluate:

-   Grammar
-   Vocabulary
-   Functional English
-   Sentence structure
-   CEFR competence

## Passing Score

Global passing score:

70%

## Output

1 Test Information

2 Multiple Choice

3 Writing

4 Reading

Never generate JSON.

Never generate Markdown tables.

This document is the official foundation for all placement tests in
Polish-learning.
