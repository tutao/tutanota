// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", "DraftUpdateReturn")
export const _TypeModel: TypeModel = {
	"name": "DraftUpdateReturn",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 523,
	"rootId": "CHR1dGFub3RhAAIL",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 524,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"attachments": {
			"id": 525,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createDraftUpdateReturn(values?: $Shape<$Exact<DraftUpdateReturn>>): DraftUpdateReturn {
	return Object.assign(create(_TypeModel, DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;

	_format: NumberString;

	attachments: IdTuple[];
}