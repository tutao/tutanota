import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const AdministratedGroupsRefTypeRef: TypeRef<AdministratedGroupsRef> = new TypeRef("sys", "AdministratedGroupsRef")
export const _TypeModel: TypeModel = {
	"name": "AdministratedGroupsRef",
	"since": 27,
	"type": "AGGREGATED_TYPE",
	"id": 1303,
	"rootId": "A3N5cwAFFw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1304,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1305,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "AdministratedGroup"
		}
	},
	"app": "sys",
	"version": "71"
}

export function createAdministratedGroupsRef(values?: Partial<AdministratedGroupsRef>): AdministratedGroupsRef {
	return Object.assign(create(_TypeModel, AdministratedGroupsRefTypeRef), downcast<AdministratedGroupsRef>(values))
}

export type AdministratedGroupsRef = {
	_type: TypeRef<AdministratedGroupsRef>;

	_id: Id;

	items: Id;
}