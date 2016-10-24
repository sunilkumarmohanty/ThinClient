module.exports = function(app) {
  var auth = require('./auth');
  app.post('/login', auth.login);
  app.get('/logout', auth.logout);
  app.get('/loggedin', auth.loggedIn);
};