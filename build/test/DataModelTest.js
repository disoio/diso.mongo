(function() {
  var Assert, Asserts, Barf, Barfee, Cletus, Derp, Dorp, EmbeddedModel, Food, Garth, Gort, Model, Mongo, MyCustomIDBlob, Schema, Type, Wayne, Wonky,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Type = require('type-of-is');

  Assert = require('assert');

  Asserts = require('asserts');

  Mongo = require('../../');

  Model = Mongo.Model;

  EmbeddedModel = Mongo.EmbeddedModel;

  Schema = Mongo.Schema;

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

  Barfee = (function(_super) {
    __extends(Barfee, _super);

    function Barfee() {
      return Barfee.__super__.constructor.apply(this, arguments);
    }

    Barfee.schema({
      name: Schema.String
    });

    return Barfee;

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
      viewers: [Schema.Object],
      owner: Barfee
    });

    return Barf;

  })(Model);

  Dorp = (function(_super) {
    __extends(Dorp, _super);

    function Dorp() {
      return Dorp.__super__.constructor.apply(this, arguments);
    }

    Dorp.schema({
      won: Schema.Boolean,
      time: Schema.Date
    });

    return Dorp;

  })(EmbeddedModel);

  Derp = (function(_super) {
    __extends(Derp, _super);

    function Derp() {
      return Derp.__super__.constructor.apply(this, arguments);
    }

    Derp.schema({
      name: Schema.String,
      age: Schema.Integer,
      dorp: Dorp
    });

    return Derp;

  })(EmbeddedModel);

  Gort = (function(_super) {
    __extends(Gort, _super);

    function Gort() {
      return Gort.__super__.constructor.apply(this, arguments);
    }

    Gort.schema({
      honk: Schema.Integer
    });

    return Gort;

  })(EmbeddedModel);

  Wonky = (function(_super) {
    __extends(Wonky, _super);

    function Wonky() {
      return Wonky.__super__.constructor.apply(this, arguments);
    }

    Wonky.schema({
      what: Schema.String,
      why: Schema.String,
      where: Schema.String,
      ok: Schema.Boolean,
      gort: Gort
    });

    return Wonky;

  })(EmbeddedModel);

  Cletus = (function(_super) {
    __extends(Cletus, _super);

    function Cletus() {
      return Cletus.__super__.constructor.apply(this, arguments);
    }

    Cletus.schema({
      derp: Derp,
      wonks: [Wonky],
      name: Schema.String
    });

    return Cletus;

  })(Model);

  Garth = (function(_super) {
    __extends(Garth, _super);

    function Garth() {
      return Garth.__super__.constructor.apply(this, arguments);
    }

    Garth.schema({
      name: Schema.String
    });

    return Garth;

  })(Model);

  Wayne = (function(_super) {
    __extends(Wayne, _super);

    function Wayne() {
      return Wayne.__super__.constructor.apply(this, arguments);
    }

    Wayne.schema({
      name: Schema.String
    });

    return Wayne;

  })(Model);

  MyCustomIDBlob = (function(_super) {
    __extends(MyCustomIDBlob, _super);

    function MyCustomIDBlob() {
      return MyCustomIDBlob.__super__.constructor.apply(this, arguments);
    }

    MyCustomIDBlob.schema({
      _id: Schema.ID({
        type: Schema.String,
        gen: false,
        alias: 'derp'
      }),
      name: Schema.String
    });

    return MyCustomIDBlob;

  })(Model);

  module.exports = {
    "DataModel": {
      "should have .data method that": function() {
        var cletus_jr, gort;
        gort = new Gort({
          honk: 4
        });
        cletus_jr = new Cletus({
          derp: {
            name: "CLEAT",
            age: 100,
            dorp: {
              won: true,
              time: new Date()
            }
          },
          wonks: [
            {
              what: 'a',
              why: 'b',
              where: 'c',
              ok: true,
              gort: gort
            }, {
              what: 'abc',
              why: 'def',
              where: 'ghi',
              ok: false,
              gort: gort
            }
          ],
          name: "CLEATUS JR."
        });
        ({
          "returns root attribute when passed string atom as argument": function() {
            return Assert.equal(cletus_jr.data('name'), "CLEATUS JR.");
          },
          "returns nested attribute when passed string path as argument": function() {
            Assert.equal(cletus_jr.data('derp.dorp.won'), true);
            return Assert.equal(cletus_jr.data('wonks.0.where'), 'c');
          },
          "returns object of requested attributes keyed by path when passed array of string paths": function() {
            var actual, expected;
            actual = cletus_jr.data(['derp.name', 'wonks.1.where', 'name']);
            expected = {
              'derp.name': 'CLEAT',
              'wonks.1.where': 'ghi',
              'name': 'CLEATUS JR.'
            };
            return Assert.deepEqual(actual, expected);
          },
          "updates root attribute when passed string atom and value as arguments": function() {
            var new_name;
            new_name = 'CLEATUS SR.';
            cletus_jr.data('name', new_name);
            return Assert.equal(cletus_jr.name, new_name);
          },
          "updates nested attribute when passed string path and value as arguments": function() {
            var new_derp_name;
            new_derp_name = 'CLEATTTTTT';
            cletus_jr.data('derp.name', new_derp_name);
            return Assert.equal(cletus_jr.derp.name, new_derp_name);
          },
          "updates model data using all key value pairs when passed object as argument": function() {
            var c3, c35;
            c3 = 'CLEATUS 3';
            c35 = 'CLEATUS 3.5';
            cletus_jr.data({
              'name': c3,
              'derp.name': c35
            });
            Assert.equal(cletus_jr.name, c3);
            Assert.equal(cletus_jr.derp.name, c35);
            return Assert.equal(cletus_jr.derp.age, 100);
          },
          "returns object of underlying data when called with no arguments": function() {
            var actual, expected, id, time;
            id = cletus_jr._id;
            time = cletus_jr.derp.dorp.time;
            actual = cletus_jr.data();
            expected = {
              derp: {
                name: 'CLEATUS 3.5',
                age: 100,
                dorp: {
                  won: true,
                  time: time
                }
              },
              wonks: [
                {
                  what: 'a',
                  why: 'b',
                  where: 'c',
                  ok: true,
                  gort: {
                    honk: 4
                  }
                }, {
                  what: 'abc',
                  why: 'def',
                  where: 'ghi',
                  ok: false,
                  gort: {
                    honk: 4
                  }
                }
              ],
              name: 'CLEATUS 3',
              _id: id
            };
            return Assert.deepEqual(actual, expected);
          }
        });
        return {
          "should have .deflate method that": {
            "returns structure like .data() with model names": function() {
              var actual, barf, expected, f, food_ids, foods, name, viewers, _id;
              foods = (function() {
                var _i, _len, _ref, _results;
                _ref = ['taco', 'pizza', 'orange'];
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  name = _ref[_i];
                  _results.push(new Food({
                    name: name
                  }));
                }
                return _results;
              })();
              food_ids = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = foods.length; _i < _len; _i++) {
                  f = foods[_i];
                  _results.push(f._id);
                }
                return _results;
              })();
              viewers = (function() {
                var _i, _len, _ref, _results;
                _ref = ['Jamie', 'Eustace', 'Delano'];
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  name = _ref[_i];
                  _results.push({
                    name: name
                  });
                }
                return _results;
              })();
              barf = new Barf({
                target: 'there',
                duration: 5000,
                contents: foods,
                viewers: viewers,
                owner: viewers[0]
              });
              _id = barf._id;
              actual = barf.deflate({
                model_key: '$model'
              });
              expected = {
                target: 'there',
                duration: 5000,
                contents: [
                  {
                    name: 'taco',
                    _id: food_ids[0],
                    '$model': 'Food'
                  }, {
                    name: 'pizza',
                    _id: food_ids[1],
                    '$model': 'Food'
                  }, {
                    name: 'orange',
                    _id: food_ids[2],
                    '$model': 'Food'
                  }
                ],
                viewers: [
                  {
                    name: 'Jamie'
                  }, {
                    name: 'Eustace'
                  }, {
                    name: 'Delano'
                  }
                ],
                owner: {
                  name: 'Jamie',
                  $model: 'Barfee',
                  _id: barf.owner._id
                },
                _id: _id,
                '$model': 'Barf'
              };
              return Assert.deepEqual(actual, expected);
            }
          }
        };
      },
      "that has invalid schema": {
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
      "that has valid schema": function() {
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
                  ],
                  owner: {
                    name: 'Dorfff'
                  }
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
                }), new Food({
                  name: 'barf'
                })
              ],
              viewers: [
                {
                  name: 'Al'
                }, {
                  name: 'Jen'
                }
              ],
              owner: {
                name: "robocop"
              }
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
              "properly define setters for embedded models": function() {
                Assert.equal(b.owner.name, 'robocop');
                Assert.equal(Type(b.owner), Barfee);
                b.owner = {
                  name: 'robocop2'
                };
                Assert.equal(b.owner.name, 'robocop2');
                return Assert.equal(Type(b.owner), Barfee);
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
      },
      "that has schema containing reference": function() {
        var Person, User, fart, fartropolis, user_ref_attrs;
        User = (function(_super) {
          __extends(User, _super);

          function User() {
            return User.__super__.constructor.apply(this, arguments);
          }

          User.db_url = "mongodb://localhost/disomongotest";

          User.schema({
            name: Schema.String,
            email: Schema.String,
            brain: Schema.Boolean
          });

          return User;

        })(Model);
        user_ref_attrs = ['_id', 'name'];
        Person = (function(_super) {
          __extends(Person, _super);

          function Person() {
            return Person.__super__.constructor.apply(this, arguments);
          }

          Person.db_url = "mongodb://localhost/disomongotest";

          Person.schema({
            barf: Schema.String,
            user: User.reference(user_ref_attrs)
          });

          return Person;

        })(Model);
        fart = new User({
          name: "FART",
          email: "fart@fart.gov",
          brain: true
        });
        fartropolis = new Person({
          barf: "YES!",
          user: fart
        });
        return {
          "should have expected model attributes proxied in reference": function() {
            var fuser;
            fuser = fartropolis.user;
            Assert.equal(fart.name, fuser.name);
            Assert.equal(fart._id, fuser._id);
            Assert.equal(fart.email, fuser.email);
            return Assert.equal(fart.brain, fuser.brain);
          },
          "should have only reference attributes in .data": function() {
            var actual, expected;
            expected = {
              barf: "YES!",
              _id: fartropolis._id,
              user: {
                _id: fart._id,
                name: "FART"
              }
            };
            actual = fartropolis.data();
            return Assert.deepEqual(expected, actual);
          },
          "should have .data method on reference that proxies to model": function() {
            var fart_deets, fart_deets_expected, fart_name;
            fart_name = fartropolis.user.data('name');
            Assert.equal(fart_name, "FART");
            fart_deets = fartropolis.user.data(['name', 'email']);
            fart_deets_expected = {
              name: 'FART',
              email: 'fart@fart.gov'
            };
            return Assert.deepEqual(fart_deets, fart_deets_expected);
          }
        };
      },
      "id": {
        "should allow for custom": function() {
          var derp;
          derp = new MyCustomIDBlob({
            _id: 'totally',
            name: 'yes'
          });
          Assert.equal(derp._id, 'totally');
          Assert.equal(derp.derp, 'totally');
          return Assert.equal(derp.name, 'yes');
        },
        "should have presence properly enforced": function() {
          var DefaultIdEmbeddedModel, DefaultIdModel, HasIdEmbeddedModel, HasIdModel, HasNoIdEmbeddedModel, HasNoIdModel, M, id_tests, m, test, _i, _len, _results;
          HasIdModel = (function(_super) {
            __extends(HasIdModel, _super);

            function HasIdModel() {
              return HasIdModel.__super__.constructor.apply(this, arguments);
            }

            HasIdModel.schema({
              _id: Schema.ObjectID
            });

            return HasIdModel;

          })(Model);
          HasIdEmbeddedModel = (function(_super) {
            __extends(HasIdEmbeddedModel, _super);

            function HasIdEmbeddedModel() {
              return HasIdEmbeddedModel.__super__.constructor.apply(this, arguments);
            }

            HasIdEmbeddedModel.schema({
              _id: Schema.ObjectID
            });

            return HasIdEmbeddedModel;

          })(EmbeddedModel);
          DefaultIdModel = (function(_super) {
            __extends(DefaultIdModel, _super);

            function DefaultIdModel() {
              return DefaultIdModel.__super__.constructor.apply(this, arguments);
            }

            DefaultIdModel.schema();

            return DefaultIdModel;

          })(Model);
          DefaultIdEmbeddedModel = (function(_super) {
            __extends(DefaultIdEmbeddedModel, _super);

            function DefaultIdEmbeddedModel() {
              return DefaultIdEmbeddedModel.__super__.constructor.apply(this, arguments);
            }

            DefaultIdEmbeddedModel.schema();

            return DefaultIdEmbeddedModel;

          })(EmbeddedModel);
          HasNoIdModel = (function(_super) {
            __extends(HasNoIdModel, _super);

            function HasNoIdModel() {
              return HasNoIdModel.__super__.constructor.apply(this, arguments);
            }

            HasNoIdModel.schema({
              _id: false
            });

            return HasNoIdModel;

          })(Model);
          HasNoIdEmbeddedModel = (function(_super) {
            __extends(HasNoIdEmbeddedModel, _super);

            function HasNoIdEmbeddedModel() {
              return HasNoIdEmbeddedModel.__super__.constructor.apply(this, arguments);
            }

            HasNoIdEmbeddedModel.schema({
              _id: false
            });

            return HasNoIdEmbeddedModel;

          })(EmbeddedModel);
          id_tests = [
            {
              id: true,
              models: [HasIdModel, HasIdEmbeddedModel, DefaultIdModel, DefaultIdEmbeddedModel]
            }, {
              id: false,
              models: [HasNoIdModel, HasNoIdEmbeddedModel]
            }
          ];
          _results = [];
          for (_i = 0, _len = id_tests.length; _i < _len; _i++) {
            test = id_tests[_i];
            _results.push((function() {
              var _j, _len1, _ref, _results1;
              _ref = test.models;
              _results1 = [];
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                M = _ref[_j];
                m = new M();
                if (test.id) {
                  _results1.push(Assert('_id' in m._data));
                } else {
                  _results1.push(Assert(!('_id' in m._data)));
                }
              }
              return _results1;
            })());
          }
          return _results;
        }
      }
    }
  };

}).call(this);
