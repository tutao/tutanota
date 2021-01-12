// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1330,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1328,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1332,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1331,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1329,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerAddress": {
			"id": 1334,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"signatureDate": {
			"id": 1335,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"version": {
			"id": 1333,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"id": 1337,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer"
		},
		"signerUserGroupInfo": {
			"id": 1336,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "68"
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