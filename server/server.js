const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexiones desde cualquier origen para pruebas
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`¡Un jugador se ha conectado! ID: ${socket.id}`);

    // Crear Sala
    socket.on('create-room', (callback) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        socket.join(roomId);
        socket.room = roomId;
        callback({ success: true, roomId, player: 'P1' });
        console.log(`Sala creada: ${roomId}`);
    });

    // Unirse a Sala
    socket.on('join-room', (roomId, callback) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room && room.size === 1) {
            socket.join(roomId);
            socket.room = roomId;
            callback({ success: true, roomId, player: 'P2' });
            // Avisar al otro jugador (Host) que alguien entró
            socket.to(roomId).emit('opponent-joined');
            console.log(`Jugador se unió a la sala: ${roomId}`);
        } else {
            callback({ success: false, message: 'Sala no encontrada o llena.' });
        }
    });

    // Sincronizar acciones del juego entre jugadores
    socket.on('game-action', (data) => {
        if (socket.room) {
            socket.to(socket.room).emit('game-action', data);
        }
    });

    socket.on('disconnect', () => {
        if (socket.room) {
            socket.to(socket.room).emit('opponent-disconnected');
        }
        console.log(`Jugador desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de Axie Smash corriendo en http://localhost:${PORT}`);
});