import o from "@tutao/otest"
import { CacheStorage, DefaultEntityRestCache, EntityRestCache } from "../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade"
import { EntityUpdateTypeRef, GroupMembershipTypeRef, User, UserTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"
import { TypeModelResolver } from "../../../../src/common/api/common/EntityFunctions"
import { EntityUpdateData, entityUpdateToUpdateData, PrefetchStatus } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../TestUtils"
import {
	CalendarEventTypeRef,
	ConversationEntryTypeRef,
	MailDetailsBlobTypeRef,
	MailTypeRef,
	TutanotaProperties,
	TutanotaPropertiesTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { OperationType } from "../../../../src/common/api/common/TutanotaConstants"
import { matchers, object, verify, when } from "testdouble"
import { downcast, getTypeString, promiseMap } from "@tutao/tutanota-utils"
import { EventInstancePrefetcher } from "../../../../src/common/api/worker/EventInstancePrefetcher"
import { CacheMode, EntityRestClient, EntityRestClientLoadOptions } from "../../../../src/common/api/worker/rest/EntityRestClient"
import { elementIdPart, listIdPart, timestampToGeneratedId } from "../../../../src/common/api/common/utils/EntityUtils"
import { Entity, ServerModelParsedInstance } from "../../../../src/common/api/common/EntityTypes"
import { mapToObject } from "@tutao/tutanota-test-utils"
import { ProgressMonitorDelegate } from "../../../../src/common/api/worker/ProgressMonitorDelegate"

o.spec("EventInstancePrefetcherTest", function () {
	let cacheStoragex: CacheStorage
	let entityCacheClient: EntityRestCache
	let entityRestClient: EntityRestClient
	let userMock: UserFacade
	let user: User
	let typeModelResolver: TypeModelResolver
	let eventInstancePrefetcher: EventInstancePrefetcher
	const fetchBlobOpt: EntityRestClientLoadOptions = { cacheMode: CacheMode.ReadAndWrite }
	const fetchInstanceOpt: EntityRestClientLoadOptions = { cacheMode: CacheMode.WriteOnly }
	let modelMapper
	let progressMonitorMock: ProgressMonitorDelegate

	let id1: Id = timestampToGeneratedId(2)
	let id2: Id = timestampToGeneratedId(3)
	let id3: Id = timestampToGeneratedId(4)
	let id4: Id = timestampToGeneratedId(5)
	let id5: Id = timestampToGeneratedId(6)

	o.beforeEach(async function () {
		cacheStoragex = object<CacheStorage>()
		entityRestClient = object()
		progressMonitorMock = object()
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
		when(entityRestClient.mapInstancesToEntity(matchers.anything(), matchers.anything())).thenDo((typeRef, parsedInstances) => {
			return promiseMap(parsedInstances, (parsedInstance) => modelMapper.mapToInstance(typeRef, parsedInstance))
		})

		entityCacheClient = new DefaultEntityRestCache(entityRestClient, cacheStoragex, typeModelResolver, object())
		eventInstancePrefetcher = new EventInstancePrefetcher(entityCacheClient)
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

	o("When there is at least one element per list - fetch all of em", async () => {
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

		when(entityRestClient.loadMultipleParsedInstances(MailTypeRef, "firstListId", Array.of(id1, id2), undefined, fetchInstanceOpt)).thenResolve([])
		when(entityRestClient.loadMultipleParsedInstances(MailTypeRef, "secondListId", Array.of(id1, id2), undefined, fetchInstanceOpt)).thenResolve([])
		const allUpdates = Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		verify(entityRestClient.loadMultipleParsedInstances(MailTypeRef, "firstListId", Array.of(id1, id2), undefined, fetchInstanceOpt), { times: 1 })
		verify(entityRestClient.loadMultipleParsedInstances(MailTypeRef, "secondListId", Array.of(id1, id2), undefined, fetchInstanceOpt), { times: 1 })
		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
	})

	o("Do not prefetch element type", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: UserTypeRef,
			instanceId: id1,
			instanceListId: "",
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}

		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id1 })
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id2 })
		const allEventsFromAllBatch = Array.of(firstUpdate, secondUpdate)

		const instancesToFetch = await eventInstancePrefetcher.groupedUpdatedInstances(allEventsFromAllBatch, progressMonitorMock)

		o(mapToObject(instancesToFetch)).deepEquals({})
		verify(progressMonitorMock.workDone(1), { times: allEventsFromAllBatch.length })
	})

	o("When an instance is deleted at the end do not fetch previous events", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: CalendarEventTypeRef,
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			instanceListId: "",
			instanceId: "",
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}
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
			instanceId: id3,
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id3,
			operation: OperationType.DELETE,
		})
		const fifthUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id4,
		})
		const sixthUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceListId: "secondListId",
			instanceId: id5,
		})

		const firstEvent = createTestEntity(CalendarEventTypeRef, { _id: ["firstListId", id1] }, { populateAggregates: true })
		const secondEvent = createTestEntity(CalendarEventTypeRef, { _id: ["firstListId", id2] }, { populateAggregates: true })
		const fifthEvent = createTestEntity(CalendarEventTypeRef, { _id: ["secondListId", id4] }, { populateAggregates: true })
		const sixthEvent = createTestEntity(CalendarEventTypeRef, { _id: ["secondListId", id5] }, { populateAggregates: true })

		const allUpdates = Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate, fifthUpdate, sixthUpdate)

		when(
			entityRestClient.loadMultipleParsedInstances(
				CalendarEventTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId, secondUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(firstEvent), await toStorableInstance(secondEvent)))
		when(
			entityRestClient.loadMultipleParsedInstances(
				CalendarEventTypeRef,
				fifthUpdate.instanceListId,
				[fifthUpdate.instanceId, sixthUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(fifthEvent), await toStorableInstance(sixthEvent)))

		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		o(firstUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(secondUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(thirdUpdate.prefetchStatus).equals(PrefetchStatus.NotAvailable)
		o(fourthUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		o(fifthUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(sixthUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)

		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
		verify(progressMonitorMock.totalWorkDone(allUpdates.length))
	})

	o("Returns indexes of multiple batches for a single element with multiple updates", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: CalendarEventTypeRef,
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			instanceListId: "",
			instanceId: "",
			prefetchStatus: PrefetchStatus.NotPrefetched,
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

		const instancesToFetch = (await eventInstancePrefetcher.groupedUpdatedInstances(allUpdates, progressMonitorMock)).get(
			getTypeString(updateTemplate.typeRef),
		)!
		o(mapToObject(instancesToFetch.get("firstListId")!)).deepEquals(mapToObject(new Map([[id1, [0, 1, 3]]])))
		o(mapToObject(instancesToFetch.get("secondListId")!)).deepEquals(mapToObject(new Map([[id2, [2]]])))
		verify(progressMonitorMock.workDone(1), { times: 0 })
	})

	o("When a create event have a instance attached to it, still prefetches", async () => {
		const testEntity = createTestEntity(EntityUpdateTypeRef, {
			operation: OperationType.CREATE,
			instanceListId: "firstListId",
			instanceId: id1,
			instance: downcast({}),
			application: MailTypeRef.app,
			typeId: MailTypeRef.typeId.toString(),
		})

		const firstUpdate = await entityUpdateToUpdateData(typeModelResolver, testEntity, downcast({}))
		const secondUpdate = Object.assign(structuredClone(firstUpdate), { instance: null, instanceId: id2 })

		const allUpdates = Array.of(firstUpdate, secondUpdate)
		const instancesToFetch = (await eventInstancePrefetcher.groupedUpdatedInstances(allUpdates, progressMonitorMock))
			.get(getTypeString(MailTypeRef))!
			.get(firstUpdate.instanceListId)!
		const expectedAllUpdates = mapToObject(
			new Map([
				[id1, [0]],
				[id2, [1]],
			]),
		)
		o(mapToObject(instancesToFetch)).deepEquals(expectedAllUpdates)
		verify(progressMonitorMock.workDone(1), { times: 0 })
	})

	o("When a update event have a patchList attached to it, still prefetches", async () => {
		const firstUpdate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.UPDATE,
				instanceListId: "firstListId",
				instanceId: id1,
				patch: downcast({ patches: [] }),
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId.toString(),
			}),
		)
		const secondUpdate = Object.assign(structuredClone(firstUpdate), { patches: null, instanceId: id2 })

		const allUpdates = Array.of(firstUpdate, secondUpdate)
		const instancesToFetch = eventInstancePrefetcher
			.groupedUpdatedInstances(allUpdates, progressMonitorMock)
			.get(getTypeString(MailTypeRef))!
			.get(firstUpdate.instanceListId)!
		o(mapToObject(instancesToFetch)).deepEquals(
			mapToObject(
				new Map([
					[id1, [0]],
					[id2, [1]],
				]),
			),
		)
		verify(progressMonitorMock.workDone(1), { times: 0 })
	})

	o("Ignores update events for non list elements", async () => {
		const firstUpdate = await entityUpdateToUpdateData(
			typeModelResolver,
			createTestEntity(EntityUpdateTypeRef, {
				operation: OperationType.UPDATE,
				instanceListId: "",
				instanceId: id1,
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId.toString(),
			}),
		)
		const secondUpdate = Object.assign(structuredClone(firstUpdate), { instanceListId: "listId", instanceId: id2 })

		const allUpdates = Array.of(firstUpdate, secondUpdate)
		const instancesToFetch = eventInstancePrefetcher.groupedUpdatedInstances(allUpdates, progressMonitorMock).get(getTypeString(MailTypeRef))!
		const expectedOnlyListElementInstance = mapToObject(new Map([["listId", new Map([[id2, [1]]])]]))
		o(mapToObject(instancesToFetch)).deepEquals(expectedOnlyListElementInstance)
	})

	o("should load mailDetails for create mail event", async () => {
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
			prefetchStatus: PrefetchStatus.NotPrefetched,
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

		when(cacheStoragex.provideMultipleParsed(MailDetailsBlobTypeRef, "archiveId", matchers.anything())).thenResolve([])
		when(
			entityRestClient.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", matchers.anything(), matchers.anything(), matchers.anything()),
		).thenResolve([])
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId, secondUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(firstMail), await toStorableInstance(secondMail)))
		// even though thirdMail is also in the same list as fourthMail, we "simulate" some missing instances in server side. and return only one
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				fourthUpdate.instanceListId,
				[thirdUpdate.instanceId, fourthUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(fourthMail)))

		const allUpdates = Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		// Check if there are tests for the loop going correctly (for (const [listId, mails] of mailDetailsByList.entries()) {)
		verify(
			entityRestClient.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["firstBlob", "secondBlob"], matchers.anything(), fetchBlobOpt),
			{
				times: 1,
			},
		)
		verify(entityRestClient.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["fourthBlob"], matchers.anything(), fetchBlobOpt), {
			times: 1,
		})
		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
	})

	o("should ignore all error while fetching", async () => {
		const firstMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id1] })
		const secondMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id2] })
		const thirdMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id3] })
		const fourthMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id4] })

		const firstUpdate: EntityUpdateData = {
			instanceId: elementIdPart(firstMail._id),
			instanceListId: listIdPart(firstMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
			typeRef: MailTypeRef,
		}
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceListId: listIdPart(secondMail._id),
			instanceId: elementIdPart(secondMail._id),
		})
		const thirdUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceListId: listIdPart(thirdMail._id),
			instanceId: elementIdPart(thirdMail._id),
			operation: OperationType.UPDATE,
		})
		const fourthUpdate: EntityUpdateData = Object.assign(structuredClone(firstUpdate), {
			instanceListId: listIdPart(fourthMail._id),
			instanceId: elementIdPart(fourthMail._id),
			operation: OperationType.UPDATE,
		})

		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId, thirdUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenReturn(Promise.reject("first error"))
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				secondUpdate.instanceListId,
				[secondUpdate.instanceId, fourthUpdate.instanceId],
				matchers.anything(),
				fetchInstanceOpt,
			),
		).thenReturn(Promise.reject("second error"))

		const allUpdates = Array.of(firstUpdate, secondUpdate, thirdUpdate, fourthUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		o(firstUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		o(secondUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		o(thirdUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		o(fourthUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)

		verify(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				firstUpdate.instanceListId,
				[firstUpdate.instanceId, thirdUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
		verify(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				secondUpdate.instanceListId,
				[secondUpdate.instanceId, fourthUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
		verify(progressMonitorMock.totalWorkDone(allUpdates.length))
	})

	o("set prefetchStatus to Prefetched for instances returned by loadMultiple and to NotAvailable for others", async () => {
		const passMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id1] }, { populateAggregates: true })
		const secondPassMail = createTestEntity(MailTypeRef, { _id: ["firstMailListId", id3] }, { populateAggregates: true })
		const failMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id2] }, { populateAggregates: true })
		const secondFailMail = createTestEntity(MailTypeRef, { _id: ["secondMailListId", id4] }, { populateAggregates: true })

		const passingUpdate: EntityUpdateData = {
			instanceId: elementIdPart(passMail._id),
			instanceListId: listIdPart(passMail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
			typeRef: MailTypeRef,
		}

		const secondPassingUpdate = Object.assign(structuredClone(passingUpdate), {
			instanceListId: listIdPart(secondPassMail._id),
			instanceId: elementIdPart(secondPassMail._id),
		})
		const failingUpdate = Object.assign(structuredClone(passingUpdate), {
			instanceListId: listIdPart(failMail._id),
			instanceId: elementIdPart(failMail._id),
		})
		const secondFailingUpdate = Object.assign(structuredClone(passingUpdate), {
			instanceListId: listIdPart(secondFailMail._id),
			instanceId: elementIdPart(secondFailMail._id),
		})

		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				passingUpdate.instanceListId,
				[passingUpdate.instanceId, secondPassingUpdate.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(passMail), await toStorableInstance(secondPassMail)))
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				failingUpdate.instanceListId,
				[failingUpdate.instanceId, secondFailingUpdate.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve([])

		const allUpdates = Array.of(passingUpdate, failingUpdate, secondPassingUpdate, secondFailingUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		o(passingUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(secondPassingUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(failingUpdate.prefetchStatus).equals(PrefetchStatus.NotAvailable)
		o(secondFailingUpdate.prefetchStatus).equals(PrefetchStatus.NotAvailable)
		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
	})

	o("set prefetchStatus to NotAvailable for missing instances", async () => {
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
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}
		const secondMailUpdate: EntityUpdateData = Object.assign(structuredClone(firstMailUpdate), { instanceId: elementIdPart(secondMail._id) })
		const thirdMailUpdate: EntityUpdateData = Object.assign(structuredClone(firstMailUpdate), { instanceId: elementIdPart(thirdMail._id) })

		// only return first & third mail
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				"mailListId",
				[firstMailUpdate.instanceId, secondMailUpdate.instanceId, thirdMailUpdate.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(firstMail), await toStorableInstance(thirdMail)))
		const allUpdates = Array.of(firstMailUpdate, secondMailUpdate, thirdMailUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		o(firstMailUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(secondMailUpdate.prefetchStatus).equals(PrefetchStatus.NotAvailable)
		o(thirdMailUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
	})

	o("Multiple events of same instance are marked as Prefetched", async () => {
		const createEvent: EntityUpdateData = {
			typeRef: MailTypeRef,
			instanceListId: "mailListId",
			instanceId: id1,
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}

		const updateEvent: EntityUpdateData = Object.assign(structuredClone(createEvent), { operation: OperationType.UPDATE })
		const createSecondEvent: EntityUpdateData = Object.assign(structuredClone(createEvent), {
			instanceId: id2,
		})
		const updateSecondEvent: EntityUpdateData = Object.assign(structuredClone(createSecondEvent), {
			operation: OperationType.UPDATE,
		})

		const mail = createTestEntity(
			MailTypeRef,
			{
				_id: ["mailListId", id1],
				mailDetails: ["archiveId", "firstBlob"],
			},
			{ populateAggregates: true },
		)

		when(cacheStoragex.provideMultipleParsed(MailDetailsBlobTypeRef, "archiveId", matchers.anything())).thenResolve([])

		const secondMail = createTestEntity(
			MailTypeRef,
			{
				_id: ["mailListId", id2],
				mailDetails: ["archiveId", "firstBlob"],
			},
			{ populateAggregates: true },
		)
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				createEvent.instanceListId,
				[createEvent.instanceId, createSecondEvent.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(mail), await toStorableInstance(secondMail)))
		when(
			entityRestClient.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", matchers.anything(), matchers.anything(), matchers.anything()),
		).thenResolve([])

		const allUpdates = Array.of(createEvent, updateEvent, createSecondEvent, updateSecondEvent)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)
		o(createEvent.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(updateEvent.prefetchStatus).equals(PrefetchStatus.Prefetched)
		verify(progressMonitorMock.workDone(1), { times: allUpdates.length })
	})

	o("prefetchStatus is not set to Prefetched if mailDetails blob fails to download", async () => {
		const mail = createTestEntity(
			MailTypeRef,
			{
				_id: ["firstMailListId", id1],
				mailDetails: ["archiveId", "firstBlob"],
			},
			{ populateAggregates: true },
		)

		const secondMail = createTestEntity(
			MailTypeRef,
			{
				_id: ["firstMailListId", id2],
				mailDetails: ["archiveId", "secondBlob"],
			},
			{ populateAggregates: true },
		)

		const mailUpdate: EntityUpdateData = {
			instanceId: elementIdPart(mail._id),
			instanceListId: listIdPart(mail._id),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
			typeRef: MailTypeRef,
		}

		when(cacheStoragex.provideMultipleParsed(MailDetailsBlobTypeRef, "archiveId", matchers.anything())).thenResolve([])
		const secondMailUpdate: EntityUpdateData = Object.assign(structuredClone(mailUpdate), {
			instanceId: id2,
		})
		when(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				mailUpdate.instanceListId,
				[mailUpdate.instanceId, secondMailUpdate.instanceId],
				undefined,
				fetchInstanceOpt,
			),
		).thenResolve(Array.of(await toStorableInstance(mail), await toStorableInstance(secondMail)))
		when(
			entityRestClient.loadMultipleParsedInstances(MailDetailsBlobTypeRef, "archiveId", ["firstBlob", "secondBlob"], matchers.anything(), fetchBlobOpt),
		).thenReject("blob error")

		const allUpdates = Array.of(mailUpdate, secondMailUpdate)
		await eventInstancePrefetcher.preloadEntities(allUpdates, progressMonitorMock)

		o(mailUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		o(secondMailUpdate.prefetchStatus).equals(PrefetchStatus.NotPrefetched)
		verify(
			entityRestClient.loadMultipleParsedInstances(
				MailTypeRef,
				mailUpdate.instanceListId,
				[mailUpdate.instanceId, secondMailUpdate.instanceId],
				matchers.anything(),
				matchers.anything(),
			),
			{ times: 1 },
		)
		verify(
			entityRestClient.loadMultipleParsedInstances(
				MailDetailsBlobTypeRef,
				"archiveId",
				["firstBlob", "secondBlob"],
				matchers.anything(),
				matchers.anything(),
			),
			{
				times: 1,
			},
		)
		verify(progressMonitorMock.workDone(1), { times: 0 })
		verify(progressMonitorMock.totalWorkDone(allUpdates.length))
	})

	o("Do not prefetch ConversationEntry type", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: ConversationEntryTypeRef,
			instanceId: id1,
			instanceListId: "listId",
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}

		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id1 })
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id2 })
		const allEventsFromAllBatch = Array.of(firstUpdate, secondUpdate)

		const instancesToFetch = eventInstancePrefetcher.groupedUpdatedInstances(allEventsFromAllBatch, progressMonitorMock)

		o(mapToObject(instancesToFetch)).deepEquals({})
		verify(progressMonitorMock.workDone(1), { times: allEventsFromAllBatch.length })
	})

	o("prefetch TutanotaProperties type", async () => {
		const updateTemplate: EntityUpdateData = {
			typeRef: TutanotaPropertiesTypeRef,
			instanceId: id1,
			instanceListId: "",
			operation: OperationType.CREATE,
			patches: null,
			instance: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}

		const firstUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), { instanceId: id1 })
		const secondUpdate: EntityUpdateData = Object.assign(structuredClone(updateTemplate), {
			instanceId: id1,
			operation: OperationType.UPDATE,
		})
		const allEventsFromAllBatch = Array.of(firstUpdate, secondUpdate)

		const tutanotaPropertiesResponse: TutanotaProperties = createTestEntity(TutanotaPropertiesTypeRef, { _id: id1 })

		when(
			entityRestClient.loadMultipleParsedInstances(TutanotaPropertiesTypeRef, null, [id1], matchers.anything(), {
				cacheMode: CacheMode.WriteOnly,
			}),
		).thenResolve([await toStorableInstance(tutanotaPropertiesResponse)])

		await eventInstancePrefetcher.preloadEntities(allEventsFromAllBatch, progressMonitorMock)

		verify(
			entityRestClient.loadMultipleParsedInstances(TutanotaPropertiesTypeRef, null, [id1], matchers.anything(), {
				cacheMode: CacheMode.WriteOnly,
			}),
			{ times: 1 },
		)
		verify(progressMonitorMock.workDone(1), { times: allEventsFromAllBatch.length })
		o(firstUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
		o(secondUpdate.prefetchStatus).equals(PrefetchStatus.Prefetched)
	})
})
