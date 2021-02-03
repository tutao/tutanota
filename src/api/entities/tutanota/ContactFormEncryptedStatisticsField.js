// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const ContactFormEncryptedStatisticsFieldTypeRef: TypeRef<ContactFormEncryptedStatisticsField> = new TypeRef("tutanota", "ContactFormEncryptedStatisticsField")
export const _TypeModel: TypeModel = {
	"name": "ContactFormEncryptedStatisticsField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 769,
	"rootId": "CHR1dGFub3RhAAMB",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 770,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 771,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"value": {
			"id": 772,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createContactFormEncryptedStatisticsField(values?: $Shape<$Exact<ContactFormEncryptedStatisticsField>>): ContactFormEncryptedStatisticsField {
	return Object.assign(create(_TypeModel, ContactFormEncryptedStatisticsFieldTypeRef), values)
}

export type ContactFormEncryptedStatisticsField = {
	_type: TypeRef<ContactFormEncryptedStatisticsField>;

	_id: Id;
	name: string;
	value: string;
}