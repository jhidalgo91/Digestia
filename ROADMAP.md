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

- [ ] Autenticación con NextAuth.js (email + Google OAuth)
- [ ] Onboarding de pacientes (modo autónomo y supervisado)
- [ ] Home del paciente – checklist diario de comidas
- [ ] Registro de hábitos del día (sueño, agua, deporte, ayuno, luz)
- [ ] Dashboard del nutricionista con semáforos de cumplimiento
- [ ] Ficha de paciente con pestañas

---

## 📋 Sprint 3: Features avanzadas

- [ ] Chat con asistente IA en tiempo real
- [ ] Sustituciones inteligentes de alimentos
- [ ] Semaforización de procesados (verde/rojo)
- [ ] Biofeedback de gases con legumbres
- [ ] Alertas de desviación automáticas
- [ ] Notificaciones con Resend (email + push)
- [ ] Pastillero digital con recordatorios de suplementos
- [ ] Constructor de menús por colores de macronutrientes

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
