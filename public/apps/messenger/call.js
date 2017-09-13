var iccs = [];

// Button to initiate/Accept Call
var pickupButton = document.getElementById("pickup-label");
pickupButton.onclick = initializeCall;

// Button to Decline/End Call
var hangupButton = document.getElementById("hangup-label");

// text-feild to retreive handle to call
var calleeHandleTextBox = document.getElementById("callee-handle");

// Element which plays remote audio
var remoteAudio;
remoteAudio = document.getElementById("remote_audio");
remoteAudio.autoplay = true;

// Elements used to set up RTCPeerConnection
var pc;
var localStream;
var isCaller = false;
var servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};
var pcConstraints = {
  optional: []
};

var callPartner = null;

function setNotInCallStatus() {
  console.log("Call Status Set to NOT IN CALL");

  callPartner = null;
  calleeHandleTextBox.disabled = false;

  pickupButton.style.backgroundColor = "green";
  pickupButton.onclick = initializeCall;

  hangupButton.style.backgroundColor = "#808080";
  hangupButton.style.onclick = null;
}

function setAcceptingCallStatus() {
  console.log("Call Status Set to ACCEPTING CALL");

  calleeHandleTextBox.disabled = true;

  pickupButton.style.backgroundColor = "green";
  pickupButton.onclick = acceptCall;

  hangupButton.style.backgroundColor = "red";
  hangupButton.onclick = null;
}

function setInCallStatus() {
  console.log("Call Status Set to IN CALL");

  calleeHandleTextBox.disabled = true;

  pickupButton.style.backgroundColor = "#808080";
  pickupButton.onclick = null;

  hangupButton.style.backgroundColor = "red";
  hangupButton.onclick = null;
}

function initializeCall() {
  if (!callPartner) {
    callPartner = calleeHandleTextBox.value.trim();

    socketEmit("Call-Init", {
      calleeHandle: calleeHandleTextBox.value.trim()
    });
    setInCallStatus();
  } else {
    display("Error:", "You are already in a call", red);
  }
}

function acceptCall() {
  setInCallStatus();
  socketEmit("Call-Result", {
    result: true
  });
}

function declineCall() {
  callPartner = null;
  setNotInCallStatus();
  socketEmit("Call-Result", {
    result: false
  });
}

setNotInCallStatus();

pc = new RTCPeerConnection(servers, pcConstraints);
pc.onicecandidate = function(e) {
  onIceCandidate(pc, e);
};

pc.onaddstream = gotRemoteStream;

var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
};

function gotStream(stream) {
  localStream = stream;

  var isChrome = !!window.chrome && !!window.chrome.webstore;
  if (true) {
    pc.addStream(localStream);
  } else {
    localStream.getAudioTracks().forEach(function(track) {
      pc.addTrack(track, localStream);
    });
  }

  if (isCaller) {
    pc.createOffer(offerOptions).then(gotLocalDescription, () => {
      console.log("Failed to create Session Description");
    });
  }
}

function gotRemoteStream(e) {
  if (remoteAudio.srcObject !== e.stream) {
    remoteAudio.srcObject = e.stream;
  }
}

function signalCall(isInitiator) {
  isCaller = true;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false
    })
    .then(gotStream)
    .catch(function(e) {
      alert("getUserMedia() Error: " + e.name);
    });
}

function onIceCandidate(pc, event) {
  if (event.candidate) {
    socketEmit("ICE-Candidate", {
      candidate: event.candidate
    });
  }
}

function gotLocalDescription(desc) {
  pc.setLocalDescription(desc).then(
    () => {
      socketEmit("SDP-Offer", {
        desc: desc
      });
    },
    () => console.log("Initiator Couldn't set Local SDP description")
  );
}

socket.on("Call-Offer", function(data) {
  logSocketReceive("Call-Offer", data);

  callPartner = data.callerHandle;
  setAcceptingCallStatus();
  display(
    "Console",
    " is calling you, either press the pickup button below " +
      "to accept or the hangup button to decline. In 10 seconds " +
      "you will auto-decline"
  );
});

socket.on("Call-Result", function(data) {
  logSocketReceive("Call-Result", data);

  if (data.result) {
    setInCallStatus();
    console.log("here");
    signalCall(data.isInitiator);
  } else {
    setNotInCallStatus();
  }
});

socket.on("ICE-Candidate", function(data) {
  logSocketReceive("ICE-Candidate", data);
  if (pc.remoteDescription) {
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  } else {
    iccs.push(data.candidate);
  }
});

socket.on("SDP-Offer", function(data) {
  logSocketReceive("SDP-Offer", data);
  pc.setRemoteDescription(data.desc).then(
    () => {
      addiccs();
      pc.createAnswer().then(
        desc => {
          pc.setLocalDescription(desc).then(
            () => {
              console.log("Non-Initiator set Local SDP description");
              socketEmit("SDP-Answer", {
                desc: desc
              });
            },
            () =>
              console.log("Non-Initiator couldn't set Local SDP description")
          );
        },
        () => console.log("Couldn't Create Answer")
      );
    },
    () => console.log("Non-Initiator Couldn't set remote SDP description")
  );
});

socket.on("SDP-Answer", function(data) {
  logSocketReceive("SDP-Answer", data);

  pc.setRemoteDescription(data.desc).then(
    () => {
      addiccs();
      console.log("Initiator set Remote SDP description");
    },
    () => console.log("Initiator couldn't set Remote SDP description")
  );
});

function addiccs() {
  for (var i = 0; i < iccs.length; i++) {
    pc.addIceCandidate(new RTCIceCandidate(iccs.pop()));
  }
}
