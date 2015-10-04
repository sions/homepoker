goog.provide('poker.controllers');

goog.require('poker.modelservice');
goog.require('poker.timeservice');

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
var timeEvent = poker.timeservice.EVENT;

controllers.controller('DummyController', 
    ['$scope', '$rootScope', 'timeService', 'modelService', 
     function($scope, $rootScope, timeService, modelService) {
  $scope.players = modelService.getPlayers();
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
      ['$scope', '$rootScope', '$interval', '$element', 'modelService', 
       function($scope, $rootScope, $interval, $element, modelService) {
  var updateGameState = function() {
    var levelState = modelService.getCurrentLevelState();
    var timeLeftInSeconds = Math.floor(levelState.timeLeftInLevel / 1000);
    $scope.seconds = timeLeftInSeconds % 60;
    $scope.minutes = Math.floor(timeLeftInSeconds / 60);
    $scope.small = levelState.current.small;
    $scope.big = levelState.current.big;
    $scope.ante = levelState.current.ante;
  };

  $element.addClass('ng-hide');
  $rootScope.$on(timeEvent.FIRST_SERVER_TIME, function() {
    $element.removeClass('ng-hide');
    updateGameState();
    $rootScope.$on(modelEvent.TIME_CHANGED, updateGameState);
    $interval(updateGameState, controllers.TIMER_UPDATE_PERIOD_MS_);
  });
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope