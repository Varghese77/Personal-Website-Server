/**
 * A ChatBox Object represents a widget consisting of three HTML
 * elements (an input element where the user inputs text messages, a button
 * that initiates sending text messages to the server, and a div where incoming
 * messages are displayed), a SocketLogger which is connected to the server,
 * and a string which defines the handle that the user has given themselves. 
 * The ChatBox assumes that the parameters are newly created with no special
 * functionality as the ChatBox it will add the required functionality itself. 
 * 
 * @constructor
 * @summary SUMMARY: Object codes in Chat functionality as described in
 * the parameter fields.
 * 
 * @param {SocketLogger} socket - Must be connected to server; handles net. IO
 * @param {HTMLInputElement} message - text input where messages are typed
 * @param {HTMLButtonElement} sendButton - button which is clicked when a message is sent
 * @param {HTMLDivElement} chatDisplay - div where incoming chat messages will show
 * @param {string} handle - handle of the user using the ChatBox
 */
function ChatBox(socket, message, sendButton, chatDisplay, handle) {
  /** @member {SocketLogger} socket */
  this.socket = socket;

  /** @member {HTMLInputElement} message */
  this.message = message;

  /** @member {HTMLButtonElement} sendButton */
  this.sendButton = sendButton;

  /** @member {HTMLDivElement} chatDisplay */
  this.chatDisplay = chatDisplay;

  /** @member {string} handle */
  this.handle = handle;

  // REGEX which parses string into the format...
  // <before first space> <optional part until next space> <optional remainder>
  var parsingRegex = /(^\/\S*)(?:[^\n\r\S]+(\S*))?(?:[^\n\r\S]+(.*))?/;

  /**
   * Takes in a string and split it an array of strings with the command being
   * in the first index and the rest being put in the second and third indices
   * 
   * @ignore
   * 
   * @param {string} rawText - text to apply parsingRegex to
   * @returns null if string can't be parsed by regex or regex split string
   */
  function parseCommand(rawText) {
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

  /**
   * Extracts message text from message member, parses it into the format...
   * <before first space> <optional part until next space> <optional remainder>
   * and then sends parsed text to the server
   * 
   * @ignore
   * @async
   * 
   * @returns nothing, return used as early exit
   */
  let send = function() {
    var text = this.message.value.trim();
    this.message.value = "";
    if (this.handle == undefined) {
      return;
    }
    if (text === "") {
      return;
    }

    // user entered a command
    if (text.charAt(0) == "/") {
      var parts = parseCommand(text);
      this.socket.logAndEmit("command", {
        message: text,
        parts: parts
      });
    }

    // user sent a general chat message
    this.socket.logAndEmit("chat", {
      message: text,
      handle: this.handle
    });
  };

  this.sendButton.addEventListener("click", send);
  this.message.addEventListener("keyup", function(event) {
    // user can send message by pressing enter while cursor is on message field
    if (event.keyCode == 13) {
      send();
    }
  });

  // Receiving Event Logic Below
  var thisChatBox = this;
  this.socket.logAndReceive("welcome", function(data) {
    thisChatBox.updateHandle(data.newName);
    thisChatBox.display("Console:", data.message);
  });

  this.socket.logAndReceive("chat", function(data) {
    thisChatBox.display(data.handle, data.message);
  });

  this.socket.logAndReceive("console-message", function(data) {
    thisChatBox.display("Console", data.message);
  });

  this.socket.logAndReceive("change-name", function(data) {
    if (data.result === true) {
      thisChatBox.display("Console:", "Your name is now " + data.newName);
      thisChatBox.updateHandle(data.newName);
    } else {
      thisChatBox.display("Console:", "Can't pick that name");
    }
  });

  this.socket.logAndReceive("list", function(data) {
    var elements = "";
    for (var prop in data) {
      elements += prop + "<br/>";
    }
    thisChatBox.display("", elements);
  });

  this.socket.logAndReceive("messenger-error", function(data) {
    var errorMsg = data.message;
    thisChatBox.display("Error:", errorMsg, "red");
  });
}

/**
 * Displays a given text message in this ChatBox's chatDisplay
 * 
 * @function display
 * 
 * @param {string} name - name of handle who sent the message
 * @param {string} output - text of the message
 * @param {string} color - color of the text when it is displayed
 */
ChatBox.prototype.display = function(name, output, color) {
  var newMsg = document.createElement("p");
  newMsg.setAttribute("class", "messages");

  if (color) {
    newMsg.style.color = color;
  }

  newMsg.innerHTML = "<b>" + name + "</b> " + output;
  this.chatDisplay.appendChild(newMsg);

  this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
};

/**
 * Changes the handle of this ChatBox
 * 
 * @function updateHandle
 * 
 * @param {string} handle - new handle of ChatBox
 */
ChatBox.prototype.updateHandle = function(handle) {
  this.handle = handle;
};
