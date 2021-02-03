// @flow
import type {LoginFacade} from "./facades/LoginFacade"
import type {MailFacade} from "./facades/MailFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {decryptAndMapToInstance} from "./crypto/CryptoFacade"
import {assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isTest, Mode} from "../common/Env"
import {_TypeModel as MailTypeModel} from "../entities/tutanota/Mail"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	ConnectionError,
	handleRestError,
	NotAuthorizedError,
	ServiceUnavailableError,
	SessionExpiredError
} from "../common/error/RestError"
import {EntityEventBatchTypeRef} from "../entities/sys/EntityEventBatch"
import {assertNotNull, downcast, identity, neverNull, randomIntFromInterval} from "../common/utils/Utils"
import {OutOfSyncError} from "../common/error/OutOfSyncError"
import {binarySearch, lastThrow} from "../common/utils/ArrayUtils"
import type {Indexer} from "./search/Indexer"
import type {CloseEventBusOptionEnum} from "../common/TutanotaConstants"
import {CloseEventBusOption, GroupType, SECOND_MS} from "../common/TutanotaConstants"
import type {WebsocketEntityData} from "../entities/sys/WebsocketEntityData"
import {_TypeModel as WebsocketEntityDataTypeModel} from "../entities/sys/WebsocketEntityData"
import {CancelledError} from "../common/error/CancelledError"
import {_TypeModel as PhishingMarkerWebsocketDataTypeModel} from "../entities/tutanota/PhishingMarkerWebsocketData"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {EntityRestInterface} from "./rest/EntityRestClient"
import {EntityClient} from "../common/EntityClient"
import type {QueuedBatch} from "./search/EventQueue"
import {EventQueue} from "./search/EventQueue"
import {_TypeModel as WebsocketLeaderStatusTypeModel, createWebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {ProgressMonitorDelegate} from "./ProgressMonitorDelegate"
import type {IProgressMonitor} from "../common/utils/ProgressMonitor"
import {NoopProgressMonitor} from "../common/utils/ProgressMonitor"
import {
	compareOldestFirst,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getLetId,
	isSameId
} from "../common/utils/EntityUtils";

assertWorkerOrNode()


export const EventBusState = Object.freeze({
	Automatic: "automatic", // automatic reconnection is enabled
	Suspended: "suspended", // automatic reconnection is suspended but can be enabled again
	Terminated: "terminated" // automatic reconnection is disabled and websocket is closed but can be opened again by calling connect explicit
})

type EventBusStateEnum = $Values<typeof EventBusState>;

// EntityEventBatches expire after 45 days. keep a time diff security of one day.
const ENTITY_EVENT_BATCH_EXPIRE_MS = 44 * 24 * 60 * 60 * 1000
const RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS = 30000
const NORMAL_SHUTDOWN_CLOSE_CODE = 1
const LARGE_RECONNECT_INTERVAL = [60, 120]
const SMALL_RECONNECT_INTERVAL = [5, 10]
const MEDIUM_RECONNECT_INTERVAL = [20, 40]

export class EventBusClient {
	_MAX_EVENT_IDS_QUEUE_LENGTH: number;

	+_indexer: Indexer;
	+_cache: EntityRestInterface;
	+_entity: EntityClient;
	+_worker: WorkerImpl;
	+_mail: MailFacade;
	+_login: LoginFacade;

	_state: EventBusStateEnum;
	_socket: ?WebSocket;
	_immediateReconnect: boolean; // if true tries to reconnect immediately after the websocket is closed
	/**
	 * Map from group id to last event ids (max. _MAX_EVENT_IDS_QUEUE_LENGTH). We keep them to avoid processing the same event twice if
	 * it comes out of order from the server) and for requesting missed entity events on reconnect.
	 *
	 * We do not have to update these event ids if the groups of the user change because we always take the current users groups from the
	 * LoginFacade.
	 */
	_lastEntityEventIds: Map<Id, Array<Id>>;
	/**
	 * Last batch which was actually added to the queue. We need it to find out when the group is processed
	 */
	_lastAddedBatchForGroup: Map<Id, Id>;
	/**
	 * The last time we received an EntityEventBatch or checked for updates. we use this to find out if our data has expired.
	 * see ENTITY_EVENT_BATCH_EXPIRE_MS
	 */
	_lastUpdateTime: number;
	_lastAntiphishingMarkersId: ?Id;

	/* queue to process all events. */
	+_eventQueue: EventQueue;
	/* queue that handles incoming websocket messages while. */
	+_entityUpdateMessageQueue: EventQueue;

	_reconnectTimer: ?TimeoutID;
	_connectTimer: ?TimeoutID;

	/**
	 * Represents a currently retried executing due to a ServiceUnavailableError
	 */
	_serviceUnavailableRetry: ?Promise<void>;
	_failedConnectionAttempts: number = 0;
	_progressMonitor: IProgressMonitor;

	constructor(worker: WorkerImpl, indexer: Indexer, cache: EntityRestInterface, mail: MailFacade, login: LoginFacade,
	            entityClient: EntityClient
	) {
		this._indexer = indexer
		this._cache = cache
		this._entity = entityClient
		this._worker = worker
		this._mail = mail
		this._login = login

		this._state = EventBusState.Automatic
		this._lastEntityEventIds = new Map()
		this._lastAddedBatchForGroup = new Map()
		this._socket = null
		this._reconnectTimer = null
		this._connectTimer = null
		this._progressMonitor = new NoopProgressMonitor()

		this._eventQueue = new EventQueue(true, (modification) => {
			return this._processEventBatch(modification)
			           .catch((e) => {
				           console.log("Error while processing event batches", e)
				           this._worker.sendError(e)
				           throw e
			           })
			           .then(() => {
				           // If we completed the event, it was added before
				           const lastForGroup = assertNotNull(this._lastAddedBatchForGroup.get(modification.groupId))
				           if (isSameId(modification.batchId, lastForGroup) || firstBiggerThanSecond(modification.batchId, lastForGroup)) {
					           this._progressMonitor && this._progressMonitor.workDone(1)
				           }
			           })
		})

		this._entityUpdateMessageQueue = new EventQueue(false, (batch) => {
			this._addBatch(batch.batchId, batch.groupId, batch.events)
			this._eventQueue.resume()
			return Promise.resolve()
		})

		this._reset()

		// we store the last 1000 event ids per group, so we know if an event was already processed.
		// it is not sufficient to check the last event id because a smaller event id may arrive later
		// than a bigger one if the requests are processed in parallel on the server
		this._MAX_EVENT_IDS_QUEUE_LENGTH = 1000
	}

	_reset(): void {
		this._immediateReconnect = false
		this._lastEntityEventIds.clear()
		this._lastAddedBatchForGroup.clear()
		this._lastUpdateTime = 0
		this._eventQueue.pause()
		this._eventQueue.clear()

		this._serviceUnavailableRetry = null
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

		console.log(new Date().toISOString(), "ws connect reconnect=", reconnect, "state:", this._state);
		// make sure a retry will be cancelled by setting _serviceUnavailableRetry to null
		this._serviceUnavailableRetry = null
		this._worker.updateWebSocketState("connecting")

		// Task for updating events are number of groups + 2. Use 2 as base for reconnect state.
		if (this._progressMonitor) {
			// Say that the old monitor is completed so that we don't calculate its amount as still to do.
			this._progressMonitor.completed()
		}
		this._progressMonitor = (reconnect)
			? new ProgressMonitorDelegate(this._eventGroups().length + 2, this._worker)
			: new NoopProgressMonitor()
		this._progressMonitor.workDone(1)
		this._state = EventBusState.Automatic
		this._connectTimer = null

		const authHeaders = this._login.createAuthHeaders()
		// Native query building is not supported in old browser, mithril is not available in the worker
		const authQuery =
			"modelVersions=" + WebsocketEntityDataTypeModel.version + "." + MailTypeModel.version
			+ "&clientVersion=" + env.versionNumber
			+ "&userId=" + this._login.getLoggedInUser()._id
			+ "&accessToken=" + authHeaders.accessToken
			+ (this._lastAntiphishingMarkersId ? "&lastPhishingMarkersId=" + this._lastAntiphishingMarkersId : "")

		let url = getWebsocketOrigin() + "/event?" + authQuery;
		this._unsubscribeFromOldWebsocket()
		this._socket = new WebSocket(url);
		this._socket.onopen = () => this._onOpen(reconnect)
		this._socket.onclose = (event: CloseEvent) => this._close(event);
		this._socket.onerror = (error: any) => this._error(error);
		this._socket.onmessage = (message: MessageEvent) => this._message(message);
	}

	// Returning promise for tests
	_onOpen(reconnect: boolean): Promise<void> {
		this._failedConnectionAttempts = 0
		console.log("ws open: ", new Date(), "state:", this._state);
		// Indicate some progress right away
		this._progressMonitor.workDone(1)
		const p = this._initEntityEvents(reconnect)
		this._worker.updateWebSocketState("connected")
		return p
	}

	_initEntityEvents(reconnect: boolean): Promise<void> {
		// pause processing entity update message while initializing event queue
		this._entityUpdateMessageQueue.pause()
		// pause event queue and add all missed entity events first
		this._eventQueue.pause()
		let existingConnection = reconnect && this._lastEntityEventIds.size > 0
		let p = existingConnection ? this._loadMissedEntityEvents() : this._setLatestEntityEventIds()
		return p.then(() => {
			this._entityUpdateMessageQueue.resume()
			this._eventQueue.resume()
		}).catch(ConnectionError, e => {
			console.log("not connected in connect(), close websocket", e)
			this.close(CloseEventBusOption.Reconnect)
		}).catch(CancelledError, e => {
			// the processing was aborted due to a reconnect. do not reset any attributes because they might already be in use since reconnection
			console.log("cancelled retry process entity events after reconnect")
		}).catch(ServiceUnavailableError, e => {
			// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
			// some EventBatches/missed events are processed already now
			// for an existing connection we just keep the current state and continue loading missed events for the other groups
			// for a new connection we reset the last entity event ids because otherwise this would not be completed in the next try
			if (!existingConnection) {
				// FIXME: why?
				this._lastEntityEventIds.clear()
				this._lastUpdateTime = 0
			}
			console.log("retry init entity events in 30s", e)
			let promise = Promise.delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
				// if we have a websocket reconnect we have to stop retrying
				if (this._serviceUnavailableRetry === promise) {
					console.log("retry initializing entity events")
					return this._initEntityEvents(reconnect)
				} else {
					console.log("cancel initializing entity events")
				}
			})
			this._serviceUnavailableRetry = promise
			return promise
		}).catch(e => {
			this._entityUpdateMessageQueue.resume()
			this._eventQueue.resume()
			this._worker.sendError(e)
		})
	}


	/**
	 * Sends a close event to the server and finally closes the connection.
	 * The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	 */
	close(closeOption: CloseEventBusOptionEnum) {
		console.log(new Date().toISOString(), "ws close closeOption: ", closeOption, "state:", this._state);
		switch (closeOption) {
			case CloseEventBusOption.Terminate:
				this._terminate()
				break
			case CloseEventBusOption.Pause:
				this._state = EventBusState.Suspended
				this._worker.updateWebSocketState("connecting")
				break
			case CloseEventBusOption.Reconnect:
				this._worker.updateWebSocketState("connecting")
				break;
		}

		if (this._socket && this._socket.close) { // close is undefined in node tests
			this._socket.close()
		}
	}

	_unsubscribeFromOldWebsocket() {
		if (this._socket) {
			// Remove listeners. We don't want old socket to mess our state
			this._socket.onopen = this._socket.onclose = this._socket.onerror = this._socket.onmessage = identity
		}
	}

	_terminate(): void {
		this._state = EventBusState.Terminated
		this._reset()
		this._worker.updateWebSocketState("terminated")
	}

	_error(error: any) {
		console.log(new Date().toISOString(), "ws error: ", error, JSON.stringify(error), "state:", this._state);
	}

	_message(message: MessageEvent): Promise<void> {
		//console.log("ws message: ", message.data);
		const [type, value] = downcast(message.data).split(";")
		if (type === "entityUpdate") {
			// specify type of decrypted entity explicitly because decryptAndMapToInstance effectively returns `any`
			return decryptAndMapToInstance(WebsocketEntityDataTypeModel, JSON.parse(value), null).then((data: WebsocketEntityData) => {
				this._entityUpdateMessageQueue.add(data.eventBatchId, data.eventBatchOwner, data.eventBatch)
			})
		} else if (type === "unreadCounterUpdate") {
			this._worker.updateCounter(JSON.parse(value))
		} else if (type === "phishingMarkers") {
			return decryptAndMapToInstance(PhishingMarkerWebsocketDataTypeModel, JSON.parse(value), null)
				.then((data) => {
					this._lastAntiphishingMarkersId = data.lastId
					this._mail.phishingMarkersUpdateReceived(data.markers)
				})
		} else if (type === "leaderStatus") {
			return decryptAndMapToInstance(WebsocketLeaderStatusTypeModel, JSON.parse(value), null)
				.then(status => {
					return this._login.setLeaderStatus(status)
				})

		} else {
			console.log("ws message with unknown type", type)
		}
		return Promise.resolve()
	}

	_close(event: CloseEvent) {
		this._failedConnectionAttempts++
		console.log(new Date().toISOString(), "ws _close: ", event, "state:", this._state);
		this._login.setLeaderStatus(createWebsocketLeaderStatus({leaderStatus: false}))
		// Avoid running into penalties when trying to authenticate with an invalid session
		// NotAuthenticatedException 401, AccessDeactivatedException 470, AccessBlocked 472
		// do not catch session expired here because websocket will be reused when we authenticate again
		const serverCode = event.code - 4000
		if ([NotAuthorizedError.CODE, AccessDeactivatedError.CODE, AccessBlockedError.CODE].includes(serverCode)) {
			this._terminate()
			this._worker.sendError(handleRestError(serverCode, "web socket error"))
		} else if (serverCode === SessionExpiredError.CODE) {
			// session is expired. do not try to reconnect until the user creates a new session
			this._state = EventBusState.Suspended
			this._worker.updateWebSocketState("connecting")
		} else if (this._state === EventBusState.Automatic && this._login.isLoggedIn()) {
			this._worker.updateWebSocketState("connecting")

			if (this._immediateReconnect) {
				this._immediateReconnect = false
				this.tryReconnect(false, false);
			} else {
				let reconnectionInterval: [number, number]

				if (serverCode === NORMAL_SHUTDOWN_CLOSE_CODE) {
					reconnectionInterval = LARGE_RECONNECT_INTERVAL
				} else if (this._failedConnectionAttempts === 1) {
					reconnectionInterval = SMALL_RECONNECT_INTERVAL
				} else if (this._failedConnectionAttempts === 2) {
					reconnectionInterval = MEDIUM_RECONNECT_INTERVAL
				} else {
					reconnectionInterval = LARGE_RECONNECT_INTERVAL
				}
				this.tryReconnect(false, false, SECOND_MS * randomIntFromInterval(reconnectionInterval[0], reconnectionInterval[1]))
			}
		}
	}

	tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: ?number = null) {
		console.log("tryReconnect, closeIfOpen", closeIfOpen, "enableAutomaticState", enableAutomaticState, "delay", delay)
		if (this._reconnectTimer) {
			// prevent reconnect race-condition
			clearTimeout(this._reconnectTimer)
			this._reconnectTimer = null
		}

		if (!delay) {
			this._reconnect(closeIfOpen, enableAutomaticState)
		} else {
			this._reconnectTimer = setTimeout(() => this._reconnect(closeIfOpen, enableAutomaticState), delay);
		}
	}

	/**
	 * Tries to reconnect the websocket if it is not connected.
	 */
	_reconnect(closeIfOpen: boolean, enableAutomaticState: boolean) {
		console.log(new Date().toISOString(), "ws _reconnect socket state (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): "
			+ ((this._socket) ? this._socket.readyState : "null"), "state:", this._state,
			"closeIfOpen", closeIfOpen, "enableAutomaticState", enableAutomaticState);
		if (this._state !== EventBusState.Terminated && enableAutomaticState) {
			this._state = EventBusState.Automatic
		}
		if (closeIfOpen && this._socket && this._socket.readyState === WebSocket.OPEN) {
			this._immediateReconnect = true
			neverNull(this._socket).close();
		} else if (
			(this._socket == null || this._socket.readyState === WebSocket.CLOSED
				|| this._socket.readyState === WebSocket.CLOSING)
			&& this._state !== EventBusState.Terminated
			&& this._login.isLoggedIn()) {
			// Don't try to connect right away because connection may not be actually there
			// see #1165
			if (this._connectTimer) {
				clearTimeout(this._connectTimer)
			}
			this._connectTimer = setTimeout(() => this.connect(true), 100)
		}
	}


	/**
	 * stores the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	 * this is needed to know from where to start loading missed events after a reconnect
	 */
	_setLatestEntityEventIds(): Promise<void> {
		// set all last event ids in one step to avoid that we have just set them for a few groups when a ServiceUnavailableError occurs
		const lastIds: Map<Id, Array<Id>> = new Map()
		return Promise.each(this._eventGroups(), groupId => {
			return this._entity.loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true).then(batches => {
				lastIds.set(groupId, [(batches.length === 1) ? getLetId(batches[0])[1] : GENERATED_MIN_ID])
			})
		}).then(() => {
			this._lastEntityEventIds = lastIds
			this._lastUpdateTime = Date.now()
			this._eventQueue.resume()
		})
	}

	_loadMissedEntityEvents(): Promise<void> {
		if (this._login.isLoggedIn()) {
			if (Date.now() > this._lastUpdateTime + ENTITY_EVENT_BATCH_EXPIRE_MS) {
				// we did not check for updates for too long, so some missed EntityEventBatches can not be loaded any more
				return this._worker.sendError(new OutOfSyncError())
			} else {
				return Promise.each(this._eventGroups(), (groupId) => {
					return this._entity
					           .loadAll(EntityEventBatchTypeRef, groupId, this._getLastEventBatchIdOrMinIdForGroup(groupId))
					           .then((eventBatches) => {
							           if (eventBatches.length === 0) {
								           // There won't be a callback from the queue to process the event so we mark this group as
								           // completed right away
								           this._progressMonitor.workDone(1)
							           } else {
								           for (const batch of eventBatches) {
									           this._addBatch(getElementId(batch), groupId, batch.events)
								           }
							           }
						           }
					           )
					           .catch(NotAuthorizedError, () => {
						           console.log("could not download entity updates => lost permission")
					           })
				}).then(() => {
					this._lastUpdateTime = Date.now()
					this._eventQueue.resume()
				})
			}
		} else {
			return Promise.resolve()
		}
	}

	_addBatch(batchId: Id, groupId: Id, events: $ReadOnlyArray<EntityUpdate>) {
		const lastForGroup = this._lastEntityEventIds.get(groupId) || []
		// find the position for inserting into last entity events (negative value is considered as not present in the array)
		const index = binarySearch(lastForGroup, batchId, compareOldestFirst)
		let wasAdded
		if (index < 0) {
			lastForGroup.splice(-index, 0, batchId)
			// only add the batch if it was not process before
			wasAdded = this._eventQueue.add(batchId, groupId, events)
		} else {
			wasAdded = false
		}
		if (lastForGroup.length > this._MAX_EVENT_IDS_QUEUE_LENGTH) {
			lastForGroup.shift()
		}
		this._lastEntityEventIds.set(batchId, lastForGroup)

		if (wasAdded) {
			this._lastAddedBatchForGroup.set(groupId, batchId)
		}
	}

	_processEventBatch(batch: QueuedBatch): Promise<void> {
		return this._executeIfNotTerminated(() => {
			return this._cache.entityEventsReceived(batch.events)
			           .then(filteredEvents => {
				           return this._executeIfNotTerminated(() => this._login.entityEventsReceived(filteredEvents))
				                      .then(() => this._executeIfNotTerminated(() => this._mail.entityEventsReceived(filteredEvents)))
				                      .then(() => this._executeIfNotTerminated(() => this._worker.entityEventsReceived(filteredEvents, batch.groupId)))
				                      .return(filteredEvents)
			           })
			           .then(filteredEvents => {
				           // Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
				           // shall not receive the event twice.
				           if (!isTest() && !isAdminClient()) {
					           this._executeIfNotTerminated(() => {
						           this._indexer.addBatchesToQueue([
							           {
								           groupId: batch.groupId,
								           batchId: batch.batchId,
								           events: filteredEvents
							           }
						           ])
						           this._indexer.startProcessing()
					           })
				           }
			           })
		}).catch(ServiceUnavailableError, e => {
			// a ServiceUnavailableError is a temporary error and we have to retry to avoid data inconsistencies
			console.log("retry processing event in 30s", e)
			let promise = Promise.delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
				// if we have a websocket reconnect we have to stop retrying
				if (this._serviceUnavailableRetry === promise) {
					return this._processEventBatch(batch)
				} else {
					throw new CancelledError("stop retry processing after service unavailable due to reconnect")
				}
			})
			this._serviceUnavailableRetry = promise
			return promise
		})
	}

	_getLastEventBatchIdOrMinIdForGroup(groupId: Id): Id {
		const lastIds = this._lastEntityEventIds.get(groupId)
		return (lastIds && lastIds.length > 0) ? lastThrow(lastIds) : GENERATED_MIN_ID
	}

	_executeIfNotTerminated(call: Function): Promise<void> {
		if (this._state !== EventBusState.Terminated) {
			return call()
		} else {
			return Promise.resolve()
		}
	}

	_eventGroups(): Id[] {
		return this._login.getLoggedInUser().memberships
		           .filter(membership => membership.groupType !== GroupType.MailingList)
		           .map(membership => membership.group)
		           .concat(this._login.getLoggedInUser().userGroup.group)
	}
}