import {LoginFacadeImpl} from "./facades/LoginFacade"
import type {MailFacade} from "./facades/MailFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isTest, Mode} from "../common/Env"
import {_TypeModel as MailTypeModel} from "../entities/tutanota/Mail"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	ConnectionError,
	handleRestError,
	NotAuthorizedError,
	ServiceUnavailableError,
	SessionExpiredError,
} from "../common/error/RestError"
import {EntityEventBatchTypeRef} from "../entities/sys/EntityEventBatch"
import {assertNotNull, binarySearch, delay, downcast, identity, lastThrow, neverNull, ofClass, randomIntFromInterval} from "@tutao/tutanota-utils"
import {OutOfSyncError} from "../common/error/OutOfSyncError"
import type {Indexer} from "./search/Indexer"
import {CloseEventBusOption, GroupType, SECOND_MS} from "../common/TutanotaConstants"
import type {WebsocketEntityData} from "../entities/sys/WebsocketEntityData"
import {_TypeModel as WebsocketEntityDataTypeModel} from "../entities/sys/WebsocketEntityData"
import {CancelledError} from "../common/error/CancelledError"
import {_TypeModel as PhishingMarkerWebsocketDataTypeModel, PhishingMarkerWebsocketData} from "../entities/tutanota/PhishingMarkerWebsocketData"
import {_TypeModel as WebsocketCounterDataTypeModel, WebsocketCounterData} from "../entities/sys/WebsocketCounterData"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import {EntityClient} from "../common/EntityClient"
import type {QueuedBatch} from "./search/EventQueue"
import {EventQueue} from "./search/EventQueue"
import {_TypeModel as WebsocketLeaderStatusTypeModel, createWebsocketLeaderStatus, WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {ProgressMonitorDelegate} from "./ProgressMonitorDelegate"
import type {IProgressMonitor} from "../common/utils/ProgressMonitor"
import {NoopProgressMonitor} from "../common/utils/ProgressMonitor"
import {compareOldestFirst, firstBiggerThanSecond, GENERATED_MAX_ID, GENERATED_MIN_ID, getElementId, getLetId, isSameId} from "../common/utils/EntityUtils"
import {InstanceMapper} from "./crypto/InstanceMapper"
import {WsConnectionState} from "../main/WorkerClient";
import {IEntityRestCache, isUsingOfflineCache} from "./rest/EntityRestCache"

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
const LARGE_RECONNECT_INTERVAL = [60, 120] as const
const SMALL_RECONNECT_INTERVAL = [5, 10] as const
const MEDIUM_RECONNECT_INTERVAL = [20, 40] as const

export class EventBusClient {
	private _MAX_EVENT_IDS_QUEUE_LENGTH: number
	private readonly indexer: Indexer
	private readonly cache: IEntityRestCache
	private readonly entity: EntityClient
	// needed for test
	_worker: WorkerImpl
	private readonly mail: MailFacade
	private readonly login: LoginFacadeImpl
	// needed for test
	_state: EventBusState
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

	/**
	 * The last time we received an EntityEventBatch or checked for updates. we use this to find out if our data has expired.
	 * see ENTITY_EVENT_BATCH_EXPIRE_MS
	 *
	 * nullable because we cannot load it during construction, since it comes from the native part
	 */
	private lastUpdateTime: number | null = null
	private lastAntiphishingMarkersId: Id | null = null

	/** queue to process all events. */
	private readonly eventQueue: EventQueue

	/** queue that handles incoming websocket messages while. */
	private readonly entityUpdateMessageQueue: EventQueue
	private reconnectTimer: TimeoutID | null
	private connectTimer: TimeoutID | null

	/**
	 * Represents a currently retried executing due to a ServiceUnavailableError
	 */
	private serviceUnavailableRetry: Promise<void> | null = null
	private failedConnectionAttempts: number = 0
	private progressMonitor: IProgressMonitor
	private instanceMapper: InstanceMapper

	constructor(
		worker: WorkerImpl,
		indexer: Indexer,
		cache: IEntityRestCache,
		mail: MailFacade,
		login: LoginFacadeImpl,
		entityClient: EntityClient,
		instanceMapper: InstanceMapper,
	) {
		this.indexer = indexer
		this.cache = cache
		this.entity = entityClient
		this._worker = worker
		this.mail = mail
		this.login = login
		this.instanceMapper = instanceMapper
		this._state = EventBusState.Automatic
		this.lastEntityEventIds = new Map()
		this.lastAddedBatchForGroup = new Map()
		this.socket = null
		this.reconnectTimer = null
		this.connectTimer = null
		this.progressMonitor = new NoopProgressMonitor()
		this.eventQueue = new EventQueue(true, modification => this.eventQueueCallback(modification))
		this.entityUpdateMessageQueue = new EventQueue(false, (batch) => this.entityUpdateMessageQueueCallback(batch))
		this.reset()

		// we store the last 1000 event ids per group, so we know if an event was already processed.
		// it is not sufficient to check the last event id because a smaller event id may arrive later
		// than a bigger one if the requests are processed in parallel on the server
		this._MAX_EVENT_IDS_QUEUE_LENGTH = 1000
	}

	private reset() {
		this.immediateReconnect = false

		this.lastEntityEventIds.clear()

		this.lastAddedBatchForGroup.clear()

		this.lastUpdateTime = null

		this.eventQueue.pause()

		this.eventQueue.clear()

		this.serviceUnavailableRetry = null
	}

	/**
	 * Opens a WebSocket connection to receive server events.
	 * @param reconnect Set to true if the connection has been opened before.
	 * @returns The event bus client object.
	 */
	connect(reconnect: boolean) {
		if (env.mode === Mode.Test) {
			return
		}

		console.log(new Date().toISOString(), "ws connect reconnect=", reconnect, "state:", this._state)
		// make sure a retry will be cancelled by setting _serviceUnavailableRetry to null
		this.serviceUnavailableRetry = null

		this._worker.updateWebSocketState(WsConnectionState.connecting)

		// Task for updating events are number of groups + 2. Use 2 as base for reconnect state.
		if (this.progressMonitor) {
			// Say that the old monitor is completed so that we don't calculate its amount as still to do.
			this.progressMonitor.completed()
		}

		this.progressMonitor = reconnect ? new ProgressMonitorDelegate(this.eventGroups().length + 2, this._worker) : new NoopProgressMonitor()

		this.progressMonitor.workDone(1)

		this._state = EventBusState.Automatic
		this.connectTimer = null

		const authHeaders = this.login.createAuthHeaders()

		// Native query building is not supported in old browser, mithril is not available in the worker
		const authQuery =
			"modelVersions=" +
			WebsocketEntityDataTypeModel.version +
			"." +
			MailTypeModel.version +
			"&clientVersion=" +
			env.versionNumber +
			"&userId=" +
			this.login.getLoggedInUser()._id +
			"&accessToken=" +
			authHeaders.accessToken +
			(this.lastAntiphishingMarkersId ? "&lastPhishingMarkersId=" + this.lastAntiphishingMarkersId : "")
		let url = getWebsocketOrigin() + "/event?" + authQuery

		this.unsubscribeFromOldWebsocket()

		this.socket = new WebSocket(url)

		this.socket.onopen = () => this._onOpen(reconnect)

		this.socket.onclose = (event: CloseEvent) => this._close(event)

		this.socket.onerror = (error: any) => this.error(error)

		this.socket.onmessage = (message: MessageEvent) => this._message(message)
	}

	// Returning promise for tests
	_onOpen(reconnect: boolean): Promise<void> {
		this.failedConnectionAttempts = 0
		console.log("ws open: ", new Date(), "state:", this._state)

		// Indicate some progress right away
		this.progressMonitor.workDone(1)

		const p = this.initEntityEvents(reconnect)

		this._worker.updateWebSocketState(WsConnectionState.connected)

		return p
	}

	private async initEntityEvents(reconnect: boolean): Promise<void> {
		// pause processing entity update message while initializing event queue
		this.entityUpdateMessageQueue.pause()

		// pause event queue and add all missed entity events first
		this.eventQueue.pause()

		// if it's the first connection on desktop, we want to fetch events since the last login

		let existingConnection = reconnect && this.lastEntityEventIds.size > 0
		let p: Promise<void>
		if (existingConnection) {
			p = this.loadMissedEntityEvents()
		} else {
			// If we have offline cache then we need to both set last ids from persistence and load batches since then
			if (isUsingOfflineCache()) {
				p = this.setLatestEntityEventIds()
						.then(() => this.loadMissedEntityEvents())
			} else {
				p = this.setLatestEntityEventIds()
			}
		}
		return p
			.then(() => {
				this.entityUpdateMessageQueue.resume()

				this.eventQueue.resume()
			})
			.catch(ofClass(ConnectionError, e => {
				console.log("not connected in connect(), close websocket", e)
				this.close(CloseEventBusOption.Reconnect)
			}))
			.catch(ofClass(CancelledError, e => {
				// the processing was aborted due to a reconnect. do not reset any attributes because they might already be in use since reconnection
				console.log("cancelled retry process entity events after reconnect")
			}))
			.catch(ofClass(ServiceUnavailableError, async e => {
				// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
				// some EventBatches/missed events are processed already now
				// for an existing connection we just keep the current state and continue loading missed events for the other groups
				// for a new connection we reset the last entity event ids because otherwise this would not be completed in the next try
				if (!existingConnection) {
					this.lastEntityEventIds.clear()

					this.lastUpdateTime = await this.cache.getLastUpdateTime() ?? 0
				}

				console.log("retry init entity events in 30s", e)
				let promise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
					// if we have a websocket reconnect we have to stop retrying
					if (this.serviceUnavailableRetry === promise) {
						console.log("retry initializing entity events")
						return this.initEntityEvents(reconnect)
					} else {
						console.log("cancel initializing entity events")
					}
				})
				this.serviceUnavailableRetry = promise
				return promise
			}))
			.catch(e => {
				this.entityUpdateMessageQueue.resume()

				this.eventQueue.resume()

				this._worker.sendError(e)
			})
	}

	/**
	 * Sends a close event to the server and finally closes the connection.
	 * The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	 */
	close(closeOption: CloseEventBusOption) {
		console.log(new Date().toISOString(), "ws close closeOption: ", closeOption, "state:", this._state)

		switch (closeOption) {
			case CloseEventBusOption.Terminate:
				this.terminate()

				break

			case CloseEventBusOption.Pause:
				this._state = EventBusState.Suspended

				this._worker.updateWebSocketState(WsConnectionState.connecting)

				break

			case CloseEventBusOption.Reconnect:
				this._worker.updateWebSocketState(WsConnectionState.connecting)

				break
		}

		this.socket?.close()
	}

	private async eventQueueCallback(modification: QueuedBatch): Promise<void> {
		try {
			await this.processEventBatch(modification)
		} catch (e) {
			console.log("Error while processing event batches", e)
			this._worker.sendError(e)
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
		this._state = EventBusState.Terminated

		this.reset()

		this._worker.updateWebSocketState(WsConnectionState.terminated)
	}

	private error(error: any) {
		console.log(new Date().toISOString(), "ws error: ", error, JSON.stringify(error), "state:", this._state)
	}

	async _message(message: MessageEvent): Promise<void> {
		//console.log("ws message: ", message.data);
		const [type, value] = downcast(message.data).split(";")

		if (type === "entityUpdate") {
			// specify type of decrypted entity explicitly because decryptAndMapToInstance effectively returns `any`
			return this.instanceMapper.decryptAndMapToInstance(WebsocketEntityDataTypeModel, JSON.parse(value), null).then((data: WebsocketEntityData) => {
				this.entityUpdateMessageQueue.add(data.eventBatchId, data.eventBatchOwner, data.eventBatch)
			})
		} else if (type === "unreadCounterUpdate") {
			const counterData: WebsocketCounterData = await this.instanceMapper.decryptAndMapToInstance(WebsocketCounterDataTypeModel, JSON.parse(value), null)
			this._worker.updateCounter(counterData)
		} else if (type === "phishingMarkers") {
			return this.instanceMapper.decryptAndMapToInstance<PhishingMarkerWebsocketData>(PhishingMarkerWebsocketDataTypeModel, JSON.parse(value), null).then(data => {
				this.lastAntiphishingMarkersId = data.lastId

				this.mail.phishingMarkersUpdateReceived(data.markers)
			})
		} else if (type === "leaderStatus") {
			return this.instanceMapper.decryptAndMapToInstance<WebsocketLeaderStatus>(WebsocketLeaderStatusTypeModel, JSON.parse(value), null).then(status => {
				return this.login.setLeaderStatus(status)
			})
		} else {
			console.log("ws message with unknown type", type)
		}

		return Promise.resolve()
	}

	private _close(event: CloseEvent) {
		this.failedConnectionAttempts++
		console.log(new Date().toISOString(), "ws _close: ", event, "state:", this._state)

		this.login.setLeaderStatus(
			createWebsocketLeaderStatus({
				leaderStatus: false,
			}),
		)

		// Avoid running into penalties when trying to authenticate with an invalid session
		// NotAuthenticatedException 401, AccessDeactivatedException 470, AccessBlocked 472
		// do not catch session expired here because websocket will be reused when we authenticate again
		const serverCode = event.code - 4000

		if ([NotAuthorizedError.CODE, AccessDeactivatedError.CODE, AccessBlockedError.CODE].includes(serverCode)) {
			this.terminate()

			this._worker.sendError(handleRestError(serverCode, "web socket error", null, null))
		} else if (serverCode === SessionExpiredError.CODE) {
			// session is expired. do not try to reconnect until the user creates a new session
			this._state = EventBusState.Suspended

			this._worker.updateWebSocketState(WsConnectionState.connecting)
		} else if (this._state === EventBusState.Automatic && this.login.isLoggedIn()) {
			this._worker.updateWebSocketState(WsConnectionState.connecting)

			if (this.immediateReconnect) {
				this.immediateReconnect = false
				this.tryReconnect(false, false)
			} else {
				let reconnectionInterval: readonly [number, number]

				if (serverCode === NORMAL_SHUTDOWN_CLOSE_CODE) {
					reconnectionInterval = LARGE_RECONNECT_INTERVAL
				} else if (this.failedConnectionAttempts === 1) {
					reconnectionInterval = SMALL_RECONNECT_INTERVAL
				} else if (this.failedConnectionAttempts === 2) {
					reconnectionInterval = MEDIUM_RECONNECT_INTERVAL
				} else {
					reconnectionInterval = LARGE_RECONNECT_INTERVAL
				}

				this.tryReconnect(false, false, SECOND_MS * randomIntFromInterval(reconnectionInterval[0], reconnectionInterval[1]))
			}
		}
	}

	tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null) {
		console.log("tryReconnect, closeIfOpen", closeIfOpen, "enableAutomaticState", enableAutomaticState, "delay", delay)

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

	/**
	 * Tries to reconnect the websocket if it is not connected.
	 */
	private reconnect(closeIfOpen: boolean, enableAutomaticState: boolean) {
		console.log(
			new Date().toISOString(),
			"ws _reconnect socket state (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): " + (this.socket ? this.socket.readyState : "null"),
			"state:",
			this._state,
			"closeIfOpen",
			closeIfOpen,
			"enableAutomaticState",
			enableAutomaticState,
		)

		if (this._state !== EventBusState.Terminated && enableAutomaticState) {
			this._state = EventBusState.Automatic
		}

		if (closeIfOpen && this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.immediateReconnect = true
			neverNull(this.socket).close()
		} else if (
			(this.socket == null || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) &&
			this._state !== EventBusState.Terminated &&
			this.login.isLoggedIn()
		) {
			// Don't try to connect right away because connection may not be actually there
			// see #1165
			if (this.connectTimer) {
				clearTimeout(this.connectTimer)
			}

			this.connectTimer = setTimeout(() => this.connect(true), 100)
		}
	}

	/**
	 * stores the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	 * this is needed to know from where to start loading missed events after a reconnect
	 */
	private async setLatestEntityEventIds(): Promise<void> {
		// set all last event ids in one step to avoid that we have just set them for a few groups when a ServiceUnavailableError occurs
		const lastIds: Map<Id, Array<Id>> = new Map()
		for (const groupId of this.eventGroups()) {
			const cachedBatchId = await this.cache.getLastEntityEventBatchForGroup(groupId)
			if (cachedBatchId != null) {
				lastIds.set(groupId, [cachedBatchId])
			} else {
				const batches = await this.entity.loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true)
				lastIds.set(groupId, [batches.length === 1 ? getLetId(batches[0])[1] : GENERATED_MIN_ID])
			}
		}

		this.lastEntityEventIds = lastIds
		this.lastUpdateTime = this.cache.getServerTimestampMs()
		await this.cache.setLastUpdateTime(this.lastUpdateTime)
	}

	//visible for testing
	async loadMissedEntityEvents(): Promise<void> {
		if (this.login.isLoggedIn()) {
			const now = this.cache.getServerTimestampMs()

			if (this.lastUpdateTime == null) {
				this.lastUpdateTime = await this.cache.getLastUpdateTime() ?? 0
			}

			if (now > this.lastUpdateTime + ENTITY_EVENT_BATCH_EXPIRE_MS) {

				console.log("cache is out of sync, purging...")

				// Allow the progress bar to complete
				this.progressMonitor.workDone(this.eventGroups().length)

				// we did not check for updates for too long, so some missed EntityEventBatches can not be loaded any more
				// purge cache if out of sync
				await this.cache.purgeStorage()
				//If in memory cached is used user has to log out and in again to clean the cache so we return an error. We might also purge the in memory cache.
				if (!isUsingOfflineCache()) {
					await this._worker.sendError(new OutOfSyncError("some missed EntityEventBatches cannot be loaded any more"))
				}
			} else {
				for (let groupId of this.eventGroups()) {
					let eventBatches
					try {
						eventBatches = await this.entity.loadAll(EntityEventBatchTypeRef, groupId, this.getLastEventBatchIdOrMinIdForGroup(groupId))
					} catch (e) {
						if (e instanceof NotAuthorizedError) {
							console.log("could not download entity updates => lost permission")

							// We need to do this to mark group as "processed", otherwise progress bar will get stuck
							this.progressMonitor.workDone(1)
							continue
						} else {
							throw e
						}
					}
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

				this.lastUpdateTime = this.cache.getServerTimestampMs()
				await this.cache.setLastUpdateTime(this.lastUpdateTime)
			}
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

		if (lastForGroup.length > this._MAX_EVENT_IDS_QUEUE_LENGTH) {
			lastForGroup.shift()
		}

		this.lastEntityEventIds.set(batchId, lastForGroup)

		if (wasAdded) {
			this.lastAddedBatchForGroup.set(groupId, batchId)
		}
	}

	private processEventBatch(batch: QueuedBatch): Promise<void> {
		return this.executeIfNotTerminated(async () => {
			const filteredEvents = await this.cache.entityEventsReceived(batch)
			await this.executeIfNotTerminated(() => this.login.entityEventsReceived(filteredEvents))
			await this.executeIfNotTerminated(() => this.mail.entityEventsReceived(filteredEvents))
			await this.executeIfNotTerminated(() => this._worker.entityEventsReceived(filteredEvents, batch.groupId))

			// Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
			// shall not receive the event twice.
			if (!isTest() && !isAdminClient()) {
				this.executeIfNotTerminated(() => {
					this.indexer.addBatchesToQueue([
						{
							groupId: batch.groupId,
							batchId: batch.batchId,
							events: filteredEvents,
						},
					])

					this.indexer.startProcessing()
				})
			}
		}).catch(ofClass(ServiceUnavailableError, e => {
			// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
			console.log("retry processing event in 30s", e)
			let promise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
				// if we have a websocket reconnect we have to stop retrying
				if (this.serviceUnavailableRetry === promise) {
					return this.processEventBatch(batch)
				} else {
					throw new CancelledError("stop retry processing after service unavailable due to reconnect")
				}
			})
			this.serviceUnavailableRetry = promise
			return promise
		}))
	}

	private getLastEventBatchIdOrMinIdForGroup(groupId: Id): Id {
		const lastIds = this.lastEntityEventIds.get(groupId)

		return lastIds && lastIds.length > 0 ? lastThrow(lastIds) : GENERATED_MIN_ID
	}

	private executeIfNotTerminated(call: (...args: Array<any>) => any): Promise<void> {
		if (this._state !== EventBusState.Terminated) {
			return call()
		} else {
			return Promise.resolve()
		}
	}

	private eventGroups(): Id[] {
		return this.login
				   .getLoggedInUser()
				   .memberships.filter(membership => membership.groupType !== GroupType.MailingList)
				   .map(membership => membership.group)
				   .concat(this.login.getLoggedInUser().userGroup.group)
	}
}