// Initialize AudioContext/AudioNodes and link appropriately.
//
// -> Gain Node -> Analyser Node -> Speakers (Need to define source later)
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = audioCtx.createGain();
var analyser = audioCtx.createAnalyser();
gainNode.connect(analyser);
analyser.connect(audioCtx.destination);
var sauce = undefined;  // represents 'source'

// buffer to contain raw binary sound data
var rawBinSoundBuf;  // Raw File Bimary Data
var decodedBuf;  // Decoded Binary Data
var duration;  // Length of song in seconds

// Canvas and Canvas Context
var barsCanvas;
var barsCtx;

// Variables relevant to extracting realtime frequencies
var bufferLength;  // number of frequencies to be extrafted via fft
var dataArray; // Float32Array of relative frequency-amplitude percents

var timeSlider;
var startTime;
var currentPercent;

var drawing = false;

function updateTime(deltaPercent){
  timeSlider.value = currentPercent + deltaPercent;
  console.log('tick to: ' + deltaPercent);
}

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
        currentPercent = 0;
        playSong(0);
      });
    };

  }, false);
  
  // html objects which will get events for website functionality
  timeSlider = document.getElementById('time');
  var volumeSlider = document.getElementById('volume');
  var speedSlider = document.getElementById('speed');
  var smoothSlider = document.getElementById('smooth');
  
  timeSlider.value = 0;
  volumeSlider.value = 25;
  speedSlider.value = 50;
  smoothSlider.value = 85;
  

  // Prepare Time Slider
  timeSlider.addEventListener('input', function(){
    var percent = timeSlider.valueAsNumber / 100.0;
    if (sauce && duration){
      console.log(percent * duration + '/' + duration);
      currentPercent = percent * 100;
      playSong(Math.floor(percent * duration));
      
      document.getElementById('time-label').innerText = 'Time [' +
      Math.round(percent * 100) + '%]';
      
      var inputEvent = document.createEvent('Event');
      inputEvent.initEvent('input', true, true);
      
      speedSlider.dispatchEvent(inputEvent);
      smoothSlider.dispatchEvent(inputEvent);
    }
  }, false);

  // Prepare volume Slider
  volumeSlider.addEventListener('input', function(){
    var rawValue = volumeSlider.valueAsNumber;

    gainNode.gain.value = rawValue / 25.0;
    document.getElementById('volume-label').innerText = 'Volume [' + rawValue +
      ']';
  }, false);

  // Prepare Speed Slider
  speedSlider.addEventListener('input', function(){
    if (sauce){
      var rawValue = speedSlider.valueAsNumber;
      sauce.playbackRate.value = rawValue / 50.0;

      document.getElementById('speed-label').innerText = 'Playback Speed [' +
        (rawValue / 50.0) + 'x]';
    }
  }, false);

  // Prepare Smooth Slider
  smoothSlider.addEventListener('input', function(){
      var rawValue = smoothSlider.valueAsNumber;
      analyser.smoothingTimeConstant = rawValue / 100.0;
      
      document.getElementById('smooth-label').innerText = 'Smoothing Time ' + 
        'Constant [' + (rawValue / 100) + ']';
  }, false);

  // Initialize Canvas
  barsCanvas = document.getElementById("myCanvas");
  barsCtx = barsCanvas.getContext("2d");
  resizeCanvas(barsCanvas);
  barsCtx.fillStyle = 'rgb(0, 0, 0)';
  barsCtx.fillRect(0, 0, barsCanvas.width, barsCanvas.height);

  // Set Analyser
  analyser.fftSize = 64;
  bufferLength = analyser.frequencyBinCount;  // analyser.fftSize / 2 == 128
  dataArray = new Float32Array(bufferLength);  // 128 bytes, stores requencies
};

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
  startTime = audioCtx.currentTime;
  sauce.start(0, time);
  barsCtx.clearRect(0, 0, barsCanvas.width, barsCanvas.height);
  if (!drawing){
    drawing = true;
    draw();
  }
}

// Updates Graphics on the canvas
function draw() {
  // requestAnimationFrame requests argument callback be executed
  // before next repaint, thus it is essentially recursion
  requestAnimationFrame(draw);

  analyser.getFloatFrequencyData(dataArray);
  var currTimePercent = ((audioCtx.currentTime - startTime) / duration) * 100;
  updateTime(currTimePercent);

  barsCtx.fillStyle = 'rgb(0, 0, 0)';
  barsCtx.fillRect(0, 0, barsCanvas.width, barsCanvas.height);

  // Draw Bars
  var xOffset = 0;
  var barWidth = Math.ceil(barsCanvas.width / bufferLength) - 1;
  for (var i = 0; i < bufferLength; i++){
    var barHeight = dataArray[i];

    barsCtx.fillStyle = 'rgb(25, ' + (Math.ceil(dataArray[i]) + 150) + ', 25)';
    barsCtx.fillRect(xOffset, -barHeight, barWidth, barsCanvas.height +
      barHeight);
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
