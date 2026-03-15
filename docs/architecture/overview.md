# DigestAI – Visión general de la arquitectura

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 14+ |
| Lenguaje | TypeScript | 5+ |
| ORM | Prisma | 6+ |
| Base de datos | MySQL | 8+ |
| Autenticación | NextAuth.js | 5 |
| Estilos | Tailwind CSS | 4 |
| IA | OpenAI API | gpt-4o-mini |
| Notificaciones | Resend | 4+ |
| Validación | Zod | 3+ |

## Principios arquitectónicos

1. **Modularidad**: Cada módulo funcional es independiente y testeable de forma aislada.
2. **API-first**: Toda la lógica de negocio está expuesta mediante REST API en `/api/`.
3. **Mínima fricción UX**: El registro de datos por parte del paciente debe requerir el mínimo de clics posible.
4. **Escalabilidad**: La arquitectura permite añadir nuevos módulos sin refactorización del núcleo.

## Arquitectura de capas

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│  Next.js App Router – React Server Components + Client   │
│  Tailwind CSS – Diseño responsive                        │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────┐
│                  SERVIDOR (Next.js)                      │
│                                                          │
│  ┌─────────────────┐  ┌────────────────────────────────┐ │
│  │   API Routes    │  │   Server Components / Pages    │ │
│  │  /api/**        │  │   (Dashboard, Auth, etc.)      │ │
│  └────────┬────────┘  └────────────────────────────────┘ │
│           │                                              │
│  ┌────────▼────────┐                                     │
│  │   Prisma ORM    │                                     │
│  └────────┬────────┘                                     │
└───────────┼──────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                   MySQL Database                         │
│  Usuarios · Pacientes · Nutricionistas · Ingestas        │
│  Hábitos · Suplementos · Planes · Alertas                │
└──────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│               Servicios externos                         │
│  OpenAI API – Análisis nutricional y chatbot             │
│  Resend – Emails y notificaciones                        │
└──────────────────────────────────────────────────────────┘
```

## Roles de usuario

### Paciente
- **Modo Autónomo**: El usuario define sus propias metas sin nutricionista asignado.
- **Modo Supervisado**: Vinculado a un nutricionista mediante código de invitación.

### Nutricionista
- Dashboard multihilo con semáforos de cumplimiento de pacientes.
- Herramientas de calibración de planes y detección de desviaciones.

## Módulos funcionales

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| M1: Diario Nutricional | Checklist de comidas, registro fotográfico, semaforización | ✅ API implementada |
| M2: Biofeedback | Monitor de gases, escala digestiva emoji | ✅ Modelo de datos |
| M3: Hábitos | Sueño, ayuno, hidratación, deporte, luz natural | ✅ API implementada |
| M4: Suplementación | Pastillero digital con notificaciones | ✅ API implementada |
| M5: Progreso | Gráficos de evolución, composición corporal | ✅ API implementada |
| M6: Comunicación | Chat con nutricionista, citas | 🔄 Pendiente |
| M7: Wearables | Sincronización con dispositivos externos | 🔄 Pendiente |
| M8: Personalización | Preferencias, notificaciones, temas | 🔄 Pendiente |
| M9: IA y Alertas | OpenAI analysis + Resend notifications | ✅ API implementada |

## Estructura de carpetas

```
/src
  /app
    /api           → Rutas API (REST)
      /intakes
      /habits
      /progress
      /supplements
      /alerts
      /patients
      /meal-plans
      /ai
        /analyze
        /chat
    /(auth)        → Páginas de autenticación
    /(dashboard)   → Páginas de aplicación
      /patient     → Vista paciente
      /nutritionist → Vista nutricionista
  /components
    /ui            → Componentes base reutilizables
    /patient       → Componentes específicos del paciente
    /nutritionist  → Componentes específicos del nutricionista
  /lib
    prisma.ts      → Singleton de Prisma Client
  /types
    index.ts       → Tipos TypeScript compartidos
/prisma
  schema.prisma    → Esquema de base de datos
/docs
  /agents          → Documentación de agentes
  /architecture    → Arquitectura del sistema
  /features        → Especificaciones de features
  /workflows       → Flujos de trabajo
```
