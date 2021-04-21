'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

const clientNameArr = ['John','Billy','Harold','Dillion','Dylan','Nemo','Car Guy','Computor Geek','NerdMan2000','xX_PinkUnicorns_Xx']

wss.on('connection', (ws) => {
  var clientName = clientNameArr[randomInt(0,clientNameArr.length)]
  
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('message', () => function(event) {
    sendToAllClient(clientName+": "+event.data)
  });
  
});

function sendToAllClients(msg){
  wss.clients.forEach((client) => {
    client.send(msg)
  });
}
function randomInt(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
