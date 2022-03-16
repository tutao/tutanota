import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BootstrapFeature} from "./BootstrapFeature.js"
import type {CertificateInfo} from "./CertificateInfo.js"
import type {StringWrapper} from "./StringWrapper.js"

export const WhitelabelConfigTypeRef: TypeRef<WhitelabelConfig> = new TypeRef("sys", "WhitelabelConfig")
export const _TypeModel: TypeModel = {
	"name": "WhitelabelConfig",
	"since": 22,
	"type": "ELEMENT_TYPE",
	"id": 1127,
	"rootId": "A3N5cwAEZw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1131,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1129,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1132,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1130,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"germanLanguageCode": {
			"id": 1308,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"imprintUrl": {
			"id": 1425,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"jsonTheme": {
			"id": 1133,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"metaTags": {
			"id": 1281,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"privacyStatementUrl": {
			"id": 1496,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"whitelabelCode": {
			"id": 1727,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bootstrapCustomizations": {
			"id": 1252,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "BootstrapFeature",
			"dependency": null
		},
		"certificateInfo": {
			"id": 1506,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CertificateInfo",
			"dependency": null
		},
		"whitelabelRegistrationDomains": {
			"id": 1728,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "StringWrapper",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createWhitelabelConfig(values?: Partial<WhitelabelConfig>): WhitelabelConfig {
	return Object.assign(create(_TypeModel, WhitelabelConfigTypeRef), downcast<WhitelabelConfig>(values))
}

export type WhitelabelConfig = {
	_type: TypeRef<WhitelabelConfig>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	germanLanguageCode: null | string;
	imprintUrl: null | string;
	jsonTheme: string;
	metaTags: string;
	privacyStatementUrl: null | string;
	whitelabelCode: string;

	bootstrapCustomizations: BootstrapFeature[];
	certificateInfo:  null | CertificateInfo;
	whitelabelRegistrationDomains: StringWrapper[];
}