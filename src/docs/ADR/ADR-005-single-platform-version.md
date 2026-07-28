# ADR-005 — Estrategia de versión única

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Mantener forks o versiones congeladas por tenant multiplicaría deuda y
vulnerabilidades.

## Decisión

MiPyMeTIC opera una sola versión para todos los tenants. Utiliza versionado
semántico, migraciones expand/migrate/contract, feature flags temporales,
despliegue gradual, ventanas comunicadas, validación posterior y rollback.

## Alternativas descartadas

- fork por universidad;
- versión indefinidamente congelada;
- migraciones destructivas junto al despliegue.

## Consecuencias

Los cambios deben ser compatibles durante la migración. Los flags tienen dueño
y expiración. Un canary por tenant es temporal y no crea líneas de producto.
