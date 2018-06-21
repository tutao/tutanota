// @flow
import type {LoginFacade} from "./facades/LoginFacade"
import type {MailFacade} from "./facades/MailFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {encryptAndMapToLiteral, applyMigrations, decryptAndMapToInstance} from "./crypto/CryptoFacade"
import {getWebsocketOrigin, assertWorkerOrNode, Mode, isIOSApp, isTest, isAdmin} from "../Env"
import {createAuthentication} from "../entities/sys/Authentication"
import {
	_TypeModel as WebsocketWrapperTypeModel,
	WebsocketWrapperTypeRef,
	createWebsocketWrapper
} from "../entities/sys/WebsocketWrapper"
import {_TypeModel as MailTypeModel} from "../entities/tutanota/Mail"
import type {EntityRestCache} from "./rest/EntityRestCache"
import {loadAll, load, loadRange} from "./EntityWorker"
import {GENERATED_MIN_ID, getLetId, GENERATED_MAX_ID, firstBiggerThanSecond} from "../common/EntityFunctions"
import {NotFoundError, NotAuthorizedError, ConnectionError, handleRestError} from "../common/error/RestError"
import {EntityEventBatchTypeRef} from "../entities/sys/EntityEventBatch"
import {neverNull} from "../common/utils/Utils"
import {OutOfSyncError} from "../common/error/OutOfSyncError"
import {contains} from "../common/utils/ArrayUtils"
import type {Indexer} from "./search/Indexer"

assertWorkerOrNode()

export class EventBusClient {
	_MAX_EVENT_IDS_QUEUE_LENGTH: number;

	_indexer: Indexer;
	_cache: EntityRestCache;
	_worker: WorkerImpl;
	_mail: MailFacade;
	_login: LoginFacade;

	_socket: ?WebSocket;
	_terminated: boolean; // if terminated, only reconnects if explicitely connect() is called from outside, but never by automatic reconnects
	_immediateReconnect: boolean; // if true tries to reconnect immediately after the websocket is closed
	_lastEntityEventIds: {[key: Id]: Id[]}; // maps group id to last event ids (max. 1000). we do not have to update these event ids if the groups of the user change because we always take the current users groups from the LoginFacade.
	_queueWebsocketEvents: boolean

	_websocketWrapperQueue: WebsocketWrapper[]; // in this array all arriving WebsocketWrappers are stored as long as we are loading or processing EntityEventBatches

	constructor(worker: WorkerImpl, indexer: Indexer, cache: EntityRestCache, mail: MailFacade, login: LoginFacade) {
		this._worker = worker
		this._indexer = indexer
		this._cache = cache
		this._mail = mail
		this._login = login
		this._socket = null
		this._terminated = false
		this._reset()

		// we store the last 1000 event ids per group, so we know if an event was already processed.
		// it is not sufficient to check the last event id because a smaller event id may arrive later
		// than a bigger one if the requests are processed in parallel on the server
		this._MAX_EVENT_IDS_QUEUE_LENGTH = 1000
	}

	_reset(): void {
		this._immediateReconnect = false
		this._lastEntityEventIds = {}
		this._queueWebsocketEvents = false
		this._websocketWrapperQueue = []
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
		console.log("ws connect reconnect=", reconnect);
		let url = getWebsocketOrigin() + "/event/";
		this._socket = new WebSocket(url);
		this._socket.onopen = () => {
			console.log("ws open: ", new Date());
			let wrapper = createWebsocketWrapper()
			wrapper.type = "authentication"
			wrapper.msgId = "0"
			// ClientVersion = <SystemModelVersion>.<TutanotaModelVersion>
			wrapper.modelVersions = WebsocketWrapperTypeModel.version + "." + MailTypeModel.version;
			wrapper.clientVersion = env.versionNumber;
			let authenticationData = createAuthentication()
			let headers = this._login.createAuthHeaders()
			authenticationData.userId = this._login.getLoggedInUser()._id
			if (headers.accessToken) {
				authenticationData.accessToken = headers.accessToken
			} else {
				authenticationData.authVerifier = headers.authVerifier
				authenticationData.externalAuthToken = headers.authToken
			}
			wrapper.authentication = authenticationData
			encryptAndMapToLiteral(WebsocketWrapperTypeModel, wrapper, null).then(entityForSending => {
				const sendInitialMsg = () => {
					const socket = (this._socket:any)
					if (socket.readyState === 1) {
						socket.send(JSON.stringify(entityForSending));
						this._terminated = false
					} else if (socket.readyState === 0) {
						setTimeout(sendInitialMsg, 5)
					}
				}
				sendInitialMsg()
				if (reconnect) {
					this._loadMissedEntityEvents()
				} else {
					this._setLatestEntityEventIds()
				}
			})
		};
		this._socket.onclose = (event: CloseEvent) => this._close(event);
		this._socket.onerror = (error: any) => this._error(error);
		this._socket.onmessage = (message: MessageEvent) => this._message(message);
	}

	/**
	 * Sends a close event to the server and finally closes the connection.
	 * The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	 */
	close(reconnect: boolean = false) {
		console.log("ws close: ", new Date(), "reconnect: ", reconnect);
		if (!reconnect) {
			this._terminate()
		}
		if (this._socket && this._socket.close) { // close is undefined in node tests
			this._socket.close();
		}
	}

	_terminate(): void {
		this._terminated = true
		this._reset()
	}

	_error(error: any) {
		console.log("ws error: ", error);
	}

	_message(message: MessageEvent): Promise<void> {
		console.log("ws message: ", message.data);
		return applyMigrations(WebsocketWrapperTypeRef, JSON.parse((message.data:any))).then(data => {
			return decryptAndMapToInstance(WebsocketWrapperTypeModel, data, null).then(wrapper => {
				if (wrapper.type === 'entityUpdate') {
					// When an event batch is received only process it if there is no other event batch currently processed. Otherwise put it into the cache. After processing an event batch we
					// start processing the next one from the cache. This makes sure that all events are processed in the order they are received and we do not get an inconsistent state
					if (this._queueWebsocketEvents) {
						this._websocketWrapperQueue.push(wrapper)
					} else {
						this._queueWebsocketEvents = true
						return this._processEntityEvents(wrapper.eventBatch, neverNull(wrapper.eventBatchOwner), neverNull(wrapper.eventBatchId)).then(() => {
							if (this._websocketWrapperQueue.length > 0) {
								return this._processQueuedEvents()
							}
						}).finally(() => {
							this._queueWebsocketEvents = false
						})
					}
				}
			})
		})
	}

	_close(event: CloseEvent) {
		console.log("ws _close: ", event, new Date());
		// Avoid running into penalties when trying to authenticate with an invalid session
		// NotAuthenticatedException 401, AccessDeactivatedException 470, AccessBlocked 472
		// do not catch session expired here because websocket will be reused when we authenticate again
		if (event.code == 4401 || event.code == 4470 || event.code == 4472) {
			this._terminate()
			this._worker.sendError(handleRestError(event.code - 4000, "web socket error"))
		}

		if (!this._terminated && this._login.isLoggedIn()) {
			if (this._immediateReconnect || isIOSApp()) {
				this._immediateReconnect = false
				// on ios devices the close event fires when the app comes back to foreground
				// so try a reconnect immediately. The tryReconnect method is also triggered when
				// the app  comes to foreground by the "resume" event, but the order in which these
				// two events are executed is not defined so we need the tryReconnect in both situations.
				this.tryReconnect(false);
			}
			setTimeout(() => this.tryReconnect(false), 1000 * this._randomIntFromInterval(10, 30));
		}
	}

	/**
	 * Tries to reconnect the websocket if it is not connected.
	 */
	tryReconnect(closeIfOpen: boolean) {
		console.log("ws tryReconnect socket state (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): " + ((this._socket) ? this._socket.readyState : "null"));
		if (closeIfOpen && this._socket && this._socket.readyState == WebSocket.OPEN) {
			console.log("closing websocket connection before reconnect")
			this._immediateReconnect = true
			neverNull(this._socket).close();
		} else if ((this._socket == null || this._socket.readyState == WebSocket.CLOSED) && !this._terminated && this._login.isLoggedIn()) {
			this.connect(true);
		}
	}

	_randomIntFromInterval(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	/**
	 * stores the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	 * this is needed to know from where to start loading missed events after a reconnect
	 */
	_setLatestEntityEventIds(): Promise<void> {
		this._queueWebsocketEvents = true
		return Promise.each(this._login.getAllGroupIds(), groupId => {
			return loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true).then(batches => {
				this._lastEntityEventIds[groupId] = [(batches.length == 1) ? getLetId(batches[0])[1] : GENERATED_MIN_ID]
			})
		}).then(() => {
			return this._processQueuedEvents()
		}).catch(ConnectionError, e => {
			console.log("not connected in _setLatestEntityEventIds, close websocket", e)
			this.close(true)
		}).finally(() => {
			this._queueWebsocketEvents = false
		})
	}

	_loadMissedEntityEvents(): Promise<void> {
		if (this._login.isLoggedIn()) {
			this._queueWebsocketEvents = true
			return this._checkIfEntityEventsAreExpired().then(expired => {
				if (expired) {
					return this._worker.sendError(new OutOfSyncError())
				} else {
					return Promise.each(this._login.getAllGroupIds(), groupId => {
						return loadAll(EntityEventBatchTypeRef, groupId, this._getLastEventBatchIdOrMinIdForGroup(groupId)).each(eventBatch => {
							return this._processEntityEvents(eventBatch.events, groupId, getLetId(eventBatch)[1])
						})
					}).then(() => {
						return this._processQueuedEvents()
					})
				}
			}).catch(ConnectionError, e => {
				console.log("not connected in _loadMissedEntityEvents, close websocket", e)
				this.close(true)
			}).finally(() => {
				this._queueWebsocketEvents = false
			})
		} else {
			return Promise.resolve()
		}
	}

	_processQueuedEvents(): Promise<void> {
		if (this._websocketWrapperQueue.length == 0) {
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
				return this._processQueuedEvents()
			})
		}
	}

	_processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		return Promise.map(events, event => {
			return this._executeIfNotTerminated(() => this._cache.entityEventReceived(event))
				.then(() => event)
				.catch(e => {
					if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
						// skip this event. NotFoundError may occur if an entity is removed in parallel. NotAuthorizedError may occur if the user was removed from the owner group
						return null
					} else {
						this._worker.sendError(e)
						throw e // do not continue processing the other events
					}
				})
		}).filter(event => event != null).then(filteredEvents => {
			this._executeIfNotTerminated(() => {
				if (!isTest() && !isAdmin()) {
					return this._indexer.processEntityEvents(filteredEvents, groupId, batchId)
				}
			})
			return filteredEvents
		}).each(event => {
			return this._executeIfNotTerminated(() => this._login.entityEventReceived(event))
				.then(() => this._executeIfNotTerminated(() => this._mail.entityEventReceived(event)))
				.then(() => this._executeIfNotTerminated(() => this._worker.entityEventReceived(event)))
		}).then(() => {
			if (!this._lastEntityEventIds[groupId]) {
				this._lastEntityEventIds[groupId] = []
			}
			this._lastEntityEventIds[groupId].push(batchId)
			// make sure the batch ids are in ascending order, so we use the highest id when downloading all missed events after a reconnect
			this._lastEntityEventIds[groupId].sort((e1, e2) => {
				if (e1 == e2) {
					return 0
				} else {
					return firstBiggerThanSecond(e1, e2) ? 1 : -1
				}
			})
			if (this._lastEntityEventIds[groupId].length > this._MAX_EVENT_IDS_QUEUE_LENGTH) {
				this._lastEntityEventIds[groupId].shift()
			}
		})
	}

	/**
	 * Tries to load the last EntityEventBatch if we had loaded it before. If the batch can be loaded all later event batches are available. If it can not be loaded we assume that at least some later events are also expired.
	 * @return True if the events have expired, false otherwise.
	 */
	_checkIfEntityEventsAreExpired(): Promise<boolean> {
		return Promise.each(this._login.getAllGroupIds(), groupId => {
			let lastEventBatchId = this._getLastEventBatchIdOrMinIdForGroup(groupId)
			if (lastEventBatchId != GENERATED_MIN_ID) {
				return load(EntityEventBatchTypeRef, [groupId, lastEventBatchId])
			}
		}).then(() => {
			return false
		}).catch(NotFoundError, () => {
			return true
		})
	}

	_getLastEventBatchIdOrMinIdForGroup(groupId: Id): Id {
		// TODO handle lost updates (old event surpassed by newer one, we store the new id and retrieve instances from the newer one on next login
		return (this._lastEntityEventIds[groupId] && this._lastEntityEventIds[groupId].length > 0) ? this._lastEntityEventIds[groupId][this._lastEntityEventIds[groupId].length - 1] : GENERATED_MIN_ID
	}

	_isAlreadyProcessed(groupId: Id, eventId: Id): boolean {
		if (this._lastEntityEventIds[groupId] && this._lastEntityEventIds[groupId].length > 0) {
			return firstBiggerThanSecond(this._lastEntityEventIds[groupId][0], eventId) || contains(this._lastEntityEventIds[groupId], eventId)
		} else {
			return false
		}
	}

	_executeIfNotTerminated(call: Function): Promise<void> {
		if (!this._terminated) {
			return call()
		} else {
			return Promise.resolve()
		}
	}
}
