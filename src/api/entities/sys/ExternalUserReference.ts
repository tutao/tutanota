import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const ExternalUserReferenceTypeRef: TypeRef<ExternalUserReference> = new TypeRef("sys", "ExternalUserReference")
export const _TypeModel: TypeModel = {
	"name": "ExternalUserReference",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 103,
	"rootId": "A3N5cwBn",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 107,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 105,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 997,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 106,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 108,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User",
			"dependency": null
		},
		"userGroup": {
			"id": 109,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createExternalUserReference(values?: Partial<ExternalUserReference>): ExternalUserReference {
	return Object.assign(create(_TypeModel, ExternalUserReferenceTypeRef), downcast<ExternalUserReference>(values))
}

export type ExternalUserReference = {
	_type: TypeRef<ExternalUserReference>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	user: Id;
	userGroup: Id;
}