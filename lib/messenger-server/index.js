var socket = require("socket.io");
var fs = require("fs");

// main Socket.io Server
var io;

// Maps a socket's ID to its handle and room name
// {
//   socket.id: {
//     handle: 'handle',
//     room: 'room,
//     call-data: 'Call object with call info'
//   }
// }
var sockIDtoInfo = {};

// Maps a socket's handle to its socket ID
// {handle: socket.id}
var handleToSockID = {};

// Stores Room Objects that the program is keeping track of
// {room-name: room-object}
var roomMetaInfo = {};

var pageViews = 0;

// COMMANDS contains a string of all the commands that a client can type
var tmp = fs.readFileSync(__dirname + "/commands.txt", "utf8");
tmp = tmp.replace(/(?:\r\n|\r|\n)/g, "<br />");
const COMMANDS = tmp;

// names of rooms which currently exist
// {room-name: true}
var rooms = {};

function Room(name) {
  this.name = name; // string
  this.size = 0;
  this.users = {};
}
Room.prototype.addUser = function (sockID) {
  if (this.users[sockID] == undefined) {
    this.users[sockID] = true;
    this.size++;
    return true;
  }
  return false;
};
Room.prototype.removeUser = function (sockID) {
  if (!this.users[sockID]) {
    delete this.users[sockID];
    this.size--;
    return true;
  }
  return false;
};

/**
 * Object stores data relating to a call that is either being set up
 * or is ongoing
 * 
 * @param {any} caller 
 * @param {any} callee 
 * @param {any} ongoing 
 */
function CallData(caller, callee, ongoing) {
  this.caller = caller; // handle of the call initiator
  this.callee = callee; // handle of the call receiver
  this.ongoing = ongoing; // status code of call; F: not accepted, T: ongoing
}
CallData.prototype.getCallPartner = function (handle) {
  if (handle === this.caller) {
    return this.callee;
  } else if (handle === this.callee) {
    return this.caller;
  } else {
    console.log("should never have gotten here");
  }
};

function deleteCall(callData) {
  if (!callData) {
    return;
  }
  sockIDtoInfo[handleToSockID[callData.caller]].callData = null;
  sockIDtoInfo[handleToSockID[callData.callee]].callData = null;
}

// Create 'global' default room
roomMetaInfo.global = new Room("global");
rooms.global = true;

// Replaces raw charcters with html escape versions to prevent XXS attacks
// This function's code is inspired from mustache.js
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};

function escapeHTML(str) {
  return String(str).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function sendError(socket, errorMsg) {
  socket.emit("messenger-error", {
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
function updateName(sockID, handle, room, callData) {
  if (sockIDtoInfo[sockID]) {
    delete handleToSockID[sockIDtoInfo[sockID].handle];
    delete sockIDtoInfo[sockID];
  }
  if (callData) {
    if (callData.user1 === sockIDtoInfo[sockID].handle) {
      callData.user1 === handle;
    } else {
      callData.user2 === handle;
    }
  }
  sockIDtoInfo[sockID] = {
    handle: handle,
    room: room,
    callData: callData
  };
  handleToSockID[handle] = sockID;
}

// check it parts, an object containing parts of a client command where
// parts[0] = command type, parts[1] & parts[2] contain parameters and
// parts.size contian the number of parameters, is valid
function checkParts(parts) {
  if (!parts ||
    !parts.size ||
    typeof parts.size !== "number" ||
    parts.size > 3 ||
    parts.size < 1
  ) {
    return false;
  }
  for (var i = 0; i < parts.size; i++) {
    if (!parts[i]) {
      return false;
    }
    if (Object.prototype.toString.call(parts[i]) !== "[object String]") {
      return false;
    }
  }
  return true;
}

// Determines and Executes command
function executeCommand(socket, data) {
  if (!data ||
    !data.message ||
    Object.prototype.toString.call(data.message) !== "[object String]"
  ) {
    sendError(socket, "Data sent to server is corrupt or invalid");
    return;
  }
  if (!checkParts(data.parts)) {
    sendError(socket, "Command could not be parsed, please check your syntax");
    return;
  }

  console.log(socket.id + ' entered command "' + data.message + '"');
  var parts = data.parts;
  var command = parts[0];

  // Determine command and send to appropriate function for execution
  switch (true) {
    case command === "/help":
      executeHelpCommand(socket);
      return;
    case command === "/listpeople":
      executeListPeopleCommand(socket);
      return;
    case command === "/listrooms":
      executeListRoomsCommand(socket);
      return;
    case command === "/whisper":
      var handle = sockIDtoInfo[socket.id].handle;
      executeWisperCommand(socket, parts, handle);
      return;
    case command === "/changename":
      executeChangeNameCommand(socket, parts);
      return;
    case command === "/createroom":
      executeCreateRoomCommand(socket, parts);
      return;
    case command === "/join":
      executeJoinCommand(socket, parts);
      return;
    case command === '/crashserver':
	// This command is 'hidden' and crashes the server to test
        // exception handling
        throw 'explicit crash: messenger-server';
        return;
    default:
      sendError(socket, "unrecognized command");
      return;
  }
}

// Command Execution Logic Functionsions
function executeHelpCommand(socket) {
  socket.emit("console-message", {
    message: COMMANDS
  });
}

function executeListPeopleCommand(socket) {
  socket.emit("console-message", {
    message: "People currently online..."
  });
  socket.emit("list", handleToSockID);
}

function executeListRoomsCommand(socket) {
  socket.emit("console-message", {
    message: "Chat Rooms currently Available..."
  });
  socket.emit("list", rooms);
}

function executeWisperCommand(socket, parts, handle) {
  if (parts.size != 3) {
    sendError(socket, "Wisper Command could not be parsed, check your syntax");
    return;
  }
  if (!handleToSockID[parts[1]]) {
    sendError(socket, "That user does not exist");
    return;
  }
  socket.emit("chat", {
    message: parts[2],
    handle: handle + "(wisper)"
  });
  io.sockets.connected[handleToSockID[parts[1]]].emit("chat", {
    message: parts[2],
    handle: handle + "(wisper)"
  });
}

function executeChangeNameCommand(socket, parts) {
  if (parts.size != 2 || parts[1].length > 10) {
    sendError(socket, "Cannot use that name");
    return;
  }
  if (handleToSockID[parts[1]]) {
    sendError(socket, "Someone else already is using that name");
    return;
  }

  updateName(
    socket.id,
    parts[1],
    sockIDtoInfo[socket.id].room,
    sockIDtoInfo[socket.id].callData
  );

  socket.emit("change-name", {
    result: true,
    newName: parts[1]
  });
}

function executeCreateRoomCommand(socket, parts) {
  if (parts.size != 2 || rooms[parts[1]]) {
    return;
  }
  var newRoom = new Room(parts[1]);
  roomMetaInfo[parts[1]] = newRoom;
  rooms[parts[1]] = true;
  return;
}

function executeJoinCommand(socket, parts) {
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

function getCallPartner(sockID) {
  var handle = sockIDtoInfo[sockID].handle;
  return sockIDtoInfo[sockID].callData.getCallPartner(handle);
}

// Returns the welcome message when a user connects
//
// handle of the user
function welcomeMessage(handle) {
  return (
    "Hello and welcome to Messenger. You are currently in the global " +
    "chat room. Type <i>/help</i> for help. Your username is currently set to " +
    handle
  );
}

function createSocketIOServer(server) {
  io = socket(server);

  io.on("connection", function (socket) {
    // Initial Connection SetUp
    console.log("socket.io: " + socket.id + " connected (" + pageViews + ")");
    var defaultHandle = "user#" + pageViews;
    updateName(socket.id, defaultHandle, "global", null);
    socket.join("global");
    roomMetaInfo.global.addUser(defaultHandle);
    socket.emit("welcome", {
      message: welcomeMessage("user#" + pageViews),
      newName: "User#" + pageViews
    });
    pageViews++;

    // Handle Socket Input
    socket.on("command", function (data) {
      executeCommand(socket, data);
    });

    socket.on("disconnect", function (data) {
      console.log(
        "socket.io: " + socket.id + " Disconnected (" + pageViews + ")"
      );
      var room = sockIDtoInfo[socket.id].room;
      roomMetaInfo[room].removeUser(socket.id);

      deleteCall(sockIDtoInfo[socket.id].callData);
      delete handleToSockID[sockIDtoInfo[socket.id].handle];
      delete sockIDtoInfo[socket.id];
    });

    socket.on("chat", function (data) {
      if (data.message && data.message.charAt(0) != "/") {
        data.message = escapeHTML(data.message);
        io.to(sockIDtoInfo[socket.id].room).emit("chat", data);
      }
    });

    // Call Setup Functionality
    socket.on("Call-Init", function (data) {
      var calleeHandle = data.calleeHandle;

      var isValidCall = true;
      if (isValidCall && !handleToSockID[calleeHandle]) {
        socket.emit("messenger-error", {
          message: "Callee with handle " + calleeHandle + " does not exist"
        });
        isValidCall = false;
      }
      if (isValidCall && calleeHandle == sockIDtoInfo[socket.id].handle) {
        socket.emit("messenger-error", {
          message: "You can't call yourself!"
        });
        isValidCall = false;
      }
      if (isValidCall && sockIDtoInfo[socket.id].callData) {
        socket.emit("messenger-error", {
          message: "You are already in a call"
        });
        isValidCall = false;
      }
      if (isValidCall && sockIDtoInfo[handleToSockID[calleeHandle]].callData) {
        socket.emit("messenger-error", {
          message: "Callee is already in a call"
        });
        isValidCall = false;
      }

      if (!isValidCall) {
        socket.emit('Call-Result', {
          callPartner: 'System',
          isInitiator: true,
          result: false
        });
        return;
      }

      var newCall = new CallData(
        sockIDtoInfo[socket.id].handle,
        calleeHandle,
        false
      );

      sockIDtoInfo[socket.id].callData = newCall;
      sockIDtoInfo[handleToSockID[calleeHandle]].callData = newCall;

      setTimeout(() => {
        if (sockIDtoInfo[socket.id] && sockIDtoInfo[socket.id].callData &&
          !sockIDtoInfo[socket.id].callData.ongoing) {
          deleteCall(newCall);
          io.sockets.connected[handleToSockID[newCall.caller]].emit(
            "Call-TimeOut"
          );
          io.sockets.connected[handleToSockID[newCall.callee]].emit(
            "Call-TimeOut"
          );
        }
      }, 10000);

      io.sockets.connected[handleToSockID[calleeHandle]].emit("Call-Offer", {
        callerHandle: sockIDtoInfo[socket.id].handle
      });
    });

    socket.on("Call-Result", function (data) {
      if (!sockIDtoInfo[socket.id].callData) {
        deleteCall(callData);
        return;
      }
      var callData = sockIDtoInfo[socket.id].callData;
      callData.ongoing = data.result ? true : false;

      io.sockets.connected[
        handleToSockID[callData.caller]
      ].emit("Call-Result", {
        callPartner: callData.callee,
        isInitiator: true,
        result: data.result
      });
      io.sockets.connected[
        handleToSockID[callData.callee]
      ].emit("Call-Result", {
        callPartner: callData.caller,
        isInitiator: false,
        result: data.result
      });

      if (!callData.ongoing) {
        deleteCall(callData);
      }
    });

    // RTCPeerConnection Signaling passthough functionality
    socket.on("ICE-Candidate", function (data) {
      var callPartner = getCallPartner(socket.id);
      io.sockets.connected[handleToSockID[callPartner]].emit("ICE-Candidate", {
        //handle: newHandle,
        candidate: data.candidate
      });
    });

    socket.on("SDP-Offer", function (data) {
      var callPartner = getCallPartner(socket.id);
      console.log(callPartner);
      io.sockets.connected[handleToSockID[callPartner]].emit("SDP-Offer", {
        //handle: newHandle,
        desc: data.desc
      });
    });

    socket.on("SDP-Answer", function (data) {
      var callPartner = getCallPartner(socket.id);
      io.sockets.connected[handleToSockID[callPartner]].emit("SDP-Answer", {
        //handle: newHandle,
        desc: data.desc
      });
    });
  });

  return io;
}

module.exports = createSocketIOServer;
