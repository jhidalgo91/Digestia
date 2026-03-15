# Agent-API

## Rol
Definir endpoints REST, contratos de API, esquemas de validación y documentación OpenAPI para DigestAI.

## Comando
```
/agent api <recurso>
```

## Convenciones REST
- Base URL: `/api/`
- Respuestas siempre en JSON
- Códigos HTTP estándar (200, 201, 400, 401, 404, 500)
- Paginación con `?page=1&limit=20`
- Filtros como query params

## Endpoints principales

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js handler |

### Intakes (Diario Nutricional)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/intakes?patientId=&date=` | Listar ingestas del día |
| POST | `/api/intakes` | Crear ingesta |
| GET | `/api/intakes/[id]` | Obtener ingesta |
| PATCH | `/api/intakes/[id]` | Actualizar ingesta |
| DELETE | `/api/intakes/[id]` | Eliminar ingesta |

### Hábitos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/habits?patientId=&dateFrom=&dateTo=` | Listar hábitos |
| POST | `/api/habits` | Registrar/actualizar hábitos del día |

### Progreso
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/progress?patientId=&dateFrom=&dateTo=` | Listar registros de progreso |
| POST | `/api/progress` | Registrar/actualizar progreso del día |

### Suplementos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/supplements?patientId=&date=` | Suplementos del paciente |
| POST | `/api/supplements` | Añadir suplemento al paciente |

### Alertas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/alerts?patientId=&isRead=` | Listar alertas |
| POST | `/api/alerts` | Crear alerta |
| PATCH | `/api/alerts/[id]` | Marcar como leída |

### Planes de comida
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/meal-plans?patientId=` | Listar planes |
| POST | `/api/meal-plans` | Crear plan |
| GET | `/api/meal-plans/[id]` | Obtener plan con comidas |
| PATCH | `/api/meal-plans/[id]` | Actualizar plan |

### Pacientes (Nutricionista)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/patients?nutritionistId=` | Listar pacientes |
| GET | `/api/patients/[id]` | Ficha completa del paciente |

### IA
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/analyze` | Análisis semanal con OpenAI |
| POST | `/api/ai/chat` | Chat con asistente IA |

## Formato de respuesta estándar
```json
{
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "total": 50 }
}
```

## Validación
- Usar `zod` para validación de schemas en todas las rutas
- Retornar errores descriptivos con campo `field` afectado
