import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "Mail",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createDraftCreateReturn(values?: Partial<DraftCreateReturn>): DraftCreateReturn {
	return Object.assign(create(_TypeModel, DraftCreateReturnTypeRef), downcast<DraftCreateReturn>(values))
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;

	_format: NumberString;

	draft: IdTuple;
}