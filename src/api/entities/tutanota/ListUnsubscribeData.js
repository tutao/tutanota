// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", "ListUnsubscribeData")
export const _TypeModel: TypeModel = {
	"name": "ListUnsubscribeData",
	"since": 24,
	"type": "DATA_TRANSFER_TYPE",
	"id": 867,
	"rootId": "CHR1dGFub3RhAANj",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 868,
			"since": 24,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"headers": {"name": "headers", "id": 871, "since": 24, "type": "String", "cardinality": "One", "final": false, "encrypted": false},
		"recipient": {
			"name": "recipient",
			"id": 870,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mail": {
			"name": "mail",
			"id": 869,
			"since": 24,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createListUnsubscribeData(values?: $Shape<$Exact<ListUnsubscribeData>>): ListUnsubscribeData {
	return Object.assign(create(_TypeModel, ListUnsubscribeDataTypeRef), values)
}
