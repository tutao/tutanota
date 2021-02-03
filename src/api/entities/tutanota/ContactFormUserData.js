// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 755,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailEncMailBoxSessionKey": {
			"id": 763,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncMailGroupInfoSessionKey": {
			"id": 764,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"id": 759,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"id": 756,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncClientKey": {
			"id": 758,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncEntropy": {
			"id": 761,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncMailGroupKey": {
			"id": 760,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncTutanotaPropertiesSessionKey": {
			"id": 762,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"id": 757,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createContactFormUserData(values?: $Shape<$Exact<ContactFormUserData>>): ContactFormUserData {
	return Object.assign(create(_TypeModel, ContactFormUserDataTypeRef), values)
}

export type ContactFormUserData = {
	_type: TypeRef<ContactFormUserData>;

	_id: Id;
	mailEncMailBoxSessionKey: Uint8Array;
	ownerEncMailGroupInfoSessionKey: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
	userEncEntropy: Uint8Array;
	userEncMailGroupKey: Uint8Array;
	userEncTutanotaPropertiesSessionKey: Uint8Array;
	verifier: Uint8Array;
}