import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PasswordRetrievalDataTypeRef: TypeRef<PasswordRetrievalData> = new TypeRef("tutanota", "PasswordRetrievalData")
export const _TypeModel: TypeModel = {
	"name": "PasswordRetrievalData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 320,
	"rootId": "CHR1dGFub3RhAAFA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 321,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"id": 322,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "51"
}

export function createPasswordRetrievalData(values?: Partial<PasswordRetrievalData>): PasswordRetrievalData {
	return Object.assign(create(_TypeModel, PasswordRetrievalDataTypeRef), downcast<PasswordRetrievalData>(values))
}

export type PasswordRetrievalData = {
	_type: TypeRef<PasswordRetrievalData>;

	_format: NumberString;
	autoAuthenticationId: Id;
}