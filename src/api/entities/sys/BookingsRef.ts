import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 723,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 724,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Booking",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createBookingsRef(values?: Partial<BookingsRef>): BookingsRef {
	return Object.assign(create(_TypeModel, BookingsRefTypeRef), downcast<BookingsRef>(values))
}

export type BookingsRef = {
	_type: TypeRef<BookingsRef>;

	_id: Id;

	items: Id;
}