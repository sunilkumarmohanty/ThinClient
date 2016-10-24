var getApps = function(req, res) {
  var allowedDistance = 200;

  if (req.query) {
    // if a specific accuracy was given, the inaccurate Google Maps API was used
    // -> allow for a larger radius of 1.5 times the accuracy given by the Maps API
    var inaccurate = req.query.acc ? true : false;
    var allowedDistance = inaccurate ? (req.query.acc * 1.5) : allowedDistance;
    // but at least 200 meters
    allowedDistance = (allowedDistance < 200) ? 200 : allowedDistance;
  }

  if (getDistanceFromCS(req.query.lat, req.query.long) < allowedDistance) {
    //24.814248, 60.185225 -outside- 24.820954, 60.186609 inside
    console.log("The device location is within CS building");
    res.status(200).json([{
      'name': 'OpenOffice',
      'description': 'Use OpenOffice Writer, Calc, Impress, Draw and Base.',
      'instance': 'openoffice',
      'imgSrc': '/openoffice-image.png'
    }, {
      'name': 'Inkscape',
      'description': 'Create vector graphics.',
      'instance': 'inkscape',
      'imgSrc': '/inkscape-image.png'
    }, {
      'name': 'Firefox',
      'description': 'Surf the internet.',
      'instance': 'firefox',
      'imgSrc': '/firefox-image.png'
    }]);
  } else {
    console.log("The device location is outside CS building");
    res.status(200).json([{
      'name': 'Inkscape',
      'description': 'Create vector graphics.',
      'instance': 'inkscape',
      'imgSrc': '/inkscape-image.png'
    }, {
      'name': 'OpenOffice',
      'description': 'Use OpenOffice Writer, Calc, Impress, Draw and Base.',
      'instance': 'openoffice',
      'imgSrc': '/openoffice-image.png'
    }, {
      'name': 'Firefox',
      'description': 'Surf the internet.',
      'instance': 'firefox',
      'imgSrc': '/firefox-image.png'
    }]);
  }
};

function getDistanceFromCS() {
  // CS building coordinates
  var latcs = 60.186969 / 180.0 * Math.PI;
  var longcs = 24.821325 / 180.0 * Math.PI;

  var radians = Array.prototype.map.call(arguments, function(deg) {
    return deg / 180.0 * Math.PI;
  });
  var lat2 = radians[0],
    lon2 = radians[1];
  var R = 6372800; // meters
  var dLat = lat2 - latcs;
  var dLon = lon2 - longcs;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(latcs) * Math.cos(lat2);
  var c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

module.exports = function(app) {
  app.get('/apps', getApps);
};