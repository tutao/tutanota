import o from "@tutao/otest"
import { instance, matchers, verify, when } from "testdouble"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { createEventElementId } from "../../../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { EntityRestClient } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { LateInitializedCacheStorageImpl } from "../../../../../src/common/api/worker/rest/CacheStorageProxy.js"
import { CUSTOM_MAX_ID, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT } from "@tutao/typerefs"
import { numberRange, promiseMap } from "@tutao/utils"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../../TestUtils.js"
import { ModelMapper } from "@tutao/instance-pipeline"
import { ServerModelParsedInstance } from "@tutao/typerefs"
import { CustomCalendarEventCacheHandler } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCalendarEventCacheHandler"

o.spec("Custom calendar events handler", function () {
	const entityRestClientMock = instance(EntityRestClient)
	let cacheHandler: CustomCalendarEventCacheHandler
	const offlineStorageMock = instance(LateInitializedCacheStorageImpl)
	let modelMapper: ModelMapper
	const listId = "listId"
	let timestamp = Date.now()
	const ids = [0, 1, 2, 3, 4, 5, 6].map((n) => createEventElementId(timestamp, n))
	const allList = [0, 1, 2, 3, 4, 5, 6].map((n) => createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, { _id: [listId, ids[n]] }))

	const bigListId = "bigListId"
	const bigListIds = numberRange(0, 299).map((n) => createEventElementId(timestamp, n))
	const bigList = numberRange(0, 299).map((n) => createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, { _id: [bigListId, bigListIds[n]] }))
	const toElementId = (e) => e._id[1]

	o.beforeEach(() => {
		const typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		cacheHandler = new CustomCalendarEventCacheHandler(entityRestClientMock, typeModelResolver)
	})

	o.spec("Load elements from cache", function () {
		o.beforeEach(async function () {
			const allListParsedInstance = await promiseMap(
				allList,
				async (instance) =>
					(await modelMapper.mapToClientModelParsedInstance(tutanotaTypeRefs.CalendarEventTypeRef, instance)) as unknown as ServerModelParsedInstance,
			)
			when(offlineStorageMock.getWholeListParsed(tutanotaTypeRefs.CalendarEventTypeRef, listId)).thenResolve(allListParsedInstance)
			when(offlineStorageMock.getRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId)).thenResolve({
				lower: CUSTOM_MIN_ID,
				upper: CUSTOM_MAX_ID,
			})
			when(entityRestClientMock.mapInstancesToEntity(tutanotaTypeRefs.CalendarEventTypeRef, allListParsedInstance)).thenResolve(allList)
		})

		o("load range returns n elements following but excluding start id", async function () {
			const res = await cacheHandler.loadRange(offlineStorageMock, listId, ids[0], 3, false)
			o(res.map(toElementId)).deepEquals(allList.map(toElementId).slice(1, 4))
		})

		o("load range reverse returns n elements before but excluding start id in reverse order", async function () {
			const res = await cacheHandler.loadRange(offlineStorageMock, listId, ids[6], 3, true)
			o(res.map(toElementId)).deepEquals(allList.map(toElementId).slice(3, 6).reverse())
		})
	})
	o.spec("Load elements from server when they are not in cache", function () {
		o.beforeEach(async function () {
			const allListParsedInstance = await promiseMap(
				allList,
				async (instance) =>
					(await modelMapper.mapToClientModelParsedInstance(tutanotaTypeRefs.CalendarEventTypeRef, instance)) as unknown as ServerModelParsedInstance,
			)
			when(
				entityRestClientMock.loadParsedInstancesRange(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT, false),
			).thenResolve(allListParsedInstance)
			when(offlineStorageMock.getRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId)).thenResolve(null)
			when(entityRestClientMock.mapInstancesToEntity(tutanotaTypeRefs.CalendarEventTypeRef, allListParsedInstance)).thenResolve(allList)
		})

		o("result of server request is inserted into cache and the range is set.", async function () {
			when(entityRestClientMock.loadRange(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT, false)).thenResolve(allList)
			const res = await cacheHandler.loadRange(offlineStorageMock, listId, ids[0], 3, false)
			o(res.map(toElementId)).deepEquals(allList.map(toElementId).slice(1, 4))("count elements are returned")
			verify(offlineStorageMock.putMultiple(tutanotaTypeRefs.CalendarEventTypeRef, matchers.anything()), { times: 1 })
			verify(offlineStorageMock.setNewRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID))
		})

		o(
			"result of server request is inserted into cache and the range is set. Loads more than 100, but only count elements are returned.",
			async function () {
				const bigListParsedInstance = await promiseMap(
					bigList,
					async (instance) =>
						(await modelMapper.mapToClientModelParsedInstance(
							tutanotaTypeRefs.CalendarEventTypeRef,
							instance,
						)) as unknown as ServerModelParsedInstance,
				)
				when(
					entityRestClientMock.loadParsedInstancesRange(tutanotaTypeRefs.CalendarEventTypeRef, bigListId, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT, false),
				).thenResolve(bigListParsedInstance.slice(0, 100))
				when(
					entityRestClientMock.loadParsedInstancesRange(tutanotaTypeRefs.CalendarEventTypeRef, bigListId, bigListIds[99], LOAD_MULTIPLE_LIMIT, false),
				).thenResolve(bigListParsedInstance.slice(100, 200))
				when(
					entityRestClientMock.loadParsedInstancesRange(
						tutanotaTypeRefs.CalendarEventTypeRef,
						bigListId,
						bigListIds[199],
						LOAD_MULTIPLE_LIMIT,
						false,
					),
				).thenResolve(bigListParsedInstance.slice(200, 300))
				when(
					entityRestClientMock.loadParsedInstancesRange(
						tutanotaTypeRefs.CalendarEventTypeRef,
						bigListId,
						bigListIds[299],
						LOAD_MULTIPLE_LIMIT,
						false,
					),
				).thenResolve([])
				when(entityRestClientMock.mapInstancesToEntity(tutanotaTypeRefs.CalendarEventTypeRef, bigListParsedInstance)).thenResolve(bigList)
				const res = await cacheHandler.loadRange(offlineStorageMock, bigListId, bigListIds[0], 3, false)
				o(res.map(toElementId)).deepEquals(allList.map(toElementId).slice(1, 4))("count elements are returned")
				verify(offlineStorageMock.putMultiple(tutanotaTypeRefs.CalendarEventTypeRef, matchers.anything()), { times: 1 })
				verify(offlineStorageMock.setNewRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, bigListId, CUSTOM_MIN_ID, CUSTOM_MAX_ID))
				verify(
					entityRestClientMock.loadParsedInstancesRange(
						tutanotaTypeRefs.CalendarEventTypeRef,
						bigListId,
						matchers.anything(),
						LOAD_MULTIPLE_LIMIT,
						false,
					),
					{
						times: 4,
					},
				)
			},
		)

		o("result of server request is inserted into cache and the range is set. No elements on the server. No elements are returned.", async function () {
			when(
				entityRestClientMock.loadParsedInstancesRange(tutanotaTypeRefs.CalendarEventTypeRef, bigListId, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT, false),
			).thenResolve([])
			when(entityRestClientMock.mapInstancesToEntity(tutanotaTypeRefs.CalendarEventTypeRef, [])).thenResolve([])

			const res = await cacheHandler.loadRange(offlineStorageMock, bigListId, bigListIds[0], 3, false)
			o(res.map(toElementId)).deepEquals([])("no elements are returned")
			verify(offlineStorageMock.put(tutanotaTypeRefs.CalendarEventTypeRef, matchers.anything()), { times: 0 })
			verify(offlineStorageMock.setNewRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, bigListId, CUSTOM_MIN_ID, CUSTOM_MAX_ID))
		})

		o(
			"result of server request is inserted into cache and the range is set. Less elements on the server than requested. Only elements that are on the server are returned.",
			async function () {
				when(entityRestClientMock.loadRange(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, LOAD_MULTIPLE_LIMIT, false)).thenResolve(
					allList,
				)
				const res = await cacheHandler.loadRange(offlineStorageMock, listId, CUSTOM_MIN_ID, 30, false)
				o(res.map(toElementId)).deepEquals(allList.map(toElementId))("allList is returned")
				verify(offlineStorageMock.putMultiple(tutanotaTypeRefs.CalendarEventTypeRef, matchers.anything()), { times: 1 })
				verify(offlineStorageMock.setNewRangeForList(tutanotaTypeRefs.CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID))
			},
		)
	})
})
