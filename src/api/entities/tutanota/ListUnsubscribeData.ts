import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "Mail",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createListUnsubscribeData(values?: Partial<ListUnsubscribeData>): ListUnsubscribeData {
	return Object.assign(create(_TypeModel, ListUnsubscribeDataTypeRef), downcast<ListUnsubscribeData>(values))
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;

	_format: NumberString;
	headers: string;
	recipient: string;

	mail: IdTuple;
}