// Dependencies
var socket = require('socket.io');
var fs = require('fs');

// main Socket.io Server
var io;

// Webchat Data Structures
var sockIDtoInfo = {};  // socket id to handle, room
var handleToSockID = {};  // handle to socket id
var roomMetaInfo = {};  // Stores room Meta Info

// cached Data
var totalViews = 0;
var commands = fs.readFileSync(__dirname + '/commands.txt', 'utf8');
commands = commands.replace(/(?:\r\n|\r|\n)/g, '<br />');  // help command list
var rooms = {};  // names of rooms which currently exist

// Room Object Implementation
function Room(name){
  this.name = name;
  this.size = 0;
  this.users = {}
}
Room.prototype.addUser = function(sockID){
  if (this.users[sockID] == undefined){
    this.users[sockID] = true;
    this.size++;
    return true;
  }
  return false;
}
Room.prototype.removeUser = function(sockID){
  if (!this.users[sockID]) {
    delete this.users[sockID];
    this.size--;
    return true;
  }
  return false;
}

roomMetaInfo['global'] = new Room('global');
rooms['global'] = true;

function addName(socketID, handle, room) {
  sockIDtoInfo[socketID] = {'handle': handle, 'room': room};
  handleToSockID[handle] = socketID;
}

function executeCommand(socket, data){
  console.log(socket.id + ' entered command \"' + data.message + '\"');
  var message = data.message.trim();
  var parts = data.parts;
  var handle = sockIDtoInfo[socket.id].handle;
  var command = parts[0];

  switch(true){
    case command === '/help':
      executeHelpCommand(socket);
      return;
    case command === '/listpeople':
      executeListPeopleCommand(socket);
      return;
    case command === '/listrooms':
      executeListRoomsCommand(socket);
      return;
    case command === '/wisper':
      executeWisperCommand(parts, handle);
      return;
    case command === '/changename':
      executeChangeNameCommand(socket, parts);
      return;
    case command === '/createroom':
      executeCreateRoomCommand(socket, parts);
      return;
    case command === '/join':
      executeJoinCommand(socket, parts);
      return;
    default:
      return;
  }
}

// Command Execution Logic
function executeHelpCommand(socket){
  socket.emit('console-message', {
        message: commands
  });
}

function executeListPeopleCommand(socket){
  socket.emit('console-message', {
    message: 'People currently online...'
  });
  socket.emit('list', handleToSockID);
}

function executeListRoomsCommand(socket){
  socket.emit('console-message', {
    message: 'Chat Rooms currently Available...'
  });
  socket.emit('list', rooms);
}

function executeWisperCommand(parts, handle){
  if (parts.size != 3 || !handleToSockID[parts[1]]){
    return;
  }
  io.sockets.connected[handleToSockID[parts[1]]].emit('chat', {
    message: parts[2],
    handle: handle + '(wisper)'
  });
}

function executeChangeNameCommand(socket, parts){
  if (parts.size != 2 || handleToSockID[parts[1]]){
    socket.emit('change-name', {
      'result': false,
      'newName': undefined
    });
    return;
  }

  delete handleToSockID[sockIDtoInfo[socket.id].handle];
  sockIDtoInfo[socket.id].handle = parts[1];
  handleToSockID[parts[1]] = socket.id;

  socket.emit('change-name', {
    'result': true,
    'newName': parts[1]
  });
}

function executeCreateRoomCommand(socket, parts){
  if (parts.size != 2 || rooms[parts[1]]) {
    return;
  }
  var newRoom = new Room(parts[1]);
  roomMetaInfo[parts[1]] = newRoom;
  rooms[parts[1]] = true;
  return;
}

function executeJoinCommand(socket, parts){
  if (parts.size != 2 || !rooms[parts[1]]) {
    return;
  }
  var prevRoom = sockIDtoInfo[socket.id].room;
  sockIDtoInfo[socket.id].room = parts[1];

  roomMetaInfo[prevRoom].removeUser(sockIDtoInfo[socket.id].handle);
  roomMetaInfo[parts[1]].addUser(sockIDtoInfo[socket.id].handle);

  socket.leave(prevRoom);
  socket.join(parts[1]);
}

function createSocketIOServer(server) {
  io = socket(server);

  io.on('connection', function(socket) {
    // Initial Connection SetUp
    console.log('socket.io: ' + socket.id + ' connected (' +
    totalViews + ')');

    var defaultHandle = 'user#' + totalViews;
    totalViews++;

    addName(socket.id, defaultHandle, 'global');

    socket.join('global');
    roomMetaInfo['global'].addUser(defaultHandle);

    socket.emit('welcome', {
      'message': welcomeMessage('user#' + totalViews),
      'newName': ('User#' + totalViews)
    });

    // Handle Input
    socket.on('command', function(data){
      executeCommand(socket, data);
    });

    socket.on('disconnect', function(data){
      console.log('socket.io: ' + socket.id + ' Disconnected (' +
      totalViews + ')');
      var room = sockIDtoInfo[socket.id].room;
      roomMetaInfo[room].removeUser(socket.id);
      delete handleToSockID[sockIDtoInfo[socket.id].handle];
      delete sockIDtoInfo[socket.id];
    });

    socket.on('chat', function(data) {
      var message = data.message;
      var handle = data.handle;
      if (message.charAt(0) != '/') {
        io.to(sockIDtoInfo[socket.id].room).emit('chat', data);
        //io.sockets.emit('chat', data);
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
