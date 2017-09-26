/**
 * CallBox is an object which represents a UI widget consisting of a
 * SocketLogger connected to the server, ChatBox object, RemoteAudio object,
 * an HTML element for picking up/ accepting calls, an HTML Button for
 * hanging up / declining calls, an HTML input element to get a call
 * recipient's handle, and a string of a call partner's handle if one exists.
 * CallBox adds the necessary logic to these elements to facilitate the
 * necessary steps needed to start/end a call
 * 
 * @constructor
 * @summary SUMMARY: Object codes in call setup functionality
 * 
 * @param {Object} callBoxBuilder - contains the necessary parts as members:
 * socket, chaBox, remoteAudio, pickupButton, hangupButton,
 * calleeHandleTextBox, callPartner
 */
function CallBox(callBoxBuilder) {
  /** @member {SocketLogger} socket */
  this.socket = callBoxBuilder.socket;

  /** @member {ChatBox} chatBox */
  this.chatBox = callBoxBuilder.chatBox;

  /** @member {RemoteAudio} remoteAudio */
  this.remoteAudio = callBoxBuilder.remoteAudio;

  /** @member {HTMLElement} pickupButton */
  this.pickupButton = callBoxBuilder.pickupButton;

  /** @member {HTMLElement} hangupButton */
  this.hangupButton = callBoxBuilder.hangupButton;

  /** @member {HTMLInputElement} calleeHandleTextBox */
  this.calleeHandleTextBox = callBoxBuilder.calleeHandleTextBox;

  /** @member {string} callPartner */
  this.callPartner = callBoxBuilder.callPartner;

  /**
   * Sets this CallBox into NotInCall Status which means the user can input
   * the handle of some one to call and press the pickupButton to initiate the
   * call
   */
  this.setNotInCallStatus = () => {
    console.log("Call Status Set to NOT IN CALL");

    this.callPartner = null;
    this.calleeHandleTextBox.disabled = false;

    this.pickupButton.style.backgroundColor = "green";
    this.pickupButton.onclick = initializeCall;

    this.hangupButton.style.backgroundColor = "#808080";
    this.hangupButton.style.onclick = null;
  };

  /**
   * Sets this CallBox into AcceptingCall status which means the user can press
   * the pickupButton to accept the call or the hangupButton to decline it
   */
  this.setAcceptingCallStatus = () => {
    console.log("Call Status Set to ACCEPTING CALL");

    this.calleeHandleTextBox.disabled = true;

    this.pickupButton.style.backgroundColor = "green";
    this.pickupButton.onclick = acceptCall;

    this.hangupButton.style.backgroundColor = "red";
    this.hangupButton.onclick = declineCall;
  };

  /**
   * Sets this CallBox into InCall Status which means the user can press the
   * hangupButton to stop the call
   */
  this.setInCallStatus = () => {
    console.log("Call Status Set to IN CALL");

    this.calleeHandleTextBox.disabled = true;

    this.pickupButton.style.backgroundColor = "#808080";
    this.pickupButton.onclick = null;

    this.hangupButton.style.backgroundColor = "red";
    this.hangupButton.onclick = declineCall;
  };

  /**
   * Offers call to peer for them to accept or decline. Note that if the
   * partner doesn't select an option within 10 seconds the call is auto
   * declined. Call-offer is emitted to the server
   * 
   * @ignore
   * @async
   * 
   * @returns true if call-offer sending was  a success, false if otherwise
   */
  var initializeCall = () => {
    if (!this.callPartner) {
      this.callPartner = this.calleeHandleTextBox.value.trim();

      this.socket.logAndEmit("Call-Init", {
        calleeHandle: this.calleeHandleTextBox.value.trim()
      });
      this.setInCallStatus();
      return true;
    }
    return false;
  };

  /**
   * Accepts the call from the call partner and emits result to server
   * 
   * @ignore
   * @async
   */
  var acceptCall = () => {
    this.setInCallStatus();
    this.socket.logAndEmit("Call-Result", {
      result: true
    });
  };

  /**
   * Declines the call from the call partner and emits result to server
   * 
   * @ignore
   * @async
   */
  var declineCall = () => {
    this.callPartner = null;
    this.setNotInCallStatus();
    this.socket.logAndEmit("Call-Result", {
      result: false
    });
  };

  this.setNotInCallStatus();

  // Receiving Event Logic Below
  var thisCallBox = this;
  this.socket.logAndReceive("Call-Offer", function (data) {
    thisCallBox.callPartner = data.callPartner;
    thisCallBox.setAcceptingCallStatus();
    chatBox.display(
      "Console:",
      data.callerHandle +
      " is calling you, either press the pickup " +
      "button below to accept or the hangup button to decline. In 10 seconds" +
      " you will auto-decline",
      "green"
    );
  });

  this.socket.logAndReceive("Call-TimeOut", function () {
    thisCallBox.setNotInCallStatus();
    remoteAudio.endStream();
    chatBox.display("Console:", "Call Timed Out!", "red");
  });

  this.socket.logAndReceive("Call-Result", function (data) {
    if (data.result) {
      thisCallBox.setInCallStatus();
      remoteAudio.signalCall(data.isInitiator);
      chatBox.display(
        "Console:",
        "Call Accepted, initializing ICE-signaling " +
        "to establish a peer-to-peer connection with " +
        data.callPartner,
        "green"
      );
    } else {
      thisCallBox.setNotInCallStatus();
      remoteAudio.endStream();
      chatBox.display(
        "Console:",
        data.callPartner + " declined or terminated the call!",
        "red");
    }
  });
}