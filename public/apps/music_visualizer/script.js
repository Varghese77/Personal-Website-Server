// Initialize AudioContext/AudioNodes and link appropriately.
//
// -> Gain Node -> Analyser Node -> Speakers (Need to define source later)
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = audioCtx.createGain();
var analyser = audioCtx.createAnalyser();
gainNode.connect(analyser);
analyser.connect(audioCtx.destination);
var sauce = undefined;

// buffer to contain raw binary sound data
var rawBinSoundBuf;  // Raw File Bimary Data
var decodedBuf;  // Decoded Binary Data
var duration;  // Length of song in seconds

// Canvas and Canvas Context
var barsCanvas;
var barsCtx;

// Variables relevant to extracting real0time frequencies
var bufferLength;  // number of frequencies to be extrafted via fft
var dataArray; // Float32Array of relative frequency-amplitude percents

window.onresize = function(){resizeCanvas(barsCanvas)};

window.onload = function() {
  // Prepare Load binary song data function using playSong callback
  document.getElementById('file').addEventListener('change', function(){
    var selectedFile = document.getElementById('file').files[0];
    var fileReader = new FileReader();

    fileReader.readAsArrayBuffer(selectedFile);
    fileReader.onload = function(){
      rawBinSoundBuf = fileReader.result;
      audioCtx.decodeAudioData(rawBinSoundBuf, function(buffer) {
        decodedBuf = buffer;
        duration = buffer.duration;
        playSong(0);
      });
    };

  }, false);

  // Prepare Time Slider
  document.getElementById('time').addEventListener('input', function(){
    var percent = document.getElementById('time').valueAsNumber / 100.0;
    if (sauce && duration){
      console.log(percent * duration + '/' + duration);
      playSong(percent * duration);
    }
  }, true);

  // Prepare volume Slider
  document.getElementById('volume').addEventListener('input', function(){
    var timeValue = document.getElementById('volume').valueAsNumber;

    gainNode.gain.value = timeValue / 25.0;
    document.getElementById('volume-label').innerText = 'Volume [' + timeValue + ']';
  }, true);

  // Prepare Speed Slider
  document.getElementById('speed').addEventListener('input', function(){
    if (sauce){
      var playbackSpeed = document.getElementById('speed').valueAsNumber;
      sauce.playbackRate.value = playbackSpeed / 50.0;

      document.getElementById('speed-label').innerText = 'Playback Speed [' +
        (playbackSpeed / 50.0) + 'x]';
    }
  }, true);

  // Prepare Smooth Slider
  document.getElementById('smooth').addEventListener('input', function(){
      analyser.smoothingTimeConstant = document.getElementById('smooth').valueAsNumber / 100.0;
  }, true);

  // Initialize Canvas
  barsCanvas = document.getElementById("myCanvas");
  barsCtx = barsCanvas.getContext("2d");
  resizeCanvas(barsCanvas);
  barsCtx.fillStyle = 'rgb(0, 0, 0)';
  barsCtx.fillRect(0, 0, barsCanvas.width, barsCanvas.height);

  // Set Analyser
  analyser.fftSize = 128;
  bufferLength = analyser.frequencyBinCount;  // analyser.fftSize / 2 == 128
  dataArray = new Float32Array(bufferLength);  // 128 bytes, stores requencies
}

// Reloads AudioSourceBufferNode and starts playing from the
// time specified in the parameter in seconds. Also starts drawing
// on the canvas
function playSong(time) {
  if (sauce !== undefined){
    sauce.stop();
  }
  sauce = audioCtx.createBufferSource();
  sauce.buffer = decodedBuf;
    
  sauce.connect(gainNode);
  sauce.start(0, time);
  barsCtx.clearRect(0, 0, barsCanvas.width, barsCanvas.height);
  draw();
}

// Updates Graphics on the canvas
function draw() {
  // requestAnimationFrame requests argument callback be executed
  // before next repaint, thus it is essentially recursion
  requestAnimationFrame(draw);

  analyser.getFloatFrequencyData(dataArray);

  barsCtx.fillStyle = 'rgb(0, 0, 0)';
  barsCtx.fillRect(0, 0, barsCanvas.width, barsCanvas.height);

  // Draw Bars
  var xOffset = 0;
  var barWidth = Math.ceil(barsCanvas.width / bufferLength) - 1;
  for (var i = 0; i < bufferLength; i++){
    var barHeight = dataArray[i];

    barsCtx.fillStyle = 'rgb(25, ' + (Math.ceil(dataArray[i]) + 150) + ', 25)';
    barsCtx.fillRect(xOffset, -(2 * barHeight), barWidth, barsCanvas.height + (2 * barHeight));
    xOffset+= barWidth + 1;
  }
}

// Updates the dimensions of the canvas. Width should be the same as the window
// and the height should fill the screen but allow room for the navigator bar
// and io controls
function resizeCanvas(canvas){
  var canvasWidth = window.innerWidth;

  var canvasHeight = window.innerHeight;
  canvasHeight -= document.getElementById('nav-bar').offsetHeight;
  canvasHeight -= document.getElementById('ioBar').offsetHeight;

  canvas.style.width = Math.floor(canvasWidth) + 'px';
  canvas.style.height = Math.floor(canvasHeight) + 'px';
}
