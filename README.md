# DigestAI – Nutrición Inteligente

Aplicación de nutrición personalizada con seguimiento de dieta, hábitos, suplementación y análisis con inteligencia artificial. Diseñada para pacientes y nutricionistas.

## Stack tecnológico

- **Framework**: [Next.js 16+](https://nextjs.org/) con App Router
- **Lenguaje**: TypeScript
- **ORM**: [Prisma](https://www.prisma.io/) con MySQL
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Autenticación**: [NextAuth.js](https://next-auth.js.org/)
- **IA**: [OpenAI API](https://platform.openai.com/) (gpt-4o-mini)
- **Notificaciones**: [Resend](https://resend.com/)

## Módulos funcionales

| Módulo | Descripción |
|--------|-------------|
| 🍽️ Diario Nutricional | Checklist de comidas, biofeedback digestivo, semaforización de procesados |
| 🔬 Biofeedback | Monitor de gases, escala digestiva emoji (🙂/😐/☹️) |
| 💚 Hábitos | Sueño, ayuno nocturno, hidratación, deporte, luz natural |
| 💊 Suplementación | Pastillero digital con recordatorios (Magnesio, Creatina, Proteína) |
| 📊 Progreso | Gráficos de evolución de peso, composición corporal y adherencia |
| 🤖 IA | Análisis semanal personalizado + chatbot asistente nutricional |
| 👨‍⚕️ Panel Nutricionista | Dashboard multihilo con semáforos de cumplimiento por paciente |

## Requisitos previos

- **Node.js** 18+ (recomendado: 22 LTS)
- **MySQL** 8+
- Cuenta en [OpenAI](https://platform.openai.com/) para el módulo de IA
- Cuenta en [Resend](https://resend.com/) para notificaciones por email

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/jhidalgo91/Digestia.git
cd Digestia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores (ver tabla de variables a continuación)

# 4. Generar el cliente Prisma
npx prisma generate

# 5. Aplicar el esquema de base de datos
npx prisma migrate dev --name init

# 6. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión MySQL | `mysql://user:pass@localhost:3306/digestia` |
| `NEXTAUTH_URL` | URL base de la aplicación | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secreto para JWT de NextAuth (mín. 32 chars). Genera con: `openssl rand -base64 32` | `<secreto-aleatorio-32-chars>` |
| `OPENAI_API_KEY` | API key de OpenAI para análisis nutricional y chatbot | `sk-...` |
| `RESEND_API_KEY` | API key de Resend para envío de emails | `re_...` |
| `RESEND_FROM_EMAIL` | Dirección remitente de los emails | `noreply@digestai.app` |

> **Nota**: Nunca subas `.env.local` al repositorio. Está incluido en `.gitignore`.

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción (requiere build previo)
npm run lint       # Lint con ESLint

npm run db:generate  # Genera el cliente Prisma
npm run db:migrate   # Aplica migraciones en desarrollo
npm run db:push      # Sincroniza esquema sin migraciones (prototipado)
npm run db:studio    # Abre Prisma Studio (GUI de base de datos)
```

## Documentación

- [Arquitectura general](docs/architecture/overview.md)
- [Modelo de datos](docs/architecture/data-model.md)
- [Contratos de API](docs/architecture/api-contracts.md)
- [Roadmap](ROADMAP.md)
- [Guía de contribución](CONTRIBUTING.md)
- [Agentes de desarrollo](docs/agents/)

## Roles de usuario

### Paciente
- **Modo Autónomo**: El usuario gestiona sus propias metas sin nutricionista asignado
- **Modo Supervisado**: Vinculado a un nutricionista mediante código de invitación

### Nutricionista
- Dashboard con semáforos de cumplimiento de todos sus pacientes
- Calibrador de gasto energético
- Constructor de menús por colores de macronutrientes
- Alertas automáticas de desviación del plan
