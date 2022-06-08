# licc - the little interprocess communications compiler

usage info: type `licc --help`

## definition syntax

the schema format is described in `dist/common.ts`.
each schema is a JSON file with a single data type or facade definition.
the type (`struct` or `facade`) is given by the `type` property of the contained json object.
facades must have a `senders` and a `receivers` property listing the appropriate platforms.

**Note:** there is minimal validation. we don't detect duplicate method definitions or do a very good job to validate
type syntax.

### structs

struct fields are given as an object with `"fieldName": "fieldType"` properties.

### facades

method arg must be given as a list of single-property objects `[{"argname": "argtype"}, {"argname2": "argtype2"}]` to
preserve argument order.

supported types:

* nullable types, denoted with a `?` suffix: `string?`
* `List<elementType>`
* `Map<keyType, valueType>`
* the primitives listed in `dist/parser.ts`
* "external" types (the ones that don't fit any of the above but are otherwise valid identifiers)
* any combination of these

all type names must be valid identifiers in all supported output languages.

## Known issues

* struct definitions are generated for every language regardless if they're mentioned in that languages' generated
  files.
* it's theoretically possible two separate compilations of the same source files to yield different output because field
  order in json
  objects is not defined. this was not observed yet.