// Dependencies
var express = require('express');
var http = require('http');
var fileSystem = require('fs');
var messageServer = require('./lib/messenger_server.js');


// Set Up HTTP and Sockets.io Server
var app = express();
app.use(express.static('public'));
var server = http.createServer(app);
server.listen(3000, function(){
  console.log("Server is listening on port 3000");
});

var io = messageServer(server);