import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPABILITY_IDS,
  CEFR_LEVELS,
  COMMAND_TYPES,
  COURSE_STATUSES,
  CREATE_COURSE_AUDIT_AFTER_FIELDS,
  CREATE_COURSE_AUDIT_BEFORE_FIELDS,
  CREATE_COURSE_AUDIT_LEVEL,
  CREATE_COURSE_AUDIT_METADATA_FIELDS,
  CREATE_COURSE_AUDIT_OPERATION,
  CREATE_COURSE_AUDIT_RESULT,
  CREATE_COURSE_INITIAL_STATUS,
  CREATE_COURSE_INPUT_FIELDS,
  CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS,
  CREATE_COURSE_LEARNING_LANGUAGE_FIELDS,
  CREATE_COURSE_OPERATION,
  CREATE_COURSE_REQUIRED_CAPABILITY,
  CREATE_COURSE_RESOURCE_TYPE,
  CREATE_COURSE_RESULT_FIELDS,
  createCourseBehavioralPayload,
  isPrivilegedCommandStageAllowed,
  validateCreateCourseInput,
  validateCreateCourseResult,
} from "../src/index.js";

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  courseId: "course-1",
  displayName: "English A1",
  description: "Introductory English course",
  learningLanguage: Object.freeze({
    languageCode: "en",
    displayName: "English",
  }),
  supportLanguageCode: "pl",
  interfaceLanguages: Object.freeze([
    Object.freeze({
      locale: "pl",
      displayName: "Polski",
    }),
    Object.freeze({
      locale: "en",
      displayName: "English",
    }),
  ]),
  cefrLevel: "A1",
});

test("CreateCourse command identity is exact", () => {
  assert.equal(
    COMMAND_TYPES.CREATE_COURSE,
    "CreateCourse",
  );

  assert.equal(
    CREATE_COURSE_OPERATION,
    "CreateCourse",
  );

  assert.equal(
    CREATE_COURSE_RESOURCE_TYPE,
    "course",
  );

  assert.equal(
    CREATE_COURSE_INITIAL_STATUS,
    COURSE_STATUSES.DRAFT,
  );

  assert.equal(
    CREATE_COURSE_REQUIRED_CAPABILITY,
    CAPABILITY_IDS.COURSE_CREATE,
  );

  assert.equal(
    CREATE_COURSE_REQUIRED_CAPABILITY,
    "course.create",
  );
});

test("CreateCourse runtime stage authorization remains closed", () => {
  for (const stage of [
    "not_started",
    "prepared",
    "completed",
  ]) {
    assert.equal(
      isPrivilegedCommandStageAllowed(
        COMMAND_TYPES.CREATE_COURSE,
        stage,
      ),
      false,
      stage,
    );
  }
});

test("CreateCourse exact field constants are frozen", () => {
  assert.deepEqual(
    CREATE_COURSE_INPUT_FIELDS,
    [
      "commandId",
      "correlationId",
      "tenantId",
      "courseId",
      "displayName",
      "description",
      "learningLanguage",
      "supportLanguageCode",
      "interfaceLanguages",
      "cefrLevel",
    ],
  );

  assert.deepEqual(
    CREATE_COURSE_LEARNING_LANGUAGE_FIELDS,
    [
      "languageCode",
      "displayName",
    ],
  );

  assert.deepEqual(
    CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS,
    [
      "locale",
      "displayName",
    ],
  );

  assert.deepEqual(
    CREATE_COURSE_RESULT_FIELDS,
    [
      "commandId",
      "correlationId",
      "operation",
      "resourceType",
      "resourceId",
      "status",
      "replayed",
    ],
  );

  assert.equal(
    Object.isFrozen(CREATE_COURSE_INPUT_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(
      CREATE_COURSE_LEARNING_LANGUAGE_FIELDS,
    ),
    true,
  );

  assert.equal(
    Object.isFrozen(
      CREATE_COURSE_INTERFACE_LANGUAGE_FIELDS,
    ),
    true,
  );
});

test("CreateCourse valid input passes", () => {
  assert.equal(
    validateCreateCourseInput(validInput).ok,
    true,
  );
});

test("CreateCourse rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
    "courseId",
  ]) {
    assert.equal(
      validateCreateCourseInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("CreateCourse rejects forbidden or unknown top-level fields", () => {
  for (const field of [
    "actorUid",
    "membershipId",
    "status",
    "createdAt",
    "updatedAt",
    "archivedAt",
    "authority",
    "role",
    "capability",
  ]) {
    assert.equal(
      validateCreateCourseInput({
        ...validInput,
        [field]: "forbidden",
      }).ok,
      false,
      field,
    );
  }
});

test("CreateCourse requires non-empty trimmed text", () => {
  for (const patch of [
    { displayName: "" },
    { displayName: " padded " },
    { description: "" },
    { description: " padded " },
  ]) {
    assert.equal(
      validateCreateCourseInput({
        ...validInput,
        ...patch,
      }).ok,
      false,
      JSON.stringify(patch),
    );
  }
});

test("CreateCourse learningLanguage shape is exact", () => {
  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      learningLanguage: {
        languageCode: "en",
        displayName: "English",
      },
    }).ok,
    true,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      learningLanguage: {
        languageCode: "EN",
        displayName: "English",
      },
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      learningLanguage: {
        languageCode: "en",
        displayName: "English",
        extra: true,
      },
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      learningLanguage: {
        languageCode: "en",
      },
    }).ok,
    false,
  );
});

test("CreateCourse supportLanguageCode must be canonical BCP47", () => {
  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      supportLanguageCode: "pl",
    }).ok,
    true,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      supportLanguageCode: "PL",
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      supportLanguageCode: "not_a_locale",
    }).ok,
    false,
  );
});

test("CreateCourse interfaceLanguages are non-empty exact unique canonical values", () => {
  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      interfaceLanguages: [],
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      interfaceLanguages: [
        {
          locale: "pl",
          displayName: "Polski",
          extra: true,
        },
      ],
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      interfaceLanguages: [
        {
          locale: "PL",
          displayName: "Polski",
        },
      ],
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      interfaceLanguages: [
        {
          locale: "pl",
          displayName: "Polski",
        },
        {
          locale: "pl",
          displayName: "Polish",
        },
      ],
    }).ok,
    false,
  );

  const sparse = new Array(2);
  sparse[0] = {
    locale: "pl",
    displayName: "Polski",
  };

  assert.equal(
    validateCreateCourseInput({
      ...validInput,
      interfaceLanguages: sparse,
    }).ok,
    false,
  );
});

test("CreateCourse CEFR level must be exact package enum", () => {
  for (const level of Object.values(CEFR_LEVELS)) {
    assert.equal(
      validateCreateCourseInput({
        ...validInput,
        cefrLevel: level,
      }).ok,
      true,
      level,
    );
  }

  for (const level of [
    "a1",
    "A0",
    "C3",
    "",
    null,
  ]) {
    assert.equal(
      validateCreateCourseInput({
        ...validInput,
        cefrLevel: level,
      }).ok,
      false,
      String(level),
    );
  }
});

test("CreateCourse behavioral payload is exact and deeply detached", () => {
  const mutableInput = {
    commandId: "command-1",
    correlationId: "correlation-1",
    tenantId: "tenant-1",
    courseId: "course-1",
    displayName: "English A1",
    description: "Introductory English course",
    learningLanguage: {
      languageCode: "en",
      displayName: "English",
    },
    supportLanguageCode: "pl",
    interfaceLanguages: [
      {
        locale: "pl",
        displayName: "Polski",
      },
      {
        locale: "en",
        displayName: "English",
      },
    ],
    cefrLevel: "A1",
  };

  const payload =
    createCourseBehavioralPayload(mutableInput);

  assert.deepEqual(
    payload,
    {
      tenantId: "tenant-1",
      courseId: "course-1",
      displayName: "English A1",
      description: "Introductory English course",
      learningLanguage: {
        languageCode: "en",
        displayName: "English",
      },
      supportLanguageCode: "pl",
      interfaceLanguages: [
        {
          locale: "pl",
          displayName: "Polski",
        },
        {
          locale: "en",
          displayName: "English",
        },
      ],
      cefrLevel: "A1",
      initialStatus: "draft",
    },
  );

  assert.equal(
    Object.hasOwn(payload, "commandId"),
    false,
  );

  assert.equal(
    Object.hasOwn(payload, "correlationId"),
    false,
  );

  assert.equal(
    Object.hasOwn(payload, "actorUid"),
    false,
  );

  assert.equal(
    Object.hasOwn(payload, "membershipId"),
    false,
  );

  assert.equal(
    Object.isFrozen(payload),
    true,
  );

  assert.equal(
    Object.isFrozen(payload.learningLanguage),
    true,
  );

  assert.equal(
    Object.isFrozen(payload.interfaceLanguages),
    true,
  );

  assert.equal(
    Object.isFrozen(payload.interfaceLanguages[0]),
    true,
  );

  assert.notEqual(
    payload.learningLanguage,
    mutableInput.learningLanguage,
  );

  assert.notEqual(
    payload.interfaceLanguages,
    mutableInput.interfaceLanguages,
  );

  assert.notEqual(
    payload.interfaceLanguages[0],
    mutableInput.interfaceLanguages[0],
  );

  mutableInput.learningLanguage.displayName =
    "Changed";

  mutableInput.interfaceLanguages[0].displayName =
    "Changed";

  assert.equal(
    payload.learningLanguage.displayName,
    "English",
  );

  assert.equal(
    payload.interfaceLanguages[0].displayName,
    "Polski",
  );
});

test("CreateCourse behavioral payload rejects invalid command input", () => {
  assert.throws(
    () =>
      createCourseBehavioralPayload({
        ...validInput,
        status: "draft",
      }),
    TypeError,
  );
});

test("CreateCourse result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "CreateCourse",
    resourceType: "course",
    resourceId: "course-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(
    validateCreateCourseResult(result).ok,
    true,
  );

  assert.equal(
    validateCreateCourseResult({
      ...result,
      operation: "Other",
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseResult({
      ...result,
      resourceType: "tenant",
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseResult({
      ...result,
      resourceId: "../bad",
    }).ok,
    false,
  );

  assert.equal(
    validateCreateCourseResult({
      ...result,
      membershipId: "membership-1",
    }).ok,
    false,
  );
});

test("CreateCourse audit contract is exact and excludes raw domain values", () => {
  assert.equal(
    CREATE_COURSE_AUDIT_OPERATION,
    "CreateCourse.create",
  );

  assert.equal(
    CREATE_COURSE_AUDIT_LEVEL,
    "privileged",
  );

  assert.equal(
    CREATE_COURSE_AUDIT_RESULT,
    "succeeded",
  );

  assert.deepEqual(
    CREATE_COURSE_AUDIT_BEFORE_FIELDS,
    [
      "courseExists",
    ],
  );

  assert.deepEqual(
    CREATE_COURSE_AUDIT_AFTER_FIELDS,
    [
      "courseStatus",
    ],
  );

  assert.deepEqual(
    CREATE_COURSE_AUDIT_METADATA_FIELDS,
    [
      "stage",
    ],
  );

  const auditFields = [
    ...CREATE_COURSE_AUDIT_BEFORE_FIELDS,
    ...CREATE_COURSE_AUDIT_AFTER_FIELDS,
    ...CREATE_COURSE_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "displayName",
    "description",
    "learningLanguage",
    "languageCode",
    "supportLanguageCode",
    "interfaceLanguages",
    "locale",
    "cefrLevel",
    "actorUid",
    "membershipId",
  ]) {
    assert.equal(
      auditFields.includes(forbidden),
      false,
      forbidden,
    );
  }
});
