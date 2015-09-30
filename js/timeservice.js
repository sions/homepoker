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
};


var ts = poker.timeservice;

/**
 * @const {number}
 * @private
 */
ts.SERVER_UPDATE_PERIOD_MS_ = 60 * 1000;

ts.prototype.register = function() {
  var module = angular.module('timeServiceModule', ['ngResource']);
  var thisModel = this;
  module.factory('timeService', ['$interval', '$http', function($interval, $http) { 

    var updateTime = function() {
      // NOTE: I would have used JSON_CALLBACK as the callback, but it appears timeapi.org has a 
      // problem with dots in the callback.
      var callbackName = '_timeservice_callback_' + Math.round(Math.random() * 100000)
      var callback = function(data) {
        var newServerTime = parseInt(data.dateString);
        console.log('Got new time from server ' + newServerTime);
        thisModel.updateTime_(newServerTime);
        delete window[callbackName];
      }
      window[callbackName] = callback;

      var url = 'http://www.timeapi.org/utc/now.json?format=%25Q&callback=' + callbackName;
      $http.jsonp(url);
    }

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

ts.prototype.getTime = function() {
  return this.serverTime_ + this.localTime_() - this.lastLocalTime_
};

});  // goog.scope
