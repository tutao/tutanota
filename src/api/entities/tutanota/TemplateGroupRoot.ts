import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "49"
}

export function createTemplateGroupRoot(values?: Partial<TemplateGroupRoot>): TemplateGroupRoot {
	return Object.assign(create(_TypeModel, TemplateGroupRootTypeRef), downcast<TemplateGroupRoot>(values))
}

export type TemplateGroupRoot = {
	_type: TypeRef<TemplateGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	knowledgeBase: Id;
	templates: Id;
}