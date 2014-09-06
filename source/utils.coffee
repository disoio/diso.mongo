# NPM dependencies
# ------------------
# [type-of-is](https://github.com/stephenhandley/type-of-is)  
Type = require('type-of-is')

# separator between elements in mongodb attribute path
PATH_SEPARATOR = '.'

# underscorize
# ------------
# Convert AbcXyz to abc_xyz
#
# ### required args
# **str** : the string to underscorize
underscorize = (str)->
  result = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2')
  result = result.replace(/([a-z0-9A-Z])([A-Z])/g, '$1_$2')
  result = result.replace(/\s/g, '_')
  result.toLowerCase()

# splitPath
# ---------
# Split a string on periods into array
#
# ### required args
# **path** : path to split
splitPath = (path)->    
  unless Type(path, Array)
    path = path.split(PATH_SEPARATOR)
  path

# shiftPath
# ---------
# Split a string on periods into array
#
# ### required args
# **path** : path string or array to split
shiftPath = (path)->
  # TODO: be smarter about this implementation
  split = @splitPath(path)
  first = split.shift()
  rest = if (split.length is 0)
    null
  else
    split.join(PATH_SEPARATOR)
    
  [first, rest]

module.exports = {
  underscorize : underscorize 
  splitPath    : splitPath
  shiftPath    : shiftPath
}