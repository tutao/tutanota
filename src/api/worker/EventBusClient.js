// @flow
import type {LoginFacade} from "./facades/LoginFacade"
import type {MailFacade} from "./facades/MailFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {decryptAndMapToInstance} from "./crypto/CryptoFacade"
import {assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isTest, Mode} from "../Env"
import {_TypeModel as MailTypeModel} from "../entities/tutanota/Mail"
import {firstBiggerThanSecond, GENERATED_MAX_ID, GENERATED_MIN_ID, getLetId} from "../common/EntityFunctions"
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
import {downcast, identity, neverNull, ProgressMonitor, randomIntFromInterval} from "../common/utils/Utils"
import {OutOfSyncError} from "../common/error/OutOfSyncError"
import {contains} from "../common/utils/ArrayUtils"
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

assertWorkerOrNode()


const EventBusState = Object.freeze({
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

	_indexer: Indexer;
	_cache: EntityRestInterface;
	_entity: EntityClient;
	_worker: WorkerImpl;
	_mail: MailFacade;
	_login: LoginFacade;

	_state: EventBusStateEnum;
	_socket: ?WebSocket;
	_immediateReconnect: boolean; // if true tries to reconnect immediately after the websocket is closed
	_lastEntityEventIds: {[key: Id]: Id[]}; // maps group id to last event ids (max. 1000). we do not have to update these event ids if the groups of the user change because we always take the current users groups from the LoginFacade.
	_lastUpdateTime: number; // the last time we received an EntityEventBatch or checked for updates. we use this to find out if our data has expired, see ENTITY_EVENT_BATCH_EXPIRE_MS
	_queueWebsocketEvents: boolean
	_lastAntiphishingMarkersId: ?Id;

	_websocketWrapperQueue: WebsocketEntityData[]; // in this array all arriving WebsocketWrappers are stored as long as we are loading or processing EntityEventBatches

	_reconnectTimer: ?TimeoutID;
	_connectTimer: ?TimeoutID;

	/**
	 * Represents a currently retried executing due to a ServiceUnavailableError
	 */
	_serviceUnavailableRetry: ?Promise<void>;
	_failedConnectionAttempts: number = 0;

	constructor(worker: WorkerImpl, indexer: Indexer, cache: EntityRestInterface, mail: MailFacade, login: LoginFacade) {
		this._worker = worker
		this._indexer = indexer
		this._cache = cache
		this._entity = new EntityClient(cache)
		this._mail = mail
		this._login = login
		this._socket = null
		this._state = EventBusState.Automatic
		this._reconnectTimer = null
		this._connectTimer = null
		this._reset()

		// we store the last 1000 event ids per group, so we know if an event was already processed.
		// it is not sufficient to check the last event id because a smaller event id may arrive later
		// than a bigger one if the requests are processed in parallel on the server
		this._MAX_EVENT_IDS_QUEUE_LENGTH = 1000
	}

	_reset(): void {
		this._immediateReconnect = false
		this._lastEntityEventIds = {}
		this._lastUpdateTime = 0
		this._queueWebsocketEvents = false
		this._websocketWrapperQueue = []
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
		this._websocketWrapperQueue = []
		// make sure a retry will be cancelled by setting _serviceUnavailableRetry to null
		this._serviceUnavailableRetry = null
		this._worker.updateWebSocketState("connecting")
		// Task for updating events are number of groups + 3. Use 2 as base for reconnect state and 1 for processing queued events.
		const entityEventProgress = new ProgressMonitor(this._eventGroups().length + 3, (percentage) => {
			if (reconnect) this._worker.updateEntityEventProgress(percentage)
		})
		entityEventProgress.workDone(1)
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
		this._socket.onopen = () => {
			this._failedConnectionAttempts = 0
			console.log("ws open: ", new Date(), "state:", this._state);
			// Indicate some progress right away
			entityEventProgress.workDone(1)
			this._initEntityEvents(reconnect, entityEventProgress)
			this._worker.updateWebSocketState("connected")
		};
		this._socket.onclose = (event: CloseEvent) => this._close(event);
		this._socket.onerror = (error: any) => this._error(error);
		this._socket.onmessage = (message: MessageEvent) => this._message(message);
	}

	_initEntityEvents(reconnect: boolean, entityEventProgress: ProgressMonitor) {
		this._queueWebsocketEvents = true
		let existingConnection = reconnect && Object.keys(this._lastEntityEventIds).length > 0
		let p = existingConnection ? this._loadMissedEntityEvents(entityEventProgress) : this._setLatestEntityEventIds()
		p.then(() => {
			this._queueWebsocketEvents = false
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
				this._lastEntityEventIds = {}
				this._lastUpdateTime = 0
			}
			console.log("retry init entity events in 30s", e)
			let promise = Promise.delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
				// if we have a websocket reconnect we have to stop retrying
				if (this._serviceUnavailableRetry === promise) {
					console.log("retry initializing entity events")
					return this._initEntityEvents(reconnect, entityEventProgress)
				} else {
					console.log("cancel initializing entity events")
				}
			})
			this._serviceUnavailableRetry = promise
			return promise
		}).catch(e => {
			this._queueWebsocketEvents = false
			this._worker.sendError(e)
		}).finally(() => {
			entityEventProgress.completed()
		}) //Done or Failed. We want to show full progress bar for 500ms to indicate that we are done. Don't show the progress bar anymore afterwards.
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
			return decryptAndMapToInstance(WebsocketEntityDataTypeModel, JSON.parse(value), null)
				.then(data => {
					// When an event batch is received only process it if there is no other event batch currently processed. Otherwise put it into the cache. After processing an event batch we
					// start processing the next one from the cache. This makes sure that all events are processed in the order they are received and we do not get an inconsistent state
					if (this._queueWebsocketEvents) {
						this._websocketWrapperQueue.push(data)
					} else {
						this._queueWebsocketEvents = true
						return this._processEntityEvents(data.eventBatch, data.eventBatchOwner, data.eventBatchId).then(() => {
							this._lastUpdateTime = Date.now()
							if (this._websocketWrapperQueue.length > 0) {
								return this._processQueuedEvents()
							}
						}).then(() => {
							this._queueWebsocketEvents = false
						}).catch(ConnectionError, e => {
							this._queueWebsocketEvents = false
							console.log("not connected in _message(), close websocket", e)
							this.close(CloseEventBusOption.Reconnect)
						}).catch(CancelledError, e => {
							// the processing was aborted due to a reconnect. do not reset any attributes because they might already be in use since reconnection
							console.log("cancelled retry process entity events after _message call")
						}).catch(e => {
							this._queueWebsocketEvents = false
							this._worker.sendError(e)
						})
					}
				})
		} else if (type === "unreadCounterUpdate") {
			this._worker.updateCounter(JSON.parse(value))
		} else if (type === "phishingMarkers") {
			return decryptAndMapToInstance(PhishingMarkerWebsocketDataTypeModel, JSON.parse(value), null)
				.then((data) => {
					this._lastAntiphishingMarkersId = data.lastId
					this._mail.phishingMarkersUpdateReceived(data.markers)
				})
		} else {
			console.log("ws message with unknown type", type)
		}
		return Promise.resolve()
	}

	_close(event: CloseEvent) {
		this._failedConnectionAttempts++
		console.log(new Date().toISOString(), "ws _close: ", event, "state:", this._state);
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
		let lastIds: {[key: Id]: Id[]} = {}
		return Promise.each(this._eventGroups(), groupId => {
			return this._entity.loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true).then(batches => {
				lastIds[groupId] = [
					(batches.length === 1) ? getLetId(batches[0])[1] : GENERATED_MIN_ID
				]
			})
		}).then(() => {
			this._lastEntityEventIds = lastIds
			this._lastUpdateTime = Date.now()
			return this._processQueuedEvents()
		})
	}

	_loadMissedEntityEvents(entityEventProgress: ProgressMonitor): Promise<void> {
		if (this._login.isLoggedIn()) {
			if (Date.now() > this._lastUpdateTime + ENTITY_EVENT_BATCH_EXPIRE_MS) {
				// we did not check for updates for too long, so some missed EntityEventBatches can not be loaded any more
				return this._worker.sendError(new OutOfSyncError())
			} else {
				return Promise.each(this._eventGroups(), groupId => {
					return this._entity.loadAll(EntityEventBatchTypeRef, groupId, this._getLastEventBatchIdOrMinIdForGroup(groupId))
					           .each(eventBatch => {
						           return this._processEntityEvents(eventBatch.events, groupId, getLetId(eventBatch)[1])
					           })
					           .catch(NotAuthorizedError, () => {
						           console.log("could not download entity updates => lost permission")
					           }).finally(() => {
							entityEventProgress.workDone(1)
						})
				}).then(() => {
					this._lastUpdateTime = Date.now()
					return this._processQueuedEvents().then(() => {
							entityEventProgress.workDone(1)
						}
					)
				})
			}
		} else {
			return Promise.resolve()
		}
	}

	_processQueuedEvents(): Promise<void> {
		if (this._websocketWrapperQueue.length === 0) {
			return Promise.resolve()
		} else {
			let wrapper = this._websocketWrapperQueue.shift()
			// check if we have already processed this queued event when loading the EntityEventBatch
			let groupId = neverNull(wrapper.eventBatchOwner)
			let eventId = neverNull(wrapper.eventBatchId)
			let p = Promise.resolve()
			if (!this._isAlreadyProcessed(groupId, eventId)) {
				p = this._processEntityEvents(wrapper.eventBatch, groupId, eventId);
			}
			return p.then(() => {
				this._lastUpdateTime = Date.now()
				return this._processQueuedEvents()
			})
		}
	}

	_processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		return this._executeIfNotTerminated(() => {
			return this._cache.entityEventsReceived(events)
			           .then(filteredEvents => {
				           return this._executeIfNotTerminated(() => this._login.entityEventsReceived(filteredEvents))
				                      .then(() => this._executeIfNotTerminated(() => this._mail.entityEventsReceived(filteredEvents)))
				                      .then(() => this._executeIfNotTerminated(() => this._worker.entityEventsReceived(filteredEvents, groupId)))
				                      .return(filteredEvents)
			           })
			           .then(filteredEvents => {
				           if (!this._lastEntityEventIds[groupId]) {
					           this._lastEntityEventIds[groupId] = []
				           }
				           this._lastEntityEventIds[groupId].push(batchId)
				           // make sure the batch ids are in ascending order, so we use the highest id when downloading all missed events after a reconnect
				           this._lastEntityEventIds[groupId].sort((e1, e2) => {
					           if (e1 === e2) {
						           return 0
					           } else {
						           return firstBiggerThanSecond(e1, e2) ? 1 : -1
					           }
				           })
				           if (this._lastEntityEventIds[groupId].length > this._MAX_EVENT_IDS_QUEUE_LENGTH) {
					           this._lastEntityEventIds[groupId].shift()
				           }

				           // Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
				           // shall not receive the event twice.
				           if (!isTest() && !isAdminClient()) {
					           this._executeIfNotTerminated(() => {
						           this._indexer.addBatchesToQueue([{groupId, batchId, events: filteredEvents}])
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
					return this._processEntityEvents(events, groupId, batchId)
				} else {
					throw new CancelledError("stop retry processing after service unavailable due to reconnect")
				}
			})
			this._serviceUnavailableRetry = promise
			return promise
		})
	}

	_getLastEventBatchIdOrMinIdForGroup(groupId: Id): Id {
		// TODO handle lost updates (old event surpassed by newer one, we store the new id and retrieve instances from the newer one on next login
		return (this._lastEntityEventIds[groupId] && this._lastEntityEventIds[groupId].length > 0) ?
			this._lastEntityEventIds[groupId][this._lastEntityEventIds[groupId].length - 1] : GENERATED_MIN_ID
	}

	_isAlreadyProcessed(groupId: Id, eventId: Id): boolean {
		if (this._lastEntityEventIds[groupId] && this._lastEntityEventIds[groupId].length > 0) {
			return firstBiggerThanSecond(this._lastEntityEventIds[groupId][0], eventId)
				|| contains(this._lastEntityEventIds[groupId], eventId)
		} else {
			return false
		}
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
