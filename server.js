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
var bannedIps = ['null']

wss.on('connection', (ws) => {
  var clientName = clientNameArr[randomInt(0,clientNameArr.length)]
  const clientIP = req.socket.removeAddress
  if(checkBannedIps(clientIP)===403){ws.send('SERVER-KICK')}
  
  console.log('Client *'+clientName+'* connected');
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('message', function incoming(message) {
    console.log(clientName+': '+message)
    sendToAllClients(clientName+': '+message)
  });
});

function sendToAllClients(msg){
  wss.clients.forEach((client) => {
    client.send(msg)
    return(msg)
  });
}
function checkBannedIps(ip){
  for(var x=0;x<bannedIps.length;x++){
    var compareIp = bannedIps[x]
    if(ip!==compareIp){}
    else{return(403)}
  }
}
function randomInt(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
