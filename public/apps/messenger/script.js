// Make connection
var socket = io.connect("/");

// localStorage.debug = '*';
function socketEmit(emitType, data) {
  console.log('Emmitting \'' + emitType + '\': ' + JSON.stringify(data));
  socket.emit(emitType, data);
}

function logSocketReceive(emitType, data) {
  console.log("Received Emit '" + emitType + "': " + JSON.stringify(data));
}

// Document elements which handle core messaging services
var message = document.getElementById("message");
var sendButton = document.getElementById("send");
var chatBox = document.getElementById("chat-box");

// Handle that the user gives itself
var handle = undefined;

function display(name, output, color) {
  var newMsg = document.createElement("p");
  newMsg.setAttribute("class", "messages");

  if (color) {
    newMsg.style.color = color;
  }

  newMsg.innerHTML = "<p class='messages'><b>" + name + "</b> " + output;
  chatBox.appendChild(newMsg);
}

function send() {
  var text = message.value.trim();
  message.value = "";
  if (handle == undefined) {
    return;
  }
  if (text === "") {
    return;
  }

  if (text.charAt(0) == "/") {
    var parts = parseCommand(text);
    socketEmit("command", {
      message: text,
      parts: parts
    });
  }

  socketEmit("chat", {
    message: text,
    handle: handle
  });
}

sendButton.addEventListener("click", send);
message.addEventListener("keyup", function(event) {
  if (event.keyCode == 13) {
    send();
  }
});

// Parse Commands
function parseCommand(rawText) {
  var parsingRegex = /(^\/\S*)(?:[^\n\r\S]+(\S*))?(?:[^\n\r\S]+(.*))?/;
  var regexSubgroups = parsingRegex.exec(rawText);
  if (!regexSubgroups) {
    return null;
  }

  var parts = {};
  var i = 1;
  for (; i < regexSubgroups.length && regexSubgroups[i]; i++) {
    parts[i - 1] = regexSubgroups[i];
  }
  parts["size"] = i - 1;
  for (; i < 3; i++) {
    parts[i - 1] = undefined;
  }
  return parts;
}

// Receiving Event Logic
socket.on("welcome", function(data) {
  logSocketReceive("Welcome", data);

  handle = data.newName;
  display("Console:", data.message);
});

socket.on("chat", function(data) {
  logSocketReceive("chat", data);

  display(data.handle, data.message);
});

socket.on("console-message", function(data) {
  logSocketReceive("console-message", data);

  display("Console", data.message);
});

socket.on("change-name", function(data) {
  logSocketReceive("change-name", data);

  if (data.result === true) {
    display("Console:", "Your name is now " + data.newName);
    handle = data.newName;
  } else {
    display("Console:", "Can't pick that name");
  }
});

socket.on("list", function(data) {
  logSocketReceive("list", data);

  var elements = "";
  for (var prop in data) {
    elements += prop + "<br/>";
  }
  display("", elements);
});

socket.on("messenger-error", function(data) {
  logSocketReceive("messenger-error", data);

  var errorMsg = data.message;
  display("Error:", errorMsg, "red");
});
