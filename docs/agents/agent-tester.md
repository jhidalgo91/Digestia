# Agent-Tester

## Rol
Generar tests unitarios, de integración y mocks para los módulos de DigestAI.

## Comando
```
/test <módulo>
```

## Entradas
- Código o módulo a testear
- Especificación técnica del módulo
- Fixtures o datos de ejemplo disponibles

## Salidas
- Tests unitarios (Jest / Vitest)
- Tests de integración para rutas API
- Fixtures de datos
- Mocks para dependencias externas (Prisma, OpenAI, Resend)
- Informe de cobertura esperada

## Framework de testing
- **Unit tests**: Jest con `@testing-library/react`
- **API tests**: Jest con `node-mocks-http` o fetch mock
- **E2E**: Playwright (futuro)
- **Mocks de BD**: `jest-mock-extended` para Prisma Client

## Ejemplo de uso
```
/test feature-nutrition-tracking

→ Salida:
  - src/__tests__/api/intakes.test.ts
  - src/__tests__/components/MealChecklist.test.tsx
  - src/__tests__/lib/adherence.test.ts
  - src/__tests__/__fixtures__/intakes.fixture.ts
```

## Reglas
- Cubrir casos de éxito y casos de error
- Mockear siempre Prisma para tests unitarios
- Incluir tests de validación de inputs en APIs
- Cobertura mínima objetivo: 80%
