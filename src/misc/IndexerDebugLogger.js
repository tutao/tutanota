// @flow

// This file exists for the express purpose of debugging the regular loss of the search index.
// Once this problem is solved we should get rid of this
// https://github.com/tutao/tutanota/issues/2453

import type {User} from "../api/entities/sys/User"
import {getEtId} from "../api/common/utils/EntityUtils"
import {client} from "./ClientDetector"

const LOG_KEY = "indexedDebugLogs"

export function getSearchIndexDeletedLogs(): ?string {
	return client.localStorage()
		? window.localStorage.getItem(LOG_KEY)
		: null
}

export function addSearchIndexDeletedLogEntry(timestamp: Date, reason: string, user: User) {
	const entry = `${timestamp.toUTCString()}: Deleted index for user [${getEtId(user)} because: ${reason}`
	if (client.localStorage()) {
		const logs = window.localStorage.getItem(LOG_KEY)
		window.localStorage.setItem(LOG_KEY, `${logs || ""}${entry}\n`)
	} else {
		console.warn(entry)
	}
}


