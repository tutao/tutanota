// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {PhishingMarker} from "./PhishingMarker"

export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", "PhishingMarkerWebsocketData")
export const _TypeModel: TypeModel = {
	"name": "PhishingMarkerWebsocketData",
	"since": 40,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1034,
	"rootId": "CHR1dGFub3RhAAQK",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1035,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastId": {
			"id": 1036,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"markers": {
			"id": 1037,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "PhishingMarker"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createPhishingMarkerWebsocketData(values?: $Shape<$Exact<PhishingMarkerWebsocketData>>): PhishingMarkerWebsocketData {
	return Object.assign(create(_TypeModel, PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketData = {
	_type: TypeRef<PhishingMarkerWebsocketData>;

	_format: NumberString;
	lastId: Id;

	markers: PhishingMarker[];
}