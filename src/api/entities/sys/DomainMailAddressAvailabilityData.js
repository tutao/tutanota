// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", "DomainMailAddressAvailabilityData")
export const _TypeModel: TypeModel = {
	"name": "DomainMailAddressAvailabilityData",
	"since": 2,
	"type": "DATA_TRANSFER_TYPE",
	"id": 599,
	"rootId": "A3N5cwACVw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 600,
			"since": 2,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 601,
			"since": 2,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createDomainMailAddressAvailabilityData(values?: $Shape<$Exact<DomainMailAddressAvailabilityData>>): DomainMailAddressAvailabilityData {
	return Object.assign(create(_TypeModel, DomainMailAddressAvailabilityDataTypeRef), values)
}

export type DomainMailAddressAvailabilityData = {
	_type: TypeRef<DomainMailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}