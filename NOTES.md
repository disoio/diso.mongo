### NOTES

db.blah.insert
db.blah.batchInsert([{}, {}, ...])  #continueOnError
db.blah.remove
db.blah.update

$inc, $set, $unset, $push, $pull

db.blah.update({'a.b' : 'x'}, {'$set' : {'a.b': 'y'}})


note whether new or from find so update is selectively allowed

lookup - defines k,v query object to id the object .. defaults to _id



# create indexes
  
  # collections with aggregate methods
  # getters / setters .. 
  # validation
  # toObject like "as_json"
  # would be awesome if there was a way to build dashboard with all the .explain run on all the queries
  # class level @update support of multi: true , upsert: true? 
  # findAndModify!! new:true to return modified, upsert,


  # MongoDB = require('mongodb');
  # // Create new instances of BSON types
  # new MongoDB.Long(numberString)
  # new MongoDB.ObjectID(hexString)
  # new MongoDB.Timestamp()  # the actual unique number is generated on insert.
  # new MongoDB.DBRef(collectionName, id, dbName)
  # new MongoDB.Binary(buffer)  # takes a string or Buffer
  # new MongoDB.Code(code, [context])
  # new MongoDB.Symbol(string)
  # new MongoDB.MinKey()
  # new MongoDB.MaxKey()
  # new MongoDB.Double(number)    # Force double storage

# "obj1": {
#   "obj2": {
#     "obj3": "&type:id",
#     "obj5": {
#       "name": "something"
#       "_ref": {
#         "id": "ajhsdfkjh",
#         "type": "Something"
#         "fields": ["barf", "method1", "method2", "honk"]
#     }
#   }
# }
# //  unless Obj::[name] // String.__noSuchMethod__ (name, args)->
# if (this.indexOf('&') === 0) and (this.indexOf(':') > 2)
#   [type, id] = x.slice(1).split(':')
#   this = type.classify.find(id)