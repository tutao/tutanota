import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 1024,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"marker": {
			"id": 1025,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"status": {
			"id": 1026,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createPhishingMarker(values?: Partial<PhishingMarker>): PhishingMarker {
	return Object.assign(create(_TypeModel, PhishingMarkerTypeRef), downcast<PhishingMarker>(values))
}

export type PhishingMarker = {
	_type: TypeRef<PhishingMarker>;

	_id: Id;
	marker: string;
	status: NumberString;
}