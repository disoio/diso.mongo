MongoDB = require('mongodb')
Type    = require('type-of-is')

BaseModel = require('./BaseModel')
utils     = require('./utils')

class SchemaBase
  attribute : (path)->
    null

# SchemaPrimitive
# ---------------
# 
# The lowest level primitive Schema types
# These get exported on SchemaObject class

class SchemaPrimitive extends SchemaBase
  constructor : (@Type)->
    super()
    
  cast : (obj)->
    if (@isType(obj) or (obj is null) or (obj is undefined))
      obj
    else
      new @Type(obj)
  
  isType : (obj)->
    Type(obj, @Type)

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

class SchemaObjectID extends SchemaPrimitive
  constructor :()->
    super(MongoDB.ObjectID)

  # temp fix.. 
  isType : (obj)->
    Type.string(obj) is 'ObjectID'

class SchemaRegExp extends SchemaPrimitive
  constructor :()->
    super(RegExp)

class SchemaString extends SchemaPrimitive
  constructor :()->
    super(String)

class SchemaSymbol extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Symbol)

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
  SchemaObjectID
  SchemaRegExp
  SchemaString
  SchemaSymbol
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

    @Model  = opts.model
    schema  = opts.schema
    
    options = if ('options' of opts) 
      opts.options
    else
      {}

    utils.rmerge(options, {
      strict : true
    })

    @strict = options.strict
    @add_id = options.add_id

    if (('_id' not in schema) and @add_id)
      schema._id = SchemaObjectID
    
    @processed_schema = @_process(schema)

  _process : (spec)->
    processed = {}
    
    for attr, SchemaType of spec
      if Array.isArray(SchemaType)
        val = if (SchemaType.length is 0)
          # if schema value is an Array with no arguments 
          # create an untyped array that doesn't cast
          new SchemaUntypedArray()
        else
          # if schema value is Array with single value, assume 
          # that value is the type, and cast using it
          SchemaType = this._processAtom(SchemaType[0])
          unless SchemaType
            throw new Error("diso.mongo.Schema: Invalid schema type for field: #{attr}")
          new SchemaTypedArray(SchemaType)
        
        processed[attr] = val

      else
        SchemaType = this._processAtom(SchemaType)

        unless SchemaType
          throw new Error("diso.mongo.Schema: Invalid schema type for field: #{attr}")
        
        processed[attr] = SchemaType
    
    processed
  
  # atoms are models, primitive schemas or primitive types  
  _processAtom : (SchemaType)->
    if (SchemaType is undefined) 
      return null
     
    if (SchemaType in _primitive_schemas)
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

  cast : (obj)->
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
        unless @strict
          data[k] = v
    
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
      
    
Schema.Reference = SchemaReference

# attach the primitive schemas to Schemas
for primitive in _primitive_schemas
  Schema[primitive.name.replace(/^Schema/, '')] = primitive

module.exports = Schema