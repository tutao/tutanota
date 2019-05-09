// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", "ReceiveInfoServiceData")
export const _TypeModel: TypeModel = {
	"name": "ReceiveInfoServiceData",
	"since": 12,
	"type": "DATA_TRANSFER_TYPE",
	"id": 571,
	"rootId": "CHR1dGFub3RhAAI7",
	"versioned": false,
	"encrypted": false,
	"values": {"_format": {"name": "_format", "id": 572, "since": 12, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createReceiveInfoServiceData(): ReceiveInfoServiceData {
	return create(_TypeModel, ReceiveInfoServiceDataTypeRef)
}
