goog.provide('poker.timeservice');

goog.require('goog.Timer');


goog.scope(function() {


/**
 * @constructor
 */
poker.timeservice = function() {
  var localTime = this.localTime_();
  this.serverTime_ = localTime;
  this.lastLocalTime_ = localTime;
  this.gotServerTime_ = false;
};


var ts = poker.timeservice;


/**
 * @const {string}
 */
ts.EVENT = {
  FIRST_SERVER_TIME: 'first-server-time'
};


/**
 * @const {number}
 * @private
 */
ts.SERVER_UPDATE_PERIOD_MS_ = 60 * 5 * 1000;

ts.prototype.register = function() {
  var module = angular.module('timeServiceModule', ['ngResource']);
  var thisModel = this;
  module.factory('timeService', ['$interval', '$http', '$rootScope', 
      function($interval, $http, $rootScope) { 
    var updateTime = function() {
      $http({
        method: 'GET',
        url: '/get_time'
      }).then(function(response) {
        thisModel.updateTime_(response.data.timestamp);
        if (!thisModel.gotServerTime_) {
          thisModel.gotServerTime_ = true;
          $rootScope.$emit(ts.EVENT.FIRST_SERVER_TIME);
        }
      });
    };

    updateTime();
    $interval(updateTime, ts.SERVER_UPDATE_PERIOD_MS_)

    return thisModel; 
  }]);
};


ts.prototype.updateTime_ = function(newServerTime) {
  this.serverTime_ = newServerTime;
  this.lastLocalTime_ = this.localTime_();
};


/**
 * @return {number} Local time in milliseconds.
 */
ts.prototype.localTime_ = function() {
  return new Date().getTime();
};


/**
 * @return {number} Current timestamp.
 */
ts.prototype.getTime = function() {
  goog.asserts.assert(this.gotServerTime_, 'Did not get time for server yet.');
  return this.serverTime_ + this.localTime_() - this.lastLocalTime_
};

});  // goog.scope
