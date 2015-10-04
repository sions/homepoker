goog.provide('poker.controllers');

goog.require('poker.modelservice');

goog.scope(function() {

var controllers = angular.module('pokerControllers', []);
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


controllers.controller('StartPauseController', 
    ['$scope', '$rootScope', 'modelService', function($scope, $rootScope, modelService) {
  $scope.start = function() {
    modelService.start();
  };
  $scope.pause = function() {
    modelService.pause();
  };

  $scope.running = modelService.isRunning();
  $rootScope.$on(modelEvent.TIME_CHANGED, function(eventName) {
    $scope.running = modelService.isRunning();
  });

  $scope.gameTime = modelService.getGameTime();
  $rootScope.$on(modelEvent.TIME_CHANGED, function(eventName) {
    $scope.gameTime = modelService.getGameTime();
  });
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope