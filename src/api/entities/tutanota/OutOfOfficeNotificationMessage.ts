import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", "OutOfOfficeNotificationMessage")
export const _TypeModel: TypeModel = {
	"name": "OutOfOfficeNotificationMessage",
	"since": 44,
	"type": "AGGREGATED_TYPE",
	"id": 1126,
	"rootId": "CHR1dGFub3RhAARm",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1127,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"message": {
			"id": 1129,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"subject": {
			"id": 1128,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 1130,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createOutOfOfficeNotificationMessage(values?: Partial<OutOfOfficeNotificationMessage>): OutOfOfficeNotificationMessage {
	return Object.assign(create(_TypeModel, OutOfOfficeNotificationMessageTypeRef), downcast<OutOfOfficeNotificationMessage>(values))
}

export type OutOfOfficeNotificationMessage = {
	_type: TypeRef<OutOfOfficeNotificationMessage>;

	_id: Id;
	message: string;
	subject: string;
	type: NumberString;
}