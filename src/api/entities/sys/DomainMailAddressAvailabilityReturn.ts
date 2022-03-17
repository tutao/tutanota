import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 603,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"available": {
			"id": 604,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createDomainMailAddressAvailabilityReturn(values?: Partial<DomainMailAddressAvailabilityReturn>): DomainMailAddressAvailabilityReturn {
	return Object.assign(create(_TypeModel, DomainMailAddressAvailabilityReturnTypeRef), downcast<DomainMailAddressAvailabilityReturn>(values))
}

export type DomainMailAddressAvailabilityReturn = {
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}