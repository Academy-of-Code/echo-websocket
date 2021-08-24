'use strict';

const express = require('express');
const { Server } = require('ws');
const https = require('https');


const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const supportedSockets = ["ChatApp1","Multiplayer-Snakes","Gameshub-Api"]
var clients = []

// Multiplayer-Snakes
var players_mpSnakes = [

]
var rooms = [
  {code:'_GLOBAL'}
]

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws,req) => {
  ws.isAlive = true;
  var websocketReason = 'Unknown'
  var clientId = randomId(16);
  const IP = req.socket.remoteAddress
  var username = 'unknown'
  
  var clientJSON = {id:clientId,reason:websocketReason,socketClient:ws,ip:IP,admin:false,username:'unknown'}
  clients.push( clientJSON )
  
  console.log('Client *'+clientId+'* connected');
  ws.on('message', function incoming(message) {
    if(message.startsWith('REASON-')){
      var reason = message.split('-')[1];
      websocketReason = reason
      var index = findIndexId(clients,clientId);
      clients[index].reason = websocketReason
    }
    else if(message.startsWith('admin_li-')){
      var user = message.split('-')[1];
      var pass = message.split('-')[2];
      // websocketReason = reason
      var index = findIndexId(clients,clientId);
      if(user==='BBM'&&pass==='Mamaw77$'){
        clients[index].admin = true
      }
    }
    else if(message.startsWith('username-')){
      var user = message.split('-')[1];
      // websocketReason = reason
      var index = findIndexId(clients,clientId);
      clients[index].username = user
      username = user
      reasonComplete(clients[index].reason,clients[index])
    }
    else{
      // console.log(message);
      if(websocketReason === 'ChatApp1'){ ChatApp1(message,ws,clientId,IP,username); }
      else if(websocketReason === 'Multiplayer-Snakes'){}
      else if(websocketReason === 'Gameshub-Api'){ httpRequestGameshubApi(message,ws,clientId,IP) }
    }
  })
  
  ws.on('close', function close() {
    console.log('Client *'+clientId+'* disconnected')
    if(clientJSON.reason==='ChatApp1'){
      ChatApp1(clientJSON.username+' has left!',clientJSON,clientJSON.id,':::wss://multi-tool-websocket.heroku.app','Server')
    }
  });
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

function reasonComplete(reason,client){
  if(reason==='ChatApp1'){
    ChatApp1(client.username+' has joined!',client,client.id,'wss://multi-tool-websocket.heroku.app','Server')
  }
  else if(reason==='Multiplayer-Snakes'){
    var playerSnake = [{x:150,y:150,dx:5,dy:0}]
  }
}

function MultiplayerSnakes(msg,client,clientID,ip,username){}

function httpRequestGameshubApi(msg,client,clientId,ip){//method,hostname,path){
    const customErrorMessage = "404: An Error has occured! -Dev Dillion"
    
    splits = msg.split('-')
    hostname = splits[0]
    path = splits[1]
    method = splits[2].toUpperCase()
    
    const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: method.toUpperCase()
      }
      
      const req = https.request(options, res => {
        res.on('data', d => {
          client.socketClient.send( d )
          //return(d)
        })
      })
      
      req.on('error', error => {
        client.socketClient.send( customErrorMessage )
        //return(customErrorMessage)
      })
      
      req.end()
}

function ChatApp1(msg,client,clientID,ip,username){
  var clientMessage = msg
  clients.forEach(function each(clientA) {
    if(clientA.reason==='ChatApp1'){
      if(clientA.admin===true){
        clientA.socketClient.send( JSON.stringify([username,clientMessage,ip]) );
      }
      else{
        clientA.socketClient.send( JSON.stringify([username,clientMessage]) );
      }
      console.log( JSON.stringify([username,clientMessage,ip]) )
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
