// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 950,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"field": {
			"id": 1705,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"hashedValue": {
			"id": 951,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 953,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 952,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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