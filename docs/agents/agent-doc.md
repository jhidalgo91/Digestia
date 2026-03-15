# Agent-Doc

## Rol
Generar documentación técnica y funcional para los módulos de DigestAI.

## Comando
```
/doc <módulo>
```

## Entradas
- Código fuente del módulo
- Especificación funcional
- Contratos de API existentes

## Salidas
- Documentación en formato Markdown (`.md`)
- OpenAPI/Swagger para endpoints REST
- Descripciones de componentes React
- Guías de uso para usuarios finales

## Ejemplo de uso
```
/doc feature-nutrition-tracking

→ Salida:
  - docs/features/feature-nutrition-tracking.md (actualizado)
  - docs/architecture/api-contracts.md (sección intakes)
```

## Estándares
- Documentar todos los parámetros de endpoints (entrada/salida)
- Incluir ejemplos de request/response en JSON
- Mantener actualizado `docs/architecture/data-model.md`
- Seguir estilo de documentación consistente con los `.md` existentes
