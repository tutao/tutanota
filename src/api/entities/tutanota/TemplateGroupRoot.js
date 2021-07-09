// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", "TemplateGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "TemplateGroupRoot",
	"since": 45,
	"type": "ELEMENT_TYPE",
	"id": 1181,
	"rootId": "CHR1dGFub3RhAASd",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1185,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1183,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1187,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1186,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1184,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"knowledgeBase": {
			"id": 1189,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "KnowledgeBaseEntry"
		},
		"templates": {
			"id": 1188,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "EmailTemplate"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createTemplateGroupRoot(values?: $Shape<$Exact<TemplateGroupRoot>>): TemplateGroupRoot {
	return Object.assign(create(_TypeModel, TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRoot = {
	_type: TypeRef<TemplateGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;

	knowledgeBase: Id;
	templates: Id;
}