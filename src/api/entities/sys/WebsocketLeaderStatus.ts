import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const WebsocketLeaderStatusTypeRef: TypeRef<WebsocketLeaderStatus> = new TypeRef("sys", "WebsocketLeaderStatus")
export const _TypeModel: TypeModel = {
	"name": "WebsocketLeaderStatus",
	"since": 64,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1766,
	"rootId": "A3N5cwAG5g",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1767,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"leaderStatus": {
			"id": 1768,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createWebsocketLeaderStatus(values?: Partial<WebsocketLeaderStatus>): WebsocketLeaderStatus {
	return Object.assign(create(_TypeModel, WebsocketLeaderStatusTypeRef), downcast<WebsocketLeaderStatus>(values))
}

export type WebsocketLeaderStatus = {
	_type: TypeRef<WebsocketLeaderStatus>;

	_format: NumberString;
	leaderStatus: boolean;
}