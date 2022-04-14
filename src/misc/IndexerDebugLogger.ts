// This file exists for the express purpose of debugging the regular loss of the search index.
// Once this problem is solved we should get rid of this
// https://github.com/tutao/tutanota/issues/2453
import type {User} from "../api/entities/sys/TypeRefs.js"
import {getEtId} from "../api/common/utils/EntityUtils"
import {client} from "./ClientDetector"

const LOG_KEY = "indexedDebugLogs"

export function getSearchIndexDebugLogs(): string | null {
	return client.localStorage() ? window.localStorage.getItem(LOG_KEY) : null
}

export function addSearchIndexDebugEntry(message: string, user: User) {
	const entry = `${Date()}: User [${getEtId(user)}]: ${message}`
	console.warn(entry)

	if (client.localStorage()) {
		const logs = window.localStorage.getItem(LOG_KEY)
		window.localStorage.setItem(LOG_KEY, `${logs || ""}${entry}\n`)
	}
}