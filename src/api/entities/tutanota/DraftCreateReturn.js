// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", "DraftCreateReturn")
export const _TypeModel: TypeModel = {
	"name": "DraftCreateReturn",
	"since": 11,
	"type": "DATA_TRANSFER_TYPE",
	"id": 516,
	"rootId": "CHR1dGFub3RhAAIE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 517,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"draft": {
			"id": 518,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createDraftCreateReturn(values?: $Shape<$Exact<DraftCreateReturn>>): DraftCreateReturn {
	return Object.assign(create(_TypeModel, DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;

	_format: NumberString;

	draft: IdTuple;
}