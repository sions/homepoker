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
  $rootScope.$on(modelEvent.PLAYERS_CHANGED, function(eventName, event) {
    $scope.$apply(function() {
      $scope.players = event.newValue;
    });
  });
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope