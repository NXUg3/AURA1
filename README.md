# Axie Smash — proyecto ligero

## Tema arcade ilustrado

Esta edición reemplaza la apariencia 2XKO por un tema de recreativa no pixel art: marcos dorados, botones con relieve, paneles redondeados y arte suavizado. `css/arcade.css` contiene el tema y se carga después de los estilos estructurales.

Recupera el menú directo del primer diseño: Arcade, Versus, Multijugador, Perfil, Ayuda, Controles, Opciones, Créditos y Salir, con descripciones al enfocar o pasar el cursor. Perfil y sala mantienen sus funciones actuales; los modos no implementados siguen bloqueados. Arcade es combate individual contra CPU, no una campaña de combates consecutivos.

Opciones vuelve a ofrecer 1280×720/1920×1080, presentación a 30/60 FPS y volumen de efectos separado, además de idioma, volumen general y recarga de recursos. Se guardan automáticamente. La simulación continúa a 60 Hz y los sprites a 12/15 FPS independientemente de la presentación. Conserva intro, roster oficial, PNG, VS, cuenta regresiva, rondas, AXP/Overdrive, teclado remapeable, gamepad y controles táctiles.

Publica únicamente el contenido de esta carpeta. No es necesario usar los archivos HTML grandes de ediciones anteriores.

## Estructura entregada

```text
web-project/
├─ index.html                  # Canvas y contenedores, sin medios incrustados
├─ css/
│  ├─ styles.css               # Estética, menús, HUD metálico, fondo responsivo
│  └─ layout.css               # Ajustes de cuadrícula y tamaños pequeños
├─ js/
│  ├─ config.js                # Roster, rutas, estados y configuración
│  ├─ audio.js                 # BGM con transición y efectos sintetizados
│  ├─ scenes.js                # Navegación, menú, título, intro y VS
│  ├─ game.js                  # Entrada del motor, simulación y coordinación
│  ├─ assets.js                # Precarga, detección de hojas y caché
│  ├─ frames.js                # Coordenadas de las hojas actuales
│  ├─ sprite-cache.js          # Transparencia, recorte y contornos precalculados
│  ├─ renderer.js              # Dibujo del escenario y luchadores
│  ├─ fighter.js               # Físicas, estados y colisiones por fotograma
│  ├─ animation.js             # Acumulador visual a 12/15 FPS
│  ├─ loop.js                  # Simulación fija a 60 Hz
│  ├─ match.js                 # Ready/Steady/Fight, reloj y rondas
│  ├─ hud.js                   # Logos PNG, barras y orbes de rondas
│  ├─ selection.js             # Cuadrícula de ocho slots y cursores
│  ├─ panels.js                # Opciones, controles, perfil, ayuda y créditos
│  ├─ lobby.js                 # Lobby local entre pestañas
│  ├─ i18n.js                  # Español, inglés y japonés
│  └─ dom.js                   # Construcción segura de elementos UI
├─ assets/
│  ├─ sprites/
│  │  ├─ oleg/                # logo.png, portrait.png, atlas.png
│  │  ├─ momo/                # logo.png, portrait.png
│  │  ├─ buba/                # logo.png, portrait.png, atlas.png
│  │  ├─ pomodoro/            # logo.png, portrait.png, atlas.png
│  │  ├─ trip/                # logo.png, portrait.png
│  │  ├─ venoki/              # logo.png, portrait.png
│  │  ├─ puff/                # logo.png, portrait.png
│  │  └─ kotaro/              # logo.png, portrait.png, atlas.png, idle.png
│  ├─ ui/
│  │  ├─ game-logo.png
│  │  └─ menu-background.jpg  # Imagen adjunta restaurada
│  ├─ audio/
│  │  └─ press_start.mp3
│  └─ video/
│     └─ intro.mp4
├─ tests/validate.mjs
└─ package.json
```

Los archivos de código están por debajo de 6 KB. Los módulos auxiliares evitan concentrar nuevamente todo en los seis archivos principales. Los medios son externos; el archivo multimedia más grande incluido es el video de aproximadamente 9 MB. No se requiere compilación ni instalar dependencias.

## Ejecutar localmente

Abre una terminal **dentro de `web-project/`**:

```powershell
python -m http.server 8080
```

Visita `http://localhost:8080/`. No abras los módulos directamente con doble clic: necesitan HTTP.

## GitHub Pages

Publica únicamente el **contenido de `web-project/`**, conservando `index.html`, `css/`, `js/` y `assets/` al mismo nivel. No publiques la carpeta anterior `outputs/`, el HTML gigante ni los ZIP de entregas anteriores. Las rutas se resuelven desde la raíz del juego, por lo que también funcionan en subdirectorios de GitHub Pages.

## Logos y actualización automática

Reemplaza `assets/sprites/[nombre]/logo.png`. Al recargar el juego se genera una versión nueva en la URL, por ejemplo `logo.png?v=...`, sin necesidad de borrar la caché profunda. Dentro del juego, **Opciones → Reiniciar recursos** cambia la versión, vacía la caché de imágenes y reconstruye los sprites. Los logos de selección y HUD usan las mismas rutas.

Opcionalmente puedes fijar la versión de un despliegue con `?assetsVersion=release-2`. Si la fijas, cambia ese valor cuando reemplaces medios. Reiniciar recursos siempre genera una versión nueva aunque hayas fijado la inicial.

Cada luchador jugable detecta automáticamente `idle.png`, `walk.png`, `jump.png` y `attack.png`; si faltan, se usa el estado del atlas configurado. Los errores de esas hojas opcionales no bloquean el juego. Una hoja nueva con otro conteo o cuadrícula se configura en `frames.js`. No se pueden enumerar carpetas estáticas del servidor: la detección prueba estos nombres estandarizados.

## Combate

La simulación corre a 60 Hz mediante un acumulador independiente del render. Idle/Walk avanzan a 12 FPS y Jump/Punch a 15 FPS. El cel-shading, los contornos y la transparencia se preparan antes del combate. Las cajas de ataque siguen el fotograma visual.

Ready → Steady → Fight dura 2700 ms y detiene físicas, ataques y reloj. Se necesitan dos rondas para ganar; 1–1 activa Round Final. Un empate repite la misma ronda sin puntos. La revancha reinicia el marcador.

## Audio pendiente

Añade las tres pistas que aún no se suministraron:

```text
assets/audio/main_menu.mp3
assets/audio/character_select.mp3
assets/audio/combat_theme.mp3
```

El gestor ya utiliza esos nombres exactos y no bloquea el juego si faltan. El navegador exige una interacción inicial para reproducir audio.

Sala es un lobby entre pestañas del mismo navegador y URL, no juego online ni sincronización de peleas entre equipos. Para eso hace falta un servidor adicional.

## Comprobación

```powershell
node tests/validate.mjs
```

Comprueba roster, medios, importaciones, límites de tamaño, animación escalonada, cuenta regresiva y rondas 2–0 / 2–1 / empate. El paquete no incluye el monolito, constructores del HTML gigante, recursos archivados ni dependencias antiguas.
