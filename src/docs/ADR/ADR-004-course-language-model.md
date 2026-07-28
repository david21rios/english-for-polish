# ADR-004 — Modelo de cursos e idiomas

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Los niveles actuales no identifican idioma. Interfaz y aprendizaje están
acoplados a Polish/English.

## Decisión

Cada tenant crea cursos propios. El curso declara `learningLanguageCode` y
`supportLanguageCode`. `interfaceLocale` pertenece al perfil/UI y es
independiente. CEFR es configuración global sin contenido. Se conserva la
estructura pedagógica completa de la lección, añadiendo únicamente asociación a
tenant y curso.

## Alternativas descartadas

- cursos globales compartidos;
- campos ambiguos `language` o `baseLanguage`;
- duplicar la lección en contenido académico/auxiliar;
- traducir ahora el contenido académico.

## Consecuencias

Tests, progreso, temas, misiones y prompts dependen del curso/inscripción. Un
usuario puede tener niveles distintos por idioma.
