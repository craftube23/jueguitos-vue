# Sistema de Jugador y Físicas FPS 3D — Valoran3D 2.0

## 1. Controlador del Jugador (PlayerController3D)
El jugador es controlado en un entorno tridimensional con las siguientes características:
- **Cámara FPS:** Control de Pitch (vertical entre -85° y +85°) y Yaw (horizontal 360°) acoplado al sistema de bloqueo de ratón (*Pointer Lock API*).
- **Movimiento Espacial:** Vector de movimiento calculado en el plano XZ a partir de las teclas `W`, `A`, `S`, `D`.
- **Física de Salto y Gravedad:** Fuerza de impulso vertical de `+7.0 m/s` con aceleración de gravedad de `-19.8 m/s²`.
- **Agacharse (Crouch):** Transición suave de la altura de la cámara de `1.7m` a `1.1m`, reduciendo además el tamaño de la hitbox del personaje.
- **Caminar en Sigilo (Shift):** Reduce la velocidad de `5.8 m/s` a `2.9 m/s` y elimina la dispersión balística añadida por movimiento.
- **Colisiones en 3D:** Detección y resolución de colisiones contra todos los obstáculos y paredes del mapa con respuesta de deslizamiento (*slide response*).

## 2. Hitboxes y Zonas de Daño
Cada entidad cuenta con 3 zonas de impacto diferenciadas:
1. **Cabeza (Head):** Esfera superior (`y = 1.4m` a `1.8m`). Aplica el multiplicador crítico de *Headshot*.
2. **Cuerpo (Body/Torso):** Cilindro central (`y = 0.6m` a `1.4m`). Daño normal absorbido un 66% por el blindaje.
3. **Piernas (Legs):** Base del personaje (`y = 0.0m` a `0.6m`). Daño reducido.
