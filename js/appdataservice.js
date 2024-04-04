goog.provide('poker.appdataservice');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('poker.modelservice');

goog.scope(function() {

/**
 * @constructor
 */
poker.appdataservice = function() {
  this.uid_ = goog.asserts.assert(firebase.auth().currentUser.uid);
  this.schema_levels_ = {};
  this.schema_start_states_ = {};
  this.lastUsedSchema_ = '';
};


var pa = poker.appdataservice;
var ms = poker.modelservice;


/**
 * @enum {string}
 * @private
 */
pa.PROPERTY_ = {
  SCHEMAS: 'schemas',
  SCHEMA_START_STATES: 'schema_start_states',
  LAST_USED_SCHEMA: 'lastUsedSchema'
};


pa.prototype.register = function() {
  var service = angular.module('appdataServiceModule', []);
  var thisModel = this;
  service.factory('appdataService', ['$rootScope', function($rootScope) {
    thisModel.$rootScope = $rootScope;
    thisModel.userRef_().onSnapshot(goog.bind(thisModel.valuesChanged_, thisModel));
    return thisModel;
  }]);
};


pa.prototype.initialize = async function() {
  const doc = await this.userRef_().get();
  if (!doc.exists) {
    await this.userRef_().set({
      [pa.PROPERTY_.SCHEMAS]: {},
      [pa.PROPERTY_.SCHEMA_START_STATES]: {},
    });
    return;
  }

  this.schema_levels_ = doc.data()[pa.PROPERTY_.SCHEMAS];
  if (this.schema_levels_ === undefined) {
    this.schema_levels_ = {};
    await this.userRef_().set({
      [pa.PROPERTY_.SCHEMAS]: this.schema_levels_,
    });
  }
  this.schema_start_states_ = doc.data()[pa.PROPERTY_.SCHEMA_START_STATES];
  if (this.schema_start_states_ === undefined) {
    this.schema_start_states = {};
    await this.userRef_().set({
      [pa.PROPERTY_.SCHEMA_START_STATES]: this.schema_start_states,
    });
  }
  this.lastUsedSchema_ = doc.data()[pa.PROPERTY_.LAST_USED_SCHEMA];
};


/**
 * @private
 */
pa.prototype.userRef_ = function () {
 return firebase.firestore().collection('users').doc(this.uid_);
}


/**
 * @return {!Array{string}}
 */
pa.prototype.getSchemaNames = function() {
  const names = [];
  for (let schemaName in this.schema_levels_) {
    names.push(schemaName);
  }
  goog.array.sort(names);
  return names;
};


/**
 * @param {string} name
 * @return {!Schema}
 */
pa.prototype.getSchema = function(name) {
  return {
    levels: this.schema_levels_[name],
    startingState: this.schema_start_states_[name] ?? {}
  };
};


/**
 * @param {string} name
 * @param {!Schema} schema
 */
pa.prototype.setSchema = function(name, schema) {
  const newSchemaLevels = goog.object.clone(this.schema_levels_);
  newSchemaLevels[name] = schema.levels;
  this.userRef_().update({[pa.PROPERTY_.SCHEMAS]: newSchemaLevels});
  const newSchemaStartState = goog.object.clone(this.schema_start_states_);
  newSchemaStartState[name] = schema.startingState;
  this.userRef_().update({[pa.PROPERTY_.SCHEMA_START_STATES]: newSchemaStartState});
};


/**
 * @param {string} name
 */
pa.prototype.deleteSchema = function(name) {
  const newSchemas = goog.object.clone(this.schema_levels_);
  delete newSchemas[name];
  this.userRef_().update({[pa.PROPERTY_.SCHEMAS]: newSchemas});
  const newSchemasStartingStates = goog.object.clone(this.schema_start_states_);
  delete newSchemasStartingStates[name];
  this.userRef_().update({[pa.PROPERTY_.SCHEMA_START_STATES]: newSchemasStartingStates});
};


/**
 * @param {string} name
 */
pa.prototype.valuesChanged_ = function(doc) {
  this.schema_levels_ = doc.data()[pa.PROPERTY_.SCHEMAS];
  this.schema_start_states_ = doc.data()[pa.PROPERTY_.SCHEMA_START_STATES];
  this.lastUsedSchema_ = doc.data()[pa.PROPERTY_.LAST_USED_SCHEMA];
};

/**
 * @param {string} schema
 */
pa.prototype.setLastUsedSchema = function(schema) {
  this.userRef_().update({
      [pa.PROPERTY_.LAST_USED_SCHEMA]: schema,
    });
};

/**
 * @return {string}
 */
pa.prototype.getLastUsedSchema = function(schema) {
  return this.lastUsedSchema_;
};

});  // goog.scope
