# this is here to avoid circular refs between DataModel and Schema 
# since Schema needs to check model inheritance hierarchy and 
# DataModel needs to use Schema for type checking

class BaseModel
module.exports = BaseModel