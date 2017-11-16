/**
 * RemoteAudio is meant to handle all of the functionality related to
 * getting audio to actually play including connecting it to a 
 * peer stream and ending the stream, and 
 * 
 * @constructor
 * 
 * @param {SocketLogger} socket - SocketLogger Connected to server
 * @param {HTMLAudioElement} audioElement - audio element, will play stream
 * @param {ChatBox} chatBox - text box for prompt
 */
function RemoteAudio(socket, audioElement, chatBox) {
  var audioPlayer = audioElement;
  var iceCandidateStack = [];

  // Elements used to set up RTCPeerConnection
  var pc;
  var localStream;
  var isCaller = false;
  var servers = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {
        urls: "stun:stun4.l.google.com:19302"
      }
    ]
  };

  var pcConstraints = {
    optional: []
  };

  var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 0,
    voiceActivityDetection: false
  };

  pc = new RTCPeerConnection(servers);
  pc.onicecandidate = function(e) {
    onIceCandidate(pc, e);
  };
  pc.onaddstream = gotRemoteStream;

  /**
   * Receives a stream and stores it locally
   * 
   * @ignore
   * 
   * @param {any} stream - stream to be added to the peer connection and
   * stored locally
   */
  function gotStream(stream) {
    localStream = stream;

    pc.addStream(localStream);

    if (isCaller) {
      pc.createOffer(offerOptions).then(gotLocalDescription, () => {
        chatBox.display('Error:', 'Failed to create Session Description', 'red');
      });
    }
  }

  /**
   * 
   * @ignore
   * 
   * @param {any} e - 
   */
  function gotRemoteStream(e) {
    if (audioPlayer.srcObject !== e.stream) {
      audioPlayer.srcObject = e.stream;
    }
  }

  function onIceCandidate(pc, event) {
    if (event.candidate) {
      this.socket.logAndEmit("ICE-Candidate", {
        candidate: event.candidate
      });
    }
  }

  function gotLocalDescription(desc) {
    pc.setLocalDescription(desc).then(
      () => {
        this.socket.logAndEmit("SDP-Offer", {
          desc: desc
        });
      },
      () => {chatBox.display('Error:', "Initiator Couldn't set Local SDP description", 'red');}
    );
  }

  function addIceCandidatesFromStack() {
    for (var i = 0; i < iceCandidateStack.length; i++) {
      pc.addIceCandidate(new RTCIceCandidate(iceCandidateStack.pop()));
    }
  }

  this.endStream = function() {
    pc.close();
    pc = null;

    pc = new RTCPeerConnection(servers, pcConstraints);
    pc.onicecandidate = function(e) {
      onIceCandidate(pc, e);
    };
    pc.ontrack = gotRemoteStream;

    localStream = undefined;
    isCaller = false;
  };

  socket.logAndReceive("ICE-Candidate", function(data) {
    if (pc.remoteDescription && pc.remoteDescription.type) {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      iceCandidateStack.push(data.candidate);
    }
  });

  socket.logAndReceive("SDP-Offer", function(data) {
    pc.setRemoteDescription(data.desc).then(
      () => {
        addIceCandidatesFromStack();
        pc.createAnswer().then(
          desc => {
            pc.setLocalDescription(desc).then(
              () => {
                console.log("Non-Initiator set Local SDP description");
                this.socket.logAndEmit("SDP-Answer", {
                  desc: desc
                });
              },
              () =>
              chatBox.display('Error:', "Non-Initiator couldn't set Local SDP description", 'red')
            );
          },
          () => chatBox.display('Error:', "Couldn't create SDP Answer", 'red')
        );
      },
      () => chatBox.display('Error:', "Non-Initiator couldn't set Local SDP description", 'red')
    );
  });

  socket.logAndReceive("SDP-Answer", function(data) {
    pc.setRemoteDescription(data.desc).then(
      () => {
        addIceCandidatesFromStack();
        console.log("Initiator set Remote SDP description");
      },
      () => chatBox.display('Error:', "Initiator couldn't set Remote SDP description", 'red')
    );
  });

  this.signalCall = isInitiator => {
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
  };
}
