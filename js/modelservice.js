goog.provide('poker.modelservice');


/**
 * @param {!Object} Model object, as returned by document.getModel().
 * @constructor
 */
poker.modelservice = function(model) {
  this.model_ = model;
};


poker.modelservice.prototype.initialize = function() {
  this.getRoot_().set('players', 5);
}

poker.modelservice.prototype.register = function() {
  var module = angular.module('modelServiceModule', ['ngResource']);
  var thisModel = this;
  module.factory('modelService', function() { return thisModel; });
};


/**
 * @private
 */
poker.modelservice.prototype.getRoot_ = function() {
  return this.model_.getRoot();
};


/**
 * @return {number}
 */
poker.modelservice.prototype.getPlayers = function() {
  return this.getRoot_().get('players');
};


/**
 * @param {number}
 */
poker.modelservice.prototype.setPlayers = function(count) {
  this.getRoot_().set('players', count);
};