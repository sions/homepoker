goog.provide('poker.boot');

goog.require('goog.Timer');
goog.require('poker.appdataservice');
goog.require('poker.modelservice');
goog.require('poker.permissionservice');
goog.require('poker.timeservice');



goog.scope(function() {

var SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.appfolder',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'email',
  'profile'
];


var initState = {
  gapiLoaded: false,
  authorized: false,
  apiJsLoaded: false,
  driveLoaded: false,
  realtimeLoaded: false
};

var realtimeState = {
  documentLoaded: false,
  appdataLoaded: false
};

/**
 * Called when the client library is loaded.
 */
poker.boot.handleClientLoad = function() {
  console.log('gapi loaded');
  initState.gapiLoaded = true;
  poker.boot.checkAuth_();
  var timeService = new poker.timeservice();
  timeService.register();
};

goog.exportSymbol('handleClientLoad', poker.boot.handleClientLoad);


/**
 * Called when api.js is loaded.
 */
poker.boot.handleApiLoad = function() {
  console.log('api.js loaded');
  initState.apiJsLoaded = true;
  poker.boot.loadRealtimeIfReady_();
};

goog.exportSymbol('handleApiLoad', poker.boot.handleApiLoad);

/**
 * Check if the current user has authorized the application.
 * @private
 */
poker.boot.checkAuth_ = function() {
  gapi.auth.authorize(
      {'client_id': window.client_id, 'scope': SCOPES, 'immediate': true},
      poker.boot.handleAuthResult_);
};

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 * @private
 */
poker.boot.handleAuthResult_ = function(authResult) {
  if (authResult && !authResult.error) {
    // Access token has been successfully retrieved, requests can be sent to the API
    poker.boot.handleAuthenticationDone_();

    var timeToExpiration = parseInt(authResult.expires_in);
    if (poker.boot.timerId_) {
      goog.Timer.clear(poker.boot.timerId_);
      poker.boot.timerId_ = null;
    }
    poker.boot.timerId_ = 
        goog.Timer.callOnce(poker.boot.checkAuth_, (timeToExpiration - 60) * 1000);
  } else {
    // No access token could be retrieved, force the authorization flow.
    gapi.auth.authorize(
        {'client_id': window.client_id, 'scope': SCOPES, 'immediate': false}, 
        poker.boot.handleAuthResult_);
  }
};


/**
 * Called when authentication is done.
 * @private
 */
poker.boot.handleAuthenticationDone_ = function() {
  if (initState.authorized) {
    console.log('Authentication refersh done.');
    return;  // Already done with authentication. This means this was a referesh.
  }

  console.log('Authentication done.');
  initState.authorized = true;
  gapi.client.load('drive', 'v2', poker.boot.handleDriveLoaded_);
  poker.boot.loadRealtimeIfReady_();
};


/**
 * @private
 */
poker.boot.loadRealtimeIfReady_ = function() {
  if (initState.authorized && initState.apiJsLoaded) {
    gapi.load('auth:client,drive-realtime,drive-share', poker.boot.handleRealtimeLoaded_);
  }
};


/**
 * @private
 */
poker.boot.handleDriveLoaded_ = function() {
  console.log('Drive loaded.');
  initState.driveLoaded = true;
  poker.boot.beginAppIfReady_();
};


/**
 * @private
 */
poker.boot.handleRealtimeLoaded_ = function() {
  console.log('Realtime loaded.');
  initState.realtimeLoaded = true;
  poker.boot.beginAppIfReady_();
};


/**
 * @private
 */
poker.boot.beginAppIfReady_ = function() {
  for (var stage in initState) {
    if (!initState[stage]) {
      return;
    }
  }

  console.log('App is ready to begin.');

  poker.boot.openRealtimeApplicationData_();
  if (!window.game_id) {  // Need to create a new game.
    var request = gapi.client.drive.files.insert({
      'title': 'poker game',
      'mimeType': 'application/vnd.google-apps.drive-sdk'
    });
    request.execute(poker.boot.fileCreated_);
  } else {  // Need to open existing game.
    poker.boot.openRealtimeModel_();
  }
};


/**
 * @private
 */
poker.boot.fileCreated_ = function(response) {
  if (response.id) {
    console.log('File created.');
    window.game_id = response.id;
    window.history.replaceState(null, 'game', '/open/' + window.game_id)

    // Share with anyone with the link.
    var req = gapi.client.drive.permissions.insert({
      'fileId': window.game_id, 
      'resource': {'role': 'reader', 'type': 'anyone', 'withLink': true}
    });
    req.then(poker.boot.openRealtimeModel_());
  } else {
    alert('Could not create file, please reload.')
  }
};


/**
 * @private
 */
poker.boot.openRealtimeModel_ = function() {
  gapi.drive.realtime.load(
      window.game_id, 
      poker.boot.documentLoaded_, 
      poker.boot.initializeModel_, 
      poker.boot.realtimeError_);
  var permssionService = new poker.permissionservice(window.game_id);
  permssionService.register();
};


/**
 * @private
 */
poker.boot.openRealtimeApplicationData_ = function() {
  gapi.drive.realtime.loadAppDataDocument(
    poker.boot.appdataDocumentLoaded_,
    poker.boot.initializeAppdataModel_,
    poker.boot.realtimeError_
  );
};


/**
 * @private
 */
poker.boot.documentLoaded_ = function(doc) {
  console.log('File loaded successfully.');
  var modelService = new poker.modelservice(doc.getModel());
  modelService.register();
  realtimeState.documentLoaded = true;
  poker.boot.tryBootstrapAngular();
};


/**
 * @private
 */
poker.boot.initializeModel_ = function(model) {
  console.log('Initializing model.');
  var modelService = new poker.modelservice(model);
  modelService.initialize();
  console.log('Model initialized.');
};


/**
 * @private
 */
poker.boot.appdataDocumentLoaded_ = function(doc) {
  console.log('Appdata loaded successfully.');
  var appdataService = new poker.appdataservice(doc.getModel());
  appdataService.register();
  realtimeState.appdataLoaded = true;
  poker.boot.tryBootstrapAngular();
};


/**
 * @private
 */
poker.boot.initializeAppdataModel_ = function(model) {
  console.log('Initializing appdata model.');
  var appdataService = new poker.appdataservice(model);
  appdataService.initialize();
  console.log('Appdata initialized.');
};


/**
 * @private
 */
poker.boot.realtimeError_ = function(error) {
  if (error.isFatal) {
    alert('Fatal realtime error: ' + error.toString() + ' Click OK to reload.');
    window.location.reload();
  }

  if (error.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
    poker.boot.checkAuth_();
  } else {
    console.log('Non fatal realtime error: ' + error.toString());
  }
};


poker.boot.tryBootstrapAngular = function() {
  for (var i in realtimeState) {
    if (!realtimeState[i]) {
      return;
    }
  }

  console.log('bootstraping angular.');
  angular.bootstrap(document, 
      ['timeServiceModule', 
       'permissionServiceModule', 
       'modelServiceModule', 
       'appdataServiceModule', 
       'pokerControllers']);
};

});  // goog.scope