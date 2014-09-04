(function() {
  var BaseModel, MongoDB, ReferenceModel, Schema, SchemaBase, SchemaBinary, SchemaBoolean, SchemaCode, SchemaDBRef, SchemaDate, SchemaDouble, SchemaFloat, SchemaID, SchemaInteger, SchemaLong, SchemaObject, SchemaObjectID, SchemaPrimitive, SchemaReference, SchemaRegExp, SchemaString, SchemaSymbol, SchemaTypedArray, SchemaUntyped, SchemaUntypedArray, Type, makeSchemaID, primitive, throwError, utils, _checkPrimitiveSchemaType, _i, _len, _primitive_schemas, _schemaTypeForPrimitive,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MongoDB = require('mongodb');

  Type = require('type-of-is');

  BaseModel = require('./BaseModel');

  ReferenceModel = require('./ReferenceModel');

  utils = require('./utils');

  throwError = function(msg) {
    msg = "diso.mongo.Schema: " + msg;
    throw new Error(msg);
  };

  SchemaBase = (function() {
    SchemaBase.prototype.Type = null;

    function SchemaBase(type) {
      if (type) {
        this.Type = type;
      }
    }

    SchemaBase.prototype.attribute = function(path) {
      return null;
    };

    SchemaBase.prototype.isType = function(obj) {
      if (this.Type) {
        return Type(obj, this.Type);
      } else {
        return true;
      }
    };

    SchemaBase.prototype.cast = function(obj) {
      if (!this.Type) {
        return obj;
      }
      if ((obj === null) || (obj === void 0)) {
        return null;
      }
      if (this.isType(obj)) {
        return obj;
      } else {
        return new this.Type(obj);
      }
    };

    return SchemaBase;

  })();

  SchemaID = (function(_super) {
    __extends(SchemaID, _super);

    function SchemaID() {
      return SchemaID.__super__.constructor.apply(this, arguments);
    }

    SchemaID.prototype.auto = false;

    SchemaID.prototype.alias = null;

    SchemaID.prototype.generate = function() {
      return throwError("Must define generate method from SchemaID");
    };

    return SchemaID;

  })(SchemaBase);

  makeSchemaID = function(args) {
    var PrimitiveSchemaType, S;
    S = (function(_super) {
      __extends(_Class, _super);

      function _Class() {
        return _Class.__super__.constructor.apply(this, arguments);
      }

      return _Class;

    })(SchemaID);
    PrimitiveSchemaType = _checkPrimitiveSchemaType(args.type);
    if (PrimitiveSchemaType) {
      S.prototype.Type = new PrimitiveSchemaType().Type;
    } else {
      throwError("SchemaID type must be a Schema Primitive");
    }
    if ('alias' in args) {
      S.prototype.alias = args.alias;
    }
    S.prototype.auto = 'gen' in args ? (S.prototype.generate = args.gen, true) : false;
    return S;
  };

  makeSchemaID.Base = SchemaID;

  SchemaObjectID = (function(_super) {
    __extends(SchemaObjectID, _super);

    function SchemaObjectID() {
      return SchemaObjectID.__super__.constructor.apply(this, arguments);
    }

    SchemaObjectID.prototype.Type = MongoDB.ObjectID;

    SchemaObjectID.prototype.auto = true;

    SchemaObjectID.prototype.generate = function() {
      return new MongoDB.ObjectID();
    };

    SchemaObjectID.prototype.isType = function(obj) {
      return Type.string(obj) === 'ObjectID';
    };

    return SchemaObjectID;

  })(SchemaID);

  SchemaPrimitive = (function(_super) {
    __extends(SchemaPrimitive, _super);

    function SchemaPrimitive() {
      return SchemaPrimitive.__super__.constructor.apply(this, arguments);
    }

    return SchemaPrimitive;

  })(SchemaBase);

  SchemaBinary = (function(_super) {
    __extends(SchemaBinary, _super);

    function SchemaBinary() {
      SchemaBinary.__super__.constructor.call(this, MongoDB.Binary);
    }

    return SchemaBinary;

  })(SchemaPrimitive);

  SchemaBoolean = (function(_super) {
    __extends(SchemaBoolean, _super);

    function SchemaBoolean() {
      SchemaBoolean.__super__.constructor.call(this, Boolean);
    }

    return SchemaBoolean;

  })(SchemaPrimitive);

  SchemaCode = (function(_super) {
    __extends(SchemaCode, _super);

    function SchemaCode() {
      SchemaCode.__super__.constructor.call(this, MongoDB.Code);
    }

    return SchemaCode;

  })(SchemaPrimitive);

  SchemaDate = (function(_super) {
    __extends(SchemaDate, _super);

    function SchemaDate() {
      SchemaDate.__super__.constructor.call(this, Date);
    }

    return SchemaDate;

  })(SchemaPrimitive);

  SchemaDBRef = (function(_super) {
    __extends(SchemaDBRef, _super);

    function SchemaDBRef() {
      SchemaDBRef.__super__.constructor.call(this, MongoDB.DBRef);
    }

    return SchemaDBRef;

  })(SchemaPrimitive);

  SchemaDouble = (function(_super) {
    __extends(SchemaDouble, _super);

    function SchemaDouble() {
      SchemaDouble.__super__.constructor.call(this, MongoDB.Double);
    }

    return SchemaDouble;

  })(SchemaPrimitive);

  SchemaFloat = (function(_super) {
    __extends(SchemaFloat, _super);

    function SchemaFloat() {
      SchemaFloat.__super__.constructor.call(this, Number);
    }

    SchemaFloat.prototype.cast = function(obj) {
      return parseFloat(obj);
    };

    return SchemaFloat;

  })(SchemaPrimitive);

  SchemaInteger = (function(_super) {
    __extends(SchemaInteger, _super);

    function SchemaInteger() {
      SchemaInteger.__super__.constructor.call(this, Number);
    }

    SchemaInteger.prototype.cast = function(obj) {
      return parseInt(obj);
    };

    return SchemaInteger;

  })(SchemaPrimitive);

  SchemaLong = (function(_super) {
    __extends(SchemaLong, _super);

    function SchemaLong() {
      SchemaLong.__super__.constructor.call(this, MongoDB.Long);
    }

    return SchemaLong;

  })(SchemaPrimitive);

  SchemaObject = (function(_super) {
    __extends(SchemaObject, _super);

    function SchemaObject() {
      SchemaObject.__super__.constructor.call(this, Object);
    }

    return SchemaObject;

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

  SchemaSymbol = (function(_super) {
    __extends(SchemaSymbol, _super);

    function SchemaSymbol() {
      SchemaSymbol.__super__.constructor.call(this, MongoDB.Symbol);
    }

    return SchemaSymbol;

  })(SchemaPrimitive);

  SchemaUntyped = (function(_super) {
    __extends(SchemaUntyped, _super);

    function SchemaUntyped() {
      return SchemaUntyped.__super__.constructor.apply(this, arguments);
    }

    return SchemaUntyped;

  })(SchemaPrimitive);

  _primitive_schemas = [SchemaBoolean, SchemaBinary, SchemaCode, SchemaDate, SchemaDBRef, SchemaDouble, SchemaFloat, SchemaInteger, SchemaLong, SchemaObject, SchemaRegExp, SchemaString, SchemaSymbol, SchemaUntyped];

  _schemaTypeForPrimitive = (function() {
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

  _checkPrimitiveSchemaType = function(SchemaType) {
    var PrimitiveSchemaType;
    if ((__indexOf.call(_primitive_schemas, SchemaType) >= 0)) {
      return SchemaType;
    }
    PrimitiveSchemaType = _schemaTypeForPrimitive(SchemaType);
    if (PrimitiveSchemaType) {
      return PrimitiveSchemaType;
    } else {
      return null;
    }
  };

  SchemaReference = (function(_super) {
    __extends(SchemaReference, _super);

    function SchemaReference(data) {
      this.Model = data.model;
      this.attributes = data.attributes;
    }

    SchemaReference.prototype.cast = function(obj) {
      if (Type.instance(obj, ReferenceModel)) {
        if (!Type.instance(obj.Model, this.Model)) {
          throwError("Can't cast reference of type " + obj.Model.name + " to " + this.Model.name);
        }
        obj.attributes = this.attributes;
        return obj;
      }
      if (!Type.instance(obj, this.Model)) {
        obj = new this.Model(obj);
      }
      return obj.reference(this.attributes);
    };

    return SchemaReference;

  })(SchemaBase);

  Schema = (function(_super) {
    __extends(Schema, _super);

    function Schema(args) {
      this.cast = __bind(this.cast, this);
      var schema;
      Schema.__super__.constructor.call(this);
      schema = args.schema;
      this.Model = args.model;
      this.processed_schema = this._process(schema);
    }

    Schema.prototype._config = {
      strict: false
    };

    Schema.prototype.config = function(args) {
      var k, msg, v, valid_attrs, _results;
      _results = [];
      for (k in args) {
        v = args[k];
        if (!(k in this._config)) {
          valid_attrs = Object.keys(this._config).join(', ');
          msg = "Invalid config attribute: " + k + ". Valid attributes are " + valid_attrs;
          throwError(msg);
        }
        _results.push(this._config[k] = v);
      }
      return _results;
    };

    Schema.prototype._process = function(spec) {
      var SchemaType, attr, processed, schema, _throwError;
      processed = {};
      _throwError = function(attr) {
        return throwError("Invalid schema type for field: " + attr);
      };
      for (attr in spec) {
        SchemaType = spec[attr];
        if (!SchemaType) {
          _throwError(attr);
        }
        processed[attr] = Array.isArray(SchemaType) ? SchemaType.length === 0 ? new SchemaUntypedArray() : (SchemaType = this._processAtom(SchemaType[0]), !SchemaType ? _throwError(attr) : void 0, new SchemaTypedArray(SchemaType)) : (schema = this._processAtom(SchemaType), !schema ? _throwError(attr) : void 0, schema);
      }
      return processed;
    };

    Schema.prototype._processAtom = function(SchemaType) {
      var PrimitiveType;
      if (SchemaType === void 0) {
        return null;
      } else if (Type(SchemaType, SchemaReference)) {
        return SchemaType;
      } else if (Type.extension(SchemaType, SchemaID)) {
        return new SchemaType();
      } else if (Type.extension(SchemaType, BaseModel)) {
        return SchemaType._schema;
      } else {
        PrimitiveType = _checkPrimitiveSchemaType(SchemaType);
        if (PrimitiveType) {
          return new PrimitiveType();
        } else {
          return null;
        }
      }
    };

    Schema.prototype.isType = function(obj) {
      return Type(obj, this.Model);
    };

    Schema.prototype.cast = function(obj) {
      var Model, data, error, id, k, schema, v;
      if (this.isType(obj)) {
        return obj;
      }
      data = {};
      for (k in obj) {
        v = obj[k];
        if (this.processed_schema.hasOwnProperty(k)) {
          schema = this.processed_schema[k];
          if (!(schema instanceof SchemaBase)) {
            throwError("Invalid schema for " + k + ": " + schema);
          }
          try {
            data[k] = Type(schema, Schema) ? (Model = schema.Model, Type(v, Model) ? v : new Model(v)) : schema.cast(v);
          } catch (_error) {
            error = _error;
            throwError("" + k + ": " + error);
          }
        } else {
          if (!this._config.strict) {
            data[k] = v;
          }
        }
      }
      if ('_id' in this.processed_schema) {
        id = this.processed_schema._id;
        if (id.auto && (!('_id' in data))) {
          data._id = id.generate(data);
        }
      }
      return data;
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
      if (!Array.isArray(values)) {
        throwError("Expecting array");
      }
      return values.map((function(_this) {
        return function(value) {
          var Model;
          if (!_this.Type.isType(value)) {
            if (Type(_this.Type, Schema)) {
              Model = _this.Type.Model;
              return new Model(value);
            } else {
              return _this.Type.cast(value);
            }
          } else {
            return value;
          }
        };
      })(this));
    };

    SchemaTypedArray.prototype.isType = function(obj) {
      return Array.isArray(obj);
    };

    SchemaTypedArray.prototype.attribute = function(path) {
      var first, next, parts;
      parts = utils.splitPath(path);
      first = parts.shift();
      if (isNaN(first)) {
        return throwError("Missing array index");
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
        throwError("Expecting array for key:" + k);
      }
      return values;
    };

    SchemaUntypedArray.prototype.isType = function(obj) {
      return Array.isArray(obj);
    };

    SchemaUntypedArray.prototype.attribute = function(path) {
      if (isNaN(first)) {
        return throwError("Missing array index");
      } else {
        return null;
      }
    };

    return SchemaUntypedArray;

  })(SchemaBase);

  Schema.Reference = SchemaReference;

  Schema.ObjectID = SchemaObjectID;

  Schema.ID = makeSchemaID;

  Schema.Primitive = SchemaPrimitive;

  Schema.Base = SchemaBase;

  Schema.TypedArray = SchemaTypedArray;

  Schema.UntypedArray = SchemaUntypedArray;

  for (_i = 0, _len = _primitive_schemas.length; _i < _len; _i++) {
    primitive = _primitive_schemas[_i];
    Schema[primitive.name.replace(/^Schema/, '')] = primitive;
  }

  module.exports = Schema;

}).call(this);
