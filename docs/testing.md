# Pruebas y Verificación — Valoran3D 2.0

## 1. Plan de Verificación de Sistemas

| Sistema | Prueba | Comportamiento Esperado | Estado |
|---|---|---|---|
| **Carga 3D** | Carga de `mapa.glb` en Three.js | Modelo renderizado correctamente con luces y cámara cenital. | ✅ Verificado |
| **Colisiones** | Deslizamiento en muros | El jugador desliza suavemente en paredes sin atravesarlas ni bloquearse. | ✅ Verificado |
| **Balística** | Disparo con Vandal / Operator | Detección de impacto en cabeza (headshot) y cuerpo con trazadores visuales. | ✅ Verificado |
| **Habilidades** | Dash de Jett (E) / Humo (C) | Desplazamiento supersónico y creación de zona de humo opaco. | ✅ Verificado |
| **Objetivo** | Plantado de Spike (4s) | Canalización de 4s con tecla 4/F, inicio de cuenta regresiva y detonación. | ✅ Verificado |
| **Desactivación** | Desactivación de Spike (7s / 3.5s) | Guardado del punto medio a 3.5s y victoria al completar la barra. | ✅ Verificado |
| **Bots AI** | Comportamiento en 5v5 | Navegación a sitios, disparo en ráfaga y uso de habilidades. | ✅ Verificado |
| **Compilación** | `npm run build` | Compilación de Vite y generación de artefactos en `dist/`. | ✅ Verificado |
