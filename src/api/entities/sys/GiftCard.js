// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1773,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1771,
			"since": 65,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1775,
			"since": 65,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1774,
			"since": 65,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1772,
			"since": 65,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"country": {
			"name": "country",
			"id": 1780,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"message": {
			"name": "message",
			"id": 1778,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"orderDate": {
			"name": "orderDate",
			"id": 1779,
			"since": 65,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"usable": {
			"name": "usable",
			"id": 1776,
			"since": 65,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 1777,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "65"
}

export function createGiftCard(values?: $Shape<$Exact<GiftCard>>): GiftCard {
	return Object.assign(create(_TypeModel, GiftCardTypeRef), values)
}

export type GiftCard = {
	_type: TypeRef<GiftCard>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	country: string;
	message: string;
	orderDate: Date;
	usable: boolean;
	value: NumberString;
}