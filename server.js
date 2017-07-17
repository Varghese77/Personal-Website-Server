// Dependencies
var express = require('express');
var http = require('http');
var messageServer = require('./lib/messenger_server.js');

// Networking Info
var ip = process.env.IP;
var port = process.env.PORT;


// Set Up HTTP and Sockets.io Server
var app = express();
app.use(express.static('public'));
var server = http.createServer(app);
server.listen(port, function(){
  console.log('Server is listening on port ' + port);
});

var io = messageServer(server);