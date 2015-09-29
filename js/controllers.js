goog.provide('poker.controllers');


goog.scope(function() {

var controllers = angular.module('pokerControllers', []);

controllers.controller('DummyController', 
    ['$scope', 'modelService', function($scope, modelService) {
  $scope.players = modelService.getPlayers();
}]);

goog.exportSymbol('controllers', controllers);


});  // goog.scope