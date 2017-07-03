// Make connection
// (^\/\S*)(?:[^\n\r\S]+(\S*))?(?:[^\n\r\S]+(.*))?
var socket = io.connect('http://localhost:3000');

var message = document.getElementById('message');
var sendButton = document.getElementById('send');
var chatBox = document.getElementById('chat-box');

var handle = undefined;

function display(name, output) {
  chatBox.innerHTML = chatBox.innerHTML + '<p class=\'messages\'><b>' + name + '</b>: ' + 
  output;
}

sendButton.addEventListener('click', function(){
  var text = message.value.trim();
  message.value = '';
  if (handle == undefined) {
    return;
  }
  if (text === ''){
    return;
  }

  if (text.charAt(0) == '/') {
    var parts = parseCommand(text);
    socket.emit('command', {
        message: text,
        parts: parts
    });
  }

  socket.emit('chat', {
        message: text,
        handle: handle
  });
});

// Parse Commands
function parseCommand(rawText){
  var parsingRegex = /(^\/\S*)(?:[^\n\r\S]+(\S*))?(?:[^\n\r\S]+(.*))?/;
  var regexSubgroups = parsingRegex.exec(rawText);
  if (!regexSubgroups) {
    return null;
  }

  var parts = {}
  var i = 1;
  for (; i < regexSubgroups.length && regexSubgroups[i]; i++){
    parts[i - 1] = regexSubgroups[i];
  }
  parts['size'] = i - 1;
  for (; i < 3; i++){
    parts[i - 1] = undefined;
  }
  return parts;
}


// Receiving Event Logic
socket.on('welcome', function(data) {
  handle = data.newName;
  display('Console', data.message);
});

socket.on('chat', function(data){
    display(data.handle, data.message);
});

socket.on('console-message', function(data) {
  display('Console', data.message);
});

socket.on('change-name', function(data){
  if (data.result === true) {
    display('Console', 'Your name is now ' + data.newName);
    handle = data.newName;
  } else {
    display('Console', 'Can\'t pick that name');
  }
});

socket.on('list', function (data){
  var elements = '';
  for (var prop in data) {
    elements += prop + '<br/>';
  }
  display('', elements);
});

