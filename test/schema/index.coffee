Type = require('type-of-is')

Warren = require('../../src/Warren')
Model = Warren.Model
EmbeddedModel = Warren.EmbeddedModel
Schema = Warren.Schema

Assert = require('assert')
Asserts = require('asserts')

module.exports = {
  "invalid schema type": ()->
    Assert.throws((()->
      class InvalidSchemaModel extends Model
        @schema : new Schema({
          something: Schema.not_defined
        })
    ), /Invalid schema type/)
    
  
  "valid schema": ()->
    class Food extends EmbeddedModel
      @schema : new Schema({
        name : Schema.String
      })
        
    class Barf extends Model
      @db_url : "mongodb://localhost:27017/test"

      @schema : new Schema({
       target: Schema.String,
       duration: Schema.Integer,
       contents: [Food]
      })
    
    {
      "with invalid model data": ()->
        Assert.throws((()->
          b = new Barf(
            target   : "somewhere"
            duration : 1000
            contents : new Food()
          )
        ), /Expecting array for contents/)
      
      "with valid model data": ()->
        somewhere = "somewhere"
        one_thousand = 1000
        pizza = "pizza"
        b = new Barf(
          target   : somewhere
          duration : one_thousand
          contents : [new Food(name : pizza), new Food(name : "soup")]
        )
        
        Assert.equal(b.data('target'), somewhere)
        Assert.equal(b.data('duration'), one_thousand)
        
        pizza_food = b.data('contents')[0]
        Assert.equal(pizza_food.data('name'), pizza)
        Assert(Type(pizza_food, Food))
        Assert(Type.instance(pizza_food, EmbeddedModel))
    }

}



