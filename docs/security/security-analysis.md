# Análisis de Seguridad – DigestAI (PR #1)

> **Fecha:** Marzo 2026  
> **Archivos analizados:** 51 archivos del PR #1  
> **Criticidad general:** 🔴 Alta — todos los endpoints carecían de autenticación

---

## 1. Posibles Secretos Expuestos

| Archivo | Hallazgo | Riesgo |
|---------|----------|--------|
| `.env.example` | Contiene patrones de claves (`sk-...`, `re_...`) | 🟡 Bajo — son valores de ejemplo, no reales |
| `.env.example` | `NEXTAUTH_SECRET="cambia-esto-por-un-secreto-seguro"` | 🟡 Bajo — es un placeholder, pero un desarrollador descuidado podría copiarlo tal cual |
| Código fuente | Sin secretos hardcodeados | ✅ Correcto |
| `.gitignore` | `.env`, `.env.local`, `.env.*.local` correctamente ignorados | ✅ Correcto |

**Riesgo residual:** Si un colaborador copia `.env.example` → `.env.local` sin cambiar los valores, la aplicación arrancará con credenciales débiles/inválidas. Se recomienda documentar explícitamente este punto y usar contraseñas generadas con `openssl rand -base64 32`.

---

## 2. Variables de Entorno Faltantes

Las siguientes variables eran necesarias pero **no aparecían en `.env.example`** en la versión original del PR:

| Variable | Uso | Estado tras el fix |
|----------|-----|--------------------|
| `GOOGLE_CLIENT_ID` | Proveedor OAuth de NextAuth | ✅ Añadida a `.env.example` |
| `GOOGLE_CLIENT_SECRET` | Proveedor OAuth de NextAuth | ✅ Añadida a `.env.example` |

Las variables ya presentes que deben configurarse en producción:

| Variable | Propósito | Observación |
|----------|-----------|-------------|
| `DATABASE_URL` | Conexión MySQL vía Prisma | Usar usuario con mínimos privilegios |
| `NEXTAUTH_URL` | URL base de la aplicación | Debe coincidir exactamente con el dominio en producción |
| `NEXTAUTH_SECRET` | Firma de tokens JWT/sesiones | Generar con `openssl rand -base64 32` |
| `OPENAI_API_KEY` | API de análisis nutricional IA | Establecer límite de gasto en el panel de OpenAI |
| `RESEND_API_KEY` | Envío de emails transaccionales | Rotar periódicamente |
| `RESEND_FROM_EMAIL` | Dirección de origen de emails | Verificar dominio en Resend |

---

## 3. Endpoints que Requerían Autenticación

Todos los endpoints REST carecían de autenticación en la versión original. A continuación se detalla el estado **antes y después** de los cambios:

| Método | Ruta | Antes | Después |
|--------|------|-------|---------|
| POST | `/api/ai/analyze` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/ai/chat` | ❌ Sin auth | ✅ `requireSession` |
| GET | `/api/alerts` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/alerts` | ❌ Sin auth | ✅ `requireSession` + validación Zod |
| GET | `/api/habits` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/habits` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| GET | `/api/intakes` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/intakes` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| GET | `/api/intakes/[id]` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| PATCH | `/api/intakes/[id]` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| DELETE | `/api/intakes/[id]` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| GET | `/api/patients` | ❌ Sin auth | ✅ `requireSession` + ownership check (nutritionist) |
| GET | `/api/progress` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/progress` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| GET | `/api/supplements` | ❌ Sin auth | ✅ `requireSession` + ownership check |
| POST | `/api/supplements` | ❌ Sin auth | ✅ `requireSession` + ownership check |

---

## 4. Riesgos de Fuga de Datos

### 4.1 IDOR (Insecure Direct Object Reference) — Crítico 🔴
**Descripción:** Todos los endpoints aceptaban `patientId` / `nutritionistId` como parámetros libres sin verificar que el usuario autenticado fuera el propietario. Cualquier usuario anónimo podría listar los registros de cualquier paciente.  
**Impacto:** Exposición de datos de salud sensibles (peso, composición corporal, estado digestivo, hábitos de sueño, suplementación).  
**Fix aplicado:** En cada handler se añade una consulta Prisma con `{ id: X, userId: session.user.id }` antes de procesar el recurso.

### 4.2 Mass Assignment — Alto 🟠
**Descripción:** `PATCH /api/intakes/[id]` y `POST /api/alerts` pasaban el `body` completo directamente a Prisma (`prisma.intake.update({ data: body })`), permitiendo a un atacante modificar campos internos como `patientId`, `createdAt` o `isRead`.  
**Impacto:** Escalada de privilegios, manipulación de datos entre pacientes.  
**Fix aplicado:** Los schemas Zod definen exactamente qué campos son permitidos en cada operación.

### 4.3 Exposición de PII en `/api/patients` — Alto 🟠
**Descripción:** Sin autenticación, cualquiera que conociera un `nutritionistId` podía listar todos los pacientes del nutricionista con nombres, emails e imágenes de perfil.  
**Impacto:** Violación del RGPD / Ley Orgánica de Protección de Datos.  
**Fix aplicado:** Autenticación + verificación de que el `nutritionistId` pertenece al usuario de la sesión.

### 4.4 Abuso de coste en la API de OpenAI — Medio 🟡
**Descripción:** `/api/ai/analyze` y `/api/ai/chat` eran endpoints públicos que llamaban a la API de OpenAI. Un atacante podía realizar miles de peticiones y generar un coste económico elevado.  
**Fix aplicado:** Autenticación obligatoria en ambos endpoints (un usuario anónimo recibe 401 antes de que se ejecute ninguna llamada a OpenAI).  
**Recomendación adicional:** Implementar rate-limiting por usuario (p.ej. con `@upstash/ratelimit`).

### 4.5 Sin ruta de autenticación — Alto 🟠
**Descripción:** No existía `/api/auth/[...nextauth]` ni configuración de NextAuth, por lo que los imports de `next-auth` eran no funcionales.  
**Fix aplicado:** Creados `src/lib/auth.ts` y `src/app/api/auth/[...nextauth]/route.ts`.

---

## 5. Recomendaciones de Mitigación

### Implementadas en este PR
- [x] Añadir `requireSession()` a todos los endpoints REST
- [x] Añadir ownership checks (IDOR) en todos los endpoints
- [x] Reemplazar `data: body` con schemas Zod para evitar mass assignment
- [x] Crear `src/lib/auth.ts` con la configuración de NextAuth
- [x] Crear `src/app/api/auth/[...nextauth]/route.ts`
- [x] Añadir `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a `.env.example`
- [x] Añadir tipado TypeScript para `session.user.id`

### Pendientes / Próximos pasos

| Prioridad | Acción | Descripción |
|-----------|--------|-------------|
| 🔴 Alta | Rate limiting en endpoints IA | Usar Upstash Redis + `@upstash/ratelimit` para limitar llamadas a OpenAI por usuario/hora |
| 🔴 Alta | Validar `photoUrl` contra dominios permitidos | Actualmente se acepta cualquier URL en `photoUrl` del intake; podría usarse para SSRF |
| 🟠 Media | Headers de seguridad HTTP | Añadir `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` en `next.config.ts` |
| 🟠 Media | Auditoría de logs | Registrar eventos de autenticación fallidos y accesos denegados (403) para detección de intrusiones |
| 🟠 Media | Principio de mínimo privilegio en DB | Crear un usuario MySQL con solo los permisos necesarios (SELECT, INSERT, UPDATE, DELETE); no usar root |
| 🟡 Baja | Rotación de secretos | Documentar un proceso de rotación periódica de `NEXTAUTH_SECRET`, `OPENAI_API_KEY` y `RESEND_API_KEY` |
| 🟡 Baja | Escaneo de secretos en CI | Integrar `gitleaks` o `trufflehog` en el pipeline de GitHub Actions para prevenir commits accidentales de secretos |
| 🟡 Baja | HTTPS en producción | Asegurar que `NEXTAUTH_URL` use `https://` y que el servidor tenga TLS habilitado |

---

## Archivos Creados / Modificados

| Archivo | Tipo de cambio |
|---------|----------------|
| `src/lib/auth.ts` | ➕ Nuevo — configuración NextAuth con Google OAuth |
| `src/lib/getSession.ts` | ➕ Nuevo — helper `requireSession()` |
| `src/app/api/auth/[...nextauth]/route.ts` | ➕ Nuevo — handler de NextAuth |
| `src/types/next-auth.d.ts` | ➕ Nuevo — tipado de `session.user.id` |
| `src/app/api/ai/analyze/route.ts` | 🔧 Modificado — auth + Zod + ownership |
| `src/app/api/ai/chat/route.ts` | 🔧 Modificado — auth + Zod |
| `src/app/api/alerts/route.ts` | 🔧 Modificado — auth + Zod + ownership, fix mass assignment |
| `src/app/api/habits/route.ts` | 🔧 Modificado — auth + Zod + ownership |
| `src/app/api/intakes/route.ts` | 🔧 Modificado — auth + Zod + ownership |
| `src/app/api/intakes/[id]/route.ts` | 🔧 Modificado — auth + Zod + ownership, fix mass assignment PATCH |
| `src/app/api/patients/route.ts` | 🔧 Modificado — auth + ownership |
| `src/app/api/progress/route.ts` | 🔧 Modificado — auth + Zod + ownership |
| `src/app/api/supplements/route.ts` | 🔧 Modificado — auth + Zod + ownership |
| `.env.example` | 🔧 Modificado — añadidas `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` |
