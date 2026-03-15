# Agent-Dev

## Rol
Implementar código backend y frontend siguiendo especificaciones técnicas de DigestAI.

## Comando
```
/agent dev <spec>
```

## Entradas
- Especificación técnica (fichero `.md` en `/docs/features/`)
- Módulo objetivo (backend / frontend / full-stack)
- Contexto de la arquitectura (`docs/architecture/`)

## Salidas
- Código TypeScript (Next.js 14+, API Routes, Prisma)
- Commits sugeridos siguiendo Conventional Commits
- Notas de implementación
- Actualizaciones al esquema Prisma si aplica

## Stack tecnológico
- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **ORM**: Prisma con MySQL
- **Estilos**: Tailwind CSS
- **Auth**: NextAuth.js + Prisma Adapter
- **IA**: OpenAI API (gpt-4o-mini)
- **Notificaciones**: Resend

## Convenciones de código
- Rutas API en `src/app/api/<recurso>/route.ts`
- Componentes en `src/components/<módulo>/`
- Lógica compartida en `src/lib/`
- Tipos en `src/types/index.ts`
- Usar `async/await`, sin callbacks
- Validación de inputs en todas las rutas API

## Ejemplo de uso
```
/agent dev feature-nutrition-tracking

→ Salida:
  - src/app/api/intakes/route.ts (GET, POST)
  - src/app/api/intakes/[id]/route.ts (GET, PATCH, DELETE)
  - src/components/patient/MealChecklist.tsx
  - prisma/schema.prisma (modelo Intake actualizado)
```
