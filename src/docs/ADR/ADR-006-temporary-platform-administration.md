# ADR-006 — Administración global temporal

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Dos correos en `DEFAULT_ADMINS` reciben hoy rol administrativo. Debe preservarse
acceso durante el bootstrap sin convertir la lista en autorización SaaS.

## Decisión

Conservar temporalmente la constante sólo como puente. No generará memberships
ni acceso implícito a tenants. Migrar ambos usuarios a `platform_admin` mediante
un bootstrap administrativo out-of-band.

El bootstrap:

- será un script de un solo uso ejecutado fuera del navegador con Admin SDK;
- recibirá una lista explícita de UID y correo verificado;
- comprobará que todavía no existe ningún `platform_admin`;
- comprobará que UID, correo normalizado y verificación de Firebase
  Authentication coinciden;
- asignará el custom claim y el registro persistido global restringido;
- generará un evento de auditoría de plataforma;
- será inutilizado o retirado después de verificar el acceso y recuperación.

Durante la transición, `david.rios0627@gmail.com` y
`wilsonriosv@gmail.com` pueden conservar el acceso administrativo legacy. No
pueden ejecutar el bootstrap desde el cliente ni convertirse automáticamente en
miembros de todos los tenants.

Después del bootstrap inicial, las operaciones ordinarias de administración
global exigirán `platform_admin`. `DEFAULT_ADMINS` se eliminará antes de
producción SaaS, una vez verificadas ambas cuentas, el procedimiento de
recuperación y las pruebas de autorización.

## Alternativas descartadas

- mantener emails hardcodeados;
- crear membresía admin en todos los tenants;
- permitir que el cliente escriba el rol global.

## Consecuencias

El bootstrap será auditado, recuperable y de duración limitada. La eliminación
ocurre tras verificar ambas cuentas y las pruebas de acceso/recuperación. No
existe una dependencia circular en la que crear el primer `platform_admin`
requiera que ya exista uno. El rol global tampoco concede acceso automático al
contenido privado de ningún tenant.
