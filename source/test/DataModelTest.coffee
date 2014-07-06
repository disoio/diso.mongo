Type    = require('type-of-is')
Assert  = require('assert')
Asserts = require('asserts')

Mongo         = require('../../')
Model         = Mongo.Model
EmbeddedModel = Mongo.EmbeddedModel
Schema        = Mongo.Schema


class Food extends EmbeddedModel
  @schema({
    name : Schema.String
  })
    
class Barf extends Model
  @db_url : "mongodb://localhost/disomongotest"

  @schema({
   target   : Schema.String
   duration : Schema.Integer
   contents : [Food]
   viewers  : [Schema.Object]
  })

class Dorp extends EmbeddedModel
  @schema({
    won  : Schema.Boolean
    time : Schema.Date
  })

class Derp extends EmbeddedModel
  @schema({
    name : Schema.String
    age  : Schema.Integer
    dorp : Dorp
  })

class Wonky extends EmbeddedModel
  @schema({
    what  : Schema.String
    why   : Schema.String
    where : Schema.String
    ok    : Schema.Boolean
  })

class Cletus extends Model
  @schema({
    derp  : Derp
    wonks : [Wonky]
    name  : Schema.String
  })

class Garth extends Model
  @schema({
    name : Schema.String
  })

class Wayne extends Model
  @schema({
    name : Schema.String
  })

module.exports = {

  "DataModel" : {
    "should have .data method that": ()->
      cletus_jr = new Cletus(
        derp : {
          name : "CLEAT"
          age  : 100
          dorp : {
            won  : true
            time : new Date()
          }
        }
        wonks : [
          {
            what  : 'a'
            why   : 'b'
            where : 'c'
            ok    : true
          }
          {
            what  : 'abc'
            why   : 'def'
            where : 'ghi'
            ok    : false
          }
        ]
        name : "CLEATUS JR."
      )

      {
        "returns root attribute when passed string atom as argument" : ()->
          Assert.equal(cletus_jr.data('name'), "CLEATUS JR.")

        "returns nested attribute when passed string path as argument" : ()->
          Assert.equal(cletus_jr.data('derp.dorp.won'), true)
          Assert.equal(cletus_jr.data('wonks.0.where'), 'c')          

        "returns object of requested attributes keyed by path when passed array of string paths" : ()->
          actual = cletus_jr.data(['derp.name', 'wonks.1.where', 'name'])
          expected = {
            'derp.name'     : 'CLEAT'
            'wonks.1.where' : 'ghi', 
            'name'          : 'CLEATUS JR.'
          }
          Assert.deepEqual(actual, expected)

        "updates root attribute when passed string atom and value as arguments" : ()->
          new_name = 'CLEATUS SR.'
          cletus_jr.data('name', new_name)
          Assert.equal(cletus_jr.name, new_name)

        "updates nested attribute when passed string path and value as arguments" : ()->
          new_derp_name = 'CLEATTTTTT'
          cletus_jr.data('derp.name', new_derp_name)
          Assert.equal(cletus_jr.derp.name, new_derp_name)

        "updates model data using all key value pairs when passed object as argument" : ()->
          c3  = 'CLEATUS 3'
          c35 = 'CLEATUS 3.5'
          cletus_jr.data({
            'name'      : c3
            'derp.name' : c35
          })
          Assert.equal(cletus_jr.name, c3)
          Assert.equal(cletus_jr.derp.name, c35)
          Assert.equal(cletus_jr.derp.age, 100)  #old one should still be ok

        "returns object of underlying data when called with no arguments" : ()->
          id = cletus_jr._id
          time = cletus_jr.derp.dorp.time

          actual = cletus_jr.data()
          expected = { 
            derp : { 
              name : 'CLEATUS 3.5'
              age  : 100
              dorp : { 
                won  : true
                time : time 
              } 
            }
            wonks: [
              {
                what  : 'a'
                why   : 'b'
                where : 'c'
                ok    : true
              }
              { 
                what  : 'abc'
                why   : 'def'
                where : 'ghi'
                ok    : false 
              }
            ]
            name : 'CLEATUS 3',
            _id  : id
          }

          Assert.deepEqual(actual, expected)
      }

    "should have instance and class .deflate methods that" : {

      "return structure like .data() but with $model names when called on instance" : ()->
        foods = ((new Food(name : name)) for name in ['taco', 'pizza', 'orange'])
        viewers = ({ name : name } for name in ['Jamie', 'Eustace', 'Delano'])

        barf = new Barf(
          target   : 'there'
          duration : 5000
          contents : foods
          viewers  : viewers
        )

        _id = barf._id

        actual = barf.deflate()

        expected = {
          target   : 'there'
          duration : 5000
          contents : [
            {
              name     : 'taco'
              '$model' : 'Food'
            }
            { 
              name     : 'pizza'
              '$model' : 'Food'
            }
            { 
              name     : 'orange'
              '$model' : 'Food'
            }
          ]
          viewers: [
            {
              name: 'Jamie'
            }
            { 
              name: 'Eustace'
            }
            { 
              name: 'Delano'
            }
          ]
          _id      : _id,
          '$model' : 'Barf'
        }

        Assert.deepEqual(actual, expected)

      "walk objects and arrays and call instance method on models in them when called via class" : ()->
        garth1 = new Garth(name: 'garth!')
        wayne1 = new Wayne(name: 'wayne!')
        garth2 = new Garth(name : 'garth2!')
        wayne2 = new Wayne(name : 'wayne2!')

        obj = {
          something : 'else'
          list : [garth1, wayne1]
          garth2 : garth2
          dorf : {
            wayne2 : wayne2
          }
        }

        actual = Model.deflate(obj)
        
        expected = { 
          something: 'else'
          list: [
            {
              name     : 'garth!'
              _id      : garth1._id
              '$model' : 'Garth'
            }
            {
              name     : 'wayne!'
              _id      : wayne1._id
              '$model' : 'Wayne'
            }
          ]
          garth2: {
            name     : 'garth2!'
            _id      : garth2._id
            '$model' : 'Garth'
          }
          dorf: {
            wayne2: { 
              name     : 'wayne2!',
              _id      : wayne2._id,
              '$model' : 'Wayne'
            } 
          }
        }

        Assert.deepEqual(actual, expected)
    }

    "that has invalid schema": {
      "should throw error" : ()->
        Assert.throws((()->
          class InvalidSchemaModel extends Model
            @schema({
              something: Schema.not_defined
            })
        ), /Invalid schema type/)
    }

    "that has valid schema": ()->
      {
        "and invalid data should" : {
          "throw error when schema expects array and given atom" : ()->
            Assert.throws((()->
              b = new Barf(
                target   : "somewhere"
                duration : 1000
                contents : new Food()
                viewers  : [{name : 'Derp'}]
              )
            ), /Expecting array/)
        }
        
        "and valid data should": ()->      
          somewhere = "somewhere"
          one_thousand = 1000
          pizza = "pizza"

          b = new Barf(
            target   : somewhere
            duration : one_thousand
            contents : [new Food(name : pizza), new Food(name : "soup")]
            viewers  : [
              {name : 'Al'}
              {name : 'Jen'}
            ]
          )

          {
            "properly define getters for schema attributes": ()->
              Assert.equal(b.target, somewhere)
              Assert.equal(b.duration, one_thousand)

            "properly define setters for schema attributes": ()->
              elsewhere = "elsewhere"
              b.target = elsewhere
              Assert.equal(b.target, elsewhere)
            
            "properly handle typed arrays" : {
              "containing models by having " : {
                "correct types" : ()->
                  pizza_food = b.contents[0]
                  Assert.equal(pizza_food.name, pizza)
                  Assert(Type(pizza_food, Food))
                  Assert(Type.instance(pizza_food, EmbeddedModel))

                "functioning accessors" : ()->
                  path = "contents.1.name"
                  Assert.equal(b.get(path), 'soup')
                  new_val = 'bbq'
                  b.set(path, new_val)
                  Assert.equal(b.contents[1].name, new_val)
                  Assert.equal(b.get(path), new_val)
              }

              "with plain objects by having" : {
                "correct types" : ()->
                  al = b.viewers[0]
                  Assert.equal(al.name, 'Al')
                  Assert(Type(al, Object))

                "functioning accessors" : ()->
                  path = "viewers.0.name"
                  new_val = 'Dorf'
                  Assert.equal(b.get(path), 'Al')
                  b.set(path, new_val)
                  Assert.equal(b.get(path), new_val)
              }
            }
        }
      }

    "that has schema containing reference" : ()->
      class User extends Model
        @db_url : "mongodb://localhost/disomongotest"

        @schema({
          name  : Schema.String
          email : Schema.String
        })

      user_ref_attrs = ['_id', 'name']
          
      class Person extends Model
        @db_url : "mongodb://localhost/disomongotest"

        @schema({
         barf : Schema.String
         user : User.reference(user_ref_attrs)
        })


      {
        "should have expected attributes in reference" : ()->
          fart = new User(
            name : "FART"
          )

          fartropolis = new Person(
            barf : "YES!"
            user : fart
          )

          user = fartropolis.user
          user_keys = Object.keys(user)
          Assert.equal(user_keys.length, 2)
          for k in user_ref_attrs
            Assert(k of user)

      }
  }
}