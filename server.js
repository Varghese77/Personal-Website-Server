// Module Dependencies
var express = require("express");
var http = require("http");
var https = require('https');
var messageServer = require("./lib/messenger-server");
var fs = require("fs");

// Encryption Cert and Key
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/royvmathew.com/privkey.pem');
var certificate = fs.readFileSync('/etc/letsencrypt/live/royvmathew.com/fullchain.pem');
var credentials = {key: privateKey, cert: certificate};

// Initial SetUp Data
var setupData = JSON.parse(fs.readFileSync("setup-data.json"), "utf8");

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
