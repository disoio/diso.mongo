(function() {
  var Async, BaseModel, DataModel, MongoDB, ReferenceModel, Schema, Type, throwError, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Type = require('type-of-is');

  MongoDB = require('mongodb');

  Async = require('async');

  BaseModel = require('./BaseModel');

  ReferenceModel = require('./ReferenceModel');

  Schema = require('./Schema');

  utils = require('./utils');

  throwError = function(msg) {
    throw new Error("diso.mongo.DataModel: " + msg);
  };

  DataModel = (function(_super) {
    __extends(DataModel, _super);

    function DataModel(data) {
      this._data = this.constructor.cast(data);
    }

    DataModel.schema = function(schema) {
      var alias, k, pschema, v, _fn;
      this._schema = new Schema({
        schema: schema,
        model: this
      });
      _fn = (function(_this) {
        return function(k) {
          if (!(k in _this.prototype)) {
            return Object.defineProperty(_this.prototype, k, {
              get: function() {
                return this._data[k];
              },
              set: function(val) {
                return this._dataPath(k, val);
              }
            });
          }
        };
      })(this);
      for (k in schema) {
        v = schema[k];
        _fn(k);
      }
      pschema = this._schema.processed_schema;
      this.id_has_alias = ('_id' in pschema) && pschema._id.alias;
      if (this.id_has_alias) {
        alias = pschema._id.alias;
        if (alias in this.prototype) {
          throwError("Invalid alias: " + alias + ", conflicts with exist property");
        }
        Object.defineProperty(this.prototype, alias, {
          get: function() {
            return this._data._id;
          },
          set: function(val) {
            return this._dataPath('_id', val);
          }
        });
      }
      return this._schema;
    };

    DataModel.cast = function(data) {
      var alias;
      if (!this._schema) {
        throwError("@schema has not been called for " + this.name);
      }
      if (this.id_has_alias) {
        alias = this._schema.processed_schema._id.alias;
        if (alias in data) {
          if ('_id' in data) {
            throwError("Cannot pass _id and its alias, " + alias + ", as data attributes");
          }
          data._id = data[alias];
          delete data[alias];
        }
      }
      return this._schema.cast(data);
    };

    DataModel.prototype.attributeExists = function(path) {
      return utils.splitPath(path);
    };

    DataModel.prototype.attributeSchema = function(path) {
      return this.constructor._schema.attribute(path);
    };

    DataModel.prototype.requireAttribute = function(attr) {
      if (!this.attributeExists(attr)) {
        return throwError("Missing attribute: " + attr);
      }
    };

    DataModel.prototype.data = function() {
      var arg, args, attr, k, result, v, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) {
        return this._map();
      }
      if (args.length === 1) {
        arg = args[0];
        switch (Type(arg)) {
          case String:
            return this._dataPath(arg);
          case Array:
            result = {};
            for (_i = 0, _len = arg.length; _i < _len; _i++) {
              attr = arg[_i];
              result[attr] = this._dataPath(attr);
            }
            return result;
          case Object:
            for (k in arg) {
              v = arg[k];
              this._dataPath(k, v);
            }
            return this;
        }
      }
      if (args.length === 2) {
        this._dataPath(args[0], args[1]);
        return this;
      }
      return throwError("Invalid argument to .data");
    };

    DataModel.prototype.deflate = function(args) {
      if (!('model_key' in args)) {
        throwError("deflate call missing 'model_key' arg");
      }
      return this._map(args);
    };

    DataModel.prototype.set = function(path, value) {
      return this._dataPath(path, value);
    };

    DataModel.prototype.get = function(path) {
      return this._dataPath(path);
    };

    DataModel.prototype.validate = function() {
      return null;
    };

    DataModel.prototype._map = function(args) {
      var attrs, getData, k, model_key, result, v, _ref;
      if (args == null) {
        args = {};
      }
      model_key = 'model_key' in args ? args.model_key : null;
      attrs = 'attrs' in args ? args.attrs : null;
      getData = function(v) {
        var is_model, is_reference;
        is_model = Type.instance(v, BaseModel);
        is_reference = Type.instance(v, ReferenceModel);
        if (is_model || is_reference) {
          return v._map({
            attrs: attrs,
            model_key: model_key
          });
        } else {
          return v;
        }
      };
      result = {};
      _ref = this._data;
      for (k in _ref) {
        v = _ref[k];
        if (!attrs || (__indexOf.call(attrs, k) >= 0)) {
          result[k] = Type(v, Array) ? v.map(getData) : getData(v);
        }
      }
      if (model_key) {
        result[model_key] = this.constructor.name;
      }
      return result;
    };

    DataModel.prototype._dataPath = function(path, value) {
      var data, last, part, parts, schema, _i, _j, _len, _len1;
      if (value == null) {
        value = null;
      }
      if (!Type(path, String)) {
        throwError("Must use string as path accessor");
      }
      parts = utils.splitPath(path);
      if (value) {
        schema = this.constructor._schema.attribute(path);
        data = this._data;
        last = parts.pop();
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          data = data[part];
        }
        return data[last] = schema ? Type(schema, Schema) ? new schema.Model(value) : schema.cast(value) : value;
      } else {
        data = this._data;
        for (_j = 0, _len1 = parts.length; _j < _len1; _j++) {
          part = parts[_j];
          data = data[part];
        }
        return data;
      }
    };

    return DataModel;

  })(BaseModel);

  module.exports = DataModel;

}).call(this);
