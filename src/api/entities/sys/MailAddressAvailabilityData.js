// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const MailAddressAvailabilityDataTypeRef: TypeRef<MailAddressAvailabilityData> = new TypeRef("sys", "MailAddressAvailabilityData")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAvailabilityData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 309,
	"rootId": "A3N5cwABNQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 310,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 311,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createMailAddressAvailabilityData(): MailAddressAvailabilityData {
	return create(_TypeModel)
}
