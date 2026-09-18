# Cliente Socket.io: integración

Esta entrega actualiza la estructura plana `js/` del proyecto `web-project`. No insertes estos módulos directamente en el HTML monolítico: utiliza el index modular. El ZIP de integración contiene todos los módulos JS actualizados; sustituye tu carpeta `js/` completa, conservando CSS y assets.

Render ya está configurado como destino predeterminado en `net.js`: `https://axie-smash-server.onrender.com`. No necesitas añadir configuración para conectarte. El timeout predeterminado es de 60 segundos para dar margen al arranque del backend. Si necesitas sobrescribir las opciones, antes del script module de `game.js`, añade:

```html
<script>
window.AXIE_NET = {
  url: 'https://axie-smash-server.onrender.com',
  path: '/socket.io',
  timeout: 60000
};
</script>
<script type="module" src="./js/game.js"></script>
```

En desarrollo usa `http://localhost:3000`. El cliente carga el script servido por el backend `/socket.io/socket.io.js`; alternativamente configura `clientScript` con una URL al bundle standalone Socket.io 4.x, o carga ese bundle antes del juego. El backend debe permitir el origen exacto del frontend (CORS). Para una página HTTPS utiliza servidor HTTPS. No se requiere instalar un paquete en el frontend.

## API pública

```js
import {NetworkClient} from './js/net.js';
const net = new NetworkClient(); // URL oficial de Render
const room = await net.createRoom(); // {roomId:'ABC123',role:'P1'}
// En otro cliente: await net.joinRoom('ABC123') -> role:'P2'
const unsubscribe = net.on('game:action', packet => console.log(packet));
net.sendGameAction({matchId:'id-servidor',type:'input',keys:['a','j']});
unsubscribe();
net.disconnect();
```

El servidor, NO el navegador, genera códigos únicos y asigna roles. La petición usa ACK con timeout; errores muestran un mensaje y permiten reintentar. No se encolan inputs desconectados. La reconexión automática está deshabilitada: si cae una sesión se vuelve a Sala, evitando restaurar partidas con identidad o estado obsoleto.

## Contrato obligatorio del servidor (Socket.io 4.x)

Todas las respuestas ACK: `{ok:true,...,serverNow:Date.now()}` o `{ok:false,error:'Mensaje'}`. El servidor debe implementar estos eventos; un servidor Socket.io vacío no basta.

| Cliente → servidor | Payload | Respuesta / efecto |
|---|---|---|
| room:create | `{}` | Reservar código alfanumérico MAYÚSCULO de 6–12 caracteres único entre salas activas; unir socket como P1. ACK `{ok:true,roomId,role:'P1',serverNow}` |
| room:join | `{roomId}` | Rechazar inexistente/llena; unir como P2. ACK `{ok:true,roomId,role:'P2',serverNow}`; emitir room:ready a AMBOS |
| selection:set | `{roomId,character,ready}` | Verificar socket y personaje jugable. Actualizar exclusivamente el slot del rol asignado. ACK; emitir selection:state a AMBOS. Cambiar personaje invalida ready. Cuando ambos confirman, emitir match:start una sola vez |
| game:action | `{roomId,matchId,seq,type:'input',keys}` | Verificar sala, fase, matchId, secuencia y límite de frecuencia; añadir role desde la identidad del socket y retransmitir SOLO al rival |
| game:snapshot | `{roomId,matchId,seq,fighters,match}` | Admitir SOLO P1, match activo y secuencia creciente; retransmitir SOLO a P2 |
| room:leave / disconnect | `{roomId}` / implícito | Limpiar membresía, destruir sala y emitir room:peer-left al rival. Ambos deben abandonar esa partida |

Servidor → ambos:

```js
// Al completar dos jugadores:
{roomId:'ABC123', selected:['oleg','kotaro']} // room:ready
// Al cambiar selección:
{roomId:'ABC123', selected:['buba','kotaro'], ready:[false,true]} // selection:state
// Al confirmar ambos: usar mismo paquete y timestamp para ambos sockets.
{roomId:'ABC123', matchId:'ID_UNICO', selected:['buba','kotaro'],
 startAt:Date.now()+2200} // match:start
// Al salir rival:
{roomId:'ABC123'} // room:peer-left
```

Solo seleccionables: oleg, buba, pomodoro, kotaro. El servidor debe rechazar momo, trip, venoki, puff. Nunca confíes en role, roomId, selección o daño declarados por un cliente; valida membresía, tamaño del paquete y rate limits. Mantén dos jugadores máximo y elimina salas abandonadas. Sin reintentos automáticos de creación: un ACK perdido puede haber creado una sala; el backend debe limpiar sockets que se desconecten y rechazar membresías duplicadas.

## Control y simulación

Cada cliente modifica únicamente su selección. Confirmar envía ready: no inicia VS localmente. `match:start` del servidor determina VS y su fin. El reloj se aproxima con el punto medio del ACK (`serverNow`); las latencias asimétricas producen desfase, corregido en combate por snapshots. No es sincronización de tiempo exacta.

P1 ejecuta la simulación a 60 Hz, colisiones y rondas. P2 envía inputs ~30 Hz (controles P1 del teclado/gamepad/táctil local) y recibe snapshots ~20 Hz de ambos luchadores y del estado de rondas. P2 no simula daño ni concede victorias. La cuenta regresiva 2,7 s y Best of 3 siguen en Match; las animaciones de P1 conservan 12/15 FPS, reflejadas en P2. No se implementa interpolación, predicción ni rollback. P1 tiene ventaja de latencia; el modelo host-autoritativo NO protege contra un host que haga trampas. Para competitivo hace falta autoridad de servidor o un diseño de rollback con validación.

`scenes.js` controla navegación y cancela su timer local VS en modo ONLINE; `room-flow.js` dibuja código/input; `online.js` mantiene listeners de sesión más allá de Sala; `selection.js` sincroniza slots y ready; `online-combat.js` transmite inputs/snapshots; `game.js` aplica estos adaptadores.

## Verificación

`node tests/net.mjs` usa un transporte simulado de dos clientes, no un backend real. Valida roles, códigos, sala llena/inexistente, ready antes del ACK, selección, inicio compartido, inputs y desconexión. `node tests/validate.mjs` valida regresiones del motor. Para prueba real abre dos navegadores contra un backend que cumpla el contrato, crea/unete, confirma ambos y prueba movimiento, ataques, rondas y desconexión.

Referencia oficial para carga standalone, eventos y ACK con timeout: https://socket.io/docs/v4/client-api/
