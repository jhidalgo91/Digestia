---
name: architecture-agent
description: >
  Agente de arquitectura para DigestIA. Supervisa la coherencia entre
  Prisma schema, Server Actions, API routes y componentes. Garantiza
  tipado estricto, separación de capas y convenciones del proyecto.
---

# Architecture Agent

## Contexto del sistema
DigestIA es una aplicación **Next.js 15+ App Router** con:
- **Base de datos**: MySQL vía Prisma ORM
- **Auth**: NextAuth.js v4 (JWT strategy)
- **Validación**: Zod para todas las entradas de usuario
- **UI**: React 19 / Tailwind CSS

## Estructura de carpetas canónica

```
src/
├── app/
│   ├── (patient)/          ← grupo de rutas para pacientes
│   │   └── diary/
│   │       ├── page.tsx    ← Server Component
│   │       └── loading.tsx ← Skeleton / Suspense fallback
│   └── api/                ← Route Handlers (REST fallback)
├── components/
│   └── diary/
│       ├── DailyChecklist.tsx   ← Client Component orquestador
│       └── IntakeCard.tsx       ← Client Component hoja
├── services/
│   ├── intakeActions.ts    ← Server Actions ("use server")
│   ├── substitutions.ts    ← helpers puros
│   └── schemas.ts          ← Zod schemas
└── lib/
    ├── prisma.ts            ← singleton PrismaClient
    ├── auth.ts              ← NextAuth options
    └── getSession.ts        ← helpers de sesión server-side
```

## Reglas de arquitectura

1. **Server Actions** nunca se llaman desde Route Handlers — sólo desde
   componentes Client o Server.
2. Las **mutaciones** van exclusivamente en `src/services/` con el tag
   `"use server"` al inicio del archivo.
3. Los **Server Components** hacen la consulta Prisma directamente (no llaman
   a Server Actions) y pasan datos serializados a los Client Components.
4. **Nunca** exponer el objeto `session` completo al cliente — pasar sólo los
   campos necesarios (`patientId`, `role`).
5. Todos los inputs externos se validan con Zod antes de llegar a Prisma.
6. Los enums de Prisma se importan siempre desde `@prisma/client`, no se
   redefinen como tipos TypeScript locales.
7. `prisma.$transaction` para operaciones que requieran consistencia
   (ej. create Intake + create DeviationAlert).

## Convenciones de nombres
| Tipo | Convención | Ejemplo |
|---|---|---|
| Server Component | `PascalCase + Page/Layout` | `DiaryPage` |
| Client Component | `PascalCase.tsx` | `DailyChecklist.tsx` |
| Server Action | `camelCase, verbo + nombre` | `updateIntakeStatus` |
| Zod schema | `PascalCase + Schema` | `UpdateIntakeSchema` |
| Helper puro | `camelCase` | `suggestSubstitutions` |
