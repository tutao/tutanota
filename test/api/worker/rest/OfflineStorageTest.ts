import o from "ospec"
import {verify} from "@tutao/tutanota-test-utils"
import {OfflineStorage} from "../../../../src/api/worker/rest/OfflineStorage"
import {OfflineDbFacade} from "../../../../src/desktop/db/OfflineDbFacade"
import {matchers, object, when} from "testdouble"
import * as cborg from "cborg"
import {modelInfos} from "../../../../src/api/common/EntityFunctions"

o.spec("OfflineStorage", function () {
	o("when initialized and runtime version matches stored one database is not purged", async function () {
		const offlineDbFacadeMock = object<OfflineDbFacade>()
		const offlineStorage = new OfflineStorage(offlineDbFacadeMock)
		const userId = "546"
		const databaseKey = [1, 2, 3]
		const storedVersion = modelInfos["tutanota"].version
		when(offlineDbFacadeMock.getMetadata(userId, "tutanota-version")).thenResolve(cborg.encode(storedVersion))

		await offlineStorage.init(userId, databaseKey)

		verify(offlineDbFacadeMock.deleteAll(matchers.anything()), {times: 0})
	})
	o("when initialized and runtime version doesn't match stored database is purged", async function () {
		const offlineDbFacadeMock = object<OfflineDbFacade>()
		const offlineStorage = new OfflineStorage(offlineDbFacadeMock)
		const userId = "546"

		const databaseKey = [1, 2, 3]
		const storedVersion = 1
		when(offlineDbFacadeMock.getMetadata(userId, "tutanota-version")).thenResolve(cborg.encode(storedVersion))

		await offlineStorage.init(userId, databaseKey)

		verify(offlineDbFacadeMock.deleteAll(userId))
	})
	o("when initialized the model versions are written", async function () {
		const offlineDbFacadeMock = object<OfflineDbFacade>()
		const offlineStorage = new OfflineStorage(offlineDbFacadeMock)
		const userId = "546"
		const key = "tutanota-version"
		const value = modelInfos["tutanota"].version
		const databaseKey = [1, 2, 3]

		await offlineStorage.init(userId, databaseKey)

		verify(offlineDbFacadeMock.putMetadata(userId, key, cborg.encode(value)))
	})
})