goog.provide('poker.boot');

goog.require('goog.Timer');
goog.require('poker.appdataservice');
goog.require('poker.modelservice');
goog.require('poker.timeservice');


goog.scope(function() {


/**
 * Called when the client library is loaded.
 */
poker.boot.startApp = async function() {
  const authResult = await firebase.auth().getRedirectResult();
  if (!authResult.user && !firebase.auth().currentUser) {
    console.info('User not logged in. Signing with redirect.')
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    return;
  }

  console.info('User signed in (uid=%s, email=%s)', firebase.auth().currentUser.uid,
      firebase.auth().currentUser.email);

  const timeService = new poker.timeservice();
  timeService.register();

  const appdataservice = new poker.appdataservice();
  await appdataservice.initialize();
  appdataservice.register();

  let schema = undefined;
  const lastUsedSchema = appdataservice.getLastUsedSchema();
  if (lastUsedSchema) {
    schema = appdataservice.getSchema(lastUsedSchema);
  }

  let modelService;
  if (!window.game_id) {  // Need to create a new game.
    const newGameId = await poker.modelservice.createNewGame(schema);
    modelService = new poker.modelservice(newGameId);

    window.game_id = newGameId;
    window.history.replaceState(null, 'game', '/open/' + window.game_id)
  }

  modelService = new poker.modelservice(window.game_id);
  await modelService.readInitialData();
  modelService.register();

  poker.boot.bootstrapAngular();
};

goog.exportSymbol('startApp', poker.boot.startApp);


poker.boot.bootstrapAngular = function() {
  console.log('bootstraping angular.');
  angular.bootstrap(document,
      ['timeServiceModule',
       'modelServiceModule',
       'appdataServiceModule',
       'pokerControllers']);
};

});  // goog.scope