// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "69"
}

export function createMailAddressAvailabilityReturn(values?: $Shape<$Exact<MailAddressAvailabilityReturn>>): MailAddressAvailabilityReturn {
	return Object.assign(create(_TypeModel, MailAddressAvailabilityReturnTypeRef), values)
}

export type MailAddressAvailabilityReturn = {
	_type: TypeRef<MailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}