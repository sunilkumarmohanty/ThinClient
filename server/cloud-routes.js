module.exports = function(app) {
  var cloud = require('./cloud');
  app.post('/gcloud/start', cloud.startInstance);
  app.post('/gcloud/stop', cloud.stopInstance);
};