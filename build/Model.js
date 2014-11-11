(function() {
  var BaseModel, DataModel, Model, MongoDB, ReferenceModel, Schema, Type, throwError, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MongoDB = require('mongodb');

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

    Model.collection = function(callback) {
      if (!this.db_url) {
        throwError("" + this.name + " is missing required db_url");
      }
      return MongoDB.MongoClient.connect(this.db_url, (function(_this) {
        return function(error, db) {
          var collection, collection_name;
          if (error) {
            return callback(error, null);
          }
          collection_name = _this.collection_name || utils.underscorize(_this.name);
          collection = db.collection(collection_name);
          collection.close = function() {
            return db.close();
          };
          return callback(null, collection);
        };
      })(this));
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
      var callback, options, query;
      if ('_id' in args) {
        return this.findOne(args);
      }
      query = args.query;
      callback = args.callback;
      options = args.options || {};
      this._handleIdQuery(query);
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.find(query, options).toArray(function(error, results) {
            var doc, models;
            models = !error ? (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                doc = results[_i];
                _results.push(new this(doc));
              }
              return _results;
            }).call(_this) : null;
            collection.close();
            return callback(error, models);
          });
        };
      })(this));
    };

    Model.findOne = function(args) {
      var callback, options, query;
      if ('_id' in args) {
        args.query = {
          _id: args._id
        };
      }
      query = args.query;
      callback = args.callback;
      options = args.options || {};
      this._handleIdQuery(query);
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.findOne(query, options, function(error, result) {
            var model;
            model = !error && result ? new _this(result) : null;
            collection.close();
            return callback(error, model);
          });
        };
      })(this));
    };

    Model.findAll = function(args) {
      args.query = {};
      return this.find(args);
    };

    Model.findAndModify = function(args) {
      var callback, options, query, sort, update;
      query = args.query;
      update = args.update;
      options = args.options || {};
      callback = args.callback;
      sort = 'sort' in args ? args.sort : null;
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.findAndModify(query, sort, update, options, function(error, result) {
            var model;
            model = !error && result.value ? new _this(result.value) : null;
            collection.close();
            return callback(error, model);
          });
        };
      })(this));
    };

    Model.count = function(args) {
      var callback, options, query;
      query = args.query || {};
      options = args.options || {};
      callback = args.callback;
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.count(query, options, function(error, count) {
            collection.close();
            return callback(error, count);
          });
        };
      })(this));
    };

    Model.update = function(args) {
      var callback, options, query, update;
      query = args.query;
      update = args.update;
      callback = args.callback;
      options = args.options || {};
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.update(query, update, options, function(error, result) {
            collection.close();
            return callback(error, result);
          });
        };
      })(this));
    };

    Model.prototype.update = function(args) {
      var callback;
      args.query = {
        _id: this._id
      };
      callback = args.callback;
      args.callback = function(error, result) {
        if (error) {
          return callback(error, null);
        }
        if (!(result.result.n > 0)) {
          error = new Error("diso.mongo.Model: no models matched _id");
          return callback(error, null);
        }
        if (args.reload) {
          return this.reload(callback);
        } else {
          return callback(null);
        }
      };
      return this.constructor.update(args);
    };

    Model.insert = function(args) {
      var callback, data, m, models, options;
      data = args.data;
      callback = args.callback;
      options = args.options || {};
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
      return this.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error, null);
          }
          return collection.insert(data, options, function(error, result) {
            models = !error ? _this._ensureModel(result.ops) : null;
            collection.close();
            return callback(error, models);
          });
        };
      })(this));
    };

    Model.prototype.insert = function(args) {
      var callback;
      args.data = this;
      callback = args.callback;
      args.callback = function(error, models) {
        if (!error) {
          models = models[0];
        }
        return callback(error, models);
      };
      return this.constructor.insert(args);
    };

    Model.prototype.save = function(args) {
      var callback, error, options;
      callback = args.callback;
      options = args.options || {};
      error = this.validate();
      if (error) {
        return callback(error);
      }
      return this.constructor.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.save(_this.data(), options, function(error, doc) {
            if (!error && doc) {
              _this._id = doc._id;
            }
            collection.close();
            return callback(error);
          });
        };
      })(this));
    };

    Model.prototype.reload = function(callback) {
      return this.constructor.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error, null);
          }
          return collection.findOne({
            _id: _this._id
          }, function(error, data) {
            if (!error) {
              _this._data = _this.constructor.cast(data);
            }
            collection.close();
            return callback(error);
          });
        };
      })(this));
    };

    Model.remove = function(args) {
      var callback, options, query;
      query = args.query;
      options = args.options || {};
      callback = args.callback;
      return this.constructor.collection((function(_this) {
        return function(error, collection) {
          if (error) {
            return callback(error);
          }
          return collection.remove(query, options, function(error, result) {
            collection.close();
            return callback(error, result);
          });
        };
      })(this));
    };

    Model.prototype.remove = function(args) {
      args.query = {
        _id: this._id
      };
      return this.constructor.remove(args);
    };

    Model._handleIdQuery = function(query) {
      var id_is_string, wants_object_id;
      id_is_string = Type(query._id, String);
      wants_object_id = Type(this._schema.attribute('_id'), Schema.ObjectID);
      if (id_is_string && wants_object_id) {
        return query._id = new MongoDB.ObjectID(query._id);
      }
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
