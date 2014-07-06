(function() {
  var MongoDB;

  MongoDB = require('mongodb');

  module.exports = {
    Schema: require('./Schema'),
    Model: require('./Model'),
    EmbeddedModel: require('./EmbeddedModel'),
    ObjectID: MongoDB.ObjectID,
    haveYouSeenMyBaseball: function() {
      return false;
    }
  };

}).call(this);
