import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", "ContactSocialId")
export const _TypeModel: TypeModel = {
	"name": "ContactSocialId",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 59,
	"rootId": "CHR1dGFub3RhADs",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 60,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customTypeName": {
			"id": 63,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"socialId": {
			"id": 62,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {
			"id": 61,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createContactSocialId(values?: Partial<ContactSocialId>): ContactSocialId {
	return Object.assign(create(_TypeModel, ContactSocialIdTypeRef), downcast<ContactSocialId>(values))
}

export type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;

	_id: Id;
	customTypeName: string;
	socialId: string;
	type: NumberString;
}