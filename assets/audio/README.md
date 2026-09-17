# Pistas BGM

Coloca en esta carpeta exactamente:

- `press_start.mp3`: pantalla PRESS START.
- `main_menu.mp3`: menú, opciones, ayuda, controles y créditos.
- `character_select.mp3`: selección de luchadores.
- `combat_theme.mp3`: combate y resultado de la ronda.

`src/core/AudioManager.js` reproduce en bucle y realiza un fundido entre dos canales. Si una pista todavía no existe, el juego continúa sin bloquearse.
