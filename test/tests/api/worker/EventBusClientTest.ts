import o from "@tutao/otest"
import { ConnectMode, EventBusClient, EventBusListener } from "../../../../src/common/api/worker/EventBusClient.js"
import { entityUpdateUtils, sysTypeRefs, timestampToGeneratedId, TypeModelResolver } from "@tutao/typerefs"
import { DefaultEntityRestCache } from "../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { OutOfSyncError } from "../../../../src/common/api/common/error/OutOfSyncError.js"
import { matchers, object, verify, when } from "testdouble"
import { SleepDetector } from "../../../../src/common/api/worker/utils/SleepDetector.js"
import { WsConnectionState } from "../../../../src/common/api/main/WorkerClient.js"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../TestUtils.js"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { CryptoFacade } from "../../../../src/common/api/worker/crypto/CryptoFacade"
import { WebsocketConnectivityListener } from "../../../../src/common/misc/WebsocketConnectivityModel"
import { LastProcessedEventBatchStorageFacade } from "../../../../src/common/api/worker/LastProcessedEventBatchStorageFacade"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError"
import { GroupType, OperationType } from "../../../../src/app-env"
import { tutanotaTypeRefs } from "@tutao/typerefs"

export const noPatchesAndInstance: Pick<entityUpdateUtils.EntityUpdateData, "instance" | "patches" | "blobInstance"> = {
	instance: null,
	patches: null,
	blobInstance: null,
}
o.spec("EventBusClientTest", function () {
	let ebc: EventBusClient
	let cacheMock: DefaultEntityRestCache
	let userMock: UserFacade
	let socket: WebSocket
	let user: sysTypeRefs.User
	let sleepDetector: SleepDetector
	let listenerMock: EventBusListener
	let instancePipeline: InstancePipeline
	let socketFactory: (path: string) => WebSocket
	let typeModelResolver: TypeModelResolver
	let cryptoFacadeMock: CryptoFacade
	let connectivityListenerMock: WebsocketConnectivityListener
	let lastProcessedEventBatchStorageFacade: LastProcessedEventBatchStorageFacade
	let now = Date.UTC(2026, 3, 25)

	function initEventBus() {
		const serverDateProvider = {
			now() {
				return now
			},
			timeZone(): string {
				throw new ProgrammingError("not supported")
			},
		}
		ebc = new EventBusClient(
			connectivityListenerMock,
			listenerMock,
			cacheMock,
			userMock,
			instancePipeline,
			socketFactory,
			sleepDetector,
			typeModelResolver,
			cryptoFacadeMock,
			() => Promise.resolve(lastProcessedEventBatchStorageFacade),
			serverDateProvider,
			object(),
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
		lastProcessedEventBatchStorageFacade = object()
		cacheMock = object({
			async entityEventsReceived(events): Promise<ReadonlyArray<entityUpdateUtils.EntityUpdateData>> {
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
			async putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
				return
			},
			async isOutOfSync(): Promise<boolean> {
				return false
			},
		} as Partial<DefaultEntityRestCache> as DefaultEntityRestCache)

		user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: "userGroupId",
			}),
		})

		userMock = object("user")
		when(userMock.getLoggedInUser()).thenReturn(user)
		when(userMock.isFullyLoggedIn()).thenReturn(true)
		when(userMock.createAuthHeaders()).thenReturn({})

		socket = object<WebSocket>()
		sleepDetector = object()
		socketFactory = () => socket

		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		cryptoFacadeMock = object()
		connectivityListenerMock = object()
		initEventBus()
	})

	o.spec("initEntityEvents ", function () {
		const mailGroupId = "mailGroupId"

		o.beforeEach(function () {
			user.memberships = [
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
			]
		})

		const batchId = "-----------1"
		o("initial connect: when the cache is clean it initializes cache with GENERATED_MIN_ID", async function () {
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve(null)
			when(cacheMock.timeSinceLastSyncMs()).thenResolve(null)

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.recordSyncTime())
			const FIVE_SECONDS_IN_MILLISECONDS = 5000
			verify(
				lastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(mailGroupId, timestampToGeneratedId(now - FIVE_SECONDS_IN_MILLISECONDS)),
				{ times: 1 },
			)
		})

		o("reconnect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
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
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			when(cacheMock.isOutOfSync()).thenResolve(true)

			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), { times: 1 })
			verify(listenerMock.onError(matchers.isA(OutOfSyncError)))
		})
	})

	o("parallel received event batches are passed sequentially to the entity rest cache", async function () {
		o.timeout(20000)
		await ebc.connect(ConnectMode.Initial)
		await socket.onopen?.(new Event("open"))

		const messageData1 = await createEntityMessage(1)
		const messageData2 = await createEntityMessage(2)

		const filteredEvents: entityUpdateUtils.EntityUpdateData[] = []
		when(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(filteredEvents)
		when(
			listenerMock.onEntityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()),
		).thenResolve()

		// call twice as if it was received in parallel
		const p1 = socket.onmessage?.({
			data: messageData1,
		} as MessageEvent<string>)

		const p2 = socket.onmessage?.({
			data: messageData2,
		} as MessageEvent<string>)

		await Promise.all([p1, p2])

		// Is waiting for cache to process the first event
		verify(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything()), { times: 2 })
	})

	o("on counter update it send message to the main thread", async function () {
		const counterUpdate = createCounterData({ mailGroupId: "group1", counterValue: 4, counterId: "list1" })

		await ebc.connect(ConnectMode.Initial)

		await socket.onmessage?.({
			data: await createCounterMessage(counterUpdate),
		} as MessageEvent)

		const updateCaptor = matchers.captor()
		verify(listenerMock.onCounterChanged(updateCaptor.capture()))

		o(updateCaptor.values!.map(removeOriginals)).deepEquals([counterUpdate])
	})

	o("verify new hash is set when entity updates are processed", async function () {
		await ebc.connect(ConnectMode.Initial)
		await socket.onmessage?.({
			data: await createEntityMessage(1, "newHash"),
		} as MessageEvent<string>)

		o(typeModelResolver.getServerApplicationTypesModelHash()).equals("newHash")
	})

	o.spec("sleep detection", function () {
		o("on connect it starts", async function () {
			verify(sleepDetector.start(matchers.anything()), { times: 0 })

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(sleepDetector.start(matchers.anything()), { times: 1 })
		})

		o("on disconnect it stops", async function () {
			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onclose?.(new Event("close") as CloseEvent) // there's no CloseEvent in node
			verify(sleepDetector.stop())
		})

		o("on sleep it reconnects", async function () {
			let passedCb
			when(sleepDetector.start(matchers.anything())).thenDo((cb) => (passedCb = cb))
			const firstSocket = socket

			await ebc.connect(ConnectMode.Initial)
			// @ts-ignore
			firstSocket.readyState = WebSocket.OPEN
			await firstSocket.onopen?.(new Event("open"))
			verify(socket.close(), { ignoreExtraArgs: true, times: 0 })
			const secondSocket = (socket = object())
			passedCb()

			verify(firstSocket.close(), { ignoreExtraArgs: true, times: 1 })
			verify(connectivityListenerMock.updateWebSocketState(WsConnectionState.connecting))
			await secondSocket.onopen?.(new Event("open"))
			verify(connectivityListenerMock.updateWebSocketState(WsConnectionState.connected))
		})
	})

	async function createEntityMessage(eventBatchId: number, applicationTypesHash: string = "hash"): Promise<string> {
		const event: sysTypeRefs.WebsocketEntityData = createTestEntity(sysTypeRefs.WebsocketEntityDataTypeRef, {
			eventBatchId: String(eventBatchId),
			eventBatchOwner: "ownerId",
			entityUpdates: [
				createTestEntity(sysTypeRefs.EntityUpdateTypeRef, {
					_id: "eventbatchid",
					application: "tutanota",
					typeId: tutanotaTypeRefs.MailTypeRef.typeId.toString(),
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

	function createCounterData({ mailGroupId, counterValue, counterId }: CounterMessageParams): sysTypeRefs.WebsocketCounterData {
		return createTestEntity(sysTypeRefs.WebsocketCounterDataTypeRef, {
			_format: "0",
			mailGroup: mailGroupId,
			counterValues: [
				createTestEntity(sysTypeRefs.WebsocketCounterValueTypeRef, {
					_id: "counterupdateid",
					count: String(counterValue),
					counterId,
				}),
			],
		})
	}

	async function createCounterMessage(event: sysTypeRefs.WebsocketCounterData): Promise<string> {
		const instanceAsData = await instancePipeline.mapAndEncrypt(event._type, event, null)
		return "unreadCounterUpdate;" + JSON.stringify(instanceAsData)
	}
})
