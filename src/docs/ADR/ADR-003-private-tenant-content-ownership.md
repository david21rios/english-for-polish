# ADR-003 — Aislamiento y propiedad del contenido

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

El contenido actual reside en colecciones globales. El SaaS debe garantizar
privacidad y propiedad organizacional.

## Decisión

Todo contenido académico, generado, importado, foro y archivo es privado y
propiedad del tenant. Los actores sólo aportan trazabilidad. La plataforma no
permite listar, editar ni copiar contenido entre tenants.

## Alternativas descartadas

- catálogo académico global compartido;
- propiedad del usuario creador;
- aislamiento sólo en UI.

## Consecuencias

Las rutas, rules, Storage, servicios, backend y pruebas deben validar tenant.
Retirar una membresía no elimina contenido. Exportación, retención y borrado se
gestionan por tenant.
