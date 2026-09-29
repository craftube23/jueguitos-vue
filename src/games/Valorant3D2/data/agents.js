// src/games/Valorant3D2/data/agents.js

export const ROLES = {
  DUELIST: { id: 'DUELIST', name: 'Duelista', icon: '⚔️', desc: 'Atacantes autosuficientes diseñados para conseguir primeras bajas y abrir sitios.' },
  INITIATOR: { id: 'INITIATOR', name: 'Iniciador', icon: '🎯', desc: 'Especialistas en conseguir información del mapa y facilitar la entrada del equipo.' },
  CONTROLLER: { id: 'CONTROLLER', name: 'Controlador', icon: '☁️', desc: 'Expertos en bloquear visión, dividir zonas y controlar el territorio con humo.' },
  SENTINEL: { id: 'SENTINEL', name: 'Centinela', icon: '🛡️', desc: 'Expertos en defensa estática, colocar trampas y bloquear rutas de ataque enemigas.' }
}

export const AGENTS = {
  jett: {
    id: 'jett',
    name: 'Jett',
    role: 'DUELIST',
    country: 'Corea del Sur',
    color: '#38bdf8',
    avatar: '🌪️',
    spriteRow: 1,
    spriteCol: 0,
    desc: 'Ágil y evasiva, Jett domina el movimiento rápido con dashes y dagas letales.',
    passive: {
      name: 'Drift (Planeo)',
      desc: 'Mantener espacio en el aire permite planear suavemente sin recibir daño de caída.'
    },
    abilities: {
      C: {
        id: 'cloudburst',
        name: 'Cloudburst (Humo Rápido)',
        key: 'C',
        type: 'SMOKE',
        charges: 2,
        cost: 200,
        duration: 4.5,
        radius: 75,
        desc: 'Lanza instantáneamente un proyectil que se expande en una nube de humo que bloquea la visión.',
        adaptation2D: 'Crea una zona circular de humo denso opaco que oculta a los jugadores en su interior y bloquea la línea de visión táctica.'
      },
      Q: {
        id: 'updraft',
        name: 'Updraft (Salto de Viento)',
        key: 'Q',
        type: 'MOVEMENT',
        charges: 2,
        cost: 150,
        heightBoost: 350,
        desc: 'Impulsa a Jett instantáneamente hacia arriba por los aires.',
        adaptation2D: 'Otorga un impulso instantáneo de evasión aumentando velocidad temporalmente y permitiendo saltar sobre obstáculos bajos.'
      },
      E: {
        id: 'tailwind',
        name: 'Tailwind (Dash)',
        key: 'E',
        type: 'MOVEMENT',
        charges: 1,
        cooldown: 12,
        cost: 0,
        dashSpeed: 820,
        dashDuration: 0.22,
        desc: 'Se impulsa a gran velocidad en la dirección del movimiento actual.',
        adaptation2D: 'Desplazamiento supersónico en línea recta respetando las colisiones con muros. Deja una estela de viento cyan.'
      },
      X: {
        id: 'blade_storm',
        name: 'Blade Storm (Tormenta de Cuchillas)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 7,
        damagePerDagger: 50,
        daggersCount: 5,
        desc: 'Equipa un conjunto de 5 dagas arrojadizas altamente precisas. Eliminar a un enemigo restaura todas las dagas.',
        adaptation2D: 'Proyectiles de alta velocidad sin desviación ni retroceso al moverse. 3 impactos directos al cuerpo o 1 a la cabeza eliminan al rival.'
      }
    }
  },

  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    role: 'DUELIST',
    country: 'Reino Unido',
    color: '#f97316',
    avatar: '🔥',
    spriteRow: 2,
    spriteCol: 0,
    desc: 'Ignición estelar: lanza fuego que daña enemigos mientras regenera su propia salud.',
    passive: {
      name: 'Heating Up (Curación por Fuego)',
      desc: 'El fuego propio cura la vida de Phoenix a 15 HP/s en lugar de hacerle daño.'
    },
    abilities: {
      C: {
        id: 'blaze',
        name: 'Blaze (Muro de Fuego)',
        key: 'C',
        type: 'WALL',
        charges: 1,
        cost: 200,
        duration: 6.0,
        damagePerSec: 30,
        desc: 'Despliega una pared de fuego que bloquea la visión y quema a cualquiera que intente cruzarla.',
        adaptation2D: 'Línea de fuego táctica que corta la línea de visión y causa daño por segundo a enemigos.'
      },
      Q: {
        id: 'curveball',
        name: 'Curveball (Flash Curvo)',
        key: 'Q',
        type: 'FLASH',
        charges: 2,
        cost: 250,
        blindDuration: 2.2,
        desc: 'Lanza un orbe destellante que se curva 90° alrededor de las esquinas antes de detonar y cegar a todos.',
        adaptation2D: 'Destello que curva en la dirección elegida y ciega totalmente la pantalla de los jugadores en su ángulo de visión.'
      },
      E: {
        id: 'hot_hands',
        name: 'Hot Hands (Molotov)',
        key: 'E',
        type: 'AREA_DAMAGE',
        charges: 1,
        cooldown: 15,
        cost: 0,
        duration: 5.0,
        radius: 80,
        damagePerSec: 45,
        desc: 'Lanza una bola de fuego que explota al tocar el suelo o tras un breve tiempo, creando una zona de fuego.',
        adaptation2D: 'Zona circular ardiente que inflige daño continuo a rivales y cura a Phoenix si permanece dentro.'
      },
      X: {
        id: 'run_it_back',
        name: 'Run It Back (Cenizas)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 6,
        duration: 10.0,
        desc: 'Coloca un marcador en la posición actual. Si muere o expira el tiempo, renace en la marca con vida restaurada.',
        adaptation2D: 'Activa un clon temporal; si la vida llega a 0, Phoenix vuelve inmediatamente a su posición de activación.'
      }
    }
  },

  reyna: {
    id: 'reyna',
    name: 'Reyna',
    role: 'DUELIST',
    country: 'México',
    color: '#a855f7',
    avatar: '👁️',
    spriteRow: 2,
    spriteCol: 2,
    desc: 'Dominatriz del combate individual que se alimenta de la fuerza vital de sus víctimas.',
    passive: {
      name: 'Soul Harvest (Cosecha de Almas)',
      desc: 'Los enemigos eliminados dejan un orbe de alma durante 3 segundos para que Reyna lo consuma.'
    },
    abilities: {
      C: {
        id: 'leer',
        name: 'Leer (Mirada Voraz)',
        key: 'C',
        type: 'DEBUFF',
        charges: 2,
        cost: 250,
        duration: 3.5,
        health: 100,
        desc: 'Equipa y lanza un ojo etéreo a través de muros que restringe la visión a corta distancia de los rivales que lo miren.',
        adaptation2D: 'Orbe destructible que aplica estado de miopía/ceguera a enemigos en su línea de visión.'
      },
      Q: {
        id: 'devour',
        name: 'Devour (Devorar)',
        key: 'Q',
        type: 'HEAL',
        charges: 2,
        cost: 150,
        healAmount: 100,
        desc: 'Consume instantáneamente un orbe de alma cercano para regenerar salud rápidamente hasta alcanzar sobrecuración.',
        adaptation2D: 'Rayo que conecta con el orbe más cercano y cura +100 HP (e hiperescudo temporal).'
      },
      E: {
        id: 'dismiss',
        name: 'Dismiss (Descartar)',
        key: 'E',
        type: 'INVULNERABLE',
        charges: 2,
        cost: 150,
        duration: 2.0,
        desc: 'Consume un orbe de alma para volverse intangible y obtener velocidad de movimiento durante un breve periodo.',
        adaptation2D: 'Estado INTANGIBLE e INVULNERABLE: inmune a todo daño y colisión de proyectiles por 2s.'
      },
      X: {
        id: 'empress',
        name: 'Empress (Emperatriz)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 6,
        duration: 30.0,
        fireRateBuff: 1.25,
        desc: 'Entra en un frenesí asesino: mayor cadencia de disparo, recarga rápida, orbes infinitos y Dismiss invisible.',
        adaptation2D: 'Aura morada con +25% cadencia de disparo y activación automática de curación al eliminar enemigos.'
      }
    }
  },

  sova: {
    id: 'sova',
    name: 'Sova',
    role: 'INITIATOR',
    country: 'Rusia',
    color: '#0284c7',
    avatar: '🏹',
    spriteRow: 3,
    spriteCol: 1,
    desc: 'El maestro arquero rastreador con flechas que rebotan en paredes y revelan a todos los enemigos.',
    passive: {
      name: 'Hunter Instinct',
      desc: 'Las trayectorias de sus flechas muestran la línea de rebote calculada.'
    },
    abilities: {
      C: {
        id: 'owl_drone',
        name: 'Owl Drone (Dron Búho)',
        key: 'C',
        type: 'DEPLOYABLE',
        charges: 1,
        cost: 400,
        duration: 7.0,
        desc: 'Despliega un dron pilotable que puede disparar un dardo de rastreo para revelar continuamente la posición enemiga.',
        adaptation2D: 'Cámara móvil voladora con visión ampliada que marca objetivos en el minimap.'
      },
      Q: {
        id: 'shock_bolt',
        name: 'Shock Bolt (Flecha Eléctrica)',
        key: 'Q',
        type: 'PROJECTILE',
        charges: 2,
        cost: 150,
        maxDamage: 75,
        radius: 90,
        desc: 'Dispara una flecha explosiva que rebota hasta 2 veces antes de detonar en una descarga eléctrica en área.',
        adaptation2D: 'Flecha con física de reflexión que detona al impactar un enemigo o agotar sus rebotes.'
      },
      E: {
        id: 'recon_bolt',
        name: 'Recon Bolt (Flecha Radar)',
        key: 'E',
        type: 'REVEAL',
        charges: 1,
        cooldown: 40,
        cost: 0,
        pulses: 3,
        radius: 350,
        desc: 'Dispara una flecha sonar que emite 3 pulsos sónicos que revelan la posición exacta de los enemigos en su línea de visión.',
        adaptation2D: 'Emite ondas sónicas concéntricas que marcan siluetas rojas de enemigos en el mapa y HUD.'
      },
      X: {
        id: 'hunters_fury',
        name: 'Hunter\'s Fury (Furia del Cazador)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 8,
        charges: 3,
        damagePerBeam: 80,
        desc: 'Equipa un arco con 3 rayos de energía de largo alcance que atraviesan todas las paredes del mapa.',
        adaptation2D: 'Tres disparos de haz electromagnético colosal que ignoran muros y revelan a los enemigos dañados.'
      }
    }
  },

  brimstone: {
    id: 'brimstone',
    name: 'Brimstone',
    role: 'CONTROLLER',
    country: 'EE. UU.',
    color: '#ea580c',
    avatar: '🎖️',
    spriteRow: 0,
    spriteCol: 0,
    desc: 'Comandante orbital: despliega pantallas de humo de larga duración y letales ataques orbitales.',
    passive: {
      name: 'Tactical Map Mastery',
      desc: 'Puede apuntar habilidades orbitales directamente desde el mapa táctico.'
    },
    abilities: {
      C: {
        id: 'stim_beacon',
        name: 'Stim Beacon (Baliza Estimulante)',
        key: 'C',
        type: 'BUFF',
        charges: 1,
        cost: 200,
        duration: 8.0,
        radius: 120,
        desc: 'Despliega una baliza que otorga fuego rápido y mayor velocidad de movimiento a todos los aliados en el área.',
        adaptation2D: 'Zona luminosa circular que otorga +20% velocidad de movimiento y +15% cadencia de tiro.'
      },
      Q: {
        id: 'incendiary',
        name: 'Incendiary (Granada Incendiaria)',
        key: 'Q',
        type: 'AREA_DAMAGE',
        charges: 1,
        cost: 250,
        duration: 7.0,
        radius: 95,
        damagePerSec: 60,
        desc: 'Lanza una granada incendiaria con lanzagranadas que rebota y crea una zona persistente de fuego mortal.',
        adaptation2D: 'Proyectil parabólico que rebota y deja una densa alfombra de fuego táctico.'
      },
      E: {
        id: 'sky_smoke',
        name: 'Sky Smoke (Humo Orbital)',
        key: 'E',
        type: 'SMOKE',
        charges: 3,
        cost: 100,
        duration: 19.25,
        radius: 110,
        desc: 'Abre el mapa táctico para solicitar hasta 3 nubes de humo densas que caen del cielo y bloquean la visión por 19s.',
        adaptation2D: 'Humo táctico orbital ultra duradero que bloquea la visión y el minimapa de esa zona.'
      },
      X: {
        id: 'orbital_strike',
        name: 'Orbital Strike (Láser Orbital)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 7,
        duration: 3.5,
        radius: 160,
        damagePerSec: 130,
        desc: 'Abre el mapa y desata un rayo orbital colosal que incinera instantáneamente a todo lo que esté en su radio.',
        adaptation2D: 'Columna de plasma orbital que causa 130 de daño por segundo a enemigos atrapados en el epicentro.'
      }
    }
  },

  sage: {
    id: 'sage',
    name: 'Sage',
    role: 'SENTINEL',
    country: 'China',
    color: '#10b981',
    avatar: '💎',
    spriteRow: 3,
    spriteCol: 0,
    desc: 'El baluarte del equipo: levanta muros de jade, ralentiza el avance enemigo y revive caídos.',
    passive: {
      name: 'Resilient Ward',
      desc: 'Inmune a los efectos de ralentización de sus propios orbes.'
    },
    abilities: {
      C: {
        id: 'barrier_orb',
        name: 'Barrier Orb (Muro de Jade)',
        key: 'C',
        type: 'WALL',
        charges: 1,
        cost: 400,
        duration: 30.0,
        health: 800,
        desc: 'Coloca un muro sólido compuesto por 4 bloques de jade indestructibles durante los primeros segundos.',
        adaptation2D: 'Genera 4 segmentos de pared con barra de vida individual que bloquean paso de balas y jugadores.'
      },
      Q: {
        id: 'slow_orb',
        name: 'Slow Orb (Orbe de Hielo)',
        key: 'Q',
        type: 'SLOW',
        charges: 2,
        cost: 200,
        duration: 7.0,
        radius: 110,
        desc: 'Lanza un orbe de jade que detona al tocar el suelo, creando un campo congelado que ralentiza un 50% y hace ruido al pisarlo.',
        adaptation2D: 'Zona de suelo escarchado que reduce a la mitad la velocidad de los jugadores.'
      },
      E: {
        id: 'healing_orb',
        name: 'Healing Orb (Orbe Curativo)',
        key: 'E',
        type: 'HEAL',
        charges: 1,
        cooldown: 45,
        cost: 0,
        healAlly: 100,
        healSelf: 30,
        desc: 'Canaliza un orbe de curación sobre un compañero herido o sobre sí misma para regenerar vida con el tiempo.',
        adaptation2D: 'Haz de jade que restaura 100 HP al aliado apuntado o 30 HP a Sage si se activa sola.'
      },
      X: {
        id: 'resurrection',
        name: 'Resurrection (Resurrección)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 8,
        desc: 'Apunta al cuerpo de un aliado eliminado y lo devuelve a la vida con salud completa tras una breve canalización.',
        adaptation2D: 'Revive instantáneamente a un compañero caído en su punto de defunción con 100 HP.'
      }
    }
  },

  chamber: {
    id: 'chamber',
    name: 'Chamber',
    role: 'SENTINEL',
    country: 'Francia',
    color: '#eab308',
    avatar: '👓',
    spriteRow: 0,
    spriteCol: 1,
    desc: 'El caballero de la alta costura armado con un arsenal letal personal y teletransporte rápido.',
    passive: {
      name: 'Custom Arsenal',
      desc: 'Sus armas especiales tienen miras de alta precisión integradas.'
    },
    abilities: {
      C: {
        id: 'trademark',
        name: 'Trademark (Trampa Escáner)',
        key: 'C',
        type: 'TRAP',
        charges: 1,
        cost: 200,
        radius: 140,
        desc: 'Coloca una trampa invisible que escanea el entorno. Al detectar a un enemigo, crea un campo que ralentiza.',
        adaptation2D: 'Dispositivo táctico que activa una zona de slow cuando un rival entra en su radio de visión.'
      },
      Q: {
        id: 'headhunter',
        name: 'Headhunter (Pistola Pesada)',
        key: 'Q',
        type: 'WEAPON',
        charges: 8,
        cost: 150,
        damageHead: 159,
        damageBody: 55,
        desc: 'Equipa una pistola pesada personalizada con mira óptica capaz de eliminar de un solo disparo a la cabeza.',
        adaptation2D: 'Arma semiautomática ultra precisa de alto daño que ignora penalizaciones de movimiento al apuntar.'
      },
      E: {
        id: 'rendezvous',
        name: 'Rendezvous (Teletransporte)',
        key: 'E',
        type: 'TELEPORT',
        charges: 1,
        cooldown: 30,
        cost: 0,
        radius: 180,
        desc: 'Coloca un anclaje de teletransporte. Mientras esté dentro de su rango, puede reactivarlo para teletransportarse instantáneamente.',
        adaptation2D: 'Ancla dorada en el suelo que permite escapar al instante pulsando E dentro del círculo dorado.'
      },
      X: {
        id: 'tour_de_force',
        name: 'Tour de Force (Francotirador Pesado)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 8,
        bullets: 5,
        damageHead: 255,
        damageBody: 150,
        desc: 'Invoca un rifle de francotirador personalizado que elimina de 1 disparo al cuerpo y crea un campo de ralentización al abatir a un rival.',
        adaptation2D: 'Rifle sniper dorado letal que genera una trampa de ralentización en la posición del enemigo abatido.'
      }
    }
  },

  omen: {
    id: 'omen',
    name: 'Omen',
    role: 'CONTROLLER',
    country: 'Desconocido',
    color: '#6366f1',
    avatar: '👻',
    spriteRow: 0,
    spriteCol: 2,
    desc: 'Sombra fantasmal que ciega a través de las paredes y se teletransporta por cualquier rincón del mapa.',
    passive: {
      name: 'Shadow World',
      desc: 'Puede visualizar la dimensión oscura para colocar humos con precisión milimétrica.'
    },
    abilities: {
      C: {
        id: 'shrouded_step',
        name: 'Shrouded Step (Paso Tenebroso)',
        key: 'C',
        type: 'TELEPORT',
        charges: 2,
        cost: 100,
        range: 300,
        desc: 'Canaliza un breve salto dimensional para aparecer en la ubicación seleccionada a corta distancia.',
        adaptation2D: 'Permite saltar esquinas y obstáculos apareciendo en el punto seleccionado tras 1s.'
      },
      Q: {
        id: 'paranoia',
        name: 'Paranoia (Sombra Cegadora)',
        key: 'Q',
        type: 'FLASH',
        charges: 1,
        cost: 250,
        duration: 2.5,
        desc: 'Dispara un proyectil de sombra en línea recta que atraviesa todas las paredes y deja sordos y miopes a todos los alcanzados.',
        adaptation2D: 'Rayo tenebroso que atraviesa muros y reduce el rango de visión a 1 metro durante 2.5s.'
      },
      E: {
        id: 'dark_cover',
        name: 'Dark Cover (Humo Sombrío)',
        key: 'E',
        type: 'SMOKE',
        charges: 2,
        cooldown: 30,
        cost: 0,
        duration: 15.0,
        radius: 100,
        desc: 'Lanza un orbe sombrío que viaja hasta la posición elegida y se expande en una esfera hueca de humo.',
        adaptation2D: 'Esfera oscura táctica con interior translúcido y borde exterior opaco que se regenera con cooldown.'
      },
      X: {
        id: 'from_the_shadows',
        name: 'From the Shadows (Teletransporte Global)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 7,
        desc: 'Selecciona cualquier punto del mapa táctico para teletransportarse allí. Aparece como una sombra antes de materializarse.',
        adaptation2D: 'Teletransporte ilimitado en cualquier zona del mapa con minimapa táctico interactivo.'
      }
    }
  },

  killjoy: {
    id: 'killjoy',
    name: 'Killjoy',
    role: 'SENTINEL',
    country: 'Alemania',
    color: '#eab308',
    avatar: '🤖',
    spriteRow: 1,
    spriteCol: 1,
    desc: 'La genio de la ingeniería alemana que defiende sitios enteros con torretas autónomas y nanoplásticos.',
    passive: {
      name: 'Tech Network',
      desc: 'Sus dispositivos se desactivan si Killjoy se aleja más de 40 metros de ellos.'
    },
    abilities: {
      C: {
        id: 'nanoswarm',
        name: 'Nanoswarm (Granada Enjambre)',
        key: 'C',
        type: 'TRAP',
        charges: 2,
        cost: 200,
        radius: 85,
        damagePerSec: 70,
        desc: 'Lanza una granada silenciosa invisible en el suelo. Al activarla, desata un enjambre de nanobots abrasivos.',
        adaptation2D: 'Trampa activable a distancia que devora la salud de cualquier jugador en su radio.'
      },
      Q: {
        id: 'alarmbot',
        name: 'Alarmbot (Bot de Alarma)',
        key: 'Q',
        type: 'TRAP',
        charges: 1,
        cost: 200,
        desc: 'Despliega un robot que persigue a los enemigos que entran en su rango, explotando y aplicando VULNERABILIDAD (reciben el doble de daño).',
        adaptation2D: 'Unidad móvil que corre hacia el enemigo y le aplica estado VULNERABLE x2 daño por 4s.'
      },
      E: {
        id: 'turret',
        name: 'Turret (Torreta Automática)',
        key: 'E',
        type: 'DEPLOYABLE',
        charges: 1,
        cooldown: 20,
        cost: 0,
        health: 125,
        damagePerBurst: 24,
        range: 350,
        desc: 'Coloca una torreta que dispara ráfagas de 3 tiros a cualquier enemigo visible en un arco de 180°.',
        adaptation2D: 'Entidad centinela que detecta y dispara automáticamente a los atacantes en su línea de visión.'
      },
      X: {
        id: 'lockdown',
        name: 'Lockdown (Dispositivo de Confinamiento)',
        key: 'X',
        type: 'ULTIMATE',
        requiredPoints: 8,
        windup: 13.0,
        health: 150,
        radius: 400,
        desc: 'Coloca un dispositivo gigante que, tras 13 segundos de carga, detiene y desarma a todos los enemigos en su enorme radio.',
        adaptation2D: 'Domo de confinamiento que aplica estado INMOVILIZADO y DESARMADO por 8 segundos a todos los enemigos que no logren destruirlo o salir.'
      }
    }
  }
}
