#!/usr/bin/env node
var auth = require('./auth');
var bodyParser = require('body-parser');
var express = require('express');
var forceSSL = require('express-force-ssl');
var fs = require('fs');
var http = require('http');
var https = require('https');
var instanceTimeout = require('./instance-timeout');
var path = require('path');
var session = require('express-session');

var opts = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

var app = express();
var serverSSL = https.createServer(opts, app);
var server = http.createServer(app);

app.use(session({
  secret: 'secretstuff',
  resave: false,
  saveUninitialized: false
}));

require('./cors')(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../node_modules')));
app.use(express.static(path.join(__dirname, '../public')));

require('./web-routes')(app);
require('./auth-routes')(app);
app.use(auth.isAuthorized);
app.use(instanceTimeout.keepAlive);
require('./cloud-routes')(app);
require('./apps')(app);

serverSSL.listen(443, function() {
  console.log('Secure server running at :443');
});
server.listen(80, function() {
  console.log('Unsecure server running at :80');
});