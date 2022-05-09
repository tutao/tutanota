import o from "ospec"
import {LateInitializedCacheStorageImpl} from "../../../../src/api/worker/rest/CacheStorageProxy"
import {WorkerImpl} from "../../../../src/api/worker/WorkerImpl"
import {NativeInterface} from "../../../../src/native/common/NativeInterface"
import {func, instance, object, when} from "testdouble"
import {OfflineDbFacade} from "../../../../src/desktop/db/OfflineDbFacade"
import {EphemeralCacheStorage} from "../../../../src/api/worker/rest/EphemeralCacheStorage"
import {OfflineStorage} from "../../../../src/api/worker/rest/OfflineStorage"
import {verify} from "@tutao/tutanota-test-utils"

o.spec("CacheStorageProxy", function () {

	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	let workerMock: WorkerImpl
	let offlineStorageMock: OfflineStorage
	let offlineStorageProviderMock: () => Promise<null | OfflineStorage>

	let proxy: LateInitializedCacheStorageImpl

	o.beforeEach(function () {
		workerMock = instance(WorkerImpl)
		offlineStorageMock = instance(OfflineStorage)
		offlineStorageProviderMock = func() as () => Promise<null | OfflineStorage>

		proxy = new LateInitializedCacheStorageImpl(
			workerMock,
			offlineStorageProviderMock
		)
	})

	o.spec("initialization", function() {
		o("should create a persistent storage when params are provided and offline storage is enabled", async function() {
			when(offlineStorageProviderMock()).thenResolve(offlineStorageMock)

			const {isPersistent} = await proxy.initialize({userId, databaseKey})

			o(isPersistent).equals(true)
		})

		o("should create a ephemeral storage when no params are provided but offline storage is enabled", async function() {
			when(offlineStorageProviderMock()).thenResolve(offlineStorageMock)

			const {isPersistent} = await proxy.initialize(null)

			o(isPersistent).equals(false)
		})

		o("should create a ephemeral storage when params are provided but offline storage is disabled", async function() {
			when(offlineStorageProviderMock()).thenResolve(null)

			const {isPersistent} = await proxy.initialize({userId, databaseKey})

			o(isPersistent).equals(false)
		})

		o("should create a ephemeral storage when no params are provided and offline storage is disabled", async function() {
			when(offlineStorageProviderMock()).thenResolve(null)

			const {isPersistent} = await proxy.initialize(null)

			o(isPersistent).equals(false)
		})

		o("will flag newDatabase as true when no metdata is stored", async function() {
			when(offlineStorageProviderMock()).thenResolve(offlineStorageMock)
			when(offlineStorageMock.getLastUpdateTime()).thenResolve(null)

			const {isNewOfflineDb} = await proxy.initialize({userId, databaseKey})

			o(isNewOfflineDb).equals(true)
		})

		o("will flag newDatabase as false when metdata is stored", async function() {
			when(offlineStorageProviderMock()).thenResolve(offlineStorageMock)
			when(offlineStorageMock.getLastUpdateTime()).thenResolve(Date.now())

			const {isNewOfflineDb} = await proxy.initialize({userId, databaseKey})

			o(isNewOfflineDb).equals(false)
		})

		o("will clear excluded data from the offline database", async function() {
			when(offlineStorageProviderMock()).thenResolve(offlineStorageMock)

			await proxy.initialize({userId, databaseKey})

			verify(offlineStorageMock.clearExcludedData())
		})

		o("will fall back to an ephemeral storage when there is an error, and error is caught but sent to the worker", async function() {
			const error = new Error("oh no!!!")

			when(offlineStorageProviderMock()).thenReject(error)

			const {isPersistent} = await proxy.initialize({userId, databaseKey})

			o(isPersistent).equals(false)
			verify(workerMock.sendError(error))
		})
	})

})