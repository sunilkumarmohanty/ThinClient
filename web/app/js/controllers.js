app.controller('AppController', ['$document', '$location', '$scope', '$mdDialog', '$mdToast', '$state', '$timeout', '$window', 'AppService',
  function($document, $location, $scope, $mdDialog, $mdToast, $state, $timeout, $window, AppService) {

    /* Each view will construct the controller once,
       make sure that all refer to the same thing to
       keep variables in sync. I.e. even though each
       view will have its own instance, they all refer
       to the original one. */
    $scope.vm = $scope.vm || {};
    var vm = $scope.vm;

    vm.init = function() {
      vm.initialized = vm.initialized || false;
      vm.loading = vm.loading || false;
      vm.connected = false;

      if (!vm.initialized) {
        vm.statusText = '';
        vm.connectionInfo = null;
        vm.apps = [];

        $scope.$watch('vm.statusText', function() {
          if (vm.statusText !== '') {
            console.log('Status: ', vm.statusText);
            $timeout(function() {
              vm.showToast(vm.statusText);
            });
          }
        });

        vm.initialized = true;
      }

      if ($state.current.name == 'apps') {
        vm.getApps();
      }
      else if ($state.current.name == 'vnc') {
        if (!vm.connectionInfo) {
          $state.go('apps');
        }
      }
    };

    vm.confirmDialog = function(title, okText, okCallback, cancelText, cancelCallback) {
      $timeout(function() {
        vm.loading = false;
        // only if no dialog is already open
        if (!$document.find('body').hasClass('md-dialog-is-showing')) {
          var dialog = $mdDialog.confirm()
            .title(title)
            .ariaLabel(title)
            .ok(okText)
            .cancel(cancelText);
          $mdDialog.show(dialog).then(function() {
            okCallback();
          }, function() {
            cancelCallback();
          });
        }
      });
    };

    vm.logout = function() {
      console.log('Logging out?');
      var callback = function() {
        vm.loading = true;
        if (vm.connected) {
          vm.disconnectVnc();
          $timeout(function() {
            vm.statusText = 'Stopping virtual machine';
          }, 500);
          AppService.stopInstance(vm.connectionInfo.instance).then(function(res) {
            AppService.logout().then(function() {
              $window.location = '/login';
            }, function(err) {
              console.log('Logout failed: ', err);
              vm.statusText = 'Logout failed';
              vm.loading = false;
            });
          }, function(err) {
            console.log('Stopping instance failed: ', err);
            vm.statusText = 'Stopping instance failed';
            vm.loading = false;
          });
        } else {
          AppService.logout().then(function() {
            $window.location = '/login';
          }, function(err) {
            console.log('Logout failed: ', err);
            vm.statusText = 'Logout failed';
            vm.loading = false;
          });
        }
      }
      vm.confirmDialog('Logout?', 'Logout', callback, 'Cancel', function() {});
    };

    vm.disconnect = function() {
      var callback = function() {
        vm.loading = true;
        vm.disconnectVnc();
        $timeout(function() {
          vm.statusText = 'Stopping virtual machine';
        }, 300);
        AppService.stopInstance(vm.connectionInfo.instance).then(function(res) {
          vm.loading = false;
        }, function(err) {
          console.log('Stopping instance failed: ', err);
          vm.statusText = 'Stopping instance failed';
          vm.loading = false;
        })
        $state.go('apps');
      };
      vm.confirmDialog('Disconnect?', 'Disconnect', callback, 'Cancel', function() {});
    };

    vm.getApps = function() {
      vm.loading = true;
      vm.statusText = 'Getting geolocation';

      var callback = function(geolocation) {
        AppService.getApps(geolocation).then(function(res) {
          vm.apps = res.data;
          vm.loading = false;
        }, function(err) {
          console.log('Failed to get app list: ', err);
          vm.loading = false;
        });
      };

      // timeout for location allow/deny browser popup
      var waitingLocationPermission = true;
      var locationPermissionTimeout = $timeout(function () {
        waitingLocationPermission = false;
        vm.statusText = 'Geolocation failed';
        callback(null);
      }, 10000);

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
          if (waitingLocationPermission) {
            $timeout.cancel(locationPermissionTimeout);
            vm.statusText = 'Geolocation acquired';
            callback(position);
          }
        }, function() {
          // try falling back to Google Maps API if HTML5 geolocation fails
          if (waitingLocationPermission) {
            $timeout.cancel(locationPermissionTimeout);
          }
          AppService.getGeolocationFallback().then(function(res) {
            if (res.data.location) {
              var position = {};
              position.coords = {
                latitude: res.data.location.lat,
                longitude: res.data.location.lng,
              };
              if (res.data.accuracy) {
                position.coords.accuracy = res.data.accuracy;
              }
              position.inaccurate = true;
              vm.statusText = '(Inaccurate) geolocation acquired';
              callback(position);
            } else {
              vm.statusText = 'Geolocation failed';
              callback(null);
            }
          }, function(err) {
            vm.statusText = 'Geolocation failed';
            callback(null);
          });
        });
      } else {
        vm.statusText = 'Geolocation not supported';
        callback(null);
      }
    };

    vm.showLaunchDialog = function(app) {
      var title = 'Start ' + app.name + '?';
      vm.confirmDialog(title, 'Launch', function() {
        vm.launchApp(app);
      }, 'Cancel', function() {});
    };

    vm.launchApp = function(app) {
      vm.statusText = 'Starting virtual machine';
      vm.connectionInfo = {
        host: null,
        port: 8787,
        password: 'mcc07vnc',
        instance: app.instance
      };
      vm.loading = true;
      AppService.startInstance(app.instance).then(function(res) {
        if (res.data.externalIP) {
          vm.connectionInfo.host = res.data.externalIP;
          $state.go('vnc');
        } else {
          vm.statusText = 'Failed to get an external IP for the instance';
          vm.loading = false;
        }
      }, function(err) {
        console.log(err);
        if (err.statusText) {
          vm.statusText = 'Connection failed: ' + err.statusText;
        } else {
          vm.statusText = 'Connection failed. Please try again.';
        }
        vm.loading = false;
      });
    };

    vm.showToast = function(text) {
      $mdToast.show(
        $mdToast.simple()
          .textContent(text)
          .position('bottom left')
          .hideDelay(3000)
      );
    };

    // Init once everything is defined etc.
    vm.init();
  }
]);