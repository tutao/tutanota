// @flow

import o from "ospec"
import {client} from "../../../src/misc/ClientDetector"
import {downcast} from "../../../src/api/common/utils/Utils"
import {createUser} from "../../../src/api/entities/sys/User"
import {addSearchIndexDeletedLogEntry, getSearchIndexDeletedLogs} from "../../../src/misc/IndexerDebugLogger"

node(() => {
	o.spec("IndexerDebugLoggerTest", function () {

		let localStorageStub
		o.beforeEach(function () {
			localStorageStub = ""
			window.localStorage = {
				getItem: o.spy(function (key) { return localStorageStub }),
				setItem: o.spy(function (_key, val) { localStorageStub = val })
			}
			downcast(client).localStorage = function () { return true }
		})

		o("write log", function () {
			const now = new Date()
			const reason = "it was mean to me"
			const user = createUser({_id: "id"})

			addSearchIndexDeletedLogEntry(now, reason, user)

			o(window.localStorage.getItem.callCount).equals(1)
			o(window.localStorage.setItem.callCount).equals(1)
		})

		o("read logs", function () {

			localStorageStub = "this is the log\nthe whole log"
			const logs = getSearchIndexDeletedLogs()

			o(logs).equals(localStorageStub)
		})
	})
})
