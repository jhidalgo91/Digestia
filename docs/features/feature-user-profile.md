# Feature: Perfil de Usuario

## Objetivo
Gestionar el registro, onboarding y configuración del perfil para pacientes y nutricionistas.

## Flujo de onboarding del paciente

```
1. Registro con email + contraseña (o Google OAuth)
2. Selección de modo:
   a. Modo Autónomo → Configura sus propias metas
   b. Modo Supervisado → Introduce código de invitación del nutricionista
3. Datos mínimos de perfil:
   - Peso, altura, edad, sexo
   - Nivel de actividad (sedentario / moderado / alto)
   - Horario de trabajo
   - Restricciones alimentarias / alergias / preferencias
4. Generación de plan base (si modo autónomo)
5. Acceso al dashboard principal
```

## Datos del perfil del paciente

| Campo | Descripción |
|-------|-------------|
| `weight` | Peso actual en kg |
| `height` | Altura en cm |
| `age` | Edad en años |
| `sex` | Sexo (MALE/FEMALE/OTHER) |
| `activityLevel` | Nivel de actividad (SEDENTARY/MODERATE/HIGH) |
| `usualSleepHours` | Horas de sueño habituales |
| `allergies` | Alergias alimentarias |
| `intolerances` | Intolerancias |
| `dietaryPreferences` | Preferencias (vegano, sin lácteos, etc.) |

## Autenticación
- NextAuth.js con Prisma Adapter
- Proveedores: Email/Password, Google
- Gestión de sesiones con JWT

## Tests requeridos
- [ ] Test: registro con modo autónomo
- [ ] Test: registro con código de invitación (modo supervisado)
- [ ] Test: validación de campos requeridos
