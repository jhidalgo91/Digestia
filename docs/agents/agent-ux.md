# Agent-UX

## Rol
Diseñar interfaces de usuario, flujos de navegación y experiencia para DigestAI.

## Comando
```
/agent ux <feature>
```

## Principios de diseño

### Filosofía: "Mínima fricción, máximo registro"
- El usuario debe poder registrar una ingesta en menos de 10 segundos
- Checklist visual en lugar de búsqueda manual de alimentos
- Feedback inmediato con emojis y colores semáforo

### Paleta de colores
| Color | Uso |
|-------|-----|
| 🟢 Verde (#10b981) | Buena adherencia, buen procesado, objetivos cumplidos |
| 🟡 Amarillo (#f59e0b) | Cumplimiento parcial (50-79%) |
| 🔴 Rojo (#ef4444) | Baja adherencia, ultraprocesado, alertas |
| 🔵 Azul (#3b82f6) | Proteínas |
| 🟠 Naranja (#f97316) | Carbohidratos |
| 🟩 Verde claro (#22c55e) | Verduras |

### Sistema de colores de macronutrientes (Constructor de Menús)
- **Azul**: Proteína (carnes, pescados, huevos)
- **Naranja**: Carbohidratos (arroz, patata, fruta)
- **Verde**: Verduras (sin restricción)

## Pantallas principales

### Home Paciente (única pantalla principal)
```
┌─────────────────────────────────────────────┐
│  👤 Juan García          📅 Lunes, 15 Mar   │
├─────────────────────────────────────────────┤
│  🍽️  HOY – Plan diario                      │
│  ┌────────────────────────────────────────┐ │
│  │ ☀️ Desayuno                            │ │
│  │ 4-5 huevos + 1/2 aguacate             │ │
│  │ [✅ Completado] [✏️ Modificado] [❌ Skip] │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │ 🌞 Comida                              │ │
│  │ 200g pollo + ensalada libre           │ │
│  │ [✅ Completado] [✏️ Modificado] [❌ Skip] │ │
│  └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  💚 HÁBITOS DEL DÍA                         │
│  😴 Sueño: 7h/8h ──────────────● 87%       │
│  💧 Agua: 5/8 vasos ──────●     62%        │
│  🌅 Luz: ✅  💪 Fuerza: ─        │
├─────────────────────────────────────────────┤
│  💊 SUPLEMENTOS                              │
│  Creatina 5g (mañana) [✅] [⏰]             │
│  Magnesio (22:30) [Pendiente]               │
└─────────────────────────────────────────────┘
```

### Dashboard Nutricionista
```
┌─────────────────────────────────────────────┐
│ 📊 PANEL DE PACIENTES          Filtrar ▼    │
├──────┬──────────┬──────┬──────┬─────────────┤
│ #    │ Paciente │ 🍽️  │ 😊  │ Peso       │
├──────┼──────────┼──────┼──────┼─────────────┤
│  🟢  │ Ana M.   │  85% │  90% │ ↓ -0.5kg   │
│  🟡  │ Pedro R. │  62% │  70% │ → estable  │
│  🔴  │ María G. │  40% │  55% │ ↑ +0.3kg   │
└──────┴──────────┴──────┴──────┴─────────────┘
```

## Entradas del agente
- Feature a diseñar
- Tipo de usuario (paciente / nutricionista)
- Pantalla o flujo específico

## Salidas del agente
- Wireframes textuales (ASCII art)
- Guidelines de componentes
- Flujos de navegación
- Especificaciones para Agent-Dev
