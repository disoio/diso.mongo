(function() {
  var BaseModel, DataModel, Schema, Type, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Type = require('type-of-is');

  BaseModel = require('./BaseModel');

  Schema = require('./Schema');

  utils = require('./utils');

  DataModel = (function(_super) {
    __extends(DataModel, _super);

    function DataModel(data) {
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

    DataModel.prototype.toJSON = function() {
      var getData, k, result, v, _ref;
      getData = function(v) {
        if (Type.instance(v, BaseModel)) {
          return v.toJSON();
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
      return result;
    };

    DataModel.prototype.data = function() {
      var arg, args, attr, result, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) {
        return this.toJSON();
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
            this._dataAdd(arg);
            return this;
        }
      }
      if (args.length === 2) {
        return this._dataPath(args[0], args[1]);
      }
      throw new Error("diso.mongo.Model: Invalid argument to .data");
    };

    DataModel.prototype._dataAdd = function(data_obj) {
      var cast_obj;
      return cast_obj = this.constructor.cast(data_obj);
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

    DataModel.prototype.set = function(attribute, value) {
      return this._dataPath(attribute, value);
    };

    DataModel.prototype.get = function(attribute) {
      return this._dataPath(attribute);
    };

    DataModel.prototype.validate = function() {
      return null;
    };

    DataModel.prototype.reference = function(attributes) {
      var attr, ref, _i, _len, _results;
      if (!Type(attributes, Array)) {
        attributes = [attributes];
      }
      ref = {
        type: this.constructor.name
      };
      _results = [];
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attr = attributes[_i];
        _results.push(ref[attr] = this._dataPath(attr));
      }
      return _results;
    };

    DataModel.reference = function(attributes) {
      if (attributes) {
        if (!Type(attributes, Array)) {
          attributes = [attributes];
        }
      } else {
        throw new Error("diso.mongo.Model: Must pass attributes to Model.reference");
      }
      return new Schema.Reference({
        Model: this,
        attributes: attributes
      });
    };

    return DataModel;

  })(BaseModel);

  module.exports = DataModel;

}).call(this);
