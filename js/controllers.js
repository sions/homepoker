goog.provide('poker.controllers');

goog.require('goog.array');
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

/**
 * @const {string}
 */
var EVENTS = {
  IN_GAME_LEVEL_CHANGE: 'in-game-level-change'
};


/**
 * @const {number}
 * @private
 */
controllers.TIMER_UPDATE_PERIOD_MS_ = 250;

controllers.controller('StartPauseController', 
      ['$scope', '$rootScope', '$interval', '$element', 'modelService',
       function($scope, $rootScope, $interval, $element, modelService) {
  var toPauseElements = 
      [document.getElementById('toPause1'), document.getElementById('toPause2')];
  var toPlayElements = 
      [document.getElementById('toPlay1'), document.getElementById('toPlay2')];
  var svg = $element.find('svg')[0];

  var animate = function(element) {
    element.beginElement();
  };

  var updateRunningState = function() {
    var newRunning = modelService.isRunning();
    if (newRunning != $scope.running) {
      if ($scope.running) {
        goog.array.forEach(toPlayElements, animate);
        svg.removeAttribute('class');
      } else {
        goog.array.forEach(toPauseElements, animate);
        svg.setAttribute('class', 'paused');
      }

      $scope.running = newRunning;
    }
  };

  $scope.running = false;
  updateRunningState();
  $rootScope.$on(modelEvent.TIME_CHANGED, updateRunningState);

  $scope.toggle = function() {
    if ($scope.running) {
      modelService.pause();  
    } else {
      modelService.start();
    }
  };
}]);


controllers.controller('TimerController', 
      ['$scope', '$rootScope', '$interval', '$element', 'modelService', 
       function($scope, $rootScope, $interval, $element, modelService) {
  var updateGameState = function() {
    var levelState = modelService.getCurrentLevelState();
    var timeLeftInSeconds = Math.floor(levelState.timeLeftInLevel / 1000);
    $scope.seconds = timeLeftInSeconds % 60;
    $scope.minutes = Math.floor(timeLeftInSeconds / 60);
    var oldLevel = $scope.levelIndex;
    $scope.levelIndex = levelState.levelIndex;
    if ($scope.levelIndex != oldLevel) {
      $rootScope.$emit(EVENTS.IN_GAME_LEVEL_CHANGE);
    }
  };

  $element.addClass('ng-hide');
  $rootScope.$on(timeEvent.FIRST_SERVER_TIME, function() {
    $element.removeClass('ng-hide');
    updateGameState();
    $rootScope.$on(modelEvent.TIME_CHANGED, updateGameState);
    $interval(updateGameState, controllers.TIMER_UPDATE_PERIOD_MS_);
  });
}]);


controllers.controller('PlayerController', 
    ['$scope', '$rootScope', 'modelService', 
     function($scope, $rootScope, modelService) {
  $scope.players = modelService.getPlayers();
  
  $rootScope.$on(modelEvent.PLAYERS_CHANGED, function(eventName, event) {
    $scope.players = event.newValue;
  });

  $rootScope.$on(modelEvent.LEVELS_CHANGED, function(eventName) {
    $scope.levels = modelService.getLevels();
  });
}]);


controllers.controller('BlindController', 
      ['$scope', '$rootScope', '$interval', '$element', 'modelService', 
       function($scope, $rootScope, $interval, $element, modelService) {
  $scope.small = 0;
  $scope.big = 0;
  $scope.ante = 0;
  $scope.nextSmall = 0;
  $scope.nextBig = 0;
  $scope.nextAnte = 0;
  var updateLevels = function() {
    var levelState = modelService.getCurrentLevelState();
    $scope.small = levelState.current.small;
    $scope.big = levelState.current.big;
    $scope.ante = levelState.current.ante;
    if (levelState.next != null) {
      $scope.nextSmall = levelState.next.small;
      $scope.nextBig = levelState.next.big;
      $scope.nextAnte = levelState.next.ante;
    } else {
      $scope.nextSmall = 0;
      $scope.nextBig = 0;
      $scope.nextAnte = 0;
    }
  };

  $rootScope.$on(EVENTS.IN_GAME_LEVEL_CHANGE, updateLevels);
  $rootScope.$on(modelEvent.LEVELS_CHANGED, updateLevels);
}]);

goog.exportSymbol('controllers', controllers);

});  // goog.scope