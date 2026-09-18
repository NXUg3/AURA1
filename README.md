# Axie Smash — roster oficial modular

Proyecto HTML5/Canvas listo para GitHub Pages, sin compilación ni dependencias externas.

## Estructura

```text
modular/
├─ index.html
├─ assets/
│  ├─ sprites/
│  │  ├─ oleg/
│  │  ├─ kotaro/
│  │  ├─ pomodoro/
│  │  ├─ buba/
│  │  ├─ momo/
│  │  ├─ trip/
│  │  ├─ venoki/
│  │  └─ puff/
│  │     └─ logo.png
│  ├─ ui/
│  ├─ video/intro.mp4
│  └─ audio/
│     ├─ press_start.mp3
│     ├─ main_menu.mp3
│     ├─ character_select.mp3
│     └─ combat_theme.mp3
└─ src/
   ├─ main.js
   ├─ styles/game.css
   ├─ core/
   ├─ entities/
   └─ systems/
```

## Roster

- Jugables: Oleg, Kotaro, Pomodoro y Buba.
- Bloqueados: Momo, Trip, Venoki y Puff.

Orden exacto: Oleg, Momo, Buba, Pomodoro, Trip, Venoki, Puff, Kotaro. El cursor recorre también los bloqueados; confirmar se deshabilita hasta que ambos cursores estén sobre personajes jugables.

Cada personaje carga su icono desde `assets/sprites/[nombre]/logo.png` y su arte completo desde `portrait.png`. Los cuatro personajes jugables también aceptan `atlas.png` y las hojas normalizadas `idle.png`, `walk.png`, `jump.png` y `attack.png`.

La pantalla VS precede a una secuencia Ready / Steady / Fight de 2700 ms, durante la que no avanzan las físicas, los ataques, la animación ni el cronómetro. Se necesitan dos rondas para ganar: 2–0 o 2–1. Un empate repite la misma ronda sin conceder puntos. La revancha reinicia el marcador.

## Sistemas

- `AssetLoader.js`: manifiesto y caché centralizados para sprites, logos, retratos y audio.
- `AudioManager.js`: BGM por pantalla con transición automática y fundido.
- `FixedStepLoop.js`: lógica y controles a 60 Hz.
- `AnimationSystem.js`: animación visual independiente a 12/15 FPS.
- `Fighter.js` y `SpriteRegistry.js`: físicas, estados, fotogramas, hurtboxes e hitboxes.
- `HudSystem.js`: colores del HUD industrial y logos SVG activos.

## Publicación

1. Coloca las cuatro pistas MP3 con sus nombres exactos en `assets/audio/`.
2. Reemplaza cualquier `logo.svg`, retrato o sprite conservando su ruta y nombre.
3. Publica el contenido completo de `modular/` con `index.html`, `src/` y `assets/` al mismo nivel.

Para probarlo localmente:

```powershell
python -m http.server 8080
```

Abre `http://localhost:8080/`. El audio se desbloquea con la primera interacción del usuario, según las reglas del navegador.
