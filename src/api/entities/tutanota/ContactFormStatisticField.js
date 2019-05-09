// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormStatisticFieldTypeRef: TypeRef<ContactFormStatisticField> = new TypeRef("tutanota", "ContactFormStatisticField")
export const _TypeModel: TypeModel = {
	"name": "ContactFormStatisticField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 766,
	"rootId": "CHR1dGFub3RhAAL-",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 767, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"encryptedName": {"name": "encryptedName", "id": 824, "since": 22, "type": "Bytes", "cardinality": "One", "final": true, "encrypted": false},
		"encryptedValue": {"name": "encryptedValue", "id": 825, "since": 22, "type": "Bytes", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createContactFormStatisticField(): ContactFormStatisticField {
	return create(_TypeModel, ContactFormStatisticFieldTypeRef)
}
