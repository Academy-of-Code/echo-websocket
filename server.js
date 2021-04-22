'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var playersArr = []

wss.on('connection', (ws) => {
  ws.isAlive = true;
  var clientId = randomId(16);
  playersArr.push( {x:0,y:0,id:clientId} );
  
  console.log( JSON.stringify(playersArr) );
  
  console.log('Client *'+clientId+'* connected');
  ws.on('message', function incoming(message) {
    if(message==='GET-PLAYERS'){
      ws.send( JSON.stringify(playersArr) )
      console.log(JSON.stringify(playersArr))
    }
    else{console.log(message)}
  })
  
  ws.on('close', function close() {
    console.log('Client *'+clientId+'* disconnected')
    playersArr.splice( playersArr.findIndex(function(item, i){return item.id===clientId}) ,1)
  });
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

var playerDataSender = setInterval(function sendData() {
  wss.clients.forEach(function each(ws) {
    ws.send( JSON.parse(playersArr) )
  });
}, 30000);

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
function noop(){}
function player(x,y,id){
  this.x = x
  this.y = y
  this.id = id
}
function heartbeat(){
  this.isAlive = true;
}
