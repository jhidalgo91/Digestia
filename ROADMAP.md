# DigestAI – Roadmap

## Visión
DigestAI es una aplicación de nutrición inteligente que combina seguimiento nutricional personalizado, análisis con IA y coordinación entre pacientes y nutricionistas, basada en el método del nutricionista Javier Hidalgo Pérez.

---

## Estado actual: MVP en desarrollo

### ✅ Completado – Sprint 1: Fundamentos
- [x] Setup Next.js 14+ con TypeScript y Tailwind CSS
- [x] Prisma ORM con MySQL (esquema completo)
- [x] Modelos de datos: User, Patient, Nutritionist, MealPlan, Intake, HabitLog, SupplementLog, ProgressLog, DeviationAlert
- [x] API REST: intakes, habits, progress, supplements, alerts, patients
- [x] Integración OpenAI (análisis semanal + chatbot)
- [x] Documentación de arquitectura y agentes
- [x] Estructura de módulos funcionales

---

## 🔄 Sprint 2: Frontend base (En progreso)

- [x] Autenticación con NextAuth.js (email + Google OAuth)
- [x] Onboarding de pacientes (modo autónomo y supervisado)
- [x] Home del paciente – checklist diario de comidas
- [x] Registro de hábitos del día (sueño, agua, deporte, ayuno, luz)
- [x] Dashboard del nutricionista con semáforos de cumplimiento
- [x] Ficha de paciente con pestañas

---

## ✅ Completado – Sprint 3: Features avanzadas

- [x] Chat con asistente IA en tiempo real
- [x] Sustituciones inteligentes de alimentos (shortcut desde registro de comida → chat IA)
- [x] Semaforización de procesados (verde/rojo/gris en registro de intakes)
- [x] Biofeedback de gases con legumbres (checkbox + alerta automática)
- [x] Alertas de desviación automáticas (gases, digestión mala, hambre extrema)
- [x] Notificaciones con Resend (email al paciente al crear alerta)
- [x] Pastillero digital con recordatorios de suplementos
- [x] Constructor de menús por colores de macronutrientes

---

## 🚀 Sprint 4: Integraciones y expansión

- [ ] Sincronización con wearables (Apple Health, Google Fit, Garmin)
- [ ] Exportación de informes PDF para el nutricionista
- [ ] Agenda de citas presenciales/virtuales
- [ ] Modo offline con sincronización posterior
- [ ] App móvil nativa (React Native / Expo)
- [ ] Escáner de código de barras para semaforización de procesados

---

## 💡 Ideas futuras (backlog)

- [ ] Modelos predictivos de ML para anticipar crisis nutricionales
- [ ] Integración con farmacias para gestión de suplementos
- [ ] Comunidad de pacientes / grupos de apoyo
- [ ] API pública para integración con otras apps de salud
- [ ] Soporte multiidioma
