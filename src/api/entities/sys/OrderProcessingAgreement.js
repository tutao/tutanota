// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const OrderProcessingAgreementTypeRef: TypeRef<OrderProcessingAgreement> = new TypeRef("sys", "OrderProcessingAgreement")
export const _TypeModel: TypeModel = {
	"name": "OrderProcessingAgreement",
	"since": 31,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1326,
	"rootId": "A3N5cwAFLg",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1330,
			"since": 31,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1328,
			"since": 31,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1332,
			"since": 31,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1331,
			"since": 31,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1329,
			"since": 31,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerAddress": {
			"name": "customerAddress",
			"id": 1334,
			"since": 31,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"signatureDate": {
			"name": "signatureDate",
			"id": 1335,
			"since": 31,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"name": "version",
			"id": 1333,
			"since": 31,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"name": "customer",
			"id": 1337,
			"since": 31,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"signerUserGroupInfo": {
			"name": "signerUserGroupInfo",
			"id": 1336,
			"since": 31,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createOrderProcessingAgreement(values?: $Shape<$Exact<OrderProcessingAgreement>>): OrderProcessingAgreement {
	return Object.assign(create(_TypeModel, OrderProcessingAgreementTypeRef), values)
}

export type OrderProcessingAgreement = {
	_type: TypeRef<OrderProcessingAgreement>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	customerAddress: string;
	signatureDate: Date;
	version: string;

	customer: Id;
	signerUserGroupInfo: IdTuple;
}