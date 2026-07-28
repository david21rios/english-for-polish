# ADR-008 — Estrategia de migración y cutover

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Un snapshot y dual-read no capturan escrituras concurrentes. Progreso, tests,
misiones, foro y archivos pueden cambiar durante una migración.

## Decisión

Para el tamaño actual del piloto se utilizará una ventana corta de
mantenimiento por dominio:

1. snapshot verificable;
2. bloqueo temporal de escrituras del dominio;
3. migración del delta final;
4. reconciliación de IDs, referencias, conteos y hashes;
5. cambio coordinado de reglas y consumidores;
6. smoke tests;
7. reapertura de escrituras.

Los scripts serán idempotentes, reanudables y auditables. La lectura legacy
podrá mantenerse como fallback temporal, pero no se confundirá con captura de
escrituras. Los datos legacy no se eliminan hasta completar la ventana de
observación y aprobación.

Storage conserva blobs legacy, registra `legacyStoragePath`, intenta primero la
ruta nueva y usa fallback legacy durante una ventana controlada. No se asumen
redirects transparentes.

## Alternativas descartadas

- migración online basada sólo en snapshot;
- dual-read como sustituto de captura de cambios;
- dual-write no idempotente;
- eliminación inmediata de datos o blobs legacy.

Dual-write idempotente o CDC quedan como alternativa futura si no se pudiera
usar mantenimiento.

## Consecuencias

Cada dominio necesita una política de bloqueo, reconciliación, smoke test y
rollback. Progreso no se migra antes de mappings de contenido e inscripciones.
La retirada legacy pertenece a la fase 12.
