import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", "ArchiveRef")
export const _TypeModel: TypeModel = {
	"name": "ArchiveRef",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1873,
	"rootId": "A3N5cwAHUQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1874,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveId": {
			"id": 1875,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createArchiveRef(values?: Partial<ArchiveRef>): ArchiveRef {
	return Object.assign(create(_TypeModel, ArchiveRefTypeRef), downcast<ArchiveRef>(values))
}

export type ArchiveRef = {
	_type: TypeRef<ArchiveRef>;

	_id: Id;
	archiveId: Id;
}