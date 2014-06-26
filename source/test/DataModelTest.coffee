Type    = require('type-of-is')
Assert  = require('assert')
Asserts = require('asserts')

Mongo         = require('../../')
Model         = Mongo.Model
EmbeddedModel = Mongo.EmbeddedModel
Schema        = Mongo.Schema

module.exports = {

  "Model" : {
    "with invalid schema": {
      "should throw error" : ()->
        Assert.throws((()->
          class InvalidSchemaModel extends Model
            @schema({
              something: Schema.not_defined
            })
        ), /Invalid schema type/)
    }

    "with valid schema": ()->
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
  }
}



