// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const EmailSenderListElementTypeRef: TypeRef<EmailSenderListElement> = new TypeRef("sys", "EmailSenderListElement")
export const _TypeModel: TypeModel = {
	"name": "EmailSenderListElement",
	"since": 13,
	"type": "AGGREGATED_TYPE",
	"id": 949,
	"rootId": "A3N5cwADtQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 950,
			"since": 13,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"field": {
			"name": "field",
			"id": 1705,
			"since": 54,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"hashedValue": {
			"name": "hashedValue",
			"id": 951,
			"since": 13,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 953,
			"since": 13,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 952,
			"since": 13,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createEmailSenderListElement(values?: $Shape<$Exact<EmailSenderListElement>>): EmailSenderListElement {
	return Object.assign(create(_TypeModel, EmailSenderListElementTypeRef), values)
}

export type EmailSenderListElement = {
	_type: TypeRef<EmailSenderListElement>;

	_id: Id;
	field: NumberString;
	hashedValue: string;
	type: NumberString;
	value: string;
}