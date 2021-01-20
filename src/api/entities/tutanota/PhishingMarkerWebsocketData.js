// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1035,
			"since": 40,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastId": {
			"name": "lastId",
			"id": 1036,
			"since": 40,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"markers": {
			"name": "markers",
			"id": 1037,
			"since": 40,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "PhishingMarker",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "44"
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