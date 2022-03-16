import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const GiftCardTypeRef: TypeRef<GiftCard> = new TypeRef("sys", "GiftCard")
export const _TypeModel: TypeModel = {
	"name": "GiftCard",
	"since": 65,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1769,
	"rootId": "A3N5cwAG6Q",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1773,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1771,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1775,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1774,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1772,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"country": {
			"id": 1780,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"message": {
			"id": 1778,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"orderDate": {
			"id": 1779,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"usable": {
			"id": 1776,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1777,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createGiftCard(values?: Partial<GiftCard>): GiftCard {
	return Object.assign(create(_TypeModel, GiftCardTypeRef), downcast<GiftCard>(values))
}

export type GiftCard = {
	_type: TypeRef<GiftCard>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	country: string;
	message: string;
	orderDate: Date;
	usable: boolean;
	value: NumberString;
}