MongoDB = require('mongodb')
Type    = require('type-of-is')

BaseModel = require('./BaseModel')
utils     = require('./utils')

class SchemaBase
  Type : null

  constructor : (Type)->
    if Type
      @Type = Type

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
    throw new Error("Must define generate method from SchemaID")

makeSchemaID = (opts)->
  S = class extends SchemaID

  S.prototype.Type  = opts.type
  if ('alias' of opts)
    S.prototype.alias = opts.alias
  
  S.prototype.auto = if ('gen' of opts)
    S.prototype.generate = opts.gen
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

class SchemaInteger extends SchemaPrimitive
  constructor :()->
    super(Number)

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

_schemaForPrimitiveType = (()->
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


class SchemaReference extends SchemaBase
  constructor : (data)->
    @Model      = data.model
    @attributes = data.attributes

  cast : (obj)->
    unless Type.instance(obj, @Model)
      try
        obj = new @Model(obj)
      catch error
        console.error(error)
        throw "Unable to create reference from object of type #{Type(obj)}"

    obj.reference(@attributes)


# Schema
# ------------
#
# this is the object that gets exported and whose
# constructor gets called via Model

class Schema extends SchemaBase  
  constructor : (opts)->
    super()

    schema   = opts.schema
    @Model   = opts.model

    @processed_schema = @_process(schema)

  _config : {
    strict : false
  }

  config : (opts)->
    for k,v of opts
      unless (k of @_config)
        valid_attrs = Object.keys(@_config).join(', ')
        msg = "Invalid config attribute: #{k}. Valid attributes are #{valid_attrs}"
        throw new Error(msg)

      @_config[k] = v

  _process : (spec)->
    processed = {}

    _throwError = (attr)->
      throw new Error("diso.mongo.Schema: Invalid schema type for field: #{attr}")
    
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
      return null
    
    is_primitive = (SchemaType in _primitive_schemas)
    is_schema_id = Type.extension(SchemaType, SchemaID)
    if (is_primitive or is_schema_id)
      return (new SchemaType())

    PrimitiveSchemaType = _schemaForPrimitiveType(SchemaType)
    if PrimitiveSchemaType
      return (new PrimitiveSchemaType())

    if Type(SchemaType, SchemaReference)
      return SchemaType

    # if schema value is a descendant of Model, return a 
    # schema model that casts to that Model
    if Type.extension(SchemaType, BaseModel)
      return SchemaType._schema
    
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
          throw new Error("diso.mongo.Schema: Invalid schema for #{k}: #{schema}")
        
        try
          data[k] = if Type(schema, Schema)
            Model = schema.Model
            new Model(v)
          else
            schema.cast(v)

        catch error
          throw new Error("diso.mongo.Schema: #{k}: #{error}")
                          
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
      throw new Error("diso.mongo.Schema: Expecting array")
    
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
      throw new Error("diso.mongo.Schema: Missing array index")
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
      throw new Error("diso.mongo.Schema: Expecting array for key:#{k}")
      
    values
    
  isType : (obj)->
    Array.isArray(obj)

  attribute : (path)->
    if isNaN(first)
      throw new Error("diso.mongo.Schema: Missing array index")
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