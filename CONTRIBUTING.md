# Guía de contribución – DigestAI

## Bienvenido/a 🎉

Gracias por querer contribuir a DigestAI. Este documento explica cómo trabajar con el repositorio de forma eficiente usando el sistema de agentes y flujos de trabajo definidos.

## Requisitos previos

- Node.js 18+
- MySQL 8+
- Git

## Configuración del entorno local

```bash
# 1. Clonar el repositorio
git clone https://github.com/jhidalgo91/Digestia.git
cd Digestia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de MySQL y OpenAI

# 4. Aplicar el esquema de base de datos
npx prisma migrate dev

# 5. (Opcional) Explorar el esquema visualmente
npx prisma studio

# 6. Iniciar el servidor de desarrollo
npm run dev
```

## Flujo de trabajo con agentes

Para una nueva feature, usa el flujo de agentes documentado:

```
/plan <feature>      → Planifica la feature
/agent api <rec>     → Define endpoints
/agent dev <feature> → Implementa código
/test <módulo>       → Genera tests
/doc <módulo>        → Documenta
```

Ver más detalles en: [`docs/workflows/agents-coordination.md`](docs/workflows/agents-coordination.md)

## Convención de ramas

```
feature/<nombre>   → Nuevas funcionalidades
fix/<nombre>       → Correcciones de bugs
docs/<nombre>      → Solo documentación
refactor/<nombre>  → Refactorizaciones
```

## Convención de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: añadir registro de biofeedback digestivo
fix: corregir cálculo de adherencia semanal
docs: actualizar agent-planner.md
refactor: extraer lógica de análisis IA a lib/ai.ts
test: añadir tests para ruta POST /api/intakes
chore: actualizar dependencias de Prisma
```

## Pull Requests

1. Crea una rama desde `develop`
2. Realiza tus cambios con commits descriptivos
3. Asegúrate de que pasan los tests: `npm test`
4. Asegúrate de que el build es correcto: `npm run build`
5. Asegúrate de que el lint es correcto: `npm run lint`
6. Abre un PR hacia `develop` con descripción clara

## Estructura del proyecto

```
/src/app/api/      → Rutas API REST
/src/components/   → Componentes React
/src/lib/          → Utilidades y Prisma client
/src/types/        → Tipos TypeScript
/prisma/           → Esquema y migraciones
/docs/             → Documentación técnica y funcional
```

## Preguntas

¿Tienes dudas? Consulta la documentación en `/docs/` o abre un issue en GitHub.
