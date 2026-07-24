import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { OfflineStorage, Range } from "../../../../src/app-kit/local-store/OfflineStorage"
import { EphemeralCacheStorage } from "../../../../src/app-kit/local-store/EphemeralCacheStorage"
import { CachingOfflineStorage } from "../../../../src/app-kit/local-store/CachingOfflineStorage"
import { OfflineStorageArgs } from "../../../../src/platform-kit/base/facades/CacheStorageLateInitializer"
import { CacheSyncStatus } from "../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { Entity, getElementId, ServerModelParsedInstance } from "../../../../src/platform-kit/meta"
import { dummyResolver, TestEntity, TestTypeRef } from "../../instance-pipeline/InstancePipelineTestUtils"
import { clientInitializedTypeModelResolver, createTestEntity, createTestEntityWithDummyResolver, modelMapperFromTypeModelResolver } from "../../TestUtils"
import {
	ClientTypeReferenceResolver,
	InstancePipeline,
	ModelMapper,
	ServerTypeReferenceResolver,
	TypeModelResolver,
} from "../../../../src/platform-kit/instance-pipeline"
import { SYMMETRIC_CIPHER_FACADE } from "../../../../src/platform-kit/crypto"
import { CustomCacheHandlerMap } from "../../../../src/app-kit/local-store/CustomCacheHandler"
import { LastUpdateTime } from "../../../../src/app-kit/local-store/CacheStorage"
import { MailSetEntry, MailSetEntryTypeRef } from "@tutao/entities/tutanota"
import { downcast } from "../../../../src/platform-kit/utils"

const { anything } = matchers
o.spec("CachingOfflineStorageTest", function () {
	let delegateMock: OfflineStorage
	let fastCacheMock: EphemeralCacheStorage
	let modelMapperMock: ModelMapper
	let cachingOfflineStorage: CachingOfflineStorage
	let dummyInstance: TestEntity
	let dummyServerModelParsedInstance: ServerModelParsedInstance
	let dummyInstance2: TestEntity
	let dummyServerModelParsedInstance2: ServerModelParsedInstance
	const dummyTypeRef = TestTypeRef
	const dummyListId = "listId"
	const dummyElementId = "elementId"
	const dummyElementId2 = "elementId2"
	const dummyOwner = "ownerGroup"
	const dummyInstancePipeline = new InstancePipeline(
		dummyResolver as ClientTypeReferenceResolver,
		dummyResolver as ServerTypeReferenceResolver,
		object(),
		SYMMETRIC_CIPHER_FACADE,
	)
	let typeModelResolver: TypeModelResolver
	let testModelMapper: ModelMapper

	o.beforeEach(async function () {
		delegateMock = object<OfflineStorage>()
		fastCacheMock = object<EphemeralCacheStorage>()
		modelMapperMock = object<ModelMapper>()
		dummyInstance = await createTestEntityWithDummyResolver(dummyTypeRef, { _id: [dummyListId, dummyElementId] })
		dummyInstance2 = await createTestEntityWithDummyResolver(dummyTypeRef, { _id: [dummyListId, dummyElementId2] })
		dummyServerModelParsedInstance = (await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
			dummyTypeRef,
			dummyInstance,
		)) as unknown as ServerModelParsedInstance
		dummyServerModelParsedInstance2 = (await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
			dummyTypeRef,
			dummyInstance2,
		)) as unknown as ServerModelParsedInstance
		cachingOfflineStorage = new CachingOfflineStorage(delegateMock, fastCacheMock, modelMapperMock)
		typeModelResolver = clientInitializedTypeModelResolver()
		testModelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
	})

	o.test("init - calls init on both storages and returns delegate init result", async () => {
		const initArgs = {} as OfflineStorageArgs
		when(delegateMock.init(initArgs)).thenResolve(true)
		const result = await cachingOfflineStorage.init(initArgs)
		o.check(result).equals(true)
		verify(delegateMock.init(initArgs), { times: 1 })
		verify(fastCacheMock.init(initArgs), { times: 1 })
	})

	o.test("deinit - sets status to offline, purges fastCache, deinitializes delegate", async () => {
		await cachingOfflineStorage.deinit()
		verify(fastCacheMock.purgeStorage(), { times: 1 })
		verify(delegateMock.deinit(), { times: 1 })
	})

	o.test("isInitialized - delegates to delegate", () => {
		when(delegateMock.isInitialized()).thenReturn(true)
		o.check(cachingOfflineStorage.isInitialized()).equals(true)
		when(delegateMock.isInitialized()).thenReturn(false)
		o.check(cachingOfflineStorage.isInitialized()).equals(false)
	})

	o.test("purgeStorage - calls delegate and fast cache", async () => {
		await cachingOfflineStorage.purgeStorage()
		verify(delegateMock.purgeStorage(), { times: 1 })
		verify(fastCacheMock.purgeStorage(), { times: 1 })
	})

	o.test("getCustomCacheHandlerMap - delegates to delegate", async () => {
		const map = object<CustomCacheHandlerMap>()
		when(delegateMock.getCustomCacheHandlerMap()).thenReturn(map)
		const result = cachingOfflineStorage.getCustomCacheHandlerMap()
		o.check(result).equals(map)
	})

	o.test("getUserId - delegates to delegate", () => {
		when(delegateMock.getUserId()).thenReturn("userId")
		const result = cachingOfflineStorage.getUserId()
		o.check(result).equals("userId")
	})

	o.test("getLastUpdateTime - delegates to delegate", async () => {
		const time = object<LastUpdateTime>()
		when(delegateMock.getLastUpdateTime()).thenResolve(time)
		const result = await cachingOfflineStorage.getLastUpdateTime()
		o.check(result).equals(time)
	})

	o.test("putLastUpdateTime - delegates to delegate", async () => {
		when(delegateMock.putLastUpdateTime(123)).thenResolve(undefined)
		await cachingOfflineStorage.putLastUpdateTime(123)
		verify(delegateMock.putLastUpdateTime(123), { times: 1 })
	})

	o.test("put - delegates to both storages - when", async () => {
		await cachingOfflineStorage.put(dummyTypeRef, dummyServerModelParsedInstance)
		verify(delegateMock.put(dummyTypeRef, dummyServerModelParsedInstance), { times: 1 })
		verify(fastCacheMock.put(dummyTypeRef, dummyServerModelParsedInstance), { times: 1 })
	})

	o.test("putMultiple - delegates to both storages", async () => {
		const instances = [dummyServerModelParsedInstance, dummyServerModelParsedInstance2]
		await cachingOfflineStorage.putMultiple(dummyTypeRef, instances)
		verify(delegateMock.putMultiple(dummyTypeRef, instances), { times: 1 })
		verify(fastCacheMock.putMultiple(dummyTypeRef, instances), { times: 1 })
	})

	o.test("deleteIfExists - delegates to both storages", async () => {
		await cachingOfflineStorage.deleteIfExists(dummyTypeRef, dummyListId, dummyElementId)
		verify(delegateMock.deleteIfExists(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
		verify(fastCacheMock.deleteIfExists(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
	})

	o.test("deleteMultiple - delegates to both storages", async () => {
		const ids = [dummyInstance._id, dummyInstance2._id]
		await cachingOfflineStorage.deleteMultiple(dummyTypeRef, ids)
		verify(delegateMock.deleteMultiple(dummyTypeRef, ids), { times: 1 })
		verify(fastCacheMock.deleteMultiple(dummyTypeRef, ids), { times: 1 })
	})

	o.test("deleteAllOwnedBy - delegates to both storages", async () => {
		await cachingOfflineStorage.deleteAllOwnedBy(dummyOwner)
		verify(delegateMock.deleteAllOwnedBy(dummyOwner), { times: 1 })
		verify(fastCacheMock.deleteAllOwnedBy(dummyOwner), { times: 1 })
	})

	o.spec("setCacheSyncStatus", () => {
		o.test("OnlineSyncDone calls deleteAllRanges", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			verify(fastCacheMock.deleteAllRanges(), { times: 1 })
		})

		o.test("Offline calls purgeStorage", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.Offline)
			verify(fastCacheMock.purgeStorage(), { times: 1 })
		})

		o.test("setCacheSyncStatus - other states do not call fast cache cleanup", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			verify(fastCacheMock.deleteAllRanges(), { times: 0 })
			verify(fastCacheMock.purgeStorage(), { times: 0 })
		})
	})

	o.spec("get", () => {
		o.test("sync ongoing: returns from fast cache, does not call delegate", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyInstance)

			const result = await cachingOfflineStorage.get(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(dummyInstance)
			verify(delegateMock.getParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache hit returns immediately", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyInstance)

			const result = await cachingOfflineStorage.get(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(dummyInstance)
			verify(delegateMock.getParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache miss fetches from delegate and caches", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null)

			when(delegateMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyServerModelParsedInstance)
			when(fastCacheMock.put(dummyTypeRef, dummyServerModelParsedInstance)).thenResolve(undefined)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null, dummyInstance)

			const result = await cachingOfflineStorage.get(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).notEquals(null)
			verify(fastCacheMock.put(dummyTypeRef, dummyServerModelParsedInstance), { times: 1 })
			verify(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId), { times: 2 })
		})

		o.test("offline: fast cache miss fetches from delegate and does NOT cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.Offline)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null)

			when(delegateMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyServerModelParsedInstance)
			when(fastCacheMock.put(dummyTypeRef, dummyServerModelParsedInstance)).thenResolve(undefined)
			when(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null, dummyInstance)
			when(modelMapperMock.mapToInstance(dummyTypeRef, dummyServerModelParsedInstance)).thenResolve(dummyInstance)

			const result = await cachingOfflineStorage.get(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).notEquals(null)
			verify(fastCacheMock.put(dummyTypeRef, dummyServerModelParsedInstance), { times: 0 })
			verify(fastCacheMock.get(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
		})
	})

	o.spec("getParsed", () => {
		o.test("sync ongoing: returns from fast cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			when(fastCacheMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyServerModelParsedInstance)

			const result = await cachingOfflineStorage.getParsed(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(dummyServerModelParsedInstance)
			verify(delegateMock.getParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache hit returns immediately", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			when(fastCacheMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(dummyServerModelParsedInstance)

			const result = await cachingOfflineStorage.getParsed(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(dummyServerModelParsedInstance)
			verify(delegateMock.getParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache miss fetches from delegate and caches", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			when(fastCacheMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null)

			const delegateParsed = {} as ServerModelParsedInstance
			when(delegateMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(delegateParsed)

			const result = await cachingOfflineStorage.getParsed(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(delegateParsed)
			verify(fastCacheMock.put(anything(), anything()), { times: 1 })
		})

		o.test("offline: fast cache miss fetches from delegate and does NOT cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.Offline)
			when(fastCacheMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(null)

			const delegateParsed = {} as ServerModelParsedInstance
			when(delegateMock.getParsed(dummyTypeRef, dummyListId, dummyElementId)).thenResolve(delegateParsed)

			const result = await cachingOfflineStorage.getParsed(dummyTypeRef, dummyListId, dummyElementId)
			o.check(result).equals(delegateParsed)
			verify(fastCacheMock.put(anything(), anything()), { times: 0 })
		})
	})

	o.spec("getWholeList", () => {
		o.test("sync ongoing: returns from fast cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			const list = [dummyInstance]
			when(fastCacheMock.getWholeList(dummyTypeRef, dummyListId)).thenResolve(list)

			const result = await cachingOfflineStorage.getWholeList(dummyTypeRef, dummyListId)
			o.check(result).equals(list)
			verify(delegateMock.getWholeList(anything(), anything()), { times: 0 })
		})

		o.test("non-sync: always calls delegate, ignoring fast cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			const delegateList = [dummyInstance]
			when(delegateMock.getWholeList(dummyTypeRef, dummyListId)).thenResolve(delegateList)
			// even if fast cache returns something, it should be ignored
			when(fastCacheMock.getWholeList(dummyTypeRef, dummyListId)).thenResolve([dummyInstance2])

			const result = await cachingOfflineStorage.getWholeList(dummyTypeRef, dummyListId)
			o.check(result).equals(delegateList)
		})
	})

	o.spec("getWholeListParsed", () => {
		o.test("sync ongoing: returns from fast cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			const parsedList = [dummyServerModelParsedInstance]
			when(fastCacheMock.getWholeListParsed(dummyTypeRef, dummyListId)).thenResolve(parsedList)

			const result = await cachingOfflineStorage.getWholeListParsed(dummyTypeRef, dummyListId)
			o.check(result).equals(parsedList)
			verify(delegateMock.getWholeListParsed(anything(), anything()), { times: 0 })
		})

		o.test("non-sync: always calls delegate", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)

			const delegateList = [dummyServerModelParsedInstance]
			when(delegateMock.getWholeListParsed(dummyTypeRef, dummyListId)).thenResolve(delegateList)
			when(fastCacheMock.getWholeListParsed(dummyTypeRef, dummyListId)).thenResolve([dummyServerModelParsedInstance2])

			const result = await cachingOfflineStorage.getWholeListParsed(dummyTypeRef, dummyListId)
			o.check(result).equals(delegateList)
		})
	})

	o.spec("provideMultiple", () => {
		o.test("sync ongoing: returns from fast cache, no delegate call", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			const ids = [dummyElementId, dummyElementId2]
			when(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids)).thenResolve([dummyInstance2])

			const result = await cachingOfflineStorage.provideMultiple(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals([dummyInstance2])
			verify(delegateMock.provideMultipleParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache has all ids, returns fast result", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			const ids = [dummyElementId, dummyElementId2]
			when(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids)).thenResolve([dummyInstance, dummyInstance2])

			const result = await cachingOfflineStorage.provideMultiple(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals([dummyInstance, dummyInstance2])
			verify(delegateMock.provideMultipleParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache incomplete, fetches from delegate and caches", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			const ids = [getElementId(dummyInstance), getElementId(dummyInstance2)]
			const fastPartial = [dummyInstance]
			const delegateParsed = [dummyServerModelParsedInstance, dummyServerModelParsedInstance2]
			const finalFast = [dummyInstance, dummyInstance2]
			let callCount = 0
			when(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids)).thenDo(() => {
				if (callCount === 0) {
					callCount++
					return Promise.resolve(fastPartial)
				} else {
					return Promise.resolve(finalFast)
				}
			})

			when(delegateMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(delegateParsed)
			when(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed)).thenResolve(undefined)

			const result = await cachingOfflineStorage.provideMultiple(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals(finalFast)
			verify(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed), { times: 1 })
			verify(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids), { times: 2 })
		})

		o.test("offline: fast cache incomplete, fetches from delegate and does NOT cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.Offline)
			const ids = [getElementId(dummyInstance), getElementId(dummyInstance2)]
			const fastPartial = [dummyInstance]
			const delegateParsed = [dummyServerModelParsedInstance, dummyServerModelParsedInstance2]
			const delegateInstances = [dummyInstance, dummyInstance2]
			when(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids)).thenResolve(fastPartial)

			when(delegateMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(delegateParsed)
			when(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed)).thenResolve(undefined)
			when(modelMapperMock.mapToInstances(dummyTypeRef, delegateParsed)).thenResolve(delegateInstances)

			const result = await cachingOfflineStorage.provideMultiple(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals(delegateInstances)
			verify(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed), { times: 0 })
			verify(fastCacheMock.provideMultiple(dummyTypeRef, dummyListId, ids), { times: 1 })
		})
	})

	o.spec("provideMultipleParsed", () => {
		o.test("sync ongoing: returns from fast cache", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			const ids = [getElementId(dummyInstance)]
			when(fastCacheMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve([dummyServerModelParsedInstance])

			const result = await cachingOfflineStorage.provideMultipleParsed(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals([dummyServerModelParsedInstance])
			verify(delegateMock.provideMultipleParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: fast cache has all, returns fast result", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			const ids = [dummyElementId]
			when(fastCacheMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve([dummyServerModelParsedInstance])

			const result = await cachingOfflineStorage.provideMultipleParsed(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals([dummyServerModelParsedInstance])
			verify(delegateMock.provideMultipleParsed(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: incomplete fast cache, fetches delegate, caches, returns delegate", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			const ids = [dummyElementId, dummyElementId2]
			const fastPartial = [dummyServerModelParsedInstance]
			const delegateParsed = [dummyServerModelParsedInstance, dummyServerModelParsedInstance2]

			when(fastCacheMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(fastPartial)
			when(delegateMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(delegateParsed)
			when(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed)).thenResolve(undefined)

			const result = await cachingOfflineStorage.provideMultipleParsed(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals(delegateParsed)
			verify(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed), { times: 1 })
		})

		o.test("offline: incomplete fast cache, fetches delegate, does NOT cache, returns delegate", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.Offline)
			const ids = [dummyElementId, dummyElementId2]
			const fastPartial = [dummyServerModelParsedInstance]
			const delegateParsed = [dummyServerModelParsedInstance, dummyServerModelParsedInstance2]

			when(fastCacheMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(fastPartial)
			when(delegateMock.provideMultipleParsed(dummyTypeRef, dummyListId, ids)).thenResolve(delegateParsed)
			when(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed)).thenResolve(undefined)

			const result = await cachingOfflineStorage.provideMultipleParsed(dummyTypeRef, dummyListId, ids)
			o.check(result).deepEquals(delegateParsed)
			verify(fastCacheMock.putMultiple(dummyTypeRef, delegateParsed), { times: 0 })
		})
	})

	o.spec("setLowerRangeForList", () => {
		o.test("sync ongoing: delegates to fastCache only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			await cachingOfflineStorage.setLowerRangeForList(dummyTypeRef, dummyListId, dummyElementId)
			verify(fastCacheMock.setLowerRangeForList(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
			verify(delegateMock.setLowerRangeForList(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: delegates to delegate only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			await cachingOfflineStorage.setLowerRangeForList(dummyTypeRef, dummyListId, dummyElementId)
			verify(delegateMock.setLowerRangeForList(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
			verify(fastCacheMock.setLowerRangeForList(anything(), anything(), anything()), { times: 0 })
		})
	})

	o.spec("setNewRangeForList", () => {
		o.test("sync ongoing: delegates to fastCache only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			await cachingOfflineStorage.setNewRangeForList(dummyTypeRef, dummyListId, dummyElementId, dummyElementId2)
			verify(fastCacheMock.setNewRangeForList(dummyTypeRef, dummyListId, dummyElementId, dummyElementId2), { times: 1 })
			verify(delegateMock.setNewRangeForList(anything(), anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: delegates to delegate only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			await cachingOfflineStorage.setNewRangeForList(dummyTypeRef, dummyListId, dummyElementId, dummyElementId2)
			verify(delegateMock.setNewRangeForList(dummyTypeRef, dummyListId, dummyElementId, dummyElementId2), { times: 1 })
			verify(fastCacheMock.setNewRangeForList(anything(), anything(), anything(), anything()), { times: 0 })
		})
	})

	o.spec("setUpperRangeForList", () => {
		o.test("sync ongoing: delegates to fastCache only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
			await cachingOfflineStorage.setUpperRangeForList(dummyTypeRef, dummyListId, dummyElementId)
			verify(fastCacheMock.setUpperRangeForList(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
			verify(delegateMock.setUpperRangeForList(anything(), anything(), anything()), { times: 0 })
		})

		o.test("non-sync: delegates to delegate only", async () => {
			await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncDone)
			await cachingOfflineStorage.setUpperRangeForList(dummyTypeRef, dummyListId, dummyElementId)
			verify(delegateMock.setUpperRangeForList(dummyTypeRef, dummyListId, dummyElementId), { times: 1 })
			verify(fastCacheMock.setUpperRangeForList(anything(), anything(), anything()), { times: 0 })
		})
	})

	o.spec("range requests", () => {
		o.spec("deleteRange", () => {
			const listId = "listId"

			o.test("deleteRange", async () => {
				await cachingOfflineStorage.deleteRange(MailSetEntryTypeRef, listId)

				verify(delegateMock.deleteRange(MailSetEntryTypeRef, listId))
				verify(fastCacheMock.deleteRange(MailSetEntryTypeRef, listId))
			})

			o.test("deleteRange - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				await cachingOfflineStorage.deleteRange(MailSetEntryTypeRef, listId)

				verify(delegateMock.deleteRange(MailSetEntryTypeRef, listId))
				verify(fastCacheMock.deleteRange(MailSetEntryTypeRef, listId))
			})
		})

		o.spec("getIdsInRange", () => {
			const listId = "listId"
			const mailSetEntryIds = ["mailSetEntryId1", "mailSetEntryId2", "mailSetEntryId3"]

			o.beforeEach(async () => {
				when(delegateMock.getIdsInRange(MailSetEntryTypeRef, listId)).thenResolve(mailSetEntryIds)
				when(fastCacheMock.getIdsInRange(MailSetEntryTypeRef, listId)).thenResolve([])
			})

			o.test("getIdsInRange", async () => {
				const result = await cachingOfflineStorage.getIdsInRange(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getIdsInRange(MailSetEntryTypeRef, listId))
				verify(delegateMock.getIdsInRange(MailSetEntryTypeRef, listId))

				o.check(result).deepEquals(mailSetEntryIds)
			})

			o.test("getIdsInRange - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.getIdsInRange(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getIdsInRange(MailSetEntryTypeRef, listId))
				verify(delegateMock.getIdsInRange(MailSetEntryTypeRef, listId), { times: 0 })

				o.check(result).deepEquals([])
			})

			o.test("getIdsInRange - fastCache NOT empty", async () => {
				when(fastCacheMock.getIdsInRange(MailSetEntryTypeRef, listId)).thenReturn(Promise.resolve(mailSetEntryIds))

				const result = await cachingOfflineStorage.getIdsInRange(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getIdsInRange(MailSetEntryTypeRef, listId))
				verify(delegateMock.getIdsInRange(MailSetEntryTypeRef, listId), { times: 0 })

				o.check(result).deepEquals(mailSetEntryIds)
			})
		})

		o.spec("getRangeForList", () => {
			const listId = "listId"
			const delegateRange: Range = { lower: "lowerRangeId", upper: "upperRangeId" }

			o.beforeEach(async () => {
				when(delegateMock.getRangeForList(MailSetEntryTypeRef, listId)).thenResolve(delegateRange)
				when(fastCacheMock.getRangeForList(MailSetEntryTypeRef, listId)).thenResolve(null)
			})

			o.test("getRangeForList", async () => {
				const result = await cachingOfflineStorage.getRangeForList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getRangeForList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getRangeForList(MailSetEntryTypeRef, listId))

				o.check(result).equals(delegateRange)
			})

			o.test("getRangeForList - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.getRangeForList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getRangeForList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getRangeForList(MailSetEntryTypeRef, listId), { times: 0 })

				o.check(result).equals(null)
			})

			o.test("getRangeForList - fastCache NOT empty", async () => {
				const fastCacheRange: Range = { lower: "fastCacheLowerRangeId", upper: "fastCacheUpperRangeId" }
				when(fastCacheMock.getRangeForList(MailSetEntryTypeRef, listId)).thenReturn(Promise.resolve(delegateRange))

				const result = await cachingOfflineStorage.getRangeForList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getRangeForList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getRangeForList(MailSetEntryTypeRef, listId))

				return o.check(result).equals(delegateRange)
			})
		})

		o.spec("getWholeList", () => {
			const listId = "listId"
			const mailSetEntries: MailSetEntry[] = [
				createTestEntity(MailSetEntryTypeRef),
				createTestEntity(MailSetEntryTypeRef),
				createTestEntity(MailSetEntryTypeRef),
			]

			o.beforeEach(async () => {
				when(delegateMock.getWholeList(MailSetEntryTypeRef, listId)).thenResolve(mailSetEntries)
				when(fastCacheMock.getWholeList(MailSetEntryTypeRef, listId)).thenResolve([])
			})

			o.test("getWholeList", async () => {
				const result = await cachingOfflineStorage.getWholeList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeList(MailSetEntryTypeRef, listId))

				o.check(result).equals(mailSetEntries)
			})

			o.test("getWholeList - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.getWholeList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeList(MailSetEntryTypeRef, listId), { times: 0 })

				o.check(result).deepEquals([])
			})

			o.test("getWholeList - fastCache NOT empty", async () => {
				const fastCacheMailSetEntries: MailSetEntry[] = [
					createTestEntity(MailSetEntryTypeRef),
					createTestEntity(MailSetEntryTypeRef),
					createTestEntity(MailSetEntryTypeRef),
				]
				when(fastCacheMock.getWholeList(MailSetEntryTypeRef, listId)).thenResolve(fastCacheMailSetEntries)

				const result = await cachingOfflineStorage.getWholeList(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeList(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeList(MailSetEntryTypeRef, listId))

				return o.check(result).deepEquals(mailSetEntries)
			})
		})

		o.spec("getWholeListParsed", () => {
			const listId = "listId"
			let mailSetEntriesParsedInstances: ServerModelParsedInstance[] = []

			o.beforeEach(async () => {
				const parsedInstance1 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const parsedInstance2 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const parsedInstance3 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))

				mailSetEntriesParsedInstances = [parsedInstance1, parsedInstance2, parsedInstance3]
				when(delegateMock.getWholeListParsed(MailSetEntryTypeRef, listId)).thenResolve(mailSetEntriesParsedInstances)
				when(fastCacheMock.getWholeListParsed(MailSetEntryTypeRef, listId)).thenResolve([])
			})

			o.test("getWholeListParsed", async () => {
				const result = await cachingOfflineStorage.getWholeListParsed(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeListParsed(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeListParsed(MailSetEntryTypeRef, listId))

				o.check(result).equals(mailSetEntriesParsedInstances)
			})

			o.test("getWholeListParsed - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.getWholeListParsed(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeListParsed(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeListParsed(MailSetEntryTypeRef, listId), { times: 0 })

				o.check(result).deepEquals([])
			})

			o.test("getWholeListParsed - fastCache NOT empty", async () => {
				const fastCacheParsedInstance1 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheParsedInstance2 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheParsedInstance3 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheMailSetEntriesParsedInstances = [fastCacheParsedInstance1, fastCacheParsedInstance2, fastCacheParsedInstance3]
				when(fastCacheMock.getWholeListParsed(MailSetEntryTypeRef, listId)).thenResolve(fastCacheMailSetEntriesParsedInstances)

				const result = await cachingOfflineStorage.getWholeListParsed(MailSetEntryTypeRef, listId)

				verify(fastCacheMock.getWholeListParsed(MailSetEntryTypeRef, listId))
				verify(delegateMock.getWholeListParsed(MailSetEntryTypeRef, listId))

				return o.check(result).deepEquals(mailSetEntriesParsedInstances)
			})
		})

		o.spec("isElementIdInCacheRange", () => {
			const listId = "listId"
			const elementId = "elementId"
			const isElementInCacheRange = true

			o.beforeEach(async () => {
				when(delegateMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)).thenResolve(isElementInCacheRange)
				when(fastCacheMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)).thenResolve(false)
			})

			o.test("isElementIdInCacheRange", async () => {
				const result = await cachingOfflineStorage.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)

				verify(fastCacheMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId))
				verify(delegateMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId))

				o.check(result).deepEquals(isElementInCacheRange)
			})

			o.test("isElementIdInCacheRange - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)

				verify(fastCacheMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId))
				verify(delegateMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId), { times: 0 })

				o.check(result).deepEquals(false)
			})

			o.test("isElementIdInCacheRange - fastCache NOT empty", async () => {
				when(delegateMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)).thenResolve(false)
				when(fastCacheMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)).thenResolve(true)

				const result = await cachingOfflineStorage.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId)

				verify(fastCacheMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId))
				verify(delegateMock.isElementIdInCacheRange(MailSetEntryTypeRef, listId, elementId))

				o.check(result).deepEquals(false)
			})
		})

		o.spec("provideFromRange", () => {
			const listId = "listId"
			const startId = "startId"
			const count = 3
			const reverse = false
			const mailSetEntries: MailSetEntry[] = [
				createTestEntity(MailSetEntryTypeRef),
				createTestEntity(MailSetEntryTypeRef),
				createTestEntity(MailSetEntryTypeRef),
			]

			o.beforeEach(async () => {
				when(delegateMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve(mailSetEntries)
				when(fastCacheMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve([])
			})

			o.test("provideFromRange", async () => {
				const result = await cachingOfflineStorage.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse))

				o.check(result).equals(mailSetEntries)
			})

			o.test("provideFromRange - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse), { times: 0 })

				o.check(result).deepEquals([])
			})

			o.test("provideFromRange - fastCache NOT empty", async () => {
				const fastCacheMailSetEntries: MailSetEntry[] = [
					createTestEntity(MailSetEntryTypeRef),
					createTestEntity(MailSetEntryTypeRef),
					createTestEntity(MailSetEntryTypeRef),
				]
				when(fastCacheMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve(fastCacheMailSetEntries)

				const result = await cachingOfflineStorage.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRange(MailSetEntryTypeRef, listId, startId, count, reverse))

				return o.check(result).deepEquals(mailSetEntries)
			})
		})

		o.spec("provideFromRangeParsed", () => {
			const listId = "listId"
			const startId = "startId"
			const count = 3
			const reverse = false
			let mailSetEntriesParsedInstances: ServerModelParsedInstance[] = []

			o.beforeEach(async () => {
				const parsedInstance1 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const parsedInstance2 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const parsedInstance3 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))

				mailSetEntriesParsedInstances = [parsedInstance1, parsedInstance2, parsedInstance3]
				when(delegateMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve(mailSetEntriesParsedInstances)
				when(fastCacheMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve([])
			})

			o.test("provideFromRangeParsed", async () => {
				const result = await cachingOfflineStorage.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse))

				o.check(result).equals(mailSetEntriesParsedInstances)
			})

			o.test("provideFromRangeParsed - onlyUseFastCache", async () => {
				await cachingOfflineStorage.setCacheSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

				const result = await cachingOfflineStorage.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse), { times: 0 })

				o.check(result).deepEquals([])
			})

			o.test("provideFromRangeParsed - fastCache NOT empty", async () => {
				const fastCacheParsedInstance1 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheParsedInstance2 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheParsedInstance3 = await toStorableInstance(createTestEntity(MailSetEntryTypeRef))
				const fastCacheMailSetEntriesParsedInstances = [fastCacheParsedInstance1, fastCacheParsedInstance2, fastCacheParsedInstance3]
				when(fastCacheMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)).thenResolve(
					fastCacheMailSetEntriesParsedInstances,
				)

				const result = await cachingOfflineStorage.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse)

				verify(fastCacheMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse))
				verify(delegateMock.provideFromRangeParsed(MailSetEntryTypeRef, listId, startId, count, reverse))

				return o.check(result).deepEquals(mailSetEntriesParsedInstances)
			})
		})
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await testModelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}
})
