# 📝 Revisión — PR #1: Initialize DigestAI

> **Nota:** Este documento ha sido generado automáticamente por el agente `/doc` y contiene el comentario oficial de revisión para el PR #1.  
> Fecha de generación: 2026-03-15

---

## 📊 Resumen del Estado Actual

El PR #1 introduce el **bootstrap completo** de la aplicación DigestAI sobre un repositorio vacío. Es un PR en estado **borrador** (*Draft*) que suma **51 archivos cambiados** (+9 930 / −2 líneas) e incluye:

- Estructura base de **Next.js 16** (App Router) + TypeScript + Tailwind CSS.
- **Schema Prisma 5** completo con 15 modelos relacionales (User, Patient, Nutritionist, Intake, HabitLog, Supplement, etc.).
- **7 rutas REST API** (`/api/intakes`, `/api/habits`, `/api/progress`, `/api/supplements`, `/api/alerts`, `/api/patients`, `/api/ai/analyze`, `/api/ai/chat`).
- Integración **OpenAI** (`gpt-4o-mini`) para análisis semanal y chatbot.
- **NextAuth.js** con adaptador Prisma.
- Documentación estructurada en `/docs/` con especificaciones de agentes, arquitectura, features y workflows.
- Archivos de configuración del proyecto: `ROADMAP.md`, `CONTRIBUTING.md`, `.env.example`, `README.md`.

⚠️ La **build de CI falló** por restricciones de firewall que bloquearon el acceso a `checkpoint.prisma.io` y `fonts.googleapis.com`. Ver sección de pasos de resolución más abajo.

---

## 🚨 Problemas Críticos Detectados

### 1. Versión de Next.js incorrecta
**Archivo:** `package.json` → `"next": "16.1.6"`

> **Next.js 16 no existe.** La versión estable más reciente es la 15.x. Probablemente se trata de un typo y debería ser `"15.1.6"`. Esto causará que `npm install` falle o instale una versión incorrecta.

```diff
- "next": "16.1.6",
+ "next": "15.1.6",
```

### 2. Conflicto de versión de Prisma
**Archivo:** `package.json` → `"prisma": "^5.22.0"` / `"@prisma/client": "^5.22.0"`

> Los logs de CI muestran que el agente ejecutó **Prisma 7.5.0**, mientras que `package.json` declara la versión `^5`. Existe un conflicto entre la versión declarada y la resuelta. Verificar cuál es la versión objetivo real y fijarla explícitamente.

### 3. Relación `Patient` ausente en el modelo `DeviationAlert`
**Archivo:** `prisma/schema.prisma` — modelo `DeviationAlert`

> El campo `patientId` existe pero **no hay directiva `@relation`** que lo conecte con `Patient`. Esto hace que el campo sea un campo huérfano sin integridad referencial ni cascada de eliminación.

```prisma
model DeviationAlert {
  patientId      String?
  // ❌ Falta:
  // patient        Patient?   @relation(fields: [patientId], references: [id])
}
```

### 4. Modelo `FoodSubstitution` no implementado
La especificación funcional describe el módulo de **"Sustituciones Inteligentes"** (ej. "¿No tienes Lubina? → Bacalao o Merluza"), pero el schema de Prisma no incluye ninguna entidad `FoodSubstitution` o equivalente. El modelo `FoodItem` tampoco tiene relaciones de sustitución definidas.

### 5. Rutas de autenticación sin páginas
**Archivo:** `src/app/page.tsx`

> La landing page incluye botones que apuntan a `/auth/login` y `/auth/register`, pero **estas páginas no existen** en `src/app/auth/`. El usuario obtendrá un 404 al hacer clic.

### 6. Ausencia total de tests
El proyecto no incluye ningún test unitario, de integración ni E2E. Las rutas de la API y la lógica de negocio no están cubiertas. Esto representa un riesgo alto para el avance del proyecto.

### 7. Rutas de API sin middleware de autenticación
Las rutas `/api/intakes`, `/api/habits`, `/api/progress`, etc. no validan la sesión del usuario. Cualquier persona puede acceder o modificar datos sin autenticarse.

### 8. `eslint-config-next` desalineado con la versión de Next.js
**Archivo:** `package.json` → `"eslint-config-next": "16.1.6"`

> Al igual que el paquete `next`, la versión `16.1.6` no existe y debe alinearse con la versión real de Next.js.

---

## ✅ Checklist de Verificación

Antes de marcar este PR como listo para revisión, verificar los siguientes puntos:

### Configuración del Proyecto
- [ ] Corregir la versión de `next` de `16.1.6` a `15.1.6` (o la versión real objetivo).
- [ ] Corregir la versión de `eslint-config-next` para que coincida con la de `next`.
- [ ] Alinear la versión de Prisma declarada en `package.json` con la versión real utilizada.
- [ ] Ejecutar `npm install` limpio y verificar que no hay conflictos de dependencias.

### Base de Datos / Schema
- [ ] Añadir la directiva `@relation` en `DeviationAlert.patientId`.
- [ ] Crear el modelo `FoodSubstitution` (o campo `alternatives` en `FoodItem`) para el módulo de sustituciones inteligentes.
- [ ] Generar y revisar la primera migración de Prisma (`prisma migrate dev --name init`).
- [ ] Confirmar que `prisma generate` ejecuta correctamente en local.

### API y Seguridad
- [ ] Añadir validación de sesión (NextAuth `getServerSession`) en todas las rutas de API protegidas.
- [ ] Añadir manejo de errores consistente en todos los handlers de la API (try/catch + respuestas de error tipadas).
- [ ] Validar los cuerpos de las peticiones con Zod en todos los endpoints POST/PATCH.
- [ ] Revisar que `NEXTAUTH_SECRET` se genera con un valor seguro (ej. `openssl rand -base64 32`).

### Frontend
- [ ] Crear las páginas `/auth/login` y `/auth/register` para que los botones de la landing no den 404.
- [ ] Verificar que la aplicación arranca correctamente con `npm run dev`.

### Testing
- [ ] Añadir al menos pruebas unitarias para `buildAnalysisPrompt` en `/api/ai/analyze`.
- [ ] Añadir tests de integración para los endpoints más críticos (intakes, habits).
- [ ] Configurar una base de datos SQLite en memoria para tests (no depender de MySQL en CI).

### Documentación
- [ ] Actualizar `README.md` con instrucciones de setup local paso a paso.
- [ ] Documentar cómo generar y aplicar las migraciones de Prisma.
- [ ] Añadir sección de "Arquitectura de Decisiones" (ADR) para las decisiones tecnológicas más relevantes.

---

## 🔀 Recomendación: Dividir el PR

Este PR es demasiado grande para una revisión efectiva (+9 900 líneas, 51 archivos). Se recomienda **dividirlo en 5 PRs más pequeños y enfocados**:

| PR propuesto | Alcance | Archivos aprox. |
|---|---|---|
| **PR A — Infrastructure** | `next.config.ts`, `tsconfig.json`, `package.json`, `.env.example`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore` | ~7 |
| **PR B — Database Schema** | `prisma/schema.prisma` completo + primera migración | ~2 |
| **PR C — Core API** | Rutas `/api/intakes`, `/api/habits`, `/api/progress`, `/api/supplements`, `/api/alerts`, `/api/patients` + autenticación | ~15 |
| **PR D — AI Integration** | Rutas `/api/ai/analyze` y `/api/ai/chat` con tests | ~5 |
| **PR E — Documentation & Docs** | Todo `/docs/`, `README.md`, `ROADMAP.md`, `CONTRIBUTING.md` | ~22 |

Esto facilitará las revisiones de código, reducirá el riesgo de conflictos y permitirá un CI más rápido y enfocado.

---

## 🔥 Pasos para Resolver el Fallo de CI por Firewall

La build de CI falló porque Prisma intentó conectarse a `checkpoint.prisma.io` (telemetría) y Next.js intentó cargar fuentes de `fonts.googleapis.com`. Ambas conexiones fueron bloqueadas por el firewall del entorno de Copilot.

### Opción A: Añadir los dominios a la lista de permitidos *(Recomendado para `fonts.googleapis.com`)*

1. Ir a **Settings → Copilot → Coding Agent** del repositorio:  
   `https://github.com/jhidalgo91/Digestia/settings/copilot/coding_agent`
2. Añadir los siguientes dominios a la lista de dominios permitidos (custom allowlist):
   - `fonts.googleapis.com`
   - `fonts.gstatic.com`
   - `checkpoint.prisma.io` *(solo si se necesita telemetría de Prisma)*

### Opción B: Deshabilitar la telemetría de Prisma *(Recomendado para `checkpoint.prisma.io`)*

Añadir la siguiente variable de entorno en el flujo de CI (o en el archivo de configuración de Actions):

```yaml
env:
  PRISMA_TELEMETRY_INFORMATION: "disable"
  # O alternativamente:
  CHECKPOINT_DISABLE: "1"
```

### Opción C: Eliminar la dependencia de Google Fonts

Si la aplicación carga fuentes de Google Fonts en `layout.tsx` o en CSS global, cambiar a fuentes del sistema o fuentes auto-hospedadas para eliminar la dependencia de red en tiempo de build:

```tsx
// src/app/layout.tsx — reemplazar fuentes de Google por fuentes del sistema
// Eliminar: import { Inter } from 'next/font/google'
// Usar: className="font-sans" (Tailwind system font stack)
```

### Opción D: Configurar pasos de setup previos al firewall

Añadir un workflow de **Actions setup steps** que descargue las fuentes antes de activar el firewall:

```yaml
# .github/actions-setup/setup.yml
- name: Pre-fetch Google Fonts
  run: |
    curl -o public/fonts/inter.woff2 "https://fonts.googleapis.com/..."
```

---

## 📸 Recomendación: Screenshots y Pasos de QA

Para facilitar la revisión visual y garantizar la calidad antes del merge, se solicita añadir:

### Screenshots requeridos

1. **Landing page** (`/`) renderizada en local con `npm run dev`.
2. **Respuesta de la API** — ejemplo de `POST /api/intakes` con datos de muestra (puede ser un screenshot de Bruno, Insomnia o Postman).
3. **Schema en Prisma Studio** — ejecutar `npm run db:studio` y capturar la vista del modelo `Patient` con sus relaciones.

### Pasos de QA Manuales

Para validar este PR en local, seguir estos pasos:

```bash
# 1. Clonar el repositorio y cambiar a la rama del PR
git checkout copilot/define-usuario-roles

# 2. Instalar dependencias
npm install

# 3. Configurar entorno local
cp .env.example .env.local
# Editar .env.local con los valores reales de MySQL, NextAuth y OpenAI

# 4. Generar el cliente Prisma
npm run db:generate

# 5. Aplicar el schema a la base de datos
npm run db:push

# 6. Arrancar el servidor de desarrollo
npm run dev

# 7. Verificar en http://localhost:3000:
#    ✓ La landing page carga correctamente
#    ✓ Los botones "Iniciar sesión" y "Crear cuenta" no dan 404
#    ✓ Las rutas de API responden con el código correcto

# 8. Probar la API de análisis IA (requiere OPENAI_API_KEY válida):
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"patientId": "<id_válido>"}'
```

### Criterios de Aceptación Mínimos

- [ ] La aplicación arranca sin errores con `npm run dev`.
- [ ] `npm run build` completa sin errores (tras corregir la versión de Next.js).
- [ ] `npm run lint` no reporta errores.
- [ ] `prisma generate` ejecuta correctamente.
- [ ] La landing page (`/`) se renderiza correctamente en Chrome y Firefox.
- [ ] `GET /api/intakes` responde con `401 Unauthorized` si no hay sesión activa.

---

*Revisión generada por el agente `/doc` · DigestAI · PR #1*
