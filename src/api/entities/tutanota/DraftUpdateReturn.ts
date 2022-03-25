import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "File",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createDraftUpdateReturn(values?: Partial<DraftUpdateReturn>): DraftUpdateReturn {
	return Object.assign(create(_TypeModel, DraftUpdateReturnTypeRef), downcast<DraftUpdateReturn>(values))
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;

	_format: NumberString;

	attachments: IdTuple[];
}