'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var games = []

wss.on('connection', (ws) => {
  ws.isAlive = true;
  var clientId = randomId(16);
  
  console.log('Client *'+clientId+'* connected');
  ws.send('Hey you connected client *'+clientId+'*')
  
  ws.on('message', function incoming(message) {
    var msg = message
    if(msg.startsWith('UPDATE-')){
      var gameName = msg.split('-')[1]
      
      var cycles = 0
      var match = false
      for(var x=0;x<games.length;x++){
        var gamee = games[x]
        if(gamee.gameName===gameName && gamee!==undefined && gamee.gameName!==undefined){
          gamee.clicks+=1
          match = true
          cycles+=1
          console.log('Match found, Match now has '+gamee.clicks)
        }
      }
      if(match===false /* && cycles===games.length */){
        games.push( {gameName:gameName,clicks:1,gameIndex:games.length,displayName:msg.split('-')[2]} )
        console.log('Match not found! Making index for '+msg.split('-')[2]);
      }
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
function heartbeat(){
  this.isAlive = true;
}
