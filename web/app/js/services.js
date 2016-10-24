app.factory('AppService', ['$http', function($http) {

  var urlPrefix = '';
  var Service = {};

  Service.logout = function () {
    return $http.get(urlPrefix + '/logout');
  };

  Service.getApps = function (geolocation) {
    var locationQuery = '';
    if (geolocation && geolocation.coords.latitude && geolocation.coords.longitude) {
      locationQuery = '?lat=' + geolocation.coords.latitude + '&long=' + geolocation.coords.longitude;
      // accuracy information from Google Maps API for fallback only
      if (geolocation.inaccurate) {
        locationQuery += '&acc=' + geolocation.coords.accuracy;
      }
    }
    return $http.get(urlPrefix + '/apps' + locationQuery);
  };

  Service.startInstance = function (instance) {
    var data = {
      'instance': instance
    };
    return $http.post(urlPrefix + '/gcloud/start', data);
  };

  Service.stopInstance = function (instance) {
    var data = {
      'instance': instance
    };
    return $http.post(urlPrefix + '/gcloud/stop', data);
  };

  Service.getGeolocationFallback = function() {
    // Google Maps API (inaccurate, but does not require SSL)
    var url = 'https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAiPfveeefSooz7rbrU40dLpba-SVHA2-s';
    return $http.post(url);
  };

  return Service;
}]);