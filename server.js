'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const supportedSockets = ["ChatApp1"]
var clients = []

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  var websocketReason = 'Unknown'
  var clientId = randomId(16);
  
  var clientJSON = {id:clientId,reason:websocketReason,socketClient:ws}
  clients.push( clientJSON )
  
  console.log('Client *'+clientId+'* connected');
  ws.on('message', function incoming(message) {
    if(message.startsWith('REASON-')){
      var reason = message.split('-')[1];
      websocketReason = reason
      var index = findIndexId(clients,clientId);
      clients[index].reason = websocketReason
    }
    else{
      // console.log(message);
      if(websocketReason === 'ChatApp1'){ ChatApp1(message,ws,clientId); }
    }
  })
  
  ws.on('close', function close() {
    console.log('Client *'+clientId+'* disconnected')
  });
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

function ChatApp1(msg,client,clientID){
  var clientMessage = msg.split('-')[1];
  clients.forEach(function each(clientA) {
    if(clientA.reason==='ChatApp1'){
      clientA.socketClient.send( JSON.stringify([clientMessage]) );
      console.log( JSON.stringify([clientMessage]) )
    }
    else{}
  });
}

const interval  = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);
function randomId(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}
function findIndexId(arr, id) {
  for (var i=0; i < arr.length; i++){
    var arrObj = arr[i]
    if(arrObj.id===id){
      return(i)
    }
  }

  // will return undefined if not found; you could return a default instead
}
function noop(){}
function player(x,y,id){
  this.x = x
  this.y = y
  this.id = id
}
function heartbeat(){
  this.isAlive = true;
}
