(function() {
  var BaseModel, MongoDB, Schema, SchemaBase, SchemaBinary, SchemaBoolean, SchemaCode, SchemaDBRef, SchemaDate, SchemaDouble, SchemaFloat, SchemaInteger, SchemaLong, SchemaObject, SchemaObjectID, SchemaPrimitive, SchemaReference, SchemaRegExp, SchemaString, SchemaSymbol, SchemaTypedArray, SchemaUntypedArray, Type, primitive, utils, _i, _len, _primitive_schemas, _schemaForPrimitiveType,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MongoDB = require('mongodb');

  Type = require('type-of-is');

  BaseModel = require('./BaseModel');

  utils = require('./utils');

  SchemaBase = (function() {
    function SchemaBase() {}

    SchemaBase.prototype.attribute = function(path) {
      return null;
    };

    return SchemaBase;

  })();

  SchemaPrimitive = (function(_super) {
    __extends(SchemaPrimitive, _super);

    function SchemaPrimitive(Type) {
      this.Type = Type;
      SchemaPrimitive.__super__.constructor.call(this);
    }

    SchemaPrimitive.prototype.cast = function(obj) {
      if (this.isType(obj) || (obj === null) || (obj === void 0)) {
        return obj;
      } else {
        return new this.Type(obj);
      }
    };

    SchemaPrimitive.prototype.isType = function(obj) {
      return Type(obj, this.Type);
    };

    return SchemaPrimitive;

  })(SchemaBase);

  SchemaFloat = (function(_super) {
    __extends(SchemaFloat, _super);

    function SchemaFloat() {
      SchemaFloat.__super__.constructor.call(this, Number);
    }

    return SchemaFloat;

  })(SchemaPrimitive);

  SchemaDouble = (function(_super) {
    __extends(SchemaDouble, _super);

    function SchemaDouble() {
      SchemaDouble.__super__.constructor.call(this, MongoDB.Double);
    }

    return SchemaDouble;

  })(SchemaPrimitive);

  SchemaInteger = (function(_super) {
    __extends(SchemaInteger, _super);

    function SchemaInteger() {
      SchemaInteger.__super__.constructor.call(this, Number);
    }

    return SchemaInteger;

  })(SchemaPrimitive);

  SchemaLong = (function(_super) {
    __extends(SchemaLong, _super);

    function SchemaLong() {
      SchemaLong.__super__.constructor.call(this, MongoDB.Long);
    }

    return SchemaLong;

  })(SchemaPrimitive);

  SchemaDate = (function(_super) {
    __extends(SchemaDate, _super);

    function SchemaDate() {
      SchemaDate.__super__.constructor.call(this, Date);
    }

    return SchemaDate;

  })(SchemaPrimitive);

  SchemaRegExp = (function(_super) {
    __extends(SchemaRegExp, _super);

    function SchemaRegExp() {
      SchemaRegExp.__super__.constructor.call(this, RegExp);
    }

    return SchemaRegExp;

  })(SchemaPrimitive);

  SchemaString = (function(_super) {
    __extends(SchemaString, _super);

    function SchemaString() {
      SchemaString.__super__.constructor.call(this, String);
    }

    return SchemaString;

  })(SchemaPrimitive);

  SchemaBoolean = (function(_super) {
    __extends(SchemaBoolean, _super);

    function SchemaBoolean() {
      SchemaBoolean.__super__.constructor.call(this, Boolean);
    }

    return SchemaBoolean;

  })(SchemaPrimitive);

  SchemaBinary = (function(_super) {
    __extends(SchemaBinary, _super);

    function SchemaBinary() {
      SchemaBinary.__super__.constructor.call(this, MongoDB.Binary);
    }

    return SchemaBinary;

  })(SchemaPrimitive);

  SchemaCode = (function(_super) {
    __extends(SchemaCode, _super);

    function SchemaCode() {
      SchemaCode.__super__.constructor.call(this, MongoDB.Code);
    }

    return SchemaCode;

  })(SchemaPrimitive);

  SchemaObjectID = (function(_super) {
    __extends(SchemaObjectID, _super);

    function SchemaObjectID() {
      SchemaObjectID.__super__.constructor.call(this, MongoDB.ObjectID);
    }

    SchemaObjectID.prototype.isType = function(obj) {
      return Type.string(obj) === 'ObjectID';
    };

    return SchemaObjectID;

  })(SchemaPrimitive);

  SchemaDBRef = (function(_super) {
    __extends(SchemaDBRef, _super);

    function SchemaDBRef() {
      SchemaDBRef.__super__.constructor.call(this, MongoDB.DBRef);
    }

    return SchemaDBRef;

  })(SchemaPrimitive);

  SchemaSymbol = (function(_super) {
    __extends(SchemaSymbol, _super);

    function SchemaSymbol() {
      SchemaSymbol.__super__.constructor.call(this, MongoDB.Symbol);
    }

    return SchemaSymbol;

  })(SchemaPrimitive);

  SchemaObject = (function(_super) {
    __extends(SchemaObject, _super);

    function SchemaObject() {
      SchemaObject.__super__.constructor.call(this, Object);
    }

    return SchemaObject;

  })(SchemaPrimitive);

  _primitive_schemas = [SchemaFloat, SchemaDouble, SchemaInteger, SchemaLong, SchemaDate, SchemaRegExp, SchemaString, SchemaBoolean, SchemaBinary, SchemaCode, SchemaObjectID, SchemaDBRef, SchemaSymbol, SchemaObject];

  _schemaForPrimitiveType = (function() {
    var _primitive_types;
    _primitive_types = _primitive_schemas.map(function(PS) {
      var ps;
      ps = new PS();
      return ps.Type;
    });
    return function(_Type) {
      var index;
      index = _primitive_types.indexOf(_Type);
      if (index === -1) {
        return null;
      } else {
        return _primitive_schemas[index];
      }
    };
  })();

  Schema = (function(_super) {
    __extends(Schema, _super);

    function Schema(opts) {
      var options, schema;
      Schema.__super__.constructor.call(this);
      this.Model = opts.model;
      schema = opts.schema;
      options = opts.options;
      utils.rmerge(options, {
        strict: true
      });
      this.strict = options.strict;
      if ((__indexOf.call(schema, '_id') < 0) && options.add_id) {
        schema._id = SchemaObjectID;
      }
      this.processed_schema = this._process(schema);
    }

    Schema.prototype._process = function(spec) {
      var SchemaType, attr, processed;
      processed = {};
      for (attr in spec) {
        SchemaType = spec[attr];
        if (Array.isArray(SchemaType)) {
          if (SchemaType.length === 0) {
            processed[attr] = new SchemaUntypedArray();
          } else {
            SchemaType = this._processAtom(SchemaType[0]);
            if (!SchemaType) {
              throw new Error("diso.mongo.Schema: Invalid schema type for field: " + attr);
            }
            processed[attr] = new SchemaTypedArray(SchemaType);
          }
        } else {
          SchemaType = this._processAtom(SchemaType);
          if (!SchemaType) {
            throw new Error("diso.mongo.Schema: Invalid schema type for field: " + attr);
          }
          processed[attr] = SchemaType;
        }
      }
      return processed;
    };

    Schema.prototype._processAtom = function(SchemaType) {
      var PrimitiveSchemaType;
      if (SchemaType === void 0) {
        return null;
      }
      if ((__indexOf.call(_primitive_schemas, SchemaType) >= 0)) {
        return new SchemaType();
      }
      PrimitiveSchemaType = _schemaForPrimitiveType(SchemaType);
      if (PrimitiveSchemaType) {
        return new PrimitiveSchemaType();
      }
      if (Type.extension(SchemaType, BaseModel)) {
        return SchemaType._schema;
      } else {
        return null;
      }
    };

    Schema.prototype.isType = function(obj) {
      return Type(obj, this.Model);
    };

    Schema.prototype.cast = function(obj) {
      var error, k, result, schema, v;
      if (this.isType(obj)) {
        return obj;
      }
      result = {};
      for (k in obj) {
        v = obj[k];
        schema = this.processed_schema[k];
        if (schema) {
          if (!(schema instanceof SchemaBase)) {
            throw new Error("diso.mongo.Schema: invalid schema for " + k + ": " + schema);
          }
          try {
            result[k] = schema.cast(v);
          } catch (_error) {
            error = _error;
            throw new Error("diso.mongo.Schema: " + k + ": " + error);
          }
        } else {
          if (!this.options.strict) {
            result[k] = v;
          }
        }
      }
      return result;
    };

    Schema.prototype.attribute = function(path) {
      var first, next, rest, _ref;
      _ref = utils.shiftPath(path), first = _ref[0], rest = _ref[1];
      next = this.processed_schema[first];
      if (rest) {
        return next.attribute(rest);
      } else {
        return next;
      }
    };

    return Schema;

  })(SchemaBase);

  SchemaTypedArray = (function(_super) {
    __extends(SchemaTypedArray, _super);

    function SchemaTypedArray(Type) {
      this.Type = Type;
      SchemaTypedArray.__super__.constructor.call(this);
    }

    SchemaTypedArray.prototype.cast = function(values) {
      var _Type;
      if (!Array.isArray(values)) {
        throw new Error("diso.mongo.Schema: Expecting array");
      }
      _Type = this.Type;
      return values.map(function(value) {
        if (!_Type.isType(value)) {
          value = _Type.cast(value);
        }
        return value;
      });
    };

    SchemaTypedArray.prototype.isType = function(obj) {
      return Array.isArray(obj);
    };

    SchemaTypedArray.prototype.attribute = function(path) {
      var first, next, parts;
      parts = utils.splitPath(path);
      first = parts.shift();
      if (isNaN(first)) {
        throw new Error("diso.mongo.Schema: Missing array index");
      } else {
        first = parts.shift();
        next = this.Type.attribute(first);
        if (parts.length > 0) {
          return next.attribute(parts);
        } else {
          return next;
        }
      }
    };

    return SchemaTypedArray;

  })(SchemaBase);

  SchemaUntypedArray = (function(_super) {
    __extends(SchemaUntypedArray, _super);

    function SchemaUntypedArray() {
      return SchemaUntypedArray.__super__.constructor.apply(this, arguments);
    }

    SchemaUntypedArray.prototype.cast = function(values) {
      if (!Array.isArray(values)) {
        throw new Error("diso.mongo.Schema: Expecting array for key:" + k);
      }
      return values;
    };

    SchemaUntypedArray.prototype.isType = function(obj) {
      return Array.isArray(obj);
    };

    SchemaUntypedArray.prototype.attribute = function(path) {
      if (isNaN(first)) {
        throw new Error("diso.mongo.Schema: Missing array index");
      } else {
        return null;
      }
    };

    return SchemaUntypedArray;

  })(SchemaBase);

  SchemaReference = (function(_super) {
    __extends(SchemaReference, _super);

    function SchemaReference(data) {
      this.Model = data.Model;
      this.attributes = data.attributes;
    }

    SchemaReference.prototype.cast = function(obj) {
      if (!isModel(obj)) {
        obj = new this.Model(obj);
      }
      return obj.reference(this.attributes);
    };

    return SchemaReference;

  })(SchemaBase);

  Schema.Reference = SchemaReference;

  for (_i = 0, _len = _primitive_schemas.length; _i < _len; _i++) {
    primitive = _primitive_schemas[_i];
    Schema[primitive.name.replace(/^Schema/, '')] = primitive;
  }

  module.exports = Schema;

}).call(this);
