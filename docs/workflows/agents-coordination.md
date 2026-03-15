# Coordinación de Agentes – DigestAI

## Resumen de agentes disponibles

| Agente | Comando | Descripción |
|--------|---------|-------------|
| Agent-Planner | `/plan <feature>` | Genera plan de trabajo detallado |
| Agent-Dev | `/agent dev <spec>` | Implementa código backend/frontend |
| Agent-Tester | `/test <módulo>` | Genera tests unitarios e integración |
| Agent-Doc | `/doc <módulo>` | Crea y actualiza documentación |
| Agent-NutritionAI | `/agent nutrition-ai <tarea>` | Lógica nutricional y prompts IA |
| Agent-UX | `/agent ux <feature>` | Diseño de interfaces y flujos |
| Agent-API | `/agent api <recurso>` | Define endpoints y contratos |
| Agent-Automation | `/agent automation <tarea>` | CI/CD y automatización |

## Flujo de colaboración entre agentes

```
       ┌─────────────────┐
       │  Agent-Planner  │ ← /plan <feature>
       └────────┬────────┘
                │ genera plan
       ┌────────▼────────────────────────────────┐
       │                                         │
  ┌────▼────┐  ┌─────────┐  ┌─────────┐  ┌─────▼────┐
  │Agent-API│  │Agent-UX │  │Agent-Dev│  │Agent-Doc │
  │/agent   │  │/agent   │  │/agent   │  │/doc      │
  │api      │  │ux       │  │dev      │  │          │
  └────┬────┘  └─────────┘  └────┬────┘  └──────────┘
       │                         │
  Contratos API            Código + Prisma
       │                         │
       └───────────┬─────────────┘
                   │
          ┌────────▼────────┐
          │  Agent-Tester   │ ← /test <módulo>
          └─────────────────┘
```

## Prioridades de trabajo actuales

### Sprint 1 – Fundamentos
1. ✅ Setup del proyecto (Next.js + Prisma + MySQL)
2. ✅ Esquema de base de datos completo
3. ✅ API de intakes (diario nutricional)
4. ✅ API de hábitos
5. ✅ API de progreso
6. ✅ API de suplementos
7. ✅ API de IA (análisis + chat)

### Sprint 2 – Frontend base
1. 🔄 Autenticación (NextAuth.js)
2. 🔄 Home del paciente (checklist diario)
3. 🔄 Dashboard del nutricionista
4. 🔄 Registro de hábitos

### Sprint 3 – Features avanzadas
1. 🔄 Chat IA en tiempo real
2. 🔄 Sustituciones inteligentes
3. 🔄 Alertas y notificaciones (Resend)
4. 🔄 Constructor de menús por colores

### Sprint 4 – Integraciones
1. 🔄 Sincronización con wearables
2. 🔄 Exportación de informes
3. 🔄 Agenda de citas
