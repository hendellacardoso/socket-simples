const express = require('express');
const boolParser = require('express-query-boolean');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const app = express();
const routes = require('./rotas');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');  

app.use(cors());
app.use(express.json({ extended: true, limit: '50mb' }));
app.use(express.text({ extended: true, limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(boolParser());

let server = http.createServer(app);
const activeSessions = {};


// Configurações de socket.io para melhorar a estabilidade da conexão
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});


io.on('connection', (socket) => {
    let clientId = socket.handshake.query.clientId;

    // Se o cliente não enviar um clientId, crie um novo UUID para ele
    if (!clientId || !activeSessions[clientId]) {
        clientId = uuidv4();  // Cria um UUID
        activeSessions[clientId] = socket.id;
        console.log(`Nova conexão com UUID: ${clientId}`);
    } else {
        console.log(`Cliente reconectado com UUID: ${clientId}`);
    }

    // Envia o clientId para o cliente
    socket.emit('session', { clientId });

    // Manter a sessão ativa para possíveis reconexões
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.io = io;
    const oldSend = res.send;
    res.send = async function (data) {
        const content = req.headers['content-type'];
        if (content === 'application/json') {
            data = JSON.parse(data);
        }
        res.send = oldSend;
        return res.send(data);
    };
    next();
});


app.use(routes);


server.listen(3001, () => {
    console.log(`Socket está em execução na porta: 3001`);
    
    io.on('connection', (socket) => {
        
        socket.onAny((event, ...args) => {
            io.emit(event, ...args);
        });
        
        socket.on('disconnect', (reason) => {
            console.log(`Cliente desconectado: ${socket.id}, motivo: ${reason}`);
        });

    });

});
