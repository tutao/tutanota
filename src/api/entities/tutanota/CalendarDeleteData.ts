import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const CalendarDeleteDataTypeRef: TypeRef<CalendarDeleteData> = new TypeRef("tutanota", "CalendarDeleteData")
export const _TypeModel: TypeModel = {
	"name": "CalendarDeleteData",
	"since": 34,
	"type": "DATA_TRANSFER_TYPE",
	"id": 982,
	"rootId": "CHR1dGFub3RhAAPW",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 983,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupRootId": {
			"id": 984,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "CalendarGroupRoot"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createCalendarDeleteData(values?: Partial<CalendarDeleteData>): CalendarDeleteData {
	return Object.assign(create(_TypeModel, CalendarDeleteDataTypeRef), downcast<CalendarDeleteData>(values))
}

export type CalendarDeleteData = {
	_type: TypeRef<CalendarDeleteData>;

	_format: NumberString;

	groupRootId: Id;
}