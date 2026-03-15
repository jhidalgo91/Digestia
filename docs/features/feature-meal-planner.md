# Feature: Plan de Comidas (Meal Planner)

## Objetivo
Permitir al nutricionista crear y asignar planes de comidas estructurados a los pacientes, con sistema de colores por macronutrientes para educación visual.

## Flujo del nutricionista

```
1. Nutricionista selecciona paciente
2. Crea nuevo plan nutricional:
   - Nombre del plan
   - Rango calórico (ej. 1850-1950 kcal)
   - Fecha inicio/fin
3. Añade comidas planificadas por día/tipo:
   - Desayuno: "4-5 huevos + 1/2 aguacate"
   - Color tag: BLUE_PROTEIN + NEUTRAL
4. Activa el plan → Se "empuja" al paciente
5. Paciente ve el plan en su checklist diario
```

## Sistema de colores de macronutrientes

| Color | Tag | Alimentos |
|-------|-----|-----------|
| 🔵 Azul | `BLUE_PROTEIN` | Carnes, pescados, huevos, proteína |
| 🟠 Naranja | `ORANGE_CARBS` | Arroz, patata, avena, fruta |
| 🟢 Verde | `GREEN_VEGGIES` | Verduras de hoja, brócoli, espinacas |
| ⚪ Neutro | `NEUTRAL` | Grasas, otros |

## Calibrador de gasto energético

Inputs para ajuste:
- Tendencia de peso (últimas 2 semanas)
- Nivel de hambre registrado por el paciente
- Adherencia al plan (%)

Output:
- Sugerencia de ajuste calórico (ej. +100 kcal)
- Botón "Aplicar ajuste" → actualiza raciones del plan activo

## API endpoints
- `GET /api/meal-plans?patientId=`
- `POST /api/meal-plans`
- `GET /api/meal-plans/[id]`
- `PATCH /api/meal-plans/[id]`

## Tests requeridos
- [ ] Test: crear plan con comidas
- [ ] Test: activar plan → se refleja en checklist del paciente
- [ ] Test: calibrador de gasto energético
