var SECRETS = {
  username: 'user',
  password: 'pass'
};

var login = function(req, res) {
  if (!req.body.userid || !req.body.password) {
    res.sendStatus(401);
  } else if (req.body.userid === SECRETS.username && req.body.password === SECRETS.password) {
    req.session.userId = req.body.userid;
    req.session.loggedIn = true;
    console.log("User '" + req.session.userId + "' logged in.");
    res.sendStatus(200);
  } else {
    res.status(401).send('Wrong username or password');
  }
};

var logout = function(req, res) {
  console.log("User '" + req.session.userId + "' logged out.");
  req.session.destroy();
  res.sendStatus(200);
};

var loggedIn = function(req, res) {
  if (req.session.loggedIn) {
    res.status(200).json({'loggedIn': true, 'user': req.userId});
  } else {
    res.status(200).json({'loggedIn': false});
  }
};

/** Auth middleware used with all routes that need access control */
var isAuthorized = function(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  } else {
    return res.sendStatus(401);
  }
};

module.exports = {
  isAuthorized: isAuthorized,
  login: login,
  logout: logout,
  loggedIn: loggedIn
};
