# Workflow: Release

## Descripción
Proceso de preparación y despliegue de nuevas versiones de DigestAI.

## Ramas de git

```
main        → Producción (despliegue automático en Vercel)
develop     → Integración continua
feature/*   → Nuevas features
fix/*       → Correcciones de bugs
```

## Proceso de release

```
1. Desarrollo en rama feature/*
2. PR hacia develop
   - CI ejecuta: lint + build + tests
   - Code review por al menos 1 revisor
3. Merge a develop → despliegue en staging
4. QA en entorno de staging
5. PR de develop → main
6. Merge a main → despliegue automático en Vercel
7. Migración de base de datos en producción:
   npx prisma migrate deploy
```

## Checklist pre-release
- [ ] Todos los tests pasan (`npm test`)
- [ ] Build sin errores (`npm run build`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Migraciones de BD preparadas
- [ ] Variables de entorno actualizadas en Vercel
- [ ] CHANGELOG.md actualizado
- [ ] Versión actualizada en `package.json`

## Convención de commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: solo documentación
refactor: refactorización sin cambio funcional
test: añadir o corregir tests
chore: cambios de configuración, dependencias
```
