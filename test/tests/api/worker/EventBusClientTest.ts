import o from "@tutao/otest"
import { ConnectMode, EventBusClient, EventBusListener } from "../../../../src/common/api/worker/EventBusClient.js"
import { GroupType, OperationType } from "../../../../src/common/api/common/TutanotaConstants.js"
import type { EntityUpdate } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import {
	EntityEventBatchTypeRef,
	EntityUpdateTypeRef,
	GroupMembershipTypeRef,
	User,
	UserTypeRef,
	WebsocketCounterData,
	WebsocketCounterDataTypeRef,
	WebsocketCounterValueTypeRef,
	WebsocketEntityData,
	WebsocketEntityDataTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityRestClientMock } from "./rest/EntityRestClientMock.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { defer, noOp } from "@tutao/tutanota-utils"
import { DefaultEntityRestCache } from "../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { EventQueue } from "../../../../src/common/api/worker/EventQueue.js"
import { OutOfSyncError } from "../../../../src/common/api/common/error/OutOfSyncError.js"
import { matchers, object, verify, when } from "testdouble"
import { getElementId, timestampToGeneratedId } from "../../../../src/common/api/common/utils/EntityUtils.js"
import { SleepDetector } from "../../../../src/common/api/worker/utils/SleepDetector.js"
import { WsConnectionState } from "../../../../src/common/api/main/WorkerClient.js"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade"
import { ExposedProgressTracker } from "../../../../src/common/api/main/ProgressTracker.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../TestUtils.js"
import { SyncTracker } from "../../../../src/common/api/main/SyncTracker.js"
import { InstancePipeline } from "../../../../src/common/api/worker/crypto/InstancePipeline"
import { TypeModelResolver } from "../../../../src/common/api/common/EntityFunctions"
import { EntityUpdateData, PrefetchStatus } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { CryptoFacade } from "../../../../src/common/api/worker/crypto/CryptoFacade"
import { EventInstancePrefetcher } from "../../../../src/common/api/worker/EventInstancePrefetcher"

o.spec("EventBusClientTest", function () {
	let ebc: EventBusClient
	let cacheMock: DefaultEntityRestCache
	let restClient: EntityRestClientMock
	let userMock: UserFacade
	let socket: WebSocket
	let user: User
	let sleepDetector: SleepDetector
	let listenerMock: EventBusListener
	let progressTrackerMock: ExposedProgressTracker
	let syncTrackerMock: SyncTracker
	let instancePipeline: InstancePipeline
	let socketFactory: (path: string) => WebSocket
	let typeModelResolver: TypeModelResolver
	let entityClient: EntityClient
	let cryptoFacadeMock: CryptoFacade
	let eventInstancePrefetcher: EventInstancePrefetcher

	function initEventBus() {
		ebc = new EventBusClient(
			listenerMock,
			cacheMock,
			userMock,
			entityClient,
			instancePipeline,
			socketFactory,
			sleepDetector,
			progressTrackerMock,
			syncTrackerMock,
			typeModelResolver,
			cryptoFacadeMock,
			eventInstancePrefetcher,
		)
	}

	o.before(function () {
		// Things that are not defined in node but are read-only in Browser
		if (!globalThis.isBrowser) {
			// @ts-ignore
			WebSocket.CONNECTING = WebSocket.CONNECTING ?? 0
			// @ts-ignore
			WebSocket.OPEN = WebSocket.OPEN ?? 1
			// @ts-ignore
			WebSocket.CLOSING = WebSocket.CLOSING ?? 2
			// @ts-ignore
			WebSocket.CLOSED = WebSocket.CLOSED ?? 3
		}
	})

	o.beforeEach(async function () {
		listenerMock = object()
		progressTrackerMock = object()
		syncTrackerMock = object()
		eventInstancePrefetcher = object()
		cacheMock = object({
			async entityEventsReceived(events): Promise<ReadonlyArray<EntityUpdateData>> {
				return events.slice()
			},
			async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
				return null
			},
			async recordSyncTime(): Promise<void> {
				return
			},
			async timeSinceLastSyncMs(): Promise<number | null> {
				return null
			},
			async purgeStorage(): Promise<void> {},
			async setLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
				return
			},
			async isOutOfSync(): Promise<boolean> {
				return false
			},
		} as Partial<DefaultEntityRestCache> as DefaultEntityRestCache)

		user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				group: "userGroupId",
			}),
		})

		userMock = object("user")
		when(userMock.getLoggedInUser()).thenReturn(user)
		when(userMock.isFullyLoggedIn()).thenReturn(true)
		when(userMock.createAuthHeaders()).thenReturn({})
		when(eventInstancePrefetcher.preloadEntities(matchers.anything(), matchers.anything())).thenResolve()

		restClient = new EntityRestClientMock()

		socket = object<WebSocket>()
		sleepDetector = object()
		socketFactory = () => socket

		typeModelResolver = clientInitializedTypeModelResolver()
		entityClient = new EntityClient(restClient, typeModelResolver)
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		cryptoFacadeMock = object()
		initEventBus()
	})

	o.spec("initEntityEvents ", function () {
		const mailGroupId = "mailGroupId"

		o.beforeEach(function () {
			user.memberships = [
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
			]
		})

		const batchId = "-----------1"
		o("initial connect: when the cache is clean it downloads one batch and initializes cache", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve(null)
			when(cacheMock.timeSinceLastSyncMs()).thenResolve(null)
			const batch = createTestEntity(EntityEventBatchTypeRef, { _id: [mailGroupId, batchId] })
			restClient.addListInstances(batch)

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.recordSyncTime())
			// Did not download anything besides single batch
			verify(restClient.loadRange(EntityEventBatchTypeRef, mailGroupId, matchers.anything(), matchers.not(1), matchers.anything()), { times: 0 })
			verify(cacheMock.setLastEntityEventBatchForGroup(mailGroupId, getElementId(batch)))
		})

		o("initial connect: when the cache is initialized, missed events are loaded", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("------------")
			when(cacheMock.timeSinceLastSyncMs()).thenResolve(1)
			const update = createTestEntity(EntityUpdateTypeRef, {
				typeId: MailTypeRef.typeId.toString(),
				application: "tutanota",
				instanceListId: mailGroupId,
				instanceId: "newBatchId",
			})
			const batch = createTestEntity(EntityEventBatchTypeRef, {
				_id: [mailGroupId, batchId],
				events: [update],
			})
			restClient.addListInstances(batch)
			const updateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				operation: OperationType.CREATE,
				instanceId: update.instanceId,
				instanceListId: update.instanceListId,
				instance: null,
				patches: null,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			const eventsReceivedDefer = defer()
			when(cacheMock.entityEventsReceived([updateData], batchId, mailGroupId)).thenDo(() => eventsReceivedDefer.resolve(undefined))

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await eventsReceivedDefer.promise

			verify(cacheMock.purgeStorage(), { times: 0 })
			verify(cacheMock.recordSyncTime())
		})

		o("reconnect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			// Make initial connection to simulate reconnect (populate lastEntityEventIds
			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			// Make it think that it's actually a reconnect
			when(cacheMock.isOutOfSync()).thenResolve(true)

			// initialize events first as well as current time
			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), { times: 1 })
			verify(listenerMock.onError(matchers.isA(OutOfSyncError)))
		})

		o("initial connect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			when(cacheMock.isOutOfSync()).thenResolve(true)

			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), { times: 1 })
			verify(listenerMock.onError(matchers.isA(OutOfSyncError)))
		})
	})

	o("parallel received event batches are passed sequentially to the entity rest cache", async function () {
		o.timeout(500)
		ebc.connect(ConnectMode.Initial)
		await socket.onopen?.(new Event("open"))

		const messageData1 = await createEntityMessage(1)
		const messageData2 = await createEntityMessage(2)

		// Casting ot object here because promise stubber doesn't allow you to just return the promise
		// We never resolve the promise
		when(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything()) as object).thenReturn(new Promise(noOp))

		// call twice as if it was received in parallel
		const p1 = socket.onmessage?.({
			data: messageData1,
		} as MessageEvent<string>)

		const p2 = socket.onmessage?.({
			data: messageData2,
		} as MessageEvent<string>)

		await Promise.all([p1, p2])

		// Is waiting for cache to process the first event
		verify(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
	})

	o("missed entity events are processed in order", async function () {
		const membershipGroupId = "membershipGroupId"
		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: membershipGroupId,
			}),
		]
		const now = Date.now()

		const batchId1 = timestampToGeneratedId(now - 1)
		const batchId2 = timestampToGeneratedId(now - 2)
		const batchId3 = timestampToGeneratedId(now - 3)
		const batchId4 = timestampToGeneratedId(now - 4)
		const batches = [
			createTestEntity(EntityEventBatchTypeRef, { _id: [membershipGroupId, batchId1] }),
			createTestEntity(EntityEventBatchTypeRef, { _id: [user.userGroup.group, batchId3] }),
			createTestEntity(EntityEventBatchTypeRef, { _id: [membershipGroupId, batchId4] }),
			createTestEntity(EntityEventBatchTypeRef, { _id: [user.userGroup.group, batchId2] }),
		]
		restClient.addListInstances(...batches)
		const eventQueue = object<EventQueue>()
		const addedBatchIds: Id[] = []
		when(eventQueue.add(matchers.anything(), matchers.anything(), matchers.anything())).thenDo(
			(batchId: Id, groupId: Id, newEvents: ReadonlyArray<EntityUpdate>) => addedBatchIds.push(batchId),
		)

		await ebc.loadMissedEntityEvents(eventQueue)

		o(addedBatchIds).deepEquals([batchId4, batchId3, batchId2, batchId1])
	})

	o("on counter update it send message to the main thread", async function () {
		const counterUpdate = createCounterData({ mailGroupId: "group1", counterValue: 4, counterId: "list1" })

		await ebc.connect(ConnectMode.Initial)

		await socket.onmessage?.({
			data: await createCounterMessage(counterUpdate),
		} as MessageEvent)

		const updateCaptor = matchers.captor()
		verify(listenerMock.onCounterChanged(updateCaptor.capture()))

		// same counterUpdate defined above with added _finalIvs field
		const expectedCounterUpdate = { ...counterUpdate }
		Object.assign(expectedCounterUpdate, { _finalIvs: {} })
		Object.assign(expectedCounterUpdate.counterValues[0], { _finalIvs: {} })
		o(updateCaptor.values!.map(removeOriginals)).deepEquals([expectedCounterUpdate])
	})

	o("verify new hash is set when entity updates are processed", async function () {
		ebc.connect(ConnectMode.Initial)
		await socket.onmessage?.({
			data: await createEntityMessage(1, "newHash"),
		} as MessageEvent<string>)

		o(typeModelResolver.getServerApplicationTypesModelHash()).equals("newHash")
	})

	o.spec("sleep detection", function () {
		o("on connect it starts", async function () {
			verify(sleepDetector.start(matchers.anything()), { times: 0 })

			ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(sleepDetector.start(matchers.anything()), { times: 1 })
		})

		o("on disconnect it stops", async function () {
			ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onclose?.(new Event("close") as CloseEvent) // there's no CloseEvent in node
			verify(sleepDetector.stop())
		})

		o("on sleep it reconnects", async function () {
			let passedCb
			when(sleepDetector.start(matchers.anything())).thenDo((cb) => (passedCb = cb))
			const firstSocket = socket

			ebc.connect(ConnectMode.Initial)
			// @ts-ignore
			firstSocket.readyState = WebSocket.OPEN
			await firstSocket.onopen?.(new Event("open"))
			verify(socket.close(), { ignoreExtraArgs: true, times: 0 })
			const secondSocket = (socket = object())
			passedCb()

			verify(firstSocket.close(), { ignoreExtraArgs: true, times: 1 })
			verify(listenerMock.onWebsocketStateChanged(WsConnectionState.connecting))
			await secondSocket.onopen?.(new Event("open"))
			verify(listenerMock.onWebsocketStateChanged(WsConnectionState.connected))
		})
	})

	async function createEntityMessage(eventBatchId: number, applicationTypesHash: string = "hash"): Promise<string> {
		const event: WebsocketEntityData = createTestEntity(WebsocketEntityDataTypeRef, {
			eventBatchId: String(eventBatchId),
			eventBatchOwner: "ownerId",
			entityUpdates: [
				createTestEntity(EntityUpdateTypeRef, {
					_id: "eventbatchid",
					application: "tutanota",
					typeId: MailTypeRef.typeId.toString(),
					instanceListId: "listId1",
					instanceId: "id1",
					operation: OperationType.UPDATE,
				}),
			],
			applicationTypesHash: applicationTypesHash,
		})
		const instanceAsData = await instancePipeline.mapAndEncrypt(event._type, event, null)
		return "entityUpdate;" + JSON.stringify(instanceAsData)
	}

	type CounterMessageParams = { mailGroupId: Id; counterValue: number; counterId: Id }

	function createCounterData({ mailGroupId, counterValue, counterId }: CounterMessageParams): WebsocketCounterData {
		return createTestEntity(WebsocketCounterDataTypeRef, {
			_format: "0",
			mailGroup: mailGroupId,
			counterValues: [
				createTestEntity(WebsocketCounterValueTypeRef, {
					_id: "counterupdateid",
					count: String(counterValue),
					counterId,
				}),
			],
		})
	}

	async function createCounterMessage(event: WebsocketCounterData): Promise<string> {
		const instanceAsData = await instancePipeline.mapAndEncrypt(event._type, event, null)
		return "unreadCounterUpdate;" + JSON.stringify(instanceAsData)
	}
})
