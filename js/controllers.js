goog.provide('poker.controllers');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('poker.modelservice');
goog.require('poker.permissionservice');
goog.require('poker.timeservice');

goog.scope(function() {

var controllers = angular.module('pokerControllers', [])
    .filter('numberFixedLen', function() {
      return function(n, len) {
        var num = parseInt(n, 10);
        len = parseInt(len, 10);
        num_str = '' + num;
        return Array(len - num_str.length + 1).join('0') + num_str;
      };
    })
    .filter('round', function() {
      return function(n) {
        return Math.round(n);
      };
    })
    .directive('onEnterKey', function () {
      return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
          if(event.which === 13) {
            scope.$apply(function (){
                scope.$eval(attrs.onEnterKey);
            });

            event.preventDefault();
          }
        });
      };
    });
var modelEvent = poker.modelservice.EVENT;
var permissionEvent = poker.permissionservice.EVENT;
var timeEvent = poker.timeservice.EVENT;

/**
 * @const {string}
 */
var EVENTS = {
  IN_GAME_LEVEL_CHANGE: 'in-game-level-change',
  EDIT_STARTED: 'edit-started',
  EDIT_ENDED_CANCELLED: 'edit-ended-cancelled',
  EDIT_ENDED_SAVED: 'edit-ended-saved',
  LEVEL_UP: 'in-game-level-up'
};


/**
 * @const {number}
 * @private
 */
controllers.TIMER_UPDATE_PERIOD_MS_ = 250;


controllers.controller('StartPauseController', 
      ['$scope', '$rootScope', '$interval', '$element', 'modelService',
       function($scope, $rootScope, $interval, $element, modelService) {
  var toPauseElements = 
      [document.getElementById('toPause1'), document.getElementById('toPause2')];
  var toPlayElements = 
      [document.getElementById('toPlay1'), document.getElementById('toPlay2')];
  var svg = $element.find('svg')[0];

  var animate = function(element) {
    element.beginElement();
  };

  var updateRunningState = function() {
    var newRunning = modelService.isRunning();
    if (newRunning != $scope.running) {
      if ($scope.running) {
        goog.array.forEach(toPlayElements, animate);
        svg.removeAttribute('class');
      } else {
        goog.array.forEach(toPauseElements, animate);
        svg.setAttribute('class', 'paused');
      }

      $scope.running = newRunning;
    }
  };

  $scope.running = false;
  updateRunningState();
  $rootScope.$on(modelEvent.TIME_CHANGED, updateRunningState);

  $scope.toggle = function() {
    if ($scope.running) {
      modelService.pause();  
    } else {
      modelService.start();
    }
  };
}]);


controllers.controller('TimerController', 
      ['$scope', '$rootScope', '$interval', '$element', 'modelService', 
       function($scope, $rootScope, $interval, $element, modelService) {
  var updateGameState = function() {
    var levelState = modelService.getCurrentLevelState();
    var timeLeftInSeconds = Math.floor(levelState.timeLeftInLevel / 1000);
    $scope.running = modelService.isRunning();
    $scope.seconds = timeLeftInSeconds % 60;
    $scope.minutes = Math.floor(timeLeftInSeconds / 60);
    var oldLevel = $scope.levelIndex;
    $scope.levelIndex = levelState.levelIndex;
    if ($scope.levelIndex != oldLevel) {
      $rootScope.$emit(EVENTS.IN_GAME_LEVEL_CHANGE);
      if ($scope.levelIndex == oldLevel + 1) {
        $rootScope.$emit(EVENTS.LEVEL_UP);
      }
    }
  };

  $element.addClass('ng-hide');
  $rootScope.$on(timeEvent.FIRST_SERVER_TIME, function() {
    $element.removeClass('ng-hide');
    updateGameState();
    $rootScope.$on(modelEvent.TIME_CHANGED, updateGameState);
    $interval(updateGameState, controllers.TIMER_UPDATE_PERIOD_MS_);
  });

  var levelInputElement = angular.element(document.querySelector('.level input'));
  var minutesInputElement = angular.element(document.querySelector('.timer-text .input-minutes'));
  var secondsInputElement = angular.element(document.querySelector('.timer-text .input-seconds'));
  var addLeadingZeroIfNeeded = function(value) {
    value = parseInt(value);
    return value < 10 ? '0' + value : value;
  };

  var setInputMax = function(element, maxValue) {
    element.attr('max', maxValue);
    if (parseInt(element.val()) > maxValue) {
      element.val(addLeadingZeroIfNeeded(maxValue));
    }
  };
  var setSecondsMax = function() {
    var maxSeconds = 
        Math.min(parseInt($scope.secondsInLevel) - (minutesInputElement.val() * 60), 60);
    setInputMax(secondsInputElement, maxSeconds);
  };
  $scope.levelInputChanged = function() {
    controllers.validateNumberInput(levelInputElement);
    var levelIndex = levelInputElement.val() - 1;
    var currentLevel = $scope.allLevels[levelIndex];
    if (currentLevel) {
      var timeLeft = (minutesInputElement.val() * 60) + parseInt(secondsInputElement.val());
      $scope.secondsInLevel = Math.floor(currentLevel.levelTime / 1000);
      setInputMax(minutesInputElement, Math.floor($scope.secondsInLevel / 60));
      setSecondsMax();
    }
  };

  $scope.minutesInputChanged = function() {
    controllers.validateNumberInput(minutesInputElement);
    setSecondsMax();
    minutesInputElement.val(addLeadingZeroIfNeeded(minutesInputElement.val()));
  };

  $scope.secondsInputChanged = function() {
    controllers.validateNumberInput(secondsInputElement);
    secondsInputElement.val(addLeadingZeroIfNeeded(secondsInputElement.val()));
  };

  $rootScope.$on(EVENTS.EDIT_STARTED, function() {
    $scope.allLevels = modelService.getLevels();
    levelInputElement.attr('max', $scope.allLevels.length)
    levelInputElement.val($scope.levelIndex + 1);

    minutesInputElement.val(addLeadingZeroIfNeeded($scope.minutes));
    secondsInputElement.val(addLeadingZeroIfNeeded($scope.seconds));
    $scope.levelInputChanged();
  });

  $rootScope.$on(EVENTS.EDIT_ENDED_SAVED, function(eventName) {
    modelService.setGameTime(
      parseInt(levelInputElement.val()) - 1, 
      (parseInt(minutesInputElement.val()) * 60 + parseInt(secondsInputElement.val())) * 1000);
  });

  controllers.setupLevelUpAnimation(
      angular.element(document.querySelector('.level-span')), $rootScope);
}]);


controllers.controller('PlayerController', 
    ['$scope', '$rootScope', 'modelService', 
     function($scope, $rootScope, modelService) {
  var updateAverage = function() {
    $scope.averageChips = $scope.players > 0 ? modelService.getStartingChips() / $scope.players : 0;
  };

  $scope.players = modelService.getPlayers();
  $scope.playersStarted = modelService.getPlayersStarted();
  $scope.startingChips = modelService.getStartingChips();

  $scope.averageChips = function() {
    return $scope.players > 0 ? 
        modelService.getStartingChips() * $scope.playersStarted / $scope.players : 0;
  };
  
  $rootScope.$on(modelEvent.PLAYERS_CHANGED, function(eventName, event) {
    $scope.players = event.newValue;
  });

  $rootScope.$on(modelEvent.PLAYERS_STARTED_CHANGED, function(eventName, event) {
    $scope.playersStarted = event.newValue;
  });

  $rootScope.$on(modelEvent.STARTING_CHIPS_CHANGED, function(eventName, event) {
    $scope.startingChips = event.newValue;
  });

  var playersInput = angular.element(document.querySelector('.players-field input'));
  var playersStartedInput = angular.element(document.querySelector('.players-started-field input'));
  var startingChipsInput = angular.element(document.querySelector('.starting-chips input'));

  $scope.playersInputChanged = function() {
    controllers.validateNumberInput(playersInput);
    var newValue = parseInt(playersInput.val());
    if (newValue > parseInt(playersStartedInput.val())) {
      playersInput.val(playersStartedInput.val());
    }
  };

  $scope.playersStartedInputChanged = function() {
    controllers.validateNumberInput(playersStartedInput);
    var newValue = parseInt(playersStartedInput.val());
    if (newValue < parseInt(playersInput.val())) {
      playersInput.val(newValue);
    }
    playersInput.attr('max', newValue);
  };

  $rootScope.$on(EVENTS.EDIT_STARTED, function() {
    playersInput.val($scope.players);
    playersInput.attr('max', $scope.playersStarted);
    playersStartedInput.val($scope.playersStarted);
    startingChipsInput.val(modelService.getStartingChips());
  });

  $rootScope.$on(EVENTS.EDIT_ENDED_SAVED, function(eventName) {
    modelService.setPlayers(playersInput.val());
    modelService.setPlayersStarted(playersStartedInput.val());
    modelService.setStartingChips(startingChipsInput.val());
  });

  $scope.manDown = function() {
    if ($scope.players > 0) {
      modelService.setPlayers($scope.players - 1);
    }
  };
}]);


controllers.controller('BlindController', 
      ['$scope', '$rootScope', '$element', 'modelService', 
       function($scope, $rootScope, $element, modelService) {
  $scope.small = 0;
  $scope.big = 0;
  $scope.ante = 0;
  $scope.nextSmall = 0;
  $scope.nextBig = 0;
  $scope.nextAnte = 0;
  var updateLevels = function() {
    var levelState = modelService.getCurrentLevelState();
    $scope.small = levelState.current.small;
    $scope.big = levelState.current.big;
    $scope.ante = levelState.current.ante;
    if (levelState.next != null) {
      $scope.nextSmall = levelState.next.small;
      $scope.nextBig = levelState.next.big;
      $scope.nextAnte = levelState.next.ante;
    } else {
      $scope.nextSmall = 0;
      $scope.nextBig = 0;
      $scope.nextAnte = 0;
    }
  };

  $rootScope.$on(EVENTS.IN_GAME_LEVEL_CHANGE, updateLevels);
  $rootScope.$on(modelEvent.LEVELS_CHANGED, updateLevels);

  controllers.setupLevelUpAnimation(
      angular.element(document.querySelector('.blinds .current')), $rootScope);
}]);


controllers.controller('EditBlindController', 
      ['$scope', '$rootScope', '$element', 'modelService', 'appdataService',
       function($scope, $rootScope, $element, modelService, appdataService) {
  $scope.levels = [];
  $scope.loadedLevels = [];
  $scope.saving = false;
  $scope.loading = false;

  $scope.getLevels = function() {
    return $scope.loading && !goog.array.isEmpty($scope.loadedLevels) ? 
        $scope.loadedLevels : $scope.levels;
  }
  $scope.remove = function(index) {
    goog.array.removeAt($scope.levels, index);
  };
  $scope.add = function() {
    var newLevel = poker.modelservice.DEFAULT_FIRST_LEVEL;
    if ($scope.levels.length > 0) {
      var lastLevel = $scope.levels[$scope.levels.length - 1];
      newLevel = poker.modelservice.speculateNextLevel(lastLevel);
    } 
    $scope.levels.push(newLevel);
  };
  var favoritesInputElement = document.querySelector('.favorites-input');
  var schemaNameInput = document.querySelector('#schema-name-input');
  var schemaLoadInput = document.querySelector('#schema-load-input');
  $scope.toggleSaving = function(value) {
    $scope.saving = value;
    if ($scope.saving) {
      $scope.schemaName_ = '';
    }
  };
  $scope.toggleLoading = function(value) {
    $scope.loading = value;
  };
  goog.events.listen(favoritesInputElement, goog.events.EventType.TRANSITIONEND, function(e) {
    if (e.target === favoritesInputElement) {
      if ($scope.saving) {
        schemaNameInput.focus();
      } else if ($scope.loading) {
        schemaLoadInput.focus();
      }
    }
  });
  $scope.ok = function() {
    if ($scope.saving) {
      if ($scope.schemaName_) {
        appdataService.setSchema($scope.schemaName_, $scope.levels);
        $scope.schemaName_ = '';
      }
      $scope.toggleSaving(false);
    } else if ($scope.loading) {
      $scope.levels = goog.array.clone($scope.loadedLevels);
      $scope.toggleLoading(false);
    }
  };
  $scope.cancel = function() {
    $scope.toggleSaving(false);
    $scope.toggleLoading(false);
  };
  $scope.trash = function() {
    if ($scope.schemaToLoad_) {
      var deleteSchema = window.confirm('Delete schema ' + $scope.schemaToLoad_ + '?');
      if (deleteSchema) {
        appdataService.deleteSchema($scope.schemaToLoad_);
        $scope.schemaToLoad_ = '';
      }
    }
    $scope.toggleLoading(false);
  };
  $scope.schemaInputValid = function() {
    return schemaNameInput.classList.contains('ng-valid');
  };
  $scope.schemaNames = function() {
    return appdataService.getSchemaNames();
  };
  $scope.loadedSchemaChanged = function() {
    $scope.loadedLevels = $scope.schemaToLoad_ ? 
        appdataService.getSchema($scope.schemaToLoad_) : [];
  };

  var copyValueFromItem = function(inputlement) {
    var field = inputlement.parent()[0].getElementsByClassName('field')[0];
    inputlement.val(field.innerText);
  };

  $scope.onItemMouseOver = function($event) {
    copyValueFromItem(angular.element($event.currentTarget).find('input'))
  };

  $scope.onInputFocus = function($event) {
    $scope.currentInput = angular.element($event.target);
    copyValueFromItem($scope.currentInput)
  };

  $scope.smallChanged = function($event, index) {
    var value = parseInt($scope.currentInput.val());
    $scope.levels[index].small = value;
  };
  $scope.bigChanged = function($event, index) {
    var value = parseInt($scope.currentInput.val());
    $scope.levels[index].big = value;
  };
  $scope.anteChanged = function($event, index) {
    var value = parseInt($scope.currentInput.val());
    $scope.levels[index].ante = value;
  };
  $scope.minutesChanged = function($event, index) {
    var value = parseInt($scope.currentInput.val());
    var levelSeconds = Math.floor($scope.levels[index].levelTime / 1000);
    $scope.levels[index].levelTime = (value * 60 + (levelSeconds % 60)) * 1000;
  };

  $scope.secondsChanged = function($event, index) {
    var value = parseInt($scope.currentInput.val());
    var levelSeconds = Math.floor($scope.levels[index].levelTime / 1000);
    $scope.levels[index].levelTime = (Math.floor(levelSeconds / 60) * 60 + value) * 1000;
  };

  $rootScope.$on(modelEvent.LEVELS_CHANGED, function(eventName, newValue) {
    $scope.levels = goog.array.map(newValue, goog.object.clone);
  });

  $rootScope.$on(EVENTS.EDIT_STARTED, function() {
    $scope.levels = modelService.getLevels();
    $scope.saving = false;
    $scope.loading = false;
    $scope.schemaName_ = '';
    $scope.schemaToLoad_ = '';
    $scope.loadedLevels = [];
  });

  $rootScope.$on(EVENTS.EDIT_ENDED_SAVED, function(eventName) {
    modelService.setLevels($scope.levels);
  });
}]);


controllers.controller('EditButtonController', 
    ['$scope', '$rootScope', '$element', 'permissionService', 
     function($scope, $rootScope, $element, permissionService) {
  $scope.editing = false;
  var canvas = angular.element(document.getElementById('canvas'));

  var updateEditState = function() {
    $element.toggleClass('ng-hide', !permissionService.getEditable());
    canvas.toggleClass('has-edit-permission', permissionService.getEditable())
  }

  updateEditState();
  $rootScope.$on(permissionEvent.EDITABLE_UPDATED, updateEditState);

  $scope.toggleEditing_ = function(active, opt_saveChanges) {
    $scope.editing = active;
    canvas.toggleClass('editing', active);
    if (active) {
      $rootScope.$emit(EVENTS.EDIT_STARTED);
    } else if (opt_saveChanges) {
      $rootScope.$emit(EVENTS.EDIT_ENDED_SAVED);
    } else {
      $rootScope.$emit(EVENTS.EDIT_ENDED_CANCELLED);
    };
  };

  $scope.edit = function() {
    $scope.toggleEditing_(true);
  };

  $scope.ok = function() {
    $scope.toggleEditing_(false, true);
  };

  $scope.cancel = function() {
    $scope.toggleEditing_(false, false);
  };
}]);


controllers.controller('ShareLinkController', 
    ['$scope', '$element', '$rootScope', 'permissionService', 
     function($scope, $element, $rootScope, permissionService) {
  $scope.link = '';
  var updateLink = function() {
    var children = $element.children();
    if (children.length > 1) {
      children[children.length - 1].remove();
    }
    $scope.link = window.location.href;
    if ($scope.link) {
      var newElement = document.createElement('span');
      var qrcode = new QRCode(newElement, {
        text: $scope.link,
        width: 128,
        height: 128
      });
      $element.append(newElement);
    }
  };
  updateLink();
  $rootScope.$on(permissionEvent.EDITABLE_UPDATED, updateLink);
}]);


controllers.controller('LevelUpAudioController', 
      ['$rootScope', '$element', function($rootScope, $element) {
  $rootScope.$on(EVENTS.LEVEL_UP, function() {
    $element[0].play();
  });
}]);


controllers.controller('ShareButtonController', ['$scope', function($scope) {
  var client = new gapi.drive.share.ShareClient(window.client_id);
  client.setItemIds([window.game_id])
  $scope.share = function() {
    client.showSettingsDialog();
  };
}]);


/**
 * @param {Object} element angular.element object.
 */
controllers.validateNumberInput = function(element) {
  var value = element.val();
  var newValue = value;
  var min = parseInt(element.attr('min')) || 0;
  var max = parseInt(element.attr('max')) || Infinity;

  newValue = value ? Math.max(min, Math.min(max, parseInt(value))) : min;
  if (newValue != value) {
    element.val(newValue);
  }
};


/**
 * @param {Object} element angular.element object.
 */
controllers.setupLevelUpAnimation = function(element, $rootScope) {
  goog.events.listen(element[0], goog.events.EventType.ANIMATIONEND, function() {
    element.removeClass('animate');
  });
  $rootScope.$on(EVENTS.LEVEL_UP, function() {
    element.addClass('animate');
  });
};


goog.exportSymbol('controllers', controllers);

});  // goog.scope