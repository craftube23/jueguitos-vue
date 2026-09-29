# Sistema de Habilidades y Adaptación 2D — Valoran3D 2.0

## 1. Estructura de Datos de Habilidad
Cada habilidad se define mediante un objeto estándar con la siguiente anatomía:

```javascript
{
  id: "recon_bolt",
  name: "Recon Bolt (Radar)",
  key: "E",
  type: "REVEAL",
  charges: 1,
  cooldown: 40,
  cost: 0,
  pulses: 3,
  radius: 350,
  adaptation2D: "Emite ondas sónicas concéntricas que marcan siluetas rojas de enemigos en el mapa y HUD."
}
```

## 2. Tipos de Habilidades Implementadas
1. **SMOKE:** Bloqueo de línea de visión en área circular o elíptica. Corta el trazado de rayos del `VisionSystem`.
2. **MOVEMENT / DASH:** Desplazamiento acelerado en coordenadas X/Y respetando la colisión del `CollisionSystem`.
3. **FLASH:** Cegamiento que satura la pantalla con un overlay blanco (`blindAlpha`) dependiente del ángulo visual.
4. **AREA_DAMAGE / FIRE:** Zonas de daño persistente por segundo con soporte de autocuración para Phoenix.
5. **WALL / DEPLOYABLE:** Segmentos de muro con salud individual e interacción física con proyectiles.
6. **REVEAL / SONAR:** Detección de enemigos por pulsos de radar con verificación de línea de visión.
7. **HEAL:** Restauración gradual de salud y armadura.
8. **ULTIMATE:** Habilidad de alto impacto desbloqueable acumulando puntos mediante bajas, orbes o rondas.
