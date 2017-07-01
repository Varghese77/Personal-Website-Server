// Make connection
var socket = io.connect('http://localhost:3000');

var message = document.getElementById('message');
var sendButton = document.getElementById('send');
var chatBox = document.getElementById('chat-box');

var handle = undefined;

function display(name, output) {
  chatBox.innerHTML = chatBox.innerHTML + '<p class=\'messages\'><b>' + name + '</b>: ' + 
  output;
}

socket.on('welcome', function(data) {
  handle = data.handle;
  display('Console', data.message);
});


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
    socket.emit('command', {
        message: text,
        handle: handle
    });
  }

  /*
  if (text === '/help'){
    display('Console', '<br/>' + 
    '/help: Lists all of the possible commands<br/>' + 
    '/changename &ltuser-name&gt: Change your user name (no whitespace in name)<br/>' +
    '/listpeople: Lists all the people currently online<br/>' + 
    '/listrooms: Lists all of the chat rooms<br/>' + 
    '/wisper &ltuser-name&gt &ltmessage&gt: Send a private message<br/>' + 
    '/createroom: Creates a room to join<br/>');
    return;
  }

  if (handle == undefined && text.indexOf('/changename') != 0) {
    display('Console', 'Please create a handle before continuing!');
    return;
  }
  */

  socket.emit('chat', {
        message: text,
        handle: handle
  });
});

socket.on('chat', function(data){
    display(data.handle, data.message);
});

socket.on('change-name', function(data){
  if (data.result === true) {
    display('Console', 'Your name is now ' + data.handle);
    handle = data.handle;
  } else {
    display('Console', 'Can\'t pick that name');
  }
});

