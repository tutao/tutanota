import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const MailHeadersTypeRef: TypeRef<MailHeaders> = new TypeRef("tutanota", "MailHeaders")
export const _TypeModel: TypeModel = {
	"name": "MailHeaders",
	"since": 14,
	"type": "ELEMENT_TYPE",
	"id": 604,
	"rootId": "CHR1dGFub3RhAAJc",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 608,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 606,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 610,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 609,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 607,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"compressedHeaders": {
			"id": 990,
			"type": "CompressedString",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"headers": {
			"id": 611,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createMailHeaders(values?: Partial<MailHeaders>): MailHeaders {
	return Object.assign(create(_TypeModel, MailHeadersTypeRef), downcast<MailHeaders>(values))
}

export type MailHeaders = {
	_type: TypeRef<MailHeaders>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	compressedHeaders: null | string;
	headers: null | string;
}