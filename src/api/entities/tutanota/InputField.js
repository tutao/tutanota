// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InputFieldTypeRef: TypeRef<InputField> = new TypeRef("tutanota", "InputField")
export const _TypeModel: TypeModel = {
	"name": "InputField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 728,
	"rootId": "CHR1dGFub3RhAALY",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 729,
			"since": 19,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 730,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 731,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"enumValues": {
			"name": "enumValues",
			"id": 732,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Name",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createInputField(values?: $Shape<$Exact<InputField>>): InputField {
	return Object.assign(create(_TypeModel, InputFieldTypeRef), values)
}
