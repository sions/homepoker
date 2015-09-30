goog.provide('poker.modelservice');

goog.require('goog.array');

goog.scope(function() {



/**
 * @param {!Object} model Model object, as returned by document.getModel().
 * @constructor
 */
poker.modelservice = function(model) {
  this.model_ = model;
  this.getLevelsFromModel_();
};


var pm = poker.modelservice;


/**
 * @const {string}
 */
pm.EVENT = {
  PLAYERS_CHANGED: 'players-changed',
  LEVELS_CHANGED: 'levels-changed'
};


/**
 * @typedef {{
 *   id: string,
 *   small: number,
 *   big: number,
 *   ante: number,
 *   levelTime: number 
 * }}
 */
pm.Level;


/**
 * @enum {string}
 * @private
 */
pm.PROPERTY_ = {
  PLAYERS: 'players',
  LEVELS: 'levels',
  SMALL_BLIND: 'small-blind',
  BIG_BLIND: 'big-blind',
  ANTE: 'ante',
  LEVEL_TIME: 'level-time'
};


pm.prototype.initialize = function() {
  this.getRoot_().set(pm.PROPERTY_.PLAYERS, 0);
  var levels = this.model_.createList();
  // Pre-populate some levels.
  levels.push(this.makeLevel_({small: 1, big: 2, ante: 0, levelTime: 15 * 60 * 1000}));
  levels.push(this.makeLevel_({small: 2, big: 4, ante: 0, levelTime: 15 * 60 * 1000}));
  levels.push(this.makeLevel_({small: 3, big: 6, ante: 0, levelTime: 15 * 60 * 1000}));
  levels.push(this.makeLevel_({small: 5, big: 10, ante: 1, levelTime: 15 * 60 * 1000}));
  this.getRoot_().set(pm.PROPERTY_.LEVELS, levels);
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
 * @param {number} count
 */
pm.prototype.setPlayers = function(count) {
  this.getRoot_().set(pm.PROPERTY_.PLAYERS, count);
};


/**
 * @return {!Array{pm.Level}}
 */
pm.prototype.getLevels = function() {
  return goog.array.clone(this.levels_);
};


/**
 * @return {!Array{pm.Level}}
 */
pm.prototype.mutateLevels = function() {
  var modelLevels = this.getRoot_().get(pm.PROPERTY_.LEVELS);
  var level = modelLevels.get(2);
  var big = level.get(pm.PROPERTY_.BIG_BLIND);
  level.set(pm.PROPERTY_.BIG_BLIND, big + 1);
};


pm.prototype.getLevelsFromModel_ = function() {
  this.levels_ = [];
  var modelLevels = this.getRoot_().get(pm.PROPERTY_.LEVELS);
  for (var i = 0; i < modelLevels.length; i++) {
    var level = modelLevels.get(i);
    this.levels_.push({
      id: level.id,
      small: level.get(pm.PROPERTY_.SMALL_BLIND),
      big: level.get(pm.PROPERTY_.BIG_BLIND),
      ante: level.get(pm.PROPERTY_.ANTE),
      levelTime: level.get(pm.PROPERTY_.LEVEL_TIME)
    });
  }
};


/**
 * @param {!Object} event
 */
pm.prototype.valuesChanged_ = function(event) {
  var levelsChanged = false;
  for (var i = 0, e; e = event.events[i]; i++) {
    if (e.type === gapi.drive.realtime.EventType.VALUE_CHANGED) {
      console.log('values changed. property: ' + e.property + ' newValue: ' + e.newValue);
      switch (e.property) {
        case pm.PROPERTY_.PLAYERS:
          this.$rootScope.$emit(pm.EVENT.PLAYERS_CHANGED, e);
          break;
        case pm.PROPERTY_.SMALL_BLIND:
          this.findLevelById_(e.target.id).small = e.newValue;
          levelsChanged = true;
          break;
        case pm.PROPERTY_.BIG_BLIND:
          this.findLevelById_(e.target.id).big = e.newValue;
          levelsChanged = true;
          break;
        case pm.PROPERTY_.ANTE:
          this.findLevelById_(e.target.id).ante = e.newValue;
          levelsChanged = true;
          break;
        case pm.PROPERTY_.LEVEL_TIME:
          this.findLevelById_(e.target.id).levelTime = e.newValue;
          levelsChanged = true;
          break;
      }
    } else if (e.type === gapi.drive.realtime.EventType.VALUES_ADDED || 
          e.type === gapi.drive.realtime.EventType.VALUES_REMOVED) {
      if (e.target.id === this.getRoot_().get(pm.PROPERTY_.LEVELS).id) {
        console.log('Levels changed');
        this.getLevelsFromModel_();
        levelsChanged = true;
      }
    }
  }

  if (levelsChanged) {
    this.$rootScope.$emit(pm.EVENT.LEVELS_CHANGED);
  }
};


/**
 * @param {string} id
 * @return {pm.Level}
 */
pm.prototype.findLevelById_ = function(id) {
  for (var i = 0, level; level = this.levels_[i]; i++) {
    if (level.id === id) {
      return level;
    }
  }
  return {};  // Return dummy level.
};

/**
 * @param {pm.Level} level
 */
pm.prototype.makeLevel_ = function(level) {
  var levelMap = this.model_.createMap();
  levelMap.set(pm.PROPERTY_.SMALL_BLIND, level.small);
  levelMap.set(pm.PROPERTY_.BIG_BLIND, level.big);
  levelMap.set(pm.PROPERTY_.ANTE, level.ante);
  levelMap.set(pm.PROPERTY_.LEVEL_TIME, level.levelTime);
  return levelMap;
};

});  // goog.scope