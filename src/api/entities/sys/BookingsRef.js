// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", "BookingsRef")
export const _TypeModel: TypeModel = {
	"name": "BookingsRef",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 722,
	"rootId": "A3N5cwAC0g",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 723,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 724,
			"since": 9,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Booking",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createBookingsRef(): BookingsRef {
	return create(_TypeModel)
}
