import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const MailRestrictionTypeRef: TypeRef<MailRestriction> = new TypeRef("tutanota", "MailRestriction")
export const _TypeModel: TypeModel = {
	"name": "MailRestriction",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 719,
	"rootId": "CHR1dGFub3RhAALP",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 720,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"delegationGroups_removed": {
			"id": 722,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Group"
		},
		"participantGroupInfos": {
			"id": 820,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createMailRestriction(values?: Partial<MailRestriction>): MailRestriction {
	return Object.assign(create(_TypeModel, MailRestrictionTypeRef), downcast<MailRestriction>(values))
}

export type MailRestriction = {
	_type: TypeRef<MailRestriction>;

	_id: Id;

	delegationGroups_removed: Id[];
	participantGroupInfos: IdTuple[];
}