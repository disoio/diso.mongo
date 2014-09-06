# Local dependencies
# ------------------
# [DataModel](./DataModel.html)  
DataModel = require('./DataModel')

# EmbeddedModel
# =============
# Extension of DataModel to be used to embed models 
# within persisted models i.e. the models corresponding
# to top level collection objects collections
# 
# EmbeddedModels have all the data access and schema
# methods of DataModel without any persistence methods
class EmbeddedModel extends DataModel

module.exports = EmbeddedModel