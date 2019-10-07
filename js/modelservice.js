goog.provide('poker.modelservice');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');

goog.scope(function() {



/**
 * @param {string} gameId Represents the currently loaded game.
 * @constructor
 */
poker.modelservice = function(gameId) {
  this.gameId_ = gameId;
  this.timeToLastCheckpoint_ = 0;
  this.timeOfLastCheckpoint_ = null;
  this.running_ = false;
  this.model_ = {};
};


var pm = poker.modelservice;


/**
 * @enum {string}
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
 * @const {Level}
 */
pm.DEFAULT_FIRST_LEVEL = {
  small: 1,
  big: 2,
  ante: 0,
  levelTime: 15 * 60 * 1000
};


/**
 * @enum {string}
 * @private
 */
pm.PROPERTY_ = {
  PLAYERS: 'players',
  PLAYERS_STARTED: 'players-started',
  STARTING_CHIPS: 'starting-chips',
  LEVELS: 'levels',
  TIME_EVENTS: 'time-events',
  CREATOR: 'creator',
  COLABORATORS: 'colaborators',
};


/**
 * @type {!Object<!pm.PROPERTY,!pm.EVENT>}
 * @private
 */
pm.PROPERTY_TO_EVENT_ = {
  [pm.PROPERTY_.PLAYERS]: pm.EVENT.PLAYERS_CHANGED,
  [pm.PROPERTY_.PLAYERS_STARTED]: pm.EVENT.PLAYERS_STARTED_CHANGED,
  [pm.PROPERTY_.STARTING_CHIPS]: pm.EVENT.STARTING_CHIPS_CHANGED,
  [pm.PROPERTY_.LEVELS]: pm.EVENT.LEVELS_CHANGED,
  [pm.PROPERTY_.TIME_EVENTS]: pm.EVENT.TIME_CHANGED,
  [pm.PROPERTY_.COLABORATORS]: pm.EVENT.COLABORATORS_CHANGED,
};


pm.createNewGame = async function(startingLevels = undefined) {
  console.log('Initializing model.');
  const uid = goog.asserts.assert(firebase.auth().currentUser.uid);
  model = {
    [pm.PROPERTY_.CREATOR]: uid,
    [pm.PROPERTY_.COLABORATORS]: {},
    [pm.PROPERTY_.PLAYERS]: 1,
    [pm.PROPERTY_.PLAYERS_STARTED]: 1,
    [pm.PROPERTY_.STARTING_CHIPS]: 1,
    [pm.PROPERTY_.TIME_EVENTS]: [],
  };
  
  let levels = [];

  if (!startingLevels) {
      // Pre-populate some levels.
    levels.push(pm.DEFAULT_FIRST_LEVEL);
    for (let i = 0; i < 5; ++i) {
      levels.push(pm.speculateNextLevel(levels[levels.length - 1]));
    }  
  } else {
    levels = startingLevels;
  }
  
  model[pm.PROPERTY_.LEVELS] = levels;

  const newGameRef = await firebase.firestore().collection('games').add(model);
  const newGameId = newGameRef.id;
  console.log('Model initialized: ' + newGameId);

  return newGameId;
};


/**
 * Reads initial data from the database.
 */
pm.prototype.readInitialData = async function() {
  const doc = await this.gameRef_().get();
  if (!doc.exists) {
    throw new Error('Game ID does not exist: ' + this.gameId_);
  }
  this.model_ = doc.data();
  this.processTimeEvents_();
};


/**
 * @private
 */
pm.prototype.gameRef_ = function() {
  return firebase.firestore().collection('games').doc(this.gameId_);
};


pm.prototype.register = function() {
  var service = angular.module('modelServiceModule', ['ngResource']);
  var thisModel = this;
  service.factory('modelService', ['timeService', '$rootScope', 
      function(timeService, $rootScope) { 
    thisModel.$rootScope = $rootScope;
    thisModel.timeService = timeService;

    thisModel.gameRef_().onSnapshot(goog.bind(thisModel.valuesChanged_, thisModel));
    return thisModel; 
  }]);
};


/**
 * @return {number}
 */
pm.prototype.getPlayers = function() {
  return this.model_[pm.PROPERTY_.PLAYERS];
};


/**
 * @param {number} count
 */
pm.prototype.setPlayers = function(count) {
  this.gameRef_().update({[pm.PROPERTY_.PLAYERS]: count});
};


/**
 * @return {number}
 */
pm.prototype.getPlayersStarted = function() {
  return this.model_[pm.PROPERTY_.PLAYERS_STARTED];
};


/**
 * @param {number} count
 */
pm.prototype.setPlayersStarted = function(count) {
  this.gameRef_().update({[pm.PROPERTY_.PLAYERS_STARTED]: count});
};

/**
 * @return {number}
 */
pm.prototype.getStartingChips = function() {
  return this.model_[pm.PROPERTY_.STARTING_CHIPS];
};


/**
 * @param {number} count
 */
pm.prototype.setStartingChips = function(count) {
  this.gameRef_().update({[pm.PROPERTY_.STARTING_CHIPS]: count});
};


/**
 * @return {!Array{pm.Level}}
 */
pm.prototype.getLevels = function() {
  return goog.array.map(this.model_[pm.PROPERTY_.LEVELS] || [], goog.object.clone);
};

/**
 * @param {!Array{pm.Level}} levels
 */
pm.prototype.setLevels = function(levels) {
  this.gameRef_().update({[pm.PROPERTY_.LEVELS]: levels});
};


/**
 * @return {boolean}
 */
pm.prototype.getEditable = function() {
  const uid = goog.asserts.assert(firebase.auth().currentUser.uid);
  return this.model_[pm.PROPERTY_.CREATOR] == uid 
      || !!this.model_[pm.PROPERTY_.COLABORATORS][uid]
};


/**
 * @param {!pm.Level} level
 */
pm.speculateNextLevel = function(level) {
  return {
    small: level.small * 2,
    big: level.big * 2,
    ante: level.ante * 2,
    levelTime: level.levelTime
  };
};


/**
 * @param {!Object} doc
 */
pm.prototype.valuesChanged_ = function(doc) {
  const oldModel = this.model_;
  this.model_ = doc.data();
  
  for (let property in pm.PROPERTY_TO_EVENT_) {
    const newValue = this.model_[property];
    const oldValue = oldModel[property];
    let valueChanged = false;
    if (goog.isArray(newValue)) {
      valueChanged = !goog.array.equals(newValue, oldValue);
    } else if (goog.isObject(newValue)) {
      valueChanged = !goog.object.equals(newValue, oldValue);
    } else {
      valueChanged = newValue !== oldValue;
    }
    if (property == pm.PROPERTY_.TIME_EVENTS && valueChanged) {
      for (let i = oldValue.length; i < newValue.length; ++i) {
        this.processTimeEvent_(newValue[i]);
      }
    }

    if (valueChanged) {
      const eventType = pm.PROPERTY_TO_EVENT_[property];
      if (eventType) {
        this.emitEventOnRootScope_(eventType, newValue);
      }
    }
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
 * @private
 */
pm.prototype.processTimeEvents_ = function() {
  const timeEvents = this.model_[pm.PROPERTY_.TIME_EVENTS] || [];

  for (let i = 0; i < timeEvents.length; ++i) {
    const timeEvent = /** type {pm.TimeEvent} */ timeEvents[i];
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
  this.pushTimeEvent_(() => {
    return {
      timestamp: this.timeService.getTime(),
      eventType: pm.TimeEventType.START
    };
  });
};


pm.prototype.pause = function() {
  this.pushTimeEvent_(() => {
    return {
      timestamp: this.timeService.getTime(),
      eventType: pm.TimeEventType.PAUSE
    };
  });
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
  
  this.pushTimeEvent_(() => {
    return {
      timestamp: this.timeService.getTime(),
      eventType: pm.TimeEventType.SET_TIME,
      value: newTime
    };
  });
};


/**
 * Pushes a time event to the model using transactions.
 * @param {!function():!pm.TimeEventType} eventCreator Creates the event to be pushed. May be called 
 *     multiple times if the transaction is retried.
 * @private
 */
pm.prototype.pushTimeEvent_ = function(eventCreator) {
  const docRef = this.gameRef_();
  firebase.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);

    const timeEvents = doc.data()[pm.PROPERTY_.TIME_EVENTS] || [];
    timeEvents.push(eventCreator());
    transaction.update(docRef, {[pm.PROPERTY_.TIME_EVENTS]: timeEvents});
  });
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