(function() {
  var PATH_SEPARATOR, Type,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Type = require('type-of-is');

  PATH_SEPARATOR = '.';

  module.exports = {
    rmerge: function(original, merge) {
      var k, v;
      for (k in merge) {
        v = merge[k];
        if (!(k in original)) {
          original[k] = v;
        }
      }
      return original;
    },
    omit: function(object, keys) {
      var k, res, v, _results;
      if (!Type(keys, Array)) {
        keys = [keys];
      }
      res = {};
      _results = [];
      for (k in object) {
        v = object[k];
        if (__indexOf.call(keys, k) < 0) {
          _results.push(res[k] = v);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    underscorize: function(str) {
      var result;
      result = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2');
      result = result.replace(/([a-z0-9A-Z])([A-Z])/g, '$1_$2');
      result = result.replace(/\s/g, '_');
      return result.toLowerCase();
    },
    splitPath: function(path) {
      if (!Type(path, Array)) {
        path = path.split(PATH_SEPARATOR);
      }
      return path;
    },
    shiftPath: function(path) {
      var first, rest, split;
      split = this.splitPath(path);
      first = split.shift();
      rest = split.length === 0 ? null : split.join(PATH_SEPARATOR);
      return [first, rest];
    },
    isAtomicPath: function(path) {
      return Type(path, String) && (path.indexOf(PATH_SEPARATOR) !== -1);
    }
  };

}).call(this);
