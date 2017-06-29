var express = require('express');
var http = require('http');
var socket = require('socket.io');
var fileSystem = require('fs');

var app = express();
app.use(express.static('public'));

var server = http.createServer(app);

server.listen(3000, function(){
  console.log("Server is listening on port 3000");
});

var io = socket(server);

io.on('connection', function(socket){
  console.log('socket.io: ' + socket.id + ' connected');

  socket.on('chat', function(data){
    var message = data.message;
    var handle = data.handle;

    if (message.indexOf('/changename') == 0) {
      var tags = message.split(" ");
      if (tags.length === 2) {
        socket.emit('change-name', {'result': true, 'handle': tags[1]});
      } else {
        socket.emit('change-name', {'result': false, 'handle': undefined});
      }
      return;
    }

    if (message.charAt(0) != '/'){
      io.sockets.emit('chat', data);
    }

  })
});
