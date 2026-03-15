# Feature: Diario Nutricional Inteligente

## Objetivo
Permitir al paciente registrar sus comidas de forma sencilla mediante un checklist visual, minimizando la fricción y alineándose con el plan nutricional asignado.

## Módulos implicados
- **M1**: Diario Nutricional
- **M2**: Biofeedback y Digestión

## Flujo principal

```
1. Paciente abre la app → Ve el plan del día en formato checklist
2. Tras cada comida → Marca: [Completado] / [Modificado] / [Saltado]
3. Opcionalmente:
   - Sube foto de la ración
   - Añade biofeedback emoji (🙂/😐/☹️)
   - Registra si tuvo gases (si comida contiene legumbres)
   - Añade extras (+10g grasa / +10g proteína / +1 fruta)
4. Si status = MODIFIED → Selecciona alternativas inteligentes
5. App calcula adherencia del día y semana
6. Nutricionista ve semáforo de adherencia en su dashboard
```

## Reglas de negocio

### Checklist de comidas
- `COMPLETED`: La ingesta se alineó con el plan → alimenta el % de adherencia
- `MODIFIED`: Se registra el cambio → IA analiza el patrón
- `SKIPPED`: Se registra para análisis → alerta si > 2 días seguidos

### Biofeedback de gases
- Si el alimento contiene `LEGUME` → preguntar: "¿Has sentido gases?"
- Si `hasGas = true` → sugerir: lentejas/guisantes en vez de garbanzos

### Extras rápidos
- `+10g grasa` → registra evento de hambre leve
- `+10g proteína` → registra evento de hambre leve
- `+1 fruta` → registra evento de hambre leve
- Si `extremeHunger = true` → sugerir: verdura libre o 35g queso de cabra

### Semaforización de procesados
- `GOOD_PROCESSED` (verde): producto con >90% carne/ingredientes limpios
- `ULTRA_PROCESSED` (rojo): ultraprocesado → mostrar advertencia al paciente

## Componentes UI requeridos

### `MealChecklist`
Props: `intakes: Intake[]`
- Muestra lista de comidas planificadas del día
- Botones de acción: Completado / Modificado / Saltado
- Biofeedback inline

### `IntakeCard`
Props: `intake: Intake`
- Muestra detalle de una ingesta
- Estado visual con color semáforo
- Foto adjunta (si existe)

### `ExtraQuickActions`
Props: `intakeId: string`
- Botones rápidos para añadir extras

### `SmartSubstitutions`
Props: `foodGroup: FoodGroup, currentFood: string`
- Muestra alternativas del mismo grupo

## API endpoints
- `GET /api/intakes?patientId=&date=`
- `POST /api/intakes`
- `PATCH /api/intakes/[id]`

## Tests requeridos
- [ ] Test: crear ingesta con status COMPLETED
- [ ] Test: crear ingesta con status MODIFIED y extras
- [ ] Test: biofeedback gases con legumbres
- [ ] Test: cálculo de adherencia diaria
- [ ] Test: alerta si skippeado > 2 días seguidos
