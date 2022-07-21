import {LoginFacade} from "./facades/LoginFacade"
import type {MailFacade} from "./facades/MailFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {assertWorkerOrNode, isAdminClient, isTest} from "../common/Env"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	ConnectionError,
	handleRestError,
	NotAuthorizedError,
	ServiceUnavailableError,
	SessionExpiredError,
} from "../common/error/RestError"
import {
	createWebsocketLeaderStatus,
	EntityEventBatch,
	EntityEventBatchTypeRef,
	EntityUpdate,
	WebsocketCounterData,
	WebsocketCounterDataTypeRef,
	WebsocketEntityData,
	WebsocketEntityDataTypeRef,
	WebsocketLeaderStatus,
	WebsocketLeaderStatusTypeRef
} from "../entities/sys/TypeRefs.js"
import {assertNotNull, binarySearch, delay, identity, lastThrow, ofClass, randomIntFromInterval} from "@tutao/tutanota-utils"
import {OutOfSyncError} from "../common/error/OutOfSyncError"
import type {Indexer} from "./search/Indexer"
import {CloseEventBusOption, GroupType, SECOND_MS} from "../common/TutanotaConstants"
import {CancelledError} from "../common/error/CancelledError"
import {EntityClient} from "../common/EntityClient"
import type {QueuedBatch} from "./search/EventQueue"
import {EventQueue} from "./search/EventQueue"
import {ProgressMonitorDelegate} from "./ProgressMonitorDelegate"
import type {IProgressMonitor} from "../common/utils/ProgressMonitor"
import {NoopProgressMonitor} from "../common/utils/ProgressMonitor"
import {compareOldestFirst, firstBiggerThanSecond, GENERATED_MAX_ID, GENERATED_MIN_ID, getElementId, isSameId} from "../common/utils/EntityUtils"
import {InstanceMapper} from "./crypto/InstanceMapper"
import {WsConnectionState} from "../main/WorkerClient";
import {IEntityRestCache} from "./rest/EntityRestCache"
import {SleepDetector} from "./utils/SleepDetector.js"
import sysModelInfo from "../entities/sys/ModelInfo.js"
import tutanotaModelInfo from "../entities/tutanota/ModelInfo.js"
import {resolveTypeReference} from "../common/EntityFunctions.js"
import {PhishingMarkerWebsocketData, PhishingMarkerWebsocketDataTypeRef} from "../entities/tutanota/TypeRefs"
import {UserFacade} from "./facades/UserFacade"

assertWorkerOrNode()

export const enum EventBusState {
	Automatic = "automatic",
	// automatic reconnection is enabled
	Suspended = "suspended",
	// automatic reconnection is suspended but can be enabled again
	Terminated = "terminated", // automatic reconnection is disabled and websocket is closed but can be opened again by calling connect explicit
}

// EntityEventBatches expire after 45 days. keep a time diff security of one day.
export const ENTITY_EVENT_BATCH_EXPIRE_MS = 44 * 24 * 60 * 60 * 1000
const RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS = 30000
const NORMAL_SHUTDOWN_CLOSE_CODE = 1
/**
 * Reconnection interval bounds. When we reconnect we pick a random number of seconds in a range to prevent that all the clients connect at the same time which
 * would put unnecessary load on the server.
 * The range depends on the number of attempts and the server response.
 * */
const RECONNECT_INTERVAL = Object.freeze({
	SMALL: [5, 10],
	MEDIUM: [20, 40],
	LARGE: [60, 120],
} as const)
// we store the last 1000 event ids per group, so we know if an event was already processed.
// it is not sufficient to check the last event id because a smaller event id may arrive later
// than a bigger one if the requests are processed in parallel on the server
const MAX_EVENT_IDS_QUEUE_LENGTH = 1000

/** Known types of messages that can be received over websocket. */
const enum MessageType {
	EntityUpdate = "entityUpdate",
	UnreadCounterUpdate = "unreadCounterUpdate",
	PhishingMarkers = "phishingMarkers",
	LeaderStatus = "leaderStatus",
}

export const enum ConnectMode {
	Initial,
	Reconnect,
}

export class EventBusClient {
	private state: EventBusState
	private socket: WebSocket | null
	private immediateReconnect: boolean = false // if true tries to reconnect immediately after the websocket is closed

	/**
	 * Map from group id to last event ids (max. _MAX_EVENT_IDS_QUEUE_LENGTH). We keep them to avoid processing the same event twice if
	 * it comes out of order from the server) and for requesting missed entity events on reconnect.
	 *
	 * We do not have to update these event ids if the groups of the user change because we always take the current users groups from the
	 * LoginFacade.
	 */
	private lastEntityEventIds: Map<Id, Array<Id>>

	/**
	 * Last batch which was actually added to the queue. We need it to find out when the group is processed
	 */
	private lastAddedBatchForGroup: Map<Id, Id>

	private lastAntiphishingMarkersId: Id | null = null

	/** Queue to process all events. */
	private readonly eventQueue: EventQueue

	/** Queue that handles incoming websocket messages only. Caches them until we process downloaded ones and then adds them to eventQueue. */
	private readonly entityUpdateMessageQueue: EventQueue
	private reconnectTimer: TimeoutID | null
	private connectTimer: TimeoutID | null

	/**
	 * Represents a currently retried executing due to a ServiceUnavailableError
	 */
	private serviceUnavailableRetry: Promise<void> | null = null
	private failedConnectionAttempts: number = 0
	private progressMonitor: IProgressMonitor

	constructor(
		private readonly worker: WorkerImpl,
		private readonly indexer: Indexer,
		private readonly cache: IEntityRestCache,
		private readonly mail: MailFacade,
		private readonly userFacade: UserFacade,
		private readonly entity: EntityClient,
		private readonly instanceMapper: InstanceMapper,
		private readonly socketFactory: (path: string) => WebSocket,
		private readonly sleepDetector: SleepDetector,
		private readonly loginFacade: LoginFacade,
	) {
		// We are not connected by default and will not try to unless connect() is called
		this.state = EventBusState.Terminated
		this.lastEntityEventIds = new Map()
		this.lastAddedBatchForGroup = new Map()
		this.socket = null
		this.reconnectTimer = null
		this.connectTimer = null
		this.progressMonitor = new NoopProgressMonitor()
		this.eventQueue = new EventQueue(true, modification => this.eventQueueCallback(modification))
		this.entityUpdateMessageQueue = new EventQueue(false, (batch) => this.entityUpdateMessageQueueCallback(batch))
		this.reset()
	}

	private reset() {
		this.immediateReconnect = false

		this.lastEntityEventIds.clear()

		this.lastAddedBatchForGroup.clear()

		this.eventQueue.pause()

		this.eventQueue.clear()

		this.serviceUnavailableRetry = null
	}

	/**
	 * Opens a WebSocket connection to receive server events.
	 * @param connectMode
	 */
	connect(connectMode: ConnectMode) {
		console.log("ws connect reconnect:", connectMode === ConnectMode.Reconnect, "state:", this.state)
		// make sure a retry will be cancelled by setting _serviceUnavailableRetry to null
		this.serviceUnavailableRetry = null

		this.worker.updateWebSocketState(WsConnectionState.connecting)

		// Task for updating events are number of groups + 2. Use 2 as base for reconnect state.
		if (this.progressMonitor) {
			// Say that the old monitor is completed so that we don't calculate its amount as still to do.
			this.progressMonitor.completed()
		}

		this.progressMonitor = new ProgressMonitorDelegate(this.eventGroups().length + 2, this.worker)
		this.progressMonitor.workDone(1)

		this.state = EventBusState.Automatic
		this.connectTimer = null

		const authHeaders = this.userFacade.createAuthHeaders()

		// Native query building is not supported in old browser, mithril is not available in the worker
		const authQuery =
			"modelVersions=" +
			sysModelInfo.version +
			"." +
			tutanotaModelInfo.version +
			"&clientVersion=" +
			env.versionNumber +
			"&userId=" +
			this.userFacade.getLoggedInUser()._id +
			"&accessToken=" +
			authHeaders.accessToken +
			(this.lastAntiphishingMarkersId ? "&lastPhishingMarkersId=" + this.lastAntiphishingMarkersId : "")
		const path = "/event?" + authQuery

		this.unsubscribeFromOldWebsocket()

		this.socket = this.socketFactory(path)
		this.socket.onopen = () => this.onOpen(connectMode)
		this.socket.onclose = (event: CloseEvent) => this.onClose(event)
		this.socket.onerror = (error: any) => this.onError(error)
		this.socket.onmessage = (message: MessageEvent<string>) => this.onMessage(message)

		this.sleepDetector.start(() => {
			console.log("ws sleep detected, reconnecting...")
			this.tryReconnect(true, true)
		})
	}

	/**
	 * Sends a close event to the server and finally closes the connection.
	 * The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	 */
	close(closeOption: CloseEventBusOption) {
		console.log("ws close closeOption: ", closeOption, "state:", this.state)

		switch (closeOption) {
			case CloseEventBusOption.Terminate:
				this.terminate()

				break

			case CloseEventBusOption.Pause:
				this.state = EventBusState.Suspended

				this.worker.updateWebSocketState(WsConnectionState.connecting)

				break

			case CloseEventBusOption.Reconnect:
				this.worker.updateWebSocketState(WsConnectionState.connecting)

				break
		}

		this.socket?.close()
	}

	tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null) {
		console.log("ws tryReconnect closeIfOpen:", closeIfOpen, "enableAutomaticState:", enableAutomaticState, "delay:", delay)

		if (this.reconnectTimer) {
			// prevent reconnect race-condition
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}

		if (!delay) {
			this.reconnect(closeIfOpen, enableAutomaticState)
		} else {
			this.reconnectTimer = setTimeout(() => this.reconnect(closeIfOpen, enableAutomaticState), delay)
		}
	}

	// Returning promise for tests
	private onOpen(connectMode: ConnectMode): Promise<void> {
		this.failedConnectionAttempts = 0
		console.log("ws open state:", this.state)

		// Indicate some progress right away
		this.progressMonitor.workDone(1)

		const p = this.initEntityEvents(connectMode)

		this.worker.updateWebSocketState(WsConnectionState.connected)

		return p
	}

	private onError(error: any) {
		console.log("ws error:", error, JSON.stringify(error), "state:", this.state)
	}

	private async onMessage(message: MessageEvent<string>): Promise<void> {
		const [type, value] = message.data.split(";")

		switch (type) {
			case MessageType.EntityUpdate: {
				const data: WebsocketEntityData = await this.instanceMapper.decryptAndMapToInstance(
					await resolveTypeReference(WebsocketEntityDataTypeRef),
					JSON.parse(value),
					null,
				)
				this.entityUpdateMessageQueue.add(data.eventBatchId, data.eventBatchOwner, data.eventBatch)
				break
			}
			case MessageType.UnreadCounterUpdate: {
				const counterData: WebsocketCounterData = await this.instanceMapper.decryptAndMapToInstance(
					await resolveTypeReference(WebsocketCounterDataTypeRef),
					JSON.parse(value),
					null,
				)
				this.worker.updateCounter(counterData)
				break
			}
			case MessageType.PhishingMarkers: {
				const data: PhishingMarkerWebsocketData = await this.instanceMapper.decryptAndMapToInstance(
					await resolveTypeReference(PhishingMarkerWebsocketDataTypeRef),
					JSON.parse(value),
					null,
				)
				this.lastAntiphishingMarkersId = data.lastId
				this.mail.phishingMarkersUpdateReceived(data.markers)
				break
			}
			case MessageType.LeaderStatus:
				const data: WebsocketLeaderStatus = await this.instanceMapper.decryptAndMapToInstance(
					await resolveTypeReference(WebsocketLeaderStatusTypeRef),
					JSON.parse(value),
					null,
				)
				await this.userFacade.setLeaderStatus(data)
				await this.worker.updateLeaderStatus(data)
				break
			default:
				console.log("ws message with unknown type", type)
				break
		}
	}

	private onClose(event: CloseEvent) {
		this.failedConnectionAttempts++
		console.log("ws close event:", event, "state:", this.state)

		this.userFacade.setLeaderStatus(
			createWebsocketLeaderStatus({
				leaderStatus: false,
			}),
		)

		this.sleepDetector.stop()

		// Avoid running into penalties when trying to authenticate with an invalid session
		// NotAuthenticatedException 401, AccessDeactivatedException 470, AccessBlocked 472
		// do not catch session expired here because websocket will be reused when we authenticate again
		const serverCode = event.code - 4000

		if ([NotAuthorizedError.CODE, AccessDeactivatedError.CODE, AccessBlockedError.CODE].includes(serverCode)) {
			this.terminate()
			this.worker.sendError(handleRestError(serverCode, "web socket error", null, null))
		} else if (serverCode === SessionExpiredError.CODE) {
			// session is expired. do not try to reconnect until the user creates a new session
			this.state = EventBusState.Suspended
			this.worker.updateWebSocketState(WsConnectionState.connecting)
		} else if (this.state === EventBusState.Automatic && this.userFacade.isFullyLoggedIn()) {
			this.worker.updateWebSocketState(WsConnectionState.connecting)

			if (this.immediateReconnect) {
				this.immediateReconnect = false
				this.tryReconnect(false, false)
			} else {
				let reconnectionInterval: readonly [number, number]

				if (serverCode === NORMAL_SHUTDOWN_CLOSE_CODE) {
					reconnectionInterval = RECONNECT_INTERVAL.LARGE
				} else if (this.failedConnectionAttempts === 1) {
					reconnectionInterval = RECONNECT_INTERVAL.SMALL
				} else if (this.failedConnectionAttempts === 2) {
					reconnectionInterval = RECONNECT_INTERVAL.MEDIUM
				} else {
					reconnectionInterval = RECONNECT_INTERVAL.LARGE
				}

				this.tryReconnect(false, false, SECOND_MS * randomIntFromInterval(reconnectionInterval[0], reconnectionInterval[1]))
			}
		}
	}

	private async initEntityEvents(connectMode: ConnectMode): Promise<void> {
		// pause processing entity update message while initializing event queue
		this.entityUpdateMessageQueue.pause()

		// pause event queue and add all missed entity events first
		this.eventQueue.pause()

		const existingConnection = connectMode == ConnectMode.Reconnect && this.lastEntityEventIds.size > 0
		const p = existingConnection
			? this.loadMissedEntityEvents()
			: this.initOnNewConnection()

		return p
			.then(() => {
				this.entityUpdateMessageQueue.resume()
				this.eventQueue.resume()
			})
			.catch(ofClass(ConnectionError, e => {
				console.log("ws not connected in connect(), close websocket", e)
				this.close(CloseEventBusOption.Reconnect)
			}))
			.catch(ofClass(CancelledError, () => {
				// the processing was aborted due to a reconnect. do not reset any attributes because they might already be in use since reconnection
				console.log("ws cancelled retry process entity events after reconnect")
			}))
			.catch(ofClass(ServiceUnavailableError, async e => {
				// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
				// some EventBatches/missed events are processed already now
				// for an existing connection we just keep the current state and continue loading missed events for the other groups
				// for a new connection we reset the last entity event ids because otherwise this would not be completed in the next try
				if (!existingConnection) {
					this.lastEntityEventIds.clear()
				}

				console.log("ws retry init entity events in ", RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS, e)
				let promise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
					// if we have a websocket reconnect we have to stop retrying
					if (this.serviceUnavailableRetry === promise) {
						console.log("ws retry initializing entity events")
						return this.initEntityEvents(connectMode)
					} else {
						console.log("ws cancel initializing entity events")
					}
				})
				this.serviceUnavailableRetry = promise
				return promise
			}))
			.catch(ofClass(OutOfSyncError, async (e) => {
				// we did not check for updates for too long, so some missed EntityEventBatches can not be loaded any more
				// purge cache if out of sync
				await this.cache.purgeStorage()
				// We want users to re-login. By the time we get here they probably already have loaded some entities which we cannot update
				throw e
			}))
			.catch(e => {
				this.entityUpdateMessageQueue.resume()

				this.eventQueue.resume()

				this.worker.sendError(e)
			})
	}

	private async initOnNewConnection() {
		const {lastIds, someIdsWereCached} = await this.retrieveLastEntityEventIds()
		// First, we record lastEntityEventIds. We need this to know what we need to re-fetch.
		// This is not the same as the cache because we might have already downloaded them but cache might not have processed them yet.
		// Important: do it in one step so that we don't have partial IDs in the map in case an error occurs.
		this.lastEntityEventIds = lastIds

		// Second, we need to initialize the cache too.
		if (someIdsWereCached) {
			// If some of the last IDs were retrieved from the cache then we want to load from that point to bring cache up-to-date. This is mostly important for
			// persistent cache.
			await this.loadMissedEntityEvents()
		} else {
			// If the cache is clean then this is a clean cache (either ephemeral after first connect or persistent with empty DB).
			// We need to record the time even if we don't process anything to later know if we are out of sync or not.
			await this.cache.recordSyncTime()
		}
	}

	/**
	 * Gets the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	 * This is needed to know from where to start loading missed events when we connect.
	 */
	private async retrieveLastEntityEventIds(): Promise<{lastIds: Map<Id, Array<Id>>, someIdsWereCached: boolean}> {
		// set all last event ids in one step to avoid that we have just set them for a few groups when a ServiceUnavailableError occurs
		const lastIds: Map<Id, Array<Id>> = new Map()
		let someIdsWereCached = false
		for (const groupId of this.eventGroups()) {
			const cachedBatchId = await this.cache.getLastEntityEventBatchForGroup(groupId)
			if (cachedBatchId != null) {
				lastIds.set(groupId, [cachedBatchId])
				someIdsWereCached = true
			} else {
				const batches = await this.entity.loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true)
				const batchId = batches.length === 1 ? getElementId(batches[0]) : GENERATED_MIN_ID
				lastIds.set(groupId, [batchId])
				// In case we don't receive any events for the group this time we want to still download from this point next time.
				await this.cache.setLastEntityEventBatchForGroup(groupId, batchId)
				// We will not process any entities for this group so we consider this group "done"
				this.progressMonitor.workDone(1)
			}
		}

		return {lastIds, someIdsWereCached}
	}

	/** Load event batches since the last time we were connected to bring cache and other things up-to-date. */
	private async loadMissedEntityEvents(): Promise<void> {
		if (!this.userFacade.isFullyLoggedIn()) {
			return
		}

		await this.checkOutOfSync()

		for (let groupId of this.eventGroups()) {
			const eventBatches = await this.loadEntityEventsForGroup(groupId)
			if (eventBatches.length === 0) {
				// There won't be a callback from the queue to process the event so we mark this group as
				// completed right away
				this.progressMonitor.workDone(1)
			} else {
				for (const batch of eventBatches) {
					this.addBatch(getElementId(batch), groupId, batch.events)
				}
			}
		}

		// We've loaded all the batches, we've added them to the queue, we can let the cache remember sync point for us to detect out of sync now.
		// It is possible that we will record the time before the batch will be processed but the risk is low.
		await this.cache.recordSyncTime()
	}

	private async loadEntityEventsForGroup(groupId: Id): Promise<EntityEventBatch[]> {
		try {
			return await this.entity.loadAll(EntityEventBatchTypeRef, groupId, this.getLastEventBatchIdOrMinIdForGroup(groupId))
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				console.log("ws could not download entity updates, lost permission")
				return []
			} else {
				throw e
			}
		}
	}

	private async checkOutOfSync() {
		// We try to detect whether event batches have already expired.
		// If this happened we don't need to download anything, we need to purge the cache and start all over.
		if (await this.cache.isOutOfSync()) {

			// Allow the progress bar to complete
			this.progressMonitor.completed()

			// We handle it where we initialize the connection and purge the cache there.
			throw new OutOfSyncError("some missed EntityEventBatches cannot be loaded any more")
		}
	}

	private async eventQueueCallback(modification: QueuedBatch): Promise<void> {
		try {
			await this.processEventBatch(modification)
		} catch (e) {
			console.log("ws error while processing event batches", e)
			this.worker.sendError(e)
			throw e
		}

		// If we completed the event, it was added before
		const lastForGroup = assertNotNull(this.lastAddedBatchForGroup.get(modification.groupId))

		if (isSameId(modification.batchId, lastForGroup) || firstBiggerThanSecond(modification.batchId, lastForGroup)) {
			this.progressMonitor && this.progressMonitor.workDone(1)
		}
	}

	private async entityUpdateMessageQueueCallback(batch: QueuedBatch): Promise<void> {
		this.addBatch(batch.batchId, batch.groupId, batch.events)
		this.eventQueue.resume()
	}

	private unsubscribeFromOldWebsocket() {
		if (this.socket) {
			// Remove listeners. We don't want old socket to mess our state
			this.socket.onopen = this.socket.onclose = this.socket.onerror = this.socket.onmessage = identity
		}
	}

	private async terminate(): Promise<void> {
		this.state = EventBusState.Terminated

		this.reset()

		this.worker.updateWebSocketState(WsConnectionState.terminated)
	}

	/**
	 * Tries to reconnect the websocket if it is not connected.
	 */
	private reconnect(closeIfOpen: boolean, enableAutomaticState: boolean) {
		console.log(
			"ws reconnect socket.readyState: (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): " + (this.socket ? this.socket.readyState : "null"),
			"state:",
			this.state,
			"closeIfOpen:",
			closeIfOpen,
			"enableAutomaticState:",
			enableAutomaticState,
		)

		if (this.state !== EventBusState.Terminated && enableAutomaticState) {
			this.state = EventBusState.Automatic
		}

		if (closeIfOpen && this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.immediateReconnect = true
			this.socket.close()
		} else if (
			(this.socket == null || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) &&
			this.state !== EventBusState.Terminated &&
			this.userFacade.isFullyLoggedIn()
		) {
			// Don't try to connect right away because connection may not be actually there
			// see #1165
			if (this.connectTimer) {
				clearTimeout(this.connectTimer)
			}

			this.connectTimer = setTimeout(() => this.connect(ConnectMode.Reconnect), 100)
		}
	}

	private addBatch(batchId: Id, groupId: Id, events: ReadonlyArray<EntityUpdate>) {
		const lastForGroup = this.lastEntityEventIds.get(groupId) || []
		// find the position for inserting into last entity events (negative value is considered as not present in the array)
		const index = binarySearch(lastForGroup, batchId, compareOldestFirst)
		let wasAdded

		if (index < 0) {
			lastForGroup.splice(-index, 0, batchId)
			// only add the batch if it was not process before
			wasAdded = this.eventQueue.add(batchId, groupId, events)
		} else {
			wasAdded = false
		}

		if (lastForGroup.length > MAX_EVENT_IDS_QUEUE_LENGTH) {
			lastForGroup.shift()
		}

		this.lastEntityEventIds.set(batchId, lastForGroup)

		if (wasAdded) {
			this.lastAddedBatchForGroup.set(groupId, batchId)
		}
	}

	private async processEventBatch(batch: QueuedBatch): Promise<void> {
		try {
			if (this.isTerminated()) return
			const filteredEvents = await this.cache.entityEventsReceived(batch)
			if (!this.isTerminated()) await this.loginFacade.entityEventsReceived(filteredEvents)
			if (!this.isTerminated()) await this.mail.entityEventsReceived(filteredEvents)
			if (!this.isTerminated()) await this.worker.entityEventsReceived(filteredEvents, batch.groupId)
			// Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
			// shall not receive the event twice.
			if (!isTest() && !isAdminClient() && !this.isTerminated()) {
				const queuedBatch = {
					groupId: batch.groupId,
					batchId: batch.batchId,
					events: filteredEvents,
				}
				this.indexer.addBatchesToQueue([queuedBatch])
				this.indexer.startProcessing()
			}
		} catch (e) {
			if (e instanceof ServiceUnavailableError) {
				// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
				console.log("ws retry processing event in 30s", e)
				const retryPromise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
					// if we have a websocket reconnect we have to stop retrying
					if (this.serviceUnavailableRetry === retryPromise) {
						return this.processEventBatch(batch)
					} else {
						throw new CancelledError("stop retry processing after service unavailable due to reconnect")
					}
				})
				this.serviceUnavailableRetry = retryPromise
				return retryPromise
			} else {
				throw e
			}
		}
	}

	private getLastEventBatchIdOrMinIdForGroup(groupId: Id): Id {
		const lastIds = this.lastEntityEventIds.get(groupId)

		return lastIds && lastIds.length > 0 ? lastThrow(lastIds) : GENERATED_MIN_ID
	}

	private isTerminated() {
		return this.state === EventBusState.Terminated
	}

	private eventGroups(): Id[] {
		return this.userFacade
				   .getLoggedInUser()
				   .memberships.filter(membership => membership.groupType !== GroupType.MailingList)
				   .map(membership => membership.group)
				   .concat(this.userFacade.getLoggedInUser().userGroup.group)
	}
}