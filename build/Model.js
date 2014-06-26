(function() {
  var DataModel, Model, MongoDB, MongoJS, Type, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MongoDB = require('mongodb');

  MongoJS = require('mongojs');

  Type = require('type-of-is');

  DataModel = require('./DataModel');

  utils = require('./utils');

  Model = (function(_super) {
    __extends(Model, _super);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.db_url = null;

    Model.strict = false;

    Model.add_id = true;

    Model.collection = function(name) {
      var collection_name, db, _ref;
      collection_name = name ? name : (_ref = this.collection_name) != null ? _ref : utils.underscorize(this.name);
      db = MongoJS(this.db_url);
      return db.collection(collection_name);
    };

    Model.find = function(options) {
      var id;
      if ('id' in options) {
        id = options.id;
        if (Type(id, String)) {
          id = new MongoDB.ObjectID(id);
        }
        options.query = {
          _id: id
        };
      }
      options.method = 'find';
      return this._findHelper(options);
    };

    Model.findOne = function(options) {
      options.method = 'findOne';
      return this._findHelper(options);
    };

    Model._findHelper = function(options) {
      var callback, method, projection, query, _Model;
      _Model = this;
      method = options.method;
      query = options.query;
      callback = options.callback;
      projection = options.projection || {};
      return this.collection()[method](query, projection, function(error, result) {
        var doc, models;
        if (error) {
          return callback(error, null);
        }
        models = (function() {
          var _i, _len, _results;
          if (Type(result, Array)) {
            _results = [];
            for (_i = 0, _len = result.length; _i < _len; _i++) {
              doc = result[_i];
              _results.push(new _Model(doc));
            }
            return _results;
          } else {
            if (result) {
              return new _Model(result);
            } else {
              return null;
            }
          }
        })();
        return callback(null, models);
      });
    };

    Model.count = function(query, callback) {
      if (arguments.length === 1) {
        callback = query;
        query = null;
      }
      return this.collection().count(query, callback);
    };

    Model.update = function(options) {
      var callback, query, update;
      query = options.query;
      update = options.update;
      callback = options.callback;
      options = options.options || {};
      return this.collection().update(query, update, options, callback);
    };

    Model.prototype.save = function(callback) {
      var collection, data, error, _this;
      if (this.beforeSave) {
        this.beforeSave();
      }
      error = this.validate();
      if (error) {
        return process.nextTick(function() {
          return callback(error, null);
        });
      }
      _this = this;
      data = this.toJSON();
      collection = this.constructor.collection();
      return collection.save(data, function(error, document) {
        if (document && !error) {
          _this._data._id = document._id;
          if (_this.afterSave) {
            _this.afterSave();
          }
        }
        return callback(error);
      });
    };

    Model.prototype.remove = function(callback) {
      var _this;
      _this = this;
      return this.collection(function(error, collection) {
        var selector;
        if (error) {
          return callback(error, null);
        }
        if (_this.beforeRemove) {
          _this.beforeRemove();
        }
        selector = {
          _id: _this._data._id
        };
        return collection.remove(selector, {
          safe: true
        }, function(error, num_removed) {
          if (!error && _this.afterRemove) {
            _this.afterRemove();
          }
          return callback(error, num_removed);
        });
      });
    };

    return Model;

  })(DataModel);

  module.exports = Model;

}).call(this);
