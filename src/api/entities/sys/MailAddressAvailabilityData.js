// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 310,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 311,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createMailAddressAvailabilityData(values?: $Shape<$Exact<MailAddressAvailabilityData>>): MailAddressAvailabilityData {
	return Object.assign(create(_TypeModel, MailAddressAvailabilityDataTypeRef), values)
}

export type MailAddressAvailabilityData = {
	_type: TypeRef<MailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}