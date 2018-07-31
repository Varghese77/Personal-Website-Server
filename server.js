// Module Dependencies
var express = require("express");
var request = require("request");
var http = require("http");
var https = require('https');
var messageServer = require("./lib/messenger-server");
var stringGenerator = require("./lib/string-generator");
var fs = require("fs");

var addr = 'https://www.reddit.com/r/EarthPorn/top/.json';
var earthTopData;  // stores reddit metadata for homepage
var imageIdx = 0;
var writtenImages = 0;

var imageDataJSON = {};
imageDataJSON.data = [];

var totalImageLinks;

var loadJSON = function(uri) {
    var txt;

    request.head(uri, function(err, res, body){
        if (err) throw err;
        request(uri, parseJSON);
    });
}

function parseJSON(err, res, body) {
    if (err) throw err;
    earthTopData = JSON.parse(body);

    totalImageLinks = earthTopData.data.children.length;
    for (var i = 0; i < totalImageLinks; i++) {
        downloadEarthImages(earthTopData.data.children[i].data.url, i, earthTopData);
    }
}

// Code taken from https://stackoverflow.com/questions/12740659/downloading-images-with-node-js
var downloadEarthImages = function(uri, idx, data){
    request.head(uri, function(err, res, body){
        if(err) {
          return;
        }
        if (res.headers['content-type'] !== 'image/jpeg') {
            writtenImages++;
        } else {
            var tmpIdx = imageIdx;
            imageIdx++;

            var name = stringGenerator.generateRandomString();

            request(uri).pipe(fs.createWriteStream('public/apps/homepage/images/' + name + '.png')).on('close', () => {
                imageDataJSON.data[tmpIdx] = {};
                imageDataJSON.data[tmpIdx]["url"] = 'images/' + name + '.png';
                imageDataJSON.data[tmpIdx]["permalink"] = earthTopData.data.children[idx].data.permalink;

                writtenImages++;
                if (writtenImages == totalImageLinks) {
                    fs.writeFile('public/apps/homepage/data.json', JSON.stringify(imageDataJSON), (err) => {
                        if (err) throw err;
                    });
                }
            });
        }
    });
};

// Encryption Cert and Key
console.log('Reading SSL Setup PEMs')
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/royvmathew.com/privkey.pem');
var certificate = fs.readFileSync('/etc/letsencrypt/live/royvmathew.com/fullchain.pem');
var chain = fs.readFileSync('/etc/letsencrypt/live/royvmathew.com/chain.pem');
var credentials = {key: privateKey, cert: certificate, ca: chain};

// Set Up HTTP redirect to HTTPS
console.log('Creating Express HTTP Server');
var app = express();
app.use(express.static("public"));
var httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

// HTTPS Server
console.log("Creatting HTTPS Server")
var httpsServer = https.createServer(credentials, app).listen(443);
messageServer(httpsServer);

console.log('Starting Reddit Crawl')
loadJSON(addr);
setInterval(function() {
    console.log('Initiating new Reddit Crawl...');
    earthTopData = null;

    var imagesDir = 'public/apps/homepage/images';

    earthTopData = null;
    imageDataJSON.data = [];
    imageDataJSON.data.length = 0;
    imageIdx = 0;
    writtenImages = 0;

    fs.readdir(imagesDir, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(imagesDir + '/' + file, err => {
            if (err) throw err;
          });
        }
      });
    
      loadJSON(addr);
}, 1000 * 60 * 60 * 24);
console.log('End of Server.js');


