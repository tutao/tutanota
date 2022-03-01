import o from "ospec"
import {ConnectMode, ENTITY_EVENT_BATCH_EXPIRE_MS, EventBusClient} from "../../../src/api/worker/EventBusClient"
import {GroupType, OperationType} from "../../../src/api/common/TutanotaConstants"
import type {EntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {createEntityUpdate} from "../../../src/api/entities/sys/EntityUpdate"
import {EntityRestClientMock} from "./EntityRestClientMock"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {defer, delay, noOp} from "@tutao/tutanota-utils"
import {WorkerImpl} from "../../../src/api/worker/WorkerImpl"
import {LoginFacadeImpl} from "../../../src/api/worker/facades/LoginFacade"
import {createUser, User} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {InstanceMapper} from "../../../src/api/worker/crypto/InstanceMapper"
import {EntityRestCache} from "../../../src/api/worker/rest/EntityRestCache"
import {QueuedBatch} from "../../../src/api/worker/search/EventQueue"
import {OutOfSyncError} from "../../../src/api/common/error/OutOfSyncError"
import {explain, matchers, object, verify, when} from "testdouble"
import {MailFacade} from "../../../src/api/worker/facades/MailFacade"
import {Indexer} from "../../../src/api/worker/search/Indexer"
import {createWebsocketEntityData, WebsocketEntityData} from "../../../src/api/entities/sys/WebsocketEntityData"
import {createWebsocketCounterData, WebsocketCounterData} from "../../../src/api/entities/sys/WebsocketCounterData"
import {createWebsocketCounterValue} from "../../../src/api/entities/sys/WebsocketCounterValue"
import {createEntityEventBatch, EntityEventBatchTypeRef} from "../../../src/api/entities/sys/EntityEventBatch"
import {getElementId} from "../../../src/api/common/utils/EntityUtils"

o.spec("EventBusClient test", function () {
	let ebc: EventBusClient
	let cacheMock: EntityRestCache
	let restClient: EntityRestClientMock
	let workerMock: WorkerImpl
	let loginMock: LoginFacadeImpl
	let mailMock: MailFacade
	let indexerMock: Indexer
	let socket: WebSocket
	let user: User

	function initEventBus() {
		const entityClient = new EntityClient(restClient)
		const intanceMapper = new InstanceMapper()
		ebc = new EventBusClient(
			workerMock,
			indexerMock,
			cacheMock,
			mailMock,
			loginMock,
			entityClient,
			intanceMapper,
			() => socket,
		)
	}

	o.beforeEach(async function () {
		cacheMock = object({
			async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
				return batch.events.slice()
			},
			async getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
				return null
			},
			async recordSyncTime(): Promise<void> {
				return
			},
			async timeSinceLastSync(): Promise<number | null> {
				return null
			},
			async purgeStorage(): Promise<void> {
			},
			async setLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
				return
			}
		} as EntityRestCache)

		user = createUser({
			userGroup: createGroupMembership({
				group: "userGroupId",
			}),
		})

		loginMock = object("login")
		when(loginMock.entityEventsReceived(matchers.anything())).thenResolve(undefined)
		when(loginMock.getLoggedInUser()).thenReturn(user)
		when(loginMock.isLoggedIn()).thenReturn(true)
		when(loginMock.createAuthHeaders()).thenReturn({})

		mailMock = object("mail")
		when(mailMock.entityEventsReceived(matchers.anything())).thenResolve(undefined)

		workerMock = object("worker")
		when(workerMock.entityEventsReceived(matchers.anything(), matchers.anything())).thenResolve(undefined)
		when(workerMock.updateCounter(matchers.anything())).thenResolve(undefined)
		when(workerMock.updateWebSocketState(matchers.anything())).thenResolve(undefined)
		when(workerMock.createProgressMonitor(matchers.anything())).thenResolve(42)
		when(workerMock.progressWorkDone(matchers.anything(), matchers.anything())).thenResolve(undefined)

		indexerMock = object("indexer")

		restClient = new EntityRestClientMock()


		socket = object<WebSocket>()

		initEventBus()
	})

	o.spec("initEntityEvents ", function () {
		const mailGroupId = "mailGroupId"

		o.beforeEach(function () {
			user.memberships = [
				createGroupMembership({
					groupType: GroupType.Mail,
					group: mailGroupId,
				})
			]
		})

		o("initial connect: when the cache is clean it downloads one batch and initializes cache", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve(null)
			when(cacheMock.timeSinceLastSync()).thenResolve(null)
			const batch = createEntityEventBatch({_id: [mailGroupId, "-----------1"]})
			restClient.addListInstances(batch)

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.recordSyncTime())
			// Did not download anything besides single batch
			verify(restClient.loadRange(EntityEventBatchTypeRef, mailGroupId, matchers.anything(), matchers.not(1), matchers.anything()), {times: 0})
			verify(cacheMock.setLastEntityEventBatchForGroup(mailGroupId, getElementId(batch)))
		})

		o("initial connect: when the cache is initialized, missed events are loaded", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("------------")
			when(cacheMock.timeSinceLastSync()).thenResolve(1)
			const update = createEntityUpdate({
				type: "Mail",
				application: "tutanota",
				instanceListId: mailGroupId,
				instanceId: "newBatchId",
			})
			const batch = createEntityEventBatch({
				_id: [mailGroupId, "-----------1"],
				events: [update],
			})
			restClient.addListInstances(batch)

			const eventsReceivedDefer = defer()
			when(cacheMock.entityEventsReceived({events: [update], batchId: getElementId(batch), groupId: mailGroupId}))
				.thenDo(() => eventsReceivedDefer.resolve(undefined))

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await eventsReceivedDefer.promise

			verify(cacheMock.purgeStorage(), {times: 0})
			verify(cacheMock.recordSyncTime())
		})

		o("reconnect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			// Make initial connection to simulate reconnect (populate lastEntityEventIds
			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			// Make it think that it's actually a reconnect
			when(cacheMock.timeSinceLastSync()).thenResolve(ENTITY_EVENT_BATCH_EXPIRE_MS + 100)

			// initialize events first as well as current time
			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), {times: 1})
			verify(workerMock.sendError(matchers.isA(OutOfSyncError)))
		})

		o("initial connect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(cacheMock.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			when(cacheMock.timeSinceLastSync()).thenResolve(ENTITY_EVENT_BATCH_EXPIRE_MS + 100)

			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), {times: 1})
			verify(workerMock.sendError(matchers.isA(OutOfSyncError)))
		})
	})

	o("parallel received event batches are passed sequentially to the entity rest cache", async function () {
			o.timeout(500)
			ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			const messageData1 = createEntityMessage(1)
			const messageData2 = createEntityMessage(2)

			// Casting ot object here because promise stubber doesn't allow you to just return the promise
			// We never resolve the promise
			when(cacheMock.entityEventsReceived(matchers.anything()) as object).thenReturn(new Promise(noOp))


			// call twice as if it was received in parallel
			const p1 = socket.onmessage?.({
				data: messageData1,
			} as MessageEvent<string>)

			const p2 = socket.onmessage?.(
				{
					data: messageData2,
				} as MessageEvent<string>,
			)

			await Promise.all([p1, p2])

			// Is waiting for cache to process the first event
			verify(cacheMock.entityEventsReceived(matchers.anything()), {times: 1})
		},
	)

	o("counter update", async function () {
			const counterUpdate = createCounterData({mailGroupId: "group1", counterValue: 4, listId: "list1"})
			await ebc.connect(ConnectMode.Initial)

			await socket.onmessage?.(
				{
					data: createCounterMessage(counterUpdate),
				} as MessageEvent,
			)
			verify(workerMock.updateCounter(counterUpdate))
		},
	)

	function createEntityMessage(eventBatchId: number): string {
		const event: WebsocketEntityData = createWebsocketEntityData({
				eventBatchId: String(eventBatchId),
				eventBatchOwner: "ownerId",
				eventBatch: [
					createEntityUpdate({
						_id: "eventbatchid",
						application: "tutanota",
						type: "Mail",
						instanceListId: "listId1",
						instanceId: "id1",
						operation: OperationType.UPDATE,
					}),
				],
			}
		)
		return "entityUpdate;" + JSON.stringify(event)
	}

	type CounterMessageParams = {mailGroupId: Id, counterValue: number, listId: Id}

	function createCounterData({mailGroupId, counterValue, listId}: CounterMessageParams): WebsocketCounterData {
		return createWebsocketCounterData({
				_format: "0",
				mailGroup: mailGroupId,
				counterValues: [
					createWebsocketCounterValue({
						_id: "counterupdateid",
						count: String(counterValue),
						mailListId: listId,
					}),
				],
			}
		)
	}

	function createCounterMessage(event: WebsocketCounterData): string {
		return "unreadCounterUpdate;" + JSON.stringify(event)
	}
})