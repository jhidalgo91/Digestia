# Workflow: /test

## Descripción
Flujo de trabajo para generar y ejecutar tests en DigestAI.

## Pasos

```
1. Usuario ejecuta:
   /test <módulo>

2. Agent-Tester analiza:
   ├── Código fuente del módulo
   ├── Especificación en /docs/features/
   └── API contracts en /docs/architecture/

3. Genera:
   ├── Tests unitarios (componentes, lógica)
   ├── Tests de integración (rutas API)
   ├── Fixtures de datos
   └── Mocks de dependencias (Prisma, OpenAI, Resend)

4. Ejecuta:
   npm test
   
5. Revisa cobertura:
   npm run test:coverage
```

## Estructura de tests

```
src/
  __tests__/
    api/
      intakes.test.ts
      habits.test.ts
      ai.test.ts
    components/
      MealChecklist.test.tsx
      HabitTracker.test.tsx
    lib/
      adherence.test.ts
    __fixtures__/
      intakes.fixture.ts
      patients.fixture.ts
```

## Mocks estándar

### Mock de Prisma
```typescript
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));
```

### Mock de OpenAI
```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }],
        }),
      },
    },
  })),
}));
```

## Cobertura objetivo
- Lógica de negocio: 90%
- Rutas API: 80%
- Componentes UI: 70%
