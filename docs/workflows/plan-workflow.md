# Workflow: /plan

## Descripción
Flujo de trabajo para planificar una nueva feature o módulo en DigestAI.

## Pasos

```
1. Usuario ejecuta:
   /plan <feature>

2. Agent-Planner genera:
   ├── Objetivo de la feature
   ├── Lista de tareas ordenadas por dependencia
   ├── Subtareas asignadas a cada agente especializado
   └── Estimación de esfuerzo

3. Se crea o actualiza:
   /docs/features/<feature>.md

4. Tareas asignadas a:
   ├── Agent-API  → Definir endpoints y contratos
   ├── Agent-Dev  → Implementar backend y frontend
   ├── Agent-Tester → Generar tests
   └── Agent-Doc  → Documentar

5. Opcionalmente:
   /agent ux <feature>  → Agent-UX genera wireframes

6. Al finalizar:
   /doc <feature>  → Agent-Doc actualiza documentación
```

## Ejemplo completo

```bash
# Iniciar planificación
/plan feature-habits-tracker

# Resultado: docs/features/feature-habits-tracker.md creado

# Implementar API
/agent api habits

# Implementar código
/agent dev feature-habits-tracker

# Generar tests
/test feature-habits-tracker

# Documentar
/doc feature-habits-tracker
```

## Criterios de aceptación de una feature
- [ ] Endpoints API implementados y testeados
- [ ] Componentes UI creados
- [ ] Tests con cobertura ≥ 80%
- [ ] Documentación en `/docs/features/` actualizada
- [ ] PR creado con descripción clara
