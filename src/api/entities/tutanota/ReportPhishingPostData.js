// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ReportPhishingPostDataTypeRef: TypeRef<ReportPhishingPostData> = new TypeRef("tutanota", "ReportPhishingPostData")
export const _TypeModel: TypeModel = {
	"name": "ReportPhishingPostData",
	"since": 40,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1066,
	"rootId": "CHR1dGFub3RhAAQq",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1067,
			"since": 40,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailSessionKey": {
			"name": "mailSessionKey",
			"id": 1068,
			"since": 40,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mailId": {
			"name": "mailId",
			"id": 1069,
			"since": 40,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Mail",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "41"
}

export function createReportPhishingPostData(values?: $Shape<$Exact<ReportPhishingPostData>>): ReportPhishingPostData {
	return Object.assign(create(_TypeModel, ReportPhishingPostDataTypeRef), values)
}
