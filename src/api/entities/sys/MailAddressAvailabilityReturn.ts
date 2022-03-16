import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 313,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"available": {
			"id": 314,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createMailAddressAvailabilityReturn(values?: Partial<MailAddressAvailabilityReturn>): MailAddressAvailabilityReturn {
	return Object.assign(create(_TypeModel, MailAddressAvailabilityReturnTypeRef), downcast<MailAddressAvailabilityReturn>(values))
}

export type MailAddressAvailabilityReturn = {
	_type: TypeRef<MailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}