// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {Name} from "./Name"

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
			"id": 729,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 730,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 731,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"enumValues": {
			"id": 732,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Name",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createInputField(values?: $Shape<$Exact<InputField>>): InputField {
	return Object.assign(create(_TypeModel, InputFieldTypeRef), values)
}

export type InputField = {
	_type: TypeRef<InputField>;

	_id: Id;
	name: string;
	type: NumberString;

	enumValues: Name[];
}