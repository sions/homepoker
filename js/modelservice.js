goog.provide('poker.modelservice');


goog.scope(function() {



/**
 * @param {!Object} Model object, as returned by document.getModel().
 * @constructor
 */
poker.modelservice = function(model) {
  this.model_ = model;
};


var pm = poker.modelservice;


/**
 * @const {string}
 */
pm.EVENT = {
  PLAYERS_CHANGED: 'players-changed'
};


/**
 * @enum {string}
 * @private
 */
pm.PROPERTY_ = {
  PLAYERS: 'players'
};


pm.prototype.initialize = function() {
  this.getRoot_().set(pm.PROPERTY_.PLAYERS, 0);
};


pm.prototype.register = function() {
  var service = angular.module('modelServiceModule', ['ngResource']);
  var thisModel = this;
  service.factory('modelService', function($rootScope) { 
    thisModel.$rootScope = $rootScope;

    thisModel.getRoot_().addEventListener(
        gapi.drive.realtime.EventType.OBJECT_CHANGED, 
        goog.bind(thisModel.valuesChanged_, thisModel));
    return thisModel; 
  });
};


/**
 * @private
 */
pm.prototype.getRoot_ = function() {
  return this.model_.getRoot();
};


/**
 * @return {number}
 */
pm.prototype.getPlayers = function() {
  return this.getRoot_().get(pm.PROPERTY_.PLAYERS);
};


/**
 * @param {number}
 */
pm.prototype.setPlayers = function(count) {
  this.getRoot_().set(pm.PROPERTY_.PLAYERS, count);
};


/**
 * @param {!Object}
 */
pm.prototype.valuesChanged_ = function(event) {
  for (var i = 0, e; e = event.events[i]; i++) {
    console.log('values changed. property: ' + e.property + ' newValue: ' + e.newValue);
    switch (e.property) {
      case pm.PROPERTY_.PLAYERS:
        this.$rootScope.$emit(pm.EVENT.PLAYERS_CHANGED, e);
        break;
    }
  }
};


});  // goog.scope