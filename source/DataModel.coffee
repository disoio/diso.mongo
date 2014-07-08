Type    = require('type-of-is')
MongoDB = require('mongodb')

BaseModel = require('./BaseModel') 
Schema    = require('./Schema')
utils     = require('./utils')

class DataModel extends BaseModel
  constructor: (data)->      
    @_data = @constructor.cast(data)

  @schema : (schema)->
    @_schema = new Schema({
      schema  : schema
      model   : @
    })

    for k,v of schema
      do (k)=>
        Object.defineProperty(@prototype, k, {
          get: ()->
            @_data[k]

          set: (val)->
            @_dataPath(k, val)
        })

    @id_has_alias = (('_id' of schema) and schema._id.alias)

    if @id_has_alias
      alias = schema._id.alias

      Object.defineProperty(@prototype, alias, {
        get : ()->
          @_data._id

        set : (val)->
          @_dataPath('_id', val)
      })

    @_schema

  # Cast data via model's schema
  @cast: (data)->
    unless @_schema
      throw new Error("diso.mongo.Model: @schema has not been defined for #{@name}")
    
    # if the id has an alias, we set _id from it and then 
    # delete the alias from the data so it isn't duped
    if @id_has_alias
      id_alias = @schema._id.alias
      if (alias of data)
        data._id = data[alias]
        delete data[alias]

    @_schema.cast(data)

  # check whether this model's schema defines an attribute with the given path
  attributeExists: (path)->
    utils.splitPath(path)

  attributeSchema: (path)->
    @constructor._schema.attribute(path)

  # throw an error if this model's schema doesn't define an attribute with the given name
  requireAttribute: (attr)->
    unless @attributeExists(attr)
      throw new Error("diso.mongo.Model: Missing attribute: #{attr}")

  _map : (include_$model)->
    getData = (v)->
      if Type.instance(v, BaseModel)
        v._map(include_$model)
      else
        v

    result = {}
    for k,v of @_data
      result[k] = if Type(v, Array)
        v.map(getData)
      else
        getData(v)

    if include_$model
      result.$model = @constructor.name

    result

  @deflate : (obj)->
    switch Type(obj)
      when Array
        obj.map(@deflate)

      when Object
        res = {}
        for k,v of obj
          res[k] = @deflate(v) 
        res

      else
        if Type.instance(obj, BaseModel)
          obj.deflate()
        else
          obj

  deflate : ()->
    @_map(true)
  
  # multi-purpose accessor for this model's underlying data
  data: (args...)->
    # Full read
    # calling with no arguments returns the complete, underlying data object
    if (args.length is 0)
      return @_map(false)


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

    throw new Error("diso.mongo.Model: Invalid argument to .data")
    
  _dataPath: (path, value = null)->
    unless Type(path, String)
      throw new Error("diso.mongo.Model: Must use string as path accessor") 

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
        schema.cast(value)
      else
        value

    # otherwise it's a get
    else
      data = @_data

      for part in parts
        data = data[part]

      return data

  # Alias for .data(path, value)
  set: (path, value)->
    @_dataPath(path, value)

  # Alias for .data(path)
  get: (path)->
    @_dataPath(path)

  validate: ()->
    return null

module.exports = DataModel