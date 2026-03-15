# Feature: Chat con IA (AI Chat)

## Objetivo
Proporcionar al paciente un asistente virtual basado en IA (OpenAI) que responda dudas sobre nutrición, sugiera sustituciones inteligentes y motive el cumplimiento del plan.

## Casos de uso

### 1. Sustituciones inteligentes
```
Paciente: "¿Puedo sustituir el salmón?"
IA: "Sí, puedes usar bacalao o merluza. Son del mismo grupo proteico..."
```

### 2. Dudas sobre el plan
```
Paciente: "¿Puedo comer carbohidratos en la cena?"
IA: "En tu plan actual, la cena está diseñada sin carbohidratos para optimizar..."
```

### 3. Motivación y seguimiento
```
Paciente: "Hoy no tengo ganas de seguir el plan"
IA: "Entiendo que hay días difíciles. Recuerda que llevas X días con buena adherencia..."
```

## Contexto del paciente enviado a la IA
- Plan nutricional activo
- Restricciones alimentarias
- Progreso reciente
- Nivel de adherencia de la semana

## Endpoint
- `POST /api/ai/chat`

## Modelo
- `gpt-4o-mini`

## Limitaciones
- No reemplaza al nutricionista (siempre se indica al paciente)
- Respuestas en español
- Max 600 tokens por respuesta

## Tests requeridos
- [ ] Test: chat devuelve respuesta válida
- [ ] Test: error si API key no configurada
- [ ] Test: validación de formato de messages array
