(function() {
  var Type,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Type = require('type-of-is');

  module.exports = {
    rmerge: function(original, merge) {
      var k, v, _results;
      _results = [];
      for (k in merge) {
        v = merge[k];
        if (__indexOf.call(original, k) < 0) {
          _results.push(original[k] = v);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
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
    }
  };

}).call(this);
