import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", "EncryptedMailAddress")
export const _TypeModel: TypeModel = {
	"name": "EncryptedMailAddress",
	"since": 14,
	"type": "AGGREGATED_TYPE",
	"id": 612,
	"rootId": "CHR1dGFub3RhAAJk",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 613,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {
			"id": 615,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"name": {
			"id": 614,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createEncryptedMailAddress(values?: Partial<EncryptedMailAddress>): EncryptedMailAddress {
	return Object.assign(create(_TypeModel, EncryptedMailAddressTypeRef), downcast<EncryptedMailAddress>(values))
}

export type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;

	_id: Id;
	address: string;
	name: string;
}