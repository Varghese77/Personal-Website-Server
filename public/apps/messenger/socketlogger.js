/**
 * SocketLogger is a wrapper around a Socket.io socket which
 * logs the data being emitted and being received
 * 
 * @constructor
 * 
 * @param {socket.io socket} socket - A socket.io socket which is connected to
 * a server
 */
function SocketLogger(socket) {
  /** @member {socket.io socket} socket */
  this.socket = socket;
}

/**
 * Takes in data and the emit-type of the data as parameters, logs both to the
 * console and then emits to the server
 * 
 * @function logAndEmit
 * 
 * @param {string} emitType - type of data this SocketLogger will emit
 * @param {Object} data - data to be emitted
 */
SocketLogger.prototype.logAndEmit = function(emitType, data) {
  console.log("Emitting '" + emitType + "': " + JSON.stringify(data));
  this.socket.emit(emitType, data);
};

/**
 * Takes in an emit-type and a function in the form of function(data) to be
 * asynchronously called when the socket member receives above emit-type
 * 
 * @function logAndReceive
 * 
 * @param {string} emitType - type of data this SocketLogger will receive
 * @param {function} fn - A function in the form of 'function(data)' which will
 * be executed when the data with the given emit type is received
 */
SocketLogger.prototype.logAndReceive = function(emitType, fn) {
  this.socket.on(emitType, (data) => {
    console.log("Received Emit '" + emitType + "': " + JSON.stringify(data));
    fn(data);
  });
};
