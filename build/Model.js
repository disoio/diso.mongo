(function() {
  var BaseModel, DataModel, Model, MongoDB, MongoJS, Schema, Type, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MongoDB = require('mongodb');

  MongoJS = require('mongojs');

  Type = require('type-of-is');

  BaseModel = require('./BaseModel');

  DataModel = require('./DataModel');

  Schema = require('./Schema');

  utils = require('./utils');

  Model = (function(_super) {
    __extends(Model, _super);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.db_url = null;

    Model.collection_name = null;

    Model._collection = null;

    Model.schema = function(schema) {
      if (!('_id' in schema)) {
        schema._id = Schema.ObjectID;
      }
      return Model.__super__.constructor.schema.call(this, schema);
    };

    Model.collection = function() {
      var collection_name, db, _ref;
      if (!this._collection) {
        collection_name = (_ref = this.collection_name) != null ? _ref : utils.underscorize(this.name);
        db = MongoJS(this.db_url);
        this._collection = db.collection(collection_name);
      }
      return this._collection;
    };

    Model.find = function(opts) {
      var id;
      if ('id' in opts) {
        id = opts.id;
        delete opts.id;
        if (Type(id, String)) {
          id = new MongoDB.ObjectID(id);
        }
        opts.query = {
          _id: id
        };
      }
      opts.method = 'find';
      return this._findHelper(opts);
    };

    Model.findOne = function(opts) {
      opts.method = 'findOne';
      return this._findHelper(opts);
    };

    Model._findHelper = function(opts) {
      var callback, method, projection, query, _Model;
      _Model = this;
      method = opts.method;
      query = opts.query;
      callback = opts.callback;
      projection = opts.projection || {};
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

    Model.findAndModify = function(opts) {
      var callback;
      callback = opts.callback;
      delete opts.callback;
      return this.collection().findAndModify(opts, (function(_this) {
        return function(error, doc, last_error) {
          var model;
          if (error) {
            return callback(error, null);
          } else {
            model = doc ? new _this(doc) : null;
            return callback(null, model);
          }
        };
      })(this));
    };

    Model.count = function(opts) {
      return this.collection().count(opts.query || {}, opts.callback);
    };

    Model.update = function(opts) {
      var callback, options, query, update;
      query = opts.query;
      update = opts.update;
      callback = opts.callback;
      options = opts.options || {};
      return this.collection().update(query, update, options, callback);
    };

    Model.makeOneOrMany = function(objs) {
      var is_array, models, obj, _i, _len;
      is_array = Type(objs, Array);
      if (!is_array) {
        objs = [objs];
      }
      models = [];
      for (_i = 0, _len = objs.length; _i < _len; _i++) {
        obj = objs[_i];
        if (!Type.instance(obj, BaseModel)) {
          obj = new this(obj);
        }
        models.push(obj);
      }
      if (is_array) {
        return models;
      } else {
        return models[0];
      }
    };

    Model.insert = function(opts) {
      var data, m, models;
      models = this.makeOneOrMany(opts.data);
      data = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          m = models[_i];
          _results.push(m.data());
        }
        return _results;
      })();
      return this.collection().insert(data, (function(_this) {
        return function(error, docs) {
          var result;
          result = null;
          if (!error) {
            result = _this.makeOneOrMany(docs);
          }
          return opts.callback(error, result);
        };
      })(this));
    };

    Model.prototype.insert = function(callback) {
      return this.constructor.insert({
        data: this.data(),
        callback: callback
      });
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

    Model.prototype.reference = function(attributes) {
      var attr, ref, _i, _len;
      if (!Type(attributes, Array)) {
        attributes = [attributes];
      }
      ref = {};
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attr = attributes[_i];
        ref[attr] = this._dataPath(attr);
      }
      return ref;
    };

    Model.reference = function(attributes) {
      if (attributes) {
        if (!Type(attributes, Array)) {
          attributes = [attributes];
        }
      } else {
        attributes = ['_id'];
      }
      return new Schema.Reference({
        model: this,
        attributes: attributes
      });
    };

    return Model;

  })(DataModel);

  module.exports = Model;

}).call(this);
