(function() {
  var DataModel, EmbeddedModel,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  DataModel = require('./DataModel');

  EmbeddedModel = (function(_super) {
    __extends(EmbeddedModel, _super);

    function EmbeddedModel() {
      return EmbeddedModel.__super__.constructor.apply(this, arguments);
    }

    EmbeddedModel.strict = false;

    EmbeddedModel.add_id = false;

    return EmbeddedModel;

  })(DataModel);

  module.exports = EmbeddedModel;

}).call(this);
