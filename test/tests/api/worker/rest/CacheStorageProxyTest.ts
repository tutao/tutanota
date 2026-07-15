import o, { verify } from "@tutao/otest"
import { func, instance, object, when } from "testdouble"
import { LateInitializedCacheStorageImpl } from "../../../../../src/app-kit/local-store/CacheStorageProxy.js"
import { WorkerImpl } from "../../../../../src/applications/mail-app/workerUtils/worker/WorkerImpl.js"
import { EphemeralCacheStorage } from "../../../../../src/app-kit/local-store/EphemeralCacheStorage"

import { OfflineStorageArgs } from "../../../../../src/platform-kit/base/facades/CacheStorageLateInitializer"
import { CachingOfflineStorage } from "../../../../../src/app-kit/local-store/CachingOfflineStorage"

o.spec("CacheStorageProxy", function () {
	const userId = "userId"
	const databaseKey = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

	let workerMock: WorkerImpl
	let cachingOfflineStorageMock: CachingOfflineStorage
	let offlineStorageProviderMock: () => Promise<null | CachingOfflineStorage>
	let ephemeralStorage: EphemeralCacheStorage

	let proxy: LateInitializedCacheStorageImpl

	o.beforeEach(function () {
		workerMock = instance(WorkerImpl)
		cachingOfflineStorageMock = instance(CachingOfflineStorage)
		offlineStorageProviderMock = func() as () => Promise<null | CachingOfflineStorage>
		ephemeralStorage = object()

		proxy = new LateInitializedCacheStorageImpl(
			async (error: Error) => {
				await workerMock.sendError(error)
			},
			async () => ephemeralStorage,
			offlineStorageProviderMock,
		)
	})

	o.spec("initialization", function () {
		o("should create a persistent storage when params are provided and local-store storage is enabled", async function () {
			when(offlineStorageProviderMock()).thenResolve(cachingOfflineStorageMock)

			const { isPersistent } = await proxy.initialize({
				type: "offline",
				userId,
				databaseKey,
				forceNewDatabase: false,
			})

			o(isPersistent).equals(true)
		})

		o("should create a ephemeral storage when no params are provided but local-store storage is enabled", async function () {
			when(offlineStorageProviderMock()).thenResolve(cachingOfflineStorageMock)

			const { isPersistent } = await proxy.initialize({ type: "ephemeral", userId })

			o(isPersistent).equals(false)
		})

		o("should create a ephemeral storage when params are provided but local-store storage is disabled", async function () {
			when(offlineStorageProviderMock()).thenResolve(null)

			const { isPersistent } = await proxy.initialize({
				type: "offline",
				userId,
				databaseKey,
				forceNewDatabase: false,
			})

			o(isPersistent).equals(false)
		})

		o("should create a ephemeral storage when no params are provided and local-store storage is disabled", async function () {
			when(offlineStorageProviderMock()).thenResolve(null)

			const { isPersistent } = await proxy.initialize({ type: "ephemeral", userId })

			o(isPersistent).equals(false)
		})

		o("will flag newDatabase as true when local-store storage says it is", async function () {
			when(offlineStorageProviderMock()).thenResolve(cachingOfflineStorageMock)
			const args: OfflineStorageArgs = {
				type: "offline",
				userId,
				databaseKey,
				forceNewDatabase: false,
			}
			when(cachingOfflineStorageMock.init(args)).thenResolve(true)

			const { isNewOfflineDb } = await proxy.initialize(args)

			o(isNewOfflineDb).equals(true)
		})

		o("will flag newDatabase as false when local-store storage says it is not", async function () {
			when(offlineStorageProviderMock()).thenResolve(cachingOfflineStorageMock)
			const args: OfflineStorageArgs = {
				type: "offline",
				userId,
				databaseKey,
				forceNewDatabase: false,
			}
			when(cachingOfflineStorageMock.init(args)).thenResolve(false)

			const { isNewOfflineDb } = await proxy.initialize(args)

			o(isNewOfflineDb).equals(false)
		})

		o("will fall back to an ephemeral storage when there is an error, and error is caught but sent to the worker", async function () {
			const error = new Error("oh no!!!")

			when(offlineStorageProviderMock()).thenReject(error)

			const { isPersistent } = await proxy.initialize({
				type: "offline",
				userId,
				databaseKey,
				forceNewDatabase: false,
			})

			o(isPersistent).equals(false)
			verify(workerMock.sendError(error))
		})
	})
})
