class ReferenceModel
  constructor : (args)->
    @model        = args.model
    @attributes   = args.attributes
    @dereferenced = false

    # define some properties that proxy to the underlying model
    for k,v of @model.constructor._schema.processed_schema
      do (k)=>
        unless k of @
          Object.defineProperty(@, k, {
            get: ()->
              @model._data[k]

            set: (val)->
              @model._dataPath(k, val)
          })

  dereference : (callback)->
    @model.constructor.find(
      query : {
        _id : @_id
      }
      callback : (error, model)=>
        if error 
          callback(error)
        else 
          if model
            @dereferenced = true
            @model = model
            callback(null, model)
          else
            callback("Dereference failed")
    )

  data : (args...)->
    @model.data.apply(@model, args)

  deflate : ()->
    @model._map(
      $model : true
    )

  # TODO: 
  # dereferenced ReferenceModels will persist 
  # all attributes to db via @save and underlying
  # @data() call. will be a gotcha 
  # either needs to be better documented or 
  # reimplemented
   
  _map : (args)->
    unless @dereferenced
      args.attrs = @attributes

    @model._map(args)


module.exports = ReferenceModel