# licc - the little interprocess communications compiler

usage info: type `licc --help`

## output

there are four kinds of json files `licc` understands. they are distinguished by their top-level `type` property.

### structs

`"type": "struct"` definitions are simply generated into the output directory as a single source file of the
platform-appropriate language.

### enums

`"type": "enum"` definitions are generated similarly to structs

### facades

`"type": "facade"` definitions can lead to several output files, depending on the definitions `senders` and `receivers`
fields:

* **senders and receivers**: the interface containing all methods
* **senders**: one implementation of the interface in form of the `SendDispatcher`.
  It takes a transport instance that does the actual sending of the message and must be implemented manually.
* **receivers**: one `ReceiveDispatcher`. It takes the actual, working implementation of the interface during
  construction
  and dispatches to it.
* **additionally**, every platform that is on the receiving side of any facades gets one `GlobalDispatcher`
  implementation
  that dispatches to all receive dispatchers.

this leads to the following flow, with manually implemented components marked with `*`:

```
SENDING SIDE: *caller* => SendDispatcher => *outgoing transport*
RECEIVING SIDE: *incoming transport* => GlobalDispatcher => ReceiveDispatcher => *facade implementation*
```

Dispatch is achieved via string identifiers; the incoming transport will
call `GlobalDispatcher.dispatch("FacadeName", "methodName", arrayOfArgs)` which calls the ReceiveDispatcher
for `FacadeName` with `ReceiveDispatcher.dispatch("methodName", arrayOfArgs)`.
This call will be dispatched to the appropriate method as `facadeName.methodName(arrayOfArgs[0], ..., arrayOfArgs[-1])`.

### typerefs

`"type": "typeref"` definitions are used to refer to types that are not defined in a definition file and are not
primitives (that
the generator therefore has no knowledge of). They have to contain a language-specific path to a definition of the
type that the generator will generate a reexport for, which can then be referred to by the facades (which don't actually
know the difference between a generated struct and such a reexport).

## definition syntax

the schema format is described in `lib/common.ts`.
each schema is a JSON5 file with a single data type or facade definition.
as discussed above, the type (`struct`, `enum`, `facade` or `typeref`) is given by the `type` property of the contained
json5
object.
facades must have a `senders` and a `receivers` property listing the appropriate platforms.

**Note:** there is minimal validation. we don't detect duplicate method or argument definitions and do not do a very
good job to validate type syntax.

### structs

struct fields are given as an object with `"fieldName": "fieldType"` properties.

```json5
{
	name: "Foo",
	type: "struct",
	doc: "optional doc comment that explains the type's purpose",
	fields: {
		fieldName: "fieldType",
		...
	}
}
```

### enums

```json5
{
	name: "QuuxEnum",
	type: "enum",
	doc: "optional doc comment that explains the type's purpose",
	values: [
		"Value1",
		"Value2",
		...
	]
}
```

### facades

```json5
{
	name: "BarFacade",
	type: "facade",
	senders: [
		"web"
	],
	receivers: [
		"desktop",
		"ios"
	],
	doc: "optional doc comment explaining the scope of the facade",
	methods: {
		"methodName": {
			doc: "optional comment explaining the contract and purpose of the method",
			arg: [
				{
					argName1: "argType1"
				},
				{
					argName2: "argType2"
				},
				...
			],
			ret: "returnType"
		},
		...
	}
}
```

Note: method arg must be given as a list of single-property objects as above to preserve argument order.

### typerefs

```json5
{
	name: "BazType",
	type: "typeref",
	location: {
		typescript: "../../src/somedir/BazType.js",
		kotlin: "de.tutao.tutanota.BazType"
	}
}
```

Note the `.js` extension on the typescript reference. Reference paths are resolved relative to the `json` file
containing the typeref.

### supported types:

* nullable types, denoted with a `?` suffix: `string?`
* `List<elementType>`
* `Map<keyType, valueType>`
* the primitives listed in `dist/parser.ts`
* "external" types (the ones that don't fit any of the above but are otherwise valid identifiers)
* any combination of these

all type names must be valid identifiers in all supported output languages.

## Known issues

* the `bytes` primitive types is generating `DataWrapper` types for mobile, because we can't directly send byte arrays
  over the bridge and need some kind of marker that distinguishes plain strings from encoded byte arrays. Currently,
  this requirement to wrap byte arrays leaks out to consumers of the generated classes.
* struct definitions are generated for every language regardless if they're mentioned in that languages' generated
  files.
* it's theoretically possible two separate compilations of the same source files to yield different output because field
  order in json objects is not defined. this was not observed yet and is unlikely to become a problem.