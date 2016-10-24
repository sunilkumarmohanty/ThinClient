var express = require('express');
var forceHTTPS = require('express-force-ssl');
var path = require('path');

module.exports = function(app) {
  var isAuthorizedRedirect = function(req, res, next) {
    if (req.session && req.session.loggedIn) {
      next();
    } else {
      res.redirect('/login');
    }
  };

  var forceHTTP = function(req, res, next) {
    // Forces route to use HTTP over HTTPS.
    // VNC over websockets requires this if there are not trusted certificates.
    if (req.secure) {
      res.redirect('http://' + req.hostname + req.url);
    } else {
      next();
    }
  };

  app.get('/login', forceHTTPS, function(req, res) {
    res.sendFile(path.join(__dirname, '../web/login.html'));
  });
  app.use('/app', [isAuthorizedRedirect, forceHTTP, express.static(path.join(__dirname, '../web/app'))]);
  app.get('/', [isAuthorizedRedirect, forceHTTP, function(req, res) {
    res.redirect('/app');
  }]);

}