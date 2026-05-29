import o from "@tutao/otest"
import { EventBusClient, EventBusListener } from "../../../../src/platform-kit/network/EventBusClient.js"
import { OperationType, timestampToGeneratedId } from "../../../../src/platform-kit/meta"
import { DefaultEntityRestCache } from "../../../../src/applications/common/api/worker/rest/DefaultEntityRestCache.js"
import { OutOfSyncError, ProgrammingError } from "../../../../src/platform-kit/app-env"
import { func, matchers, object, verify, when } from "testdouble"
import { SleepDetector } from "../../../../src/applications/common/api/worker/utils/SleepDetector.js"
import { UserFacade } from "../../../../src/platform-kit/base/facades/UserFacade"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../TestUtils.js"
import { InstancePipeline, TypeModelResolver } from "../../../../src/platform-kit/instance-pipeline"
import { CryptoFacade } from "../../../../src/platform-kit/base/crypto/CryptoFacade"
import { Thunk } from "../../../../src/platform-kit/utils"
import { ConnectMode, WsConnectionState } from "../../../../src/platform-kit/network/Constants"
import { MailTypeRef } from "@tutao/entities/tutanota"

import {
	EntityUpdateTypeRef,
	GroupMembershipTypeRef,
	User,
	UserTypeRef,
	WebsocketCounterData,
	WebsocketCounterDataTypeRef,
	WebsocketCounterValueTypeRef,
	WebsocketEntityData,
	WebsocketEntityDataTypeRef,
} from "@tutao/entities/sys"
import { WebsocketConnectivityListener } from "../../../../src/platform-kit/network/WebsocketConnectivityListener"
import { LastProcessedEventBatchProvider } from "../../../../src/platform-kit/network/LastProcessedEventBatchProvider"
import { EntityUpdateData, entityUpdateToUpdateData } from "../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { GroupType } from "../../../../src/entities/sys/Utils"
import { ProgressMonitorInterface } from "../../../../src/platform-kit/network/ProgressMonitorInterface"

export const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches" | "blobInstance"> = {
	instance: null,
	patches: null,
	blobInstance: null,
}
o.spec("EventBusClient", function () {
	let ebc: EventBusClient
	let cacheMock: DefaultEntityRestCache
	let userMock: UserFacade
	let socket: WebSocket
	let user: User
	let sleepDetector: SleepDetector
	let listenerMock: EventBusListener
	let instancePipeline: InstancePipeline
	let socketFactory: (path: string) => WebSocket
	let typeModelResolver: TypeModelResolver
	let cryptoFacadeMock: CryptoFacade
	let connectivityListenerMock: WebsocketConnectivityListener
	let lastProcessedEventBatchStorageFacade: LastProcessedEventBatchProvider
	let createProgressMonitor: (totalWork: number) => ProgressMonitorInterface
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
			cryptoFacadeMock,
			() => Promise.resolve(lastProcessedEventBatchStorageFacade),
			serverDateProvider,
			createProgressMonitor,
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
		cacheMock = object()

		user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
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
		createProgressMonitor = func<(totalWork: number) => ProgressMonitorInterface>()
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

		o.test("initial connect: when the cache is clean it initializes cache with GENERATED_MIN_ID", async function () {
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

		o.test("reconnect: when the cache is out of sync with the server, the cache is purged", async function () {
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

		o.test("initial connect: when the cache is out of sync with the server, the cache is purged", async function () {
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")
			when(cacheMock.isOutOfSync()).thenResolve(true)

			await ebc.connect(ConnectMode.Reconnect)
			await socket.onopen?.(new Event("open"))

			verify(cacheMock.purgeStorage(), { times: 1 })
			verify(listenerMock.onError(matchers.isA(OutOfSyncError)))
		})
	})

	o.test("parallel received event batches are passed sequentially to the entity rest cache", async function () {
		o.timeout(20000)
		await ebc.connect(ConnectMode.Initial)
		await socket.onopen?.(new Event("open"))

		const messageData1 = await createEntityMessage(
			createEntityData({
				eventBatchId: "1",
				eventBatchOwner: "ownerId",
				application: "tutanota",
				typeId: String(MailTypeRef.typeId),
			}),
		)
		const messageData2 = await createEntityMessage(
			createEntityData({
				eventBatchId: "2",
				eventBatchOwner: "ownerId",
				application: "tutanota",
				typeId: String(MailTypeRef.typeId),
			}),
		)

		const filteredEvents: EntityUpdateData[] = []
		when(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(filteredEvents)
		when(listenerMock.onEntityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve()

		// call twice as if it was received in parallel
		const p1 = socket.onmessage?.({
			data: messageData1,
		} as MessageEvent<string>)

		const p2 = socket.onmessage?.({
			data: messageData2,
		} as MessageEvent<string>)

		await Promise.all([p1, p2])

		await ebc.messageQueue

		// Is waiting for cache to process the first event
		verify(cacheMock.entityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything()), { times: 2 })
	})

	o.test("on counter update it send message to the main thread", async function () {
		const counterUpdate = createCounterData({ mailGroupId: "group1", counterValue: 4, counterId: "list1" })

		await ebc.connect(ConnectMode.Initial)

		await socket.onmessage?.({
			data: await createCounterMessage(counterUpdate),
		} as MessageEvent)

		await ebc.messageQueue

		const updateCaptor = matchers.captor()
		verify(listenerMock.onCounterChanged(updateCaptor.capture()))

		o.check(updateCaptor.values!.map(removeOriginals)).deepEquals([counterUpdate])
	})

	o.test("verify new hash is set when entity updates are processed", async function () {
		await ebc.connect(ConnectMode.Initial)
		await socket.onmessage?.({
			data: await createEntityMessage(
				createEntityData({
					eventBatchId: "1",
					eventBatchOwner: "ownerId",
					application: "tutanota",
					typeId: String(MailTypeRef.typeId),
					applicationTypesHash: "newHash",
				}),
			),
		} as MessageEvent<string>)

		await ebc.messageQueue

		o.check(typeModelResolver.getServerApplicationTypesModelHash()).equals("newHash")
	})

	o.spec("sleep detection", function () {
		o.test("on connect it starts", async function () {
			verify(sleepDetector.start(matchers.anything()), { times: 0 })

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			verify(sleepDetector.start(matchers.anything()), { times: 1 })
		})

		o.test("on disconnect it stops", async function () {
			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onclose?.(new Event("close") as CloseEvent) // there's no CloseEvent in node
			verify(sleepDetector.stop())
		})

		o.test("on sleep it reconnects", async function () {
			let passedCb: Thunk
			when(sleepDetector.start(matchers.anything())).thenDo((cb: Thunk) => (passedCb = cb))
			const firstSocket = socket

			await ebc.connect(ConnectMode.Initial)
			// @ts-ignore
			// noinspection JSConstantReassignment
			firstSocket.readyState = WebSocket.OPEN
			await firstSocket.onopen?.(new Event("open"))
			verify(socket.close(), { ignoreExtraArgs: true, times: 0 })
			const secondSocket = (socket = object())
			// @ts-ignore
			passedCb()

			verify(firstSocket.close(), { ignoreExtraArgs: true, times: 1 })
			verify(connectivityListenerMock.updateWebSocketState(WsConnectionState.connecting))
			await secondSocket.onopen?.(new Event("open"))
			verify(connectivityListenerMock.updateWebSocketState(WsConnectionState.connected))
		})
	})

	o.spec("all event batches are processed", function () {
		const mailGroupId = "mailGroupId"
		let progressMonitor: ProgressMonitorInterface

		o.beforeEach(function () {
			user.memberships = [
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
			]
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")

			progressMonitor = object()
			when(progressMonitor.isDone()).thenResolve(false)
			when(createProgressMonitor(matchers.anything())).thenReturn(progressMonitor)
		})

		o.test("event batch with entity update of a known type is processed", async function () {
			const eventBatchId = "1"
			const batchEvents = [
				await entityUpdateToUpdateData(
					createTestEntity(EntityUpdateTypeRef, {
						application: MailTypeRef.app,
						typeId: String(MailTypeRef.typeId),
						operation: OperationType.UPDATE,
					}),
				),
			]
			when(cacheMock.entityEventsReceived(matchers.anything(), eventBatchId, mailGroupId)).thenResolve(batchEvents)

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;1",
			} as MessageEvent)
			await ebc.messageQueue

			const entityData = createEntityData({
				eventBatchId,
				application: "tutanota",
				typeId: String(MailTypeRef.typeId),
				eventBatchOwner: mailGroupId,
			})
			await socket.onmessage?.({
				data: await createEntityMessage(entityData),
			} as MessageEvent)
			await ebc.messageQueue
			verify(listenerMock.onSyncDone(), { times: 0 })

			await ebc.waitForEmptyQueue()
			verify(listenerMock.onEntityEventsReceived(batchEvents, eventBatchId, mailGroupId, matchers.anything()))
			verify(progressMonitor.workDone(1), { times: 1 })
			verify(listenerMock.onSyncDone())
		})

		o.test("event batch with entity update of an unknown type is processed", async function () {
			const eventBatchId = "1"
			when(cacheMock.entityEventsReceived(matchers.anything(), eventBatchId, mailGroupId)).thenResolve([])

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;1",
			} as MessageEvent)
			await ebc.messageQueue

			const entityData = createEntityData({ eventBatchId, application: "unknown", typeId: "1", eventBatchOwner: mailGroupId })
			await socket.onmessage?.({
				data: await createEntityMessage(entityData),
			} as MessageEvent)
			await ebc.messageQueue
			verify(listenerMock.onSyncDone(), { times: 0 })

			await ebc.waitForEmptyQueue()
			verify(listenerMock.onEntityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(progressMonitor.workDone(1), { times: 1 })
			verify(listenerMock.onSyncDone())
		})

		o.test("event batch with empty entity updates is processed", async function () {
			const eventBatchId = "1"
			when(cacheMock.entityEventsReceived(matchers.anything(), eventBatchId, mailGroupId)).thenResolve([])

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;1",
			} as MessageEvent)
			await ebc.messageQueue

			const entityData = createTestEntity(WebsocketEntityDataTypeRef, {
				eventBatchId,
				eventBatchOwner: mailGroupId,
				entityUpdates: [],
				applicationTypesHash: "hash",
			})
			await socket.onmessage?.({
				data: await createEntityMessage(entityData),
			} as MessageEvent)
			await ebc.messageQueue
			verify(listenerMock.onSyncDone(), { times: 0 })

			await ebc.waitForEmptyQueue()
			verify(listenerMock.onEntityEventsReceived(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(progressMonitor.workDone(1), { times: 1 })
			verify(listenerMock.onSyncDone())
		})
	})

	o.spec("handle InitialSyncWorkEstimate message", function () {
		const mailGroupId = "mailGroupId"
		let progressMonitor: ProgressMonitorInterface

		o.beforeEach(function () {
			user.memberships = [
				createTestEntity(GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
					group: mailGroupId,
				}),
			]
			when(lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(mailGroupId)).thenResolve("lastBatchId")

			progressMonitor = object()
			when(createProgressMonitor(matchers.anything())).thenReturn(progressMonitor)
		})

		o.test("handle first InitialSyncWorkEstimate message", async function () {
			const totalWorkCaptor = matchers.captor()
			when(createProgressMonitor(totalWorkCaptor.capture())).thenReturn(progressMonitor)
			const workDoneCaptor = matchers.captor()
			when(progressMonitor.workDone(workDoneCaptor.capture())).thenResolve()

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;10",
			} as MessageEvent)
			await ebc.messageQueue

			// newWorkEstimate (10) + artificialWorkEstimate (25) + initialWorkDone (25)
			o.check(totalWorkCaptor.value).equals(10 + 25 + 25)
			// initialWorkDone is finished directly after creating progressMonitor
			o.check(workDoneCaptor.value).equals(25)
		})

		o.test("handle subsequent InitialSyncWorkEstimate message", async function () {
			when(createProgressMonitor(matchers.anything())).thenReturn(progressMonitor)
			when(progressMonitor.workDone(matchers.anything())).thenResolve()

			await ebc.connect(ConnectMode.Initial)
			await socket.onopen?.(new Event("open"))

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;1",
			} as MessageEvent)
			await ebc.messageQueue

			progressMonitor.totalWork = 1230
			const updateTotalWorkCaptor = matchers.captor()
			when(progressMonitor.updateTotalWork(updateTotalWorkCaptor.capture())).thenResolve()

			await socket.onmessage?.({
				data: "initialSyncWorkEstimate;5",
			} as MessageEvent)
			await ebc.messageQueue

			o.check(updateTotalWorkCaptor.value).equals(1230 + 5)
		})
	})

	type EntityMessageParams = { eventBatchId: string; eventBatchOwner: string; application: string; typeId: string; applicationTypesHash?: string }

	function createEntityData({ eventBatchId, eventBatchOwner, application, typeId, applicationTypesHash = "hash" }: EntityMessageParams): WebsocketEntityData {
		return createTestEntity(WebsocketEntityDataTypeRef, {
			eventBatchId,
			eventBatchOwner,
			entityUpdates: [
				createTestEntity(EntityUpdateTypeRef, {
					application,
					typeId,
					operation: OperationType.UPDATE,
				}),
			],
			applicationTypesHash,
		})
	}

	async function createEntityMessage(event: WebsocketEntityData): Promise<string> {
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
					_id: "counterUpdateId",
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
