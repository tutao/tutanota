import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UnencryptedStatisticLogEntryTypeRef: TypeRef<UnencryptedStatisticLogEntry> = new TypeRef("tutanota", "UnencryptedStatisticLogEntry")
export const _TypeModel: TypeModel = {
	"name": "UnencryptedStatisticLogEntry",
	"since": 25,
	"type": "LIST_ELEMENT_TYPE",
	"id": 879,
	"rootId": "CHR1dGFub3RhAANv",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 883,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 881,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 884,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 882,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"contactFormPath": {
			"id": 886,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"date": {
			"id": 885,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createUnencryptedStatisticLogEntry(values?: Partial<UnencryptedStatisticLogEntry>): UnencryptedStatisticLogEntry {
	return Object.assign(create(_TypeModel, UnencryptedStatisticLogEntryTypeRef), downcast<UnencryptedStatisticLogEntry>(values))
}

export type UnencryptedStatisticLogEntry = {
	_type: TypeRef<UnencryptedStatisticLogEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	contactFormPath: string;
	date: Date;
}