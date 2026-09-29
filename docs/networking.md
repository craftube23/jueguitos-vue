# Networking y Sincronización — Valoran3D 2.0

## 1. Arquitectura Cliente-Servidor
El servidor Node.js (`server/server.js`) actúa como autoridad central para:
- Distribución de estados de sala.
- Asignación de posiciones de aparición (spawns).
- Validación de rondas, puntuaciones y bajas.
- Retransmisión de proyectiles y habilidades en tiempo real.

## 2. Manejo de Latencia e Interpolación
- Los jugadores locales responden inmediatamente a sus entradas de teclado y ratón (Client Prediction).
- Los jugadores remotos se actualizan mediante mensajes de sincronización `player_moved` interpolando suavemente la posición `x, y` y la rotación `lookAngle`.
- Soporte para reconexión conservando la sesión del jugador.
