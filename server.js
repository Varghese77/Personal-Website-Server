// Module Dependencies
let express = require("express");
let http = require("http");
let https = require('https');
let messageServer = require("./lib/messenger-server");
let fs = require("fs");

// Encryption Cert and Key
let privateKey  = fs.readFileSync('ssl/privkey.pem');
let certificate = fs.readFileSync('ssl/fullchain.pem');
let credentials = {key: privateKey, cert: certificate};

// Initial SetUp Data
let setupData = JSON.parse(fs.readFileSync("setup-data.json"), "utf8");

// Set Up HTTP redirect to HTTPS
let app = express();
app.use(express.static("public"));
let httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    console.log("https://" + req.headers['host'] + req.url)
    res.end();
}).listen(80);

// HTTPS Server
var httpsServer = https.createServer(credentials, app).listen(443);

messageServer(httpsServer);
console.log('End of Server.js');
