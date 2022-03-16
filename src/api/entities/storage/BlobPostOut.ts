import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobPostOutTypeRef: TypeRef<BlobPostOut> = new TypeRef("storage", "BlobPostOut")
export const _TypeModel: TypeModel = {
	"name": "BlobPostOut",
	"since": 4,
	"type": "DATA_TRANSFER_TYPE",
	"id": 125,
	"rootId": "B3N0b3JhZ2UAfQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 126,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"blobReferenceToken": {
			"id": 127,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "storage",
	"version": "4"
}

export function createBlobPostOut(values?: Partial<BlobPostOut>): BlobPostOut {
	return Object.assign(create(_TypeModel, BlobPostOutTypeRef), downcast<BlobPostOut>(values))
}

export type BlobPostOut = {
	_type: TypeRef<BlobPostOut>;

	_format: NumberString;
	blobReferenceToken: string;
}