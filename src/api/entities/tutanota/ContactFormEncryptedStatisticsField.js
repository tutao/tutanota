// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormEncryptedStatisticsFieldTypeRef: TypeRef<ContactFormEncryptedStatisticsField> = new TypeRef("tutanota", "ContactFormEncryptedStatisticsField")
export const _TypeModel: TypeModel = {
	"name": "ContactFormEncryptedStatisticsField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 770,
	"rootId": "CHR1dGFub3RhAAMC",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 771, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"name": {"name": "name", "id": 772, "since": 19, "type": "String", "cardinality": "One", "final": true, "encrypted": true},
		"value": {"name": "value", "id": 773, "since": 19, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createContactFormEncryptedStatisticsField(): ContactFormEncryptedStatisticsField {
	return create(_TypeModel, ContactFormEncryptedStatisticsFieldTypeRef)
}
