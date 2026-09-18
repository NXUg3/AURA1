# Convención del roster

Carpetas oficiales: `oleg/`, `kotaro/`, `pomodoro/`, `buba/`, `momo/`, `trip/`, `venoki/` y `puff/`.

Todas deben incluir:

- `logo.png` (icono PNG)
- `portrait.png` (arte completo PNG)

Los personajes jugables admiten además:

- `idle.png`
- `walk.png`
- `jump.png`
- `attack.png`
- `atlas.png` (respaldo opcional)

Las hojas normalizadas pueden ser tiras horizontales PNG transparentes con fotogramas de igual tamaño. Su conteo se define en `src/systems/SpriteRegistry.js`; `attack.png` alimenta el estado interno `punch`. Los personajes bloqueados ya aparecen en selección y quedan preparados para recibir sprites cuando se habiliten.
