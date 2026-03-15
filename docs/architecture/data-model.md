# Modelo de datos – DigestAI

## Diagrama de entidades principales

```
User (Auth)
  ├── Patient (perfil paciente)
  │     ├── Intake[] (diario nutricional)
  │     │     └── IntakeFoodItem[]
  │     ├── HabitLog[] (registro diario de hábitos)
  │     ├── SupplementLog[]
  │     ├── PatientSupplement[]
  │     │     └── Supplement
  │     ├── ProgressLog[]
  │     ├── Goal[]
  │     └── MealPlan[]
  │           └── PlannedMeal[]
  │                 └── Intake[]
  └── Nutritionist (perfil nutricionista)
        ├── Patient[] (pacientes asignados)
        ├── MealPlan[] (planes creados)
        └── DeviationAlert[]

FoodItem (catálogo de alimentos)
  └── IntakeFoodItem[]
```

## Enumeraciones clave

### Role
- `PATIENT` – Usuario paciente
- `NUTRITIONIST` – Nutricionista
- `ADMIN` – Administrador del sistema

### PatientMode
- `AUTONOMOUS` – El paciente gestiona su propio plan
- `SUPERVISED` – El plan es gestionado por un nutricionista

### MealType (Tipo de comida)
- `BREAKFAST` – Desayuno
- `LUNCH` – Comida
- `DINNER` – Cena
- `SNACK` – Snack
- `PRE_WORKOUT` – Pre-entreno
- `POST_WORKOUT` – Post-entreno

### IntakeStatus (Estado de ingesta)
- `PLANNED` – Planificada (pendiente)
- `COMPLETED` – Completada según el plan
- `MODIFIED` – Completada con modificaciones
- `SKIPPED` – Saltada

### DigestiveMood (Biofeedback digestivo)
- `GOOD` – 🙂 Buena digestión
- `NEUTRAL` – 😐 Digestión normal
- `BAD` – ☹️ Mala digestión

### ProcessedType (Tipo de procesado)
- `GOOD_PROCESSED` – 🟢 Buen procesado (>90% carne)
- `ULTRA_PROCESSED` – 🔴 Ultraprocesado a evitar
- `NEUTRAL` – Sin clasificar

### ColorTag (Constructor de menús)
- `BLUE_PROTEIN` – 🔵 Proteína
- `ORANGE_CARBS` – 🟠 Carbohidratos
- `GREEN_VEGGIES` – 🟢 Verduras
- `NEUTRAL` – Sin categoría

### FoodGroup (Grupo alimentario)
- `PROTEIN` – Proteínas (carnes, pescados, huevos)
- `FAT` – Grasas (aguacate, aceite, frutos secos)
- `CARBOHYDRATE` – Carbohidratos (arroz, patata, avena)
- `VEGETABLE` – Verduras (libre consumo)
- `FRUIT` – Fruta
- `DAIRY` – Lácteos
- `LEGUME` – Legumbres (con biofeedback de gases)
- `OTHER` – Otros

### AlertType (Tipo de alerta de desviación)
- `CARBS_AT_DINNER` – Carbohidratos en cena > 2 días seguidos
- `LOW_ADHERENCE` – Adherencia < 60% durante 7 días
- `BAD_DIGESTION` – Digestión ☹️ en >30% de comidas
- `MISSING_LOGS` – Sin registros > 3 días
- `EXTREME_HUNGER` – Hambre extrema recurrente
- `GAS_LEGUMES` – Gases repetidos con legumbres
- `SUPPLEMENT_MISSED` – Suplemento no tomado repetidamente
- `CUSTOM` – Alerta personalizada del nutricionista

## Campos calculados / lógica de negocio

### Adherencia al plan (%)
```
adherencia = (ingestas_completadas / total_ingestas_planificadas) * 100
```

### Duración del ayuno nocturno
```
duracion_ayuno = hora_desayuno - hora_ultima_comida
```

### Semáforo de cumplimiento de hábito
- 🟢 Verde: ≥ 80% del objetivo
- 🟡 Amarillo: 50% – 79%
- 🔴 Rojo: < 50%
