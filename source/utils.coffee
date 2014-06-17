Type = require('type-of-is')

module.exports = {
  rmerge : (original, merge)->
    for k,v of merge
      unless k in original
        original[k] = v

  omit : (object, keys)->
    unless Type(keys, Array)
      keys = [keys]

    res = {}
    for k,v of object
      unless k in keys
        res[k] = v

  underscorize : (str)->
    result = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2')
    result = result.replace(/([a-z0-9A-Z])([A-Z])/g, '$1_$2')
    result = result.replace(/\s/g, '_')
    result.toLowerCase()
}