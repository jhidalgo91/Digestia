# Contratos de API – DigestAI

## Convenciones generales
- **Base URL**: `https://digestai.app/api` (producción) / `http://localhost:3000/api` (desarrollo)
- **Content-Type**: `application/json`
- **Autenticación**: Bearer token (NextAuth.js session)

---

## POST /api/intakes

Registra o actualiza una ingesta del paciente.

### Request Body
```json
{
  "patientId": "cld1234abc",
  "date": "2025-03-15T08:30:00Z",
  "mealType": "BREAKFAST",
  "status": "COMPLETED",
  "planDescription": "4-5 huevos + 1/2 aguacate",
  "actualDescription": "4 huevos + 1/4 aguacate",
  "digestiveFeedback": "GOOD",
  "hasGas": false,
  "extraFat10g": 0,
  "extraProtein10g": 0,
  "extremeHunger": false,
  "notes": "Todo bien hoy"
}
```

### Response 201
```json
{
  "id": "cld9876xyz",
  "patientId": "cld1234abc",
  "date": "2025-03-15T08:30:00Z",
  "mealType": "BREAKFAST",
  "status": "COMPLETED",
  "createdAt": "2025-03-15T08:31:00Z"
}
```

---

## GET /api/intakes

Obtiene las ingestas de un paciente.

### Query Params
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `patientId` | string | ✅ | ID del paciente |
| `date` | string (ISO) | ❌ | Filtrar por fecha específica |

### Response 200
```json
[
  {
    "id": "cld9876xyz",
    "mealType": "BREAKFAST",
    "status": "COMPLETED",
    "planDescription": "4-5 huevos + 1/2 aguacate",
    "digestiveFeedback": "GOOD",
    "date": "2025-03-15T08:30:00Z"
  }
]
```

---

## POST /api/habits

Registra o actualiza los hábitos del día del paciente (upsert por fecha).

### Request Body
```json
{
  "patientId": "cld1234abc",
  "date": "2025-03-15",
  "sleepHours": 7.5,
  "waterGlasses": 6,
  "strengthSessions": 1,
  "naturalLightMorning": true,
  "notes": "Buen día"
}
```

---

## POST /api/progress

Registra medidas y estado del paciente (upsert por fecha).

### Request Body
```json
{
  "patientId": "cld1234abc",
  "date": "2025-03-15",
  "weight": 78.5,
  "energyLevel": 4,
  "hungerLevel": 2,
  "moodLevel": 5
}
```

---

## POST /api/ai/analyze

Solicita análisis nutricional semanal con OpenAI.

### Request Body
```json
{
  "patientId": "cld1234abc",
  "dateFrom": "2025-03-08",
  "dateTo": "2025-03-15"
}
```

### Response 200
```json
{
  "feedback": "Esta semana tu adherencia al desayuno ha mejorado un 15%...",
  "analyzedPeriod": {
    "from": "2025-03-08T00:00:00Z",
    "to": "2025-03-15T00:00:00Z"
  }
}
```

---

## POST /api/ai/chat

Chat en tiempo real con el asistente de IA.

### Request Body
```json
{
  "messages": [
    { "role": "user", "content": "¿Puedo sustituir el salmón por otro pescado?" }
  ],
  "patientContext": {
    "currentPlan": "Plan pérdida de grasa",
    "restrictions": "Sin lácteos"
  }
}
```

### Response 200
```json
{
  "reply": "¡Claro! Puedes sustituir el salmón por bacalao o merluza. Son del mismo grupo proteico y tienen un perfil nutricional muy similar..."
}
```
