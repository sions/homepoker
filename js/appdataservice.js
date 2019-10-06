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
  this.schemas_ = {};
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
      [pa.PROPERTY_.SCHEMAS]: [],
    });
    return;
  }

  this.schemas_ = doc.data()[pa.PROPERTY_.SCHEMAS];
  this.lastUsedSchema_ = doc.data()[pa.PROPERTY_.LAST_USED_SCHEMA];
};


/**
 * @private
 */
pa.prototype.userRef_ = function () {
 return firebase.firestore().collection('games').doc(this.uid_);
}


/**
 * @return {!Object.<string, !Array<ms.Level>>}
 * @private
 */
pa.prototype.getSchemas_ = function() {
  return this.schemas_;
};


/**
 * @return {!Array{string}}
 */
pa.prototype.getSchemaNames = function() {
  const names = [];
  for (let schemaName in this.schemas_) {
    names.push(schemaName); 
  }
  goog.array.sort(names);
  return names;
};


/**
 * @param {string} name
 * @return {!Array<ms.Level>}
 */
pa.prototype.getSchema = function(name) {
  return this.schemas_[name];
};


/**
 * @param {string} name
 * @param {!Array<ms.Level>}
 */
pa.prototype.setSchema = function(name, levels) {
  const newSchemas = goog.object.clone(this.schemas_);
  newSchemas[name] = levels;
  this.userRef_().update({[pa.PROPERTY_.SCHEMAS]: newSchemas});
};


/**
 * @param {string} name
 */
pa.prototype.deleteSchema = function(name) {
  const newSchemas = goog.object.clone(this.schemas_);
  delete newSchemas[name];
  this.userRef_().update({[pa.PROPERTY_.SCHEMAS]: newSchemas});
};


/**
 * @param {string} name
 */
pa.prototype.valuesChanged_ = function(doc) {
  this.schemas_ = doc.data()[pa.PROPERTY_.SCHEMAS];
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
