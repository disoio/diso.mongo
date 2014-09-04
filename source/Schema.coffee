MongoDB = require('mongodb')
Type    = require('type-of-is')

BaseModel      = require('./BaseModel')
ReferenceModel = require('./ReferenceModel')
utils          = require('./utils')

throwError = (msg)->
  msg = "diso.mongo.Schema: #{msg}"
  throw new Error(msg)

class SchemaBase
  Type : null

  constructor : (type)->
    if type
      @Type = type

  attribute : (path)->
    null

  isType : (obj)->
    if @Type
      Type(obj, @Type)
    else
      true

  cast : (obj)->
    unless @Type
      return obj

    if ((obj is null) or (obj is undefined))
      return null

    if (@isType(obj))
      obj
    else
      new @Type(obj)
      

class SchemaID extends SchemaBase
  auto  : false
  alias : null

  generate : ()->
    throwError("Must define generate method from SchemaID")

makeSchemaID = (args)->  
  S = class extends SchemaID

  PrimitiveSchemaType = _checkPrimitiveSchemaType(args.type)
  if PrimitiveSchemaType
    S.prototype.Type = new PrimitiveSchemaType().Type
  else
    throwError("SchemaID type must be a Schema Primitive")

  if ('alias' of args)
    S.prototype.alias = args.alias
  
  S.prototype.auto = if ('gen' of args)
    S.prototype.generate = args.gen
    true
  else
    false

  S

makeSchemaID.Base = SchemaID

class SchemaObjectID extends SchemaID
  Type : MongoDB.ObjectID
  auto : true

  generate : ()->
    new MongoDB.ObjectID()

  # hack temp
  # TODO: fix dis
  isType : (obj)->
    Type.string(obj) is 'ObjectID'

# SchemaPrimitive
# ---------------
# 
# The lowest level primitive Schema types
# These get exported on SchemaObject class

class SchemaPrimitive extends SchemaBase

class SchemaBinary extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Binary)

class SchemaBoolean extends SchemaPrimitive
  constructor :()->
    super(Boolean)

class SchemaCode extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Code)

class SchemaDate extends SchemaPrimitive
  constructor : ()->
    super(Date)

class SchemaDBRef extends SchemaPrimitive
  constructor :()->
    super(MongoDB.DBRef)

class SchemaDouble extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Double)

class SchemaFloat extends SchemaPrimitive
  constructor :()->
    super(Number)

  cast : (obj)->
    parseFloat(obj)

class SchemaInteger extends SchemaPrimitive
  constructor :()->
    super(Number)

  cast : (obj)->
    parseInt(obj)

class SchemaLong extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Long)

class SchemaObject extends SchemaPrimitive
  constructor : ()->
    super(Object)

class SchemaRegExp extends SchemaPrimitive
  constructor :()->
    super(RegExp)

class SchemaString extends SchemaPrimitive
  constructor :()->
    super(String)

class SchemaSymbol extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Symbol)

class SchemaUntyped extends SchemaPrimitive

_primitive_schemas = [
  SchemaBoolean
  SchemaBinary
  SchemaCode
  SchemaDate
  SchemaDBRef
  SchemaDouble
  SchemaFloat
  SchemaInteger
  SchemaLong
  SchemaObject
  SchemaRegExp
  SchemaString
  SchemaSymbol
  SchemaUntyped
]

_schemaTypeForPrimitive = (()->
  _primitive_types = _primitive_schemas.map((PS)->
    ps = new PS()
    ps.Type
  )
  
  (_Type)->
    index = _primitive_types.indexOf(_Type)
    if (index is -1)
      null
    else
      _primitive_schemas[index]
)()

_checkPrimitiveSchemaType = (SchemaType)->
  if (SchemaType in _primitive_schemas)
    return SchemaType

  PrimitiveSchemaType = _schemaTypeForPrimitive(SchemaType)
  
  if PrimitiveSchemaType
    PrimitiveSchemaType
  else
    null

class SchemaReference extends SchemaBase
  constructor : (data)->
    @Model      = data.model
    @attributes = data.attributes

  cast : (obj)->
    if Type.instance(obj, ReferenceModel)
      unless Type.instance(obj.Model, @Model)
        throwError("Can't cast reference of type #{obj.Model.name} to #{@Model.name}")

      # this is probably overkill
      obj.attributes = @attributes
      return obj

    unless Type.instance(obj, @Model)
      obj = new @Model(obj)
      
    obj.reference(@attributes)


# Schema
# ------------
#
# this is the object that gets exported and whose
# constructor gets called via Model

class Schema extends SchemaBase  
  constructor : (args)->
    super()

    schema   = args.schema
    @Model   = args.model

    @processed_schema = @_process(schema)

  _config : {
    strict : false
  }

  config : (args)->
    for k,v of args
      unless (k of @_config)
        valid_attrs = Object.keys(@_config).join(', ')
        msg = "Invalid config attribute: #{k}. Valid attributes are #{valid_attrs}"
        throwError(msg)

      @_config[k] = v

  _process : (spec)->
    processed = {}

    _throwError = (attr)->
      throwError("Invalid schema type for field: #{attr}")
    
    for attr, SchemaType of spec
      unless SchemaType
        _throwError(attr)

      processed[attr] = if Array.isArray(SchemaType)
        if (SchemaType.length is 0)
          # if schema value is an Array with no arguments 
          # create an untyped array that doesn't cast
          new SchemaUntypedArray()
        
        else
          # if schema value is Array with single value, assume 
          # that value is the type, and cast using it
          SchemaType = @_processAtom(SchemaType[0])
          unless SchemaType
            _throwError(attr)
          new SchemaTypedArray(SchemaType)  
      
      else
        schema = @_processAtom(SchemaType)

        unless schema
          _throwError(attr)

        schema
    
    processed

  # atoms are models, primitive schemas or primitive types  
  _processAtom : (SchemaType)->
    if (SchemaType is undefined) 
      null

    else if Type(SchemaType, SchemaReference)
      # TODO : standardize so Reference constructor called here?
      SchemaType

    else if Type.extension(SchemaType, SchemaID)
      new SchemaType()

    else if Type.extension(SchemaType, BaseModel)
      SchemaType._schema

    else
      PrimitiveType = _checkPrimitiveSchemaType(SchemaType)
      if PrimitiveType 
        new PrimitiveType()
      else
        null
  
  isType : (obj)->
    Type(obj, @Model)

  cast : (obj)=>
    if @isType(obj)
      return obj

    data = {}

    for k, v of obj
      if @processed_schema.hasOwnProperty(k)
        schema = @processed_schema[k]

        unless (schema instanceof SchemaBase)
          throwError("Invalid schema for #{k}: #{schema}")
        
        try
          data[k] = if Type(schema, Schema)
            Model = schema.Model
            if Type(v, Model)
              v
            else
              new Model(v)
          else
            schema.cast(v)

        catch error
          throwError("#{k}: #{error}")
                          
      else
        unless @_config.strict
          data[k] = v
    
    if ('_id' of @processed_schema)
      id = @processed_schema._id

      if (id.auto and (!('_id' of data)))
        data._id = id.generate(data)

    data

  attribute : (path)->
    [first, rest] = utils.shiftPath(path)
    next = @processed_schema[first]

    if rest
      next.attribute(rest)
    else
      next
    

class SchemaTypedArray extends SchemaBase
  constructor : (@Type)->
    super()

  cast : (values)->
    unless Array.isArray(values)
      throwError("Expecting array")
    
    values.map((value)=>
      unless @Type.isType(value)
        if Type(@Type, Schema)
          Model = @Type.Model
          new Model(value)
        else
          @Type.cast(value)
      else
        value
    )
  
  # TODO : should test type of the subelements?
  isType : (obj)->
    Array.isArray(obj)

  attribute : (path)->
    parts = utils.splitPath(path)
    first = parts.shift()

    if isNaN(first)
      throwError("Missing array index")
    else
      first = parts.shift() # get next part (skip the array index)
      next = @Type.attribute(first)

      if (parts.length > 0)
        next.attribute(parts)
      else
        next


class SchemaUntypedArray extends SchemaBase
  cast : (values)->
    unless Array.isArray(values)
      throwError("Expecting array for key:#{k}")
    values
    
  isType : (obj)->
    Array.isArray(obj)

  attribute : (path)->
    if isNaN(first)
      throwError("Missing array index")
    else
      null


Schema.Reference    = SchemaReference
Schema.ObjectID     = SchemaObjectID
Schema.ID           = makeSchemaID
Schema.Primitive    = SchemaPrimitive
Schema.Base         = SchemaBase
Schema.TypedArray   = SchemaTypedArray
Schema.UntypedArray = SchemaUntypedArray

# attach the primitive schemas to Schemas
for primitive in _primitive_schemas
  Schema[primitive.name.replace(/^Schema/, '')] = primitive

module.exports = Schema