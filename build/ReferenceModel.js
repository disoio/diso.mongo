(function() {
  var ReferenceModel,
    __slice = [].slice;

  ReferenceModel = (function() {
    function ReferenceModel(args) {
      var k, v, _fn, _ref;
      this.model = args.model;
      this.attributes = args.attributes;
      this.dereferenced = false;
      _ref = this.model.constructor._schema.processed_schema;
      _fn = (function(_this) {
        return function(k) {
          if (!(k in _this)) {
            return Object.defineProperty(_this, k, {
              get: function() {
                return this.model._data[k];
              },
              set: function(val) {
                return this.model._dataPath(k, val);
              }
            });
          }
        };
      })(this);
      for (k in _ref) {
        v = _ref[k];
        _fn(k);
      }
    }

    ReferenceModel.prototype.dereference = function(callback) {
      return this.model.constructor.find({
        query: {
          _id: this._id
        },
        callback: (function(_this) {
          return function(error, model) {
            if (error) {
              return callback(error);
            } else {
              if (model) {
                _this.dereferenced = true;
                _this.model = model;
                return callback(null, model);
              } else {
                return callback("Dereference failed");
              }
            }
          };
        })(this)
      });
    };

    ReferenceModel.prototype.data = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.model.data.apply(this.model, args);
    };

    ReferenceModel.prototype.deflate = function() {
      return this.model._map({
        $model: true
      });
    };

    ReferenceModel.prototype._map = function(args) {
      if (!this.dereferenced) {
        args.attrs = this.attributes;
      }
      return this.model._map(args);
    };

    return ReferenceModel;

  })();

  module.exports = ReferenceModel;

}).call(this);
