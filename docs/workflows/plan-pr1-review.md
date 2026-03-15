# Plan de Acción – Revisión PR #1 DigestAI

> **Comando:** `/plan Revisar PR #1 de DigestAI`
> **PR:** [#1 – Initialize DigestAI](https://github.com/jhidalgo91/Digestia/pull/1)
> **Estado:** Draft · 51 archivos · +9 930 / -2 líneas
> **Fecha:** 2026-03-15

---

## 1. Problemas Críticos (CI, Firewall, Build)

### 1.1 Firewall bloquea `checkpoint.prisma.io`

| Severidad | Impacto | Acción |
|-----------|---------|--------|
| 🔴 Crítico | El paso `prisma generate` falla en CI | Añadir `CHECKPOINT_DISABLE=1` como variable de entorno en el workflow |

**Causa raíz:** Prisma 5 intenta contactar `checkpoint.prisma.io` al ejecutarse para enviar telemetría de versión. El entorno de Copilot Coding Agent bloquea ese dominio por política de firewall.

**Fix implementado:** Variable de entorno `CHECKPOINT_DISABLE=1` en `.github/workflows/ci.yml`.

```yaml
env:
  CHECKPOINT_DISABLE: "1"
```

### 1.2 Firewall bloquea `fonts.googleapis.com`

| Severidad | Impacto | Acción |
|-----------|---------|--------|
| 🔴 Crítico | `next build` falla al intentar descargar fuentes | Eliminar referencias a fuentes de Google / configurar fuentes locales |

**Causa raíz:** `src/app/globals.css` referencia las variables `--font-geist-sans` y `--font-geist-mono` que no están definidas. Next.js puede intentar resolverlas desde CDN durante el build estático.

**Fix implementado:** Eliminar las referencias a variables de fuente no definidas en `globals.css` y usar `font-family` directo.

### 1.3 Build falla sin base de datos MySQL

| Severidad | Impacto | Acción |
|-----------|---------|--------|
| 🟠 Alto | `prisma generate` y las páginas que usan Prisma Client fallan en CI sin `DATABASE_URL` real | Añadir variable `DATABASE_URL` mockeada para CI + usar `prisma generate` separado del `build` |

**Fix implementado:** CI workflow con variable `DATABASE_URL` de mock y paso explícito de `prisma generate` antes del build.

---

## 2. Riesgos Técnicos (Prisma, Migrations, Dependencias)

### 2.1 Sin sistema de migraciones (sólo `prisma db push`)

| Severidad | Riesgo |
|-----------|--------|
| 🟠 Alto | `prisma db push` no genera historial de cambios. En producción cualquier cambio de schema puede borrar datos. |

**Acción recomendada:**
- Reemplazar `db:migrate` por `prisma migrate dev` (ya está en `package.json`)
- Crear directorio `prisma/migrations/` con migración inicial
- Prohibir `prisma db push` en entornos que no sean desarrollo local

### 2.2 Inconsistencias de versiones en documentación

| Documento | Versión documentada | Versión real (`package.json`) |
|-----------|--------------------|-----------------------------|
| `docs/architecture/overview.md` | Next.js 14+ | **16.1.6** |
| `docs/architecture/overview.md` | Prisma 6+ | **5.22.0** |
| `docs/architecture/overview.md` | NextAuth.js 5 | **4.24.13** |
| `docs/architecture/overview.md` | Zod 3+ | **4.3.6** |
| `docs/architecture/overview.md` | Resend 4+ | **6.9.3** |

**Fix implementado:** Actualizar tabla de versiones en `docs/architecture/overview.md`.

### 2.3 Incompatibilidad `@auth/prisma-adapter` v2 con NextAuth v4

| Severidad | Riesgo |
|-----------|--------|
| 🟠 Alto | `@auth/prisma-adapter@^2` es para NextAuth v5 (Auth.js). Con `next-auth@^4` puede causar errores en runtime. |

**Acción recomendada (futuro sub-PR):** O migrar a NextAuth v5 (`next-auth@5` + `@auth/nextjs`) o degradar el adapter a `@next-auth/prisma-adapter@^1`.

### 2.4 Ausencia de validación de esquema con Zod

Las rutas API reciben cuerpos de request sin validar con Zod aunque la librería ya está instalada.

**Acción recomendada:** Crear schemas Zod en `src/lib/validations/` y validar las entradas en cada route handler.

---

## 3. Riesgos de Seguridad (Secretos, Endpoints)

### 3.1 API endpoints sin autenticación

| Severidad | Riesgo |
|-----------|--------|
| 🔴 Crítico | Todas las rutas `/api/*` aceptan cualquier `patientId` sin verificar la sesión del usuario. Cualquier cliente puede leer o modificar datos de cualquier paciente. |

**Rutas afectadas:**
- `GET/POST /api/intakes` — acepta `?patientId=` sin verificar sesión
- `GET/POST /api/habits` — acepta `?patientId=` sin verificar sesión
- `GET/POST /api/progress` — acepta `?patientId=` sin verificar sesión
- `GET/POST /api/supplements` — acepta `?patientId=` sin verificar sesión
- `GET/POST /api/alerts` — acepta `?patientId=` sin verificar sesión
- `PATCH/DELETE /api/intakes/[id]` — no verifica que el intake pertenezca al usuario
- `POST /api/ai/analyze` — acepta cualquier `patientId` sin verificar sesión
- `POST /api/ai/chat` — sin autenticación (chatbot abierto)

**Fix implementado:** Añadir helper `src/lib/auth.ts` con `getAuthSession()` y aplicar guards en las rutas de IA (`/api/ai/analyze`, `/api/ai/chat`) como ejemplo patrón.

### 3.2 Ausencia de configuración de NextAuth

No existe archivo `src/app/api/auth/[...nextauth]/route.ts`. NextAuth está instalado pero no configurado.

**Fix implementado:** Añadir el route handler de NextAuth con configuración base.

### 3.3 `.env.example` expone el formato de secretos reales

El valor `NEXTAUTH_SECRET="cambia-esto-por-un-secreto-seguro"` es aceptable como placeholder pero debe documentarse explícitamente que no debe usarse en producción.

### 3.4 Sin rate limiting en endpoints de IA

`POST /api/ai/analyze` y `POST /api/ai/chat` llaman a OpenAI sin ningún rate limiting. Un atacante podría generar costes elevados.

**Acción recomendada (futuro sub-PR):** Añadir middleware de rate limiting (e.g., `@upstash/ratelimit` + Redis o `next-rate-limit`).

### 3.5 Sin validación de ownership en `PATCH/DELETE /api/intakes/[id]`

Cualquier usuario autenticado puede modificar o borrar el intake de otro paciente si conoce su `id`.

**Acción recomendada:** Verificar que el `intake.patientId` corresponde al paciente de la sesión activa.

---

## 4. División del PR en Sub-PRs

El PR #1 incluye 51 archivos y ~10 000 líneas de una vez, lo que dificulta la revisión y el testing incremental.

### Sub-PR propuesto #1: `feat/project-scaffold`
**Archivos:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `public/`, `.gitignore`, `.env.example`
**Objetivo:** Setup base del proyecto

### Sub-PR propuesto #2: `feat/database-schema`
**Archivos:** `prisma/schema.prisma`, `prisma/migrations/`
**Objetivo:** Schema de base de datos + migración inicial

### Sub-PR propuesto #3: `feat/api-core`
**Archivos:** `src/lib/prisma.ts`, `src/types/index.ts`, `src/app/api/intakes/`, `src/app/api/habits/`, `src/app/api/progress/`
**Objetivo:** API REST core (diario, hábitos, progreso)

### Sub-PR propuesto #4: `feat/api-extended`
**Archivos:** `src/app/api/supplements/`, `src/app/api/alerts/`, `src/app/api/patients/`
**Objetivo:** API REST extendida (suplementos, alertas, pacientes)

### Sub-PR propuesto #5: `feat/auth`
**Archivos:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
**Objetivo:** Autenticación NextAuth con Prisma adapter

### Sub-PR propuesto #6: `feat/ai-integration`
**Archivos:** `src/app/api/ai/analyze/route.ts`, `src/app/api/ai/chat/route.ts`
**Objetivo:** Integración OpenAI (análisis semanal + chatbot)

### Sub-PR propuesto #7: `docs/agent-framework`
**Archivos:** `docs/`, `README.md`, `ROADMAP.md`, `CONTRIBUTING.md`
**Objetivo:** Documentación y framework de agentes

---

## 5. Acciones Recomendadas para Merge Seguro

### Checklist pre-merge

- [ ] **CI verde:** El workflow de GitHub Actions pasa con `prisma generate`, `lint` y `build`
- [ ] **Auth configurada:** `src/app/api/auth/[...nextauth]/route.ts` existe y funciona
- [ ] **Guards en API:** Al menos las rutas de IA tienen verificación de sesión
- [ ] **Sin secretos en código:** `OPENAI_API_KEY`, `DATABASE_URL`, `NEXTAUTH_SECRET` sólo en `.env.local` (nunca commiteados)
- [ ] **Variables de entorno documentadas:** `.env.example` completo y actualizado
- [ ] **Migración creada:** `prisma/migrations/` con la migración inicial en lugar de sólo `db push`
- [ ] **Versiones documentadas correctas:** `docs/architecture/overview.md` refleja versiones reales del `package.json`
- [ ] **Draft convertido a PR:** Sólo cuando todos los checkboxes anteriores estén marcados

### Orden recomendado de merge (si se divide en sub-PRs)
1. `feat/project-scaffold` → base del proyecto
2. `feat/database-schema` → esquema y migraciones
3. `feat/auth` → autenticación (bloquea al resto)
4. `feat/api-core` → API principal
5. `feat/api-extended` → API extendida
6. `feat/ai-integration` → módulo IA
7. `docs/agent-framework` → documentación

---

## 6. Tareas por Agente

### Agent-Dev (`/agent dev`)
- [ ] Crear `src/app/api/auth/[...nextauth]/route.ts` con configuración NextAuth completa
- [ ] Aplicar `getAuthSession()` en todas las rutas API
- [ ] Añadir validación Zod en todos los route handlers
- [ ] Añadir verificación de ownership en `PATCH/DELETE /api/intakes/[id]`
- [ ] Resolver incompatibilidad `@auth/prisma-adapter` v2 / next-auth v4
- [ ] Implementar rate limiting en endpoints `/api/ai/*`

### Agent-QA (`/test`)
- [ ] Escribir tests unitarios para la lógica `buildAnalysisPrompt` en `/api/ai/analyze`
- [ ] Escribir tests de integración para las rutas API (mock de Prisma)
- [ ] Verificar que un usuario no autenticado recibe `401` en todas las rutas protegidas
- [ ] Verificar que un usuario no puede acceder a datos de otro paciente
- [ ] Test E2E del flujo de registro de ingesta (POST → GET → PATCH)

### Agent-Doc (`/doc`)
- [ ] Actualizar tabla de versiones en `docs/architecture/overview.md`
- [ ] Documentar el proceso de configuración del entorno (`.env.example` → `.env.local`)
- [ ] Añadir sección de "Guía de contribución" a `CONTRIBUTING.md` con pasos de setup local
- [ ] Documentar el flujo de migraciones: `prisma migrate dev` vs `prisma db push`
- [ ] Actualizar `docs/workflows/release-workflow.md` con checklist de seguridad

### Agent-Infra (`/agent automation`)
- [ ] Crear `.github/workflows/ci.yml` con:
  - `CHECKPOINT_DISABLE=1` para Prisma
  - Paso de `prisma generate` antes del build
  - Lint + TypeScript check + build
- [ ] Añadir script `db:migrate:prod` para migraciones en producción (`prisma migrate deploy`)
- [ ] Configurar allowlist en GitHub Actions para dominios externos necesarios
- [ ] Preparar configuración Docker Compose para MySQL local en desarrollo

### Agent-Security (`/agent security`)
- [ ] Auditar todas las rutas API y confirmar guards de autenticación
- [ ] Verificar que `NEXTAUTH_SECRET` tiene suficiente entropía en producción (≥32 bytes)
- [ ] Revisar que ninguna respuesta de API filtra datos de otros pacientes
- [ ] Implementar headers de seguridad en `next.config.ts` (`X-Frame-Options`, `CSP`, etc.)
- [ ] Evaluar rate limiting para endpoints de IA y definir límites apropiados
