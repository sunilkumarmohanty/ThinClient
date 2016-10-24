var instanceTimeouts = {
  'firefox': {'sessions': [], 'timeoutObj': null},
  'inkscape': {'sessions': [], 'timeoutObj': null},
  'openoffice': {'sessions': [], 'timeoutObj': null}
}

var keepAlive = function(req, res, next) {
  for (var i = 0; i < Object.keys(instanceTimeouts).length; i++) {
    var timeout = instanceTimeouts[Object.keys(instanceTimeouts)[i]];
    if (timeout.timeoutObj && (timeout.sessions.indexOf(req.session.id) > -1)) {
      timeout.timeoutObj = resetTimeoutObj(timeout.timeoutObj);
    }
  }
  next();
};

var createTimeout = function(sessionID, instance, callback) {
  if (Object.keys(instanceTimeouts).indexOf(instance) > -1) {
    if (instanceTimeouts[instance].sessions.indexOf(sessionID) < 0) {
      instanceTimeouts[instance].sessions.push(sessionID);
    }
    if (instanceTimeouts[instance].timeoutObj) {
      instanceTimeouts[instance].timeoutObj = resetTimeoutObj(instanceTimeouts[instance].timeoutObj);
    } else {
      instanceTimeouts[instance].timeoutObj = createTimeoutObj(instance, callback);
    }
  }
};

var clearTimeoutForInstance = function(instance) {
  if (instanceTimeouts[instance].timeoutObj) {
    clearTimeout(instanceTimeouts[instance].timeoutObj.timer);
  }
  instanceTimeouts[instance] = {'sessions': [], 'timeoutObj': null};
};

var createTimeoutObj = function(instance, callback) {
  var timer = setTimeout(function() {
    callback();
    clearTimeoutForInstance(instance);
  }, 900000); // 15min
  return {
    timer: timer,
    callback: callback
  };
};

var resetTimeoutObj = function(timeoutObj) {
  var callback = timeoutObj.callback;
  clearTimeout(timeoutObj.timer);
  return createTimeoutObj(callback);
};

module.exports = {
  keepAlive: keepAlive,
  createTimeout: createTimeout,
  clearTimeoutForInstance: clearTimeoutForInstance
};
