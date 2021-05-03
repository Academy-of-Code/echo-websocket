'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var servers = [];
var storeageUnits = [];

wss.on('connection', (ws) => {
  ws.isAlive = true;
  const connectionId = randomId(16);
  
  console.log(connectionId+' is our new Connection!');
  servers.push( { memory: [], id: connectionId, use: 'Unknown' } )
  
  ws.on('message', function incoming(message) {
    
    if(message.startsWith('STORE-')){
      const key = {0: 'JSON', 1: 'Blob', 2: 'Array', 3: 'UNKNOWN'}
      var storageUnit = message.split('-')[1];
      var storageUnitName = message.split('-')[2]
      var storageType = message.split('-')[3]
      
      const index = servers.findIndex( function(item,i){return item.id===connectionId} )
      
      if(storageType===0){servers[index].memory.push( {storageUnitName: JSON.parse(storageUnit), storageId: randomId(16)} )}
      else if(storageType===1){servers[index].memory.push( {storageUnitName: storageUnit, storageId: randomId(16)} )}
      
      console.log(storageUnit);
      ws.send('I have stored '+storageUnit)
    }
    else if(message.startsWith('GET-')){
      var storageUnitId = message.split('-')[1]
      var storageUnitName = message.split('-')[2]
      
      const serverIndex = servers.findIndex( function(item,i){return item.id===connectionId} )
      var storageIndex = null
      
      if(storageUnitId!==null&&storageUnitId!==undefined&&storageUnitId.length===16){
        storageIndex = server[serverIndex].memory.findIndex( function(item,i){return item.id===storageUnitId} )
      }
      else if(storageUnitName!==null&&storageUnitName!==undefined){
        storageIndex = server[serverIndex].memory.findIndex( function(item,i){return item.id===storageUnitName} )
      }
      else{
        ws.send('Error! I was unable to send your data.')
      }
      
      var storageData = server[serverIndex].memory[storageIndex]
      
      console.log(storageData);
      ws.send(storageData)
    }
    else if(message==='CLEAR-MEMORY'){
      const serverIndex = servers.findIndex( function(item,i){return item.id===connectionId} )
      server[serverIndex].memory = []
    }
    else if(message.startsWith('REMOVE_MEMORY-')){
      var storageUnitId = message.split('-')[1]
      var storageUnitName = message.split('-')[2]
      
      const serverIndex = servers.findIndex( function(item,i){return item.id===connectionId} )
      var storageIndex = null
      
      if(storageUnitId!==null&&storageUnitId!==undefined&&storageUnitId.length===16){
        storageIndex = server[serverIndex].memory.findIndex( function(item,i){return item.id===storageUnitId} )
      }
      else if(storageUnitName!==null&&storageUnitName!==undefined){
        storageIndex = server[serverIndex].memory.findIndex( function(item,i){return item.id===storageUnitName} )
      }
      else{
        ws.send('Error! I was unable to send your data.')
      }
      
      server[serverIndex].memory.splice(storageIndex,1)
      
      console.log(storageData);
      ws.send(storageData)
    }
    
  })
  
  ws.on('close', function close() {
    const serverIndex = servers.findIndex( function(item,i){return item.id===connectionId} );
    console.log(serverIndex)
    server.splice(serverIndex,1);
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
