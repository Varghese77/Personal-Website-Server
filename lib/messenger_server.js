var socket = require('socket.io');

// main Socket.io Server
var io;

// Webchat Data Structures
var onlineUsers = new Map();
var handleSet = new Map();

function addName(socketID, handle) {
  onlineUsers.set(socket.id, handle);
  handleSet.set(handle, true);
}



function createSocketIOServer(server) {

  io = socket(server);

  io.on('connection', function(socket) {
    // Initial Connection SetUp
    console.log('socket.io: ' + socket.id + ' connected');
    
    addName(socket.id, socket.id);

    socket.emit('welcome', {
      'message': welcomeMessage(socket.id),
      'handle': socket.id
    });

    // Handle Input
    socket.on('command', function(data){
      console.log(socket.id + ' entered \"command\" ' + data.message);

      var message = data.message.trim();
      var handle = data.handle;
      switch(true) {
        case message.indexOf('/changename') == 0:  //changename command
            var tags = message.split(" ");
            if (tags.length === 2) {
              socket.emit('change-name', {
                'result': true,
                'handle': tags[1]
              });
            } else {
              socket.emit('change-name', {
                'result': false,
                'handle': undefined
              });
            }

            return;
        default:
          socket.emit('chat', {
            'message': 'Server encountered error parsing command',
            'handle': 'Console'
          });
          return;
      }
    });

    socket.on('chat', function(data) {
      var message = data.message;
      var handle = data.handle;
      if (message.charAt(0) != '/') {
        io.sockets.emit('chat', data);
      }
    })
  });

  return io;
}

function welcomeMessage(socketID){
  return 'Hello and welcome to Messenger. You are currently in the global ' +
  'chat room. Type <i>/help</i> for help. Your username is currently set to ' + 
  socketID;
}

module.exports = createSocketIOServer;