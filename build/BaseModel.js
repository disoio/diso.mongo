(function() {
  var BaseModel, Schema, Type, _handlePath,
    __slice = [].slice;

  Type = require('type-of-is');

  Schema = require('./Schema');

  _handlePath = function(path) {
    var PATH_SEPARATOR;
    PATH_SEPARATOR = '.';
    if (!Type(path, Array)) {
      path = path.split(PATH_SEPARATOR);
    }
    return path;
  };

  BaseModel = (function() {
    function BaseModel(data) {
      this._data = this.constructor.cast(data);
    }

    BaseModel.cast = function(data) {
      if (!this.schema) {
        throw "Diso.Mongo.Model: @schema has not been defined for " + this.name;
      }
      return this.schema.cast(data);
    };

    BaseModel.prototype.attributeExists = function(attr) {
      return this.constructor.schema.attributeExists(attr);
    };

    BaseModel.prototype.attributeSchema = function(path) {
      return null;
    };

    BaseModel.prototype.requireAttribute = function(attr) {
      if (!this.attributeExists(attr)) {
        throw "Diso.Mongo.Model: Invalid attribute: " + attr;
      }
    };

    BaseModel.prototype.toJSON = function() {
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

    BaseModel.prototype.data = function() {
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
      throw "Diso.Mongo.Model: Invalid argument to .data";
    };

    BaseModel.prototype._dataAdd = function(data_obj) {
      var cast_obj;
      return cast_obj = this.cast(data_obj);
    };

    BaseModel.prototype._dataPath = function(path, value) {
      var data, last, obj, part, parts, _i, _j, _len, _len1;
      if (value == null) {
        value = null;
      }
      if (!Type(path, String)) {
        throw "Diso.Mongo.Model: Must use string as path accessor";
      }
      parts = _handlePath(path);
      if (value) {
        data = {};
        obj = data;
        last = parts.pop();
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          obj = obj[part];
        }
        obj[last] = value;
        return this._dataAdd(data);
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

    BaseModel.prototype.set = function(attribute, value) {
      return this._dataPath(attribute, value);
    };

    BaseModel.prototype.get = function(attribute) {
      return this._dataPath(attribute);
    };

    BaseModel.prototype.validate = function() {
      return null;
    };

    BaseModel.prototype.reference = function(attributes) {
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

    BaseModel.reference = function(attributes) {
      if (attributes) {
        if (!Type(attributes, Array)) {
          attributes = [attributes];
        }
      } else {
        throw "Must pass attributes to Model.reference";
      }
      return new Schema.Reference({
        Model: this,
        attributes: attributes
      });
    };

    return BaseModel;

  })();

  module.exports = BaseModel;

}).call(this);
