# Valoran3D 2.0 — Tactical Arena 5v5

Videojuego de disparos táctico por equipos en 2D/3D desarrollado en Vue 3 y Three.js, inspirado en la filosofía de diseño y estructura de gameplay de VALORANT, con sistemas modulares, motor de audio procedural con Web Audio API, carga y navegación del mapa 3D `mapa.glb`, economía de rondas, spike plant/defuse y arquitectura multijugador online con Socket.io.

---

## 🎮 Características Principales

- **Motor Híbrido 3D/2D:** Carga del escenario `mapa.glb` en Three.js con cámara cenital/táctica y capa de renderizado 2D de alta precisión para colisiones y efectos visuales.
- **Roles y Agentes Tácticos:** Duelistas (Jett, Phoenix, Reyna), Iniciadores (Sova), Controladores (Brimstone, Omen) y Centinelas (Sage, Chamber, Killjoy) con 4 habilidades cada uno (C, Q, E, X) adaptadas fielmente a 2D.
- **Arsenal Completo con Balística:** Pistolas, Subfusiles, Escopetas, Rifles (Vandal, Phantom, Guardian), Francotiradores (Operator) y Armas Pesadas con retroceso, dispersión, penetración de paredes y multiplicadores de daño (Cabeza/Cuerpo/Pierna).
- **Objetivo Táctico (Spike / Dispositivo):** Mecánica de plantado (4s) y desactivación (7s con checkpoint a la mitad 3.5s), temporizador progresivo y onda expansiva letal.
- **Economía y Fases de Ronda:** Fase de compra con barreras tácticas, tienda interactiva, recompensas por victoria/derrota, bonos de plantado y créditos máximos (\$9000).
- **Modo Práctica (The Range):** Campo de entrenamiento con bots de práctica, prueba de dispersión y habilidades.
- **Multijugador Online en Tiempo Real:** Creación y unión a salas con código de 6 caracteres, selector de equipo, sincronización de estados y servidor Node.js autoritativo.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar Servidor Multijugador (Socket.io)
```bash
npm run server
```

### 3. Iniciar Cliente Web (Vite)
```bash
npm run dev
```

---

## 📚 Índice de Documentación Técnica

Para profundizar en la arquitectura y cada uno de los sistemas del juego, consulta la carpeta `docs/`:

1. [Arquitectura del Sistema](docs/architecture.md)
2. [Guía y Fichas de Agentes](docs/agents.md)
3. [Sistema de Habilidades](docs/abilities.md)
4. [Arsenal de Armas y Balística](docs/weapons.md)
5. [Mapa 3D y Colisiones](docs/map.md)
6. [Sistema Multijugador y Salas](docs/multiplayer.md)
7. [Networking y Sincronización](docs/networking.md)
8. [Sistema de Rondas y Estados](docs/rounds.md)
9. [Economía y Tienda](docs/economy.md)
10. [Pruebas y Verificación](docs/testing.md)
