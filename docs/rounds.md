# Sistema de Rondas y Estados — Valoran3D 2.0

## 1. Ciclo de Vida de una Ronda
Cada ronda se compone de las siguientes fases:
1. **BUY_PHASE (Fase de Compra - 15-20s):** Jugadores encerrados tras barreras tácticas con acceso a la tienda (tecla B) para comprar armas, blindaje y habilidades.
2. **ROUND_ACTIVE (Ronda Activa - 100s):** Barreras eliminadas. Combate abierto, captura de orbes y objetivos.
3. **OBJECTIVE_PLANTED:** Plantado de la Spike. El temporizador cambia a 45s de cuenta regresiva de la Spike con pitidos acelerados.
4. **ROUND_ENDED (Post-Ronda - 5s):** Se muestra el resultado, se otorgan créditos y se actualiza el marcador global.

## 2. Condiciones de Victoria
- **Atacantes ganan si:**
  - La Spike detona con éxito tras 45s.
  - Eliminan a todos los Defensores.
- **Defensores ganan si:**
  - Desactivan la Spike (canalización de 7s o 3.5s tras el punto medio).
  - Eliminan a todos los Atacantes antes de que planten la Spike.
  - El tiempo de ronda expira sin plantado de Spike.
