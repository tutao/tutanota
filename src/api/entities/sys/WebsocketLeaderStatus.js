// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1767,
			"since": 64,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"leaderStatus": {
			"name": "leaderStatus",
			"id": 1768,
			"since": 64,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "64"
}

export function createWebsocketLeaderStatus(values?: $Shape<$Exact<WebsocketLeaderStatus>>): WebsocketLeaderStatus {
	return Object.assign(create(_TypeModel, WebsocketLeaderStatusTypeRef), values)
}

export type WebsocketLeaderStatus = {
	_type: TypeRef<WebsocketLeaderStatus>;

	_format: NumberString;
	leaderStatus: boolean;
}