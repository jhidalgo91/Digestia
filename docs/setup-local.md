# Guía de configuración local – DigestAI

Esta guía te permite poner en marcha DigestAI en tu máquina de desarrollo en menos de 10 minutos.

## Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 20 LTS | Se recomienda usar [nvm](https://github.com/nvm-sh/nvm) |
| MySQL | 8.0+ | O [PlanetScale](https://planetscale.com/) / Docker |
| Git | Cualquiera | – |
| npm | 9+ | Viene incluido con Node.js |

> **Alternativa con Docker para MySQL:**
> ```bash
> docker run --name digestia-db \
>   -e MYSQL_ROOT_PASSWORD=rootpass \
>   -e MYSQL_DATABASE=digestia \
>   -e MYSQL_USER=digestia_user \
>   -e MYSQL_PASSWORD=digestia_pass \
>   -p 3306:3306 -d mysql:8.0
> ```

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/jhidalgo91/Digestia.git
cd Digestia
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Configurar variables de entorno

Copia el archivo de ejemplo y edita los valores:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores reales. Campos obligatorios:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión MySQL |
| `NEXTAUTH_SECRET` | Secreto para NextAuth (genera con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base (usa `http://localhost:3000` en desarrollo) |
| `OPENAI_API_KEY` | API key de OpenAI para los módulos de IA |

---

## 4. Configurar la base de datos

### Primera vez (con migraciones)

```bash
npx prisma migrate dev --name init
```

### Si ya tienes la BD y quieres forzar el esquema

```bash
npx prisma db push
```

### Generar el cliente Prisma (necesario después de cambios en el esquema)

```bash
npx prisma generate
```

> **Nota CI:** En entornos sin acceso a internet, define `CHECKPOINT_DISABLE=1`
> para que Prisma no intente conectar a `checkpoint.prisma.io` durante `generate`.

---

## 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 6. Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run start` | Inicia el servidor en modo producción |
| `npm run lint` | Ejecuta ESLint |
| `npx tsc --noEmit` | Comprobación de tipos TypeScript |
| `npx prisma studio` | Interfaz visual de base de datos |
| `npx prisma migrate dev` | Aplica migraciones pendientes |
| `npx prisma generate` | Regenera el cliente Prisma |

---

## 7. Estructura del proyecto

```
src/
├── app/
│   ├── api/          # Rutas de la REST API (App Router)
│   │   ├── ai/       # Análisis semanal y chatbot (OpenAI)
│   │   ├── intakes/  # Registro de ingestas
│   │   ├── habits/   # Registro de hábitos
│   │   ├── supplements/
│   │   ├── alerts/
│   │   ├── patients/
│   │   └── progress/
│   ├── layout.tsx    # Layout principal (fuentes locales Geist)
│   └── page.tsx      # Página de inicio
├── lib/
│   └── prisma.ts     # Cliente Prisma singleton
└── types/
    └── index.ts      # Tipos TypeScript compartidos
prisma/
└── schema.prisma     # Esquema de base de datos
docs/                 # Documentación de arquitectura y agentes
```

---

## 8. Solución de problemas frecuentes

### Error: `Can't reach database server`

Verifica que MySQL esté corriendo y que `DATABASE_URL` sea correcta:

```bash
mysql -u <usuario> -p -h localhost digestia
```

### Error de Prisma: `Environment variable not found: DATABASE_URL`

Asegúrate de haber creado `.env.local` (no `.env`) en la raíz del proyecto.

### Error de Prisma en CI: conexión bloqueada a `checkpoint.prisma.io`

Añade `CHECKPOINT_DISABLE=1` como variable de entorno en tu workflow de CI.
En este repositorio ya está configurado en `.github/workflows/ci.yml`.

### Fonts no cargan en desarrollo

Las fuentes Geist se sirven localmente a través del paquete `geist`.
No se hacen peticiones a `fonts.googleapis.com`. Si ves errores de fuentes,
ejecuta `npm install` para asegurarte de tener el paquete `geist` instalado.

---

## 9. Contribuir

Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) para la guía de contribución y
[ROADMAP.md](../ROADMAP.md) para el estado del proyecto.
