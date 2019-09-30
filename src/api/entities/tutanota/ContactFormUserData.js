// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormUserDataTypeRef: TypeRef<ContactFormUserData> = new TypeRef("tutanota", "ContactFormUserData")
export const _TypeModel: TypeModel = {
	"name": "ContactFormUserData",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 754,
	"rootId": "CHR1dGFub3RhAALy",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 755, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"mailEncMailBoxSessionKey": {
			"name": "mailEncMailBoxSessionKey",
			"id": 763,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncMailGroupInfoSessionKey": {
			"name": "ownerEncMailGroupInfoSessionKey",
			"id": 764,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"name": "pwEncUserGroupKey",
			"id": 759,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {"name": "salt", "id": 756, "since": 19, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 758,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncEntropy": {
			"name": "userEncEntropy",
			"id": 761,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncMailGroupKey": {
			"name": "userEncMailGroupKey",
			"id": 760,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncTutanotaPropertiesSessionKey": {
			"name": "userEncTutanotaPropertiesSessionKey",
			"id": 762,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {"name": "verifier", "id": 757, "since": 19, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createContactFormUserData(values?: $Shape<$Exact<ContactFormUserData>>): ContactFormUserData {
	return Object.assign(create(_TypeModel, ContactFormUserDataTypeRef), values)
}
