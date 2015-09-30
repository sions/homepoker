goog.provide('poker.controllers');


goog.scope(function() {

var controllers = angular.module('pokerControllers', []);

controllers.controller('DummyController', 
    ['$scope', 'timeService', 'modelService', function($scope, timeService, modelService) {
  $scope.players = modelService.getPlayers();
  $scope.now = timeService.getTime();
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope