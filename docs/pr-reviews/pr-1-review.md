# Revisión PR #1 — Initialize DigestAI

> Generado por `/agent dev` · 2026-03-15

---

## 1. Módulos creados

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Diario Nutricional (Intake)** | `src/app/api/intakes/` | CRUD de ingestas diarias del paciente; incluye checklist de plan, biofeedback digestivo, extras y semáforo de procesados |
| **Hábitos Saludables (HabitLog)** | `src/app/api/habits/` | Registro de sueño, ayuno nocturno, hidratación, ejercicio y luz natural (upsert por fecha) |
| **Registro de Progreso** | `src/app/api/progress/` | Medidas corporales, niveles de energía, hambre y estado de ánimo (upsert por fecha) |
| **Suplementación** | `src/app/api/supplements/` | Asignación de suplementos por paciente con dosis, horario y log de toma |
| **Alertas de Desviación** | `src/app/api/alerts/` | Generación y lectura de alertas automáticas para el nutricionista (8 tipos definidos) |
| **Gestión de Pacientes** | `src/app/api/patients/` | Vista de pacientes asociados a un nutricionista, con plan activo incluido |
| **IA — Análisis Semanal** | `src/app/api/ai/analyze/` | Agrega datos de Prisma, construye prompt y llama a OpenAI `gpt-4o-mini` para feedback en español |
| **IA — Chatbot** | `src/app/api/ai/chat/` | Conversación abierta con el asistente DigestAI usando contexto del paciente |
| **Cliente Prisma** | `src/lib/prisma.ts` | Singleton de `PrismaClient` con hot-reload seguro en desarrollo |
| **Tipos compartidos** | `src/types/index.ts` | Interfaces TypeScript para inputs de Intake, HabitLog, ProgressLog e IA |
| **Schema de base de datos** | `prisma/schema.prisma` | Modelo relacional completo: 17 modelos + 12 enums para MySQL |
| **Documentación de agentes** | `docs/agents/` | 8 especificaciones de agente (planner, dev, tester, doc, nutritionAI, ux, api, automation) |
| **Arquitectura** | `docs/architecture/` | Overview del sistema, modelo de datos y contratos de API |
| **Features** | `docs/features/` | Specs funcionales de tracking nutricional, planificador, chat IA y perfil |
| **Workflows** | `docs/workflows/` | Flujos de plan, test, release y coordinación de agentes |

---

## 2. Endpoints nuevos

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| `GET` | `/api/intakes` | ⚠️ Sin guard | Listar ingestas por paciente y fecha |
| `POST` | `/api/intakes` | ⚠️ Sin guard | Crear ingesta |
| `GET` | `/api/intakes/[id]` | ⚠️ Sin guard | Obtener ingesta por ID |
| `PATCH` | `/api/intakes/[id]` | ⚠️ Sin guard | Actualizar ingesta parcialmente |
| `DELETE` | `/api/intakes/[id]` | ⚠️ Sin guard | Eliminar ingesta |
| `GET` | `/api/habits` | ⚠️ Sin guard | Listar hábitos por paciente y rango de fechas |
| `POST` | `/api/habits` | ⚠️ Sin guard | Crear/actualizar hábito del día (upsert) |
| `GET` | `/api/progress` | ⚠️ Sin guard | Listar registros de progreso |
| `POST` | `/api/progress` | ⚠️ Sin guard | Crear/actualizar registro de progreso (upsert) |
| `GET` | `/api/supplements` | ⚠️ Sin guard | Listar suplementos activos del paciente |
| `POST` | `/api/supplements` | ⚠️ Sin guard | Asignar suplemento al paciente |
| `GET` | `/api/alerts` | ⚠️ Sin guard | Listar alertas de desviación |
| `POST` | `/api/alerts` | ⚠️ Sin guard | Crear alerta de desviación |
| `GET` | `/api/patients` | ⚠️ Sin guard | Listar pacientes de un nutricionista |
| `POST` | `/api/ai/analyze` | ⚠️ Sin guard | Análisis semanal con OpenAI |
| `POST` | `/api/ai/chat` | ⚠️ Sin guard | Chatbot IA en tiempo real |

> **⚠️ Ningún endpoint verifica sesión de usuario.** Se asume que NextAuth.js protegerá las rutas, pero actualmente no hay middleware ni `getServerSession` en ningún handler.

---

## 3. Dependencias críticas añadidas

| Paquete | Versión | Categoría | Notas |
|---------|---------|-----------|-------|
| `next` | `16.1.6` | Framework | App Router; versión no-LTS en pre-release |
| `@prisma/client` + `prisma` | `^5.22.0` | ORM | MySQL via `mysql2`; requiere `DATABASE_URL` en entorno |
| `mysql2` | `^3.19.1` | Driver DB | Driver nativo requerido por Prisma para MySQL |
| `next-auth` | `^4.24.13` | Auth | NextAuth v4 (no la nueva `auth.js` v5); Prisma adapter incluido |
| `@auth/prisma-adapter` | `^2.11.1` | Auth adapter | Adaptador oficial de Prisma para NextAuth |
| `openai` | `^6.29.0` | IA | SDK oficial OpenAI; requiere `OPENAI_API_KEY` en entorno |
| `resend` | `^6.9.3` | Email | Configurada pero **no conectada** aún a ninguna funcionalidad de UI |
| `zod` | `^4.3.6` | Validación | Importado como dependencia pero **no utilizado** en ningún route handler actualmente |
| `react` / `react-dom` | `19.2.3` | UI | Versión RC/estable de React 19 |
| `tailwindcss` | `^4` | Estilos | Tailwind v4; configuración vía `postcss.config.mjs` |

---

## 4. Código que requiere refactor

### 4.1 Sin autenticación en ningún endpoint (`src/app/api/**/route.ts`)
Todos los handlers exponen datos sensibles (ingestas, progreso, suplementos, alertas médicas) sin verificar la sesión del usuario ni comprobar que el `patientId` del request corresponde al usuario autenticado.

```ts
// ❌ Actual — cualquier petición puede leer datos de cualquier paciente
export async function GET(request: NextRequest) {
  const patientId = searchParams.get("patientId"); // confiar en input externo
  const intakes = await prisma.intake.findMany({ where: { patientId } });
  return NextResponse.json(intakes);
}

// ✅ Propuesto
import { getServerSession } from "next-auth";
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // derivar patientId desde session.user.id en lugar de aceptarlo del query param
}
```

### 4.2 `PATCH /api/intakes/[id]` acepta body sin validar
El handler pasa el `body` directamente a `prisma.intake.update` sin restricción de campos ni validación de tipos. Esto permite sobrescribir cualquier campo del modelo, incluyendo `patientId`.

```ts
// ❌ Actual
const body = await request.json();
const intake = await prisma.intake.update({ where: { id }, data: body });

// ✅ Usar zod (ya instalado) para validar campos permitidos
const schema = z.object({ status: z.nativeEnum(IntakeStatus).optional(), ... });
const data = schema.parse(body);
```

### 4.3 `POST /api/alerts` acepta body sin validar
Idéntico problema: `prisma.deviationAlert.create({ data: body })` sin schema de validación.

### 4.4 `buildAnalysisPrompt` usa `any[]` (`src/app/api/ai/analyze/route.ts`, línea 80)
La función auxiliar está tipada con `any[]` explícito para los tres arrays de Prisma. Debe usar los tipos generados por Prisma (`Intake[]`, `HabitLog[]`, `ProgressLog[]`).

### 4.5 `zod` instalado pero sin uso
Se añadió `zod ^4.3.6` como dependencia de producción pero ningún route handler lo utiliza. Debe integrarse en todos los endpoints o moverse a `devDependencies` hasta que se use.

### 4.6 `resend` instalado pero sin implementar
La librería de email `resend` está en dependencias pero no hay ningún uso en el código. Debe eliminarse o implementarse (notificaciones, alertas).

### 4.7 `POST /api/ai/chat` usa `fetch` nativo en lugar del SDK `openai`
`/api/ai/analyze` y `/api/ai/chat` llaman a la API de OpenAI con `fetch` nativo en lugar de usar el SDK `openai` que ya está instalado. Esto duplica la lógica de manejo de errores y autenticación.

```ts
// ❌ Actual — fetch manual
const response = await fetch("https://api.openai.com/v1/chat/completions", { ... });

// ✅ Usar el SDK instalado
import OpenAI from "openai";
const client = new OpenAI();
const completion = await client.chat.completions.create({ ... });
```

---

## 5. Código que requiere tests

### 5.1 Endpoints REST (unit + integration)

| Archivo | Tests prioritarios |
|---------|-------------------|
| `src/app/api/intakes/route.ts` | `GET` requiere `patientId`; `POST` valida campos requeridos; fecha filtrada correctamente |
| `src/app/api/intakes/[id]/route.ts` | `GET` devuelve 404 para ID inexistente; `PATCH` no permite actualizar `patientId`; `DELETE` devuelve `{success:true}` |
| `src/app/api/habits/route.ts` | `POST` hace upsert correcto para la misma fecha; `GET` filtra por `dateFrom`/`dateTo` |
| `src/app/api/progress/route.ts` | `POST` upsert por `patientId+date`; `GET` con rango de fechas |
| `src/app/api/supplements/route.ts` | `GET` devuelve solo suplementos activos; filtro de logs por fecha |
| `src/app/api/alerts/route.ts` | `GET` filtra por `isRead`; `POST` crea alerta con tipo válido |
| `src/app/api/patients/route.ts` | `GET` requiere `nutritionistId`; incluye solo planes activos |

### 5.2 Módulo IA

| Archivo | Tests prioritarios |
|---------|-------------------|
| `src/app/api/ai/analyze/route.ts` | Devuelve 503 si falta `OPENAI_API_KEY`; `buildAnalysisPrompt` calcula adherencia correctamente para arrays vacíos y llenos; maneja correctamente el error 4xx/5xx de OpenAI |
| `src/app/api/ai/chat/route.ts` | Valida que `messages` sea un array; devuelve 503 sin API key; maneja error de OpenAI |

### 5.3 Lógica auxiliar

| Función | Tests prioritarios |
|---------|-------------------|
| `buildAnalysisPrompt` (`analyze/route.ts`) | Arrays vacíos → adherencia 0%; cálculo correcto de promedio de sueño; `latestWeight` con array de progreso vacío |
| `src/lib/prisma.ts` | Singleton no crea instancias duplicadas entre imports |

### 5.4 Schema de Prisma
- Verificar migraciones con `prisma migrate dev --create-only` en CI
- Validar constraints únicos (`patientId+date` en `HabitLog` y `ProgressLog`)

---

## 6. Riesgos de rendimiento y DX

### 6.1 🔴 Sin paginación en ningún endpoint de listado
`GET /api/intakes`, `GET /api/habits`, `GET /api/progress` y `GET /api/alerts` devuelven **todos** los registros del paciente sin límite. Para pacientes con meses de historial esto puede resultar en respuestas de varios MB.

**Solución**: Añadir parámetros `limit` y `cursor`/`offset` en los endpoints de listado.

### 6.2 🔴 Sin autenticación = riesgo de seguridad y BOLA (Broken Object Level Authorization)
Cualquier usuario autenticado (o incluso sin autenticar en el estado actual) puede leer o modificar datos de cualquier paciente con solo conocer su `patientId`. Esto es una vulnerabilidad OWASP API Security Top 10 #1.

### 6.3 🟡 Llamadas a OpenAI sin timeout ni retry
Los handlers `ai/analyze` y `ai/chat` hacen `fetch` sin `AbortController` ni timeout. Una llamada colgada puede bloquear el serverless function por el tiempo máximo del runtime (30s en Vercel por defecto).

**Solución**: Añadir `signal: AbortSignal.timeout(20_000)` o usar el SDK OpenAI con timeout configurado.

### 6.4 🟡 `src/lib/prisma.ts` — log verboso en desarrollo incluye queries
Con `log: ["query", "error", "warn"]` en desarrollo, cada query SQL se imprime en consola, lo cual puede saturar los logs en `prisma studio` o proyectos con muchas peticiones paralelas. Considerar usar `log: ["error", "warn"]` por defecto.

### 6.5 🟡 `next: 16.1.6` — versión pre-release no-LTS
La versión `16.1.6` de Next.js no existe en el registro npm estable (la última estable al momento de la PR es 15.x). Esto puede provocar fallos en `npm install` en entornos limpios y dificulta encontrar soporte en la comunidad.

### 6.6 🟡 `prisma ^5.22.0` con `@prisma/client ^5.22.0` — versión desincronizada con Prisma 6+
El ecosistema Prisma ya tiene la versión 6.x estable. Usar `^5.22.0` puede traer incompatibilidades con drivers MySQL más modernos y perder mejoras de rendimiento de Prisma 6.

### 6.7 🟢 `src/app/api/ai/analyze/route.ts` — `Promise.all` para consultas paralelas
✅ Uso correcto de `Promise.all` para paralelizar las tres queries de Prisma antes de llamar a OpenAI. Buen patrón a mantener.

### 6.8 🟢 `HabitLog` y `ProgressLog` usan upsert con índice único
✅ El upsert por `patientId_date` es eficiente gracias al `@@unique` en el schema. No genera duplicados silenciosos.

### 6.9 🟡 DX — No existe infraestructura de tests
No hay ningún archivo de test (`*.test.ts`, `*.spec.ts`) ni configuración de Jest/Vitest en el proyecto. El script de `test` no está definido en `package.json`. Añadir configuración de tests es prioritario antes de cualquier feature adicional.

### 6.10 🟡 DX — Variables de entorno sin validación en arranque
Las variables `DATABASE_URL`, `OPENAI_API_KEY`, `NEXTAUTH_SECRET` y `NEXTAUTH_URL` se leen directamente sin validación al inicio de la aplicación. Si faltan, el error aparece en runtime (a veces en producción). Considerar un módulo de validación de entorno con `zod` (ya instalado):

```ts
// src/lib/env.ts — ejemplo
import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
});
export const env = envSchema.parse(process.env);
```

---

*Revisión generada con `/agent dev` · DigestAI PR #1*
