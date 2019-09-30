// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 517,
			"since": 11,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"draft": {
			"name": "draft",
			"id": 518,
			"since": 11,
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

export function createDraftCreateReturn(values?: $Shape<$Exact<DraftCreateReturn>>): DraftCreateReturn {
	return Object.assign(create(_TypeModel, DraftCreateReturnTypeRef), values)
}
