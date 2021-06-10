// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", "ReportMailPostData")
export const _TypeModel: TypeModel = {
	"name": "ReportMailPostData",
	"since": 40,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1066,
	"rootId": "CHR1dGFub3RhAAQq",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1067,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailSessionKey": {
			"id": 1068,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"reportType": {
			"id": 1082,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mailId": {
			"id": 1069,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createReportMailPostData(values?: $Shape<$Exact<ReportMailPostData>>): ReportMailPostData {
	return Object.assign(create(_TypeModel, ReportMailPostDataTypeRef), values)
}

export type ReportMailPostData = {
	_type: TypeRef<ReportMailPostData>;

	_format: NumberString;
	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
}