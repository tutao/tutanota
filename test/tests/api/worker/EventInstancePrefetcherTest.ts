import o from "@tutao/otest"
import { CacheStorage, DefaultEntityRestCache, EntityRestCache } from "../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade"
import { EntityUpdateTypeRef, GroupMembershipTypeRef, User, UserTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"
import { TypeModelResolver } from "../../../../src/common/api/common/EntityFunctions"
import { EntityUpdateData, entityUpdateToUpdateData } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../TestUtils"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	MailDetailsBlobTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { OperationType } from "../../../../src/common/api/common/TutanotaConstants"
import { matchers, object, verify, when } from "testdouble"
import { downcast, getTypeString, isSameTypeRef, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { EventInstancePrefetcher } from "../../../../src/common/api/worker/EventInstancePrefetcher"
import { CacheMode, EntityRestClient, EntityRestClientLoadOptions } from "../../../../src/common/api/worker/rest/EntityRestClient"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { elementIdPart, GENERATED_MAX_ID, GENERATED_MIN_ID, listIdPart, timestampToGeneratedId } from "../../../../src/common/api/common/utils/EntityUtils"
import { Entity, ServerModelParsedInstance } from "../../../../src/common/api/common/EntityTypes"

o.spec("EventInstancePrefetcherTest", function () {
	let cacheStoragex: CacheStorage
	let entityCacheClientx: EntityRestCache
	let entityRestClientx: EntityRestClient
	let customCacheHandlerMock: CustomCacheHandlerMap
	let userMock: UserFacade
	let user: User
	let typeModelResolver: TypeModelResolver
	let eventInstancePrefetcher: EventInstancePrefetcher
	const fetchBlobOpt: EntityRestClientLoadOptions = { cacheMode: CacheMode.ReadAndWrite }
	const fetchInstanceOpt: EntityRestClientLoadOptions = { cacheMode: CacheMode.WriteOnly }
	let modelMapper

	let id1: Id = timestampToGeneratedId(2)
	let id2: Id = timestampToGeneratedId(3)
	let id3: Id = timestampToGeneratedId(4)
	let id4: Id = timestampToGeneratedId(5)

	o.beforeEach(async function () {
		cacheStoragex = object<CacheStorage>()
		entityRestClientx = object()
		customCacheHandlerMock = object<CustomCacheHandlerMap>()
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)

		user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				group: "userGroupId",
			}),
		})

		userMock = object("user")
		when(userMock.getLoggedInUser()).thenReturn(user)
		when(userMock.isFullyLoggedIn()).thenReturn(true)
		when(userMock.createAuthHeaders()).thenReturn({})
		when(cacheStoragex.getCustomCacheHandlerMap()).thenReturn(customCacheHandlerMock)
		when(entityRestClientx.mapInstancesToEntity(matchers.anything(), matchers.anything())).thenDo((typeRef, parsedInstances) => {
			return promiseMap(parsedInstances, (parsedInstance) => modelMapper.mapToInstance(typeRef, parsedInstance))
		})

		entityCacheClientx = new DefaultEntityRestCache(entityRestClientx, cacheStoragex, typeModelResolver, object())
		eventInstancePrefetcher = new EventInstancePrefetcher(cacheStoragex, entityCacheClientx, typeModelResolver)
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

	o("When there is at least one element per list - fetch all of em", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const updateTemplate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				_id: "eventBatch",
				application: "tutanota",
				typeId: MailTypeRef.typeId.toString(),
				operation: OperationType.CREATE,
				instance: null,
			}),
		)
		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "firstListId",
			instanceId: id1,
		})
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "firstListId",
			instanceId: id2,
		})
		const thirdUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id1,
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id2,
		})

		when(entityRestClientx.loadMultipleParsedInstances(MailTypeRef, "firstListId", Array.of(id1, id2), undefined, fetchInstanceOpt)).thenResolve([])
		when(entityRestClientx.loadMultipleParsedInstances(MailTypeRef, "secondListId", Array.of(id1, id2), undefined, fetchInstanceOpt)).thenResolve([])
		await eventInstancePrefetcher.preloadEntities(Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate))

		verify(entityRestClientx.loadMultipleParsedInstances(MailTypeRef, "firstListId", Array.of(id1, id2), undefined, fetchInstanceOpt), { times: 1 })
		verify(entityRestClientx.loadMultipleParsedInstances(MailTypeRef, "secondListId", Array.of(id1, id2), undefined, fetchInstanceOpt), { times: 1 })
	})

	o("Do not prefetch element type", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: UserTypeRef,
			instanceId: id1,
			instanceListId: "",
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			isPrefetched: false,
		}

		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id1 })
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id2 })
		const allEventsFromAllBatch = Array.of(firstUpdate, secondUpdate)

		const instancesToFetch = await eventInstancePrefetcher.groupedListElementUpdatedInstances(allEventsFromAllBatch)

		o(instancesToFetch).deepEquals(new Map())
	})

	// make sure instance that are deleted are not fetched otherwise whole request will fail with NotFound
	o("When an instance is deleted at the end do not try to fetch it", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const updateTemplate: EntityUpdateData = {
			typeRef: CalendarEventTypeRef,
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			instanceListId: "",
			instanceId: "",
			isPrefetched: false,
		}
		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "firstListId",
			instanceId: id1,
		})
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), { instanceId: id2 })
		const thirdUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id3,
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(thirdUpdate), { operation: OperationType.DELETE })
		const allUpdates = Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate)

		const instancesToFetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(allUpdates)).get(getTypeString(updateTemplate.typeRef))!
		o(instancesToFetch.get("firstListId")).deepEquals(
			new Map([
				[id1, [0]],
				[id2, [1]],
			]),
		)
		o(instancesToFetch.get("secondListId")).deepEquals(new Map())
	})

	o("Returns indexes of multiple batches for a single element with multiple updates", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const updateTemplate: EntityUpdateData = {
			typeRef: CalendarEventTypeRef,
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			instanceListId: "",
			instanceId: "",
			isPrefetched: false,
		}
		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "firstListId",
			instanceId: id1,
		})
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			operation: OperationType.UPDATE,
		})
		const thirdUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			operation: OperationType.UPDATE,
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id2,
		})
		const allUpdates = Array.of(firstUpdate, secondUpdate, fourthUpdate, thirdUpdate)

		const instancesToFetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(allUpdates)).get(getTypeString(updateTemplate.typeRef))!
		o(instancesToFetch.get("firstListId")).deepEquals(new Map([[id1, [0, 1, 3]]]))
		o(instancesToFetch.get("secondListId")).deepEquals(new Map([[id2, [2]]]))
	})

	o("When a create event have a instance attached to it do not fetch it", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstUpdate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.CREATE,
				instanceListId: "firstListId",
				instanceId: id1,
				instance: downcast({}),
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId.toString(),
			}),
		)
		const secondUpdate = Object.assign(structuredClone(firstUpdate), { instance: null, instanceId: id2 })

		const instancesToFetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(Array.of(firstUpdate, secondUpdate)))
			.get(getTypeString(MailTypeRef))!
			.get(firstUpdate.instanceListId)!
		o(instancesToFetch).deepEquals(new Map([[id2, [1]]]))
	})

	o("When a update event have a patchList attached to it do not fetch it", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstUpdate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.UPDATE,
				instanceListId: "firstListId",
				instanceId: id1,
				patch: downcast({}),
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId.toString(),
			}),
		)
		const secondUpdate = Object.assign(structuredClone(firstUpdate), { instance: null, instanceId: id2 })

		const instancesToFetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(Array.of(firstUpdate, secondUpdate)))
			.get(getTypeString(MailTypeRef))!
			.get(firstUpdate.instanceListId)!
		o(instancesToFetch).deepEquals(new Map([[id2, [1]]]))
	})

	o("first check typeref customHandler while checking for range", async () => {
		const setEntryCacheHandler: CustomCacheHandler<MailSetEntry> = {
			getElementIdsInCacheRange(storage, listId, elementIds) {
				return Promise.resolve(elementIds) // everything is in cache
			},
		}
		const calenderCacheHandler: CustomCacheHandler<CalendarEvent> = {
			getElementIdsInCacheRange(storage, listId, elementIds) {
				if (elementIds[0] != "cacheElementId") {
					return Promise.resolve(elementIds)
				}
				return Promise.resolve([])
			},
		}

		when(customCacheHandlerMock.get(matchers.anything())).thenDo((t: TypeRef<any>) => {
			if (isSameTypeRef(t, MailSetEntryTypeRef)) return setEntryCacheHandler
			if (isSameTypeRef(t, CalendarEventTypeRef)) return calenderCacheHandler
			return null
		})

		const setEntryUpdate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.UPDATE,
				instanceListId: "listId",
				instanceId: "elementId",
				typeId: MailSetEntryTypeRef.typeId.toString(),
				application: MailSetEntryTypeRef.app,
			}),
		)
		const calendarCreate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.CREATE,
				instanceListId: "listId",
				instanceId: "elementId",
				typeId: CalendarEventTypeRef.typeId.toString(),
				application: CalendarEventTypeRef.app,
			}),
		)
		const calendarUpdate = Object.assign(structuredClone(calendarCreate), {
			operation: OperationType.UPDATE,
			instanceId: "cacheElementId",
		})

		const setEntriesTofetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(Array.of(setEntryUpdate))).get(
			getTypeString(setEntryUpdate.typeRef),
		)!
		const calendarTofetch = (await eventInstancePrefetcher.groupedListElementUpdatedInstances(Array.of(calendarCreate, calendarUpdate))).get(
			getTypeString(calendarUpdate.typeRef),
		)!

		o(calendarTofetch.get("listId")).deepEquals(new Map([["cacheElementId", [1]]]))
		o(setEntriesTofetch.get("listId")).deepEquals(new Map([["elementId", [0]]]))
	})

	o("should load mailDetails for create mail event", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstMail = createTestEntity(
			MailTypeRef,
			{ _id: ["firstMailListId", id1], mailDetails: ["archiveId", "firstBlob"] },
			{ populateAggregates: true },
		)
		const secondMail = createTestEntity(
			MailTypeRef,
			{ _id: ["firstMailListId", id2], mailDetails: ["archiveId", "secondBlob"] },
			{ populateAggregates: true },
		)
		const thirdMail = createTestEntity(
			MailTypeRef,
			{ _id: ["secondMailListId", id3], mailDetails: ["archiveId", "thirdBlob"] },
			{ populateAggregates: true },
		)
		const fourthMail = createTestEntity(
			MailTypeRef,
			{ _id: ["secondMailListId", id4], mailDetails: ["archiveId", "fourthBlob"] },
			{ populateAggregates: true },
		)

		const firstUpdate: EntityUpdateData = {
			instanceId: elementIdPart(firstMail._id),
			instanceListId: listIdPart(firstMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
			typeRef: MailTypeRef,
		}
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceId: elementIdPart(secondMail._id),
			instanceListId: listIdPart(secondMail._id),
			operation: OperationType.UPDATE,
		})
		const thirdUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceId: elementIdPart(thirdMail._id),
			instanceListId: listIdPart(thirdMail._id),
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceId: elementIdPart(fourthMail._id),
			instanceListId: listIdPart(fourthMail._id),
		})

		when(
			entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", matchers.anything(), matchers.anything(), matchers.anything()),
		).thenResolve([])
		when(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId, secondUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(firstMail), await toStorableInstance(secondMail)))
		// even though thirdMail is also in the same list as fourthMail, we "simulate" some missing instances in server side. and return only one
		when(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				fourthUpdate.instanceListId,
				[thirdUpdate.instanceId, fourthUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(fourthMail)))

		await eventInstancePrefetcher.preloadEntities(Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate))

		// Check if there are tests for the loop going correctly (for (const [listId, mails] of mailDetailsByList.entries()) {)
		verify(
			entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["firstBlob", "secondBlob"], matchers.anything(), fetchBlobOpt),
			{
				times: 1,
			},
		)
		verify(entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["fourthBlob"], matchers.anything(), fetchBlobOpt), {
			times: 1,
		})
	})

	o("should not load mailDetails for update mail event when mail details is already present in cache", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstMail = createTestEntity(
			MailTypeRef,
			{ _id: ["firstMailListId", id1], mailDetails: ["archiveId", "firstBlob"] },
			{ populateAggregates: true },
		)
		const sampleBlob = createTestEntity(MailDetailsBlobTypeRef, {}, { populateAggregates: true })

		const firstUpdate: EntityUpdateData = {
			instanceId: elementIdPart(firstMail._id),
			instanceListId: listIdPart(firstMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
			typeRef: MailTypeRef,
		}

		when(cacheStoragex.getParsed(MailDetailsBlobTypeRef, "archiveId", "firstBlob")).thenResolve(await toStorableInstance(sampleBlob))
		when(
			entityRestClientx.loadMultipleParsedInstances(MailTypeRef, firstUpdate.instanceListId, [firstUpdate.instanceId], undefined, fetchInstanceOpt),
		).thenResolve(Array.of(await toStorableInstance(firstMail)))

		await eventInstancePrefetcher.preloadEntities(Array.of(firstUpdate))

		verify(entityRestClientx.loadMultiple(MailDetailsBlobTypeRef, matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), {
			times: 0,
		})
		o(firstUpdate.isPrefetched).equals(true)
	})

	o("should ignore all error while fetching", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id1] })
		const secondMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id2] })

		const firstUpdate: EntityUpdateData = {
			instanceId: elementIdPart(firstMail._id),
			instanceListId: listIdPart(firstMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
			typeRef: MailTypeRef,
		}
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceListId: listIdPart(secondMail._id),
			instanceId: elementIdPart(secondMail._id),
		})

		//when(entityRestClientx.loadMultipleParsedInstances(MailTypeRef, firstUpdate.instanceListId, [firstUpdate.instanceId, secondUpdate.instanceId], matchers.anything(), fetchInstanceOpt)).thenResolve(
		//             Array.of(await toStorableInstance(firstMail), await toStorableInstance(secondMail))
		//         )
		when(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenReturn(Promise.reject("first error"))
		when(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				secondUpdate.instanceListId,
				[secondUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenReturn(Promise.reject("second error"))

		await eventInstancePrefetcher.preloadEntities(Array.of(firstUpdate, secondUpdate))

		o(firstUpdate.isPrefetched).equals(false)
		o(secondUpdate.isPrefetched).equals(false)
		verify(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
		verify(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				secondUpdate.instanceListId,
				[secondUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
	})

	o("set preFetched flag to true for fetched instances", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const passMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id1] }, { populateAggregates: true })
		const failMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id2] }, { populateAggregates: true })

		const passingUpdate: EntityUpdateData = {
			instanceId: elementIdPart(passMail._id),
			instanceListId: listIdPart(passMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
			typeRef: MailTypeRef,
		}

		const failingUpdate = Object.assign(structuredClone(passingUpdate), {
			instanceListId: listIdPart(failMail._id),
			instanceId: elementIdPart(failMail._id),
		})

		when(
			entityRestClientx.loadMultipleParsedInstances(MailTypeRef, passingUpdate.instanceListId, [passingUpdate.instanceId], undefined, fetchInstanceOpt),
		).thenResolve(Array.of(await toStorableInstance(passMail)))
		when(
			entityRestClientx.loadMultipleParsedInstances(MailTypeRef, failingUpdate.instanceListId, [failingUpdate.instanceId], undefined, fetchInstanceOpt),
		).thenResolve([])

		await eventInstancePrefetcher.preloadEntities(Array.of(passingUpdate, failingUpdate))

		o(passingUpdate.isPrefetched).equals(true)
		o(failingUpdate.isPrefetched).equals(false)
	})

	o("set preFetched flag to false for missing instances", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const firstMail = createTestEntity(MailTypeRef, { _id: ["mailListId", id1] }, { populateAggregates: true })
		const secondMail = createTestEntity(MailTypeRef, { _id: ["mailListId", id2] }, { populateAggregates: true })
		const thirdMail = createTestEntity(MailTypeRef, { _id: ["mailListId", id3] }, { populateAggregates: true })

		const firstMailUpdate: EntityUpdateData = {
			typeRef: MailTypeRef,
			instanceListId: "mailListId",
			instanceId: elementIdPart(firstMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
		}
		const secondMailUpdate: EntityUpdateData = Object.assign(structuredClone(firstMailUpdate), { instanceId: elementIdPart(secondMail._id) })
		const thirdMailUpdate: EntityUpdateData = Object.assign(structuredClone(firstMailUpdate), { instanceId: elementIdPart(thirdMail._id) })

		// only return first & third mail
		when(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				"mailListId",
				[firstMailUpdate.instanceId, secondMailUpdate.instanceId, thirdMailUpdate.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(firstMail), await toStorableInstance(thirdMail)))
		await eventInstancePrefetcher.preloadEntities(Array.of(firstMailUpdate, secondMailUpdate, thirdMailUpdate))

		o(firstMailUpdate.isPrefetched).equals(true)
		o(thirdMailUpdate.isPrefetched).equals(true)
		o(secondMailUpdate.isPrefetched).equals(false)
	})

	o("Multiple events of same instance are marked as prefetched", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})
		const setEntryCacheHandler: CustomCacheHandler<MailSetEntry> = {
			getElementIdsInCacheRange(storage, listId, elementIds) {
				return Promise.resolve(elementIds) // everything is in cache
			},
		}
		when(customCacheHandlerMock.get(matchers.anything())).thenDo((t: TypeRef<any>) => (isSameTypeRef(t, MailSetEntryTypeRef) ? setEntryCacheHandler : null))

		const createEvent: EntityUpdateData = {
			typeRef: MailTypeRef,
			instanceListId: "mailListId",
			instanceId: id1,
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			isPrefetched: false,
		}
		const updateEvent: EntityUpdateData = Object.assign(structuredClone(createEvent), { operation: OperationType.UPDATE })

		const mail = createTestEntity(
			MailTypeRef,
			{
				_id: ["mailListId", id1],
				mailDetails: ["archiveId", "firstBlob"],
			},
			{ populateAggregates: true },
		)

		when(
			entityRestClientx.loadMultipleParsedInstances(MailTypeRef, createEvent.instanceListId, [createEvent.instanceId], undefined, fetchInstanceOpt),
		).thenResolve(Array.of(await toStorableInstance(mail)))
		when(
			entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", matchers.anything(), matchers.anything(), matchers.anything()),
		).thenResolve([])

		await eventInstancePrefetcher.preloadEntities(Array.of(createEvent, updateEvent))
		o(createEvent.isPrefetched).equals(true)
		o(updateEvent.isPrefetched).equals(true)
	})

	o("prefetched flag is not set to true if mailDetails blob fails to download", async () => {
		when(cacheStoragex.getRangeForList(matchers.anything(), matchers.anything())).thenResolve({
			lower: GENERATED_MIN_ID,
			upper: GENERATED_MAX_ID,
		})

		const mail = createTestEntity(
			MailTypeRef,
			{
				_id: ["firstMailListId", id1],
				mailDetails: ["archiveId", "firstBlob"],
			},
			{ populateAggregates: true },
		)

		const mailUpdate: EntityUpdateData = {
			instanceId: elementIdPart(mail._id),
			instanceListId: listIdPart(mail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			isPrefetched: false,
			typeRef: MailTypeRef,
		}

		when(
			entityRestClientx.loadMultipleParsedInstances(MailTypeRef, mailUpdate.instanceListId, [mailUpdate.instanceId], undefined, fetchInstanceOpt),
		).thenResolve(Array.of(await toStorableInstance(mail)))
		when(entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["firstBlob"], matchers.anything(), fetchBlobOpt)).thenReturn(
			Promise.reject("second error"),
		)

		await eventInstancePrefetcher.preloadEntities(Array.of(mailUpdate))

		o(mailUpdate.isPrefetched).equals(false)
		verify(
			entityRestClientx.loadMultipleParsedInstances(
				MailTypeRef,
				mailUpdate.instanceListId,
				[mailUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
		verify(entityRestClientx.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["firstBlob"], matchers.anything(), matchers.anything()), {
			times: 1,
		})
	})
})
