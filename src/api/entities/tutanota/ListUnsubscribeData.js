// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 868,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"headers": {
			"id": 871,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"recipient": {
			"id": 870,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mail": {
			"id": 869,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createListUnsubscribeData(values?: $Shape<$Exact<ListUnsubscribeData>>): ListUnsubscribeData {
	return Object.assign(create(_TypeModel, ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;

	_format: NumberString;
	headers: string;
	recipient: string;

	mail: IdTuple;
}