// Module Dependencies
var express = require("express");
var request = require("request");
var http = require("http");
var https = require('https');
var messageServer = require("./lib/messenger-server");
var fs = require("fs");

var earthTopData;
var imageIdx = 0;
var imageDataJSON = {};
imageDataJSON.data = [];
var tmpCounter = 0;
var fullCount;

// Code taken from https://stackoverflow.com/questions/12740659/downloading-images-with-node-js
var download = function(uri, idx, data){
    request.head(uri, function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      if (idx === undefined || idx === null) {
        request(uri, loadJSON);
      } else {
        if (res.headers['content-type'] === 'image/jpeg') {
            var tmpIdx = imageIdx;
            imageIdx++;
          request(uri).pipe(fs.createWriteStream('public/apps/homepage/images/' + imageIdx + '.png')).on('close', () => {
            imageDataJSON.data[tmpIdx] = {};
            imageDataJSON.data[tmpIdx]["url"] = 'images/' + tmpIdx + '.png';
            imageDataJSON.data[tmpIdx]["permalink"] = earthTopData.data.children[idx].data.permalink;
            tmpCounter++;
            if (tmpCounter == fullCount) {
                earthTopData = null;
                fs.writeFile('public/apps/homepage/data.json', JSON.stringify(imageDataJSON), () => {
                    earthTopData = null;
                    imageDataJSON.data = [];
                    tmpCounter = 0;
                });
            }
          });
        } else {
            tmpCounter++;
        }
      }
    });
};

function loadJSON(e, res, body) {
    earthTopData = JSON.parse(body);
    fullCount = earthTopData.data.children.length;
    for (var i = 0; i < fullCount; i++) {
        download(earthTopData.data.children[i].data.url, i, earthTopData);
    }
}

var addr = 'https://www.reddit.com/r/EarthPorn/top/.json';

// Initial SetUp Data
var setupData = JSON.parse(fs.readFileSync("setup-data.json"), "utf8");

// Encryption Cert and Key
var privateKey  = fs.readFileSync('../ssl/privkey.pem');
var certificate = fs.readFileSync('../ssl/fullchain.pem');
var credentials = {key: privateKey, cert: certificate};

// Set Up HTTP redirect to HTTPS
var app = express();
app.use(express.static("public"));
var httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

// HTTPS Server
var httpsServer = https.createServer(credentials, app).listen(443);

messageServer(httpsServer);
console.log('End of Server.js');

earthTopData = download(addr);
var tmp = setInterval(() => {
    earthTopData = null;
    earthTopData = download(addr);
}, 1000 * 60 * 60);

