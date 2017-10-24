var isInitiating = true;

function setDownButton() {
  $("#call-box").slideToggle();

  var revealerUp = document.getElementById("revealer_up");
  revealerUp.innerHTML = "";
  revealerUp.style.display = "none";

  var revealerDown = document.getElementById("revealer_down");
  revealerDown.innerHTML =
    "" +
    "<p id='revealerParagraph'>Click to expand VOIP functionality</p>" +
    '<img src="../../images/down.jpg" id="revealerButton" />';

  document.getElementById("revealerButton").onclick = setUpButton;
  revealerDown.style.display = "block";
}

function setUpButton() {
    if (!isInitiating){  // first time on load should have no animation
        $("#call-box").slideToggle();
    }

  var revealerDown = document.getElementById("revealer_down");
  revealerDown.innerHTML = "";
  revealerDown.style.display = "none";

  var revealerUp = document.getElementById("revealer_up");
  revealerUp.innerHTML =
    "" +
    '<img src="../../images/up.png" id="revealerButton" />' +
    "<p id='revealerParagraph'>Click to Collapse VOIP functionality</p>";

  document.getElementById("revealerButton").onclick = setDownButton;
  revealerUp.style.display = "block";
}
setUpButton();
isInitiating = false;

// Make connection
var socket = new SocketLogger(io.connect("/"));

var chatBox = new ChatBox(
  socket,
  document.getElementById("message"),
  document.getElementById("send"),
  document.getElementById("chat-box")
);

var isValidBrowser =
  (typeof InstallTrigger !== "undefined" ||
    navigator.userAgent.toLowerCase().indexOf("chrome") > -1) &&
  window.RTCPeerConnection;

if (isValidBrowser) {
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
    calleeHandleTextBox: document.getElementById("callee-handle")
  });
} else {
  chatBox.display(
    "Console",
    "You must use Firefox or Chrome to enable VOIP Functionality!",
    "red"
  );

  // Make elements related to VOIP functionality hidden
  document.getElementById("revealer_down").style.visibility = "hidden";
  document.getElementById("revealer_up").style.visibility = "hidden";
  document.getElementById("pickup-label").style.visibility = "hidden";
  document.getElementById("hangup-label").style.visibility = "hidden";
  document.getElementById("callee-handle").style.visibility = "hidden";
  document.getElementById("call-warn").style.visibility = "hidden";
}
