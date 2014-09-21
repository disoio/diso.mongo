(function() {
  var BaseModel, DataModel, Model, MongoDB, MongoJS, ReferenceModel, Schema, Type, throwError, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MongoDB = require('mongodb');

  MongoJS = require('mongojs');

  Type = require('type-of-is');

  BaseModel = require('./BaseModel');

  DataModel = require('./DataModel');

  ReferenceModel = require('./ReferenceModel');

  Schema = require('./Schema');

  utils = require('./utils');

  throwError = function(msg) {
    throw new Error("diso.mongo.Model: " + msg);
  };

  Model = (function(_super) {
    __extends(Model, _super);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.db_url = null;

    Model.collection_name = null;

    Model._collection = null;

    Model.collection = function() {
      var collection_name, db;
      if (!this._collection) {
        if (!this.db_url) {
          throwError("" + this.name + " is missing required db_url");
        }
        db = MongoJS(this.db_url);
        collection_name = this.collection_name || utils.underscorize(this.name);
        this._collection = db.collection(collection_name);
      }
      return this._collection;
    };

    Model.prototype.id = function() {
      return this._id;
    };

    Model.schema = function(schema) {
      if (!('_id' in schema)) {
        schema._id = Schema.ObjectID;
      }
      return Model.__super__.constructor.schema.call(this, schema);
    };

    Model.reference = function(attributes) {
      if (attributes) {
        if (!Type(attributes, Array)) {
          attributes = [attributes];
        }
      } else {
        throwError("Must specify attributes to reference");
      }
      return new Schema.Reference({
        model: this,
        attributes: attributes
      });
    };

    Model.find = function(args) {
      var _id;
      args.method = 'find';
      if ('_id' in args) {
        _id = args._id;
        delete args._id;
        args.query = {
          _id: _id
        };
        args.method = 'findOne';
      }
      return this._findHelper(args);
    };

    Model.findOne = function(args) {
      args.method = 'findOne';
      return this._findHelper(args);
    };

    Model.findAll = function(args) {
      args.method = 'find';
      args.query = {};
      return this._findHelper(args);
    };

    Model.findAndModify = function(args) {
      var callback;
      callback = args.callback;
      delete args.callback;
      args["new"] = true;
      return this.collection().findAndModify(args, (function(_this) {
        return function(error, doc, last_error) {
          var model;
          model = null;
          if (!error && doc) {
            model = new _this(doc);
          }
          return callback(error, model);
        };
      })(this));
    };

    Model.count = function(args) {
      var callback, query;
      query = args.query || {};
      callback = args.callback;
      return this.collection().count(query, callback);
    };

    Model.update = function(args) {
      var callback, options, query, update;
      query = args.query;
      update = args.update;
      callback = args.callback;
      options = args.options || {};
      return this.collection().update(query, update, options, callback);
    };

    Model.insert = function(args) {
      var callback, data, m, models;
      data = args.data;
      callback = args.callback;
      models = this._ensureModel(data);
      data = Type(models, Array) ? (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          m = models[_i];
          _results.push(m.data());
        }
        return _results;
      })() : models.data();
      return this.collection().insert(data, (function(_this) {
        return function(error, docs) {
          if (!error) {
            docs = _this._ensureModel(docs);
          }
          return callback(error, docs);
        };
      })(this));
    };

    Model.prototype.insert = function(callback) {
      return this.constructor.insert({
        data: this,
        callback: callback
      });
    };

    Model.prototype.update = function(args) {
      var cb;
      if (args.reload) {
        cb = args.callback;
        args.callback = (function(_this) {
          return function(error) {
            if (error) {
              return cb(error);
            } else {
              return _this.reload(cb);
            }
          };
        })(this);
      }
      args.query = {
        _id: this._id
      };
      return this.constructor.update(args);
    };

    Model.prototype.save = function(callback) {
      var collection, error;
      error = this.validate();
      if (error) {
        return callback(error);
      }
      collection = this.constructor.collection();
      return collection.save(this.data(), (function(_this) {
        return function(error, doc) {
          if (!error && doc) {
            _this._id = doc._id;
          }
          return callback(error);
        };
      })(this));
    };

    Model.prototype.reload = function(callback) {
      return this.constructor.collection().findOne({
        _id: this._id
      }, (function(_this) {
        return function(error, data) {
          if (!error) {
            _this._data = _this.constructor.cast(data);
          }
          return callback(error);
        };
      })(this));
    };

    Model.prototype.remove = function(callback) {
      var collection, selector;
      collection = this.constructor.collection();
      selector = {
        _id: this._id
      };
      return collection.remove(selector, {
        safe: true
      }, callback);
    };

    Model._findHelper = function(args) {
      var callback, id_is_string, method, projection, query, wants_object_id;
      method = args.method;
      query = args.query;
      callback = args.callback;
      projection = args.projection || {};
      id_is_string = Type(query._id, String);
      wants_object_id = Type(this._schema.attribute('_id'), Schema.ObjectID);
      if (id_is_string && wants_object_id) {
        query._id = new MongoDB.ObjectID(query._id);
      }
      return this.collection()[method](query, projection, (function(_this) {
        return function(error, results) {
          var doc;
          if (!error) {
            results = (function() {
              var _i, _len, _results;
              if (Type(results, Array)) {
                _results = [];
                for (_i = 0, _len = results.length; _i < _len; _i++) {
                  doc = results[_i];
                  _results.push(new this(doc));
                }
                return _results;
              } else {
                if (results) {
                  return new this(results);
                } else {
                  return null;
                }
              }
            }).call(_this);
          }
          return callback(error, results);
        };
      })(this));
    };

    Model._ensureModel = function(objs) {
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

    return Model;

  })(DataModel);

  module.exports = Model;

}).call(this);
