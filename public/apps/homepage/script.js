var data;

// Gets JSON data from address addr and loads it into obj
function loadJSON(addr) { 
	var jsonData;

	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType('application/json');
	xobj.open('GET', addr, false);
	xobj.onreadystatechange = function () {
				if (xobj.readyState == 4 && xobj.status == '200') {
					jsonData = JSON.parse(xobj.responseText);
				}
	};
	xobj.send(null);
	return jsonData;
}

var addr = 'data.json?nocache=' + (new Date()).getTime();

data = loadJSON(addr);
data = data.data;

// code taken from https://stackoverflow.com/questions/10240110/how-do-you-cache-an-image-in-javascript
function preloadImages(array) {
  if (!preloadImages.list) {
      preloadImages.list = [];
  }
  var list = preloadImages.list;
  for (var i = 0; i < array.length; i++) {
      var img = new Image();
      img.onload = function() {
          var index = list.indexOf(this);
          if (index !== -1) {
              // remove image from the array once it's loaded
              // for memory consumption reasons
              list.splice(index, 1);
          }
      }
      list.push(img);
      img.src = array[i].url;
  }
}

preloadImages(data);





function setBackground(idx) {
  var imageURL = data[idx].url;
  console.log(imageURL);
  document.body.style.background = "url('" + imageURL + "') no-repeat center center fixed";
  document.body.style.backgroundSize = screen.width + 'px';
}
var backgroundIdx = 1;
if (document.cookie) {
  var cookie = document.cookie.split(';');
  var idx = (cookie[0].split('='))[1];
  backgroundIdx = parseInt(idx);
}
setBackground(backgroundIdx);
function updateCookie() {
  var newDate = new Date();
  newDate = new Date(newDate.getFullYear() + 1, newDate.getMonth(), newDate.getDate());
  document.cookie = "bidx=" + backgroundIdx + ";expires=" + newDate.toUTCString();
}
updateCookie();

function prevBackground() {
  if (backgroundIdx > 1) {
    backgroundIdx--;
    setBackground(backgroundIdx);
    updateCookie();
  }
}

function nextBackground() {
  if (backgroundIdx < data.length - 1) {
    backgroundIdx++;
    setBackground(backgroundIdx);
    updateCookie();
  }
}

function startTime() {
  var today = new Date();
  var h = today.getHours();
  if (h > 12) {h -= 12;}
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('time').innerHTML =
  h + ":" + m + ":" + s;
  var t = setTimeout(startTime, 500);
}
function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}

function goToSource() {
  window.location.href = '';
  window.location.href = "https://www.reddit.com" + data[backgroundIdx].permalink;
}

var input = document.getElementById('search');
input.addEventListener('keypress', (e) => {
  if(e.keyCode==13) {
    googleSearch();
  }
})

function googleSearch() {
  input = document.getElementById('search');
  var searchText = input.value;
  if (searchText.length == 0) {
    return;
  } else {
    searchText = searchText.split(' ');
  }
  var searchURL = 'https://www.google.com/search?q=';
  for (var i = 0; i < searchText.length; i++) {
    searchURL += searchText[i] + '+';
  }


  window.location.href = searchURL;
}

input.value = '';
