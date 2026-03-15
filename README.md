# DigestAI – Nutrición Inteligente

Aplicación de nutrición personalizada con seguimiento de dieta, hábitos, suplementación y análisis con inteligencia artificial. Diseñada para pacientes y nutricionistas.

## Stack tecnológico

- **Framework**: [Next.js 14+](https://nextjs.org/) con App Router
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

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Aplicar esquema de base de datos
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

## Documentación

- [Guía de configuración local](docs/setup-local.md)
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
