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
  this.voiceId_ = '';
  this.soundActive = true;
};


var pa = poker.appdataservice;
var ms = poker.modelservice;

const VOICE_API_KEY = window.voice_api_key;


/**
 * @enum {string}
 * @private
 */
pa.PROPERTY_ = {
  SCHEMAS: 'schemas',
  SCHEMA_START_STATES: 'schema_start_states',
  LAST_USED_SCHEMA: 'lastUsedSchema',
  SOUND_ACTIVE: 'soundActive'
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
  const soundActive = doc.data()[pa.PROPERTY_.SOUND_ACTIVE];
  if (soundActive !== undefined) {
    this.soundActive = soundActive;
  }
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


/**
 * @return {boolean}
 */
pa.prototype.getSoundActive = function() {
  return this.soundActive;
}

pa.prototype.toggleSoundActive = function() {
  this.soundActive = !this.soundActive;
  this.userRef_().update({
    [pa.PROPERTY_.SOUND_ACTIVE]: this.soundActive,
  });
}

/**
 * @return {boolean}
 */
pa.prototype.textToSpeechAvailable = function() {
  return Boolean(VOICE_API_KEY);
}

/**
 * @return {string} Data URL for the speech
 */
pa.prototype.textToSpeech = async function(text) {
  if (!this.voiceId_) {
    this.voiceId_ = await this.fetchVoiceId_();
  }
  const data = {
    'text': text,
    'model_id': 'eleven_multilingual_v2',
    'voice_settings': {
        'stability': 0.6,
        'similarity_boost': 0.9,
        'style': 0.0,
        'use_speaker_boost': true
    }
  }
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId_}/stream`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'xi-api-key': VOICE_API_KEY,
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
  const blobData = await response.blob();
  return URL.createObjectURL(blobData);
};

/**
 * @return {string} Data URL for the speec
 */
pa.prototype.fetchVoiceId_ = async function() {
   const response = await fetch('https://api.elevenlabs.io/v1/voices',
      {'headers':
        {
          'Accept': 'application/json',
          'xi-api-key': VOICE_API_KEY,
          'Content-Type': 'application/json'}
        });
  const voices = await response.json();
  this.voiceId_ = voices['voices'].filter(v => v.name === 'Tony - King of New York')[0]['voice_id'];
  return this.voiceId_;
};

});  // goog.scope
