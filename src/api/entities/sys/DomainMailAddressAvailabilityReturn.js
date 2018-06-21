// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", "DomainMailAddressAvailabilityReturn")
export const _TypeModel: TypeModel = {
	"name": "DomainMailAddressAvailabilityReturn",
	"since": 2,
	"type": "DATA_TRANSFER_TYPE",
	"id": 602,
	"rootId": "A3N5cwACWg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 603,
			"since": 2,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"available": {
			"name": "available",
			"id": 604,
			"since": 2,
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

export function createDomainMailAddressAvailabilityReturn(): DomainMailAddressAvailabilityReturn {
	return create(_TypeModel)
}
