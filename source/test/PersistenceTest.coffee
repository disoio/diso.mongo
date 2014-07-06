Type    = require('type-of-is')
Assert  = require('assert')
Asserts = require('asserts')

Mongo = require('../../')

module.exports = {
  "derp" : ()->
    Assert.equal(1, 1)
}