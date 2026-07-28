# ADR-001 — Uso de tenantId como frontera organizacional

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

La plataforma atenderá universidades y otros tipos de organizaciones. El
contrato `institutionId` limita el dominio y las colecciones actuales son
globales.

## Decisión

Utilizar `tenantId` como frontera técnica en rutas, documentos, repositorios,
reglas, Storage, backend, navegación, auditoría y pruebas. Cada tenant declara
`tenantType`. Los datos privados usarán preferentemente un subárbol
`tenants/{tenantId}`.

## Alternativas descartadas

- `institutionId`: demasiado específico.
- proyecto Firebase por organización: carga operativa desproporcionada para la
  fase inicial.
- sólo colecciones raíz con filtro `tenantId`: riesgo elevado de omitir filtros.

## Consecuencias

Todas las APIs privadas exigirán tenant explícito. Los campos legacy se
adaptarán temporalmente. La UI podrá decir universidad o institución sin cambiar
el contrato.
