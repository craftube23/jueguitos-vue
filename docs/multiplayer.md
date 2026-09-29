# Sistema Multijugador y Salas — Valoran3D 2.0

## 1. Flujo de Partida Online
1. **Crear Sala:** El anfitrión genera una sala con un código de 6 caracteres alfanuméricos.
2. **Unirse a Sala:** Los amigos introducen el código para entrar al lobby en tiempo real.
3. **Selección de Equipo y Agente:** Asignación balanceada a Atacantes o Defensores y bloqueo de agente (Lock-in).
4. **Inicio de Partida:** El Host valida que todos los jugadores estén listos e inicia el encuentro sincronizado.

## 2. Eventos Socket.io
- `create_room`: Crea la entidad de sala en el servidor.
- `join_room`: Une un socket al room de Socket.io.
- `switch_team`: Cambia entre equipo Atacante y Defensor.
- `lock_agent`: Confirma la selección de agente.
- `player_sync`: Envía actualizaciones de posición y dirección a 30-60 Hz.
- `player_hit`: Valida impactos y daño en el servidor.
- `send_chat`: Chat global y chat de equipo.
