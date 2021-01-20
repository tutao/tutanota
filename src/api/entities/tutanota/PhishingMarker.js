// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PhishingMarkerTypeRef: TypeRef<PhishingMarker> = new TypeRef("tutanota", "PhishingMarker")
export const _TypeModel: TypeModel = {
	"name": "PhishingMarker",
	"since": 40,
	"type": "AGGREGATED_TYPE",
	"id": 1023,
	"rootId": "CHR1dGFub3RhAAP_",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1024,
			"since": 40,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"marker": {
			"name": "marker",
			"id": 1025,
			"since": 40,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"status": {
			"name": "status",
			"id": 1026,
			"since": 40,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createPhishingMarker(values?: $Shape<$Exact<PhishingMarker>>): PhishingMarker {
	return Object.assign(create(_TypeModel, PhishingMarkerTypeRef), values)
}

export type PhishingMarker = {
	_type: TypeRef<PhishingMarker>;

	_id: Id;
	marker: string;
	status: NumberString;
}