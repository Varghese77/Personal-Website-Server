var callButton = document.getElementById('callButton');
callButton.onclick = initiateCall;

var pc;
var localStream;

var remoteAudio;
remoteAudio = document.getElementById('remote_audio');

var isInitiator = false;

var servers = null;
var pcConstraints = {
  'optional': []
};

pc = new RTCPeerConnection(servers, pcConstraints);
pc.onicecandidate = function(e) {
  onIceCandidate(pc, e);
};

pc.ontrack = gotRemoteStream;

var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
};

function gotStream(stream) {
  localStream = stream;
  var audioTracks = localStream.getAudioTracks();
  localStream.getTracks().forEach(
    function(track) {
      pc.addTrack(
        track,
        localStream
      );
    }
  );

  pc.createOffer(
    offerOptions
  ).then(
    gotDescription1,
    () => {console.log('Failed to create Session Description')}
  );
}

function gotRemoteStream(e) {
  if (remoteAudio.srcObject !== e.streams[0]) {
    remoteAudio.srcObject = e.streams[0];
  }
}

function initiateCall() {
  isInitiator = true;

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function onIceCandidate(pc, event) {
  socket.emit('ICE-Candidate', {
    candidate: event.candidate
  });
}

function gotDescription1(desc) {
  pc.setLocalDescription(desc).then(
    () => {
      socket.emit('SDP-Offer', {
        desc:desc
      });
    },
    () => console.log('Initiator Couldn\'t set Local SDP description')
  )
}

socket.on('ICE-Candidate', function(data) {
  pc.addIceCandidate(data.candidate);
});

socket.on('SDP-Offer', function(data){
  pc.setRemoteDescription(data.desc).then(
    () => {
      pc.createAnswer().then(
        (desc) => {
          pc.setLocalDescription(desc).then(
            () => console.log('Non-Initiator set Local SDP description'),
            () => console.log('Non-Initiator couldn\'t set Local SDP description')
          )
          socket.emit('SDP-Answer', {
            desc: desc
          });
        },
        () => console.log('Couldn\'t Create Answer')
      );
    },
    () => console.log('Non-Initiator Couldn\'t set remote SDP description')
  );
});

socket.on('SDP-Answer', function(data){
  pc.setRemoteDescription(data.desc).then(
    () => console.log('Initiator set Remote SDP description'),
    () => console.log('Initiator couldn\'t set Remote SDP description')
  )
});
