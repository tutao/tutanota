import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", "MoveMailData")
export const _TypeModel: TypeModel = {
	"name": "MoveMailData",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 445,
	"rootId": "CHR1dGFub3RhAAG9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 446,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mails": {
			"id": 448,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Mail"
		},
		"targetFolder": {
			"id": 447,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createMoveMailData(values?: Partial<MoveMailData>): MoveMailData {
	return Object.assign(create(_TypeModel, MoveMailDataTypeRef), downcast<MoveMailData>(values))
}

export type MoveMailData = {
	_type: TypeRef<MoveMailData>;

	_format: NumberString;

	mails: IdTuple[];
	targetFolder: IdTuple;
}