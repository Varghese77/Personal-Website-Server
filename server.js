// Dependencies
var express = require('express');
var http = require('http');
var messageServer = require('./lib/messenger-server');
var fs = require('fs');

// Initial SetUp Data
var setupData = JSON.parse(
  fs.readFileSync('setup-data.json'), 'utf8');

// Set Up HTTP and Sockets.io Server
var app = express();
app.use(express.static('public'));
var server = http.createServer(app);
server.listen(setupData.port.toString(), function(){
  console.log('Server is listening on port ' + setupData.port);
});

var io = messageServer(server);
