(function() {
  var Assert, Asserts, Mongo, Type;

  Type = require('type-of-is');

  Assert = require('assert');

  Asserts = require('asserts');

  Mongo = require('../../');

  module.exports = {
    "derp": function() {
      return Assert.equal(1, 1);
    }
  };

}).call(this);
