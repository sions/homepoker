goog.provide('poker.controllers');

goog.require('poker.modelservice');

goog.scope(function() {

var controllers = angular.module('pokerControllers', [])
    .filter('numberFixedLen', function () {
        return function (n, len) {
            var num = parseInt(n, 10);
            len = parseInt(len, 10);
            num_str = '' + num;
            return Array(len - num_str.length + 1).join('0') + num_str;
        };
    });
var modelEvent = poker.modelservice.EVENT;

controllers.controller('DummyController', 
    ['$scope', '$rootScope', 'timeService', 'modelService', 
     function($scope, $rootScope, timeService, modelService) {
  $scope.players = modelService.getPlayers();
  $scope.now = timeService.getTime();
  $scope.levels = modelService.getLevels();
  
  $rootScope.$on(modelEvent.PLAYERS_CHANGED, function(eventName, event) {
    $scope.players = event.newValue;
  });

  $rootScope.$on(modelEvent.LEVELS_CHANGED, function(eventName) {
    $scope.levels = modelService.getLevels();
  });
}]);


/**
 * @const {number}
 * @private
 */
controllers.TIMER_UPDATE_PERIOD_MS_ = 250;

controllers.controller('StartPauseController', 
      ['$scope', '$rootScope', '$interval', 'modelService', 
       function($scope, $rootScope, $interval, modelService) {
  $scope.start = function() {
    modelService.start();
  };
  $scope.pause = function() {
    modelService.pause();
  };

  $scope.running = modelService.isRunning();
}]);


controllers.controller('TimerController', 
      ['$scope', '$rootScope', '$interval', 'modelService', 
       function($scope, $rootScope, $interval, modelService) {
  var updateGameTime = function() {
    var gameTimeInSeconds = Math.floor(modelService.getGameTime() / 1000);
    $scope.seconds = gameTimeInSeconds % 60;
    $scope.minutes = Math.floor(gameTimeInSeconds / 60);
  };

  updateGameTime();
  $rootScope.$on(modelEvent.TIME_CHANGED, updateGameTime);
  $interval(updateGameTime, controllers.TIMER_UPDATE_PERIOD_MS_);
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope