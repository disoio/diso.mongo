# 0.0.17

### Have you seen my baseball?

No.

### Schema and denormalization patterns for MongoDB

# TODO
- maybe split out into smaller interdependent libraries:
  diso.access: .data, .dataPath, .map and related stuff (mixed into model)
  diso.schema: schema spec / casting / validation
  diso.mongo: mongo-specific db model
  diso.rethink: rethink db model
  ...
- index
- tests for persistence lol
- validation
.validate(args...)
  args.length 0 validate all
  args.length 1 validate single path
- id aliases in queries?
