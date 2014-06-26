DataModel = require('./DataModel')

class EmbeddedModel extends DataModel
  @strict : false
  @add_id : false

module.exports = EmbeddedModel