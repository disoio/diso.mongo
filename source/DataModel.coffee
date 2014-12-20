# NPM dependencies
# ------------------
# [type-of-is](https://github.com/stephenhandley/type-of-is)  
# [mongodb](https://github.com/mongodb/node-mongodb-native)  
# [async](https://github.com/caolan/async)  
Type    = require('type-of-is')
MongoDB = require('mongodb')
Async   = require('async')

# Local dependencies
# ------------------
# [BaseModel](./BaseModel.html)  
# [ReferenceModel](./ReferenceModel.html)  
# [Schema](./Schema.html)  
# [utils](./utils.html)  
BaseModel      = require('./BaseModel') 
ReferenceModel = require('./ReferenceModel')
Schema         = require('./Schema')
utils          = require('./utils')

# throwError
# ----------
# convenience method for throwing errors in this class
throwError = (msg)->
  throw new Error("diso.mongo.DataModel: #{msg}")

# DataModel
# =========
# This class is the base of the model hierarchy, taking
# care of data access and schema enforcement / casting.
class DataModel extends BaseModel

  # constructor
  # -----------
  # ###required args
  # **data** : the raw data being used to create this model
  constructor: (data)->
    @_data = @constructor.cast(data)

  # *SCHEMA METHODS*
  # ----------------

  # @schema
  # -------
  # Called by child classes to define their schema. This
  # method gets passed an object defining the child class'
  # schema attributes. This is processed and the result is 
  # used for data casting and validation
  #
  # ###required args
  # **schema** : plain object defining schema attributes
  @schema : (schema)->
    @_schema = new Schema({
      schema  : schema
      model   : @
    })

    # defines accessors for schema attributes as long as
    # those attributes don't already exist.
    for k,v of schema
      do (k)=>
        unless k of @prototype
          Object.defineProperty(@prototype, k, {
            get: ()->
              @_data[k]

            set: (val)->
              @_dataPath(k, val)
          })

    # if the schema specifies an alias for the _id property, 
    # an associated property is defined using the alias 
    pschema = @_schema.processed_schema
    @id_has_alias = (('_id' of pschema) and pschema._id.alias)

    if @id_has_alias
      alias = pschema._id.alias

      if alias of @prototype
        throwError("Invalid alias: #{alias}, conflicts with exist property")
      
      Object.defineProperty(@prototype, alias, {
        get : ()->
          @_data._id

        set : (val)->
          @_dataPath('_id', val)
      })

    @_schema

  # @cast
  # -----
  # This is called by the constructor to cast data using
  # this model's schema. After handling _id aliasing, this
  # method delegates the cast to this model's schema object.
  @cast: (data)->    
    unless @_schema
      throwError("@schema has not been called for #{@name}")
    
    # if the id has an alias, we set _id from it and then 
    # delete the alias from the data so it isn't duped
    if @id_has_alias
      alias = @_schema.processed_schema._id.alias
      
      if (alias of data)
        if ('_id' of data)
          throwError("Cannot pass _id and its alias, #{alias}, as data attributes")
        
        data._id = data[alias]
        delete data[alias]

    @_schema.cast(data)

  # @mixin
  # ------
  # use dotmix mixins 
  # https://github.com/stephenhandley/dotmix
  @mixin : (mixins)->
    unless Type(mixins, Array)
      mixins = [mixins]

    for mixin in mixins
      mixin.mix(into : @)

  # id 
  # --
  # Return this models _id
  id : ()->
    @_id

  # attributeExists
  # ---------------
  # check whether this model's schema defines an attribute 
  # with the given path
  attributeExists: (path)->
    utils.splitPath(path)

  # attributeSchema
  # ---------------
  # Get the schema associate with this model's attribute at
  # the given path
  attributeSchema: (path)->
    @constructor._schema.attribute(path)

  # requireAttribute
  # ----------------
  # Throw an error if this model's schema doesn't define an 
  # attribute with the given name
  requireAttribute: (attr)->
    unless @attributeExists(attr)
      throwError("Missing attribute: #{attr}")

  # *DATA ACCESS METHODS*
  # ---------------------
  
  # data 
  # ----
  # Convenience accessor for this model's underlying data
  # that performs different set/get behaviors depending on 
  # the arity and type signature of its arguments
  #
  # ()               : return model and its embedded models'
  #                    underlying data as plain object
  #
  # (<String>)       : read the attribute at the string path
  #
  # (<Array>)        : read the attributes at each string 
  #                    in array
  #
  # (<Object>)       : use each <String>,<val> pair of 
  #                    attribute path & value in object to 
  #                    set this model's data
  #
  # (<String>,<val>) : set the attribute at the string path 
  #                    to val
  data: (args...)->
    # Full read
    # calling with no arguments returns the complete, underlying data object
    if (args.length is 0)
      return @_map()

    if (args.length is 1)
      arg = args[0]

      # Attribute read
      # calling with single String argument returns that attribute's value
      switch Type(arg)
        when String
          return @_dataPath(arg)

        # Filtered read
        # with single Array argument, return a filtered version of the 
        # underlying data object with only the requested attributes
        when Array
          result = {}
          for attr in arg
            result[attr] = @_dataPath(attr)
          return result

        # write
        when Object
          for k,v of arg
            @_dataPath(k, v)
          return this

    if (args.length is 2)
      # Attribute write
      # treat two arguments as a write of the given attribute
      this._dataPath(args[0], args[1])
      return this

    throwError("Invalid argument to .data")


  # deflate
  # -------
  # Called by server to create json object for transfer over
  # the wire
  #
  # ### required args
  # **model_key** : The attribute name used to hold the model's 
  #                 constructor name to be used by inflate
  #
  # ### optional args
  # **attrs** : Only include the specified attributes
  deflate : (args)->
    unless ('model_key' of args)
      throwError("deflate call missing 'model_key' arg")

    @_map(args)

  # set
  # ---
  # Convenience alias for .data(path, value)
  set: (path, value)->
    @_dataPath(path, value)

  # get
  # ---
  # Convenience alias for .data(path)
  get: (path)->
    @_dataPath(path)

  # *STUB METHODS*
  # --------------

  # validate
  # --------
  # Child classes can override this method to perform model
  # validation. Should return error if validation fails, or
  # null if validation succeeded
  validate: ()->
    # TODO : use https://github.com/hapijs/joi
    return null

  # *INTERNAL METHODS*
  # ------------------

  # _map
  # ----
  # Traverses this model and its embedded models and reference
  # models to produce a plain object of its data.
  #
  # This is called via .data() and .deflate(). The difference 
  # between the two are that data is primarily used before
  # persisting to the database, while deflate is called prior
  # to transfer over the wire to the client. In the latter case
  # the model name is added as an additional attribute for use
  # in inflation on the other side of the wire
  #
  # ###optional args
  # **model_key** : If present, specifies the attribute name 
  #                 used to hold this model's constructor name
  #
  # **attrs**     : Only include the specified attributes
  _map : (args)->
    args ?= {}
    
    model_key = if ('model_key' of args)
      args.model_key
    else
      null

    attrs = if ('attrs' of args)
      args.attrs
    else
      null

    # atom function that gets mapped across the object
    getData = (v)->
      is_model     = Type.instance(v, BaseModel)
      is_reference = Type.instance(v, ReferenceModel)

      if (is_model or is_reference)
        v._map(
          attrs     : attrs
          model_key : model_key
        )
      else
        v

    result = {}

    for k,v of @_data
      if (!attrs or (k in attrs))
        result[k] = if Type(v, Array)
          v.map(getData)
        else
          getData(v)

    # add model key if arg present
    if model_key
      result[model_key] = @constructor.name

    result
  
  # _dataPath
  # ---------
  # Get or set the value at path.
  # 
  # ### required args 
  # **path** : can be simple string or composite path
  #            consisting of . separated parts (in order 
  #            to access subdocs, arrays, embedded models
  # 
  # ### optional args
  # **value** : if value is specified, use it to set the
  #             attribute at path, otherwise return that
  #             attribute's value
  _dataPath: (path, value = null)->
    unless Type(path, String)
      throwError("Must use string as path accessor") 

    # unpack the path 
    parts = utils.splitPath(path)

    # if a value is passed this is a set    
    if value  
      schema = @constructor._schema.attribute(path)

      data = @_data
      last = parts.pop()

      for part in parts
        data = data[part]

      data[last] = if schema
        # if this attr's schema is a model, use that 
        # model's constructor which will in turn call 
        # cast. otherwise call cast directly.
        if Type(schema, Schema)
          # only cast if it isn't already the right type
          if Type(value, schema.Model)
            value
          else
            new schema.Model(value)
        else
          schema.cast(value)
      else
        value

    # otherwise it's a get
    else
      data = @_data

      for part in parts
        data = data[part]

      return data


module.exports = DataModel