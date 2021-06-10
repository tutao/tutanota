// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", "OutOfOfficeNotificationRecipientList")
export const _TypeModel: TypeModel = {
	"name": "OutOfOfficeNotificationRecipientList",
	"since": 44,
	"type": "AGGREGATED_TYPE",
	"id": 1147,
	"rootId": "CHR1dGFub3RhAAR7",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1148,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 1149,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "OutOfOfficeNotificationRecipient"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createOutOfOfficeNotificationRecipientList(values?: $Shape<$Exact<OutOfOfficeNotificationRecipientList>>): OutOfOfficeNotificationRecipientList {
	return Object.assign(create(_TypeModel, OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;

	_id: Id;

	list: Id;
}