Type = require('type-of-is')

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
      options : {
        add_id : @add_id
        strict : @strict
      }
    })

    for k,v of schema
      do (k)=>
        Object.defineProperty(@prototype, k, {
          get: ()->
            @_data[k]

          set: (val)->
            @_dataPath(k, val)
        })

  # Cast data via model's schema
  @cast: (data)->
    unless @_schema
      throw new Error("diso.mongo.Model: @schema has not been defined for #{@name}")
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

  toJSON : ()->
    getData = (v)->
      if Type.instance(v, BaseModel)
        v.toJSON()
      else
        v
    
    result = {}
    for k,v of @_data
      result[k] = if Type(v, Array)
        v.map(getData)
      else
        getData(v)

    result
  
  # multi-purpose accessor for this model's underlying data
  data: (args...)->
    # Full read
    # calling with no arguments returns the complete, underlying data object
    if (args.length is 0)
      return @toJSON()

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
          @_dataAdd(arg)
          return this

    if (args.length is 2)
      # Attribute write
      # treat two arguments as a write of the given attribute
      return this._dataPath(args[0], args[1])

    throw new Error("diso.mongo.Model: Invalid argument to .data")

  _dataAdd: (data_obj)-> 
    # pass data_obj through this model's schema and extend the underlying data object with result
    cast_obj = @constructor.cast(data_obj)
    
    
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
        if (data instanceof BaseModel)
          data = data._data

      data[last] = if schema
        schema.cast(value)
      else
        value

    # otherwise it's a get
    else
      data = @_data

      for part in parts
        data = data[part]
        if (data instanceof BaseModel)
          data = data._data

      return data

  set: (attribute, value)->
    @_dataPath(attribute, value)

  get: (attribute)->
    @_dataPath(attribute)

  validate: ()->
    return null

  reference : (attributes)->
    unless Type(attributes, Array)
      attributes = [attributes]

    ref = {
      type : @constructor.name
    }

    for attr in attributes
      ref[attr] = @_dataPath(attr)

  @reference : (attributes)->
    if attributes
      unless Type(attributes, Array)
        attributes = [attributes]
    else
      throw new Error("diso.mongo.Model: Must pass attributes to Model.reference")

    new Schema.Reference(
      Model      : @
      attributes : attributes
    )

module.exports = DataModel