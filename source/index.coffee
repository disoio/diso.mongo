# NPM dependencies
# ------------------
# [mongodb](https://github.com/mongodb/node-mongodb-native)  
MongoDB = require('mongodb')

# Local dependencies
# ------------------
# [Model](./Model.html)  
# [EmbeddedModel](./EmbeddedModel.html)  
# [Schema](./Schema.html)  
Model = require('./Model')
EmbeddedModel = require('./EmbeddedModel')
Schema = require('./Schema')

module.exports = {
  # Represents a document in a MongoDB collection
  Model : Model

  # Represents a sub-document / object within a MongoDB document
  EmbeddedModel : EmbeddedModel

  # Used for specifying a Model's attributes
  Schema : Schema

  # Convenience export of MongoDB.ObjectID
  ObjectID : MongoDB.ObjectID
  
  # Hey Warren
  haveYouSeenMyBaseball : ()->
    false
}


