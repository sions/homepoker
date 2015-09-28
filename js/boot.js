

var CLIENT_ID = '1026721110899-6t5r7pu7hdn49rtaoioe6tkn2inq8l2r.apps.googleusercontent.com';
var SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'email',
  'profile',
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
function handleClientLoad() {
  console.log('gapi loaded');
  initState.gapiLoaded = true;
  checkAuth();
};


/**
 * Check if the current user has authorized the application.
 */
function checkAuth() {
  gapi.auth.authorize(
      {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
      handleAuthResult);
};

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    // Access token has been successfully retrieved, requests can be sent to the API
    initState.authorized = true;
    handleAuthenticationDone();
  } else {
    // No access token could be retrieved, force the authorization flow.
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
        handleAuthResult);
  }
};


function handleAuthenticationDone() {
  console.log('Authentication done.');
  initState.authorized = true;
  gapi.client.load('drive', 'v2', handleDriveLoaded);
  loadRealtimeIfReady();
};


function handleApiLoad() {
  console.log('api.js loaded');
  initState.apiJsLoaded = true;
  loadRealtimeIfReady();
};


function loadRealtimeIfReady() {
  if (initState.authorized && initState.apiJsLoaded) {
    gapi.load('auth:client,drive-realtime,drive-share', handleRealtimeLoaded)
  }
}

function handleDriveLoaded() {
  console.log('Drive loaded.');
  initState.driveLoaded = true;
  beginAppIfReady();
}

function handleRealtimeLoaded() {
  console.log('Realtime loaded.');
  initState.realtimeLoaded = true;
  beginAppIfReady();
}


function beginAppIfReady() {
  for (var stage in initState) {
    if (!initState[stage]) {
      return;
    }
  }

  console.log('App is ready to begin.');
}