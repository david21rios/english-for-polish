# Domain Version

```text
Domain Version: 1.0.0
Status: Frozen
Architecture Freeze: Approved
Freeze Phase: SaaS-01B.7D
Freeze Date: 2026-07-31
```

## 1. Dominios congelados

- Organization
- Academic
- Identity
- Authorization
- Workflow
- Relationship Model

## 2. Entidades y Value Objects incluidos

- Tenant
- TenantSettings
- TenantBranding
- Identity
- RegistrationRequest
- Membership
- Course
- Enrollment
- RegistrationPolicy, como Value Object compuesto de TenantSettings y no como
  entidad independiente.

## 3. Contratos oficiales

### Fuentes de dominio

- `src/domain/organization/`
- `src/domain/academic/`
- `src/domain/identity/`
- `src/domain/authorization/`
- `src/domain/workflow/`

### Documentos oficiales

- `src/docs/DOMAIN_MODEL_ORGANIZATION.md`
- `src/docs/DOMAIN_MODEL_ACADEMIC.md`
- `src/docs/DOMAIN_MODEL_IDENTITY.md`
- `src/docs/DOMAIN_MODEL_AUTHORIZATION.md`
- `src/docs/DOMAIN_WORKFLOW.md`
- `src/docs/DOMAIN_RELATIONSHIP_MODEL.md`
- `src/docs/ARCHITECTURE_FREEZE_REVIEW.md`
- `src/docs/DOMAIN_VERSION.md`

## 4. Reglas de evolución

Todo cambio posterior debe clasificarse como:

```text
Non-breaking change
Breaking change
```

Todo cambio contractual debe:

1. incluir justificación y clasificación;
2. registrar el impacto sobre consumidores y migraciones;
3. actualizar la versión del dominio;
4. pasar por reconciliación arquitectónica;
5. actualizar la documentación oficial;
6. revisar persistencia, autorización y workflows afectados.

No se pueden modificar silenciosamente contratos, enums, estados,
cardinalidades, ownership, capabilities o invariantes congeladas.

## 5. Architecture Review Backlog transferido a SaaS-02

Los siguientes elementos son no bloqueantes porque su resolución técnica no
cambia el significado del dominio 1.0.0:

- autoridad técnica de `platform_system`;
- diseño físico de IDs;
- estructura de colecciones;
- materialización de TenantSettings y TenantBranding;
- índices;
- consultas;
- atomicidad tecnológica;
- transacciones;
- reglas de seguridad;
- tratamiento técnico de Enrollment ante Course archivado.

## 6. Autorización de siguiente etapa

```text
SaaS-01B closed.
Domain 1.0.0 frozen.
Ready to design SaaS-02.
SaaS-02 not started.
```
