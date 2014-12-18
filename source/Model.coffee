# NPM dependencies
# ------------------
# [mongodb](https://github.com/mongodb/node-mongodb-native)  
# [type-of-is](https://github.com/stephenhandley/type-of-is)  
MongoDB = require('mongodb')
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
# methods, 
# 
class Model extends DataModel
  # MongoDB url for the database where this model is stored
  # required
  @db_url : null

  # Collection name defaults to the underscorized class name
  # of the model i.e. BarfMuseum => barf_museum
  @collection_name : null

  @db : (callback)->
    unless @db_url
      throwError("#{@name} is missing required db_url")
    
    MongoDB.MongoClient.connect(@db_url, callback)

  # @collection
  # -----------
  # Retrieve the collection backing this model 
  @collection : (callback)->
    @db((error, db)=>
      if error
        return callback(error, null)

      collection_name = @collection_name || utils.underscorize(@name)
      collection = db.collection(collection_name)
      collection.close = ()->
        db.close()

      callback(null, collection)
    )

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
  #
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
  #
  # **query** : the mongo query to run. Instead of query
  #             arg can specify **_id** to find by _id
  #
  # **callback** : called to return (error, result) 
  #
  # *options* : list of query options
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
    # support _id options for common case of finding by _id  
    # TODO: support _id schema aliases
    if ('_id' of args)
      return @findOne(args)

    query    = args.query
    callback = args.callback 
    options  = args.options || {}

    @_handleIdQuery(query)

    @collection((error, collection)=>
      if error
        return callback(error)

      collection.find(query, options).toArray((error, results)=>
        # Map model constructor over arrays and
        # directly on atom
        models = unless error
          (new @(doc) for doc in results)
        else
          null

        collection.close()
        callback(error, models)
      )
    )
  
  # @findOne
  # --------
  # Find one model that matches a given query 
  # **query** : the mongo query to run. Instead of query
  #             arg can specify **_id** to find by _id
  #
  # **callback** : called to return (error, result) 
  #
  # *options* : list of query options
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
  @findOne : (args)->
    if ('_id' of args)
      args.query = { _id : args._id }

    query    = args.query
    callback = args.callback 
    options  = args.options || {}

    @_handleIdQuery(query)

    @collection((error, collection)=>
      if error
        return callback(error)

      collection.findOne(query, options, (error, result)=>
        model = if (!error and result)
          new @(result)
        else
          null
          
        collection.close()
        callback(error, model)
      )
    )

  # @findAll
  # --------
  # Find all models in a collection
  # 
  # **callback** : called to return (error, result) 
  #
  # ### example
  # ```coffeescript
  # Barf.findAll(
  #   callback : (error, barfs)->
  #     console.log('got so many barf')
  # )
  # ```
  @findAll : (args)->
    args.query  = {}
    @find(args)
    
  # @findAndModify
  # --------------
  # Find and modify models that match a given query
  #
  # **query** : mongo query to run
  # 
  # **update** : update to make to the model if found
  # 
  # **callback** : called to return (error, result) 
  # 
  # *options* : options for query
  # 
  # *sort* : if multiple docs match, first one in sort order updated
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
  #   options : {
  #     new : true # means return the newly updated model
  #   } 
  #   callback : (error, model)=>
  #     console.log('got modified barf!')
  # )
  # ```
  @findAndModify : (args)->
    query    = args.query
    update   = args.update
    options  = args.options || {}
    callback = args.callback
    sort     = if ('sort' of args)
      args.sort
    else
      null

    @collection((error, collection)=>
      if error
        return callback(error)

      collection.findAndModify(query, sort, update, options, (error, result)=>
        model = if (!error and result.value)
          new @(result.value)
        else
          null

        collection.close()
        callback(error, model)
      )
    )

  # @count
  # ------
  # Count models that match a given query
  # 
  # **callback** : called to return (error, count) 
  #
  # *query* : mongo query to run 
  # 
  # *options* : query options
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
    options  = args.options || {}
    callback = args.callback

    @collection((error, collection)=>
      if error
        return callback(error)
        
      collection.count(query, options, (error, count)->
        collection.close()
        callback(error, count)
      )
    )

  # @update
  # -------
  # Update models matching a given query
  #
  # **query** : mongo query to run
  # 
  # **update** : update to make to the models
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
    
    @collection((error, collection)=>
      if error
        return callback(error)

      collection.update(query, update, options, (error, result)=>
        collection.close()
        callback(error, result)
      )
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
  # **update** : update to make to the model
  # 
  # **callback** : called to return (error)
  #
  # *reload* : reload this model from the db after running
  #            the update. default is false
  #
  # TODO : shouldn't close connection in @update if its a reload
  update : (args)->
    args.query = { _id : @_id }

    callback = args.callback 
    args.callback = (error, result)->
      if error
        return callback(error, null)

      unless (result.result.n > 0)
        error = new Error("diso.mongo.Model: no models matched _id")
        return callback(error, null)

      if args.reload
        @reload(callback)
      else
        callback(null)

    @constructor.update(args)

  # @insert
  # -------
  # Insert into the collection 
  #
  # **data** : data to insert, can be atom or array
  # 
  # **callback** : called to return (error, models)
  #
  # *options* : insert options
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
    options  = args.options || {}

    # The underlying insert method on the collection can accept 
    # either an array or a single object to insert as its first 
    # argument. we map it/them to model objects and then call 
    # model.data to get the underlying data to insert

    models = @_ensureModel(data)
    
    data = if Type(models, Array)
     (m.data() for m in models)
    else 
      models.data()

    @collection((error, collection)=>
      if error
        return callback(error, null)

      collection.insert(data, options, (error, result)=>
        models = unless error
          @_ensureModel(result.ops)
        else
          null

        collection.close()
        callback(error, models)
      )
    )

  # insert
  # ------
  # Called on model instance to insert itself
  #
  # **callback** : called to return (error, model)
  #
  # *options* : insert options
  insert : (args)->
    args.data = @

    callback = args.callback 
    args.callback = (error, models)->
      unless error
        models = models[0]
      callback(error, models)

    @constructor.insert(args)

  # save
  # ----
  # Save this model to the database
  # 
  # **callback** : called to return (error)
  #
  # *options* : save options 
  save: (args)->
    callback = args.callback
    options  = args.options || {}

    error = @validate()
    if error
      return callback(error)

    @constructor.collection((error, collection)=>
      if error
        return callback(error)

      collection.save(@data(), options, (error, doc)=>
        if (!error and doc)
          @_id = doc._id

        collection.close()
        callback(error)
      )
    )

  # reload
  # ------
  # Reload this model's data from the db
  #
  # **callback** : called to return (error, obj)
  reload : (callback)->
    @constructor.collection((error, collection)=>
      if error
        return callback(error, null)

      collection.findOne({_id : @_id}, (error, data)=>
        unless error
          @_data = @constructor.cast(data)

        collection.close()
        callback(error)
      )
    )

  # @delete
  # -------
  # Delete records from collection
  #
  # **query** : query identifying docs to delete
  #
  # **callback** : called to return (error)
  #
  # *options* : remove options
  @delete : (args)->
    query    = args.query
    options  = args.options || {}
    callback = args.callback

    @collection((error, collection)=>
      if error
        return callback(error)

      collection.deleteMany(query, options, (error, result)->
        collection.count(query, {}, (error, count)->
          collection.close()
          callback(error, result.deletedCount)
        )
      )
    )

  # delete
  # ------
  # Delete this model from the db
  #
  # **callback** : called to return (error)
  #
  # *options* : delete options
  delete : (args)->
    callback = args.callback
    options  = args.options || {}
    query    = { _id : @_id }
    
    @constructor.collection((error, collection)=>
      if error
        return callback(error)

      collection.deleteOne(query, options, (error, result)->
        collection.close()
        callback(error)
      )
    )


  # *INTERNAL METHODS*
  # ------------------

  # _handleIdQuery
  # --------------
  # convert _id strings to ObjectIDs 
  #
  # **query** : query to check
  @_handleIdQuery : (query)->
    id_is_string = Type(query._id, String)
    wants_object_id = Type(@_schema.attribute('_id'), Schema.ObjectID)
    if (id_is_string and wants_object_id)
      query._id = new MongoDB.ObjectID(query._id)

  # _ensureModel
  # -------------------
  # Helper method that takes an object or array of objects
  # and makes sure that they are instances of this Model
  #
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