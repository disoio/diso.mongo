MongoDB = require('mongodb')
MongoJS = require('mongojs')
Type    = require('type-of-is')

BaseModel = require('./BaseModel')
DataModel = require('./DataModel')
Schema    = require('./Schema')
utils     = require('./utils')

class Model extends DataModel
  # required, mongodb url for db
  @db_url : null

  # optional, otherwise collection will be underscorized 
  # child class/constructor name
  @collection_name : null
  @_collection : null

  @schema : (schema)->
    # Ensure that schema has an _id attribute
    unless ('_id' of schema)
      schema._id = Schema.ObjectID

    super(schema)

  # Class method for accessing the backing mongodb collection
  @collection: ()->
    # finds collection with @collection_name defined in child
    # otherwise defaults to underscorized child class name
    unless @_collection
      collection_name = @collection_name ? utils.underscorize(@name)
      db = MongoJS(@db_url)
      @_collection = db.collection(collection_name)
    
    @_collection
  
  # Find an instance of this model, given criteria
  @find: (opts)->
    if ('id' of opts)
      id = opts.id
      delete opts.id

      # TODO: support alias
      
      if Type(id, String)
        id = new MongoDB.ObjectID(id)

      opts.query = { _id : id }

    opts.method = 'find'
    @_findHelper(opts)
  
  @findOne: (opts)->
    opts.method = 'findOne'
    @_findHelper(opts)
  
  @_findHelper: (opts)->
    _Model = @

    method     = opts.method
    query      = opts.query
    callback   = opts.callback
    projection = opts.projection || {}
    
    @collection()[method](query, projection, (error, result)->
      if error
        return callback(error, null)

      models = if Type(result, Array)
        new _Model(doc) for doc in result
      else
        if result
          new _Model(result)
        else
          null

      callback(null, models)
    )
  
  @findAndModify : (opts)->
    callback = opts.callback
    delete opts.callback

    @collection().findAndModify(opts, (error, doc, last_error)=>
      if error 
        return callback(error, null)
      else 
        model = if doc
          new @(doc)
        else
          null

        callback(null, model)
    )

  # find the count of instances satisfying given query (optional)
  @count: (opts)->
    @collection().count(opts.query || {}, opts.callback)

  @update : (opts)->
    query    = opts.query
    update   = opts.update
    callback = opts.callback
    options  = opts.options || {}
    
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

  @insert : (opts)->
    models = @makeOneOrMany(opts.data)

    data = (m.data() for m in models)

    @collection().insert(data, (error, docs)=>
      result = null
      unless error
        result = @makeOneOrMany(docs)

      opts.callback(error, result)
    )

  insert : (callback)->
    @constructor.insert(
      data     : @data()
      callback : callback
    )

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

  reference : (attributes)->
    unless Type(attributes, Array)
      attributes = [attributes]

    ref = {}

    for attr in attributes
      ref[attr] = @_dataPath(attr)

    ref

  @reference : (attributes)->
    if attributes
      unless Type(attributes, Array)
        attributes = [attributes]
    else
      attributes = ['_id']

    new Schema.Reference(
      model      : @
      attributes : attributes
    )

module.exports = Model