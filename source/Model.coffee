MongoDB = require('mongodb')
MongoJS = require('mongojs')
Type    = require('type-of-is')

BaseModel     = require('./BaseModel')
EmbeddedModel = require('./EmbeddedModel')

utils        = require('./utils')
omit         = utils.omit
underscorize = utils.underscorize

class Model extends BaseModel  
  @db_url : null
      
  @collection: (name)->
    # @db_url, @collection_name defined in child
    # @db_url is required
    # @collection_name defaults to underscorized child class name
    
    collection_name = if name
      name
    else
      @collection_name ? underscorize(@name)
    
    db = MongoJS(@db_url)
    db.collection(collection_name)
    
  
  # Find an instance of this model, given criteria
  @find: (options)->
    if ('id' of options)
      id = options.id
      if Type(id, String)
        id = new MongoDB.ObjectID(id)

      options.query = { _id : id }

    options.method = 'find'
    @_findHelper(options)
  
  @findOne: (options)->
    options.method = 'findOne'
    @_findHelper(options)
  
  @_findHelper: (options)->
    _Model = @

    method     = options.method
    query      = options.query
    callback   = options.callback
    projection = options.projection || {}
    
    @collection()[method](query, projection, (error, result)->
      if error
        return callback(error, null)

      result = if Type(result, Array)
        new _Model(doc) for doc in result
      else
        if result
          new _Model(result)
        else
          null

      callback(null, result)
    )
  
  # find the count of instances satisfying given query (optional)
  @count: (query, callback)->
    if (arguments.length is 1)
      callback = query
      query = null
    
    @collection().count(query, callback)

  @update : (options)->
    query    = options.query
    update   = options.update
    callback = options.callback
    options  = options.options || {}
    
    @collection().update(query, update, options, callback)
  
  save: (callback)->
    if @beforeSave
      @beforeSave()

    error = @validate()
    if error
      return process.nextTick(()-> 
        callback(error, null)
      )

    _this = @
    data = @toJSON()

    collection = @constructor.collection()

    collection.save(data, (error, document)->
      if (document and not error)
        _this._data._id = document._id

        if _this.afterSave
          _this.afterSave()

      callback(error)
    )

  remove: (callback)->
    _this = @

    @collection((error, collection)->
      if error
        return callback(error, null)
      
      if _this.beforeRemove
        _this.beforeRemove() 

      selector = { _id : _this._data._id }

      collection.remove(selector, {safe: true}, (error, num_removed)->
        if (!error and _this.afterRemove)
          _this.afterRemove()

        callback(error, num_removed)
      )
    )

module.exports = Model