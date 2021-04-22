'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

const interval  = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);
function noop(){}
function heartbeat(){
  this.isAlive = true;
}
