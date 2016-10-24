var gcloud = require('google-cloud');
var instanceTimeout = require('./instance-timeout');
var tcpp = require('tcp-ping');
var waterfall = require('async').waterfall;

var config = {
  project: 'mcc-2016-g07-p1',
  zone: 'us-east1-c'
};

var gce = gcloud.compute({
  projectId: config.project,
  keyFilename: 'server/mcc-2016-g07-p1-79a74e3160e9.json'
});

var stopInstance = function(req, res) {
  if (req.body.hasOwnProperty('instance')) {
    var zone = gce.zone(config.zone);
    var vm = zone.vm(req.body.instance);
    console.log('Stopping "' + req.body.instance + '"...');
    vm.stop(function(err, operation, response) {
      if (err) {
        res.status(err.code).send(err.message);
      } else {
        console.log('Operation "stop" started.');
        res.status(200).json({
          'operation': response.name,
          'status': response.status
        });
      }
    });
  } else {
    res.status(400).send('Instance name missing.');
  }
};

var startInstance = function(req, res) {
  if (req.body.hasOwnProperty('instance')) {
    var zone = gce.zone(config.zone);
    var vm = zone.vm(req.body.instance);
    waterfall([
      function(next) {
        console.log('Starting instance "' + req.body.instance + '"...');
        vm.start(function(err, operation, response) {
          if (err) {
            next({
              statusCode: err.code,
              message: err.message
            });
          } else {
            instanceTimeout.createTimeout(req.session.id, req.body.instance, function() {
              console.log('Idle for too long. Stopping "' + req.body.instance + '"...');
              vm.stop();
            });
            next(null);
          }
        });
      },
      function(next) {
        console.log('Waiting for external IP...');
        var getExternalIP = function() {
          vm.get(function(err, operation, response) {
            if (err) {
              next({
                statusCode: err.code,
                message: err.message
              });
            } else {
              if (response.networkInterfaces[0].accessConfigs[0].hasOwnProperty('natIP')) {
                console.log('External IP:', response.networkInterfaces[0].accessConfigs[0].natIP);
                next(null);
              } else {
                getExternalIP();
              }
            }
          });
        }
        getExternalIP();
      },
      function(next) {
        console.log('Provisioning...');
        var getStatus = function() {
          vm.get(function(err, operation, response) {
            if (err) {
              next({
                statusCode: err.code,
                message: err.message
              });
            } else {
              if (response.status === 'RUNNING') {
                console.log('Instance "' + req.body.instance + '" running.');
                next(null, {
                  'name': response.name,
                  'status': response.status,
                  'externalIP': response.networkInterfaces[0].accessConfigs[0].natIP
                });
              } else {
                getStatus();
              }
            }
          });
        }
        getStatus();
      },
      function(response, next) {
        var serverIP = response.externalIP;
        var vncPort = 8787; // 8787 will guarantee both 5901 and 8787
        var timeoutRounds = 10;
        var roundInterval = 1000;
        var checkVNCAvailability = function() {
          console.log('Pinging VNC server... (Timeout in ' + timeoutRounds + 's)');
          tcpp.probe(serverIP, vncPort, function(err, available) {
            if (err) {
              next({
                statusCode: 503,
                message: 'VNC server not available. Try again.'
              });
            } else if (available) {
              console.log('VNC server running.');
              next(null, response);
            } else {
              if (timeoutRounds > 0) {
                timeoutRounds--;
                setTimeout(checkVNCAvailability, roundInterval);
              } else {
                next({
                  statusCode: 503,
                  message: 'VNC server not available. Try again.'
                });
              }
            }
          })
        }
        checkVNCAvailability();
      }
    ], function(err, result) {
      if (!err) {
        res.status(200).json(result);
      } else {
        if (typeof err === 'object' && err.hasOwnProperty('statusCode') && err.hasOwnProperty('message')) {
          res.status(err.statusCode).send(err.message);
        } else {
          res.status(500).send('Failed to start instance.')
        }
      }
    });
  } else {
    res.status(400).send('Instance name missing.');
  }
};

module.exports = {
  stopInstance: stopInstance,
  startInstance: startInstance
};