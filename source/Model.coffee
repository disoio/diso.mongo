# NPM dependencies
# ------------------
# [mongodb](https://github.com/mongodb/node-mongodb-native)  
# [mongojs](https://github.com/mafintosh/mongojs)  
# [type-of-is](https://github.com/stephenhandley/type-of-is)  
MongoDB = require('mongodb')
MongoJS = require('mongojs')
Type    = require('type-of-is')

# Local dependencies
# ------------------
# [BaseModel](./BaseModel.html)  
# [DataModel](./DataModel.html)  
# [ReferenceModel](./ReferenceModel.html)  
# [Schema](./Schema.html)  
# [utils](./utils.html)
BaseModel      = require('./BaseModel')
DataModel      = require('./DataModel')
ReferenceModel = require('./ReferenceModel')
Schema         = require('./Schema')
utils          = require('./utils')

# convenience method for throwing prefixed errors
throwError = (msg)->
  throw new Error("diso.mongo.Model: #{msg}")

# Model
# =====
# Extends [DataModel](./DataModel.html) with persistence related 
# methods, most of which delegate to [mongojs](https://github.com/mafintosh/mongojs)
# TODO: remove mongojs, and go direct to [mongodb](https://github.com/mongodb/node-mongodb-native)
#       so can have better access to write concerns sharding etc. 
class Model extends DataModel
  # MongoDB url for the database where this model is stored
  # required
  @db_url : null

  # Collection name defaults to the underscorized class name
  # of the model i.e. BarfMuseum => barf_museum
  @collection_name : null

  # Model.schema
  # ------------
  # Called in the child with an object representing this object's
  # properties. See [Schema](./Schema.html) for a description of 
  # available Schema types 
  #
  # ```coffeescript
  # class Barf extends Model
  #   @schema({
  #     name     : Schema.String
  #     age      : Schema.Integer
  #     contents : [Food]
  #     owner    : Person
  #   })
  # ```
  @schema : (schema)->
    # Ensure that schema has an _id attribute
    unless ('_id' of schema)
      schema._id = Schema.ObjectID

    super(schema)

  # Class method for accessing the backing mongodb collection

  # memoized collection class attr
  @_collection : null

  # @collection
  # -----------
  # retrieves the MongoJS collection backing this model 
  @collection: ()->
    unless @_collection
      unless @db_url
        throwError("#{@name} is missing required db_url")
      
      db = MongoJS(@db_url)

      collection_name = @collection_name || utils.underscorize(@name)
      @_collection = db.collection(collection_name)

    @_collection
  
  # @find
  # ----------
  # Find models that match a given query
  #
  # ```coffeescript
  # Barf.find(
  #   query : {
  #     name   : "pizza"
  #     volume : {
  #       $gt : 100
  #     }
  #   }
  #   callback : (error, barfs)->
  #     console.log('got some barfs')
  # )
  # ```
  #
  # Also allows for shorthand when finding by _id
  # ```coffeescript
  # Barf.find(
  #   _id      : "SOME_ID_HEEERE"
  #   callback : (error, barf)->
  #     console.log('a barf')
  # )
  # ```
  @find: (args)->
    # This method delegates to _findHelper defined below
    args.method = 'find'

    # support _id options for common case of finding by _id  
    # TODO: support _id schema aliases
    if ('_id' of args)

      _id = args._id
      delete args._id

      args.query = { _id : _id }
      args.method = 'findOne'

    @_findHelper(args)
  
  # @findOne
  # --------
  # Find one model that matches a given query 
  @findOne: (args)->
    args.method = 'findOne'
    @_findHelper(args)
  
  # @_findHelper
  # ------------
  # Helper method for finders
  @_findHelper: (args)->
    method     = args.method
    query      = args.query
    callback   = args.callback
    projection = args.projection || {}

    # convert _id strings to ObjectIDs 
    id_is_string = Type(query._id, String)
    wants_object_id = Type(@_schema.attribute('_id'), Schema.ObjectID)
    if (id_is_string and wants_object_id)
      query._id = new MongoDB.ObjectID(query._id)
    
    @collection()[method](query, projection, (error, results)=>
      # Map model constructor over arrays and
      # directly on atom
      unless error
        results = if Type(results, Array)
          new @(doc) for doc in results
        else
          if results
            new @(results)
          else
            null

      callback(error, results)
    )
  
  # @findAndModify
  # --------------
  # Find and modify models that match a given query
  #
  # ```coffeescript
  # Barf.findAndModify(
  #   query : {
  #     state : 'barfing'
  #   }
  #   update : {
  #     $set  : { 
  #       state   : 'still barfing'
  #     }
  #   }
  #   new : true # means return the newly created model 
  #   callback : (response)=>
  #     console.log('got modified barf!')
  # )
  # ```
  @findAndModify : (args)->
    callback = args.callback
    delete args.callback

    @collection().findAndModify(args, (error, doc, last_error)=>
      model = null
      if (!error and doc)
        model = new @(doc)

      callback(error, model)
    )

  # @count
  # ------
  # Count models that match a given query
  # 
  # ```coffeescript
  # Barf.count(
  #   query : {
  #     state : 'so barfing'
  #   }
  #   callback : (error, count)->
  #     console.log(count)
  # )
  # ```
  @count: (args)->
    query    = args.query || {}
    callback = args.callback
    @collection().count(query, callback)

  # @update
  # -------
  # Update models matching a given query
  # 
  # ```coffeescript
  # Barf.update(
  #   query : {
  #     state : 'barfing'
  #   }
  #   update : {
  #     $set : {
  #       state : 'so barfed'
  #     }
  #   }
  #   callback : (error)->
  #     console.log('hi')
  # )
  # ```
  @update : (args)->
    query    = args.query
    update   = args.update
    callback = args.callback
    options  = args.options || {}
    
    @collection().update(query, update, options, callback)

  @makeOneOrMany : (objs)->
    is_array = Type(objs, Array) 
    
    unless is_array
      objs = [objs]

    models = []
    for obj in objs
      unless Type.instance(obj, BaseModel)
        obj = new @(obj)
      models.push(obj)

    if is_array
      models
    else
      models[0]

  # the underlying insert method on the collection can accept 
  # either an array or a single object to insert as its first 
  # argument. we map it/them to an model objects and then 
  # call .data to get the underlying data to insert
  @insert : (args)->
    data     = args.data
    callback = args.callback

    models = @makeOneOrMany(data)
    
    data = if Type(models, Array)
     (m.data() for m in models)
    else 
      models.data()

    @collection().insert(data, (error, docs)=>
      unless error
        docs = @makeOneOrMany(docs)

      callback(error, docs)
    )

  id : ()->
    @_id

  insert : (callback)->
    @constructor.insert(
      data     : @
      callback : callback
    )

  update : (args)->
    args.query = { _id : @_id }
    @constructor.update(args)

  save: (callback)->
    if @beforeSave
      @beforeSave()

    error = @validate()
    if error
      return callback(error)

    collection = @constructor.collection()

    collection.save(@data(), (error, doc)=>
      if (!error and doc)
        @_id = doc._id

      callback(error)
    )

  remove: (callback)->
    collection = @constructor.collection()
    selector = { _id : @_id }
    collection.remove(selector, {safe: true}, callback)

  reference : (attributes)->
    unless Type(attributes, Array)
      attributes = [attributes]

    new ReferenceModel(
      model      : @
      attributes : attributes
    )

  @reference : (attributes)->
    if attributes
      unless Type(attributes, Array)
        attributes = [attributes]
    else
      throwError("Must specify attributes to reference")

    new Schema.Reference(
      model      : @
      attributes : attributes
    )

module.exports = Model