function setDownButton() {
  var revealer = document.getElementById('revealer');
  revealer.innerHTML = '' +
  '<p id=\'revealerParagraph\'>Click to expand VOIP functionality</p>' + 
  '<img src=\"../../images/down.jpg" id="revealerButton\" />';

  document.getElementById('revealerButton').onclick = setUpButton;
}
function setUpButton() {
  var revealer = document.getElementById('revealer');
  revealer.innerHTML = '' +
  '<img src=\"../../images/up.png" id="revealerButton\" />' + 
  '<p id=\'revealerParagraph\'>Click to Collapse VOIP functionality</p>';

  document.getElementById('revealerButton').onclick = setDownButton;
}
setDownButton();

// Make connection
var socket = new SocketLogger(io.connect("/"));

var chatBox = new ChatBox(
  socket,
  document.getElementById("message"),
  document.getElementById("send"),
  document.getElementById("chat-box")
);

var audioPlayer;
audioPlayer = document.getElementById("remote_audio");
audioPlayer.autoplay = true;
var remoteAudio = new RemoteAudio(socket, audioPlayer);


var callBox = new CallBox({
  socket: socket,
  chatBox: chatBox,
  remoteAudio: remoteAudio,
  pickupButton: document.getElementById("pickup-label"),
  hangupButton: document.getElementById("hangup-label"),
  calleeHandleTextBox: document.getElementById("callee-handle"),
});
