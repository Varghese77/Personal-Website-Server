/**
 * @author Roy Varghese Mathew
 */

var socket = require('socket.io');
var fs = require('fs');

// main Socket.io Server
var io;

// Maps a socket's ID to its handle and room name
// {socket.id: {handle: 'handle', room: 'room}}
var sockIDtoInfo = {};

// Maps a socket's handle to its socket ID
// {handle: socket.id}
var handleToSockID = {};

// Stores Room Objects that the program is keeping track of
// {room-name: room-object}
var roomMetaInfo = {};

var pageViews = 0;

// COMMANDS contains a string of all the commands that a client can type
var tmp = fs.readFileSync(__dirname + '/commands.txt', 'utf8');
tmp = tmp.replace(/(?:\r\n|\r|\n)/g, '<br />');
const COMMANDS = tmp;

// names of rooms which currently exist
// {room-name: true}
var rooms = {};

function Room(name){
  this.name = name;  // string
  this.size = 0;
  this.users = {};
}
Room.prototype.addUser = function(sockID){
  if (this.users[sockID] == undefined){
    this.users[sockID] = true;
    this.size++;
    return true;
  }
  return false;
};
Room.prototype.removeUser = function(sockID){
  if (!this.users[sockID]) {
    delete this.users[sockID];
    this.size--;
    return true;
  }
  return false;
};

// Create 'global' default room
roomMetaInfo.global = new Room('global');
rooms.global = true;

function sendError(socket, errorMsg){
  socket.emit('messenger-error', {
    message: errorMsg
  });
}

// If sockID already exists, then new handle and/or room info is updated in 
// global data structures. Otherwise new sockID is added with default values
// to global data structures.
//
// sockID: string of socket ID
// handle: string of user-specified handle
// room: string of name of room that socket is in
function updateName(sockID, handle, room) {
  if (sockIDtoInfo[sockID]) {
    delete handleToSockID[sockIDtoInfo[sockID].handle];
    delete sockIDtoInfo[sockID];
  }
  sockIDtoInfo[sockID] = {'handle': handle, 'room': room};
  handleToSockID[handle] = sockID;
}

// check it parts, an object containing parts of a client command where
// parts[0] = command type, parts[1] & parts[2] contain parameters and 
// parts.size contian the number of parameters, is valid
function checkParts(parts){
  if (!parts || !parts.size || (typeof parts.size) !== 'number' ||
      parts.size > 3 || parts.size < 1) {
    return false;
  }
  for(var i = 0; i < parts.size; i++){
    if (!parts[i]){
      return false;
    }
    if(Object.prototype.toString.call(parts[i]) !== '[object String]' ) {
      return false;
    }
  }
  return true;
}

// Determines and Executes command
function executeCommand(socket, data){
  if (!data || !data.message ||
      Object.prototype.toString.call(data.message) !== '[object String]'){
    sendError(socket, 'Data sent to server is corrupt or invalid');
    return;
  }
  if (!checkParts(data.parts)){
    sendError(socket, 'Command could not be parsed, please check your syntax');
    return;
  }

  console.log(socket.id + ' entered command \"' + data.message + '\"');
  var parts = data.parts;
  var command = parts[0];

  // Determine command and send to appropriate function for execution
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
      var handle = sockIDtoInfo[socket.id].handle;
      executeWisperCommand(socket, parts, handle);
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
      sendError(socket, 'unrecognized command');
      return;
  }
}

// Command Execution Logic Functionsions
function executeHelpCommand(socket){
  socket.emit('console-message', {
        message: COMMANDS
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

function executeWisperCommand(socket, parts, handle){
  if (parts.size != 3){
    sendError(socket, 'Wisper Command could not be parsed, check your syntax');
    return;
  }
  if (!handleToSockID[parts[1]]){
    sendError(socket, 'That user does not exist');
    return;
  }
  socket.emit('chat', {
    message: parts[2],
    handle: handle + '(wisper)'
  });
  io.sockets.connected[handleToSockID[parts[1]]].emit('chat', {
    message: parts[2],
    handle: handle + '(wisper)'
  });
}

function executeChangeNameCommand(socket, parts){
  if (parts.size != 2 || parts[1].length > 10){
    sendError(socket, 'Cannot use that name');
    return;
  }
  if (handleToSockID[parts[1]]){
    sendError(socket, 'Someone else already is using that name');
    return;
  }

  updateName(socket.id, parts[1],
      sockIDtoInfo[socket.id].room);

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

// Returns the welcome message when a user connects
//
// handle of the user
function welcomeMessage(handle){
  return 'Hello and welcome to Messenger. You are currently in the global ' +
  'chat room. Type <i>/help</i> for help. Your username is currently set to ' +
  handle;
}

/**
 * Creates and returns a Sockets.io server based on the http input parameter.
 * This server executes the main logic of the messenger app whose details
 * are contained on the site's README link
 * 
 * @param {*} server 
 */
function createSocketIOServer(server) {
  io = socket(server);

  io.on('connection', function(socket) {
    // Initial Connection SetUp
    console.log('socket.io: ' + socket.id + ' connected (' +
    pageViews + ')');
    var defaultHandle = 'user#' + pageViews;
    updateName(socket.id, defaultHandle, 'global');
    socket.join('global');
    roomMetaInfo.global.addUser(defaultHandle);
    socket.emit('welcome', {
      'message': welcomeMessage('user#' + pageViews),
      'newName': ('User#' + pageViews)
    });
    pageViews++;

    // Handle Socket Input
    socket.on('command', function(data){
      executeCommand(socket, data);
    });

    socket.on('disconnect', function(data){
      console.log('socket.io: ' + socket.id + ' Disconnected (' +
      pageViews + ')');
      var room = sockIDtoInfo[socket.id].room;
      roomMetaInfo[room].removeUser(socket.id);
      delete handleToSockID[sockIDtoInfo[socket.id].handle];
      delete sockIDtoInfo[socket.id];
    });

    socket.on('chat', function(data) {
      var message = data.message;
      if (message.charAt(0) != '/') {
        io.to(sockIDtoInfo[socket.id].room).emit('chat', data);
      }
    });
  });

  return io;
}

module.exports = createSocketIOServer;