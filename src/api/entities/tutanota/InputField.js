// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InputFieldTypeRef: TypeRef<InputField> = new TypeRef("tutanota", "InputField")
export const _TypeModel: TypeModel = {
	"name": "InputField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 729,
	"rootId": "CHR1dGFub3RhAALZ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 730, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"name": {"name": "name", "id": 731, "since": 19, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"type": {"name": "type", "id": 732, "since": 19, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"enumValues": {
			"name": "enumValues",
			"id": 733,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Name",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createInputField(): InputField {
	return create(_TypeModel, InputFieldTypeRef)
}
