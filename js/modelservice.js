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
  this.timeToLastCheckpoint_ = 0;
  this.timeOfLastCheckpoint_ = null;
  this.running_ = false;
  this.processTimeEvents_();
};


var pm = poker.modelservice;


/**
 * @const {string}
 */
pm.EVENT = {
  PLAYERS_CHANGED: 'players-changed',
  PLAYERS_STARTED_CHANGED: 'players-started-changed',
  STARTING_CHIPS_CHANGED: 'starting-chips-changed',
  LEVELS_CHANGED: 'levels-changed',
  TIME_CHANGED: 'time-changed'
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
 * @enum {number}
 */
pm.TimeEventType = {
  START: 0,
  PAUSE: 1,
  SET_TIME: 2
};


/**
 * @typedef {{
 *   timestamp: number,
 *   evntType: pm.TimeEventType,
 *   value: number 
 * }}
 */
pm.TimeEvent;


/**
 * @typedef {{
 *   current: pm.Level,
 *   next: pm.Level,
 *   timeLeftInLevel: number,
 *   levelIndex: number
 * }}
 */
pm.LevelState;


/**
 * @enum {string}
 * @private
 */
pm.PROPERTY_ = {
  PLAYERS: 'players',
  PLAYERS_STARTED: 'players-started',
  STARTING_CHIPS: 'starting-chips',
  LEVELS: 'levels',
  SMALL_BLIND: 'small-blind',
  BIG_BLIND: 'big-blind',
  ANTE: 'ante',
  LEVEL_TIME: 'level-time',
  TIME_EVENTS: 'time-events'
};


pm.prototype.initialize = function() {
  this.setPlayers(1);
  this.setPlayersStarted(1);
  this.setStartingChips(1)
  var levels = this.model_.createList();
  // Pre-populate some levels.
  levels.push(this.makeLevel_({small: 1, big: 2, ante: 0, levelTime: 2 * 1000}));
  levels.push(this.makeLevel_({small: 2, big: 4, ante: 0, levelTime: 2 * 1000}));
  levels.push(this.makeLevel_({small: 3, big: 6, ante: 1, levelTime: 2 * 1000}));
  levels.push(this.makeLevel_({small: 5, big: 10, ante: 2, levelTime: 15 * 60 * 1000}));
  this.getRoot_().set(pm.PROPERTY_.LEVELS, levels);

  var timeEvents = this.model_.createList();
  this.getRoot_().set(pm.PROPERTY_.TIME_EVENTS, timeEvents);
};


pm.prototype.register = function() {
  var service = angular.module('modelServiceModule', ['ngResource']);
  var thisModel = this;
  service.factory('modelService', ['timeService', '$rootScope', 
      function(timeService, $rootScope) { 
    thisModel.$rootScope = $rootScope;
    thisModel.timeService = timeService;

    thisModel.getRoot_().addEventListener(
        gapi.drive.realtime.EventType.OBJECT_CHANGED, 
        goog.bind(thisModel.valuesChanged_, thisModel));
    return thisModel; 
  }]);
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
 * @return {number}
 */
pm.prototype.getPlayersStarted = function() {
  return this.getRoot_().get(pm.PROPERTY_.PLAYERS_STARTED);
};


/**
 * @param {number} count
 */
pm.prototype.setPlayersStarted = function(count) {
  this.getRoot_().set(pm.PROPERTY_.PLAYERS_STARTED, count);
};

/**
 * @return {number}
 */
pm.prototype.getStartingChips = function() {
  return this.getRoot_().get(pm.PROPERTY_.STARTING_CHIPS);
};


/**
 * @param {number} count
 */
pm.prototype.setStartingChips = function(count) {
  this.getRoot_().set(pm.PROPERTY_.STARTING_CHIPS, count);
};


/**
 * @return {!Array{pm.Level}}
 */
pm.prototype.getLevels = function() {
  return goog.array.clone(this.levels_);
};


pm.prototype.getLevelsFromModel_ = function() {
  this.levels_ = [];
  var modelLevels = this.getRoot_().get(pm.PROPERTY_.LEVELS) || [];
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
  var timeChanged = false;
  
  for (var i = 0, e; e = event.events[i]; i++) {
    if (e.type === gapi.drive.realtime.EventType.VALUE_CHANGED) {
      console.log('values changed. property: ' + e.property + ' newValue: ' + e.newValue);
      switch (e.property) {
        case pm.PROPERTY_.PLAYERS:
          this.emitEventOnRootScope_(pm.EVENT.PLAYERS_CHANGED, e);
          break;
        case pm.PROPERTY_.PLAYERS_STARTED:
          this.emitEventOnRootScope_(pm.EVENT.PLAYERS_STARTED_CHANGED, e);
          break;
        case pm.PROPERTY_.STARTING_CHIPS:
          this.emitEventOnRootScope_(pm.EVENT.STARTING_CHIPS_CHANGED, e);
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
      } else if (e.target.id === this.getRoot_().get(pm.PROPERTY_.TIME_EVENTS).id &&
          e.type === gapi.drive.realtime.EventType.VALUES_ADDED) {
        goog.array.forEach(e.values, this.processTimeEvent_, this);
        timeChanged = true;
      }
    }
  }

  if (levelsChanged) {
    this.emitEventOnRootScope_(pm.EVENT.LEVELS_CHANGED);
  }
  if (timeChanged) {
    this.emitEventOnRootScope_(pm.EVENT.TIME_CHANGED);
  }
};


/**
 * @param {pm.EVENT} eventType
 * @param {Object=} opt_value
 * @private
 */
pm.prototype.emitEventOnRootScope_ = function(eventType, opt_value) {
  var requiresApply = !this.$rootScope.$$phase;
  if (requiresApply) {
    var thisModel = this;
    this.$rootScope.$apply(function() {
      thisModel.$rootScope.$emit(eventType, opt_value);
    });
  } else {
    this.$rootScope.$emit(eventType, opt_value);
  }
}

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


/**
 * @private
 */
pm.prototype.processTimeEvents_ = function() {
  var timeEvents = this.getRoot_().get(pm.PROPERTY_.TIME_EVENTS) || [];

  for (var i = 0; i < timeEvents.length; ++i) {
    var timeEvent = /** type {pm.TimeEvent} */ timeEvents.get(i);
    this.processTimeEvent_(timeEvent);
  }
};


/**
 * @param {pm.TimeEvent}
 */
pm.prototype.processTimeEvent_ = function(timeEvent) {
  console.log('Processing time event: ' + JSON.stringify(timeEvent));
  switch (timeEvent.eventType) {
    case pm.TimeEventType.START:
      if (this.running_) {
        this.timeToLastCheckpoint_ += timeEvent.timestamp - this.timeOfLastCheckpoint_;
      }
      this.running_ = true;
      break;
    case pm.TimeEventType.PAUSE:
      if (this.running_) {
        this.timeToLastCheckpoint_ += timeEvent.timestamp - this.timeOfLastCheckpoint_;
        this.running_ = false;
      }
      break;
    case pm.TimeEventType.SET_TIME:
      this.timeToLastCheckpoint_ = timeEvent.value;
      break;
    default:
      console.log('Unexpected event: ' + timeEvent);
      return;
  }
  this.timeOfLastCheckpoint_ = timeEvent.timestamp;
};


/**
 * @return {boolean} Whether the game is running.
 */
pm.prototype.isRunning = function() {
  return this.running_;
};


pm.prototype.start = function() {
  var timeEvent = {
    timestamp: this.timeService.getTime(),
    eventType: pm.TimeEventType.START
  };
  this.getRoot_().get(pm.PROPERTY_.TIME_EVENTS).push(timeEvent);
};


pm.prototype.pause = function() {
  var timeEvent = {
    timestamp: this.timeService.getTime(),
    eventType: pm.TimeEventType.PAUSE
  };
  this.getRoot_().get(pm.PROPERTY_.TIME_EVENTS).push(timeEvent);
};


pm.prototype.getGameTime = function() {
  var gameTime = this.timeToLastCheckpoint_;
  if (this.running_) {
    gameTime += this.timeService.getTime() - this.timeOfLastCheckpoint_;
  }
  return gameTime;
};


/**
 * @param {number} levelINdex
 * @param {number} timeRemainingInLevelMs
 */
pm.prototype.setGameTime = function(levelIndex, timeRemainingInLevelMs) {
  var levels = this.getLevels();

  if (levelIndex >= levels.length) {
    console.log('Level ' + levelIndex + ' out of range. Ignoring set game time');
    return;
  }

  var i = 0;
  var newTime = 0;
  for (; i < levelIndex; ++i) {
    newTime += levels[i].levelTime;
  }
  var timeInLevel = Math.max(0, levels[levelIndex].levelTime - timeRemainingInLevelMs);
  newTime += timeInLevel;
  
  var timeEvent = {
    timestamp: this.timeService.getTime(),
    eventType: pm.TimeEventType.SET_TIME,
    value: newTime
  };
  this.getRoot_().get(pm.PROPERTY_.TIME_EVENTS).push(timeEvent);
};


/**
 * @return {!pm.LevelState}
 */
pm.prototype.getCurrentLevelState = function() {
  var gameTime = this.getGameTime();
  var levels = this.getLevels();
  var totalTime = 0;
  var level;
  var i = 0;
  for (; level = levels[i]; i++) {
    totalTime += level.levelTime;
    if (totalTime > gameTime) {
      break;
    }
  }
  if (i >= levels.length) {
    return {
      current: levels[levels.length - 1],
      next: null,
      timeLeftInLevel: 0,
      levelIndex: levels.length - 1
    }
  }

  return {
    current: levels[i],
    next: levels[i + 1] || null,
    timeLeftInLevel: totalTime - gameTime,
    levelIndex: i
  };
};

});  // goog.scope