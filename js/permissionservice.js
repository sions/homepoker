goog.provide('poker.permissionservice');



goog.scope(function() {


/**
 * @param {string} fileId
 * @constructor
 */
poker.permissionservice = function(fileId) {
  this.editable_ = null;
  this.fileId_ = fileId;
  this.shareLink_ = null;

  var request = gapi.client.drive.files.get({'fileId': this.fileId_});
  request.execute(goog.bind(this.metadataResponseHandler_, this));
};


var ps = poker.permissionservice;


/**
 * @const {string}
 */
ps.EVENT = {
  EDITABLE_UPDATED: 'editable-updated'
};


ps.prototype.register = function() {
  var module = angular.module('permissionServiceModule', ['ngResource']);
  var thisService = this;
  module.factory('permissionService', ['$rootScope', function($rootScope) { 
    thisService.$rootScope = $rootScope;
    return thisService; 
  }]);
};


/**
 * @private
 */
ps.prototype.metadataResponseHandler_ = function(response) {
  this.editable_ = response['editable'];
  this.shareLink_ = response['alternateLink'];
  if (!this.$rootScope) {  // Response arrived before angular was bootstrapped.
    return;
  }

  var thisService = this;
  this.$rootScope.$apply(function() {
    thisService.$rootScope.$emit(ps.EVENT.EDITABLE_UPDATED);
  });
};


/**
 * @return {boolean}
 */
ps.prototype.getEditable = function() {
  return !!this.editable_;
};


/**
 * @return {string}
 */
ps.prototype.getShareLink = function() {
  return this.shareLink_;
};

});  // goog.scope
