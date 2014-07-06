
# _config = {}
# 
# config = (db_name=null)->
#   if db_name
#     if db_name of config
#       return config[db_name]
#     else
#       throw "No config data for database named #{db_name}"
#       
#   else
#     config
#     
# setConfig = (new_config)->
#   config = new_config

MongoDB = require('mongodb')
  
  
module.exports = {
  Schema        : require('./Schema')
  Model         : require('./Model')
  EmbeddedModel : require('./EmbeddedModel')
  ObjectID      : MongoDB.ObjectID
  
  haveYouSeenMyBaseball : ()->
    false
}


