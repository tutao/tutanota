// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", "CreateGroupPostReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateGroupPostReturn",
	"since": 34,
	"type": "DATA_TRANSFER_TYPE",
	"id": 985,
	"rootId": "CHR1dGFub3RhAAPZ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 986,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 987,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createCreateGroupPostReturn(values?: $Shape<$Exact<CreateGroupPostReturn>>): CreateGroupPostReturn {
	return Object.assign(create(_TypeModel, CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturn = {
	_type: TypeRef<CreateGroupPostReturn>;
	_errors: Object;

	_format: NumberString;

	group: Id;
}