goog.provide('poker.appdataservice');

goog.require('goog.array');
goog.require('goog.object');
goog.require('poker.modelservice');

goog.scope(function() {



/**
 * @param {!Object} model Model object, as returned by gapi.drive.realtime.loadAppDataDocument().
 * @constructor
 */
poker.appdataservice = function(model) {
  this.model_ = model;
};


var pa = poker.appdataservice;
var ms = poker.modelservice;


/**
 * @enum {string}
 * @private
 */
pa.PROPERTY_ = {
  SCHEMAS: 'schemas'
};


pa.prototype.initialize = function() {
  this.getRoot_().set(pa.PROPERTY_.SCHEMAS, this.model_.createMap());
};


pa.prototype.register = function() {
  var service = angular.module('appdataServiceModule', []);
  var thisModel = this;
  service.factory('appdataService', ['$rootScope', function($rootScope) { 
    thisModel.$rootScope = $rootScope;
    return thisModel; 
  }]);
};


/**
 * @private
 */
pa.prototype.getRoot_ = function() {
  return this.model_.getRoot();
};


/**
 * @return {!CollaborativeMap.<string, !Array<ms.Level>>}
 * @private
 */
pa.prototype.getSchemas_ = function() {
  return this.getRoot_().get(pa.PROPERTY_.SCHEMAS);
};


/**
 * @return {!Array{string}}
 */
pa.prototype.getSchemaNames = function() {
  var schemas = this.getSchemas_();
  var keys = schemas.keys();
  goog.array.sort(keys);
  return keys;
};


/**
 * @param {string} name
 * @return {!Array<ms.Level>}
 */
pa.prototype.getSchema = function(name) {
  return this.getSchemas_().get(name);
};


/**
 * @param {string} name
 * @param {!Array<ms.Level>}
 */
pa.prototype.setSchema = function(name, levels) {
  this.getSchemas_().set(name, levels);
};


/**
 * @param {string} name
 */
pa.prototype.deleteSchema = function(name) {
  this.getSchemas_()['delete'](name);
};


});  // goog.scope
