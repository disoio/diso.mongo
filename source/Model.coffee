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

  # memoized collection class attr
  @_collection : null

  # @collection
  # -----------
  # Retrieve the MongoJS collection backing this model 
  @collection: ()->
    unless @_collection
      unless @db_url
        throwError("#{@name} is missing required db_url")
      
      db = MongoJS(@db_url)

      collection_name = @collection_name || utils.underscorize(@name)
      @_collection = db.collection(collection_name)

    @_collection

  # id 
  # --
  # Return this models _id
  id : ()->
    @_id


  # *SCHEMA METHODS*
  # ----------------

  # @schema
  # ------------
  # Called in the child with an object representing this object's
  # properties. See [Schema](./Schema.html) for a description of 
  # available Schema types 
  # 
  # ### required args
  # **schema** : the schema for this model
  #
  # ### example
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

  # @reference
  # ----------
  # Used in schema definition to create a SchemaReference
  # to a model
  # ### required args
  # **attributes** : the attributes to be denormalized and
  #                  stored in the reference subdocument
  #
  # ### example
  # ```coffeescript
  # class Person extends Model
  #   @schema({
  #     username   : Schema.String
  #     avatar_url : Schema.String
  #     passhash   : Schema.String
  #     email      : Schema.String
  #   })
  #     
  # class Barf extends Model
  #   @schema({
  #     name     : Schema.String
  #     age      : Schema.Integer
  #     owner    : Person.reference(['name', 'avatar_url'])
  #   })
  # ```
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


  # *LIFECYCLE METHODS*
  # -------------------
  
  # @find
  # ----------
  # Find models that match a given query
  # ### required args
  # **query** : the mongo query to run. Instead of query
  #             arg can specify **_id** to find by _id
  #
  # **callback** : called to return (error, result) 
  #
  # ### optional args
  # **projection** : subset of fields to find/populate
  #
  # ### example
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
  # ### required args
  # **query** : the mongo query to run. Instead of query
  #             arg can specify **_id** to find by _id
  #
  # **callback** : called to return (error, result) 
  #
  # ### optional args
  # **projection** : subset of fields to find/populate
  #
  # ### example
  # ```coffeescript
  # Barf.findOne(
  #   query : {
  #     name   : "pizza"
  #     volume : {
  #       $gt : 100
  #     }
  #   }
  #   callback : (error, barf)->
  #     console.log('got a barf')
  # )
  # ```
  @findOne: (args)->
    args.method = 'findOne'
    @_findHelper(args)
  
  # @findAndModify
  # --------------
  # Find and modify models that match a given query
  #
  # ### required args
  # **query** : mongo query to run
  # 
  # **update** : update to make to the model if found
  # 
  # **callback** : called to return (error, result) 
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
  #   new : true # means return the newly updated model 
  #   callback : (error, model)=>
  #     console.log('got modified barf!')
  # )
  # ```
  @findAndModify : (args)->
    callback = args.callback
    delete args.callback

    args.new = true

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
  # ### required args
  # **query** : mongo query to run 
  # 
  # **callback** : called to return (error, count) 
  #
  # ### example
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
  # ### required args
  # **query** : mongo query to run
  # 
  # **update** : update to make to the model
  # 
  # **callback** : called to return (error) 
  # 
  # ### example
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
  #     console.log(error)
  # )
  # ```
  @update : (args)->
    query    = args.query
    update   = args.update
    callback = args.callback
    options  = args.options || {}
    
    @collection().update(query, update, options, callback)

  # @insert
  # -------
  # Insert a model into the collection 
  #
  # ### required args
  # **data** : data to insert
  # 
  # **callback** : called to return (error, models)
  # 
  # ### example
  # ```coffeescript
  # Barf.insert(
  #   data : {
  #     name : 'Pizza'
  #     age  : 10
  #   }
  #   callback : (error, model)->
  #     console.log(error)
  # )
  # ```
  @insert : (args)->
    data     = args.data
    callback = args.callback

    # The underlying insert method on the collection can accept 
    # either an array or a single object to insert as its first 
    # argument. we map it/them to model objects and then call 
    # model.data to get the underlying data to insert

    models = @_ensureModel(data)
    
    data = if Type(models, Array)
     (m.data() for m in models)
    else 
      models.data()

    @collection().insert(data, (error, docs)=>
      unless error
        docs = @_ensureModel(docs)

      callback(error, docs)
    )

  # insert
  # ------
  # Called on model instance to insert itself
  #
  # ### required args
  # **callback** : called to return (error, model)
  insert : (callback)->
    @constructor.insert(
      data     : @
      callback : callback
    )

  # update
  # ------
  # Called on model to update itself. This is basically
  # a convenience wrapper around the class update method
  # to provide the _id-based query. Note that it does not
  # update the underlying model object, and after running 
  # the model will likely be out of sync with the db. 
  # If you want to perform further operations on the model, 
  # you'll want to pass "reload : true" in order to reload 
  # this model's data from Mongo.  
  #
  # ### required args
  # **update** : update to make to the model
  # 
  # **callback** : called to return (error)
  #
  # ### optional args
  # **reload** : reload this model from the db after running
  #              the update. default is false
  update : (args)->
    if args.reload
      cb = args.callback
      args.callback = (error)=>
        if error
          cb(error)
        else
          @reload(cb)

    args.query = { _id : @_id }
    @constructor.update(args)

  # save
  # ----
  # Save this model to the database
  # 
  # ### required args
  # **callback** : called to return (error)
  save: (callback)->
    error = @validate()
    if error
      return callback(error)

    collection = @constructor.collection()

    collection.save(@data(), (error, doc)=>
      if (!error and doc)
        @_id = doc._id

      callback(error)
    )

  # reload
  # ------
  # Reload this model's data from the db
  #
  # ### required args
  # **callback** : called to return (error)
  reload : (callback)->
    @constructor.collection().findOne({_id : @_id}, (error, data)=>
      unless error
        @_data = @constructor.cast(data)
      callback(error)
    )

  # remove
  # ------
  # Remove this model from the db
  #
  # ### required args
  # **callback** : called to return (error)
  remove: (callback)->
    collection = @constructor.collection()
    selector = { _id : @_id }
    collection.remove(selector, {safe: true}, callback)


  # *INTERNAL METHODS*
  # ------------------

  # @_findHelper
  # ------------
  # Helper method for finding, delegated to by find and findOne
  # 
  # ### required args
  # **method** : should be 'find' or 'findOne'
  #
  # **query**  : query to run
  # 
  # **callback** : called to return (error, model or models)
  # 
  # ### optional args
  # **projection** : list of subset of fields to populate
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

  # _ensureModel
  # -------------------
  # Helper method that takes an object or array of objects
  # and makes sure that they are instances of this Model
  #
  # ### required args
  # **objs** : object or array of objects to ensure are models
  @_ensureModel : (objs)->
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

module.exports = Model