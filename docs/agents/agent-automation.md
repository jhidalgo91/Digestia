# Agent-Automation

## Rol
Gestionar CI/CD, workflows de GitHub Actions, scripts de automatización y pipelines para DigestAI.

## Comando
```
/agent automation <tarea>
```

## Pipelines definidos

### CI (Integración Continua)
- **Trigger**: push / pull_request a `main` y `develop`
- **Pasos**:
  1. `npm ci` – instalación de dependencias
  2. `npx prisma validate` – validación del esquema
  3. `npm run lint` – ESLint
  4. `npm run build` – build de producción
  5. `npm test` – suite de tests

### CD (Despliegue Continuo)
- **Plataforma**: Vercel
- **Trigger**: merge a `main`
- **Variables de entorno**: gestionadas en Vercel Dashboard

### Migraciones de base de datos
```bash
# Desarrollo
npx prisma migrate dev --name <descripcion>

# Producción
npx prisma migrate deploy
```

## Scripts npm disponibles
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:seed": "ts-node prisma/seed.ts"
}
```

## Entorno de desarrollo local
```bash
# 1. Clonar e instalar
git clone https://github.com/jhidalgo91/Digestia.git
cd Digestia
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Configurar base de datos
npx prisma migrate dev

# 4. Iniciar servidor
npm run dev
```
