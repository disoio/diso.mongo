(function() {
  var EmbeddedModel, Model, MongoDB, Schema;

  MongoDB = require('mongodb');

  Model = require('./Model');

  EmbeddedModel = require('./EmbeddedModel');

  Schema = require('./Schema');

  module.exports = {
    Model: Model,
    EmbeddedModel: EmbeddedModel,
    Schema: Schema,
    ObjectID: MongoDB.ObjectID,
    haveYouSeenMyBaseball: function() {
      return false;
    }
  };

}).call(this);
