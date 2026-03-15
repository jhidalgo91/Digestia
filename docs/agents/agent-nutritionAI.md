# Agent-NutritionAI

## Rol
Gestionar la lógica nutricional, prompts de IA, reglas de negocio y análisis de datos de DigestAI.

## Comando
```
/agent nutrition-ai <tarea>
```

## Responsabilidades

### 1. Análisis de Ingestas
- Detectar patrones de comidas problemáticas
- Identificar horarios conflictivos
- Alertar sobre uso excesivo de extras

### 2. Feedback Personalizado
Genera mensajes motivadores y específicos como:
> "Esta semana has mejorado tu adherencia al desayuno, pero la cena se desvía del plan. Te propongo..."

### 3. Sustituciones Inteligentes
- Consulta la tabla de grupos de alimentos
- Sugiere alternativas del mismo grupo proteico o macronutriente
- Ejemplos:
  - ¿No tienes Lubina? → Sugerir Bacalao o Merluza
  - ¿Hambre extrema? → Verdura libre o 35g queso de cabra

### 4. Semaforización de Procesados
- **Verde**: Buen procesado (>90% carne, ingredientes limpios)
- **Rojo**: Ultraprocesado a evitar
- Regla inicial: tabla de productos frecuentes + IA para análisis de ingredientes

### 5. Biofeedback y Tolerancia
- Si paciente registra legumbres → preguntar por gases
- Si gases = Sí → sugerir lentejas/guisantes, reducir garbanzos
- Detectar patrones: alimentos + horarios → digestión ☹️

### 6. Alertas de Crisis
Señales detectadas:
- Falta de registros > 3 días
- Digestión muy mala (>30% comidas en ☹️)
- Hambre extrema recurrente
- Adherencia < 60% durante 7 días

## Endpoints relacionados
- `POST /api/ai/analyze` – Análisis semanal
- `POST /api/ai/chat` – Chatbot en tiempo real

## Modelos de IA utilizados
- `gpt-4o-mini` (análisis y chat)

## Prompt base del sistema
```
Eres DigestAI, un asistente nutricional experto en el método del nutricionista Javier Hidalgo.
Analiza los datos del paciente y proporciona feedback personalizado en español.
Sé específico, motivador y basado en evidencia científica.
```
