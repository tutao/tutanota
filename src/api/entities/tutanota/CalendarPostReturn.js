// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarPostReturnTypeRef: TypeRef<CalendarPostReturn> = new TypeRef("tutanota", "CalendarPostReturn")
export const _TypeModel: TypeModel = {
	"name": "CalendarPostReturn",
	"since": 34,
	"type": "DATA_TRANSFER_TYPE",
	"id": 985,
	"rootId": "CHR1dGFub3RhAAPZ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 986,
			"since": 34,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 987,
			"since": 34,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCalendarPostReturn(values?: $Shape<$Exact<CalendarPostReturn>>): CalendarPostReturn {
	return Object.assign(create(_TypeModel, CalendarPostReturnTypeRef), values)
}
