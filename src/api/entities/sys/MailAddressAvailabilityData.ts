import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "74"
}

export function createMailAddressAvailabilityData(values?: Partial<MailAddressAvailabilityData>): MailAddressAvailabilityData {
	return Object.assign(create(_TypeModel, MailAddressAvailabilityDataTypeRef), downcast<MailAddressAvailabilityData>(values))
}

export type MailAddressAvailabilityData = {
	_type: TypeRef<MailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}