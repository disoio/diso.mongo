(function() {
  var PATH_SEPARATOR, Type, shiftPath, splitPath, underscorize;

  Type = require('type-of-is');

  PATH_SEPARATOR = '.';

  underscorize = function(str) {
    var result;
    result = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2');
    result = result.replace(/([a-z0-9A-Z])([A-Z])/g, '$1_$2');
    result = result.replace(/\s/g, '_');
    return result.toLowerCase();
  };

  splitPath = function(path) {
    if (!Type(path, Array)) {
      path = path.split(PATH_SEPARATOR);
    }
    return path;
  };

  shiftPath = function(path) {
    var first, rest, split;
    split = this.splitPath(path);
    first = split.shift();
    rest = split.length === 0 ? null : split.join(PATH_SEPARATOR);
    return [first, rest];
  };

  module.exports = {
    underscorize: underscorize,
    splitPath: splitPath,
    shiftPath: shiftPath
  };

}).call(this);
