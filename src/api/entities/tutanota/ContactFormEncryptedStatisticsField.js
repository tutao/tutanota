// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 770,
			"since": 19,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 771,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"value": {
			"name": "value",
			"id": 772,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "40"
}

export function createContactFormEncryptedStatisticsField(values?: $Shape<$Exact<ContactFormEncryptedStatisticsField>>): ContactFormEncryptedStatisticsField {
	return Object.assign(create(_TypeModel, ContactFormEncryptedStatisticsFieldTypeRef), values)
}
