(function() {
  var BaseModel, DataModel, MongoDB, Schema, Type, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Type = require('type-of-is');

  MongoDB = require('mongodb');

  BaseModel = require('./BaseModel');

  Schema = require('./Schema');

  utils = require('./utils');

  DataModel = (function(_super) {
    __extends(DataModel, _super);

    function DataModel(data) {
      if (data && this.constructor.add_id && (!('_id' in data))) {
        data._id = new MongoDB.ObjectID();
      }
      this._data = this.constructor.cast(data);
    }

    DataModel.schema = function(schema) {
      var k, v, _results;
      this._schema = new Schema({
        schema: schema,
        model: this,
        options: {
          add_id: this.add_id,
          strict: this.strict
        }
      });
      _results = [];
      for (k in schema) {
        v = schema[k];
        _results.push((function(_this) {
          return function(k) {
            return Object.defineProperty(_this.prototype, k, {
              get: function() {
                return this._data[k];
              },
              set: function(val) {
                return this._dataPath(k, val);
              }
            });
          };
        })(this)(k));
      }
      return _results;
    };

    DataModel.cast = function(data) {
      if (!this._schema) {
        throw new Error("diso.mongo.Model: @schema has not been defined for " + this.name);
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
        throw new Error("diso.mongo.Model: Missing attribute: " + attr);
      }
    };

    DataModel.prototype._map = function(include_$model) {
      var getData, k, result, v, _ref;
      getData = function(v) {
        if (Type.instance(v, BaseModel)) {
          return v._map(include_$model);
        } else {
          return v;
        }
      };
      result = {};
      _ref = this._data;
      for (k in _ref) {
        v = _ref[k];
        result[k] = Type(v, Array) ? v.map(getData) : getData(v);
      }
      if (include_$model) {
        result.$model = this.constructor.name;
      }
      return result;
    };

    DataModel.deflate = function(obj) {
      var k, res, v;
      switch (Type(obj)) {
        case Array:
          return obj.map(this.deflate);
        case Object:
          res = {};
          for (k in obj) {
            v = obj[k];
            res[k] = this.deflate(v);
          }
          return res;
        default:
          if (Type.instance(obj, BaseModel)) {
            return obj.deflate();
          } else {
            return obj;
          }
      }
    };

    DataModel.prototype.deflate = function() {
      return this._map(true);
    };

    DataModel.prototype.data = function() {
      var arg, args, attr, k, result, v, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) {
        return this._map(false);
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
      throw new Error("diso.mongo.Model: Invalid argument to .data");
    };

    DataModel.prototype._dataPath = function(path, value) {
      var data, last, part, parts, schema, _i, _j, _len, _len1;
      if (value == null) {
        value = null;
      }
      if (!Type(path, String)) {
        throw new Error("diso.mongo.Model: Must use string as path accessor");
      }
      parts = utils.splitPath(path);
      if (value) {
        schema = this.constructor._schema.attribute(path);
        data = this._data;
        last = parts.pop();
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          data = data[part];
          if (data instanceof BaseModel) {
            data = data._data;
          }
        }
        return data[last] = schema ? schema.cast(value) : value;
      } else {
        data = this._data;
        for (_j = 0, _len1 = parts.length; _j < _len1; _j++) {
          part = parts[_j];
          data = data[part];
          if (data instanceof BaseModel) {
            data = data._data;
          }
        }
        return data;
      }
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

    return DataModel;

  })(BaseModel);

  module.exports = DataModel;

}).call(this);
