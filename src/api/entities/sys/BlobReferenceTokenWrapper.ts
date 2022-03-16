import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", "BlobReferenceTokenWrapper")
export const _TypeModel: TypeModel = {
	"name": "BlobReferenceTokenWrapper",
	"since": 74,
	"type": "AGGREGATED_TYPE",
	"id": 1990,
	"rootId": "A3N5cwAHxg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1991,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"blobReferenceToken": {
			"id": 1992,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createBlobReferenceTokenWrapper(values?: Partial<BlobReferenceTokenWrapper>): BlobReferenceTokenWrapper {
	return Object.assign(create(_TypeModel, BlobReferenceTokenWrapperTypeRef), downcast<BlobReferenceTokenWrapper>(values))
}

export type BlobReferenceTokenWrapper = {
	_type: TypeRef<BlobReferenceTokenWrapper>;

	_id: Id;
	blobReferenceToken: string;
}