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
	"version": "63"
}

export function createDomainMailAddressAvailabilityReturn(values?: $Shape<$Exact<DomainMailAddressAvailabilityReturn>>): DomainMailAddressAvailabilityReturn {
	return Object.assign(create(_TypeModel, DomainMailAddressAvailabilityReturnTypeRef), values)
}

export type DomainMailAddressAvailabilityReturn = {
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}