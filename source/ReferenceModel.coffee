# ReferenceModel
# ==============
# A ReferenceModel that can be used to store a reference to 
# a model from another collection within a given model. 
class ReferenceModel

  # constructor
  # -----------
  # Create a reference model for the given model using the given 
  # attributes
  # ### required_args
  # **model** : the model instance to reference
  #
  # **attributes** : the attributes to persist / include in the db
  #
  constructor : (args)->
    @model         = args.model
    @attributes    = args.attributes
    @_dereferenced = false

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

  # dereference 
  # -----------
  # Dereference this ReferenceModel. What this means is that
  # the full backing model will be found by id in the database 
  # and all its properties will be reachable via the reference.
  #
  # NOTE : ReferenceModels that have been dereferenced will 
  # currently persist all attributes to db via @save and underlying
  # @data() call. This is a gotcha / bug and will be fixed 
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
            @_dereferenced = true
            @model = model
            callback(null, model)
          else
            callback("Dereference failed")
    )

  # data 
  # ----
  # get the data for this reference model
  data : (args...)->
    @model.data.apply(@model, args)

  # deflate
  # -------
  # deflate the data for this reference model
  deflate : (args)->
    @model.deflate(args)
  
  # _map
  # ----
  _map : (args)->
    unless @_dereferenced
      args.attrs = @attributes

    @model._map(args)


module.exports = ReferenceModel