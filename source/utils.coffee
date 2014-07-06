Type = require('type-of-is')

PATH_SEPARATOR = '.'

module.exports = {
  rmerge : (original, merge)->
    for k,v of merge
      unless k of original
        original[k] = v
        
    original

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

  splitPath : (path)->    
    unless Type(path, Array)
      path = path.split(PATH_SEPARATOR)
    path

  shiftPath : (path)->
    # TODO: be smarter about this
    split = @splitPath(path)
    first = split.shift()
    rest = if (split.length is 0)
      null
    else
      split.join(PATH_SEPARATOR)
      
    [first, rest]

  isAtomicPath : (path)->
    Type(path, String) and (path.indexOf(PATH_SEPARATOR) isnt -1)
}