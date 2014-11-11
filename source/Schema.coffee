# NPM dependencies
# ------------------
# [mongodb](https://github.com/mongodb/node-mongodb-native)  
# [type-of-is](https://github.com/stephenhandley/type-of-is)  
MongoDB = require('mongodb')
Type    = require('type-of-is')

# Local dependencies
# ------------------
# [BaseModel](./BaseModel.html)  
# [ReferenceModel](./ReferenceModel.html)  
# [utils](./utils.html)  
BaseModel      = require('./BaseModel')
ReferenceModel = require('./ReferenceModel')
utils          = require('./utils')

# throwError
# ----------
# Convenience method for throwing errors in this class
throwError = (msg)->
  msg = "diso.mongo.Schema: #{msg}"
  throw new Error(msg)

# SchemaBase
# ==========
# This is the class at the root of the Schema hierarchy. It
# has a simple interface consiting of a constructor that accepts
# a type, a method isType for testing whether an arbitrary
# object is the type of the schema, and finally a cast method
# that converts an object into an object of this type
class SchemaBase
  # the type for this schema
  type : null

  # constructor
  # -----------
  # Create a Schema instance
  #
  # ### required args
  # **type** : type for this schema
  constructor : (type)->
    if type
      @type = type

  # attribute
  # ---------
  # A stub method that Schema, SchemaTypedArray, and 
  # SchemaUntypedArray override to retrieve the schema for
  # attributes they contain
  #
  # ### required args
  # **path** : path for the attribute to get
  attribute : (path)->
    null

  # isType
  # ------
  # Test whether an object is of the type that this schema
  # object holds. Some descendants override this for custom
  # type checking
  # 
  # ### required args
  # **obj** : object to test
  isType : (obj)->
    if @type
      Type(obj, @type)
    else
      true

  # cast
  # ------
  # Convert an object to be of this Schema's type. Some
  # descendants override for custom behavior
  # 
  # ### required args
  # **obj** : object to cast
  cast : (obj)->
    unless @type
      return obj

    if ((obj is null) or (obj is undefined))
      return null

    if (@isType(obj))
      obj
    else
      new @type(obj)
      
# SchemaID
# ========
# Representing the primary id used to identify an object.
# This is the base Schema type used for ids
#
# Schemas definations that don't specify an _id will use
# use MongoDB.ObjectID by default.
#
# However, when the user wants to have a different id 
# source, they can use the makeSchemaID function which 
# gets exported as Schema.ID to create a custom SchemaType
# for _id that can have an alias, disabled autogeneration,
# or custom generation logic for ids. 
#
# Most of the time makeSchemaID should be sufficient to 
# create extensions, but in the case where the user wants
# access to this base class, they can do so via using
# Schema.ID.Base
class SchemaID extends SchemaBase
  # if true, autogenerate ids
  auto  : false

  # optional alias for _id
  alias : null

  # generate an id
  generate : ()->
    throwError("Must define generate method from SchemaID")

# makeSchemaID
# ------------
# This function returns constructors for classes that extend
# SchemaID and can be used for object's primary _id
# 
# ### required args
# **type** : the type for _id
# 
# ### optional args
# **alias** : alias for _id
#
# **gen** : function used for generating ids
makeSchemaID = (args)->  
  S = class extends SchemaID

  PrimitiveSchemaType = _checkPrimitiveSchemaType(args.type)
  if PrimitiveSchemaType
    S.prototype.type = new PrimitiveSchemaType().type
  else
    throwError("SchemaID type must be a Schema Primitive")

  if ('alias' of args)
    S.prototype.alias = args.alias
  
  S.prototype.auto = if args.gen
    unless Type(args.gen, Function)
      throwError("SchemaID gen must be function")
    S.prototype.generate = args.gen
    true
  else
    false

  S

makeSchemaID.Base = SchemaID

# SchemaObjectID
# ==============
# Default SchemaID wrapping MongoDB.ObjectID
class SchemaObjectID extends SchemaID
  type : MongoDB.ObjectID
  auto : true

  # generate 
  # --------
  generate : ()->
    new MongoDB.ObjectID()

  # isType
  # ------
  # hack temp
  # TODO: fix dis
  isType : (obj)->
    Type.string(obj) is 'ObjectID'

# SchemaPrimitive
# ===============
# Base class for all javascript primitive type schemas
# Also extends some MongoDB-provided primitives like
# Binary, Code, DBRef, Double, Long, Symbol
class SchemaPrimitive extends SchemaBase

# SchemaBinary
# ============
# Schema for MongoDB.Binary
class SchemaBinary extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Binary)

# SchemaBoolean
# =============
# Schema for Boolean
class SchemaBoolean extends SchemaPrimitive
  constructor :()->
    super(Boolean)

# SchemaCode
# ==========
# Schema for MongoDB.Code
class SchemaCode extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Code)

# SchemaDate
# ==========
# Schema for Date
class SchemaDate extends SchemaPrimitive
  constructor : ()->
    super(Date)

# SchemaDBRef
# ===========
# Schema for MongoDB.DBRef
class SchemaDBRef extends SchemaPrimitive
  constructor :()->
    super(MongoDB.DBRef)

# SchemaDouble
# ============
# Schema for MongoDB.Double
class SchemaDouble extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Double)

# SchemaFloat
# ===========
# Schema for Number that gets parsed as float
class SchemaFloat extends SchemaPrimitive
  constructor :()->
    super(Number)

  cast : (obj)->
    parseFloat(obj)

# SchemaInteger
# =============
# Schema for Number that gets parsed as int
class SchemaInteger extends SchemaPrimitive
  constructor :()->
    super(Number)

  cast : (obj)->
    parseInt(obj)

# SchemaLong
# ==========
# Schema for MongoDB.Long
class SchemaLong extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Long)

# SchemaObject
# ============
# Schema for plain js object
class SchemaObject extends SchemaPrimitive
  constructor : ()->
    super(Object)

# SchemaRegExp
# ============
# Schema for RegExp
class SchemaRegExp extends SchemaPrimitive
  constructor :()->
    super(RegExp)

# SchemaString
# ============
# Schema for String
class SchemaString extends SchemaPrimitive
  constructor :()->
    super(String)

# SchemaSymbol
# ============
# Schema for MongoDB.Symbol
class SchemaSymbol extends SchemaPrimitive
  constructor :()->
    super(MongoDB.Symbol)

# SchemaUntyped
# =============
# Schema for attribute without a type
class SchemaUntyped extends SchemaPrimitive

# array of primitive schemas used in lookup and
# casting of primitive types
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

# _schemaTypeForPrimitive
# -----------------------
# This is used so to lookup the SchemaType for a 
# javascript or mongodb primitive.
_schemaTypeForPrimitive = (()->
  _primitive_types = _primitive_schemas.map((PS)->
    ps = new PS()
    ps.type
  )
  
  (type)->
    index = _primitive_types.indexOf(type)
    if (index is -1)
      null
    else
      _primitive_schemas[index]
)()

# _checkPrimitiveSchemaType
# -------------------------
# Make sure a SchemaType is primitive. Returns null if not
# 
# ### required args
# **schema_type** : the schema type to check
_checkPrimitiveSchemaType = (schema_type)->
  if (schema_type in _primitive_schemas)
    return schema_type

  PrimitiveSchemaType = _schemaTypeForPrimitive(schema_type)
  
  if PrimitiveSchemaType
    PrimitiveSchemaType
  else
    null

# SchemaReference
# ===============
# This is used in schema entries that reference some model
# so that some of their data (along with their _id) can be
# denormalized within another model.
#
# In practice, this is used in schema definition like
# SomeModel.reference(['model', 'attrs', 'to', 'denorm'])
class SchemaReference extends SchemaBase
  # constructor
  # -----------
  # ### required args
  # **model** : the model constructor to reference
  #
  # **attributes** : attributes to denormalize. _id will be
  #                  automatically included
  constructor : (data)->
    @Model      = data.model
    @attributes = data.attributes

    unless Type(@attributes, Array)
      @attributes = [@attributes]

    # ensure _id is present for dereferencing
    unless ('_id' of @attributes)
      @attributes.push('_id')

  # cast 
  # ----
  cast : (obj)->
    if Type.instance(obj, ReferenceModel)
      unless Type.instance(obj.Model, @Model)
        throwError("Can't cast reference of type #{obj.Model.name} to #{@Model.name}")

      # this is probably overkill
      obj.attributes = @attributes
      return obj

    unless Type.instance(obj, @Model)
      obj = new @Model(obj)

    new ReferenceModel(
      model      : obj
      attributes : @attributes
    )


# SchemaModel
# ===========
# this is the object that gets exported and whose
# constructor gets called via Model.schema()
class SchemaModel extends SchemaBase
  # constructor
  # -----------
  # create an instance and attach the associated model, 
  # processing the passed schema definition in the process
  #
  # ### required args
  # **schema** : the schema definition to process and
  #              use for the passed model
  #
  # **model** : the model this schema belongs to
  constructor : (args)->
    super()

    schema   = args.schema
    @Model   = args.model

    @processed_schema = @_process(schema)

  # configuration for this schema
  _config : {
    # 
    strict : false
  }

  # config
  # ------
  # Configure properties of this schema
  #
  # ### required args
  # currently only support config arg is 'strict'
  config : (args)->
    for k,v of args
      unless (k of @_config)
        valid_attrs = Object.keys(@_config).join(', ')
        msg = "Invalid config attribute: #{k}. Valid attributes are #{valid_attrs}"
        throwError(msg)

      @_config[k] = v

  # _process
  # --------
  # Process the schema definition
  # 
  # ### required args
  # **definition** : schema definition to process
  _process : (definition)->
    processed = {}

    # helper for throwing attribute errors
    _throwError = (attr)->
      throwError("Invalid schema type for field: #{attr}")
    
    for attr, type of definition
      unless type
        _throwError(attr)

      processed[attr] = if Array.isArray(type)
        # process schema types that are arrays
        if (type.length is 0)
          # if schema value is an Array with no arguments 
          # create an untyped array that doesn't cast
          new SchemaUntypedArray()
        
        else
          # if schema value is Array with single value, assume 
          # that value is the type, process it as an atom, and
          # use the result as the type for the array schema type
          type = @_processAtom(type[0])
          
          unless type
            _throwError(attr)

          new SchemaTypedArray(type)  
      
      else
        # otherwise process the type as an atom
        schema = @_processAtom(type)

        unless schema
          _throwError(attr)

        schema
    
    processed

  # _processAtom
  # ------------
  # process schema atoms (models, primitive schemas, primitive types)
  # and return the schema instance for that attribute. otherwise return
  # null to indicate failure to process successfully
  #
  # ### required args
  # **type** : the schema type to process
  _processAtom : (type)->
    if (type is undefined)
      null

    else if Type(type, SchemaReference)
      # TODO : standardize so Reference constructor called here???
      type

    else if Type.extension(type, SchemaID)
      new type()

    else if Type.extension(type, BaseModel)
      # models already have had their schema processed via their
      # own own call to Model.schema, so just return their 
      # instance of this class
      type._schema

    else
      # for primitives check if there's a match, otherwise null
      PrimitiveType = _checkPrimitiveSchemaType(type)
      if PrimitiveType 
        new PrimitiveType()
      else
        null
  
  # isType
  # ------
  isType : (obj)->
    # Object is this type if it is the underlying model's type
    Type(obj, @Model)

  # cast
  # ----
  cast : (obj)=>
    # if the obj is already an instance of this model, just
    # return it as is
    if @isType(obj)
      return obj

    # data that will be passed to the model's constructor below
    data = {}

    for k, v of obj
      if @processed_schema.hasOwnProperty(k)
        # if this key is in the processed schema object,
        # get its associated schema
        schema = @processed_schema[k]

        unless (schema instanceof SchemaBase)
          throwError("Invalid schema for #{k}: #{schema}")
        
        try
          data[k] = if Type(schema, SchemaModel)
            # when the schema attribute for this key is a SchemaModel
            # then, unless it's an instance of this model, create
            # an instance with the value
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
        # if key is not in the processed schema, add it to the
        # data only if this schema isn't strict
        unless @_config.strict
          data[k] = v
    
    # if this schema has an _id and the data is missing it
    # generate it from the 
    if ('_id' of @processed_schema)
      id_schema = @processed_schema._id

      if (id_schema.auto and (!('_id' of data)))
        data._id = id_schema.generate(data)

    data

  # attribute
  # ---------
  # Retrieve the schema for the attribute at path
  # 
  # ### required args
  # **path** : path for the attribute
  attribute : (path)->
    # recursively shift off pieces of the path and
    # retrive their schema
    [first, rest] = utils.shiftPath(path)
    next = @processed_schema[first]

    if rest
      next.attribute(rest)
    else
      next

# SchemaTypedArray
# ================
# Used to represent an attribute that is an array of 
# elements all of a specific type
class SchemaTypedArray extends SchemaBase

  # cast
  # ----
  cast : (values)->
    # values must be an array
    unless Array.isArray(values)
      throwError("Expecting array")
    
    values.map((value)=>
      # for each element in the array, cast it to an 
      # instance of this type
      unless @type.isType(value)
        if Type(@type, SchemaModel)
          Model = @type.Model
          new Model(value)
        else
          @type.cast(value)
      else
        value
    )
  
  # isType 
  # ------
  # TODO : should test type of the subelements???
  isType : (obj)->
    Array.isArray(obj)

  # attribute
  # ---------
  attribute : (path)->
    parts = utils.splitPath(path)
    first = parts.shift()

    if isNaN(first)
      throwError("Missing array index")
    else
      first = parts.shift() # get next part (skip the array index)
      next = @type.attribute(first)

      if (parts.length > 0)
        next.attribute(parts)
      else
        next

# SchemaUntypedArray
# ==================
# Used to represent an attribute that is an array of 
# elements of any type
class SchemaUntypedArray extends SchemaBase
  # cast
  # ----
  cast : (values)->
    unless Array.isArray(values)
      throwError("Expecting array for key:#{k}")
    values
  
  # isType
  # ------
  isType : (obj)->
    Array.isArray(obj)

  # attribute
  # ---------
  attribute : (path)->
    if isNaN(first)
      throwError("Missing array index")
    else
      null

SchemaModel.Reference    = SchemaReference
SchemaModel.ObjectID     = SchemaObjectID
SchemaModel.ID           = makeSchemaID
SchemaModel.Primitive    = SchemaPrimitive
SchemaModel.Base         = SchemaBase
SchemaModel.TypedArray   = SchemaTypedArray
SchemaModel.UntypedArray = SchemaUntypedArray

# attach the primitive schemas to Schemas
for primitive in _primitive_schemas
  SchemaModel[primitive.name.replace(/^Schema/, '')] = primitive

module.exports = SchemaModel