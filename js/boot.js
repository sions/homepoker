goog.provide('poker.boot');

goog.require('goog.Timer');
goog.require('poker.appdataservice');
goog.require('poker.modelservice');
goog.require('poker.permissionservice');
goog.require('poker.timeservice');



goog.scope(function() {


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
poker.boot.startApp = async function() {
  // TODO: Do auth.

  var timeService = new poker.timeservice();
  timeService.register();

  let modelService;
  if (!window.game_id) {  // Need to create a new game.
    const newGameId = await poker.modelservice.createNewGame();
    modelService = new poker.modelservice(newGameId);
    
    window.game_id = newGameId;
    window.history.replaceState(null, 'game', '/open/' + window.game_id)
  } 

  modelService = new poker.modelservice(window.game_id);
  await modelService.readInitialData();
  modelService.register();

  // TODO: Read initial game data.

  const permssionService = new poker.permissionservice(window.game_id);
  permssionService.register();

  const appdataservice = new poker.appdataservice();
  appdataservice.register();

  poker.boot.bootstrapAngular();
};

goog.exportSymbol('startApp', poker.boot.startApp);


poker.boot.bootstrapAngular = function() {
  console.log('bootstraping angular.');
  angular.bootstrap(document, 
      ['timeServiceModule', 
       'permissionServiceModule', 
       'modelServiceModule', 
       'appdataServiceModule', 
       'pokerControllers']);
};

});  // goog.scope