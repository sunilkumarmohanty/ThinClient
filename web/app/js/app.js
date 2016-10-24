var app = angular.module('app', ['ngMaterial', 'ui.router']);

app.config(function($stateProvider, $urlRouterProvider, $mdIconProvider) {
  $mdIconProvider
    .icon('more', 'img/ic_more_vert_white_24px.svg', 24)
    .icon('keyboard', 'img/ic_keyboard_white_24px.svg', 24)
    .icon('drag', 'img/ic_open_with_white_24px.svg', 24);

  $urlRouterProvider.otherwise('/apps');
  $stateProvider
    .state('apps', {
      url: '/apps',
      templateUrl: 'partials/apps.html',
      controller: 'AppController'
    })
    .state('vnc', {
      url: '/vnc',
      template: '<vnc-client></vnc-client>',
      controller: 'AppController'
    });
});