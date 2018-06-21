// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const MailAddressAvailabilityReturnTypeRef: TypeRef<MailAddressAvailabilityReturn> = new TypeRef("sys", "MailAddressAvailabilityReturn")
export const _TypeModel: TypeModel = {
	"name": "MailAddressAvailabilityReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 312,
	"rootId": "A3N5cwABOA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 313,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"available": {
			"name": "available",
			"id": 314,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createMailAddressAvailabilityReturn(): MailAddressAvailabilityReturn {
	return create(_TypeModel)
}
