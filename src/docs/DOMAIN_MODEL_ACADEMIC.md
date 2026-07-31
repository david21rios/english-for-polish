# Modelo de dominio académico

## 1. Objetivo

Este documento define los contratos académicos puros de MiPyMeTIC. No define
Firebase, persistencia, autenticación, autorización, React, repositorios,
progreso ni contenido pedagógico.

El alcance se limita a `Course`, `Enrollment`, `CEFRLevel`,
`LearningLanguage`, `InterfaceLanguage`, `CourseStatus` y `EnrollmentStatus`.

## 2. Convenciones

- Los identificadores son strings opacos y estables.
- `tenantId` es la única frontera organizacional.
- Los timestamps son strings UTC ISO 8601.
- Los códigos y locales lingüísticos usan BCP 47.
- Los contratos describen datos; no ejecutan transiciones ni conceden acceso.
- LearningLanguage e InterfaceLanguage son conceptos independientes.
- El código del idioma aprendido, el idioma pedagógico de soporte y el locale
  de interfaz son conceptos independientes.

## 3. Enums

### 3.1 CEFRLevel

El enum contiene exactamente:

```text
A1
A2
B1
B2
C1
C2
```

No contiene niveles internos, porcentajes ni resultados diagnósticos.

### 3.2 CourseStatus

| Valor | Significado |
|---|---|
| `draft` | Curso en preparación, todavía no operativo para inscripciones ordinarias |
| `active` | Curso operativo dentro de su tenant |
| `archived` | Curso retirado de operación, conservado para historial |

El estado no contiene estadísticas ni determina por sí solo autorización.

### 3.3 EnrollmentStatus

| Valor | Significado |
|---|---|
| `pending` | Inscripción creada, pendiente de activación |
| `active` | Inscripción operativa |
| `completed` | Participación académica finalizada |
| `cancelled` | Inscripción cancelada sin eliminar su registro |

Transiciones permitidas:

| Desde | Hacia |
|---|---|
| `pending` | `active`, `cancelled` |
| `active` | `completed`, `cancelled` |
| `completed` | ninguna |
| `cancelled` | ninguna |

Una nueva participación después de `completed` o `cancelled` requiere una
decisión posterior sobre reactivación o nueva Enrollment; esta fase no la
implementa.

## 4. Contratos

### 4.1 LearningLanguage

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `languageCode` | string | sí | Código BCP 47 del idioma aprendido |
| `displayName` | string | sí | Nombre legible del idioma |

El catálogo no queda limitado a los idiomas existentes actualmente.

### 4.2 InterfaceLanguage

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `locale` | string | sí | Locale BCP 47 de la interfaz |
| `displayName` | string | sí | Nombre legible del locale |

InterfaceLanguage controla exclusivamente navegación y producto. No define el
idioma aprendido, el contenido académico ni el nivel CEFR.

### 4.3 Course

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `courseId` | string | sí | Identificador opaco del curso |
| `tenantId` | string | sí | Tenant propietario |
| `displayName` | string | sí | Nombre visible del curso |
| `description` | string | sí | Descripción institucional |
| `learningLanguage` | LearningLanguage | sí | Idioma enseñado |
| `supportLanguageCode` | string | sí | Código canónico del idioma pedagógico de apoyo |
| `interfaceLanguages` | InterfaceLanguage[] readonly | sí | Locales de interfaz disponibles |
| `cefrLevel` | CEFRLevel | sí | Nivel académico del curso |
| `status` | CourseStatus | sí | Estado operativo |
| `createdAt` | string | sí | Timestamp UTC ISO 8601 |
| `updatedAt` | string | sí | Timestamp UTC ISO 8601 |

`interfaceLanguages` es un catálogo informativo de disponibilidad. No elige la
preferencia del usuario, no restringe automáticamente LearningLanguage y no
sustituye `interfaceLocale` del perfil/UI.

`learningLanguage.languageCode` expresa el `learningLanguageCode` conceptual:
el idioma aprendido. `supportLanguageCode` expresa el idioma utilizado para
explicaciones, instrucciones, ayudas, feedback y contenido de apoyo.
`interfaceLocale` pertenece a la presentación de la interfaz y no forma parte
del contrato Course.

Ejemplos conceptuales válidos:

```text
learningLanguage.languageCode = en
supportLanguageCode = pl
```

```text
learningLanguage.languageCode = en
supportLanguageCode = es
```

La representación contractual canónica es una etiqueta BCP 47. Esta decisión
no define almacenamiento, validación runtime, normalización automática ni un
catálogo persistido.

Course no contiene módulos, lecciones, progreso, profesores, estudiantes ni
estadísticas.

### 4.4 Enrollment

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `enrollmentId` | string | sí | Identificador opaco de inscripción |
| `tenantId` | string | sí | Tenant común de Membership y Course |
| `membershipId` | string | sí | Referencia a Membership del mismo tenant |
| `courseId` | string | sí | Referencia a Course del mismo tenant |
| `status` | EnrollmentStatus | sí | Estado de inscripción |
| `enrolledAt` | string | sí | Inicio UTC ISO 8601 |
| `updatedAt` | string | sí | Última actualización UTC ISO 8601 |

Enrollment no contiene progreso, calificaciones, asistencia ni
certificaciones.

## 5. Relaciones e invariantes

1. Un Course pertenece exactamente a un Tenant.
2. Un Tenant puede tener múltiples Courses.
3. Una Membership puede estar inscrita en múltiples Courses.
4. Un Course puede tener múltiples Enrollments.
5. Enrollment nunca existe sin una Membership válida.
6. Enrollment nunca existe sin un Course válido.
7. Enrollment, Membership y Course comparten exactamente el mismo `tenantId`.
8. El idioma aprendido nunca determina automáticamente el idioma de interfaz.
9. El idioma de interfaz nunca modifica automáticamente el idioma aprendido.
10. El idioma pedagógico de soporte no determina el idioma aprendido ni el
    locale de interfaz.
11. `cefrLevel` pertenece al Course, no al estudiante ni a Enrollment.
12. `Enrollment.membershipId` referencia exactamente el
    `Membership.membershipId` correspondiente.
13. Enrollment y su Membership comparten el mismo `tenantId`.
14. Archivar un Course no elimina sus Enrollments.
15. Completar o cancelar Enrollment no elimina Membership ni Course.

## 6. Decisiones tomadas

- Course es privado y propiedad de un único Tenant.
- LearningLanguage usa `languageCode`; InterfaceLanguage usa `locale`.
- Course incorpora `supportLanguageCode` como idioma pedagógico de apoyo.
- Ambos contratos lingüísticos pueden combinarse libremente.
- `interfaceLanguages` no es la preferencia efectiva de interfaz.
- CEFR usa exclusivamente los seis niveles oficiales solicitados.
- Enrollment representa relación académica, no Membership ni progreso.
- Las transiciones son tablas declarativas inmutables.
- Los timestamps son independientes de Firebase.

## 7. Decisiones pendientes

- persistencia y paths;
- validadores y normalizadores runtime;
- formato físico y generación de los identificadores;
- unicidad y política de reinscripción;
- actores autorizados para transiciones;
- transición y política de archivado de Course;
- catálogo central de idiomas y traducción de sus nombres;
- validación y normalización automática de etiquetas BCP 47;
- selección y persistencia de `interfaceLocale` del usuario;
- módulos, lecciones, progreso, tests y asignaciones docentes.

Estas decisiones no deben inferirse ni implementarse desde estos contratos.
