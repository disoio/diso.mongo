(function() {
  var Assert, Asserts, EmbeddedModel, Model, Mongo, Schema, Type,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Type = require('type-of-is');

  Assert = require('assert');

  Asserts = require('asserts');

  Mongo = require('../../');

  Model = Mongo.Model;

  EmbeddedModel = Mongo.EmbeddedModel;

  Schema = Mongo.Schema;

  module.exports = {
    "Model": {
      "with invalid schema": {
        "should throw error": function() {
          return Assert.throws((function() {
            var InvalidSchemaModel;
            return InvalidSchemaModel = (function(_super) {
              __extends(InvalidSchemaModel, _super);

              function InvalidSchemaModel() {
                return InvalidSchemaModel.__super__.constructor.apply(this, arguments);
              }

              InvalidSchemaModel.schema({
                something: Schema.not_defined
              });

              return InvalidSchemaModel;

            })(Model);
          }), /Invalid schema type/);
        }
      },
      "with valid schema": function() {
        var Barf, Food;
        Food = (function(_super) {
          __extends(Food, _super);

          function Food() {
            return Food.__super__.constructor.apply(this, arguments);
          }

          Food.schema({
            name: Schema.String
          });

          return Food;

        })(EmbeddedModel);
        Barf = (function(_super) {
          __extends(Barf, _super);

          function Barf() {
            return Barf.__super__.constructor.apply(this, arguments);
          }

          Barf.db_url = "mongodb://localhost/disomongotest";

          Barf.schema({
            target: Schema.String,
            duration: Schema.Integer,
            contents: [Food],
            viewers: [Schema.Object]
          });

          return Barf;

        })(Model);
        return {
          "and invalid data should": {
            "throw error when schema expects array and given atom": function() {
              return Assert.throws((function() {
                var b;
                return b = new Barf({
                  target: "somewhere",
                  duration: 1000,
                  contents: new Food(),
                  viewers: [
                    {
                      name: 'Derp'
                    }
                  ]
                });
              }), /Expecting array/);
            }
          },
          "and valid data should": function() {
            var b, one_thousand, pizza, somewhere;
            somewhere = "somewhere";
            one_thousand = 1000;
            pizza = "pizza";
            b = new Barf({
              target: somewhere,
              duration: one_thousand,
              contents: [
                new Food({
                  name: pizza
                }), new Food({
                  name: "soup"
                })
              ],
              viewers: [
                {
                  name: 'Al'
                }, {
                  name: 'Jen'
                }
              ]
            });
            return {
              "properly define getters for schema attributes": function() {
                Assert.equal(b.target, somewhere);
                return Assert.equal(b.duration, one_thousand);
              },
              "properly define setters for schema attributes": function() {
                var elsewhere;
                elsewhere = "elsewhere";
                b.target = elsewhere;
                return Assert.equal(b.target, elsewhere);
              },
              "properly handle typed arrays": {
                "containing models by having ": {
                  "correct types": function() {
                    var pizza_food;
                    pizza_food = b.contents[0];
                    Assert.equal(pizza_food.name, pizza);
                    Assert(Type(pizza_food, Food));
                    return Assert(Type.instance(pizza_food, EmbeddedModel));
                  },
                  "functioning accessors": function() {
                    var new_val, path;
                    path = "contents.1.name";
                    Assert.equal(b.get(path), 'soup');
                    new_val = 'bbq';
                    b.set(path, new_val);
                    Assert.equal(b.contents[1].name, new_val);
                    return Assert.equal(b.get(path), new_val);
                  }
                },
                "with plain objects by having": {
                  "correct types": function() {
                    var al;
                    al = b.viewers[0];
                    Assert.equal(al.name, 'Al');
                    return Assert(Type(al, Object));
                  },
                  "functioning accessors": function() {
                    var new_val, path;
                    path = "viewers.0.name";
                    new_val = 'Dorf';
                    Assert.equal(b.get(path), 'Al');
                    b.set(path, new_val);
                    return Assert.equal(b.get(path), new_val);
                  }
                }
              }
            };
          }
        };
      }
    }
  };

}).call(this);
