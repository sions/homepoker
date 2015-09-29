goog.provide('poker.boot');

goog.require('goog.Timer');


goog.scope(function() {

// TODO: Use different keys for production and development.
var CLIENT_ID = '1026721110899-6t5r7pu7hdn49rtaoioe6tkn2inq8l2r.apps.googleusercontent.com';
var SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appfolder',
  'https://www.googleapis.com/auth/drive.install',
  'email',
  'profile'
  // Add other scopes needed by your application.
];


var initState = {
  gapiLoaded: false,
  authorized: false,
  apiJsLoaded: false,
  driveLoaded: false,
  realtimeLoaded: false
};

/**
 * Called when the client library is loaded.
 */
poker.boot.handleClientLoad = function() {
  console.log('gapi loaded');
  initState.gapiLoaded = true;
  poker.boot.checkAuth_();
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
      {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
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
    goog.Timer.callOnce(poker.boot.checkAuth_, (timeToExpiration - 60) * 1000);
  } else {
    // No access token could be retrieved, force the authorization flow.
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false}, 
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
  if (!window.game_id) {  // Need to create a new game.
    var request = gapi.client.drive.files.insert({
      'uploadType': 'media',
      'title': 'poker game',
      'mimeType': 'custom/mime.type'
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
    poker.boot.openRealtimeModel_();
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
};


/**
 * @private
 */
poker.boot.documentLoaded_ = function(doc) {
  console.log('File loaded successfully.');
  var players = doc.getModel().getRoot().get('players');
  console.log('Players: ' + players);
  doc.getModel().getRoot().set('players', players + 1);
};


/**
 * @private
 */
poker.boot.initializeModel_ = function(model) {
  console.log('Initializing model.');
  model.getRoot().set('players', 5);
  console.log('Model initialized.');
};


/**
 * @private
 */
poker.boot.realtimeError_ = function(error) {
  alert('Error loading realtime model: ' + error.toString());
};

});  // goog.scope