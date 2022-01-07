import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 600,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 601,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createDomainMailAddressAvailabilityData(values?: Partial<DomainMailAddressAvailabilityData>): DomainMailAddressAvailabilityData {
	return Object.assign(create(_TypeModel, DomainMailAddressAvailabilityDataTypeRef), downcast<DomainMailAddressAvailabilityData>(values))
}

export type DomainMailAddressAvailabilityData = {
	_type: TypeRef<DomainMailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}