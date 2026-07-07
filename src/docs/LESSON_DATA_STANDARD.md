# Lesson Data Standard v1.0

---

# Product

**Polish-learning**

---

# Purpose

This document defines the official internal data standard for every lesson used by the Polish-learning platform.

Its objective is to ensure that:

- Every lesson follows exactly the same structure.
- AI always generates predictable JSON.
- React components consume a single internal model.
- Firestore stores consistent documents.
- Future migrations are simple.
- The application can support additional learning languages without redesigning the architecture.

This document becomes the official technical reference for lesson generation, lesson storage, lesson rendering and lesson validation.

---

# Permanent Development Rule

From this version forward, every component, page, service, utility, prompt or React file that is modified must also be migrated to the Polish-learning language model.

The rules are mandatory.

## User Interface

Visible texts must be written in Polish.

Examples:

Buttons

Labels

Messages

Validation

Dialogs

Menus

Navigation

Administration

## Learning Content

The language being taught is always English.

Vocabulary

Grammar examples

Reading

Writing

Speaking

Evaluation

must all be written in English.

## Support Language

Any explanation intended to help the student must be written in Polish.

Examples:

Grammar explanations

Exercise instructions

Hints

Feedback

Error messages

Recommendations

## Spanish

Spanish should gradually disappear from the project.

It may temporarily remain only inside legacy files that have not yet been migrated.

No new code should introduce visible Spanish texts.

---

# Academic Model

The application follows the CEFR standard.

Supported levels:

```
A1
A2
B1
B2
C1
C2
```

Each level contains modules.

Each module contains lessons.

Each lesson contains sections.

---

# Firestore Architecture

Official lesson path

```
levels/{levelId}/modules/{moduleId}/lessons/{lessonId}
```

Temporary compatibility mirror

```
levels/{levelId}/lessons/{lessonId}
```

Deprecated collection

```
aiGeneratedLessons
```

This collection is no longer part of the production workflow.

It may remain temporarily only for migration purposes.

---

# Lesson Lifecycle

Current workflow

```
AI

↓

Draft

↓

Administrator Review

↓

Published
```

Future workflow

```
Draft

↓

Pending Review

↓

Approved

↓

Published

↓

Archived
```

Only published lessons are visible to students.

---

# Canonical Lesson Object

Every lesson should internally follow this structure.

```javascript
{
    schemaVersion,
    metadata,
    lessonData,
    auditReport
}
```

No other root structure is allowed.

---

# Metadata

Metadata contains all technical information.

```javascript
metadata
```

Required properties

```javascript
lessonId

lessonNumber

levelId

moduleId

moduleTitle

orderInModule

targetLanguage

supportLanguage

baseLanguage

product

ageGroup

status

generatedByAI

approvedByTeacher

createdAt

updatedAt
```

Example

```javascript
metadata:{

lessonId:"A1_1",

lessonNumber:1,

levelId:"A1",

moduleId:"A1_M01",

moduleTitle:"Introduction",

orderInModule:1,

targetLanguage:"English",

supportLanguage:"Polish",

baseLanguage:"Polish",

product:"Polish-learning",

ageGroup:"all",

status:"draft",

generatedByAI:true,

approvedByTeacher:false

}
```

---

# LessonData

LessonData contains the academic content.

Only LessonData should be rendered by React.

Required properties

```javascript
id

lessonId

title

description

level

moduleId

moduleTitle

orderInModule

status

ageGroup

objectives

intro

vocabulary

grammar

reading

practice

writing

speaking

evaluation

resources

reflection
```

Every lesson must contain all these sections, even if some of them are empty.

---

# Canonical Section Names

These names are official.

```
intro

vocabulary

grammar

reading

practice

writing

speaking

evaluation

resources

reflection
```

These names should be used everywhere.

React

Firestore

AI

Services

Hooks

Utilities

Validators

Future APIs

No new code should create additional names for these sections.

---

# Legacy Mapping

Old field names are temporarily accepted only during migration.

```
titulo
↓

title
```

```
descripcion
↓

description
```

```
objetivos
↓

objectives
```

```
lectura
↓

reading
```

```
practica_interactiva
↓

practice
```

```
produccion_escrita
↓

writing
```

```
produccion_oral
↓

speaking
```

```
evaluacion
↓

evaluation
```

```
recursos_adicionales
↓

resources
```

```
reflexion_final
↓

reflection
```

No new component should depend directly on legacy names.

All future components should consume only the canonical model.

---

# Vocabulary Standard

The vocabulary section introduces the new words of the lesson.

Canonical structure

```javascript
vocabulary:{

title:"",

items:[

]

}
```

Each vocabulary item must follow the same structure.

```javascript
{

term:"mother",

translation:"matka",

definition:"Female parent.",

example:"My mother is a teacher.",

audio:""

}
```

Rules

- **term** must always be in English.
- **translation** must always be in Polish.
- **definition** should preferably be in Polish for A1–A2.
- **example** must always be in English.
- Audio is optional.

Vocabulary items should never contain nested arrays.

---

# Grammar Standard

Canonical structure

```javascript
grammar:{

title:"",

explanation:"",

rules:[],

examples:[]

}
```

Each grammar rule

```javascript
{

title:"",

description:"",

examples:[

]

}
```

Each grammar example

```javascript
{

english:"She is my sister.",

polish:"Ona jest moją siostrą."

}
```

Rules

Grammar explanation:

Polish

Grammar title:

English or Polish

Grammar examples:

English sentence

Polish translation

No HTML.

No Markdown.

No nested arrays.

---

# Reading Standard

Canonical structure

```javascript
reading:{

title:"",

author:"",

text:"",

questions:[

]

}
```

Each question

```javascript
{

type:"multiple_choice",

question:"Who is Julia?",

options:[

"Mother",

"Teacher",

"Doctor"

],

correctAnswer:"Mother",

acceptedAnswers:[

"Mother",

"mother"

],

feedback:"Poprawna odpowiedź."

}
```

Rules

Reading text

English

Questions

English

Feedback

Polish

Every question must contain

question

options

correctAnswer

feedback

The correct answer MUST exist inside options.

---

# Interactive Practice Standard

Canonical structure

```javascript
practice:{

title:"",

description:"",

exercises:[

]

}
```

Supported exercise types

```
multiple_choice

fill_blank

matching

ordering
```

Old exercise names are accepted only during migration.

```
seleccion_multiple

↓

multiple_choice
```

```
completar

↓

fill_blank
```

```
relacionar

↓

matching
```

```
ordenar

↓

ordering
```

---

# Multiple Choice

Structure

```javascript
{

type:"multiple_choice",

question:"Choose the correct answer.",

options:[

"am",

"is",

"are"

],

correctAnswer:"is",

feedback:"Poprawnie."

}
```

Rules

Correct answer must exist inside options.

No duplicated options.

Minimum two options.

Maximum six options.

---

# Fill Blank

Canonical structure

```javascript
{

type:"fill_blank",

instruction:"Uzupełnij zdanie.",

text:"This ___ my sister. ___ name is Julia.",

words:[

"is",

"Her"

],

correctAnswers:{

blank0:"is",

blank1:"Her"

},

acceptedAnswers:{

blank0:[

"is"

],

blank1:[

"Her",

"her"

]

}

}
```

Rules

Every blank must have one answer.

Every blank must have one acceptedAnswers entry.

Keys must be sequential.

```
blank0

blank1

blank2

blank3
```

The number of blanks inside the text must equal the number of entries inside correctAnswers.

This rule is mandatory.

---

# Matching

Canonical structure

```javascript
{

type:"matching",

instruction:"Połącz elementy.",

leftItems:[

"Mother",

"Brother",

"Sister"

],

rightItems:[

"brat",

"siostra",

"mama"

],

correctPairs:{

Mother:"mama",

Brother:"brat",

Sister:"siostra"

}

}
```

Rules

Every left item must exist inside correctPairs.

Every value inside correctPairs must exist inside rightItems.

No duplicated keys.

No duplicated values.

This is mandatory.

---

# Ordering

Canonical structure

```javascript
{

type:"ordering",

instruction:"Ułóż zdanie.",

items:[

"My",

"name",

"is",

"David"

],

correctOrder:[

"My",

"name",

"is",

"David"

]

}
```

Rules

Do not use numeric indexes.

Do not use object references.

correctOrder must contain text values.

Items and correctOrder must contain exactly the same number of elements.

---

# Exercise Validation Rules

The validator must reject any exercise if:

- correctAnswer is missing.
- options are empty.
- a blank has no answer.
- matching pairs are incomplete.
- ordering is inconsistent.
- duplicated correct pairs exist.
- nested arrays are detected.

No invalid exercise should be stored in Firestore.

# Writing Standard

Canonical structure

```javascript
writing:{

title:"",

description:"",

activities:[

]

}
```

Each writing activity

```javascript
{

instruction:"",

prompt:"",

guide:"",

minimumWords:30,

maximumWords:120,

suggestedTimeMinutes:10,

criteria:[

]

}
```

Rules

instruction

Polish

prompt

English

guide

Polish

criteria

Polish

minimumWords

Positive integer

maximumWords

Greater than minimumWords

Student answer

English

Writing is considered completed only after the student submits the answer and the minimum word requirement has been satisfied.

---

# Speaking Standard

Canonical structure

```javascript
speaking:{

title:"",

description:"",

activities:[

]

}
```

Each speaking activity

```javascript
{

instruction:"",

prompt:"",

guide:"",

minimumSeconds:5,

suggestedTimeMinutes:2,

criteria:[

]

}
```

Rules

instruction

Polish

prompt

English

guide

Polish

Student recording

English

minimumSeconds

Minimum 5

The lesson cannot be completed with recordings shorter than the configured minimum.

---

# Evaluation Standard

Canonical structure

```javascript
evaluation:{

title:"",

selfAssessment:"",

questions:[

]

}
```

Each evaluation question

```javascript
{

type:"multiple_choice",

question:"",

options:[

],

correctAnswer:"",

feedback:""

}
```

Rules

Question

English

Options

English

Correct Answer

English

Feedback

Polish

Every question must contain

question

options

correctAnswer

feedback

correctAnswer must exist inside options.

---

# Resources Standard

Canonical structure

```javascript
resources:[

{

title:"",

description:"",

type:"link",

url:""

}

]
```

Allowed resource types

```
link

video

pdf

audio

image

exercise
```

---

# Reflection Standard

Canonical structure

```javascript
reflection:""
```

Reflection is always written in Polish.

Its purpose is helping the student think about what has been learned.

---

# Audit Report

Canonical structure

```javascript
auditReport:{

cefrAlignment:"pending",

languageAccuracy:"pending",

culturalLocalization:"pending",

jsonValidation:"pending",

warnings:[

],

errors:[

]

}
```

The Quality Auditor is responsible for generating this section.

---

# Progress Standard

Firestore path

```
users/{userId}/progress/{levelId}_{lessonId}
```

Canonical structure

```javascript
{

userId:"",

levelId:"",

moduleId:"",

lessonId:"",

currentSectionIndex:0,

completedSections:[

],

activityResults:{},

skillScores:{},

overallScore:0,

progressPercentage:0,

completed:false,

startedAt:null,

completedAt:null,

updatedAt:null

}
```

---

# Scorable Sections

Only these sections contribute to the lesson score.

```
reading

practice

writing

speaking

evaluation
```

---

# Non-Scorable Sections

These sections contribute only to completion.

```
intro

vocabulary

grammar

resources

reflection
```

They must never decrease the lesson score.

---

# Overall Score Calculation

Overall Score must be calculated only from scorable sections.

Formula

```
Average(

reading,

practice,

writing,

speaking,

evaluation

)
```

Never include

```
intro

vocabulary

grammar

resources

reflection
```

in the score.

---

# Lesson Completion Rules

A lesson is completed only when

Reading completed

Practice completed

Writing completed

Speaking completed

Evaluation completed

and

All required sections have been completed.

---

# React Component Rules

Every React component should consume canonical fields.

Preferred

```javascript
lesson.reading

lesson.practice

lesson.writing

lesson.speaking
```

Temporary compatibility

```javascript
lesson.lectura

lesson.practica_interactiva

lesson.produccion_escrita

lesson.produccion_oral
```

No new component should depend on legacy names.

---

# Service Rules

Services should always return canonical objects.

React components should never normalize lesson data.

Normalization belongs to the service layer.

This keeps the UI simple and predictable.

---

# lessonNormalizer.js

A dedicated normalizer will convert old lessons into the canonical structure.

Responsibilities

Convert legacy names.

Populate missing properties.

Guarantee compatibility.

Return a complete lesson object.

Every consumer should receive the normalized lesson.

# AI Generation Rules

Every lesson generated by Artificial Intelligence must strictly follow this standard.

The generated response must contain only valid JSON.

The AI must never generate:

- Markdown
- HTML
- Explanations outside the JSON
- Comments
- Nested arrays
- Invalid property names

Only the official canonical structure is allowed.

---

# AI Content Rules

The AI must generate:

Learning content

English

Student prompts

English

Grammar explanations

Polish

Exercise instructions

Polish

Feedback

Polish

Vocabulary translations

Polish

Reflection

Polish

No Spanish content should be generated.

---

# AI Validation Rules

The lesson must be rejected if one or more of the following conditions exist.

Reading

- Missing questions
- Missing correctAnswer
- Empty options
- correctAnswer not present inside options

Multiple Choice

- Less than two options
- Duplicate options
- Missing correctAnswer

Fill Blank

- Missing correctAnswers
- Missing acceptedAnswers
- Number of blanks different from number of answers

Matching

- Missing leftItems
- Missing rightItems
- Missing correctPairs
- Missing pair
- Duplicate mappings

Ordering

- Missing correctOrder
- Different number of items
- Numeric indexes instead of text values

Writing

- Missing instruction
- Missing prompt
- Missing minimumWords

Speaking

- Missing instruction
- Missing prompt
- Missing minimumSeconds

Evaluation

- Missing questions
- Missing correctAnswer
- Missing feedback

If any validation fails, the lesson must not be stored.

---

# Quality Auditor Rules

The Quality Auditor is the final validation layer.

Its responsibilities are:

Validate JSON structure.

Validate mandatory fields.

Validate canonical names.

Validate CEFR consistency.

Validate exercise integrity.

Validate Firestore compatibility.

Reject incomplete lessons.

The auditor must never automatically repair a lesson.

It should reject invalid lessons and request regeneration.

---

# Firestore Rules

Every lesson stored in Firestore must already be normalized.

Firestore should never contain:

Legacy-only structures.

Mixed field names.

Nested arrays.

Duplicated identifiers.

Temporary compatibility fields are allowed only while migration is active.

---

# Component Responsibilities

Lesson Generator

Generate canonical lesson.

Lesson Normalizer

Normalize legacy lessons.

Lesson Validator

Validate lesson integrity.

Lesson Repository

Store lessons.

Course Service

Load normalized lessons.

Progress Service

Store student progress.

React Components

Render lessons only.

They should never normalize lesson data.

---

# Naming Convention

The following naming convention is mandatory.

Services

```
lessonService

courseService

progressService
```

Hooks

```
useLesson

useCourse

useProgress
```

Utilities

```
lessonNormalizer

lessonValidator

lessonMapper
```

Components

```
ReadingLesson

PracticeLesson

WritingLesson

SpeakingLesson

EvaluationLesson
```

Avoid creating new names for the same concept.

---

# Compatibility Policy

During migration, legacy field names may still exist.

However,

all new components,

new services,

new prompts,

new validators,

and future APIs

must exclusively use canonical field names.

Legacy compatibility should exist only inside the normalizer.

---

# Migration Strategy

Stage 1

Create the Lesson Data Standard.

Status

Completed.

---

Stage 2

Create lessonNormalizer.js.

Purpose

Convert legacy lessons into canonical lessons.

---

Stage 3

Update Services.

Services must return normalized lessons.

---

Stage 4

Update React Components.

Components consume only canonical properties.

---

Stage 5

Update AI.

AI generates canonical lessons directly.

---

Stage 6

Remove Legacy Compatibility.

Delete obsolete mappings.

Delete Spanish field names.

Delete temporary compatibility code.

---

# Long-Term Goal

Every lesson in the platform should eventually follow exactly the same internal structure.

The internal model should remain stable even if:

New learning languages are added.

The user interface changes.

The AI provider changes.

Firestore evolves.

The frontend is rewritten.

The standard should remain unchanged.

---

# Versioning Policy

Every structural modification must increment the schema version.

Example

```
1.0.0

↓

1.1.0

↓

2.0.0
```

Major versions indicate breaking changes.

Minor versions indicate backward-compatible improvements.

Patch versions indicate corrections without structural impact.

---

# Final Principle

There should be only one official lesson model inside the project.

All components,

services,

AI agents,

validators,

repositories,

and future APIs

must follow this document.

This document is the official technical specification for lesson data in the Polish-learning platform.

---

**Document Version**

```
Lesson Data Standard v1.0
```

**Status**

```
Official
```

**Project**

```
Polish-learning
```

**Architecture**

```
Firebase + React + Gemini AI + CEFR
```

**Maintained by**

```
Polish-learning Development Team
```