(function() {
  var BaseModel, MongoDB, ReferenceModel, SchemaBase, SchemaBinary, SchemaBoolean, SchemaCode, SchemaDBRef, SchemaDate, SchemaDouble, SchemaFloat, SchemaID, SchemaInteger, SchemaLong, SchemaModel, SchemaObject, SchemaObjectID, SchemaPrimitive, SchemaReference, SchemaRegExp, SchemaString, SchemaSymbol, SchemaTypedArray, SchemaUntyped, SchemaUntypedArray, Type, makeSchemaID, primitive, throwError, utils, _checkPrimitiveSchemaType, _i, _len, _primitive_schemas, _schemaTypeForPrimitive,
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
    SchemaBase.prototype.type = null;

    function SchemaBase(type) {
      if (type) {
        this.type = type;
      }
    }

    SchemaBase.prototype.attribute = function(path) {
      return null;
    };

    SchemaBase.prototype.isType = function(obj) {
      if (this.type) {
        return Type(obj, this.type);
      } else {
        return true;
      }
    };

    SchemaBase.prototype.cast = function(obj) {
      if (!this.type) {
        return obj;
      }
      if ((obj === null) || (obj === void 0)) {
        return null;
      }
      if (this.isType(obj)) {
        return obj;
      } else {
        return new this.type(obj);
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
      S.prototype.type = new PrimitiveSchemaType().type;
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

    SchemaObjectID.prototype.type = MongoDB.ObjectID;

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
      return ps.type;
    });
    return function(type) {
      var index;
      index = _primitive_types.indexOf(type);
      if (index === -1) {
        return null;
      } else {
        return _primitive_schemas[index];
      }
    };
  })();

  _checkPrimitiveSchemaType = function(schema_type) {
    var PrimitiveSchemaType;
    if ((__indexOf.call(_primitive_schemas, schema_type) >= 0)) {
      return schema_type;
    }
    PrimitiveSchemaType = _schemaTypeForPrimitive(schema_type);
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
      if (!Type(this.attributes, Array)) {
        this.attributes = [this.attributes];
      }
      if (!('_id' in this.attributes)) {
        this.attributes.push('_id');
      }
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
      return new ReferenceModel({
        model: obj,
        attributes: this.attributes
      });
    };

    return SchemaReference;

  })(SchemaBase);

  SchemaModel = (function(_super) {
    __extends(SchemaModel, _super);

    function SchemaModel(args) {
      this.cast = __bind(this.cast, this);
      var schema;
      SchemaModel.__super__.constructor.call(this);
      schema = args.schema;
      this.Model = args.model;
      this.processed_schema = this._process(schema);
    }

    SchemaModel.prototype._config = {
      strict: false
    };

    SchemaModel.prototype.config = function(args) {
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

    SchemaModel.prototype._process = function(definition) {
      var attr, processed, schema, type, _throwError;
      processed = {};
      _throwError = function(attr) {
        return throwError("Invalid schema type for field: " + attr);
      };
      for (attr in definition) {
        type = definition[attr];
        if (!type) {
          _throwError(attr);
        }
        processed[attr] = Array.isArray(type) ? type.length === 0 ? new SchemaUntypedArray() : (type = this._processAtom(type[0]), !type ? _throwError(attr) : void 0, new SchemaTypedArray(type)) : (schema = this._processAtom(type), !schema ? _throwError(attr) : void 0, schema);
      }
      return processed;
    };

    SchemaModel.prototype._processAtom = function(type) {
      var PrimitiveType;
      if (type === void 0) {
        return null;
      } else if (Type(type, SchemaReference)) {
        return type;
      } else if (Type.extension(type, SchemaID)) {
        return new type();
      } else if (Type.extension(type, BaseModel)) {
        return type._schema;
      } else {
        PrimitiveType = _checkPrimitiveSchemaType(type);
        if (PrimitiveType) {
          return new PrimitiveType();
        } else {
          return null;
        }
      }
    };

    SchemaModel.prototype.isType = function(obj) {
      return Type(obj, this.Model);
    };

    SchemaModel.prototype.cast = function(obj) {
      var Model, data, error, id_schema, k, schema, v;
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
            data[k] = Type(schema, SchemaModel) ? (Model = schema.Model, Type(v, Model) ? v : new Model(v)) : schema.cast(v);
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
        id_schema = this.processed_schema._id;
        if (id_schema.auto && (!('_id' in data))) {
          data._id = id_schema.generate(data);
        }
      }
      return data;
    };

    SchemaModel.prototype.attribute = function(path) {
      var first, next, rest, _ref;
      _ref = utils.shiftPath(path), first = _ref[0], rest = _ref[1];
      next = this.processed_schema[first];
      if (rest) {
        return next.attribute(rest);
      } else {
        return next;
      }
    };

    return SchemaModel;

  })(SchemaBase);

  SchemaTypedArray = (function(_super) {
    __extends(SchemaTypedArray, _super);

    function SchemaTypedArray() {
      return SchemaTypedArray.__super__.constructor.apply(this, arguments);
    }

    SchemaTypedArray.prototype.cast = function(values) {
      if (!Array.isArray(values)) {
        throwError("Expecting array");
      }
      return values.map((function(_this) {
        return function(value) {
          var Model;
          if (!_this.type.isType(value)) {
            if (Type(_this.type, SchemaModel)) {
              Model = _this.type.Model;
              return new Model(value);
            } else {
              return _this.type.cast(value);
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
        next = this.type.attribute(first);
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

  SchemaModel.Reference = SchemaReference;

  SchemaModel.ObjectID = SchemaObjectID;

  SchemaModel.ID = makeSchemaID;

  SchemaModel.Primitive = SchemaPrimitive;

  SchemaModel.Base = SchemaBase;

  SchemaModel.TypedArray = SchemaTypedArray;

  SchemaModel.UntypedArray = SchemaUntypedArray;

  for (_i = 0, _len = _primitive_schemas.length; _i < _len; _i++) {
    primitive = _primitive_schemas[_i];
    SchemaModel[primitive.name.replace(/^Schema/, '')] = primitive;
  }

  module.exports = SchemaModel;

}).call(this);
