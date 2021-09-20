'use strict';

const express = require('express');
const { Server } = require('ws');
const https = require('https');

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')


const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const supportedSockets = ["ChatApp1","Multiplayer_Snakes","Gameshub_Api","Moon_Trading_Game","mcBot"]
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
    console.log(message)
    if(message.startsWith('REASON-')){
      var reason = message.split('-')[1];
      websocketReason = reason
      var index = findIndexId(clients,clientId);
      clients[index].reason = websocketReason
      console.log(clientId+" has chosen reason "+websocketReason)
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
      console.log(clientId+" has chosen username "+username)
      reasonComplete(clients[index].reason,clients[index])    }
    else{
      console.log(message);
      if(websocketReason === 'ChatApp1'){ ChatApp1(message,ws,clientId,IP,username); }
      else if(websocketReason === 'Multiplayer_Snakes'){}
      else if(websocketReason === 'Gameshub_Api'){ httpRequestGameshubApi(message,ws,clientId,IP); console.log("Reason recieved") }
      else if(websocketReason === 'Moon_Trading_Game'){ Moon_Trading_Game_onmsg(message,ws,clientId,IP) }
      else if(websocketReason === 'mcBot'){ mcBots(message,ws,clientId,IP) }
    }
  })
  
  ws.on('close', function close() {
    console.log('Client *'+clientId+'* disconnected')
    if(clientJSON.reason==='ChatApp1'){
      ChatApp1(clientJSON.username+' has left!',clientJSON,clientJSON.id,':::wss://multi-tool-websocket.heroku.app','Server')
    }
    else if(clientJSON.reason=='Moon_Trading_Game'){mtg_leave(clientJSON)}
    else if(clientJSON.reason=='mcBot'){mcBots("leaveMinecraft",ws,clientId,IP)}
  });
  ws.on('pong', heartbeat);
});
wss.on('close', function close() {
  clearInterval(interval);
})

function reasonComplete(reason,client){
  console.log(reason)
  if(reason==='ChatApp1'){
    ChatApp1(client.username+' has joined!',client,client.id,'wss://multi-tool-websocket.heroku.app','Server')
  }
  else if(reason==='Gameshub_Api'){}
  else if(reason==='Moon_Trading_Game'){mtg_startup(client)}
  else if(reason==='mcBot'){}
}

// Start of Minecraft Bots

var bots = []

function sacMC(msg){
  clients.forEach(function each(clientA) {
    if(clientA.reason==='mcBot'){
      clientA.socketClient.send( JSON.stringify(msg) );
    }
    else{}
  });
}

function mcBots(message,client,clientId,IP){
  var hasBot = false
  for(bot in bots){
    if (bot.owner==client){
      hasBot = true
    }
  }

  if (hasBot==false){
    var botUsername = message.split("~")[0]
    var botIP = message.split("~")[1]

    var botStruc = {
      owner: client,
      minecraftBot: mineflayer.createBot({
        host: botIP,
        user: botUsername
      })
    }
    bots.push(botStruc)
    client.hasBot = true
    sacMC(botUsername+' has joined us!')
  } else{
    if(message=="leaveMinecraft"){
      for(bot in bots){
        if (bot.owner==client){
          bots.slice(bots.indexOf(bot))
        }
      }
    } else if(message=="getBots"){
      var botArr = []
      for (bot in bots){
        botArr.push(bot.user.username)
      }
      sacMC(JSON.stringify(botArr))
    }
  }
}

// End of Minecraft Bots

// Moon_Trading_Game
var moon_interval = 0
var market = []
var mtg_clients = []

function sacMoon(msg){
  clients.forEach(function each(clientA) {
    if(clientA.reason==='Moon_Trading_Game'){
      clientA.socketClient.send( JSON.stringify(msg) );
    }
    else{}
  });
}

function mtg_startup(client){
  var clientStringify = JSON.stringify(client)
  mtg_clients.push({'id':client.id,'moons':10,'mega_moons':0,'misc':[]})
}
function mtg_leave(clientData){
  for(var x=0;x<mtg_clients.length;x++){
    if (mtg_clients[x].id==clientData.id){
      mtg_clients.splice(x,1)
      break
    }
  }
}
function Moon_Trading_Game_onmsg(msg, client, clientId, clientIp){
  var msgSplits = msg.split("-")
  if(msgSplits[0]==="accept"){
    var marketId = msgSplits[1] || -1
    if(marketId!=-1){
      var marketItem = market[marketId] || null
      if(marketItem!=null){
        for(var i=0;i<mtg_clients.length;i++){
          if(mtg_clients[i].id==clientId){
            mtg_clients[i].misc.push(marketItem)
            if(marketItem.currency==='moons'){
              mtg_clients[i].moons -= marketItem.currencyAmmount
            } else if(marketItem.currency==='mega_moons'){
              mtg_clients[i].mega_moons -= marketItem.currencyAmmount
            }
            for(var x=0;x<mtg_clients.length;x++){
              if(mtg_clients[x].sellerId==marketItem.sellerId){
                if(marketItem.currency==='moons'){
                  mtg_clients[x].moons += marketItem.currencyAmmount
                } else if(marketItem.currency==='mega_moons'){
                  mtg_clients[x].mega_moons += marketItem.currencyAmmount
                }
              }
            }
            market.splice(marketId,1)
          }
        }
      }
    }
  } else if(msgSplits[0]==="sell"){
    market.push(JSON.parse(msgSplits[1]))
  }
}

var Moon_Trading_Game_Loop = setInterval(function(){
  moon_interval += 1
  if(moon_interval>1000){
    moon_interval = 0
  }
  sacMoon({
    'market': market,
    'clients': mtg_clients,
    'moon_interval': moon_interval
  })
},10)

// end of Moon_Trading_Game

function httpRequestGameshubApi(msg,client,clientId,ip){//method,hostname,path){
    console.log(msg+" Sent")
  
    const customErrorMessage = "404: An Error has occured! -Dev Dillion"
    
    var splits = msg.split(';')
    var hostname = splits[0]
    var path = splits[1]
    var method = splits[2].toUpperCase()
    
    const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: method.toUpperCase()
      }
      
      const req = https.request(options, res => {
        res.on('data', d => {
          client.send( d )
          //return(d)
        })
      })
      
      req.on('error', error => {
        client.send( customErrorMessage )
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
