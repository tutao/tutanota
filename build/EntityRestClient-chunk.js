import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, assertWorkerOrNode, isDesktop, isOfflineStorageAvailable, isTest } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { TypeRef, assert, assertNotNull, base64ExtToBase64, base64ToBase64Ext, base64ToBase64Url, base64UrlToBase64, binarySearch, defer, delay, difference, downcast, freezeMap, getFirstOrThrow, getTypeId, groupBy, groupByAndMapUniquely, identity, isEmpty, isSameTypeRef, lastThrow, mapNullable, mapObject, ofClass, pMap, promiseFilter, randomIntFromInterval, splitInChunks } from "./dist2-chunk.js";
import { CloseEventBusOption, GroupType, OperationType, SECOND_MS } from "./TutanotaConstants-chunk.js";
import { AssociationType, CUSTOM_MAX_ID, CUSTOM_MIN_ID, Cardinality, GENERATED_MAX_ID, GENERATED_MIN_ID, LOAD_MULTIPLE_LIMIT, POST_MULTIPLE_LIMIT, Type, ValueType, compareOldestFirst, firstBiggerThanSecond, getElementId, getListId, isSameId } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, CalendarEventUidIndexTypeRef, MailDetailsBlobTypeRef, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef, PhishingMarkerWebsocketDataTypeRef } from "./TypeRefs-chunk.js";
import { AuditLogEntryTypeRef, BucketPermissionTypeRef, EntityEventBatchTypeRef, GroupKeyTypeRef, KeyRotationTypeRef, PermissionTypeRef, PushIdentifierTypeRef, RecoverCodeTypeRef, RejectedSenderTypeRef, SecondFactorTypeRef, SessionTypeRef, UserGroupKeyDistributionTypeRef, UserGroupRootTypeRef, UserTypeRef, WebsocketCounterDataTypeRef, WebsocketEntityDataTypeRef, WebsocketLeaderStatusTypeRef, createWebsocketLeaderStatus } from "./TypeRefs2-chunk.js";
import { handleUncaughtError } from "./ErrorHandler-chunk.js";
import { HttpMethod, MediaType, ModelInfo_default, _verifyType, resolveTypeReference } from "./EntityFunctions-chunk.js";
import { ModelInfo_default$1 } from "./ModelInfo-chunk.js";
import { SessionKeyNotFoundError, isOfflineError, objToError } from "./ErrorUtils-chunk.js";
import { AccessBlockedError, AccessDeactivatedError, ConnectionError, InternalServerError, NotAuthenticatedError, NotAuthorizedError, NotFoundError, PayloadTooLargeError, ServiceUnavailableError, SessionExpiredError, handleRestError } from "./RestError-chunk.js";
import { SetupMultipleError } from "./SetupMultipleError-chunk.js";
import { OutOfSyncError } from "./OutOfSyncError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { EventQueue } from "./EventQueue-chunk.js";
import { LoginIncompleteError } from "./LoginIncompleteError-chunk.js";
import { MessageDispatcher, Request } from "./MessageDispatcher-chunk.js";
import { exposeLocalDelayed, exposeRemote } from "./WorkerProxy-chunk.js";
import { containsEventOfType, getEventOfType } from "./EntityUpdateUtils-chunk.js";

//#region src/common/api/worker/ProgressMonitorDelegate.ts
var ProgressMonitorDelegate = class {
	ref;
	constructor(progressTracker, totalWork) {
		this.progressTracker = progressTracker;
		this.totalWork = totalWork;
		this.ref = progressTracker.registerMonitor(totalWork);
	}
	async workDone(amount) {
		await this.progressTracker.workDoneForMonitor(await this.ref, amount);
	}
	async totalWorkDone(totalAmount) {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalWork - totalAmount);
	}
	async completed() {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalWork);
	}
};

//#endregion
//#region src/common/api/common/threading/Transport.ts
var WebWorkerTransport = class {
	constructor(worker) {
		this.worker = worker;
	}
	postMessage(message) {
		return this.worker.postMessage(message);
	}
	setMessageHandler(handler) {
		this.worker.onmessage = (ev) => handler(downcast(ev.data));
	}
};

//#endregion
//#region src/common/api/main/WorkerClient.ts
assertMainOrNode();
let WsConnectionState = function(WsConnectionState$1) {
	WsConnectionState$1[WsConnectionState$1["connecting"] = 0] = "connecting";
	WsConnectionState$1[WsConnectionState$1["connected"] = 1] = "connected";
	WsConnectionState$1[WsConnectionState$1["terminated"] = 2] = "terminated";
	return WsConnectionState$1;
}({});
var WorkerClient = class {
	_deferredInitialized = defer();
	_isInitialized = false;
	_dispatcher;
	constructor() {
		this.initialized.then(() => {
			this._isInitialized = true;
		});
	}
	get initialized() {
		return this._deferredInitialized.promise;
	}
	async init(locator) {
		if (env.mode !== "Test") {
			const { prefixWithoutFile } = window.tutao.appState;
			const workerUrl = prefixWithoutFile + "/worker-bootstrap.js";
			const worker = new Worker(workerUrl, { type: "module" });
			this._dispatcher = new MessageDispatcher(new WebWorkerTransport(worker), this.queueCommands(locator), "main-worker");
			await this._dispatcher.postRequest(new Request("setup", [
				window.env,
				this.getInitialEntropy(),
				client.browserData()
			]));
			worker.onerror = (e) => {
				throw new Error(`could not setup worker: ${e.name} ${e.stack} ${e.message} ${e}`);
			};
		} else {
			const WorkerImpl = globalThis.testWorker;
			const workerImpl = new WorkerImpl(this, true);
			await workerImpl.init(client.browserData());
			workerImpl._queue._transport = { postMessage: (msg) => this._dispatcher.handleMessage(msg) };
			this._dispatcher = new MessageDispatcher({ postMessage: function(msg) {
				workerImpl._queue.handleMessage(msg);
			} }, this.queueCommands(locator), "main-worker");
		}
		this._deferredInitialized.resolve();
	}
	queueCommands(locator) {
		return {
			execNative: (message) => locator.native.invokeNative(downcast(message.args[0]), downcast(message.args[1])),
			error: (message) => {
				handleUncaughtError(objToError(message.args[0]));
				return Promise.resolve();
			},
			facade: exposeLocalDelayed({
				async loginListener() {
					return locator.loginListener;
				},
				async wsConnectivityListener() {
					return locator.connectivityModel;
				},
				async progressTracker() {
					return locator.progressTracker;
				},
				async eventController() {
					return locator.eventController;
				},
				async operationProgressTracker() {
					return locator.operationProgressTracker;
				},
				async infoMessageHandler() {
					return locator.infoMessageHandler;
				}
			})
		};
	}
	getWorkerInterface() {
		return exposeRemote(async (request) => this._postRequest(request));
	}
	restRequest(...args) {
		return this._postRequest(new Request("restRequest", args));
	}
	/** @private visible for tests */
	async _postRequest(msg) {
		await this.initialized;
		return this._dispatcher.postRequest(msg);
	}
	reset() {
		return this._postRequest(new Request("reset", []));
	}
	/**
	* Add data from either secure random source or Math.random as entropy.
	*/
	getInitialEntropy() {
		const valueList = new Uint32Array(16);
		crypto.getRandomValues(valueList);
		const entropy = [];
		for (let i = 0; i < valueList.length; i++) entropy.push({
			source: "random",
			entropy: 32,
			data: valueList[i]
		});
		return entropy;
	}
};
function bootstrapWorker(locator) {
	const worker = new WorkerClient();
	const start = Date.now();
	worker.init(locator).then(() => console.log("worker init time (ms):", Date.now() - start));
	return worker;
}

//#endregion
//#region src/common/api/worker/EventBusClient.ts
assertWorkerOrNode();
let EventBusState = function(EventBusState$1) {
	EventBusState$1["Automatic"] = "automatic";
	EventBusState$1["Suspended"] = "suspended";
	EventBusState$1["Terminated"] = "terminated";
	return EventBusState$1;
}({});
const ENTITY_EVENT_BATCH_EXPIRE_MS = 38016e5;
const RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS = 3e4;
const NORMAL_SHUTDOWN_CLOSE_CODE = 1;
/**
* Reconnection interval bounds. When we reconnect we pick a random number of seconds in a range to prevent that all the clients connect at the same time which
* would put unnecessary load on the server.
* The range depends on the number of attempts and the server response.
* */
const RECONNECT_INTERVAL = Object.freeze({
	SMALL: [5, 10],
	MEDIUM: [20, 40],
	LARGE: [60, 120]
});
const MAX_EVENT_IDS_QUEUE_LENGTH = 1e3;
/** Known types of messages that can be received over websocket. */
var MessageType = function(MessageType$1) {
	MessageType$1["EntityUpdate"] = "entityUpdate";
	MessageType$1["UnreadCounterUpdate"] = "unreadCounterUpdate";
	MessageType$1["PhishingMarkers"] = "phishingMarkers";
	MessageType$1["LeaderStatus"] = "leaderStatus";
	return MessageType$1;
}(MessageType || {});
let ConnectMode = function(ConnectMode$1) {
	ConnectMode$1[ConnectMode$1["Initial"] = 0] = "Initial";
	ConnectMode$1[ConnectMode$1["Reconnect"] = 1] = "Reconnect";
	return ConnectMode$1;
}({});
var EventBusClient = class {
	state;
	socket;
	immediateReconnect = false;
	/**
	* Map from group id to last event ids (max. _MAX_EVENT_IDS_QUEUE_LENGTH). We keep them to avoid processing the same event twice if
	* it comes out of order from the server) and for requesting missed entity events on reconnect.
	*
	* We do not have to update these event ids if the groups of the user change because we always take the current users groups from the
	* LoginFacade.
	*/
	lastEntityEventIds;
	/**
	* Last batch which was actually added to the queue. We need it to find out when the group is processed
	*/
	lastAddedBatchForGroup;
	lastAntiphishingMarkersId = null;
	/** Queue to process all events. */
	eventQueue;
	/** Queue that handles incoming websocket messages only. Caches them until we process downloaded ones and then adds them to eventQueue. */
	entityUpdateMessageQueue;
	reconnectTimer;
	connectTimer;
	/**
	* Represents a currently retried executing due to a ServiceUnavailableError
	*/
	serviceUnavailableRetry = null;
	failedConnectionAttempts = 0;
	constructor(listener, cache, userFacade, entity, instanceMapper, socketFactory, sleepDetector, progressTracker) {
		this.listener = listener;
		this.cache = cache;
		this.userFacade = userFacade;
		this.entity = entity;
		this.instanceMapper = instanceMapper;
		this.socketFactory = socketFactory;
		this.sleepDetector = sleepDetector;
		this.progressTracker = progressTracker;
		this.state = EventBusState.Terminated;
		this.lastEntityEventIds = new Map();
		this.lastAddedBatchForGroup = new Map();
		this.socket = null;
		this.reconnectTimer = null;
		this.connectTimer = null;
		this.eventQueue = new EventQueue("ws_opt", true, (modification) => this.eventQueueCallback(modification));
		this.entityUpdateMessageQueue = new EventQueue("ws_msg", false, (batch) => this.entityUpdateMessageQueueCallback(batch));
		this.reset();
	}
	reset() {
		this.immediateReconnect = false;
		this.lastEntityEventIds.clear();
		this.lastAddedBatchForGroup.clear();
		this.eventQueue.pause();
		this.eventQueue.clear();
		this.serviceUnavailableRetry = null;
	}
	/**
	* Opens a WebSocket connection to receive server events.
	* @param connectMode
	*/
	connect(connectMode) {
		console.log("ws connect reconnect:", connectMode === ConnectMode.Reconnect, "state:", this.state);
		this.serviceUnavailableRetry = null;
		this.listener.onWebsocketStateChanged(WsConnectionState.connecting);
		this.state = EventBusState.Automatic;
		this.connectTimer = null;
		const authHeaders = this.userFacade.createAuthHeaders();
		const authQuery = "modelVersions=" + ModelInfo_default$1.version + "." + ModelInfo_default.version + "&clientVersion=" + env.versionNumber + "&userId=" + this.userFacade.getLoggedInUser()._id + "&accessToken=" + authHeaders.accessToken + (this.lastAntiphishingMarkersId ? "&lastPhishingMarkersId=" + this.lastAntiphishingMarkersId : "");
		const path = "/event?" + authQuery;
		this.unsubscribeFromOldWebsocket();
		this.socket = this.socketFactory(path);
		this.socket.onopen = () => this.onOpen(connectMode);
		this.socket.onclose = (event) => this.onClose(event);
		this.socket.onerror = (error) => this.onError(error);
		this.socket.onmessage = (message) => this.onMessage(message);
		this.sleepDetector.start(() => {
			console.log("ws sleep detected, reconnecting...");
			this.tryReconnect(true, true);
		});
	}
	/**
	* Sends a close event to the server and finally closes the connection.
	* The state of this event bus client is reset and the client is terminated (does not automatically reconnect) except reconnect == true
	*/
	async close(closeOption) {
		console.log("ws close closeOption: ", closeOption, "state:", this.state);
		switch (closeOption) {
			case CloseEventBusOption.Terminate:
				this.terminate();
				break;
			case CloseEventBusOption.Pause:
				this.state = EventBusState.Suspended;
				this.listener.onWebsocketStateChanged(WsConnectionState.connecting);
				break;
			case CloseEventBusOption.Reconnect:
				this.listener.onWebsocketStateChanged(WsConnectionState.connecting);
				break;
		}
		this.socket?.close();
	}
	async tryReconnect(closeIfOpen, enableAutomaticState, delay$1 = null) {
		console.log("ws tryReconnect closeIfOpen:", closeIfOpen, "enableAutomaticState:", enableAutomaticState, "delay:", delay$1);
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (!delay$1) this.reconnect(closeIfOpen, enableAutomaticState);
else this.reconnectTimer = setTimeout(() => this.reconnect(closeIfOpen, enableAutomaticState), delay$1);
	}
	onOpen(connectMode) {
		this.failedConnectionAttempts = 0;
		console.log("ws open state:", this.state);
		const p = this.initEntityEvents(connectMode);
		this.listener.onWebsocketStateChanged(WsConnectionState.connected);
		return p;
	}
	onError(error) {
		console.log("ws error:", error, JSON.stringify(error), "state:", this.state);
	}
	async onMessage(message) {
		const [type, value] = message.data.split(";");
		switch (type) {
			case MessageType.EntityUpdate: {
				const { eventBatchId, eventBatchOwner, eventBatch } = await this.instanceMapper.decryptAndMapToInstance(await resolveTypeReference(WebsocketEntityDataTypeRef), JSON.parse(value), null);
				const filteredEntityUpdates = await this.removeUnknownTypes(eventBatch);
				this.entityUpdateMessageQueue.add(eventBatchId, eventBatchOwner, filteredEntityUpdates);
				break;
			}
			case MessageType.UnreadCounterUpdate: {
				const counterData = await this.instanceMapper.decryptAndMapToInstance(await resolveTypeReference(WebsocketCounterDataTypeRef), JSON.parse(value), null);
				this.listener.onCounterChanged(counterData);
				break;
			}
			case MessageType.PhishingMarkers: {
				const data = await this.instanceMapper.decryptAndMapToInstance(await resolveTypeReference(PhishingMarkerWebsocketDataTypeRef), JSON.parse(value), null);
				this.lastAntiphishingMarkersId = data.lastId;
				this.listener.onPhishingMarkersReceived(data.markers);
				break;
			}
			case MessageType.LeaderStatus: {
				const data = await this.instanceMapper.decryptAndMapToInstance(await resolveTypeReference(WebsocketLeaderStatusTypeRef), JSON.parse(value), null);
				await this.userFacade.setLeaderStatus(data);
				await this.listener.onLeaderStatusChanged(data);
				break;
			}
			default:
				console.log("ws message with unknown type", type);
				break;
		}
	}
	/**
	* Filters out specific types from @param entityUpdates that the client does not actually know about
	* (that are not in tutanotaTypes), and which should therefore not be processed.
	*/
	async removeUnknownTypes(eventBatch) {
		return promiseFilter(eventBatch, async (entityUpdate) => {
			const typeRef = new TypeRef(entityUpdate.application, entityUpdate.type);
			try {
				await resolveTypeReference(typeRef);
				return true;
			} catch (_error) {
				console.warn("ignoring entityEventUpdate for unknown type with typeId", getTypeId(typeRef));
				return false;
			}
		});
	}
	onClose(event) {
		this.failedConnectionAttempts++;
		console.log("ws close event:", event, "state:", this.state);
		this.userFacade.setLeaderStatus(createWebsocketLeaderStatus({ leaderStatus: false }));
		this.sleepDetector.stop();
		const serverCode = event.code - 4e3;
		if ([
			NotAuthorizedError.CODE,
			AccessDeactivatedError.CODE,
			AccessBlockedError.CODE
		].includes(serverCode)) {
			this.terminate();
			this.listener.onError(handleRestError(serverCode, "web socket error", null, null));
		} else if (serverCode === SessionExpiredError.CODE) {
			this.state = EventBusState.Suspended;
			this.listener.onWebsocketStateChanged(WsConnectionState.connecting);
		} else if (this.state === EventBusState.Automatic && this.userFacade.isFullyLoggedIn()) {
			this.listener.onWebsocketStateChanged(WsConnectionState.connecting);
			if (this.immediateReconnect) {
				this.immediateReconnect = false;
				this.tryReconnect(false, false);
			} else {
				let reconnectionInterval;
				if (serverCode === NORMAL_SHUTDOWN_CLOSE_CODE) reconnectionInterval = RECONNECT_INTERVAL.LARGE;
else if (this.failedConnectionAttempts === 1) reconnectionInterval = RECONNECT_INTERVAL.SMALL;
else if (this.failedConnectionAttempts === 2) reconnectionInterval = RECONNECT_INTERVAL.MEDIUM;
else reconnectionInterval = RECONNECT_INTERVAL.LARGE;
				this.tryReconnect(false, false, SECOND_MS * randomIntFromInterval(reconnectionInterval[0], reconnectionInterval[1]));
			}
		}
	}
	async initEntityEvents(connectMode) {
		this.entityUpdateMessageQueue.pause();
		this.eventQueue.pause();
		const existingConnection = connectMode == ConnectMode.Reconnect && this.lastEntityEventIds.size > 0;
		const p = existingConnection ? this.loadMissedEntityEvents(this.eventQueue) : this.initOnNewConnection();
		return p.then(() => {
			this.entityUpdateMessageQueue.resume();
			this.eventQueue.resume();
		}).catch(ofClass(ConnectionError, (e) => {
			console.log("ws not connected in connect(), close websocket", e);
			this.close(CloseEventBusOption.Reconnect);
		})).catch(ofClass(CancelledError, () => {
			console.log("ws cancelled retry process entity events after reconnect");
		})).catch(ofClass(ServiceUnavailableError, async (e) => {
			if (!existingConnection) this.lastEntityEventIds.clear();
			console.log("ws retry init entity events in ", RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS, e);
			let promise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
				if (this.serviceUnavailableRetry === promise) {
					console.log("ws retry initializing entity events");
					return this.initEntityEvents(connectMode);
				} else console.log("ws cancel initializing entity events");
			});
			this.serviceUnavailableRetry = promise;
			return promise;
		})).catch(ofClass(OutOfSyncError, async (e) => {
			await this.cache.purgeStorage();
			throw e;
		})).catch((e) => {
			this.entityUpdateMessageQueue.resume();
			this.eventQueue.resume();
			this.listener.onError(e);
		});
	}
	async initOnNewConnection() {
		const { lastIds, someIdsWereCached } = await this.retrieveLastEntityEventIds();
		this.lastEntityEventIds = lastIds;
		if (someIdsWereCached) await this.loadMissedEntityEvents(this.eventQueue);
else await this.cache.recordSyncTime();
	}
	/**
	* Gets the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	* This is needed to know from where to start loading missed events when we connect.
	*/
	async retrieveLastEntityEventIds() {
		const lastIds = new Map();
		let someIdsWereCached = false;
		for (const groupId of this.eventGroups()) {
			const cachedBatchId = await this.cache.getLastEntityEventBatchForGroup(groupId);
			if (cachedBatchId != null) {
				lastIds.set(groupId, [cachedBatchId]);
				someIdsWereCached = true;
			} else {
				const batches = await this.entity.loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 1, true);
				const batchId = batches.length === 1 ? getElementId(batches[0]) : GENERATED_MIN_ID;
				lastIds.set(groupId, [batchId]);
				await this.cache.setLastEntityEventBatchForGroup(groupId, batchId);
			}
		}
		return {
			lastIds,
			someIdsWereCached
		};
	}
	/** Load event batches since the last time we were connected to bring cache and other things up-to-date.
	* @param eventQueue is passed in for testing
	* @VisibleForTesting
	* */
	async loadMissedEntityEvents(eventQueue) {
		if (!this.userFacade.isFullyLoggedIn()) return;
		await this.checkOutOfSync();
		let eventBatches = [];
		for (let groupId of this.eventGroups()) {
			const eventBatchForGroup = await this.loadEntityEventsForGroup(groupId);
			eventBatches = eventBatches.concat(eventBatchForGroup);
		}
		const timeSortedEventBatches = eventBatches.sort((a, b) => compareOldestFirst(getElementId(a), getElementId(b)));
		let totalExpectedBatches = 0;
		for (const batch of timeSortedEventBatches) {
			const filteredEntityUpdates = await this.removeUnknownTypes(batch.events);
			const batchWasAddedToQueue = this.addBatch(getElementId(batch), getListId(batch), filteredEntityUpdates, eventQueue);
			if (batchWasAddedToQueue) totalExpectedBatches++;
		}
		const progressMonitor = new ProgressMonitorDelegate(this.progressTracker, totalExpectedBatches + 1);
		console.log("ws", `progress monitor expects ${totalExpectedBatches} events`);
		await progressMonitor.workDone(1);
		eventQueue.setProgressMonitor(progressMonitor);
		await this.cache.recordSyncTime();
	}
	async loadEntityEventsForGroup(groupId) {
		try {
			return await this.entity.loadAll(EntityEventBatchTypeRef, groupId, this.getLastEventBatchIdOrMinIdForGroup(groupId));
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				console.log("ws could not download entity updates, lost permission");
				return [];
			} else throw e;
		}
	}
	async checkOutOfSync() {
		if (await this.cache.isOutOfSync()) throw new OutOfSyncError("some missed EntityEventBatches cannot be loaded any more");
	}
	async eventQueueCallback(modification) {
		try {
			await this.processEventBatch(modification);
		} catch (e) {
			console.log("ws error while processing event batches", e);
			this.listener.onError(e);
			throw e;
		}
	}
	async entityUpdateMessageQueueCallback(batch) {
		this.addBatch(batch.batchId, batch.groupId, batch.events, this.eventQueue);
		this.eventQueue.resume();
	}
	unsubscribeFromOldWebsocket() {
		if (this.socket) this.socket.onopen = this.socket.onclose = this.socket.onerror = this.socket.onmessage = identity;
	}
	async terminate() {
		this.state = EventBusState.Terminated;
		this.reset();
		this.listener.onWebsocketStateChanged(WsConnectionState.terminated);
	}
	/**
	* Tries to reconnect the websocket if it is not connected.
	*/
	reconnect(closeIfOpen, enableAutomaticState) {
		console.log("ws reconnect socket.readyState: (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3): " + (this.socket ? this.socket.readyState : "null"), "state:", this.state, "closeIfOpen:", closeIfOpen, "enableAutomaticState:", enableAutomaticState);
		if (this.state !== EventBusState.Terminated && enableAutomaticState) this.state = EventBusState.Automatic;
		if (closeIfOpen && this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.immediateReconnect = true;
			this.socket.close();
		} else if ((this.socket == null || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) && this.state !== EventBusState.Terminated && this.userFacade.isFullyLoggedIn()) {
			if (this.connectTimer) clearTimeout(this.connectTimer);
			this.connectTimer = setTimeout(() => this.connect(ConnectMode.Reconnect), 100);
		}
	}
	addBatch(batchId, groupId, events, eventQueue) {
		const lastForGroup = this.lastEntityEventIds.get(groupId) || [];
		const index = binarySearch(lastForGroup, batchId, compareOldestFirst);
		let wasAdded;
		if (index < 0) {
			lastForGroup.splice(-index, 0, batchId);
			wasAdded = eventQueue.add(batchId, groupId, events);
		} else wasAdded = false;
		if (lastForGroup.length > MAX_EVENT_IDS_QUEUE_LENGTH) lastForGroup.shift();
		this.lastEntityEventIds.set(batchId, lastForGroup);
		if (wasAdded) this.lastAddedBatchForGroup.set(groupId, batchId);
		return wasAdded;
	}
	async processEventBatch(batch) {
		try {
			if (this.isTerminated()) return;
			const filteredEvents = await this.cache.entityEventsReceived(batch);
			if (!this.isTerminated()) await this.listener.onEntityEventsReceived(filteredEvents, batch.batchId, batch.groupId);
		} catch (e) {
			if (e instanceof ServiceUnavailableError) {
				console.log("ws retry processing event in 30s", e);
				const retryPromise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
					if (this.serviceUnavailableRetry === retryPromise) return this.processEventBatch(batch);
else throw new CancelledError("stop retry processing after service unavailable due to reconnect");
				});
				this.serviceUnavailableRetry = retryPromise;
				return retryPromise;
			} else {
				console.log("EVENT", "error", e);
				throw e;
			}
		}
	}
	getLastEventBatchIdOrMinIdForGroup(groupId) {
		const lastIds = this.lastEntityEventIds.get(groupId);
		return lastIds && lastIds.length > 0 ? lastThrow(lastIds) : GENERATED_MIN_ID;
	}
	isTerminated() {
		return this.state === EventBusState.Terminated;
	}
	eventGroups() {
		return this.userFacade.getLoggedInUser().memberships.filter((membership) => membership.groupType !== GroupType.MailingList).map((membership) => membership.group).concat(this.userFacade.getLoggedInUser().userGroup.group);
	}
};

//#endregion
//#region libs/cborg.js
const typeofs = [
	"string",
	"number",
	"bigint",
	"symbol"
];
const objectTypeNames = [
	"Function",
	"Generator",
	"AsyncGenerator",
	"GeneratorFunction",
	"AsyncGeneratorFunction",
	"AsyncFunction",
	"Observable",
	"Array",
	"Buffer",
	"Object",
	"RegExp",
	"Date",
	"Error",
	"Map",
	"Set",
	"WeakMap",
	"WeakSet",
	"ArrayBuffer",
	"SharedArrayBuffer",
	"DataView",
	"Promise",
	"URL",
	"HTMLElement",
	"Int8Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Int16Array",
	"Uint16Array",
	"Int32Array",
	"Uint32Array",
	"Float32Array",
	"Float64Array",
	"BigInt64Array",
	"BigUint64Array"
];
/**
* @param {any} value
* @returns {string}
*/
function is(value) {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (value === true || value === false) return "boolean";
	const typeOf = typeof value;
	if (typeofs.includes(typeOf)) return typeOf;
	if (typeOf === "function") return "Function";
	if (Array.isArray(value)) return "Array";
	if (isBuffer$1(value)) return "Buffer";
	const objectType = getObjectType(value);
	if (objectType) return objectType;
	return "Object";
}
/**
* @param {any} value
* @returns {boolean}
*/
function isBuffer$1(value) {
	return value && value.constructor && value.constructor.isBuffer && value.constructor.isBuffer.call(null, value);
}
/**
* @param {any} value
* @returns {string|undefined}
*/
function getObjectType(value) {
	const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
	if (objectTypeNames.includes(objectTypeName)) return objectTypeName;
	return undefined;
}
var Type$1 = class {
	/**
	* @param {number} major
	* @param {string} name
	* @param {boolean} terminal
	*/
	constructor(major, name, terminal) {
		this.major = major;
		this.majorEncoded = major << 5;
		this.name = name;
		this.terminal = terminal;
	}
	toString() {
		return `Type[${this.major}].${this.name}`;
	}
	/**
	* @param {Type} typ
	* @returns {number}
	*/
	compare(typ) {
		return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0;
	}
};
Type$1.uint = new Type$1(0, "uint", true);
Type$1.negint = new Type$1(1, "negint", true);
Type$1.bytes = new Type$1(2, "bytes", true);
Type$1.string = new Type$1(3, "string", true);
Type$1.array = new Type$1(4, "array", false);
Type$1.map = new Type$1(5, "map", false);
Type$1.tag = new Type$1(6, "tag", false);
Type$1.float = new Type$1(7, "float", true);
Type$1.false = new Type$1(7, "false", true);
Type$1.true = new Type$1(7, "true", true);
Type$1.null = new Type$1(7, "null", true);
Type$1.undefined = new Type$1(7, "undefined", true);
Type$1.break = new Type$1(7, "break", true);
var Token = class {
	/**
	* @param {Type} type
	* @param {any} [value]
	* @param {number} [encodedLength]
	*/
	constructor(type, value, encodedLength) {
		this.type = type;
		this.value = value;
		this.encodedLength = encodedLength;
		/** @type {Uint8Array|undefined} */
		this.encodedBytes = undefined;
		/** @type {Uint8Array|undefined} */
		this.byteValue = undefined;
	}
	toString() {
		return `Token[${this.type}].${this.value}`;
	}
};
const useBuffer = globalThis.process && !globalThis.process.browser && globalThis.Buffer && typeof globalThis.Buffer.isBuffer === "function";
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();
/**
* @param {Uint8Array} buf
* @returns {boolean}
*/
function isBuffer(buf$1) {
	return useBuffer && globalThis.Buffer.isBuffer(buf$1);
}
/**
* @param {Uint8Array|number[]} buf
* @returns {Uint8Array}
*/
function asU8A(buf$1) {
	if (!(buf$1 instanceof Uint8Array)) return Uint8Array.from(buf$1);
	return isBuffer(buf$1) ? new Uint8Array(buf$1.buffer, buf$1.byteOffset, buf$1.byteLength) : buf$1;
}
const toString = useBuffer ? (bytes, start, end) => {
	return end - start > 64 ? globalThis.Buffer.from(bytes.subarray(start, end)).toString("utf8") : utf8Slice(bytes, start, end);
} : (bytes, start, end) => {
	return end - start > 64 ? textDecoder.decode(bytes.subarray(start, end)) : utf8Slice(bytes, start, end);
};
const fromString = useBuffer ? (string) => {
	return string.length > 64 ? globalThis.Buffer.from(string) : utf8ToBytes(string);
} : (string) => {
	return string.length > 64 ? textEncoder.encode(string) : utf8ToBytes(string);
};
/**
* Buffer variant not fast enough for what we need
* @param {number[]} arr
* @returns {Uint8Array}
*/
const fromArray = (arr) => {
	return Uint8Array.from(arr);
};
const slice = useBuffer ? (bytes, start, end) => {
	if (isBuffer(bytes)) return new Uint8Array(bytes.subarray(start, end));
	return bytes.slice(start, end);
} : (bytes, start, end) => {
	return bytes.slice(start, end);
};
const concat = useBuffer ? (chunks, length) => {
	chunks = chunks.map((c) => c instanceof Uint8Array ? c : globalThis.Buffer.from(c));
	return asU8A(globalThis.Buffer.concat(chunks, length));
} : (chunks, length) => {
	const out = new Uint8Array(length);
	let off = 0;
	for (let b of chunks) {
		if (off + b.length > out.length) b = b.subarray(0, out.length - off);
		out.set(b, off);
		off += b.length;
	}
	return out;
};
const alloc = useBuffer ? (size) => {
	return globalThis.Buffer.allocUnsafe(size);
} : (size) => {
	return new Uint8Array(size);
};
/**
* @param {Uint8Array} b1
* @param {Uint8Array} b2
* @returns {number}
*/
function compare(b1, b2) {
	if (isBuffer(b1) && isBuffer(b2)) return b1.compare(b2);
	for (let i = 0; i < b1.length; i++) {
		if (b1[i] === b2[i]) continue;
		return b1[i] < b2[i] ? -1 : 1;
	}
	return 0;
}
/**
* @param {string} str
* @returns {number[]}
*/
function utf8ToBytes(str) {
	const out = [];
	let p = 0;
	for (let i = 0; i < str.length; i++) {
		let c = str.charCodeAt(i);
		if (c < 128) out[p++] = c;
else if (c < 2048) {
			out[p++] = c >> 6 | 192;
			out[p++] = c & 63 | 128;
		} else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
			c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
			out[p++] = c >> 18 | 240;
			out[p++] = c >> 12 & 63 | 128;
			out[p++] = c >> 6 & 63 | 128;
			out[p++] = c & 63 | 128;
		} else {
			out[p++] = c >> 12 | 224;
			out[p++] = c >> 6 & 63 | 128;
			out[p++] = c & 63 | 128;
		}
	}
	return out;
}
/**
* @param {Uint8Array} buf
* @param {number} offset
* @param {number} end
* @returns {string}
*/
function utf8Slice(buf$1, offset, end) {
	const res = [];
	while (offset < end) {
		const firstByte = buf$1[offset];
		let codePoint = null;
		let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
		if (offset + bytesPerSequence <= end) {
			let secondByte, thirdByte, fourthByte, tempCodePoint;
			switch (bytesPerSequence) {
				case 1:
					if (firstByte < 128) codePoint = firstByte;
					break;
				case 2:
					secondByte = buf$1[offset + 1];
					if ((secondByte & 192) === 128) {
						tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
						if (tempCodePoint > 127) codePoint = tempCodePoint;
					}
					break;
				case 3:
					secondByte = buf$1[offset + 1];
					thirdByte = buf$1[offset + 2];
					if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
						tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
						if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) codePoint = tempCodePoint;
					}
					break;
				case 4:
					secondByte = buf$1[offset + 1];
					thirdByte = buf$1[offset + 2];
					fourthByte = buf$1[offset + 3];
					if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
						tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
						if (tempCodePoint > 65535 && tempCodePoint < 1114112) codePoint = tempCodePoint;
					}
			}
		}
		if (codePoint === null) {
			codePoint = 65533;
			bytesPerSequence = 1;
		} else if (codePoint > 65535) {
			codePoint -= 65536;
			res.push(codePoint >>> 10 & 1023 | 55296);
			codePoint = 56320 | codePoint & 1023;
		}
		res.push(codePoint);
		offset += bytesPerSequence;
	}
	return decodeCodePointsArray(res);
}
const MAX_ARGUMENTS_LENGTH = 4096;
/**
* @param {number[]} codePoints
* @returns {string}
*/
function decodeCodePointsArray(codePoints) {
	const len = codePoints.length;
	if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
	let res = "";
	let i = 0;
	while (i < len) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
	return res;
}
/**
* Bl is a list of byte chunks, similar to https://github.com/rvagg/bl but for
* writing rather than reading.
* A Bl object accepts set() operations for individual bytes and copyTo() for
* inserting byte arrays. These write operations don't automatically increment
* the internal cursor so its "length" won't be changed. Instead, increment()
* must be called to extend its length to cover the inserted data.
* The toBytes() call will convert all internal memory to a single Uint8Array of
* the correct length, truncating any data that is stored but hasn't been
* included by an increment().
* get() can retrieve a single byte.
* All operations (except toBytes()) take an "offset" argument that will perform
* the write at the offset _from the current cursor_. For most operations this
* will be `0` to write at the current cursor position but it can be ahead of
* the current cursor. Negative offsets probably work but are untested.
*/
const defaultChunkSize = 256;
var Bl = class {
	/**
	* @param {number} [chunkSize]
	*/
	constructor(chunkSize = defaultChunkSize) {
		this.chunkSize = chunkSize;
		/** @type {number} */
		this.cursor = 0;
		/** @type {number} */
		this.maxCursor = -1;
		/** @type {(Uint8Array|number[])[]} */
		this.chunks = [];
		/** @type {Uint8Array|number[]|null} */
		this._initReuseChunk = null;
	}
	reset() {
		this.cursor = 0;
		this.maxCursor = -1;
		if (this.chunks.length) this.chunks = [];
		if (this._initReuseChunk !== null) {
			this.chunks.push(this._initReuseChunk);
			this.maxCursor = this._initReuseChunk.length - 1;
		}
	}
	/**
	* @param {Uint8Array|number[]} bytes
	*/
	push(bytes) {
		let topChunk = this.chunks[this.chunks.length - 1];
		const newMax = this.cursor + bytes.length;
		if (newMax <= this.maxCursor + 1) {
			const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
			topChunk.set(bytes, chunkPos);
		} else {
			if (topChunk) {
				const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
				if (chunkPos < topChunk.length) {
					this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
					this.maxCursor = this.cursor - 1;
				}
			}
			if (bytes.length < 64 && bytes.length < this.chunkSize) {
				topChunk = alloc(this.chunkSize);
				this.chunks.push(topChunk);
				this.maxCursor += topChunk.length;
				if (this._initReuseChunk === null) this._initReuseChunk = topChunk;
				topChunk.set(bytes, 0);
			} else {
				this.chunks.push(bytes);
				this.maxCursor += bytes.length;
			}
		}
		this.cursor += bytes.length;
	}
	/**
	* @param {boolean} [reset]
	* @returns {Uint8Array}
	*/
	toBytes(reset = false) {
		let byts;
		if (this.chunks.length === 1) {
			const chunk = this.chunks[0];
			if (reset && this.cursor > chunk.length / 2) {
				byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
				this._initReuseChunk = null;
				this.chunks = [];
			} else byts = slice(chunk, 0, this.cursor);
		} else byts = concat(this.chunks, this.cursor);
		if (reset) this.reset();
		return byts;
	}
};
const decodeErrPrefix = "CBOR decode error:";
const encodeErrPrefix = "CBOR encode error:";
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} need
*/
function assertEnoughData(data, pos, need) {
	if (data.length - pos < need) throw new Error(`${decodeErrPrefix} not enough data for type`);
}
const uintBoundaries = [
	24,
	256,
	65536,
	4294967296,
	BigInt("18446744073709551616")
];
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} data
* @param {number} offset
* @param {DecodeOptions} options
* @returns {number}
*/
function readUint8(data, offset, options) {
	assertEnoughData(data, offset, 1);
	const value = data[offset];
	if (options.strict === true && value < uintBoundaries[0]) throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
	return value;
}
/**
* @param {Uint8Array} data
* @param {number} offset
* @param {DecodeOptions} options
* @returns {number}
*/
function readUint16(data, offset, options) {
	assertEnoughData(data, offset, 2);
	const value = data[offset] << 8 | data[offset + 1];
	if (options.strict === true && value < uintBoundaries[1]) throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
	return value;
}
/**
* @param {Uint8Array} data
* @param {number} offset
* @param {DecodeOptions} options
* @returns {number}
*/
function readUint32(data, offset, options) {
	assertEnoughData(data, offset, 4);
	const value = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
	if (options.strict === true && value < uintBoundaries[2]) throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
	return value;
}
/**
* @param {Uint8Array} data
* @param {number} offset
* @param {DecodeOptions} options
* @returns {number|bigint}
*/
function readUint64(data, offset, options) {
	assertEnoughData(data, offset, 8);
	const hi = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
	const lo = data[offset + 4] * 16777216 + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
	const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
	if (options.strict === true && value < uintBoundaries[3]) throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
	if (value <= Number.MAX_SAFE_INTEGER) return Number(value);
	if (options.allowBigInt === true) return value;
	throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeUint8(data, pos, _minor, options) {
	return new Token(Type$1.uint, readUint8(data, pos + 1, options), 2);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeUint16(data, pos, _minor, options) {
	return new Token(Type$1.uint, readUint16(data, pos + 1, options), 3);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeUint32(data, pos, _minor, options) {
	return new Token(Type$1.uint, readUint32(data, pos + 1, options), 5);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeUint64(data, pos, _minor, options) {
	return new Token(Type$1.uint, readUint64(data, pos + 1, options), 9);
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeUint(buf$1, token) {
	return encodeUintValue(buf$1, 0, token.value);
}
/**
* @param {Bl} buf
* @param {number} major
* @param {number|bigint} uint
*/
function encodeUintValue(buf$1, major, uint) {
	if (uint < uintBoundaries[0]) {
		const nuint = Number(uint);
		buf$1.push([major | nuint]);
	} else if (uint < uintBoundaries[1]) {
		const nuint = Number(uint);
		buf$1.push([major | 24, nuint]);
	} else if (uint < uintBoundaries[2]) {
		const nuint = Number(uint);
		buf$1.push([
			major | 25,
			nuint >>> 8,
			nuint & 255
		]);
	} else if (uint < uintBoundaries[3]) {
		const nuint = Number(uint);
		buf$1.push([
			major | 26,
			nuint >>> 24 & 255,
			nuint >>> 16 & 255,
			nuint >>> 8 & 255,
			nuint & 255
		]);
	} else {
		const buint = BigInt(uint);
		if (buint < uintBoundaries[4]) {
			const set = [
				major | 27,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			let lo = Number(buint & BigInt(4294967295));
			let hi = Number(buint >> BigInt(32) & BigInt(4294967295));
			set[8] = lo & 255;
			lo = lo >> 8;
			set[7] = lo & 255;
			lo = lo >> 8;
			set[6] = lo & 255;
			lo = lo >> 8;
			set[5] = lo & 255;
			set[4] = hi & 255;
			hi = hi >> 8;
			set[3] = hi & 255;
			hi = hi >> 8;
			set[2] = hi & 255;
			hi = hi >> 8;
			set[1] = hi & 255;
			buf$1.push(set);
		} else throw new Error(`${decodeErrPrefix} encountered BigInt larger than allowable range`);
	}
}
/**
* @param {Token} token
* @returns {number}
*/
encodeUint.encodedSize = function encodedSize(token) {
	return encodeUintValue.encodedSize(token.value);
};
/**
* @param {number} uint
* @returns {number}
*/
encodeUintValue.encodedSize = function encodedSize(uint) {
	if (uint < uintBoundaries[0]) return 1;
	if (uint < uintBoundaries[1]) return 2;
	if (uint < uintBoundaries[2]) return 3;
	if (uint < uintBoundaries[3]) return 5;
	return 9;
};
/**
* @param {Token} tok1
* @param {Token} tok2
* @returns {number}
*/
encodeUint.compareTokens = function compareTokens(tok1, tok2) {
	return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : 0;
};
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeNegint8(data, pos, _minor, options) {
	return new Token(Type$1.negint, -1 - readUint8(data, pos + 1, options), 2);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeNegint16(data, pos, _minor, options) {
	return new Token(Type$1.negint, -1 - readUint16(data, pos + 1, options), 3);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeNegint32(data, pos, _minor, options) {
	return new Token(Type$1.negint, -1 - readUint32(data, pos + 1, options), 5);
}
const neg1b = BigInt(-1);
const pos1b = BigInt(1);
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeNegint64(data, pos, _minor, options) {
	const int = readUint64(data, pos + 1, options);
	if (typeof int !== "bigint") {
		const value = -1 - int;
		if (value >= Number.MIN_SAFE_INTEGER) return new Token(Type$1.negint, value, 9);
	}
	if (options.allowBigInt !== true) throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`);
	return new Token(Type$1.negint, neg1b - BigInt(int), 9);
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeNegint(buf$1, token) {
	const negint = token.value;
	const unsigned = typeof negint === "bigint" ? negint * neg1b - pos1b : negint * -1 - 1;
	encodeUintValue(buf$1, token.type.majorEncoded, unsigned);
}
/**
* @param {Token} token
* @returns {number}
*/
encodeNegint.encodedSize = function encodedSize(token) {
	const negint = token.value;
	const unsigned = typeof negint === "bigint" ? negint * neg1b - pos1b : negint * -1 - 1;
	if (unsigned < uintBoundaries[0]) return 1;
	if (unsigned < uintBoundaries[1]) return 2;
	if (unsigned < uintBoundaries[2]) return 3;
	if (unsigned < uintBoundaries[3]) return 5;
	return 9;
};
/**
* @param {Token} tok1
* @param {Token} tok2
* @returns {number}
*/
encodeNegint.compareTokens = function compareTokens(tok1, tok2) {
	return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : 0;
};
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} prefix
* @param {number} length
* @returns {Token}
*/
function toToken$3(data, pos, prefix, length) {
	assertEnoughData(data, pos, prefix + length);
	const buf$1 = slice(data, pos + prefix, pos + prefix + length);
	return new Token(Type$1.bytes, buf$1, prefix + length);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} minor
* @param {DecodeOptions} _options
* @returns {Token}
*/
function decodeBytesCompact(data, pos, minor, _options) {
	return toToken$3(data, pos, 1, minor);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeBytes8(data, pos, _minor, options) {
	return toToken$3(data, pos, 2, readUint8(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeBytes16(data, pos, _minor, options) {
	return toToken$3(data, pos, 3, readUint16(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeBytes32(data, pos, _minor, options) {
	return toToken$3(data, pos, 5, readUint32(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeBytes64(data, pos, _minor, options) {
	const l = readUint64(data, pos + 1, options);
	if (typeof l === "bigint") throw new Error(`${decodeErrPrefix} 64-bit integer bytes lengths not supported`);
	return toToken$3(data, pos, 9, l);
}
/**
* `encodedBytes` allows for caching when we do a byte version of a string
* for key sorting purposes
* @param {Token} token
* @returns {Uint8Array}
*/
function tokenBytes(token) {
	if (token.encodedBytes === undefined) token.encodedBytes = token.type === Type$1.string ? fromString(token.value) : token.value;
	return token.encodedBytes;
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeBytes(buf$1, token) {
	const bytes = tokenBytes(token);
	encodeUintValue(buf$1, token.type.majorEncoded, bytes.length);
	buf$1.push(bytes);
}
/**
* @param {Token} token
* @returns {number}
*/
encodeBytes.encodedSize = function encodedSize(token) {
	const bytes = tokenBytes(token);
	return encodeUintValue.encodedSize(bytes.length) + bytes.length;
};
/**
* @param {Token} tok1
* @param {Token} tok2
* @returns {number}
*/
encodeBytes.compareTokens = function compareTokens(tok1, tok2) {
	return compareBytes(tokenBytes(tok1), tokenBytes(tok2));
};
/**
* @param {Uint8Array} b1
* @param {Uint8Array} b2
* @returns {number}
*/
function compareBytes(b1, b2) {
	return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2);
}
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} prefix
* @param {number} length
* @param {DecodeOptions} options
* @returns {Token}
*/
function toToken$2(data, pos, prefix, length, options) {
	const totLength = prefix + length;
	assertEnoughData(data, pos, totLength);
	const tok = new Token(Type$1.string, toString(data, pos + prefix, pos + totLength), totLength);
	if (options.retainStringBytes === true) tok.byteValue = slice(data, pos + prefix, pos + totLength);
	return tok;
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeStringCompact(data, pos, minor, options) {
	return toToken$2(data, pos, 1, minor, options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeString8(data, pos, _minor, options) {
	return toToken$2(data, pos, 2, readUint8(data, pos + 1, options), options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeString16(data, pos, _minor, options) {
	return toToken$2(data, pos, 3, readUint16(data, pos + 1, options), options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeString32(data, pos, _minor, options) {
	return toToken$2(data, pos, 5, readUint32(data, pos + 1, options), options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeString64(data, pos, _minor, options) {
	const l = readUint64(data, pos + 1, options);
	if (typeof l === "bigint") throw new Error(`${decodeErrPrefix} 64-bit integer string lengths not supported`);
	return toToken$2(data, pos, 9, l, options);
}
const encodeString = encodeBytes;
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} _data
* @param {number} _pos
* @param {number} prefix
* @param {number} length
* @returns {Token}
*/
function toToken$1(_data, _pos, prefix, length) {
	return new Token(Type$1.array, length, prefix);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} minor
* @param {DecodeOptions} _options
* @returns {Token}
*/
function decodeArrayCompact(data, pos, minor, _options) {
	return toToken$1(data, pos, 1, minor);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeArray8(data, pos, _minor, options) {
	return toToken$1(data, pos, 2, readUint8(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeArray16(data, pos, _minor, options) {
	return toToken$1(data, pos, 3, readUint16(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeArray32(data, pos, _minor, options) {
	return toToken$1(data, pos, 5, readUint32(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeArray64(data, pos, _minor, options) {
	const l = readUint64(data, pos + 1, options);
	if (typeof l === "bigint") throw new Error(`${decodeErrPrefix} 64-bit integer array lengths not supported`);
	return toToken$1(data, pos, 9, l);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeArrayIndefinite(data, pos, _minor, options) {
	if (options.allowIndefinite === false) throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
	return toToken$1(data, pos, 1, Infinity);
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeArray(buf$1, token) {
	encodeUintValue(buf$1, Type$1.array.majorEncoded, token.value);
}
encodeArray.compareTokens = encodeUint.compareTokens;
/**
* @param {Token} token
* @returns {number}
*/
encodeArray.encodedSize = function encodedSize(token) {
	return encodeUintValue.encodedSize(token.value);
};
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} _data
* @param {number} _pos
* @param {number} prefix
* @param {number} length
* @returns {Token}
*/
function toToken(_data, _pos, prefix, length) {
	return new Token(Type$1.map, length, prefix);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} minor
* @param {DecodeOptions} _options
* @returns {Token}
*/
function decodeMapCompact(data, pos, minor, _options) {
	return toToken(data, pos, 1, minor);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeMap8(data, pos, _minor, options) {
	return toToken(data, pos, 2, readUint8(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeMap16(data, pos, _minor, options) {
	return toToken(data, pos, 3, readUint16(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeMap32(data, pos, _minor, options) {
	return toToken(data, pos, 5, readUint32(data, pos + 1, options));
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeMap64(data, pos, _minor, options) {
	const l = readUint64(data, pos + 1, options);
	if (typeof l === "bigint") throw new Error(`${decodeErrPrefix} 64-bit integer map lengths not supported`);
	return toToken(data, pos, 9, l);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeMapIndefinite(data, pos, _minor, options) {
	if (options.allowIndefinite === false) throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
	return toToken(data, pos, 1, Infinity);
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeMap(buf$1, token) {
	encodeUintValue(buf$1, Type$1.map.majorEncoded, token.value);
}
encodeMap.compareTokens = encodeUint.compareTokens;
/**
* @param {Token} token
* @returns {number}
*/
encodeMap.encodedSize = function encodedSize(token) {
	return encodeUintValue.encodedSize(token.value);
};
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} _data
* @param {number} _pos
* @param {number} minor
* @param {DecodeOptions} _options
* @returns {Token}
*/
function decodeTagCompact(_data, _pos, minor, _options) {
	return new Token(Type$1.tag, minor, 1);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeTag8(data, pos, _minor, options) {
	return new Token(Type$1.tag, readUint8(data, pos + 1, options), 2);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeTag16(data, pos, _minor, options) {
	return new Token(Type$1.tag, readUint16(data, pos + 1, options), 3);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeTag32(data, pos, _minor, options) {
	return new Token(Type$1.tag, readUint32(data, pos + 1, options), 5);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeTag64(data, pos, _minor, options) {
	return new Token(Type$1.tag, readUint64(data, pos + 1, options), 9);
}
/**
* @param {Bl} buf
* @param {Token} token
*/
function encodeTag(buf$1, token) {
	encodeUintValue(buf$1, Type$1.tag.majorEncoded, token.value);
}
encodeTag.compareTokens = encodeUint.compareTokens;
/**
* @param {Token} token
* @returns {number}
*/
encodeTag.encodedSize = function encodedSize(token) {
	return encodeUintValue.encodedSize(token.value);
};
/**
* @typedef {import('./bl.js').Bl} Bl
* @typedef {import('../interface').DecodeOptions} DecodeOptions
* @typedef {import('../interface').EncodeOptions} EncodeOptions
*/
const MINOR_FALSE = 20;
const MINOR_TRUE = 21;
const MINOR_NULL = 22;
const MINOR_UNDEFINED = 23;
/**
* @param {Uint8Array} _data
* @param {number} _pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeUndefined(_data, _pos, _minor, options) {
	if (options.allowUndefined === false) throw new Error(`${decodeErrPrefix} undefined values are not supported`);
else if (options.coerceUndefinedToNull === true) return new Token(Type$1.null, null, 1);
	return new Token(Type$1.undefined, undefined, 1);
}
/**
* @param {Uint8Array} _data
* @param {number} _pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeBreak(_data, _pos, _minor, options) {
	if (options.allowIndefinite === false) throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
	return new Token(Type$1.break, undefined, 1);
}
/**
* @param {number} value
* @param {number} bytes
* @param {DecodeOptions} options
* @returns {Token}
*/
function createToken(value, bytes, options) {
	if (options) {
		if (options.allowNaN === false && Number.isNaN(value)) throw new Error(`${decodeErrPrefix} NaN values are not supported`);
		if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) throw new Error(`${decodeErrPrefix} Infinity values are not supported`);
	}
	return new Token(Type$1.float, value, bytes);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeFloat16(data, pos, _minor, options) {
	return createToken(readFloat16(data, pos + 1), 3, options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeFloat32(data, pos, _minor, options) {
	return createToken(readFloat32(data, pos + 1), 5, options);
}
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} _minor
* @param {DecodeOptions} options
* @returns {Token}
*/
function decodeFloat64(data, pos, _minor, options) {
	return createToken(readFloat64(data, pos + 1), 9, options);
}
/**
* @param {Bl} buf
* @param {Token} token
* @param {EncodeOptions} options
*/
function encodeFloat(buf$1, token, options) {
	const float = token.value;
	if (float === false) buf$1.push([Type$1.float.majorEncoded | MINOR_FALSE]);
else if (float === true) buf$1.push([Type$1.float.majorEncoded | MINOR_TRUE]);
else if (float === null) buf$1.push([Type$1.float.majorEncoded | MINOR_NULL]);
else if (float === undefined) buf$1.push([Type$1.float.majorEncoded | MINOR_UNDEFINED]);
else {
		let decoded;
		let success = false;
		if (!options || options.float64 !== true) {
			encodeFloat16(float);
			decoded = readFloat16(ui8a, 1);
			if (float === decoded || Number.isNaN(float)) {
				ui8a[0] = 249;
				buf$1.push(ui8a.slice(0, 3));
				success = true;
			} else {
				encodeFloat32(float);
				decoded = readFloat32(ui8a, 1);
				if (float === decoded) {
					ui8a[0] = 250;
					buf$1.push(ui8a.slice(0, 5));
					success = true;
				}
			}
		}
		if (!success) {
			encodeFloat64(float);
			decoded = readFloat64(ui8a, 1);
			ui8a[0] = 251;
			buf$1.push(ui8a.slice(0, 9));
		}
	}
}
/**
* @param {Token} token
* @param {EncodeOptions} options
* @returns {number}
*/
encodeFloat.encodedSize = function encodedSize(token, options) {
	const float = token.value;
	if (float === false || float === true || float === null || float === undefined) return 1;
	if (!options || options.float64 !== true) {
		encodeFloat16(float);
		let decoded = readFloat16(ui8a, 1);
		if (float === decoded || Number.isNaN(float)) return 3;
		encodeFloat32(float);
		decoded = readFloat32(ui8a, 1);
		if (float === decoded) return 5;
	}
	return 9;
};
const buffer = new ArrayBuffer(9);
const dataView = new DataView(buffer, 1);
const ui8a = new Uint8Array(buffer, 0);
/**
* @param {number} inp
*/
function encodeFloat16(inp) {
	if (inp === Infinity) dataView.setUint16(0, 31744, false);
else if (inp === -Infinity) dataView.setUint16(0, 64512, false);
else if (Number.isNaN(inp)) dataView.setUint16(0, 32256, false);
else {
		dataView.setFloat32(0, inp);
		const valu32 = dataView.getUint32(0);
		const exponent = (valu32 & 2139095040) >> 23;
		const mantissa = valu32 & 8388607;
		if (exponent === 255) dataView.setUint16(0, 31744, false);
else if (exponent === 0) dataView.setUint16(0, (inp & 2147483648) >> 16 | mantissa >> 13, false);
else {
			const logicalExponent = exponent - 127;
			if (logicalExponent < -24) dataView.setUint16(0, 0);
else if (logicalExponent < -14) dataView.setUint16(0, (valu32 & 2147483648) >> 16 | 1 << 24 + logicalExponent, false);
else dataView.setUint16(0, (valu32 & 2147483648) >> 16 | logicalExponent + 15 << 10 | mantissa >> 13, false);
		}
	}
}
/**
* @param {Uint8Array} ui8a
* @param {number} pos
* @returns {number}
*/
function readFloat16(ui8a$1, pos) {
	if (ui8a$1.length - pos < 2) throw new Error(`${decodeErrPrefix} not enough data for float16`);
	const half = (ui8a$1[pos] << 8) + ui8a$1[pos + 1];
	if (half === 31744) return Infinity;
	if (half === 64512) return -Infinity;
	if (half === 32256) return NaN;
	const exp = half >> 10 & 31;
	const mant = half & 1023;
	let val;
	if (exp === 0) val = mant * 5.960464477539063e-8;
else if (exp !== 31) val = (mant + 1024) * 2 ** (exp - 25);
else val = mant === 0 ? Infinity : NaN;
	return half & 32768 ? -val : val;
}
/**
* @param {number} inp
*/
function encodeFloat32(inp) {
	dataView.setFloat32(0, inp, false);
}
/**
* @param {Uint8Array} ui8a
* @param {number} pos
* @returns {number}
*/
function readFloat32(ui8a$1, pos) {
	if (ui8a$1.length - pos < 4) throw new Error(`${decodeErrPrefix} not enough data for float32`);
	const offset = (ui8a$1.byteOffset || 0) + pos;
	return new DataView(ui8a$1.buffer, offset, 4).getFloat32(0, false);
}
/**
* @param {number} inp
*/
function encodeFloat64(inp) {
	dataView.setFloat64(0, inp, false);
}
/**
* @param {Uint8Array} ui8a
* @param {number} pos
* @returns {number}
*/
function readFloat64(ui8a$1, pos) {
	if (ui8a$1.length - pos < 8) throw new Error(`${decodeErrPrefix} not enough data for float64`);
	const offset = (ui8a$1.byteOffset || 0) + pos;
	return new DataView(ui8a$1.buffer, offset, 8).getFloat64(0, false);
}
/**
* @param {Token} _tok1
* @param {Token} _tok2
* @returns {number}
*/
encodeFloat.compareTokens = encodeUint.compareTokens;
/**
* @typedef {import('../interface').DecodeOptions} DecodeOptions
*/
/**
* @param {Uint8Array} data
* @param {number} pos
* @param {number} minor
*/
function invalidMinor(data, pos, minor) {
	throw new Error(`${decodeErrPrefix} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`);
}
/**
* @param {string} msg
* @returns {()=>any}
*/
function errorer(msg) {
	return () => {
		throw new Error(`${decodeErrPrefix} ${msg}`);
	};
}
/** @type {((data:Uint8Array, pos:number, minor:number, options?:DecodeOptions) => any)[]} */
const jump = [];
for (let i = 0; i <= 23; i++) jump[i] = invalidMinor;
jump[24] = decodeUint8;
jump[25] = decodeUint16;
jump[26] = decodeUint32;
jump[27] = decodeUint64;
jump[28] = invalidMinor;
jump[29] = invalidMinor;
jump[30] = invalidMinor;
jump[31] = invalidMinor;
for (let i = 32; i <= 55; i++) jump[i] = invalidMinor;
jump[56] = decodeNegint8;
jump[57] = decodeNegint16;
jump[58] = decodeNegint32;
jump[59] = decodeNegint64;
jump[60] = invalidMinor;
jump[61] = invalidMinor;
jump[62] = invalidMinor;
jump[63] = invalidMinor;
for (let i = 64; i <= 87; i++) jump[i] = decodeBytesCompact;
jump[88] = decodeBytes8;
jump[89] = decodeBytes16;
jump[90] = decodeBytes32;
jump[91] = decodeBytes64;
jump[92] = invalidMinor;
jump[93] = invalidMinor;
jump[94] = invalidMinor;
jump[95] = errorer("indefinite length bytes/strings are not supported");
for (let i = 96; i <= 119; i++) jump[i] = decodeStringCompact;
jump[120] = decodeString8;
jump[121] = decodeString16;
jump[122] = decodeString32;
jump[123] = decodeString64;
jump[124] = invalidMinor;
jump[125] = invalidMinor;
jump[126] = invalidMinor;
jump[127] = errorer("indefinite length bytes/strings are not supported");
for (let i = 128; i <= 151; i++) jump[i] = decodeArrayCompact;
jump[152] = decodeArray8;
jump[153] = decodeArray16;
jump[154] = decodeArray32;
jump[155] = decodeArray64;
jump[156] = invalidMinor;
jump[157] = invalidMinor;
jump[158] = invalidMinor;
jump[159] = decodeArrayIndefinite;
for (let i = 160; i <= 183; i++) jump[i] = decodeMapCompact;
jump[184] = decodeMap8;
jump[185] = decodeMap16;
jump[186] = decodeMap32;
jump[187] = decodeMap64;
jump[188] = invalidMinor;
jump[189] = invalidMinor;
jump[190] = invalidMinor;
jump[191] = decodeMapIndefinite;
for (let i = 192; i <= 215; i++) jump[i] = decodeTagCompact;
jump[216] = decodeTag8;
jump[217] = decodeTag16;
jump[218] = decodeTag32;
jump[219] = decodeTag64;
jump[220] = invalidMinor;
jump[221] = invalidMinor;
jump[222] = invalidMinor;
jump[223] = invalidMinor;
for (let i = 224; i <= 243; i++) jump[i] = errorer("simple values are not supported");
jump[244] = invalidMinor;
jump[245] = invalidMinor;
jump[246] = invalidMinor;
jump[247] = decodeUndefined;
jump[248] = errorer("simple values are not supported");
jump[249] = decodeFloat16;
jump[250] = decodeFloat32;
jump[251] = decodeFloat64;
jump[252] = invalidMinor;
jump[253] = invalidMinor;
jump[254] = invalidMinor;
jump[255] = decodeBreak;
/** @type {Token[]} */
const quick = [];
for (let i = 0; i < 24; i++) quick[i] = new Token(Type$1.uint, i, 1);
for (let i = -1; i >= -24; i--) quick[31 - i] = new Token(Type$1.negint, i, 1);
quick[64] = new Token(Type$1.bytes, new Uint8Array(0), 1);
quick[96] = new Token(Type$1.string, "", 1);
quick[128] = new Token(Type$1.array, 0, 1);
quick[160] = new Token(Type$1.map, 0, 1);
quick[244] = new Token(Type$1.false, false, 1);
quick[245] = new Token(Type$1.true, true, 1);
quick[246] = new Token(Type$1.null, null, 1);
/**
* @param {Token} token
* @returns {Uint8Array|undefined}
*/
function quickEncodeToken(token) {
	switch (token.type) {
		case Type$1.false: return fromArray([244]);
		case Type$1.true: return fromArray([245]);
		case Type$1.null: return fromArray([246]);
		case Type$1.bytes:
			if (!token.value.length) return fromArray([64]);
			return;
		case Type$1.string:
			if (token.value === "") return fromArray([96]);
			return;
		case Type$1.array:
			if (token.value === 0) return fromArray([128]);
			return;
		case Type$1.map:
			if (token.value === 0) return fromArray([160]);
			return;
		case Type$1.uint:
			if (token.value < 24) return fromArray([Number(token.value)]);
			return;
		case Type$1.negint: if (token.value >= -24) return fromArray([31 - Number(token.value)]);
	}
}
/**
* @typedef {import('../interface').EncodeOptions} EncodeOptions
* @typedef {import('../interface').OptionalTypeEncoder} OptionalTypeEncoder
* @typedef {import('../interface').Reference} Reference
* @typedef {import('../interface').StrictTypeEncoder} StrictTypeEncoder
* @typedef {import('../interface').TokenTypeEncoder} TokenTypeEncoder
* @typedef {import('../interface').TokenOrNestedTokens} TokenOrNestedTokens
*/
/** @type {EncodeOptions} */
const defaultEncodeOptions = {
	float64: false,
	mapSorter,
	quickEncodeToken
};
/** @returns {TokenTypeEncoder[]} */
function makeCborEncoders() {
	const encoders = [];
	encoders[Type$1.uint.major] = encodeUint;
	encoders[Type$1.negint.major] = encodeNegint;
	encoders[Type$1.bytes.major] = encodeBytes;
	encoders[Type$1.string.major] = encodeString;
	encoders[Type$1.array.major] = encodeArray;
	encoders[Type$1.map.major] = encodeMap;
	encoders[Type$1.tag.major] = encodeTag;
	encoders[Type$1.float.major] = encodeFloat;
	return encoders;
}
const cborEncoders = makeCborEncoders();
const buf = new Bl();
var Ref = class Ref {
	/**
	* @param {object|any[]} obj
	* @param {Reference|undefined} parent
	*/
	constructor(obj, parent) {
		this.obj = obj;
		this.parent = parent;
	}
	/**
	* @param {object|any[]} obj
	* @returns {boolean}
	*/
	includes(obj) {
		/** @type {Reference|undefined} */
		let p = this;
		do 
			if (p.obj === obj) return true;
		while (p = p.parent);
		return false;
	}
	/**
	* @param {Reference|undefined} stack
	* @param {object|any[]} obj
	* @returns {Reference}
	*/
	static createCheck(stack, obj) {
		if (stack && stack.includes(obj)) throw new Error(`${encodeErrPrefix} object contains circular references`);
		return new Ref(obj, stack);
	}
};
const simpleTokens = {
	null: new Token(Type$1.null, null),
	undefined: new Token(Type$1.undefined, undefined),
	true: new Token(Type$1.true, true),
	false: new Token(Type$1.false, false),
	emptyArray: new Token(Type$1.array, 0),
	emptyMap: new Token(Type$1.map, 0)
};
/** @type {{[typeName: string]: StrictTypeEncoder}} */
const typeEncoders = {
	number(obj, _typ, _options, _refStack) {
		if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) return new Token(Type$1.float, obj);
else if (obj >= 0) return new Token(Type$1.uint, obj);
else return new Token(Type$1.negint, obj);
	},
	bigint(obj, _typ, _options, _refStack) {
		if (obj >= BigInt(0)) return new Token(Type$1.uint, obj);
else return new Token(Type$1.negint, obj);
	},
	Uint8Array(obj, _typ, _options, _refStack) {
		return new Token(Type$1.bytes, obj);
	},
	string(obj, _typ, _options, _refStack) {
		return new Token(Type$1.string, obj);
	},
	boolean(obj, _typ, _options, _refStack) {
		return obj ? simpleTokens.true : simpleTokens.false;
	},
	null(_obj, _typ, _options, _refStack) {
		return simpleTokens.null;
	},
	undefined(_obj, _typ, _options, _refStack) {
		return simpleTokens.undefined;
	},
	ArrayBuffer(obj, _typ, _options, _refStack) {
		return new Token(Type$1.bytes, new Uint8Array(obj));
	},
	DataView(obj, _typ, _options, _refStack) {
		return new Token(Type$1.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength));
	},
	Array(obj, _typ, options, refStack) {
		if (!obj.length) {
			if (options.addBreakTokens === true) return [simpleTokens.emptyArray, new Token(Type$1.break)];
			return simpleTokens.emptyArray;
		}
		refStack = Ref.createCheck(refStack, obj);
		const entries = [];
		let i = 0;
		for (const e of obj) entries[i++] = objectToTokens(e, options, refStack);
		if (options.addBreakTokens) return [
			new Token(Type$1.array, obj.length),
			entries,
			new Token(Type$1.break)
		];
		return [new Token(Type$1.array, obj.length), entries];
	},
	Object(obj, typ, options, refStack) {
		const isMap = typ !== "Object";
		const keys = isMap ? obj.keys() : Object.keys(obj);
		const length = isMap ? obj.size : keys.length;
		if (!length) {
			if (options.addBreakTokens === true) return [simpleTokens.emptyMap, new Token(Type$1.break)];
			return simpleTokens.emptyMap;
		}
		refStack = Ref.createCheck(refStack, obj);
		/** @type {TokenOrNestedTokens[]} */
		const entries = [];
		let i = 0;
		for (const key of keys) entries[i++] = [objectToTokens(key, options, refStack), objectToTokens(isMap ? obj.get(key) : obj[key], options, refStack)];
		sortMapEntries(entries, options);
		if (options.addBreakTokens) return [
			new Token(Type$1.map, length),
			entries,
			new Token(Type$1.break)
		];
		return [new Token(Type$1.map, length), entries];
	}
};
typeEncoders.Map = typeEncoders.Object;
typeEncoders.Buffer = typeEncoders.Uint8Array;
for (const typ of "Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64".split(" ")) typeEncoders[`${typ}Array`] = typeEncoders.DataView;
/**
* @param {any} obj
* @param {EncodeOptions} [options]
* @param {Reference} [refStack]
* @returns {TokenOrNestedTokens}
*/
function objectToTokens(obj, options = {}, refStack) {
	const typ = is(obj);
	const customTypeEncoder = options && options.typeEncoders && options.typeEncoders[typ] || typeEncoders[typ];
	if (typeof customTypeEncoder === "function") {
		const tokens = customTypeEncoder(obj, typ, options, refStack);
		if (tokens != null) return tokens;
	}
	const typeEncoder = typeEncoders[typ];
	if (!typeEncoder) throw new Error(`${encodeErrPrefix} unsupported type: ${typ}`);
	return typeEncoder(obj, typ, options, refStack);
}
/**
* @param {TokenOrNestedTokens[]} entries
* @param {EncodeOptions} options
*/
function sortMapEntries(entries, options) {
	if (options.mapSorter) entries.sort(options.mapSorter);
}
/**
* @param {(Token|Token[])[]} e1
* @param {(Token|Token[])[]} e2
* @returns {number}
*/
function mapSorter(e1, e2) {
	const keyToken1 = Array.isArray(e1[0]) ? e1[0][0] : e1[0];
	const keyToken2 = Array.isArray(e2[0]) ? e2[0][0] : e2[0];
	if (keyToken1.type !== keyToken2.type) return keyToken1.type.compare(keyToken2.type);
	const major = keyToken1.type.major;
	const tcmp = cborEncoders[major].compareTokens(keyToken1, keyToken2);
	if (tcmp === 0) console.warn("WARNING: complex key types used, CBOR key sorting guarantees are gone");
	return tcmp;
}
/**
* @param {Bl} buf
* @param {TokenOrNestedTokens} tokens
* @param {TokenTypeEncoder[]} encoders
* @param {EncodeOptions} options
*/
function tokensToEncoded(buf$1, tokens, encoders, options) {
	if (Array.isArray(tokens)) for (const token of tokens) tokensToEncoded(buf$1, token, encoders, options);
else encoders[tokens.type.major](buf$1, tokens, options);
}
/**
* @param {any} data
* @param {TokenTypeEncoder[]} encoders
* @param {EncodeOptions} options
* @returns {Uint8Array}
*/
function encodeCustom(data, encoders, options) {
	const tokens = objectToTokens(data, options);
	if (!Array.isArray(tokens) && options.quickEncodeToken) {
		const quickBytes = options.quickEncodeToken(tokens);
		if (quickBytes) return quickBytes;
		const encoder = encoders[tokens.type.major];
		if (encoder.encodedSize) {
			const size = encoder.encodedSize(tokens, options);
			const buf$1 = new Bl(size);
			encoder(buf$1, tokens, options);
			if (buf$1.chunks.length !== 1) throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`);
			return asU8A(buf$1.chunks[0]);
		}
	}
	buf.reset();
	tokensToEncoded(buf, tokens, encoders, options);
	return buf.toBytes(true);
}
/**
* @param {any} data
* @param {EncodeOptions} [options]
* @returns {Uint8Array}
*/
function encode(data, options) {
	options = Object.assign({}, defaultEncodeOptions, options);
	return encodeCustom(data, cborEncoders, options);
}
/**
* @typedef {import('./token.js').Token} Token
* @typedef {import('../interface').DecodeOptions} DecodeOptions
* @typedef {import('../interface').DecodeTokenizer} DecodeTokenizer
*/
const defaultDecodeOptions = {
	strict: false,
	allowIndefinite: true,
	allowUndefined: true,
	allowBigInt: true
};
var Tokeniser = class {
	/**
	* @param {Uint8Array} data
	* @param {DecodeOptions} options
	*/
	constructor(data, options = {}) {
		this._pos = 0;
		this.data = data;
		this.options = options;
	}
	pos() {
		return this._pos;
	}
	done() {
		return this._pos >= this.data.length;
	}
	next() {
		const byt = this.data[this._pos];
		let token = quick[byt];
		if (token === undefined) {
			const decoder = jump[byt];
			if (!decoder) throw new Error(`${decodeErrPrefix} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, "0")})`);
			const minor = byt & 31;
			token = decoder(this.data, this._pos, minor, this.options);
		}
		this._pos += token.encodedLength;
		return token;
	}
};
const DONE = Symbol.for("DONE");
const BREAK = Symbol.for("BREAK");
/**
* @param {Token} token
* @param {DecodeTokenizer} tokeniser
* @param {DecodeOptions} options
* @returns {any|BREAK|DONE}
*/
function tokenToArray(token, tokeniser, options) {
	const arr = [];
	for (let i = 0; i < token.value; i++) {
		const value = tokensToObject(tokeniser, options);
		if (value === BREAK) {
			if (token.value === Infinity) break;
			throw new Error(`${decodeErrPrefix} got unexpected break to lengthed array`);
		}
		if (value === DONE) throw new Error(`${decodeErrPrefix} found array but not enough entries (got ${i}, expected ${token.value})`);
		arr[i] = value;
	}
	return arr;
}
/**
* @param {Token} token
* @param {DecodeTokenizer} tokeniser
* @param {DecodeOptions} options
* @returns {any|BREAK|DONE}
*/
function tokenToMap(token, tokeniser, options) {
	const useMaps = options.useMaps === true;
	const obj = useMaps ? undefined : {};
	const m = useMaps ? new Map() : undefined;
	for (let i = 0; i < token.value; i++) {
		const key = tokensToObject(tokeniser, options);
		if (key === BREAK) {
			if (token.value === Infinity) break;
			throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`);
		}
		if (key === DONE) throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`);
		if (useMaps !== true && typeof key !== "string") throw new Error(`${decodeErrPrefix} non-string keys not supported (got ${typeof key})`);
		if (options.rejectDuplicateMapKeys === true) {
			if (useMaps && m.has(key) || !useMaps && key in obj) throw new Error(`${decodeErrPrefix} found repeat map key "${key}"`);
		}
		const value = tokensToObject(tokeniser, options);
		if (value === DONE) throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`);
		if (useMaps) m.set(key, value);
else obj[key] = value;
	}
	return useMaps ? m : obj;
}
/**
* @param {DecodeTokenizer} tokeniser
* @param {DecodeOptions} options
* @returns {any|BREAK|DONE}
*/
function tokensToObject(tokeniser, options) {
	if (tokeniser.done()) return DONE;
	const token = tokeniser.next();
	if (token.type === Type$1.break) return BREAK;
	if (token.type.terminal) return token.value;
	if (token.type === Type$1.array) return tokenToArray(token, tokeniser, options);
	if (token.type === Type$1.map) return tokenToMap(token, tokeniser, options);
	if (token.type === Type$1.tag) {
		if (options.tags && typeof options.tags[token.value] === "function") {
			const tagged = tokensToObject(tokeniser, options);
			return options.tags[token.value](tagged);
		}
		throw new Error(`${decodeErrPrefix} tag not supported (${token.value})`);
	}
	throw new Error("unsupported");
}
/**
* @param {Uint8Array} data
* @param {DecodeOptions} [options]
* @returns {[any, Uint8Array]}
*/
function decodeFirst(data, options) {
	if (!(data instanceof Uint8Array)) throw new Error(`${decodeErrPrefix} data to decode must be a Uint8Array`);
	options = Object.assign({}, defaultDecodeOptions, options);
	const tokeniser = options.tokenizer || new Tokeniser(data, options);
	const decoded = tokensToObject(tokeniser, options);
	if (decoded === DONE) throw new Error(`${decodeErrPrefix} did not find any content to decode`);
	if (decoded === BREAK) throw new Error(`${decodeErrPrefix} got unexpected break`);
	return [decoded, data.subarray(tokeniser.pos())];
}
/**
* @param {Uint8Array} data
* @param {DecodeOptions} [options]
* @returns {any}
*/
function decode(data, options) {
	const [decoded, remainder] = decodeFirst(data, options);
	if (remainder.length > 0) throw new Error(`${decodeErrPrefix} too many terminals, data makes no sense`);
	return decoded;
}

//#endregion
//#region src/common/api/worker/rest/CustomCacheHandler.ts
var CustomCacheHandlerMap = class {
	handlers;
	constructor(...args) {
		const handlers = new Map();
		for (const { ref, handler } of args) {
			const key = getTypeId(ref);
			handlers.set(key, handler);
		}
		this.handlers = freezeMap(handlers);
	}
	get(typeRef) {
		const typeId = getTypeId(typeRef);
		return this.handlers.get(typeId);
	}
};
var CustomCalendarEventCacheHandler = class {
	constructor(entityRestClient) {
		this.entityRestClient = entityRestClient;
	}
	async loadRange(storage, listId, start, count, reverse) {
		const range = await storage.getRangeForList(CalendarEventTypeRef, listId);
		let rawList = [];
		if (range == null) {
			let chunk = [];
			let currentMin = CUSTOM_MIN_ID;
			while (true) {
				chunk = await this.entityRestClient.loadRange(CalendarEventTypeRef, listId, currentMin, LOAD_MULTIPLE_LIMIT, false);
				rawList.push(...chunk);
				if (chunk.length < LOAD_MULTIPLE_LIMIT) break;
				currentMin = getElementId(chunk[chunk.length - 1]);
			}
			for (const event of rawList) await storage.put(event);
			await storage.setNewRangeForList(CalendarEventTypeRef, listId, CUSTOM_MIN_ID, CUSTOM_MAX_ID);
		} else {
			this.assertCorrectRange(range);
			rawList = await storage.getWholeList(CalendarEventTypeRef, listId);
			console.log(`CalendarEvent list ${listId} has ${rawList.length} events`);
		}
		const typeModel = await resolveTypeReference(CalendarEventTypeRef);
		const sortedList = reverse ? rawList.filter((calendarEvent) => firstBiggerThanSecond(start, getElementId(calendarEvent), typeModel)).sort((a, b) => firstBiggerThanSecond(getElementId(b), getElementId(a), typeModel) ? 1 : -1) : rawList.filter((calendarEvent) => firstBiggerThanSecond(getElementId(calendarEvent), start, typeModel)).sort((a, b) => firstBiggerThanSecond(getElementId(a), getElementId(b), typeModel) ? 1 : -1);
		return sortedList.slice(0, count);
	}
	assertCorrectRange(range) {
		if (range.lower !== CUSTOM_MIN_ID || range.upper !== CUSTOM_MAX_ID) throw new ProgrammingError(`Invalid range for CalendarEvent: ${JSON.stringify(range)}`);
	}
	async getElementIdsInCacheRange(storage, listId, ids) {
		const range = await storage.getRangeForList(CalendarEventTypeRef, listId);
		if (range) {
			this.assertCorrectRange(range);
			return ids;
		} else return [];
	}
};
var CustomMailEventCacheHandler = class {
	async shouldLoadOnCreateEvent() {
		return true;
	}
};

//#endregion
//#region src/common/api/worker/offline/SqlValue.ts
let SqlType = function(SqlType$1) {
	SqlType$1["Null"] = "SqlNull";
	SqlType$1["Number"] = "SqlNum";
	SqlType$1["String"] = "SqlStr";
	SqlType$1["Bytes"] = "SqlBytes";
	return SqlType$1;
}({});
function tagSqlValue(param) {
	if (typeof param === "string") return {
		type: SqlType.String,
		value: param
	};
else if (typeof param === "number") return {
		type: SqlType.Number,
		value: param
	};
else if (param == null) return {
		type: SqlType.Null,
		value: null
	};
else return {
		type: SqlType.Bytes,
		value: param
	};
}
function untagSqlObject(tagged) {
	return mapObject((p) => p.value, tagged);
}

//#endregion
//#region src/common/api/worker/offline/Sql.ts
function sql(queryParts, ...paramInstances) {
	let query = "";
	let params = [];
	let i;
	for (i = 0; i < paramInstances.length; i++) {
		query += queryParts[i];
		const param = paramInstances[i];
		if (param instanceof SqlFragment) {
			query += param.text;
			params.push(...param.params.map(tagSqlValue));
		} else {
			query += "?";
			params.push(tagSqlValue(param));
		}
	}
	query += queryParts[i];
	return {
		query,
		params
	};
}
var SqlFragment = class {
	constructor(text, params) {
		this.text = text;
		this.params = params;
	}
};

//#endregion
//#region src/common/api/worker/offline/OfflineStorage.ts
/**
* this is the value of SQLITE_MAX_VARIABLE_NUMBER in sqlite3.c
* it may change if the sqlite version is updated.
* */
const MAX_SAFE_SQL_VARS = 32766;
function dateEncoder(data, typ, options) {
	const time = data.getTime();
	return [new Token(Type$1.tag, 100), new Token(time < 0 ? Type$1.negint : Type$1.uint, time)];
}
function dateDecoder(bytes) {
	return new Date(bytes);
}
const customTypeEncoders = Object.freeze({ Date: dateEncoder });
const customTypeDecoders = (() => {
	const tags = [];
	tags[100] = dateDecoder;
	return tags;
})();
const TableDefinitions = Object.freeze({
	list_entities: "type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
	element_entities: "type TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, elementId)",
	ranges: "type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId)",
	lastUpdateBatchIdPerGroupId: "groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId)",
	metadata: "key TEXT NOT NULL, value BLOB, PRIMARY KEY (key)",
	blob_element_entities: "type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)"
});
var OfflineStorage = class {
	customCacheHandler = null;
	userId = null;
	timeRangeDays = null;
	constructor(sqlCipherFacade, interWindowEventSender, dateProvider, migrator, cleaner) {
		this.sqlCipherFacade = sqlCipherFacade;
		this.interWindowEventSender = interWindowEventSender;
		this.dateProvider = dateProvider;
		this.migrator = migrator;
		this.cleaner = cleaner;
		assert(isOfflineStorageAvailable() || isTest(), "Offline storage is not available.");
	}
	/**
	* @return {boolean} whether the database was newly created or not
	*/
	async init({ userId, databaseKey, timeRangeDays, forceNewDatabase }) {
		this.userId = userId;
		this.timeRangeDays = timeRangeDays;
		if (forceNewDatabase) {
			if (isDesktop()) await this.interWindowEventSender.localUserDataInvalidated(userId);
			await this.sqlCipherFacade.deleteDb(userId);
		}
		await this.sqlCipherFacade.openDb(userId, databaseKey);
		await this.createTables();
		try {
			await this.migrator.migrate(this, this.sqlCipherFacade);
		} catch (e) {
			if (e instanceof OutOfSyncError) {
				console.warn("Offline db is out of sync!", e);
				await this.recreateDbFile(userId, databaseKey);
				await this.migrator.migrate(this, this.sqlCipherFacade);
			} else throw e;
		}
		return (await this.getLastUpdateTime()).type === "never";
	}
	async recreateDbFile(userId, databaseKey) {
		console.log(`recreating DB file for userId ${userId}`);
		await this.sqlCipherFacade.closeDb();
		await this.sqlCipherFacade.deleteDb(userId);
		await this.sqlCipherFacade.openDb(userId, databaseKey);
		await this.createTables();
	}
	/**
	* currently, we close DBs from the native side (mainly on things like reload and on android's onDestroy)
	*/
	async deinit() {
		this.userId = null;
		await this.sqlCipherFacade.closeDb();
	}
	async deleteIfExists(typeRef, listId, elementId) {
		const type = getTypeId(typeRef);
		let typeModel;
		typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		let formattedQuery;
		switch (typeModel.type) {
			case Type.Element:
				formattedQuery = sql`DELETE
									 FROM element_entities
									 WHERE type = ${type}
									   AND elementId = ${elementId}`;
				break;
			case Type.ListElement:
				formattedQuery = sql`DELETE
									 FROM list_entities
									 WHERE type = ${type}
									   AND listId = ${listId}
									   AND elementId = ${elementId}`;
				break;
			case Type.BlobElement:
				formattedQuery = sql`DELETE
									 FROM blob_element_entities
									 WHERE type = ${type}
									   AND listId = ${listId}
									   AND elementId = ${elementId}`;
				break;
			default: throw new Error("must be a persistent type");
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params);
	}
	async deleteAllOfType(typeRef) {
		const type = getTypeId(typeRef);
		let typeModel;
		typeModel = await resolveTypeReference(typeRef);
		let formattedQuery;
		switch (typeModel.type) {
			case Type.Element:
				formattedQuery = sql`DELETE
									 FROM element_entities
									 WHERE type = ${type}`;
				break;
			case Type.ListElement:
				formattedQuery = sql`DELETE
									 FROM list_entities
									 WHERE type = ${type}`;
				await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params);
				await this.deleteAllRangesForType(type);
				return;
			case Type.BlobElement:
				formattedQuery = sql`DELETE
									 FROM blob_element_entities
									 WHERE type = ${type}`;
				break;
			default: throw new Error("must be a persistent type");
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params);
	}
	async deleteAllRangesForType(type) {
		const { query, params } = sql`DELETE
									  FROM ranges
									  WHERE type = ${type}`;
		await this.sqlCipherFacade.run(query, params);
	}
	async get(typeRef, listId, elementId) {
		const type = getTypeId(typeRef);
		const typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		let formattedQuery;
		switch (typeModel.type) {
			case Type.Element:
				formattedQuery = sql`SELECT entity
									 from element_entities
									 WHERE type = ${type}
									   AND elementId = ${elementId}`;
				break;
			case Type.ListElement:
				formattedQuery = sql`SELECT entity
									 from list_entities
									 WHERE type = ${type}
									   AND listId = ${listId}
									   AND elementId = ${elementId}`;
				break;
			case Type.BlobElement:
				formattedQuery = sql`SELECT entity
									 from blob_element_entities
									 WHERE type = ${type}
									   AND listId = ${listId}
									   AND elementId = ${elementId}`;
				break;
			default: throw new Error("must be a persistent type");
		}
		const result = await this.sqlCipherFacade.get(formattedQuery.query, formattedQuery.params);
		return result?.entity ? await this.deserialize(typeRef, result.entity.value) : null;
	}
	async provideMultiple(typeRef, listId, elementIds) {
		if (elementIds.length === 0) return [];
		const typeModel = await resolveTypeReference(typeRef);
		elementIds = elementIds.map((el) => ensureBase64Ext(typeModel, el));
		const type = getTypeId(typeRef);
		const serializedList = await this.allChunked(MAX_SAFE_SQL_VARS - 2, elementIds, (c) => sql`SELECT entity
					   FROM list_entities
					   WHERE type = ${type}
						 AND listId = ${listId}
						 AND elementId IN ${paramList(c)}`);
		return await this.deserializeList(typeRef, serializedList.map((r) => r.entity.value));
	}
	async getIdsInRange(typeRef, listId) {
		const type = getTypeId(typeRef);
		const typeModel = await resolveTypeReference(typeRef);
		const range = await this.getRange(typeRef, listId);
		if (range == null) throw new Error(`no range exists for ${type} and list ${listId}`);
		const { query, params } = sql`SELECT elementId
									  FROM list_entities
									  WHERE type = ${type}
										AND listId = ${listId}
										AND (elementId = ${range.lower}
										  OR ${firstIdBigger("elementId", range.lower)})
										AND NOT (${firstIdBigger("elementId", range.upper)})`;
		const rows = await this.sqlCipherFacade.all(query, params);
		return rows.map((row) => customIdToBase64Url(typeModel, row.elementId.value));
	}
	/** don't use this internally in this class, use OfflineStorage::getRange instead. OfflineStorage is
	* using converted custom IDs internally which is undone when using this to access the range.
	*/
	async getRangeForList(typeRef, listId) {
		let range = await this.getRange(typeRef, listId);
		if (range == null) return range;
		const typeModel = await resolveTypeReference(typeRef);
		return {
			lower: customIdToBase64Url(typeModel, range.lower),
			upper: customIdToBase64Url(typeModel, range.upper)
		};
	}
	async isElementIdInCacheRange(typeRef, listId, elementId) {
		const typeModel = await resolveTypeReference(typeRef);
		elementId = ensureBase64Ext(typeModel, elementId);
		const range = await this.getRange(typeRef, listId);
		return range != null && !firstBiggerThanSecond(elementId, range.upper) && !firstBiggerThanSecond(range.lower, elementId);
	}
	async provideFromRange(typeRef, listId, start, count, reverse) {
		const typeModel = await resolveTypeReference(typeRef);
		start = ensureBase64Ext(typeModel, start);
		const type = getTypeId(typeRef);
		let formattedQuery;
		if (reverse) formattedQuery = sql`SELECT entity
								 FROM list_entities
								 WHERE type = ${type}
								   AND listId = ${listId}
								   AND ${firstIdBigger(start, "elementId")}
								 ORDER BY LENGTH(elementId) DESC, elementId DESC LIMIT ${count}`;
else formattedQuery = sql`SELECT entity
								 FROM list_entities
								 WHERE type = ${type}
								   AND listId = ${listId}
								   AND ${firstIdBigger("elementId", start)}
								 ORDER BY LENGTH(elementId) ASC, elementId ASC LIMIT ${count}`;
		const { query, params } = formattedQuery;
		const serializedList = await this.sqlCipherFacade.all(query, params);
		return await this.deserializeList(typeRef, serializedList.map((r) => r.entity.value));
	}
	async put(originalEntity) {
		const serializedEntity = this.serialize(originalEntity);
		let { listId, elementId } = expandId(originalEntity._id);
		const type = getTypeId(originalEntity._type);
		const ownerGroup = originalEntity._ownerGroup;
		const typeModel = await resolveTypeReference(originalEntity._type);
		elementId = ensureBase64Ext(typeModel, elementId);
		let formattedQuery;
		switch (typeModel.type) {
			case Type.Element:
				formattedQuery = sql`INSERT
				OR REPLACE INTO element_entities (type, elementId, ownerGroup, entity) VALUES (
				${type},
				${elementId},
				${ownerGroup},
				${serializedEntity}
				)`;
				break;
			case Type.ListElement:
				formattedQuery = sql`INSERT
				OR REPLACE INTO list_entities (type, listId, elementId, ownerGroup, entity) VALUES (
				${type},
				${listId},
				${elementId},
				${ownerGroup},
				${serializedEntity}
				)`;
				break;
			case Type.BlobElement:
				formattedQuery = sql`INSERT
				OR REPLACE INTO blob_element_entities (type, listId, elementId, ownerGroup, entity) VALUES (
				${type},
				${listId},
				${elementId},
				${ownerGroup},
				${serializedEntity}
				)`;
				break;
			default: throw new Error("must be a persistent type");
		}
		await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params);
	}
	async setLowerRangeForList(typeRef, listId, lowerId) {
		lowerId = ensureBase64Ext(await resolveTypeReference(typeRef), lowerId);
		const type = getTypeId(typeRef);
		const { query, params } = sql`UPDATE ranges
									  SET lower = ${lowerId}
									  WHERE type = ${type}
										AND listId = ${listId}`;
		await this.sqlCipherFacade.run(query, params);
	}
	async setUpperRangeForList(typeRef, listId, upperId) {
		upperId = ensureBase64Ext(await resolveTypeReference(typeRef), upperId);
		const type = getTypeId(typeRef);
		const { query, params } = sql`UPDATE ranges
									  SET upper = ${upperId}
									  WHERE type = ${type}
										AND listId = ${listId}`;
		await this.sqlCipherFacade.run(query, params);
	}
	async setNewRangeForList(typeRef, listId, lower, upper) {
		const typeModel = await resolveTypeReference(typeRef);
		lower = ensureBase64Ext(typeModel, lower);
		upper = ensureBase64Ext(typeModel, upper);
		const type = getTypeId(typeRef);
		const { query, params } = sql`INSERT
		OR REPLACE INTO ranges VALUES (
		${type},
		${listId},
		${lower},
		${upper}
		)`;
		return this.sqlCipherFacade.run(query, params);
	}
	async getLastBatchIdForGroup(groupId) {
		const { query, params } = sql`SELECT batchId
									  from lastUpdateBatchIdPerGroupId
									  WHERE groupId = ${groupId}`;
		const row = await this.sqlCipherFacade.get(query, params);
		return row?.batchId?.value ?? null;
	}
	async putLastBatchIdForGroup(groupId, batchId) {
		const { query, params } = sql`INSERT
		OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (
		${groupId},
		${batchId}
		)`;
		await this.sqlCipherFacade.run(query, params);
	}
	async getLastUpdateTime() {
		const time = await this.getMetadata("lastUpdateTime");
		return time ? {
			type: "recorded",
			time
		} : { type: "never" };
	}
	async putLastUpdateTime(ms) {
		await this.putMetadata("lastUpdateTime", ms);
	}
	async purgeStorage() {
		for (let name of Object.keys(TableDefinitions)) await this.sqlCipherFacade.run(`DELETE
				 FROM ${name}`, []);
	}
	async deleteRange(typeRef, listId) {
		const { query, params } = sql`DELETE
									  FROM ranges
									  WHERE type = ${getTypeId(typeRef)}
										AND listId = ${listId}`;
		await this.sqlCipherFacade.run(query, params);
	}
	async getRawListElementsOfType(typeRef) {
		const { query, params } = sql`SELECT entity
									  from list_entities
									  WHERE type = ${getTypeId(typeRef)}`;
		const items = await this.sqlCipherFacade.all(query, params) ?? [];
		return items.map((item) => this.decodeCborEntity(item.entity.value));
	}
	async getRawElementsOfType(typeRef) {
		const { query, params } = sql`SELECT entity
									  from element_entities
									  WHERE type = ${getTypeId(typeRef)}`;
		const items = await this.sqlCipherFacade.all(query, params) ?? [];
		return items.map((item) => this.decodeCborEntity(item.entity.value));
	}
	async getElementsOfType(typeRef) {
		const { query, params } = sql`SELECT entity
									  from element_entities
									  WHERE type = ${getTypeId(typeRef)}`;
		const items = await this.sqlCipherFacade.all(query, params) ?? [];
		return await this.deserializeList(typeRef, items.map((row) => row.entity.value));
	}
	async getWholeList(typeRef, listId) {
		const { query, params } = sql`SELECT entity
									  FROM list_entities
									  WHERE type = ${getTypeId(typeRef)}
										AND listId = ${listId}`;
		const items = await this.sqlCipherFacade.all(query, params) ?? [];
		return await this.deserializeList(typeRef, items.map((row) => row.entity.value));
	}
	async dumpMetadata() {
		const query = "SELECT * from metadata";
		const stored = (await this.sqlCipherFacade.all(query, [])).map((row) => [row.key.value, row.value.value]);
		return Object.fromEntries(stored.map(([key, value]) => [key, decode(value)]));
	}
	async setStoredModelVersion(model, version) {
		return this.putMetadata(`${model}-version`, version);
	}
	getCustomCacheHandlerMap(entityRestClient) {
		if (this.customCacheHandler == null) this.customCacheHandler = new CustomCacheHandlerMap({
			ref: CalendarEventTypeRef,
			handler: new CustomCalendarEventCacheHandler(entityRestClient)
		}, {
			ref: MailTypeRef,
			handler: new CustomMailEventCacheHandler()
		});
		return this.customCacheHandler;
	}
	getUserId() {
		return assertNotNull(this.userId, "No user id, not initialized?");
	}
	async deleteAllOwnedBy(owner) {
		{
			const { query, params } = sql`DELETE
										  FROM element_entities
										  WHERE ownerGroup = ${owner}`;
			await this.sqlCipherFacade.run(query, params);
		}
		{
			const { query, params } = sql`SELECT listId, type
										  FROM list_entities
										  WHERE ownerGroup = ${owner}`;
			const rangeRows = await this.sqlCipherFacade.all(query, params);
			const rows = rangeRows.map((row) => untagSqlObject(row));
			const listIdsByType = groupByAndMapUniquely(rows, (row) => row.type, (row) => row.listId);
			for (const [type, listIds] of listIdsByType.entries()) {
				const safeChunkSize = MAX_SAFE_SQL_VARS - 1;
				const listIdArr = Array.from(listIds);
				await this.runChunked(safeChunkSize, listIdArr, (c) => sql`DELETE
							   FROM ranges
							   WHERE type = ${type}
								 AND listId IN ${paramList(c)}`);
				await this.runChunked(safeChunkSize, listIdArr, (c) => sql`DELETE
							   FROM list_entities
							   WHERE type = ${type}
								 AND listId IN ${paramList(c)}`);
			}
		}
		{
			const { query, params } = sql`DELETE
										  FROM blob_element_entities
										  WHERE ownerGroup = ${owner}`;
			await this.sqlCipherFacade.run(query, params);
		}
		{
			const { query, params } = sql`DELETE
										  FROM lastUpdateBatchIdPerGroupId
										  WHERE groupId = ${owner}`;
			await this.sqlCipherFacade.run(query, params);
		}
	}
	async deleteWholeList(typeRef, listId) {
		await this.lockRangesDbAccess(listId);
		await this.deleteRange(typeRef, listId);
		const { query, params } = sql`DELETE
									  FROM list_entities
									  WHERE listId = ${listId}`;
		await this.sqlCipherFacade.run(query, params);
		await this.unlockRangesDbAccess(listId);
	}
	async putMetadata(key, value) {
		let encodedValue;
		try {
			encodedValue = encode(value);
		} catch (e) {
			console.log("[OfflineStorage] failed to encode metadata for key", key, "with value", value);
			throw e;
		}
		const { query, params } = sql`INSERT
		OR REPLACE INTO metadata VALUES (
		${key},
		${encodedValue}
		)`;
		await this.sqlCipherFacade.run(query, params);
	}
	async getMetadata(key) {
		const { query, params } = sql`SELECT value
									  from metadata
									  WHERE key = ${key}`;
		const encoded = await this.sqlCipherFacade.get(query, params);
		return encoded && decode(encoded.value.value);
	}
	/**
	* Clear out unneeded data from the offline database (i.e. trash and spam lists, old data).
	* This will be called after login (CachePostLoginActions.ts) to ensure fast login time.
	* @param timeRangeDays: the maximum age of days that mails should be to be kept in the database. if null, will use a default value
	* @param userId id of the current user. default, last stored userId
	*/
	async clearExcludedData(timeRangeDays = this.timeRangeDays, userId = this.getUserId()) {
		await this.cleaner.cleanOfflineDb(this, timeRangeDays, userId, this.dateProvider.now());
	}
	async createTables() {
		for (let [name, definition] of Object.entries(TableDefinitions)) await this.sqlCipherFacade.run(`CREATE TABLE IF NOT EXISTS ${name}
				 (
					 ${definition}
				 )`, []);
	}
	async getRange(typeRef, listId) {
		const type = getTypeId(typeRef);
		const { query, params } = sql`SELECT upper, lower
									  FROM ranges
									  WHERE type = ${type}
										AND listId = ${listId}`;
		const row = await this.sqlCipherFacade.get(query, params) ?? null;
		return mapNullable(row, untagSqlObject);
	}
	async deleteIn(typeRef, listId, elementIds) {
		if (elementIds.length === 0) return;
		const typeModel = await resolveTypeReference(typeRef);
		switch (typeModel.type) {
			case Type.Element: return await this.runChunked(MAX_SAFE_SQL_VARS - 1, elementIds, (c) => sql`DELETE
							   FROM element_entities
							   WHERE type = ${getTypeId(typeRef)}
								 AND elementId IN ${paramList(c)}`);
			case Type.ListElement: return await this.runChunked(MAX_SAFE_SQL_VARS - 2, elementIds, (c) => sql`DELETE
							   FROM list_entities
							   WHERE type = ${getTypeId(typeRef)}
								 AND listId = ${listId}
								 AND elementId IN ${paramList(c)}`);
			case Type.BlobElement: return await this.runChunked(MAX_SAFE_SQL_VARS - 2, elementIds, (c) => sql`DELETE
							   FROM blob_element_entities
							   WHERE type = ${getTypeId(typeRef)}
								 AND listId = ${listId}
								 AND elementId IN ${paramList(c)}`);
			default: throw new Error("must be a persistent type");
		}
	}
	/**
	* We want to lock the access to the "ranges" db when updating / reading the
	* offline available mail list / mailset ranges for each mail list (referenced using the listId).
	* @param listId the mail list or mail set entry list that we want to lock
	*/
	async lockRangesDbAccess(listId) {
		await this.sqlCipherFacade.lockRangesDbAccess(listId);
	}
	/**
	* This is the counterpart to the function "lockRangesDbAccess(listId)".
	* @param listId the mail list that we want to unlock
	*/
	async unlockRangesDbAccess(listId) {
		await this.sqlCipherFacade.unlockRangesDbAccess(listId);
	}
	async updateRangeForListAndDeleteObsoleteData(typeRef, listId, rawCutoffId) {
		const typeModel = await resolveTypeReference(typeRef);
		const isCustomId = isCustomIdType(typeModel);
		const convertedCutoffId = ensureBase64Ext(typeModel, rawCutoffId);
		const range = await this.getRange(typeRef, listId);
		if (range == null) return;
		const expectedMinId = isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID;
		if (range.lower === expectedMinId) {
			const entities = await this.provideFromRange(typeRef, listId, expectedMinId, 1, false);
			const id = mapNullable(entities[0], getElementId);
			const rangeWontBeModified = id == null || firstBiggerThanSecond(id, convertedCutoffId) || id === convertedCutoffId;
			if (rangeWontBeModified) return;
		}
		if (firstBiggerThanSecond(convertedCutoffId, range.lower)) if (firstBiggerThanSecond(convertedCutoffId, range.upper)) await this.deleteRange(typeRef, listId);
else await this.setLowerRangeForList(typeRef, listId, rawCutoffId);
	}
	serialize(originalEntity) {
		try {
			return encode(originalEntity, { typeEncoders: customTypeEncoders });
		} catch (e) {
			console.log("[OfflineStorage] failed to encode entity of type", originalEntity._type, "with id", originalEntity._id);
			throw e;
		}
	}
	/**
	* Convert the type from CBOR representation to the runtime type
	*/
	async deserialize(typeRef, loaded) {
		let deserialized;
		try {
			deserialized = this.decodeCborEntity(loaded);
		} catch (e) {
			console.log(e);
			console.log(`Error with CBOR decode. Trying to decode (of type: ${typeof loaded}): ${loaded}`);
			return null;
		}
		const typeModel = await resolveTypeReference(typeRef);
		return await this.fixupTypeRefs(typeModel, deserialized);
	}
	decodeCborEntity(loaded) {
		return decode(loaded, { tags: customTypeDecoders });
	}
	async fixupTypeRefs(typeModel, deserialized) {
		deserialized._type = new TypeRef(typeModel.app, typeModel.name);
		for (const [associationName, associationModel] of Object.entries(typeModel.associations)) if (associationModel.type === AssociationType.Aggregation) {
			const aggregateTypeRef = new TypeRef(associationModel.dependency ?? typeModel.app, associationModel.refType);
			const aggregateTypeModel = await resolveTypeReference(aggregateTypeRef);
			switch (associationModel.cardinality) {
				case Cardinality.One:
				case Cardinality.ZeroOrOne: {
					const aggregate = deserialized[associationName];
					if (aggregate) await this.fixupTypeRefs(aggregateTypeModel, aggregate);
					break;
				}
				case Cardinality.Any: {
					const aggregateList = deserialized[associationName];
					for (const aggregate of aggregateList) await this.fixupTypeRefs(aggregateTypeModel, aggregate);
					break;
				}
			}
		}
		return deserialized;
	}
	async deserializeList(typeRef, loaded) {
		const result = [];
		for (const entity of loaded) {
			const deserialized = await this.deserialize(typeRef, entity);
			if (deserialized != null) result.push(deserialized);
		}
		return result;
	}
	/**
	* convenience method to run a potentially too large query over several chunks.
	* chunkSize must be chosen such that the total number of SQL variables in the final query does not exceed MAX_SAFE_SQL_VARS
	* */
	async runChunked(chunkSize, originalList, formatter) {
		for (const chunk of splitInChunks(chunkSize, originalList)) {
			const formattedQuery = formatter(chunk);
			await this.sqlCipherFacade.run(formattedQuery.query, formattedQuery.params);
		}
	}
	/**
	* convenience method to execute a potentially too large query over several chunks.
	* chunkSize must be chosen such that the total number of SQL variables in the final query does not exceed MAX_SAFE_SQL_VARS
	* */
	async allChunked(chunkSize, originalList, formatter) {
		const result = [];
		for (const chunk of splitInChunks(chunkSize, originalList)) {
			const formattedQuery = formatter(chunk);
			result.push(...await this.sqlCipherFacade.all(formattedQuery.query, formattedQuery.params));
		}
		return result;
	}
};
function paramList(params) {
	const qs = params.map(() => "?").join(",");
	return new SqlFragment(`(${qs})`, params);
}
/**
* comparison to select ids that are bigger or smaller than a parameter id
* must be used within sql`<query>` template string to inline the logic into the query.
*
* will always insert 3 constants and 3 SQL variables into the query.
*/
function firstIdBigger(...args) {
	let [l, r] = args;
	let v;
	if (l === "elementId") {
		v = r;
		r = "?";
	} else {
		v = l;
		l = "?";
	}
	return new SqlFragment(`(CASE WHEN length(${l}) > length(${r}) THEN 1 WHEN length(${l}) < length(${r}) THEN 0 ELSE ${l} > ${r} END)`, [
		v,
		v,
		v
	]);
}
function isCustomIdType(typeModel) {
	return typeModel.values._id.type === ValueType.CustomId;
}
function ensureBase64Ext(typeModel, elementId) {
	if (isCustomIdType(typeModel)) return base64ToBase64Ext(base64UrlToBase64(elementId));
	return elementId;
}
function customIdToBase64Url(typeModel, elementId) {
	if (isCustomIdType(typeModel)) return base64ToBase64Url(base64ExtToBase64(elementId));
	return elementId;
}

//#endregion
//#region src/common/api/worker/rest/DefaultEntityRestCache.ts
assertWorkerOrNode();
const EXTEND_RANGE_MIN_CHUNK_SIZE = 40;
const IGNORED_TYPES = [
	EntityEventBatchTypeRef,
	PermissionTypeRef,
	BucketPermissionTypeRef,
	SessionTypeRef,
	SecondFactorTypeRef,
	RecoverCodeTypeRef,
	RejectedSenderTypeRef,
	CalendarEventUidIndexTypeRef,
	KeyRotationTypeRef,
	UserGroupRootTypeRef,
	UserGroupKeyDistributionTypeRef,
	AuditLogEntryTypeRef
];
/**
* List of types containing a customId that we want to explicitly enable caching for.
* CustomId types are not cached by default because their id is using base64UrlEncoding while GeneratedUId types are using base64Ext encoding.
* base64Url encoding results in a different sort order of elements that we have on the server, this is problematic for caching LET and their ranges.
* When enabling caching for customId types we convert the id that we store in cache from base64Url to base64Ext so we have the same sort order. (see function
* OfflineStorage.ensureBase64Ext). In theory, we can try to enable caching for all types but as of now we enable it for a limited amount of types because there
* are other ways to cache customId types (see implementation of CustomCacheHandler)
*/
const CACHEABLE_CUSTOMID_TYPES = [MailSetEntryTypeRef, GroupKeyTypeRef];
var DefaultEntityRestCache = class {
	constructor(entityRestClient, storage) {
		this.entityRestClient = entityRestClient;
		this.storage = storage;
	}
	async load(typeRef, id, opts = {}) {
		const useCache = await this.shouldUseCache(typeRef, opts);
		if (!useCache) return await this.entityRestClient.load(typeRef, id, opts);
		const { listId, elementId } = expandId(id);
		const cachingBehavior = getCacheModeBehavior(opts.cacheMode);
		const cachedEntity = cachingBehavior.readsFromCache ? await this.storage.get(typeRef, listId, elementId) : null;
		if (cachedEntity == null) {
			const entity = await this.entityRestClient.load(typeRef, id, opts);
			if (cachingBehavior.writesToCache) await this.storage.put(entity);
			return entity;
		}
		return cachedEntity;
	}
	async loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts = {}) {
		const useCache = await this.shouldUseCache(typeRef, opts);
		if (!useCache) return await this.entityRestClient.loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts);
		return await this._loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts);
	}
	setup(listId, instance, extraHeaders, options) {
		return this.entityRestClient.setup(listId, instance, extraHeaders, options);
	}
	setupMultiple(listId, instances) {
		return this.entityRestClient.setupMultiple(listId, instances);
	}
	update(instance) {
		return this.entityRestClient.update(instance);
	}
	erase(instance, options) {
		return this.entityRestClient.erase(instance, options);
	}
	getLastEntityEventBatchForGroup(groupId) {
		return this.storage.getLastBatchIdForGroup(groupId);
	}
	setLastEntityEventBatchForGroup(groupId, batchId) {
		return this.storage.putLastBatchIdForGroup(groupId, batchId);
	}
	purgeStorage() {
		console.log("Purging the user's offline database");
		return this.storage.purgeStorage();
	}
	async isOutOfSync() {
		const timeSinceLastSync = await this.timeSinceLastSyncMs();
		return timeSinceLastSync != null && timeSinceLastSync > ENTITY_EVENT_BATCH_EXPIRE_MS;
	}
	async recordSyncTime() {
		const timestamp = this.getServerTimestampMs();
		await this.storage.putLastUpdateTime(timestamp);
	}
	async timeSinceLastSyncMs() {
		const lastUpdate = await this.storage.getLastUpdateTime();
		let lastUpdateTime;
		switch (lastUpdate.type) {
			case "recorded":
				lastUpdateTime = lastUpdate.time;
				break;
			case "never": return null;
			case "uninitialized": throw new ProgrammingError("Offline storage is not initialized");
		}
		const now = this.getServerTimestampMs();
		return now - lastUpdateTime;
	}
	getServerTimestampMs() {
		return this.entityRestClient.getRestClient().getServerTimestampMs();
	}
	/**
	* Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	*/
	deleteFromCacheIfExists(typeRef, listId, elementId) {
		return this.storage.deleteIfExists(typeRef, listId, elementId);
	}
	async _loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts = {}) {
		const cachingBehavior = getCacheModeBehavior(opts.cacheMode);
		const entitiesInCache = [];
		let idsToLoad;
		if (cachingBehavior.readsFromCache) {
			idsToLoad = [];
			for (const id of ids) {
				const cachedEntity = await this.storage.get(typeRef, listId, id);
				if (cachedEntity != null) entitiesInCache.push(cachedEntity);
else idsToLoad.push(id);
			}
		} else idsToLoad = ids;
		if (idsToLoad.length > 0) {
			const entitiesFromServer = await this.entityRestClient.loadMultiple(typeRef, listId, idsToLoad, ownerEncSessionKeyProvider, opts);
			if (cachingBehavior.writesToCache) for (const entity of entitiesFromServer) await this.storage.put(entity);
			return entitiesFromServer.concat(entitiesInCache);
		} else return entitiesInCache;
	}
	async loadRange(typeRef, listId, start, count, reverse, opts = {}) {
		const customHandler = this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef);
		if (customHandler && customHandler.loadRange) return await customHandler.loadRange(this.storage, listId, start, count, reverse);
		const typeModel = await resolveTypeReference(typeRef);
		const useCache = await this.shouldUseCache(typeRef, opts) && isCachedRangeType(typeModel, typeRef);
		if (!useCache) return await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts);
		const behavior = getCacheModeBehavior(opts.cacheMode);
		if (!behavior.readsFromCache) throw new ProgrammingError("cannot write to cache without reading with range requests");
		await this.storage.lockRangesDbAccess(listId);
		try {
			const range = await this.storage.getRangeForList(typeRef, listId);
			if (behavior.writesToCache) {
				if (range == null) await this.populateNewListWithRange(typeRef, listId, start, count, reverse, opts);
else if (isStartIdWithinRange(range, start, typeModel)) await this.extendFromWithinRange(typeRef, listId, start, count, reverse, opts);
else if (isRangeRequestAwayFromExistingRange(range, reverse, start, typeModel)) await this.extendAwayFromRange(typeRef, listId, start, count, reverse, opts);
else await this.extendTowardsRange(typeRef, listId, start, count, reverse, opts);
				return await this.storage.provideFromRange(typeRef, listId, start, count, reverse);
			} else if (range && isStartIdWithinRange(range, start, typeModel)) {
				const provided = await this.storage.provideFromRange(typeRef, listId, start, count, reverse);
				const { newStart, newCount } = await this.recalculateRangeRequest(typeRef, listId, start, count, reverse);
				const newElements = newCount > 0 ? await this.entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse) : [];
				return provided.concat(newElements);
			} else return await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts);
		} finally {
			await this.storage.unlockRangesDbAccess(listId);
		}
	}
	/**
	* Creates a new list range, reading everything from the server that it can
	* range:         (none)
	* request:       *--------->
	* range becomes: |---------|
	* @private
	*/
	async populateNewListWithRange(typeRef, listId, start, count, reverse, opts) {
		const entities = await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts);
		await this.storage.setNewRangeForList(typeRef, listId, start, start);
		await this.updateRangeInStorage(typeRef, listId, count, reverse, entities);
	}
	/**
	* Returns part of a request from the cache, and the remainder is loaded from the server
	* range:          |---------|
	* request:             *-------------->
	* range becomes: |--------------------|
	*/
	async extendFromWithinRange(typeRef, listId, start, count, reverse, opts) {
		const { newStart, newCount } = await this.recalculateRangeRequest(typeRef, listId, start, count, reverse);
		if (newCount > 0) {
			const entities = await this.entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse, opts);
			await this.updateRangeInStorage(typeRef, listId, newCount, reverse, entities);
		}
	}
	/**
	* Start was outside the range, and we are loading away from the range
	* Keeps loading elements from the end of the range in the direction of the startId.
	* Returns once all available elements have been loaded or the requested number is in cache
	* range:          |---------|
	* request:                     *------->
	* range becomes:  |--------------------|
	*/
	async extendAwayFromRange(typeRef, listId, start, count, reverse, opts) {
		while (true) {
			const range = assertNotNull(await this.storage.getRangeForList(typeRef, listId));
			const loadStartId = reverse ? range.lower : range.upper;
			const requestCount = Math.max(count, EXTEND_RANGE_MIN_CHUNK_SIZE);
			const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, requestCount, reverse, opts);
			await this.updateRangeInStorage(typeRef, listId, requestCount, reverse, entities);
			if (entities.length < requestCount) break;
			const entitiesFromCache = await this.storage.provideFromRange(typeRef, listId, start, count, reverse);
			if (entitiesFromCache.length === count) break;
		}
	}
	/**
	* Loads all elements from the startId in the direction of the range
	* Once complete, returns as many elements as it can from the original request
	* range:         |---------|
	* request:                     <------*
	* range becomes: |--------------------|
	* or
	* range:              |---------|
	* request:       <-------------------*
	* range becomes: |--------------------|
	*/
	async extendTowardsRange(typeRef, listId, start, count, reverse, opts) {
		while (true) {
			const range = assertNotNull(await this.storage.getRangeForList(typeRef, listId));
			const loadStartId = reverse ? range.upper : range.lower;
			const requestCount = Math.max(count, EXTEND_RANGE_MIN_CHUNK_SIZE);
			const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, requestCount, !reverse, opts);
			await this.updateRangeInStorage(typeRef, listId, requestCount, !reverse, entities);
			if (await this.storage.isElementIdInCacheRange(typeRef, listId, start)) break;
		}
		await this.extendFromWithinRange(typeRef, listId, start, count, reverse, opts);
	}
	/**
	* Given the parameters and result of a range request,
	* Inserts the result into storage, and updates the range bounds
	* based on number of entities requested and the actual amount that were received
	*/
	async updateRangeInStorage(typeRef, listId, countRequested, wasReverseRequest, receivedEntities) {
		const isCustomId = isCustomIdType(await resolveTypeReference(typeRef));
		let elementsToAdd = receivedEntities;
		if (wasReverseRequest) {
			elementsToAdd = receivedEntities.reverse();
			if (receivedEntities.length < countRequested) {
				console.log("finished loading, setting min id");
				await this.storage.setLowerRangeForList(typeRef, listId, isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID);
			} else await this.storage.setLowerRangeForList(typeRef, listId, getElementId(getFirstOrThrow(receivedEntities)));
		} else if (receivedEntities.length < countRequested) {
			console.log("finished loading, setting max id");
			await this.storage.setUpperRangeForList(typeRef, listId, isCustomId ? CUSTOM_MAX_ID : GENERATED_MAX_ID);
		} else await this.storage.setUpperRangeForList(typeRef, listId, getElementId(lastThrow(receivedEntities)));
		await Promise.all(elementsToAdd.map((element) => this.storage.put(element)));
	}
	/**
	* Calculates the new start value for the getElementRange request and the number of elements to read in
	* order to read no duplicate values.
	* @return returns the new start and count value. Important: count can be negative if everything is cached
	*/
	async recalculateRangeRequest(typeRef, listId, start, count, reverse) {
		let allRangeList = await this.storage.getIdsInRange(typeRef, listId);
		let elementsToRead = count;
		let startElementId = start;
		const range = await this.storage.getRangeForList(typeRef, listId);
		if (range == null) return {
			newStart: start,
			newCount: count
		};
		const { lower, upper } = range;
		let indexOfStart = allRangeList.indexOf(start);
		const typeModel = await resolveTypeReference(typeRef);
		const isCustomId = isCustomIdType(typeModel);
		if (!reverse && (isCustomId ? upper === CUSTOM_MAX_ID : upper === GENERATED_MAX_ID) || reverse && (isCustomId ? lower === CUSTOM_MIN_ID : lower === GENERATED_MIN_ID)) elementsToRead = 0;
else if (allRangeList.length === 0) elementsToRead = count;
else if (indexOfStart !== -1) if (reverse) {
			elementsToRead = count - indexOfStart;
			startElementId = allRangeList[0];
		} else {
			elementsToRead = count - (allRangeList.length - 1 - indexOfStart);
			startElementId = allRangeList[allRangeList.length - 1];
		}
else if (lower === start || firstBiggerThanSecond(start, lower, typeModel) && firstBiggerThanSecond(allRangeList[0], start, typeModel)) {
			if (!reverse) {
				startElementId = allRangeList[allRangeList.length - 1];
				elementsToRead = count - allRangeList.length;
			}
		} else if (upper === start || firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1], typeModel) && firstBiggerThanSecond(upper, start, typeModel)) {
			if (reverse) {
				startElementId = allRangeList[0];
				elementsToRead = count - allRangeList.length;
			}
		}
		return {
			newStart: startElementId,
			newCount: elementsToRead
		};
	}
	/**
	* Resolves when the entity is loaded from the server if necessary
	* @pre The last call of this function must be resolved. This is needed to avoid that e.g. while
	* loading a created instance from the server we receive an update of that instance and ignore it because the instance is not in the cache yet.
	*
	* @return Promise, which resolves to the array of valid events (if response is NotFound or NotAuthorized we filter it out)
	*/
	async entityEventsReceived(batch) {
		await this.recordSyncTime();
		const createUpdatesForLETs = [];
		const regularUpdates = [];
		const updatesArray = batch.events;
		for (const update of updatesArray) {
			const typeRef = new TypeRef(update.application, update.type);
			if (update.application === "monitor") continue;
			if (update.operation === OperationType.CREATE && getUpdateInstanceId(update).instanceListId != null && !isSameTypeRef(typeRef, MailTypeRef)) createUpdatesForLETs.push(update);
else {
				regularUpdates.push(update);
				await this.checkForMailSetMigration(typeRef, update);
			}
		}
		const createUpdatesForLETsPerList = groupBy(createUpdatesForLETs, (update) => update.instanceListId);
		const postMultipleEventUpdates = [];
		for (let [instanceListId, updates] of createUpdatesForLETsPerList) {
			const firstUpdate = updates[0];
			const typeRef = new TypeRef(firstUpdate.application, firstUpdate.type);
			const ids = updates.map((update) => update.instanceId);
			const customHandler = this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef);
			const idsInCacheRange = customHandler && customHandler.getElementIdsInCacheRange ? await customHandler.getElementIdsInCacheRange(this.storage, instanceListId, ids) : await this.getElementIdsInCacheRange(typeRef, instanceListId, ids);
			if (idsInCacheRange.length === 0) postMultipleEventUpdates.push(updates);
else {
				const updatesNotInCacheRange = idsInCacheRange.length === updates.length ? [] : updates.filter((update) => !idsInCacheRange.includes(update.instanceId));
				try {
					const returnedInstances = await this._loadMultiple(typeRef, instanceListId, idsInCacheRange, undefined, { cacheMode: CacheMode.WriteOnly });
					if (returnedInstances.length !== idsInCacheRange.length) {
						const returnedIds = returnedInstances.map((instance) => getElementId(instance));
						postMultipleEventUpdates.push(updates.filter((update) => returnedIds.includes(update.instanceId)).concat(updatesNotInCacheRange));
					} else postMultipleEventUpdates.push(updates);
				} catch (e) {
					if (e instanceof NotAuthorizedError) postMultipleEventUpdates.push(updatesNotInCacheRange);
else throw e;
				}
			}
		}
		const otherEventUpdates = [];
		for (let update of regularUpdates) {
			const { operation, type, application } = update;
			const { instanceListId, instanceId } = getUpdateInstanceId(update);
			const typeRef = new TypeRef(application, type);
			switch (operation) {
				case OperationType.UPDATE: {
					const handledUpdate = await this.processUpdateEvent(typeRef, update);
					if (handledUpdate) otherEventUpdates.push(handledUpdate);
					break;
				}
				case OperationType.DELETE: {
					if (isSameTypeRef(MailTypeRef, typeRef) && containsEventOfType(updatesArray, OperationType.CREATE, instanceId)) {} else if (isSameTypeRef(MailTypeRef, typeRef)) {
						const mail = await this.storage.get(MailTypeRef, instanceListId, instanceId);
						await this.storage.deleteIfExists(typeRef, instanceListId, instanceId);
						if (mail?.mailDetails != null) await this.storage.deleteIfExists(MailDetailsBlobTypeRef, mail.mailDetails[0], mail.mailDetails[1]);
					} else await this.storage.deleteIfExists(typeRef, instanceListId, instanceId);
					otherEventUpdates.push(update);
					break;
				}
				case OperationType.CREATE: {
					const handledUpdate = await this.processCreateEvent(typeRef, update, updatesArray);
					if (handledUpdate) otherEventUpdates.push(handledUpdate);
					break;
				}
				default: throw new ProgrammingError("Unknown operation type: " + operation);
			}
		}
		await this.storage.putLastBatchIdForGroup(batch.groupId, batch.batchId);
		return otherEventUpdates.concat(postMultipleEventUpdates.flat());
	}
	/** Returns {null} when the update should be skipped. */
	async processCreateEvent(typeRef, update, batch) {
		const { instanceId, instanceListId } = getUpdateInstanceId(update);
		if (instanceListId != null) {
			const deleteEvent = getEventOfType(batch, OperationType.DELETE, instanceId);
			const mail = deleteEvent && isSameTypeRef(MailTypeRef, typeRef) ? await this.storage.get(MailTypeRef, deleteEvent.instanceListId, instanceId) : null;
			if (deleteEvent != null && mail != null && isEmpty(mail.sets)) {
				await this.storage.deleteIfExists(typeRef, deleteEvent.instanceListId, instanceId);
				await this.updateListIdOfMailAndUpdateCache(mail, instanceListId, instanceId);
				return update;
			} else {
				const shouldLoad = await this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef)?.shouldLoadOnCreateEvent?.(update) ?? await this.storage.isElementIdInCacheRange(typeRef, instanceListId, instanceId);
				if (shouldLoad) {
					console.log("downloading create event for", getTypeId(typeRef), instanceListId, instanceId);
					return this.entityRestClient.load(typeRef, [instanceListId, instanceId]).then((entity) => this.storage.put(entity)).then(() => update).catch((e) => {
						if (isExpectedErrorForSynchronization(e)) return null;
else throw e;
					});
				} else return update;
			}
		} else return update;
	}
	/**
	* Updates the given mail with the new list id and add it to the cache.
	*/
	async updateListIdOfMailAndUpdateCache(mail, newListId, elementId) {
		mail._id = [newListId, elementId];
		if (mail.bucketKey != null) {
			const mailSessionKey = mail.bucketKey.bucketEncSessionKeys.find((bucketEncSessionKey) => isSameId(bucketEncSessionKey.instanceId, elementId));
			if (mailSessionKey) mailSessionKey.instanceList = newListId;
		}
		await this.storage.put(mail);
	}
	/** Returns {null} when the update should be skipped. */
	async processUpdateEvent(typeRef, update) {
		const { instanceId, instanceListId } = getUpdateInstanceId(update);
		const cached = await this.storage.get(typeRef, instanceListId, instanceId);
		if (cached != null) try {
			const newEntity = await this.entityRestClient.load(typeRef, collapseId(instanceListId, instanceId));
			if (isSameTypeRef(typeRef, UserTypeRef)) await this.handleUpdatedUser(cached, newEntity);
			await this.storage.put(newEntity);
			return update;
		} catch (e) {
			if (isExpectedErrorForSynchronization(e)) {
				console.log(`Instance not found when processing update for ${JSON.stringify(update)}, deleting from the cache.`);
				await this.storage.deleteIfExists(typeRef, instanceListId, instanceId);
				return null;
			} else throw e;
		}
		return update;
	}
	async handleUpdatedUser(cached, newEntity) {
		const oldUser = cached;
		if (oldUser._id !== this.storage.getUserId()) return;
		const newUser = newEntity;
		const removedShips = difference(oldUser.memberships, newUser.memberships, (l, r) => l._id === r._id);
		for (const ship of removedShips) {
			console.log("Lost membership on ", ship._id, ship.groupType);
			await this.storage.deleteAllOwnedBy(ship.group);
		}
	}
	/**
	*
	* @returns {Array<Id>} the ids that are in cache range and therefore should be cached
	*/
	async getElementIdsInCacheRange(typeRef, listId, ids) {
		const ret = [];
		for (let i = 0; i < ids.length; i++) if (await this.storage.isElementIdInCacheRange(typeRef, listId, ids[i])) ret.push(ids[i]);
		return ret;
	}
	/**
	* to avoid excessive entity updates and inconsistent offline storages, we don't send entity updates for each mail set migrated mail.
	* instead we detect the mail set migration for each folder and drop its whole list from offline.
	*/
	async checkForMailSetMigration(typeRef, update) {
		if (update.operation !== OperationType.UPDATE || !isSameTypeRef(typeRef, MailFolderTypeRef)) return;
		const oldFolder = await this.storage.get(MailFolderTypeRef, update.instanceListId, update.instanceId);
		if (oldFolder != null && oldFolder.isMailSet) return;
		const updatedFolder = await this.entityRestClient.load(MailFolderTypeRef, [update.instanceListId, update.instanceId]);
		if (!updatedFolder.isMailSet) return;
		await this.storage.deleteWholeList(MailTypeRef, updatedFolder.mails);
		await this.storage.put(updatedFolder);
	}
	/**
	* Check if the given request should use the cache
	* @param typeRef typeref of the type
	* @param opts entity rest client options, if any
	* @return true if the cache can be used, false if a direct network request should be performed
	*/
	shouldUseCache(typeRef, opts) {
		if (isIgnoredType(typeRef)) return false;
		return opts?.queryParams?.version == null;
	}
};
/**
* Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
* for the instance that was already deleted. Normally this would be optimized away but it might still happen due to timing.
*/
function isExpectedErrorForSynchronization(e) {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError;
}
function expandId(id) {
	if (typeof id === "string") return {
		listId: null,
		elementId: id
	};
else {
		const [listId, elementId] = id;
		return {
			listId,
			elementId
		};
	}
}
function collapseId(listId, elementId) {
	if (listId != null) return [listId, elementId];
else return elementId;
}
function getUpdateInstanceId(update) {
	let instanceListId;
	if (update.instanceListId === "") instanceListId = null;
else instanceListId = update.instanceListId;
	return {
		instanceListId,
		instanceId: update.instanceId
	};
}
/**
* Check if a range request begins inside an existing range
*/
function isStartIdWithinRange(range, startId, typeModel) {
	return !firstBiggerThanSecond(startId, range.upper, typeModel) && !firstBiggerThanSecond(range.lower, startId, typeModel);
}
/**
* Check if a range request is going away from an existing range
* Assumes that the range request doesn't start inside the range
*/
function isRangeRequestAwayFromExistingRange(range, reverse, start, typeModel) {
	return reverse ? firstBiggerThanSecond(range.lower, start, typeModel) : firstBiggerThanSecond(start, range.upper, typeModel);
}
/**
* some types are completely ignored by the cache and always served from a request.
* Note:
* isCachedRangeType(ref) ---> !isIgnoredType(ref) but
* isIgnoredType(ref) -/-> !isCachedRangeType(ref) because of opted-in CustomId types.
*/
function isIgnoredType(typeRef) {
	return typeRef.app === "monitor" || IGNORED_TYPES.some((ref) => isSameTypeRef(typeRef, ref));
}
/**
* Checks if for the given type, that contains a customId,  caching is enabled.
*/
function isCachableCustomIdType(typeRef) {
	return CACHEABLE_CUSTOMID_TYPES.some((ref) => isSameTypeRef(typeRef, ref));
}
/**
* Ranges for customId types are normally not cached, but some are opted in.
* Note:
* isCachedRangeType(ref) ---> !isIgnoredType(ref) but
* isIgnoredType(ref) -/-> !isCachedRangeType(ref)
*/
function isCachedRangeType(typeModel, typeRef) {
	return !isIgnoredType(typeRef) && isGeneratedIdType(typeModel) || isCachableCustomIdType(typeRef);
}
function isGeneratedIdType(typeModel) {
	return typeModel.values._id.type === ValueType.GeneratedId;
}

//#endregion
//#region src/common/api/worker/rest/EntityRestClient.ts
assertWorkerOrNode();
function typeRefToPath(typeRef) {
	return `/rest/${typeRef.app}/${typeRef.type.toLowerCase()}`;
}
let CacheMode = function(CacheMode$1) {
	/** Prefer cached value if it's there, or fall back to network and write it to cache. */
	CacheMode$1[CacheMode$1["ReadAndWrite"] = 0] = "ReadAndWrite";
	/**
	* Always retrieve from the network, but still save to cache.
	*
	* NOTE: This cannot be used with ranged requests.
	*/
	CacheMode$1[CacheMode$1["WriteOnly"] = 1] = "WriteOnly";
	/** Prefer cached value, but in case of a cache miss, retrieve the value from network without writing it to cache. */
	CacheMode$1[CacheMode$1["ReadOnly"] = 2] = "ReadOnly";
	return CacheMode$1;
}({});
function getCacheModeBehavior(cacheMode) {
	switch (cacheMode ?? CacheMode.ReadAndWrite) {
		case CacheMode.ReadAndWrite: return {
			readsFromCache: true,
			writesToCache: true
		};
		case CacheMode.WriteOnly: return {
			readsFromCache: false,
			writesToCache: true
		};
		case CacheMode.ReadOnly: return {
			readsFromCache: true,
			writesToCache: false
		};
	}
}
var EntityRestClient = class {
	get _crypto() {
		return this.lazyCrypto();
	}
	constructor(authDataProvider, restClient, lazyCrypto, instanceMapper, blobAccessTokenFacade) {
		this.authDataProvider = authDataProvider;
		this.restClient = restClient;
		this.lazyCrypto = lazyCrypto;
		this.instanceMapper = instanceMapper;
		this.blobAccessTokenFacade = blobAccessTokenFacade;
	}
	async load(typeRef, id, opts = {}) {
		const { listId, elementId } = expandId(id);
		const { path, queryParams, headers, typeModel } = await this._validateAndPrepareRestRequest(typeRef, listId, elementId, opts.queryParams, opts.extraHeaders, opts.ownerKeyProvider);
		const json = await this.restClient.request(path, HttpMethod.GET, {
			queryParams,
			headers,
			responseType: MediaType.Json,
			baseUrl: opts.baseUrl
		});
		const entity = JSON.parse(json);
		const migratedEntity = await this._crypto.applyMigrations(typeRef, entity);
		const sessionKey = await this.resolveSessionKey(opts.ownerKeyProvider, migratedEntity, typeModel);
		const instance = await this.instanceMapper.decryptAndMapToInstance(typeModel, migratedEntity, sessionKey);
		return this._crypto.applyMigrationsForInstance(instance);
	}
	async resolveSessionKey(ownerKeyProvider, migratedEntity, typeModel) {
		try {
			if (ownerKeyProvider && migratedEntity._ownerEncSessionKey) {
				const ownerKey = await ownerKeyProvider(Number(migratedEntity._ownerKeyVersion ?? 0));
				return this._crypto.resolveSessionKeyWithOwnerKey(migratedEntity, ownerKey);
			} else return await this._crypto.resolveSessionKey(typeModel, migratedEntity);
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) {
				console.log(`could not resolve session key for instance of type ${typeModel.app}/${typeModel.name}`, e);
				return null;
			} else throw e;
		}
	}
	async loadRange(typeRef, listId, start, count, reverse, opts = {}) {
		const rangeRequestParams = {
			start: String(start),
			count: String(count),
			reverse: String(reverse)
		};
		const { path, headers, typeModel, queryParams } = await this._validateAndPrepareRestRequest(typeRef, listId, null, Object.assign(rangeRequestParams, opts.queryParams), opts.extraHeaders, opts.ownerKeyProvider);
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted");
		const json = await this.restClient.request(path, HttpMethod.GET, {
			queryParams,
			headers,
			responseType: MediaType.Json,
			baseUrl: opts.baseUrl,
			suspensionBehavior: opts.suspensionBehavior
		});
		return this._handleLoadMultipleResult(typeRef, JSON.parse(json));
	}
	async loadMultiple(typeRef, listId, elementIds, ownerEncSessionKeyProvider, opts = {}) {
		const { path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, opts.queryParams, opts.extraHeaders, opts.ownerKeyProvider);
		const idChunks = splitInChunks(LOAD_MULTIPLE_LIMIT, elementIds);
		const typeModel = await resolveTypeReference(typeRef);
		const loadedChunks = await pMap(idChunks, async (idChunk) => {
			let queryParams = { ids: idChunk.join(",") };
			let json;
			if (typeModel.type === Type.BlobElement) json = await this.loadMultipleBlobElements(listId, queryParams, headers, path, typeRef, opts.suspensionBehavior);
else json = await this.restClient.request(path, HttpMethod.GET, {
				queryParams,
				headers,
				responseType: MediaType.Json,
				baseUrl: opts.baseUrl,
				suspensionBehavior: opts.suspensionBehavior
			});
			return this._handleLoadMultipleResult(typeRef, JSON.parse(json), ownerEncSessionKeyProvider);
		});
		return loadedChunks.flat();
	}
	async loadMultipleBlobElements(archiveId, queryParams, headers, path, typeRef, suspensionBehavior) {
		if (archiveId == null) throw new Error("archiveId must be set to load BlobElementTypes");
		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestReadTokenArchive(archiveId);
			const additionalRequestParams = Object.assign({}, headers, queryParams);
			const allParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, additionalRequestParams, typeRef);
			return tryServers(blobServerAccessInfo.servers, async (serverUrl) => this.restClient.request(path, HttpMethod.GET, {
				queryParams: allParams,
				headers: {},
				responseType: MediaType.Json,
				baseUrl: serverUrl,
				noCORS: true,
				suspensionBehavior
			}), `can't load instances from server `);
		};
		const doEvictToken = () => this.blobAccessTokenFacade.evictArchiveToken(archiveId);
		return doBlobRequestWithRetry(doBlobRequest, doEvictToken);
	}
	async _handleLoadMultipleResult(typeRef, loadedEntities, ownerEncSessionKeyProvider) {
		const model = await resolveTypeReference(typeRef);
		if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) await pMap(loadedEntities, (instance) => this._crypto.applyMigrations(typeRef, instance), { concurrency: 5 });
		return pMap(loadedEntities, (instance) => {
			return this._decryptMapAndMigrate(instance, model, ownerEncSessionKeyProvider);
		}, { concurrency: 5 });
	}
	async _decryptMapAndMigrate(instance, model, ownerEncSessionKeyProvider) {
		let sessionKey;
		if (ownerEncSessionKeyProvider) sessionKey = await this._crypto.decryptSessionKey(instance, await ownerEncSessionKeyProvider(getElementId(instance)));
else try {
			sessionKey = await this._crypto.resolveSessionKey(model, instance);
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) {
				console.log("could not resolve session key", e, e.message, e.stack);
				sessionKey = null;
			} else throw e;
		}
		const decryptedInstance = await this.instanceMapper.decryptAndMapToInstance(model, instance, sessionKey);
		return this._crypto.applyMigrationsForInstance(decryptedInstance);
	}
	async setup(listId, instance, extraHeaders, options) {
		const typeRef = instance._type;
		const { typeModel, path, headers, queryParams } = await this._validateAndPrepareRestRequest(typeRef, listId, null, undefined, extraHeaders, options?.ownerKey);
		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs");
		} else if (listId) throw new Error("List id must not be defined for ETs");
		const sk = await this._crypto.setNewOwnerEncSessionKey(typeModel, instance, options?.ownerKey);
		const encryptedEntity = await this.instanceMapper.encryptAndMapToLiteral(typeModel, instance, sk);
		const persistencePostReturn = await this.restClient.request(path, HttpMethod.POST, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(encryptedEntity),
			responseType: MediaType.Json
		});
		return JSON.parse(persistencePostReturn).generatedId;
	}
	async setupMultiple(listId, instances) {
		const count = instances.length;
		if (count < 1) return [];
		const instanceChunks = splitInChunks(POST_MULTIPLE_LIMIT, instances);
		const typeRef = instances[0]._type;
		const { typeModel, path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, undefined, undefined, undefined);
		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs");
		} else if (listId) throw new Error("List id must not be defined for ETs");
		const errors = [];
		const failedInstances = [];
		const idChunks = await pMap(instanceChunks, async (instanceChunk) => {
			try {
				const encryptedEntities = await pMap(instanceChunk, async (e) => {
					const sk = await this._crypto.setNewOwnerEncSessionKey(typeModel, e);
					return this.instanceMapper.encryptAndMapToLiteral(typeModel, e, sk);
				});
				const queryParams = { count: String(instanceChunk.length) };
				const persistencePostReturn = await this.restClient.request(path, HttpMethod.POST, {
					queryParams,
					headers,
					body: JSON.stringify(encryptedEntities),
					responseType: MediaType.Json
				});
				return this.parseSetupMultiple(persistencePostReturn);
			} catch (e) {
				if (e instanceof PayloadTooLargeError) {
					const returnedIds = await pMap(instanceChunk, (instance) => {
						return this.setup(listId, instance).catch((e$1) => {
							errors.push(e$1);
							failedInstances.push(instance);
						});
					});
					return returnedIds.filter(Boolean);
				} else {
					errors.push(e);
					failedInstances.push(...instanceChunk);
					return [];
				}
			}
		});
		if (errors.length) {
			if (errors.some(isOfflineError)) throw new ConnectionError("Setup multiple entities failed");
			throw new SetupMultipleError("Setup multiple entities failed", errors, failedInstances);
		} else return idChunks.flat();
	}
	async update(instance, options) {
		if (!instance._id) throw new Error("Id must be defined");
		const { listId, elementId } = expandId(instance._id);
		const { path, queryParams, headers, typeModel } = await this._validateAndPrepareRestRequest(instance._type, listId, elementId, undefined, undefined, options?.ownerKeyProvider);
		const sessionKey = await this.resolveSessionKey(options?.ownerKeyProvider, instance, typeModel);
		const encryptedEntity = await this.instanceMapper.encryptAndMapToLiteral(typeModel, instance, sessionKey);
		await this.restClient.request(path, HttpMethod.PUT, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(encryptedEntity),
			responseType: MediaType.Json
		});
	}
	async erase(instance, options) {
		const { listId, elementId } = expandId(instance._id);
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(instance._type, listId, elementId, undefined, options?.extraHeaders, undefined);
		await this.restClient.request(path, HttpMethod.DELETE, {
			queryParams,
			headers
		});
	}
	async _validateAndPrepareRestRequest(typeRef, listId, elementId, queryParams, extraHeaders, ownerKey) {
		const typeModel = await resolveTypeReference(typeRef);
		_verifyType(typeModel);
		if (ownerKey == undefined && !this.authDataProvider.isFullyLoggedIn() && typeModel.encrypted) throw new LoginIncompleteError(`Trying to do a network request with encrypted entity but is not fully logged in yet, type: ${typeModel.name}`);
		let path = typeRefToPath(typeRef);
		if (listId) path += "/" + listId;
		if (elementId) path += "/" + elementId;
		const headers = Object.assign({}, this.authDataProvider.createAuthHeaders(), extraHeaders);
		if (Object.keys(headers).length === 0) throw new NotAuthenticatedError("user must be authenticated for entity requests");
		headers.v = typeModel.version;
		return {
			path,
			queryParams,
			headers,
			typeModel
		};
	}
	/**
	* for the admin area (no cache available)
	*/
	entityEventsReceived(batch) {
		return Promise.resolve(batch.events);
	}
	getRestClient() {
		return this.restClient;
	}
	parseSetupMultiple(result) {
		try {
			return JSON.parse(result).map((r) => r.generatedId);
		} catch (e) {
			throw new Error(`Invalid response: ${result}, ${e}`);
		}
	}
};
async function tryServers(servers, mapper, errorMsg) {
	let index = 0;
	let error = null;
	for (const server of servers) {
		try {
			return await mapper(server.url, index);
		} catch (e) {
			if (e instanceof ConnectionError || e instanceof InternalServerError || e instanceof NotFoundError) {
				console.log(`${errorMsg} ${server.url}`, e);
				error = e;
			} else throw e;
		}
		index++;
	}
	throw error;
}
async function doBlobRequestWithRetry(doBlobRequest, doEvictTokenBeforeRetry) {
	return doBlobRequest().catch(
		// in case one of the chunks could not be uploaded because of an invalid/expired token we upload all chunks again in order to guarantee that they are uploaded to the same archive.
		// we don't have to take care of already uploaded chunks, as they are unreferenced and will be cleaned up by the server automatically.
		ofClass(NotAuthorizedError, (e) => {
			doEvictTokenBeforeRetry();
			return doBlobRequest();
		})
);
}

//#endregion
export { CacheMode, ConnectMode, CustomCacheHandlerMap, DefaultEntityRestCache, EntityRestClient, EventBusClient, OfflineStorage, WebWorkerTransport, WsConnectionState, bootstrapWorker, customIdToBase64Url, decode, doBlobRequestWithRetry, ensureBase64Ext, expandId, tryServers, typeRefToPath };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50aXR5UmVzdENsaWVudC1jaHVuay5qcyIsIm5hbWVzIjpbInByb2dyZXNzVHJhY2tlcjogRXhwb3NlZFByb2dyZXNzVHJhY2tlciIsInRvdGFsV29yazogbnVtYmVyIiwiYW1vdW50OiBudW1iZXIiLCJ0b3RhbEFtb3VudDogbnVtYmVyIiwid29ya2VyOiBXb3JrZXIgfCBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSIsIm1lc3NhZ2U6IE1lc3NhZ2U8T3V0Z29pbmdDb21tYW5kVHlwZT4iLCJoYW5kbGVyOiAobWVzc2FnZTogTWVzc2FnZTxJbmNvbWluZ0NvbW1hbmRUeXBlPikgPT4gdW5rbm93biIsImV2OiBhbnkiLCJsb2NhdG9yOiBDb21tb25Mb2NhdG9yIiwiZTogYW55IiwibXNnOiBhbnkiLCJtZXNzYWdlOiBNYWluUmVxdWVzdCIsIm1zZzogUmVxdWVzdDxXb3JrZXJSZXF1ZXN0VHlwZT4iLCJlbnRyb3B5OiBBcnJheTxFbnRyb3B5RGF0YUNodW5rPiIsImxpc3RlbmVyOiBFdmVudEJ1c0xpc3RlbmVyIiwiY2FjaGU6IEVudGl0eVJlc3RDYWNoZSIsInVzZXJGYWNhZGU6IFVzZXJGYWNhZGUiLCJlbnRpdHk6IEVudGl0eUNsaWVudCIsImluc3RhbmNlTWFwcGVyOiBJbnN0YW5jZU1hcHBlciIsInNvY2tldEZhY3Rvcnk6IChwYXRoOiBzdHJpbmcpID0+IFdlYlNvY2tldCIsInNsZWVwRGV0ZWN0b3I6IFNsZWVwRGV0ZWN0b3IiLCJwcm9ncmVzc1RyYWNrZXI6IEV4cG9zZWRQcm9ncmVzc1RyYWNrZXIiLCJjb25uZWN0TW9kZTogQ29ubmVjdE1vZGUiLCJzeXNNb2RlbEluZm8iLCJ0dXRhbm90YU1vZGVsSW5mbyIsImV2ZW50OiBDbG9zZUV2ZW50IiwiZXJyb3I6IGFueSIsIm1lc3NhZ2U6IE1lc3NhZ2VFdmVudDxzdHJpbmc+IiwiY2xvc2VPcHRpb246IENsb3NlRXZlbnRCdXNPcHRpb24iLCJjbG9zZUlmT3BlbjogYm9vbGVhbiIsImVuYWJsZUF1dG9tYXRpY1N0YXRlOiBib29sZWFuIiwiZGVsYXk6IG51bWJlciB8IG51bGwiLCJkZWxheSIsImNvdW50ZXJEYXRhOiBXZWJzb2NrZXRDb3VudGVyRGF0YSIsImRhdGE6IFBoaXNoaW5nTWFya2VyV2Vic29ja2V0RGF0YSIsImRhdGE6IFdlYnNvY2tldExlYWRlclN0YXR1cyIsImV2ZW50QmF0Y2g6IEVudGl0eVVwZGF0ZVtdIiwicmVjb25uZWN0aW9uSW50ZXJ2YWw6IHJlYWRvbmx5IFtudW1iZXIsIG51bWJlcl0iLCJsYXN0SWRzOiBNYXA8SWQsIEFycmF5PElkPj4iLCJldmVudFF1ZXVlOiBFdmVudFF1ZXVlIiwiZXZlbnRCYXRjaGVzOiBFbnRpdHlFdmVudEJhdGNoW10iLCJncm91cElkOiBJZCIsIm1vZGlmaWNhdGlvbjogUXVldWVkQmF0Y2giLCJiYXRjaDogUXVldWVkQmF0Y2giLCJiYXRjaElkOiBJZCIsImV2ZW50czogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGU+IiwiVHlwZSIsImJ1ZiIsInVpOGEiLCJoYW5kbGVyczogTWFwPHN0cmluZywgQ3VzdG9tQ2FjaGVIYW5kbGVyPExpc3RFbGVtZW50RW50aXR5Pj4iLCJ0eXBlUmVmOiBUeXBlUmVmPFQ+IiwiZW50aXR5UmVzdENsaWVudDogRW50aXR5UmVzdENsaWVudCIsInN0b3JhZ2U6IENhY2hlU3RvcmFnZSIsImxpc3RJZDogSWQiLCJzdGFydDogSWQiLCJjb3VudDogbnVtYmVyIiwicmV2ZXJzZTogYm9vbGVhbiIsInJhd0xpc3Q6IEFycmF5PENhbGVuZGFyRXZlbnQ+IiwiY2h1bms6IEFycmF5PENhbGVuZGFyRXZlbnQ+IiwicmFuZ2U6IFJhbmdlIiwiaWRzOiBBcnJheTxJZD4iLCJwYXJhbTogU3FsVmFsdWUiLCJ0YWdnZWQ6IFJlY29yZDxzdHJpbmcsIFRhZ2dlZFNxbFZhbHVlPiIsInA6IFRhZ2dlZFNxbFZhbHVlIiwicXVlcnlQYXJ0czogVGVtcGxhdGVTdHJpbmdzQXJyYXkiLCJwYXJhbXM6IFRhZ2dlZFNxbFZhbHVlW10iLCJpOiBudW1iZXIiLCJ0ZXh0OiBzdHJpbmciLCJwYXJhbXM6IFNxbFZhbHVlW10iLCJkYXRhOiBEYXRlIiwidHlwOiBzdHJpbmciLCJvcHRpb25zOiBFbmNvZGVPcHRpb25zIiwiVHlwZSIsImJ5dGVzOiBudW1iZXIiLCJjdXN0b21UeXBlRW5jb2RlcnM6IHsgW3R5cGVOYW1lOiBzdHJpbmddOiB0eXBlb2YgZGF0ZUVuY29kZXIgfSIsImN1c3RvbVR5cGVEZWNvZGVyczogQXJyYXk8VHlwZURlY29kZXI+IiwidGFnczogQXJyYXk8VHlwZURlY29kZXI+Iiwic3FsQ2lwaGVyRmFjYWRlOiBTcWxDaXBoZXJGYWNhZGUiLCJpbnRlcldpbmRvd0V2ZW50U2VuZGVyOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlU2VuZERpc3BhdGNoZXIiLCJkYXRlUHJvdmlkZXI6IERhdGVQcm92aWRlciIsIm1pZ3JhdG9yOiBPZmZsaW5lU3RvcmFnZU1pZ3JhdG9yIiwiY2xlYW5lcjogT2ZmbGluZVN0b3JhZ2VDbGVhbmVyIiwidXNlcklkOiBzdHJpbmciLCJkYXRhYmFzZUtleTogVWludDhBcnJheSIsInR5cGVSZWY6IFR5cGVSZWY8U29tZUVudGl0eT4iLCJsaXN0SWQ6IElkIHwgbnVsbCIsImVsZW1lbnRJZDogSWQiLCJ0eXBlTW9kZWw6IFR5cGVNb2RlbCIsIlR5cGVJZCIsInR5cGU6IHN0cmluZyIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJsaXN0SWQ6IElkIiwiZWxlbWVudElkczogSWRbXSIsInNlcmlhbGl6ZWRMaXN0OiBSZWFkb25seUFycmF5PFJlY29yZDxzdHJpbmcsIFRhZ2dlZFNxbFZhbHVlPj4iLCJzdGFydDogSWQiLCJjb3VudDogbnVtYmVyIiwicmV2ZXJzZTogYm9vbGVhbiIsIm9yaWdpbmFsRW50aXR5OiBTb21lRW50aXR5IiwiZm9ybWF0dGVkUXVlcnk6IEZvcm1hdHRlZFF1ZXJ5IiwibG93ZXJJZDogSWQiLCJ1cHBlcklkOiBJZCIsImxvd2VyOiBJZCIsInVwcGVyOiBJZCIsImdyb3VwSWQ6IElkIiwiYmF0Y2hJZDogSWQiLCJtczogbnVtYmVyIiwidHlwZVJlZjogVHlwZVJlZjx1bmtub3duPiIsImxpc3RJZDogc3RyaW5nIiwidHlwZVJlZjogVHlwZVJlZjxMaXN0RWxlbWVudEVudGl0eT4iLCJ0eXBlUmVmOiBUeXBlUmVmPEVsZW1lbnRFbnRpdHk+IiwibW9kZWw6IFZlcnNpb25NZXRhZGF0YUJhc2VLZXkiLCJ2ZXJzaW9uOiBudW1iZXIiLCJlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50Iiwib3duZXI6IElkIiwibGlzdElkc0J5VHlwZTogTWFwPHN0cmluZywgU2V0PElkPj4iLCJrZXk6IEsiLCJ2YWx1ZTogT2ZmbGluZURiTWV0YVtLXSIsInRpbWVSYW5nZURheXM6IG51bWJlciB8IG51bGwiLCJ1c2VySWQ6IElkIiwidHlwZVJlZjogVHlwZVJlZjxFbGVtZW50RW50aXR5IHwgTGlzdEVsZW1lbnRFbnRpdHk+IiwicmF3Q3V0b2ZmSWQ6IElkIiwibG9hZGVkOiBVaW50OEFycmF5IiwiZGVzZXJpYWxpemVkOiBhbnkiLCJsb2FkZWQ6IEFycmF5PFVpbnQ4QXJyYXk+IiwicmVzdWx0OiBBcnJheTxUPiIsImNodW5rU2l6ZTogbnVtYmVyIiwib3JpZ2luYWxMaXN0OiBTcWxWYWx1ZVtdIiwiZm9ybWF0dGVyOiAoY2h1bms6IFNxbFZhbHVlW10pID0+IEZvcm1hdHRlZFF1ZXJ5IiwicmVzdWx0OiBBcnJheTxSZWNvcmQ8c3RyaW5nLCBUYWdnZWRTcWxWYWx1ZT4+IiwicGFyYW1zOiBTcWxWYWx1ZVtdIiwiZW50aXR5UmVzdENsaWVudDogRW50aXR5UmVzdENsaWVudCIsInN0b3JhZ2U6IENhY2hlU3RvcmFnZSIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJpZDogUHJvcGVydHlUeXBlPFQsIFwiX2lkXCI+Iiwib3B0czogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zIiwibGlzdElkOiBJZCB8IG51bGwiLCJpZHM6IEFycmF5PElkPiIsIm93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyPzogT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIiLCJpbnN0YW5jZTogVCIsImV4dHJhSGVhZGVycz86IERpY3QiLCJvcHRpb25zPzogRW50aXR5UmVzdENsaWVudFNldHVwT3B0aW9ucyIsImluc3RhbmNlczogQXJyYXk8VD4iLCJvcHRpb25zPzogRW50aXR5UmVzdENsaWVudEVyYXNlT3B0aW9ucyIsImdyb3VwSWQ6IElkIiwiYmF0Y2hJZDogSWQiLCJsYXN0VXBkYXRlVGltZTogbnVtYmVyIiwiZWxlbWVudElkOiBJZCIsImVudGl0aWVzSW5DYWNoZTogVFtdIiwiaWRzVG9Mb2FkOiBJZFtdIiwibGlzdElkOiBJZCIsInN0YXJ0OiBJZCIsImNvdW50OiBudW1iZXIiLCJyZXZlcnNlOiBib29sZWFuIiwiY291bnRSZXF1ZXN0ZWQ6IG51bWJlciIsIndhc1JldmVyc2VSZXF1ZXN0OiBib29sZWFuIiwicmVjZWl2ZWRFbnRpdGllczogVFtdIiwiYmF0Y2g6IFF1ZXVlZEJhdGNoIiwiY3JlYXRlVXBkYXRlc0ZvckxFVHM6IEVudGl0eVVwZGF0ZVtdIiwicmVndWxhclVwZGF0ZXM6IEVudGl0eVVwZGF0ZVtdIiwicG9zdE11bHRpcGxlRXZlbnRVcGRhdGVzOiBFbnRpdHlVcGRhdGVbXVtdIiwib3RoZXJFdmVudFVwZGF0ZXM6IEVudGl0eVVwZGF0ZVtdIiwidHlwZVJlZjogVHlwZVJlZjxhbnk+IiwidXBkYXRlOiBFbnRpdHlVcGRhdGUiLCJiYXRjaDogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGU+IiwibWFpbDogTWFpbCIsIm5ld0xpc3RJZDogSWQiLCJ0eXBlUmVmOiBUeXBlUmVmPFNvbWVFbnRpdHk+IiwiY2FjaGVkOiBTb21lRW50aXR5IiwibmV3RW50aXR5OiBTb21lRW50aXR5IiwiaWRzOiBJZFtdIiwicmV0OiBJZFtdIiwidHlwZVJlZjogVHlwZVJlZjx1bmtub3duPiIsIm9wdHM/OiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMiLCJlOiBFcnJvciIsImlkOiBJZCB8IElkVHVwbGUiLCJyYW5nZTogUmFuZ2UiLCJzdGFydElkOiBJZCIsInR5cGVNb2RlbDogVHlwZU1vZGVsIiwic3RhcnQ6IHN0cmluZyIsInR5cGVSZWY6IFR5cGVSZWY8YW55PiIsImNhY2hlTW9kZTogQ2FjaGVNb2RlIHwgdW5kZWZpbmVkIiwiYXV0aERhdGFQcm92aWRlcjogQXV0aERhdGFQcm92aWRlciIsInJlc3RDbGllbnQ6IFJlc3RDbGllbnQiLCJsYXp5Q3J5cHRvOiBsYXp5PENyeXB0b0ZhY2FkZT4iLCJpbnN0YW5jZU1hcHBlcjogSW5zdGFuY2VNYXBwZXIiLCJibG9iQWNjZXNzVG9rZW5GYWNhZGU6IEJsb2JBY2Nlc3NUb2tlbkZhY2FkZSIsInR5cGVSZWY6IFR5cGVSZWY8VD4iLCJpZDogUHJvcGVydHlUeXBlPFQsIFwiX2lkXCI+Iiwib3B0czogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zIiwib3duZXJLZXlQcm92aWRlcjogT3duZXJLZXlQcm92aWRlciB8IHVuZGVmaW5lZCIsIm1pZ3JhdGVkRW50aXR5OiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwidHlwZU1vZGVsOiBUeXBlTW9kZWwiLCJsaXN0SWQ6IElkIiwic3RhcnQ6IElkIiwiY291bnQ6IG51bWJlciIsInJldmVyc2U6IGJvb2xlYW4iLCJsaXN0SWQ6IElkIHwgbnVsbCIsImVsZW1lbnRJZHM6IEFycmF5PElkPiIsIm93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyPzogT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIiLCJqc29uOiBzdHJpbmciLCJhcmNoaXZlSWQ6IElkIHwgbnVsbCIsInF1ZXJ5UGFyYW1zOiB7IGlkczogc3RyaW5nIH0iLCJoZWFkZXJzOiBEaWN0IHwgdW5kZWZpbmVkIiwicGF0aDogc3RyaW5nIiwic3VzcGVuc2lvbkJlaGF2aW9yPzogU3VzcGVuc2lvbkJlaGF2aW9yIiwibG9hZGVkRW50aXRpZXM6IEFycmF5PGFueT4iLCJpbnN0YW5jZTogYW55IiwibW9kZWw6IFR5cGVNb2RlbCIsInNlc3Npb25LZXk6IEFlc0tleSB8IG51bGwiLCJpbnN0YW5jZTogVCIsImV4dHJhSGVhZGVycz86IERpY3QiLCJvcHRpb25zPzogRW50aXR5UmVzdENsaWVudFNldHVwT3B0aW9ucyIsImluc3RhbmNlczogQXJyYXk8VD4iLCJlcnJvcnM6IEVycm9yW10iLCJmYWlsZWRJbnN0YW5jZXM6IFRbXSIsImlkQ2h1bmtzOiBBcnJheTxBcnJheTxJZD4+IiwiZSIsIm9wdGlvbnM/OiBFbnRpdHlSZXN0Q2xpZW50VXBkYXRlT3B0aW9ucyIsIm9wdGlvbnM/OiBFbnRpdHlSZXN0Q2xpZW50RXJhc2VPcHRpb25zIiwiZWxlbWVudElkOiBJZCB8IG51bGwiLCJxdWVyeVBhcmFtczogRGljdCB8IHVuZGVmaW5lZCIsImV4dHJhSGVhZGVyczogRGljdCB8IHVuZGVmaW5lZCIsIm93bmVyS2V5OiBPd25lcktleVByb3ZpZGVyIHwgVmVyc2lvbmVkS2V5IHwgdW5kZWZpbmVkIiwiYmF0Y2g6IFF1ZXVlZEJhdGNoIiwicmVzdWx0OiBhbnkiLCJyOiBhbnkiLCJzZXJ2ZXJzOiBCbG9iU2VydmVyVXJsW10iLCJtYXBwZXI6IE1hcHBlcjxzdHJpbmcsIFQ+IiwiZXJyb3JNc2c6IHN0cmluZyIsImVycm9yOiBFcnJvciB8IG51bGwiLCJkb0Jsb2JSZXF1ZXN0OiAoKSA9PiBQcm9taXNlPFQ+IiwiZG9FdmljdFRva2VuQmVmb3JlUmV0cnk6ICgpID0+IHZvaWQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvUHJvZ3Jlc3NNb25pdG9yRGVsZWdhdGUudHMiLCIuLi9zcmMvY29tbW9uL2FwaS9jb21tb24vdGhyZWFkaW5nL1RyYW5zcG9ydC50cyIsIi4uL3NyYy9jb21tb24vYXBpL21haW4vV29ya2VyQ2xpZW50LnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL0V2ZW50QnVzQ2xpZW50LnRzIiwiLi4vbGlicy9jYm9yZy5qcyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9yZXN0L0N1c3RvbUNhY2hlSGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9vZmZsaW5lL1NxbFZhbHVlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvU3FsLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL29mZmxpbmUvT2ZmbGluZVN0b3JhZ2UudHMiLCIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRW50aXR5UmVzdENsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IElQcm9ncmVzc01vbml0b3IsIFByb2dyZXNzTW9uaXRvcklkIH0gZnJvbSBcIi4uL2NvbW1vbi91dGlscy9Qcm9ncmVzc01vbml0b3JcIlxuaW1wb3J0IHsgRXhwb3NlZFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi9tYWluL1Byb2dyZXNzVHJhY2tlci5qc1wiXG5cbi8qKiBBIHdyYXBwZXIgdGhhdCB3aWxsIHNlbmQgY29tcGxldGVkIHdvcmsgcmVtb3RlbHkgKi9cbmV4cG9ydCBjbGFzcyBQcm9ncmVzc01vbml0b3JEZWxlZ2F0ZSBpbXBsZW1lbnRzIElQcm9ncmVzc01vbml0b3Ige1xuXHRwcml2YXRlIHJlYWRvbmx5IHJlZjogUHJvbWlzZTxQcm9ncmVzc01vbml0b3JJZD5cblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHByb2dyZXNzVHJhY2tlcjogRXhwb3NlZFByb2dyZXNzVHJhY2tlciwgcmVhZG9ubHkgdG90YWxXb3JrOiBudW1iZXIpIHtcblx0XHR0aGlzLnJlZiA9IHByb2dyZXNzVHJhY2tlci5yZWdpc3Rlck1vbml0b3IodG90YWxXb3JrKVxuXHR9XG5cblx0YXN5bmMgd29ya0RvbmUoYW1vdW50OiBudW1iZXIpIHtcblx0XHRhd2FpdCB0aGlzLnByb2dyZXNzVHJhY2tlci53b3JrRG9uZUZvck1vbml0b3IoYXdhaXQgdGhpcy5yZWYsIGFtb3VudClcblx0fVxuXG5cdGFzeW5jIHRvdGFsV29ya0RvbmUodG90YWxBbW91bnQ6IG51bWJlcikge1xuXHRcdGF3YWl0IHRoaXMucHJvZ3Jlc3NUcmFja2VyLndvcmtEb25lRm9yTW9uaXRvcihhd2FpdCB0aGlzLnJlZiwgdGhpcy50b3RhbFdvcmsgLSB0b3RhbEFtb3VudClcblx0fVxuXG5cdGFzeW5jIGNvbXBsZXRlZCgpIHtcblx0XHRhd2FpdCB0aGlzLnByb2dyZXNzVHJhY2tlci53b3JrRG9uZUZvck1vbml0b3IoYXdhaXQgdGhpcy5yZWYsIHRoaXMudG90YWxXb3JrKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBNZXNzYWdlIH0gZnJvbSBcIi4vTWVzc2FnZURpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgZG93bmNhc3QgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc3BvcnQ8T3V0Z29pbmdDb21tYW5kVHlwZSwgSW5jb21pbmdDb21tYW5kVHlwZT4ge1xuXHQvKipcblx0ICogUG9zdCBhIG1lc3NhZ2UgdG8gdGhlIG90aGVyIHNpZGUgb2YgdGhlIHRyYW5zcG9ydFxuXHQgKi9cblx0cG9zdE1lc3NhZ2UobWVzc2FnZTogTWVzc2FnZTxPdXRnb2luZ0NvbW1hbmRUeXBlPik6IHZvaWRcblxuXHQvKipcblx0ICogU2V0IHRoZSBoYW5kbGVyIGZvciBtZXNzYWdlcyBjb21pbmcgZnJvbSB0aGUgb3RoZXIgZW5kIG9mIHRoZSB0cmFuc3BvcnRcblx0ICovXG5cdHNldE1lc3NhZ2VIYW5kbGVyKGhhbmRsZXI6IChtZXNzYWdlOiBNZXNzYWdlPEluY29taW5nQ29tbWFuZFR5cGU+KSA9PiB1bmtub3duKTogdW5rbm93blxufVxuXG4vKipcbiAqIFF1ZXVlIHRyYW5zcG9ydCBmb3IgYm90aCBXb3JrZXJDbGllbnQgYW5kIFdvcmtlckltcGxcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYldvcmtlclRyYW5zcG9ydDxPdXRnb2luZ0NvbW1hbmRUeXBlLCBJbmNvbWluZ0NvbW1hbmRUeXBlPiBpbXBsZW1lbnRzIFRyYW5zcG9ydDxPdXRnb2luZ0NvbW1hbmRUeXBlLCBJbmNvbWluZ0NvbW1hbmRUeXBlPiB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgd29ya2VyOiBXb3JrZXIgfCBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSkge31cblxuXHRwb3N0TWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlPE91dGdvaW5nQ29tbWFuZFR5cGU+KTogdm9pZCB7XG5cdFx0cmV0dXJuIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpXG5cdH1cblxuXHRzZXRNZXNzYWdlSGFuZGxlcihoYW5kbGVyOiAobWVzc2FnZTogTWVzc2FnZTxJbmNvbWluZ0NvbW1hbmRUeXBlPikgPT4gdW5rbm93bikge1xuXHRcdHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IChldjogYW55KSA9PiBoYW5kbGVyKGRvd25jYXN0KGV2LmRhdGEpKVxuXHR9XG59XG4iLCJpbXBvcnQgdHlwZSB7IENvbW1hbmRzIH0gZnJvbSBcIi4uL2NvbW1vbi90aHJlYWRpbmcvTWVzc2FnZURpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgTWVzc2FnZURpc3BhdGNoZXIsIFJlcXVlc3QgfSBmcm9tIFwiLi4vY29tbW9uL3RocmVhZGluZy9NZXNzYWdlRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBUcmFuc3BvcnQsIFdlYldvcmtlclRyYW5zcG9ydCB9IGZyb20gXCIuLi9jb21tb24vdGhyZWFkaW5nL1RyYW5zcG9ydC5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuaW1wb3J0IHR5cGUgeyBEZWZlcnJlZE9iamVjdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgZGVmZXIsIGRvd25jYXN0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBoYW5kbGVVbmNhdWdodEVycm9yIH0gZnJvbSBcIi4uLy4uL21pc2MvRXJyb3JIYW5kbGVyXCJcbmltcG9ydCB7IERlbGF5ZWRJbXBscywgZXhwb3NlTG9jYWxEZWxheWVkLCBleHBvc2VSZW1vdGUgfSBmcm9tIFwiLi4vY29tbW9uL1dvcmtlclByb3h5XCJcbmltcG9ydCB0eXBlIHsgUmVzdENsaWVudCB9IGZyb20gXCIuLi93b3JrZXIvcmVzdC9SZXN0Q2xpZW50XCJcbmltcG9ydCB7IEVudHJvcHlEYXRhQ2h1bmsgfSBmcm9tIFwiLi4vd29ya2VyL2ZhY2FkZXMvRW50cm9weUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBvYmpUb0Vycm9yIH0gZnJvbSBcIi4uL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB7IENvbW1vbkxvY2F0b3IgfSBmcm9tIFwiLi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IENvbW1vbldvcmtlckludGVyZmFjZSwgTWFpbkludGVyZmFjZSB9IGZyb20gXCIuLi93b3JrZXIvd29ya2VySW50ZXJmYWNlcy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG50eXBlIFByb2dyZXNzVXBkYXRlciA9IChwcm9ncmVzczogbnVtYmVyKSA9PiB1bmtub3duXG50eXBlIE1haW5SZXF1ZXN0ID0gUmVxdWVzdDxNYWluUmVxdWVzdFR5cGU+XG5cbmV4cG9ydCBjb25zdCBlbnVtIFdzQ29ubmVjdGlvblN0YXRlIHtcblx0Y29ubmVjdGluZyxcblx0Y29ubmVjdGVkLFxuXHR0ZXJtaW5hdGVkLFxufVxuXG5leHBvcnQgY2xhc3MgV29ya2VyQ2xpZW50IHtcblx0cHJpdmF0ZSBfZGVmZXJyZWRJbml0aWFsaXplZDogRGVmZXJyZWRPYmplY3Q8dm9pZD4gPSBkZWZlcigpXG5cdHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZVxuXG5cdHByaXZhdGUgX2Rpc3BhdGNoZXIhOiBNZXNzYWdlRGlzcGF0Y2hlcjxXb3JrZXJSZXF1ZXN0VHlwZSwgTWFpblJlcXVlc3RUeXBlPlxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuaW5pdGlhbGl6ZWQudGhlbigoKSA9PiB7XG5cdFx0XHR0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZVxuXHRcdH0pXG5cdH1cblxuXHRnZXQgaW5pdGlhbGl6ZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2RlZmVycmVkSW5pdGlhbGl6ZWQucHJvbWlzZVxuXHR9XG5cblx0YXN5bmMgaW5pdChsb2NhdG9yOiBDb21tb25Mb2NhdG9yKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKGVudi5tb2RlICE9PSBcIlRlc3RcIikge1xuXHRcdFx0Y29uc3QgeyBwcmVmaXhXaXRob3V0RmlsZSB9ID0gd2luZG93LnR1dGFvLmFwcFN0YXRlXG5cdFx0XHQvLyBJbiBhcHBzL2Rlc2t0b3Agd2UgbG9hZCBIVE1MIGZpbGUgYW5kIHVybCBlbmRzIG9uIHBhdGgvaW5kZXguaHRtbCBzbyB3ZSB3YW50IHRvIGxvYWQgcGF0aC9Xb3JrZXJCb290c3RyYXAuanMuXG5cdFx0XHQvLyBJbiBicm93c2VyIHdlIGxvYWQgYXQgZG9tYWluLmNvbSBvciBsb2NhbGhvc3QvcGF0aCAobG9jYWxseSkgYW5kIHdlIHdhbnQgdG8gbG9hZCBkb21haW4uY29tL1dvcmtlckJvb3RzdHJhcC5qcyBvclxuXHRcdFx0Ly8gbG9jYWxob3N0L3BhdGgvV29ya2VyQm9vdHN0cmFwLmpzIHJlc3BlY3RpdmVseS5cblx0XHRcdC8vIFNlcnZpY2Ugd29ya2VyIGhhcyBzaW1pbGFyIGxvZ2ljIGJ1dCBpdCBoYXMgbHV4dXJ5IG9mIGtub3dpbmcgdGhhdCBpdCdzIHNlcnZlZCBhcyBzdy5qcy5cblx0XHRcdGNvbnN0IHdvcmtlclVybCA9IHByZWZpeFdpdGhvdXRGaWxlICsgXCIvd29ya2VyLWJvb3RzdHJhcC5qc1wiXG5cdFx0XHRjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKHdvcmtlclVybCwgeyB0eXBlOiBcIm1vZHVsZVwiIH0pXG5cdFx0XHR0aGlzLl9kaXNwYXRjaGVyID0gbmV3IE1lc3NhZ2VEaXNwYXRjaGVyKG5ldyBXZWJXb3JrZXJUcmFuc3BvcnQod29ya2VyKSwgdGhpcy5xdWV1ZUNvbW1hbmRzKGxvY2F0b3IpLCBcIm1haW4td29ya2VyXCIpXG5cdFx0XHRhd2FpdCB0aGlzLl9kaXNwYXRjaGVyLnBvc3RSZXF1ZXN0KG5ldyBSZXF1ZXN0KFwic2V0dXBcIiwgW3dpbmRvdy5lbnYsIHRoaXMuZ2V0SW5pdGlhbEVudHJvcHkoKSwgY2xpZW50LmJyb3dzZXJEYXRhKCldKSlcblxuXHRcdFx0d29ya2VyLm9uZXJyb3IgPSAoZTogYW55KSA9PiB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IHNldHVwIHdvcmtlcjogJHtlLm5hbWV9ICR7ZS5zdGFja30gJHtlLm1lc3NhZ2V9ICR7ZX1gKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBub2RlOiB3ZSBkbyBub3QgdXNlIHdvcmtlcnMgYnV0IGNvbm5lY3QgdGhlIGNsaWVudCBhbmQgdGhlIHdvcmtlciBxdWV1ZXMgZGlyZWN0bHkgd2l0aCBlYWNoIG90aGVyXG5cdFx0XHQvLyBhdHRlbnRpb246IGRvIG5vdCBsb2FkIGRpcmVjdGx5IHdpdGggcmVxdWlyZSgpIGhlcmUgYmVjYXVzZSBpbiB0aGUgYnJvd3NlciBTeXN0ZW1KUyB3b3VsZCBsb2FkIHRoZSBXb3JrZXJJbXBsIGluIHRoZSBjbGllbnQgYWx0aG91Z2ggdGhpcyBjb2RlIGlzIG5vdCBleGVjdXRlZFxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0Y29uc3QgV29ya2VySW1wbCA9IGdsb2JhbFRoaXMudGVzdFdvcmtlclxuXHRcdFx0Y29uc3Qgd29ya2VySW1wbCA9IG5ldyBXb3JrZXJJbXBsKHRoaXMsIHRydWUpXG5cdFx0XHRhd2FpdCB3b3JrZXJJbXBsLmluaXQoY2xpZW50LmJyb3dzZXJEYXRhKCkpXG5cdFx0XHR3b3JrZXJJbXBsLl9xdWV1ZS5fdHJhbnNwb3J0ID0ge1xuXHRcdFx0XHRwb3N0TWVzc2FnZTogKG1zZzogYW55KSA9PiB0aGlzLl9kaXNwYXRjaGVyLmhhbmRsZU1lc3NhZ2UobXNnKSxcblx0XHRcdH1cblx0XHRcdHRoaXMuX2Rpc3BhdGNoZXIgPSBuZXcgTWVzc2FnZURpc3BhdGNoZXIoXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwb3N0TWVzc2FnZTogZnVuY3Rpb24gKG1zZzogYW55KSB7XG5cdFx0XHRcdFx0XHR3b3JrZXJJbXBsLl9xdWV1ZS5oYW5kbGVNZXNzYWdlKG1zZylcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9IGFzIFRyYW5zcG9ydDxXb3JrZXJSZXF1ZXN0VHlwZSwgTWFpblJlcXVlc3RUeXBlPixcblx0XHRcdFx0dGhpcy5xdWV1ZUNvbW1hbmRzKGxvY2F0b3IpLFxuXHRcdFx0XHRcIm1haW4td29ya2VyXCIsXG5cdFx0XHQpXG5cdFx0fVxuXG5cdFx0dGhpcy5fZGVmZXJyZWRJbml0aWFsaXplZC5yZXNvbHZlKClcblx0fVxuXG5cdHF1ZXVlQ29tbWFuZHMobG9jYXRvcjogQ29tbW9uTG9jYXRvcik6IENvbW1hbmRzPE1haW5SZXF1ZXN0VHlwZT4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRleGVjTmF0aXZlOiAobWVzc2FnZTogTWFpblJlcXVlc3QpID0+IGxvY2F0b3IubmF0aXZlLmludm9rZU5hdGl2ZShkb3duY2FzdChtZXNzYWdlLmFyZ3NbMF0pLCBkb3duY2FzdChtZXNzYWdlLmFyZ3NbMV0pKSxcblx0XHRcdGVycm9yOiAobWVzc2FnZTogTWFpblJlcXVlc3QpID0+IHtcblx0XHRcdFx0aGFuZGxlVW5jYXVnaHRFcnJvcihvYmpUb0Vycm9yKG1lc3NhZ2UuYXJnc1swXSkpXG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdFx0fSxcblx0XHRcdGZhY2FkZTogZXhwb3NlTG9jYWxEZWxheWVkPERlbGF5ZWRJbXBsczxNYWluSW50ZXJmYWNlPiwgTWFpblJlcXVlc3RUeXBlPih7XG5cdFx0XHRcdGFzeW5jIGxvZ2luTGlzdGVuZXIoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGxvY2F0b3IubG9naW5MaXN0ZW5lclxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhc3luYyB3c0Nvbm5lY3Rpdml0eUxpc3RlbmVyKCkge1xuXHRcdFx0XHRcdHJldHVybiBsb2NhdG9yLmNvbm5lY3Rpdml0eU1vZGVsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFzeW5jIHByb2dyZXNzVHJhY2tlcigpIHtcblx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5wcm9ncmVzc1RyYWNrZXJcblx0XHRcdFx0fSxcblx0XHRcdFx0YXN5bmMgZXZlbnRDb250cm9sbGVyKCkge1xuXHRcdFx0XHRcdHJldHVybiBsb2NhdG9yLmV2ZW50Q29udHJvbGxlclxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhc3luYyBvcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGxvY2F0b3Iub3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFzeW5jIGluZm9NZXNzYWdlSGFuZGxlcigpIHtcblx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5pbmZvTWVzc2FnZUhhbmRsZXJcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdH1cblx0fVxuXG5cdGdldFdvcmtlckludGVyZmFjZSgpOiBDb21tb25Xb3JrZXJJbnRlcmZhY2Uge1xuXHRcdHJldHVybiBleHBvc2VSZW1vdGU8Q29tbW9uV29ya2VySW50ZXJmYWNlPihhc3luYyAocmVxdWVzdCkgPT4gdGhpcy5fcG9zdFJlcXVlc3QocmVxdWVzdCkpXG5cdH1cblxuXHRyZXN0UmVxdWVzdCguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlc3RDbGllbnRbXCJyZXF1ZXN0XCJdPik6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuXHRcdHJldHVybiB0aGlzLl9wb3N0UmVxdWVzdChuZXcgUmVxdWVzdChcInJlc3RSZXF1ZXN0XCIsIGFyZ3MpKVxuXHR9XG5cblx0LyoqIEBwcml2YXRlIHZpc2libGUgZm9yIHRlc3RzICovXG5cdGFzeW5jIF9wb3N0UmVxdWVzdChtc2c6IFJlcXVlc3Q8V29ya2VyUmVxdWVzdFR5cGU+KTogUHJvbWlzZTxhbnk+IHtcblx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVkXG5cdFx0cmV0dXJuIHRoaXMuX2Rpc3BhdGNoZXIucG9zdFJlcXVlc3QobXNnKVxuXHR9XG5cblx0cmVzZXQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3Bvc3RSZXF1ZXN0KG5ldyBSZXF1ZXN0KFwicmVzZXRcIiwgW10pKVxuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBkYXRhIGZyb20gZWl0aGVyIHNlY3VyZSByYW5kb20gc291cmNlIG9yIE1hdGgucmFuZG9tIGFzIGVudHJvcHkuXG5cdCAqL1xuXHRwcml2YXRlIGdldEluaXRpYWxFbnRyb3B5KCk6IEFycmF5PEVudHJvcHlEYXRhQ2h1bms+IHtcblx0XHRjb25zdCB2YWx1ZUxpc3QgPSBuZXcgVWludDMyQXJyYXkoMTYpXG5cdFx0Y3J5cHRvLmdldFJhbmRvbVZhbHVlcyh2YWx1ZUxpc3QpXG5cdFx0Y29uc3QgZW50cm9weTogQXJyYXk8RW50cm9weURhdGFDaHVuaz4gPSBbXVxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZUxpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdC8vIDMyIGJlY2F1c2Ugd2UgaGF2ZSAzMi1iaXQgdmFsdWVzIFVpbnQzMkFycmF5XG5cdFx0XHRlbnRyb3B5LnB1c2goe1xuXHRcdFx0XHRzb3VyY2U6IFwicmFuZG9tXCIsXG5cdFx0XHRcdGVudHJvcHk6IDMyLFxuXHRcdFx0XHRkYXRhOiB2YWx1ZUxpc3RbaV0sXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBlbnRyb3B5XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvb3RzdHJhcFdvcmtlcihsb2NhdG9yOiBDb21tb25Mb2NhdG9yKTogV29ya2VyQ2xpZW50IHtcblx0Y29uc3Qgd29ya2VyID0gbmV3IFdvcmtlckNsaWVudCgpXG5cdGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKVxuXHR3b3JrZXIuaW5pdChsb2NhdG9yKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwid29ya2VyIGluaXQgdGltZSAobXMpOlwiLCBEYXRlLm5vdygpIC0gc3RhcnQpKVxuXHRyZXR1cm4gd29ya2VyXG59XG4iLCJpbXBvcnQgeyBhc3NlcnRXb3JrZXJPck5vZGUgfSBmcm9tIFwiLi4vY29tbW9uL0VudlwiXG5pbXBvcnQge1xuXHRBY2Nlc3NCbG9ja2VkRXJyb3IsXG5cdEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IsXG5cdENvbm5lY3Rpb25FcnJvcixcblx0aGFuZGxlUmVzdEVycm9yLFxuXHROb3RBdXRob3JpemVkRXJyb3IsXG5cdFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yLFxuXHRTZXNzaW9uRXhwaXJlZEVycm9yLFxufSBmcm9tIFwiLi4vY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQge1xuXHRjcmVhdGVXZWJzb2NrZXRMZWFkZXJTdGF0dXMsXG5cdEVudGl0eUV2ZW50QmF0Y2gsXG5cdEVudGl0eUV2ZW50QmF0Y2hUeXBlUmVmLFxuXHRFbnRpdHlVcGRhdGUsXG5cdFdlYnNvY2tldENvdW50ZXJEYXRhLFxuXHRXZWJzb2NrZXRDb3VudGVyRGF0YVR5cGVSZWYsXG5cdFdlYnNvY2tldEVudGl0eURhdGEsXG5cdFdlYnNvY2tldEVudGl0eURhdGFUeXBlUmVmLFxuXHRXZWJzb2NrZXRMZWFkZXJTdGF0dXMsXG5cdFdlYnNvY2tldExlYWRlclN0YXR1c1R5cGVSZWYsXG59IGZyb20gXCIuLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgYmluYXJ5U2VhcmNoLCBkZWxheSwgZ2V0VHlwZUlkLCBpZGVudGl0eSwgbGFzdFRocm93LCBvZkNsYXNzLCBwcm9taXNlRmlsdGVyLCByYW5kb21JbnRGcm9tSW50ZXJ2YWwsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IE91dE9mU3luY0Vycm9yIH0gZnJvbSBcIi4uL2NvbW1vbi9lcnJvci9PdXRPZlN5bmNFcnJvclwiXG5pbXBvcnQgeyBDbG9zZUV2ZW50QnVzT3B0aW9uLCBHcm91cFR5cGUsIFNFQ09ORF9NUyB9IGZyb20gXCIuLi9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vY29tbW9uL2Vycm9yL0NhbmNlbGxlZEVycm9yXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB0eXBlIHsgUXVldWVkQmF0Y2ggfSBmcm9tIFwiLi9FdmVudFF1ZXVlLmpzXCJcbmltcG9ydCB7IEV2ZW50UXVldWUgfSBmcm9tIFwiLi9FdmVudFF1ZXVlLmpzXCJcbmltcG9ydCB7IFByb2dyZXNzTW9uaXRvckRlbGVnYXRlIH0gZnJvbSBcIi4vUHJvZ3Jlc3NNb25pdG9yRGVsZWdhdGVcIlxuaW1wb3J0IHsgY29tcGFyZU9sZGVzdEZpcnN0LCBHRU5FUkFURURfTUFYX0lELCBHRU5FUkFURURfTUlOX0lELCBnZXRFbGVtZW50SWQsIGdldExpc3RJZCB9IGZyb20gXCIuLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHsgSW5zdGFuY2VNYXBwZXIgfSBmcm9tIFwiLi9jcnlwdG8vSW5zdGFuY2VNYXBwZXJcIlxuaW1wb3J0IHsgV3NDb25uZWN0aW9uU3RhdGUgfSBmcm9tIFwiLi4vbWFpbi9Xb3JrZXJDbGllbnRcIlxuaW1wb3J0IHsgRW50aXR5UmVzdENhY2hlIH0gZnJvbSBcIi4vcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB7IFNsZWVwRGV0ZWN0b3IgfSBmcm9tIFwiLi91dGlscy9TbGVlcERldGVjdG9yLmpzXCJcbmltcG9ydCBzeXNNb2RlbEluZm8gZnJvbSBcIi4uL2VudGl0aWVzL3N5cy9Nb2RlbEluZm8uanNcIlxuaW1wb3J0IHR1dGFub3RhTW9kZWxJbmZvIGZyb20gXCIuLi9lbnRpdGllcy90dXRhbm90YS9Nb2RlbEluZm8uanNcIlxuaW1wb3J0IHsgcmVzb2x2ZVR5cGVSZWZlcmVuY2UgfSBmcm9tIFwiLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBQaGlzaGluZ01hcmtlcldlYnNvY2tldERhdGEsIFBoaXNoaW5nTWFya2VyV2Vic29ja2V0RGF0YVR5cGVSZWYsIFJlcG9ydGVkTWFpbEZpZWxkTWFya2VyIH0gZnJvbSBcIi4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzXCJcbmltcG9ydCB7IFVzZXJGYWNhZGUgfSBmcm9tIFwiLi9mYWNhZGVzL1VzZXJGYWNhZGVcIlxuaW1wb3J0IHsgRXhwb3NlZFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi9tYWluL1Byb2dyZXNzVHJhY2tlci5qc1wiXG5cbmFzc2VydFdvcmtlck9yTm9kZSgpXG5cbmV4cG9ydCBjb25zdCBlbnVtIEV2ZW50QnVzU3RhdGUge1xuXHRBdXRvbWF0aWMgPSBcImF1dG9tYXRpY1wiLFxuXHQvLyBhdXRvbWF0aWMgcmVjb25uZWN0aW9uIGlzIGVuYWJsZWRcblx0U3VzcGVuZGVkID0gXCJzdXNwZW5kZWRcIixcblx0Ly8gYXV0b21hdGljIHJlY29ubmVjdGlvbiBpcyBzdXNwZW5kZWQgYnV0IGNhbiBiZSBlbmFibGVkIGFnYWluXG5cdFRlcm1pbmF0ZWQgPSBcInRlcm1pbmF0ZWRcIiwgLy8gYXV0b21hdGljIHJlY29ubmVjdGlvbiBpcyBkaXNhYmxlZCBhbmQgd2Vic29ja2V0IGlzIGNsb3NlZCBidXQgY2FuIGJlIG9wZW5lZCBhZ2FpbiBieSBjYWxsaW5nIGNvbm5lY3QgZXhwbGljaXRcbn1cblxuLy8gRW50aXR5RXZlbnRCYXRjaGVzIGV4cGlyZSBhZnRlciA0NSBkYXlzLiBrZWVwIGEgdGltZSBkaWZmIHNlY3VyaXR5IG9mIG9uZSBkYXkuXG5leHBvcnQgY29uc3QgRU5USVRZX0VWRU5UX0JBVENIX0VYUElSRV9NUyA9IDQ0ICogMjQgKiA2MCAqIDYwICogMTAwMFxuY29uc3QgUkVUUllfQUZURVJfU0VSVklDRV9VTkFWQUlMQUJMRV9FUlJPUl9NUyA9IDMwMDAwXG5jb25zdCBOT1JNQUxfU0hVVERPV05fQ0xPU0VfQ09ERSA9IDFcbi8qKlxuICogUmVjb25uZWN0aW9uIGludGVydmFsIGJvdW5kcy4gV2hlbiB3ZSByZWNvbm5lY3Qgd2UgcGljayBhIHJhbmRvbSBudW1iZXIgb2Ygc2Vjb25kcyBpbiBhIHJhbmdlIHRvIHByZXZlbnQgdGhhdCBhbGwgdGhlIGNsaWVudHMgY29ubmVjdCBhdCB0aGUgc2FtZSB0aW1lIHdoaWNoXG4gKiB3b3VsZCBwdXQgdW5uZWNlc3NhcnkgbG9hZCBvbiB0aGUgc2VydmVyLlxuICogVGhlIHJhbmdlIGRlcGVuZHMgb24gdGhlIG51bWJlciBvZiBhdHRlbXB0cyBhbmQgdGhlIHNlcnZlciByZXNwb25zZS5cbiAqICovXG5jb25zdCBSRUNPTk5FQ1RfSU5URVJWQUwgPSBPYmplY3QuZnJlZXplKHtcblx0U01BTEw6IFs1LCAxMF0sXG5cdE1FRElVTTogWzIwLCA0MF0sXG5cdExBUkdFOiBbNjAsIDEyMF0sXG59IGFzIGNvbnN0KVxuLy8gd2Ugc3RvcmUgdGhlIGxhc3QgMTAwMCBldmVudCBpZHMgcGVyIGdyb3VwLCBzbyB3ZSBrbm93IGlmIGFuIGV2ZW50IHdhcyBhbHJlYWR5IHByb2Nlc3NlZC5cbi8vIGl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGNoZWNrIHRoZSBsYXN0IGV2ZW50IGlkIGJlY2F1c2UgYSBzbWFsbGVyIGV2ZW50IGlkIG1heSBhcnJpdmUgbGF0ZXJcbi8vIHRoYW4gYSBiaWdnZXIgb25lIGlmIHRoZSByZXF1ZXN0cyBhcmUgcHJvY2Vzc2VkIGluIHBhcmFsbGVsIG9uIHRoZSBzZXJ2ZXJcbmNvbnN0IE1BWF9FVkVOVF9JRFNfUVVFVUVfTEVOR1RIID0gMTAwMFxuXG4vKiogS25vd24gdHlwZXMgb2YgbWVzc2FnZXMgdGhhdCBjYW4gYmUgcmVjZWl2ZWQgb3ZlciB3ZWJzb2NrZXQuICovXG5jb25zdCBlbnVtIE1lc3NhZ2VUeXBlIHtcblx0RW50aXR5VXBkYXRlID0gXCJlbnRpdHlVcGRhdGVcIixcblx0VW5yZWFkQ291bnRlclVwZGF0ZSA9IFwidW5yZWFkQ291bnRlclVwZGF0ZVwiLFxuXHRQaGlzaGluZ01hcmtlcnMgPSBcInBoaXNoaW5nTWFya2Vyc1wiLFxuXHRMZWFkZXJTdGF0dXMgPSBcImxlYWRlclN0YXR1c1wiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb25uZWN0TW9kZSB7XG5cdEluaXRpYWwsXG5cdFJlY29ubmVjdCxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudEJ1c0xpc3RlbmVyIHtcblx0b25XZWJzb2NrZXRTdGF0ZUNoYW5nZWQoc3RhdGU6IFdzQ29ubmVjdGlvblN0YXRlKTogdW5rbm93blxuXG5cdG9uQ291bnRlckNoYW5nZWQoY291bnRlcjogV2Vic29ja2V0Q291bnRlckRhdGEpOiB1bmtub3duXG5cblx0b25MZWFkZXJTdGF0dXNDaGFuZ2VkKGxlYWRlclN0YXR1czogV2Vic29ja2V0TGVhZGVyU3RhdHVzKTogdW5rbm93blxuXG5cdG9uRW50aXR5RXZlbnRzUmVjZWl2ZWQoZXZlbnRzOiBFbnRpdHlVcGRhdGVbXSwgYmF0Y2hJZDogSWQsIGdyb3VwSWQ6IElkKTogUHJvbWlzZTx2b2lkPlxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gbWFya2VycyBvbmx5IHBoaXNoaW5nIChub3Qgc3BhbSkgbWFya2VycyB3aWxsIGJlIHNlbnQgYXMgZXZlbnQgYnVzIHVwZGF0ZXNcblx0ICovXG5cdG9uUGhpc2hpbmdNYXJrZXJzUmVjZWl2ZWQobWFya2VyczogUmVwb3J0ZWRNYWlsRmllbGRNYXJrZXJbXSk6IHVua25vd25cblxuXHRvbkVycm9yKHR1dGFub3RhRXJyb3I6IEVycm9yKTogdm9pZFxufVxuXG5leHBvcnQgY2xhc3MgRXZlbnRCdXNDbGllbnQge1xuXHRwcml2YXRlIHN0YXRlOiBFdmVudEJ1c1N0YXRlXG5cdHByaXZhdGUgc29ja2V0OiBXZWJTb2NrZXQgfCBudWxsXG5cdHByaXZhdGUgaW1tZWRpYXRlUmVjb25uZWN0OiBib29sZWFuID0gZmFsc2UgLy8gaWYgdHJ1ZSB0cmllcyB0byByZWNvbm5lY3QgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIHdlYnNvY2tldCBpcyBjbG9zZWRcblxuXHQvKipcblx0ICogTWFwIGZyb20gZ3JvdXAgaWQgdG8gbGFzdCBldmVudCBpZHMgKG1heC4gX01BWF9FVkVOVF9JRFNfUVVFVUVfTEVOR1RIKS4gV2Uga2VlcCB0aGVtIHRvIGF2b2lkIHByb2Nlc3NpbmcgdGhlIHNhbWUgZXZlbnQgdHdpY2UgaWZcblx0ICogaXQgY29tZXMgb3V0IG9mIG9yZGVyIGZyb20gdGhlIHNlcnZlcikgYW5kIGZvciByZXF1ZXN0aW5nIG1pc3NlZCBlbnRpdHkgZXZlbnRzIG9uIHJlY29ubmVjdC5cblx0ICpcblx0ICogV2UgZG8gbm90IGhhdmUgdG8gdXBkYXRlIHRoZXNlIGV2ZW50IGlkcyBpZiB0aGUgZ3JvdXBzIG9mIHRoZSB1c2VyIGNoYW5nZSBiZWNhdXNlIHdlIGFsd2F5cyB0YWtlIHRoZSBjdXJyZW50IHVzZXJzIGdyb3VwcyBmcm9tIHRoZVxuXHQgKiBMb2dpbkZhY2FkZS5cblx0ICovXG5cdHByaXZhdGUgbGFzdEVudGl0eUV2ZW50SWRzOiBNYXA8SWQsIEFycmF5PElkPj5cblxuXHQvKipcblx0ICogTGFzdCBiYXRjaCB3aGljaCB3YXMgYWN0dWFsbHkgYWRkZWQgdG8gdGhlIHF1ZXVlLiBXZSBuZWVkIGl0IHRvIGZpbmQgb3V0IHdoZW4gdGhlIGdyb3VwIGlzIHByb2Nlc3NlZFxuXHQgKi9cblx0cHJpdmF0ZSBsYXN0QWRkZWRCYXRjaEZvckdyb3VwOiBNYXA8SWQsIElkPlxuXG5cdHByaXZhdGUgbGFzdEFudGlwaGlzaGluZ01hcmtlcnNJZDogSWQgfCBudWxsID0gbnVsbFxuXG5cdC8qKiBRdWV1ZSB0byBwcm9jZXNzIGFsbCBldmVudHMuICovXG5cdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRRdWV1ZTogRXZlbnRRdWV1ZVxuXG5cdC8qKiBRdWV1ZSB0aGF0IGhhbmRsZXMgaW5jb21pbmcgd2Vic29ja2V0IG1lc3NhZ2VzIG9ubHkuIENhY2hlcyB0aGVtIHVudGlsIHdlIHByb2Nlc3MgZG93bmxvYWRlZCBvbmVzIGFuZCB0aGVuIGFkZHMgdGhlbSB0byBldmVudFF1ZXVlLiAqL1xuXHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eVVwZGF0ZU1lc3NhZ2VRdWV1ZTogRXZlbnRRdWV1ZVxuXHRwcml2YXRlIHJlY29ubmVjdFRpbWVyOiBUaW1lb3V0SUQgfCBudWxsXG5cdHByaXZhdGUgY29ubmVjdFRpbWVyOiBUaW1lb3V0SUQgfCBudWxsXG5cblx0LyoqXG5cdCAqIFJlcHJlc2VudHMgYSBjdXJyZW50bHkgcmV0cmllZCBleGVjdXRpbmcgZHVlIHRvIGEgU2VydmljZVVuYXZhaWxhYmxlRXJyb3Jcblx0ICovXG5cdHByaXZhdGUgc2VydmljZVVuYXZhaWxhYmxlUmV0cnk6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGZhaWxlZENvbm5lY3Rpb25BdHRlbXB0czogbnVtYmVyID0gMFxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbGlzdGVuZXI6IEV2ZW50QnVzTGlzdGVuZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYWNoZTogRW50aXR5UmVzdENhY2hlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eTogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc29ja2V0RmFjdG9yeTogKHBhdGg6IHN0cmluZykgPT4gV2ViU29ja2V0LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2xlZXBEZXRlY3RvcjogU2xlZXBEZXRlY3Rvcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHByb2dyZXNzVHJhY2tlcjogRXhwb3NlZFByb2dyZXNzVHJhY2tlcixcblx0KSB7XG5cdFx0Ly8gV2UgYXJlIG5vdCBjb25uZWN0ZWQgYnkgZGVmYXVsdCBhbmQgd2lsbCBub3QgdHJ5IHRvIHVubGVzcyBjb25uZWN0KCkgaXMgY2FsbGVkXG5cdFx0dGhpcy5zdGF0ZSA9IEV2ZW50QnVzU3RhdGUuVGVybWluYXRlZFxuXHRcdHRoaXMubGFzdEVudGl0eUV2ZW50SWRzID0gbmV3IE1hcCgpXG5cdFx0dGhpcy5sYXN0QWRkZWRCYXRjaEZvckdyb3VwID0gbmV3IE1hcCgpXG5cdFx0dGhpcy5zb2NrZXQgPSBudWxsXG5cdFx0dGhpcy5yZWNvbm5lY3RUaW1lciA9IG51bGxcblx0XHR0aGlzLmNvbm5lY3RUaW1lciA9IG51bGxcblx0XHR0aGlzLmV2ZW50UXVldWUgPSBuZXcgRXZlbnRRdWV1ZShcIndzX29wdFwiLCB0cnVlLCAobW9kaWZpY2F0aW9uKSA9PiB0aGlzLmV2ZW50UXVldWVDYWxsYmFjayhtb2RpZmljYXRpb24pKVxuXHRcdHRoaXMuZW50aXR5VXBkYXRlTWVzc2FnZVF1ZXVlID0gbmV3IEV2ZW50UXVldWUoXCJ3c19tc2dcIiwgZmFsc2UsIChiYXRjaCkgPT4gdGhpcy5lbnRpdHlVcGRhdGVNZXNzYWdlUXVldWVDYWxsYmFjayhiYXRjaCkpXG5cdFx0dGhpcy5yZXNldCgpXG5cdH1cblxuXHRwcml2YXRlIHJlc2V0KCkge1xuXHRcdHRoaXMuaW1tZWRpYXRlUmVjb25uZWN0ID0gZmFsc2VcblxuXHRcdHRoaXMubGFzdEVudGl0eUV2ZW50SWRzLmNsZWFyKClcblxuXHRcdHRoaXMubGFzdEFkZGVkQmF0Y2hGb3JHcm91cC5jbGVhcigpXG5cblx0XHR0aGlzLmV2ZW50UXVldWUucGF1c2UoKVxuXG5cdFx0dGhpcy5ldmVudFF1ZXVlLmNsZWFyKClcblxuXHRcdHRoaXMuc2VydmljZVVuYXZhaWxhYmxlUmV0cnkgPSBudWxsXG5cdH1cblxuXHQvKipcblx0ICogT3BlbnMgYSBXZWJTb2NrZXQgY29ubmVjdGlvbiB0byByZWNlaXZlIHNlcnZlciBldmVudHMuXG5cdCAqIEBwYXJhbSBjb25uZWN0TW9kZVxuXHQgKi9cblx0Y29ubmVjdChjb25uZWN0TW9kZTogQ29ubmVjdE1vZGUpIHtcblx0XHRjb25zb2xlLmxvZyhcIndzIGNvbm5lY3QgcmVjb25uZWN0OlwiLCBjb25uZWN0TW9kZSA9PT0gQ29ubmVjdE1vZGUuUmVjb25uZWN0LCBcInN0YXRlOlwiLCB0aGlzLnN0YXRlKVxuXHRcdC8vIG1ha2Ugc3VyZSBhIHJldHJ5IHdpbGwgYmUgY2FuY2VsbGVkIGJ5IHNldHRpbmcgX3NlcnZpY2VVbmF2YWlsYWJsZVJldHJ5IHRvIG51bGxcblx0XHR0aGlzLnNlcnZpY2VVbmF2YWlsYWJsZVJldHJ5ID0gbnVsbFxuXG5cdFx0dGhpcy5saXN0ZW5lci5vbldlYnNvY2tldFN0YXRlQ2hhbmdlZChXc0Nvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nKVxuXG5cdFx0dGhpcy5zdGF0ZSA9IEV2ZW50QnVzU3RhdGUuQXV0b21hdGljXG5cdFx0dGhpcy5jb25uZWN0VGltZXIgPSBudWxsXG5cblx0XHRjb25zdCBhdXRoSGVhZGVycyA9IHRoaXMudXNlckZhY2FkZS5jcmVhdGVBdXRoSGVhZGVycygpXG5cblx0XHQvLyBOYXRpdmUgcXVlcnkgYnVpbGRpbmcgaXMgbm90IHN1cHBvcnRlZCBpbiBvbGQgYnJvd3NlciwgbWl0aHJpbCBpcyBub3QgYXZhaWxhYmxlIGluIHRoZSB3b3JrZXJcblx0XHRjb25zdCBhdXRoUXVlcnkgPVxuXHRcdFx0XCJtb2RlbFZlcnNpb25zPVwiICtcblx0XHRcdHN5c01vZGVsSW5mby52ZXJzaW9uICtcblx0XHRcdFwiLlwiICtcblx0XHRcdHR1dGFub3RhTW9kZWxJbmZvLnZlcnNpb24gK1xuXHRcdFx0XCImY2xpZW50VmVyc2lvbj1cIiArXG5cdFx0XHRlbnYudmVyc2lvbk51bWJlciArXG5cdFx0XHRcIiZ1c2VySWQ9XCIgK1xuXHRcdFx0dGhpcy51c2VyRmFjYWRlLmdldExvZ2dlZEluVXNlcigpLl9pZCArXG5cdFx0XHRcIiZhY2Nlc3NUb2tlbj1cIiArXG5cdFx0XHRhdXRoSGVhZGVycy5hY2Nlc3NUb2tlbiArXG5cdFx0XHQodGhpcy5sYXN0QW50aXBoaXNoaW5nTWFya2Vyc0lkID8gXCImbGFzdFBoaXNoaW5nTWFya2Vyc0lkPVwiICsgdGhpcy5sYXN0QW50aXBoaXNoaW5nTWFya2Vyc0lkIDogXCJcIilcblx0XHRjb25zdCBwYXRoID0gXCIvZXZlbnQ/XCIgKyBhdXRoUXVlcnlcblxuXHRcdHRoaXMudW5zdWJzY3JpYmVGcm9tT2xkV2Vic29ja2V0KClcblxuXHRcdHRoaXMuc29ja2V0ID0gdGhpcy5zb2NrZXRGYWN0b3J5KHBhdGgpXG5cdFx0dGhpcy5zb2NrZXQub25vcGVuID0gKCkgPT4gdGhpcy5vbk9wZW4oY29ubmVjdE1vZGUpXG5cdFx0dGhpcy5zb2NrZXQub25jbG9zZSA9IChldmVudDogQ2xvc2VFdmVudCkgPT4gdGhpcy5vbkNsb3NlKGV2ZW50KVxuXHRcdHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZXJyb3I6IGFueSkgPT4gdGhpcy5vbkVycm9yKGVycm9yKVxuXHRcdHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IChtZXNzYWdlOiBNZXNzYWdlRXZlbnQ8c3RyaW5nPikgPT4gdGhpcy5vbk1lc3NhZ2UobWVzc2FnZSlcblxuXHRcdHRoaXMuc2xlZXBEZXRlY3Rvci5zdGFydCgoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIndzIHNsZWVwIGRldGVjdGVkLCByZWNvbm5lY3RpbmcuLi5cIilcblx0XHRcdHRoaXMudHJ5UmVjb25uZWN0KHRydWUsIHRydWUpXG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBTZW5kcyBhIGNsb3NlIGV2ZW50IHRvIHRoZSBzZXJ2ZXIgYW5kIGZpbmFsbHkgY2xvc2VzIHRoZSBjb25uZWN0aW9uLlxuXHQgKiBUaGUgc3RhdGUgb2YgdGhpcyBldmVudCBidXMgY2xpZW50IGlzIHJlc2V0IGFuZCB0aGUgY2xpZW50IGlzIHRlcm1pbmF0ZWQgKGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgcmVjb25uZWN0KSBleGNlcHQgcmVjb25uZWN0ID09IHRydWVcblx0ICovXG5cdGFzeW5jIGNsb3NlKGNsb3NlT3B0aW9uOiBDbG9zZUV2ZW50QnVzT3B0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc29sZS5sb2coXCJ3cyBjbG9zZSBjbG9zZU9wdGlvbjogXCIsIGNsb3NlT3B0aW9uLCBcInN0YXRlOlwiLCB0aGlzLnN0YXRlKVxuXG5cdFx0c3dpdGNoIChjbG9zZU9wdGlvbikge1xuXHRcdFx0Y2FzZSBDbG9zZUV2ZW50QnVzT3B0aW9uLlRlcm1pbmF0ZTpcblx0XHRcdFx0dGhpcy50ZXJtaW5hdGUoKVxuXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgQ2xvc2VFdmVudEJ1c09wdGlvbi5QYXVzZTpcblx0XHRcdFx0dGhpcy5zdGF0ZSA9IEV2ZW50QnVzU3RhdGUuU3VzcGVuZGVkXG5cblx0XHRcdFx0dGhpcy5saXN0ZW5lci5vbldlYnNvY2tldFN0YXRlQ2hhbmdlZChXc0Nvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nKVxuXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgQ2xvc2VFdmVudEJ1c09wdGlvbi5SZWNvbm5lY3Q6XG5cdFx0XHRcdHRoaXMubGlzdGVuZXIub25XZWJzb2NrZXRTdGF0ZUNoYW5nZWQoV3NDb25uZWN0aW9uU3RhdGUuY29ubmVjdGluZylcblxuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHRoaXMuc29ja2V0Py5jbG9zZSgpXG5cdH1cblxuXHRhc3luYyB0cnlSZWNvbm5lY3QoY2xvc2VJZk9wZW46IGJvb2xlYW4sIGVuYWJsZUF1dG9tYXRpY1N0YXRlOiBib29sZWFuLCBkZWxheTogbnVtYmVyIHwgbnVsbCA9IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zb2xlLmxvZyhcIndzIHRyeVJlY29ubmVjdCBjbG9zZUlmT3BlbjpcIiwgY2xvc2VJZk9wZW4sIFwiZW5hYmxlQXV0b21hdGljU3RhdGU6XCIsIGVuYWJsZUF1dG9tYXRpY1N0YXRlLCBcImRlbGF5OlwiLCBkZWxheSlcblxuXHRcdGlmICh0aGlzLnJlY29ubmVjdFRpbWVyKSB7XG5cdFx0XHQvLyBwcmV2ZW50IHJlY29ubmVjdCByYWNlLWNvbmRpdGlvblxuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucmVjb25uZWN0VGltZXIpXG5cdFx0XHR0aGlzLnJlY29ubmVjdFRpbWVyID0gbnVsbFxuXHRcdH1cblxuXHRcdGlmICghZGVsYXkpIHtcblx0XHRcdHRoaXMucmVjb25uZWN0KGNsb3NlSWZPcGVuLCBlbmFibGVBdXRvbWF0aWNTdGF0ZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5yZWNvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZWNvbm5lY3QoY2xvc2VJZk9wZW4sIGVuYWJsZUF1dG9tYXRpY1N0YXRlKSwgZGVsYXkpXG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuaW5nIHByb21pc2UgZm9yIHRlc3RzXG5cdHByaXZhdGUgb25PcGVuKGNvbm5lY3RNb2RlOiBDb25uZWN0TW9kZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuZmFpbGVkQ29ubmVjdGlvbkF0dGVtcHRzID0gMFxuXHRcdGNvbnNvbGUubG9nKFwid3Mgb3BlbiBzdGF0ZTpcIiwgdGhpcy5zdGF0ZSlcblxuXHRcdGNvbnN0IHAgPSB0aGlzLmluaXRFbnRpdHlFdmVudHMoY29ubmVjdE1vZGUpXG5cblx0XHR0aGlzLmxpc3RlbmVyLm9uV2Vic29ja2V0U3RhdGVDaGFuZ2VkKFdzQ29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZClcblxuXHRcdHJldHVybiBwXG5cdH1cblxuXHRwcml2YXRlIG9uRXJyb3IoZXJyb3I6IGFueSkge1xuXHRcdGNvbnNvbGUubG9nKFwid3MgZXJyb3I6XCIsIGVycm9yLCBKU09OLnN0cmluZ2lmeShlcnJvciksIFwic3RhdGU6XCIsIHRoaXMuc3RhdGUpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIG9uTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlRXZlbnQ8c3RyaW5nPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IFt0eXBlLCB2YWx1ZV0gPSBtZXNzYWdlLmRhdGEuc3BsaXQoXCI7XCIpXG5cblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgTWVzc2FnZVR5cGUuRW50aXR5VXBkYXRlOiB7XG5cdFx0XHRcdGNvbnN0IHsgZXZlbnRCYXRjaElkLCBldmVudEJhdGNoT3duZXIsIGV2ZW50QmF0Y2ggfTogV2Vic29ja2V0RW50aXR5RGF0YSA9IGF3YWl0IHRoaXMuaW5zdGFuY2VNYXBwZXIuZGVjcnlwdEFuZE1hcFRvSW5zdGFuY2UoXG5cdFx0XHRcdFx0YXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UoV2Vic29ja2V0RW50aXR5RGF0YVR5cGVSZWYpLFxuXHRcdFx0XHRcdEpTT04ucGFyc2UodmFsdWUpLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdClcblx0XHRcdFx0Y29uc3QgZmlsdGVyZWRFbnRpdHlVcGRhdGVzID0gYXdhaXQgdGhpcy5yZW1vdmVVbmtub3duVHlwZXMoZXZlbnRCYXRjaClcblx0XHRcdFx0dGhpcy5lbnRpdHlVcGRhdGVNZXNzYWdlUXVldWUuYWRkKGV2ZW50QmF0Y2hJZCwgZXZlbnRCYXRjaE93bmVyLCBmaWx0ZXJlZEVudGl0eVVwZGF0ZXMpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRjYXNlIE1lc3NhZ2VUeXBlLlVucmVhZENvdW50ZXJVcGRhdGU6IHtcblx0XHRcdFx0Y29uc3QgY291bnRlckRhdGE6IFdlYnNvY2tldENvdW50ZXJEYXRhID0gYXdhaXQgdGhpcy5pbnN0YW5jZU1hcHBlci5kZWNyeXB0QW5kTWFwVG9JbnN0YW5jZShcblx0XHRcdFx0XHRhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShXZWJzb2NrZXRDb3VudGVyRGF0YVR5cGVSZWYpLFxuXHRcdFx0XHRcdEpTT04ucGFyc2UodmFsdWUpLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdClcblx0XHRcdFx0dGhpcy5saXN0ZW5lci5vbkNvdW50ZXJDaGFuZ2VkKGNvdW50ZXJEYXRhKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSBNZXNzYWdlVHlwZS5QaGlzaGluZ01hcmtlcnM6IHtcblx0XHRcdFx0Y29uc3QgZGF0YTogUGhpc2hpbmdNYXJrZXJXZWJzb2NrZXREYXRhID0gYXdhaXQgdGhpcy5pbnN0YW5jZU1hcHBlci5kZWNyeXB0QW5kTWFwVG9JbnN0YW5jZShcblx0XHRcdFx0XHRhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShQaGlzaGluZ01hcmtlcldlYnNvY2tldERhdGFUeXBlUmVmKSxcblx0XHRcdFx0XHRKU09OLnBhcnNlKHZhbHVlKSxcblx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHQpXG5cdFx0XHRcdHRoaXMubGFzdEFudGlwaGlzaGluZ01hcmtlcnNJZCA9IGRhdGEubGFzdElkXG5cdFx0XHRcdHRoaXMubGlzdGVuZXIub25QaGlzaGluZ01hcmtlcnNSZWNlaXZlZChkYXRhLm1hcmtlcnMpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRjYXNlIE1lc3NhZ2VUeXBlLkxlYWRlclN0YXR1czoge1xuXHRcdFx0XHRjb25zdCBkYXRhOiBXZWJzb2NrZXRMZWFkZXJTdGF0dXMgPSBhd2FpdCB0aGlzLmluc3RhbmNlTWFwcGVyLmRlY3J5cHRBbmRNYXBUb0luc3RhbmNlKFxuXHRcdFx0XHRcdGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKFdlYnNvY2tldExlYWRlclN0YXR1c1R5cGVSZWYpLFxuXHRcdFx0XHRcdEpTT04ucGFyc2UodmFsdWUpLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdClcblx0XHRcdFx0YXdhaXQgdGhpcy51c2VyRmFjYWRlLnNldExlYWRlclN0YXR1cyhkYXRhKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmxpc3RlbmVyLm9uTGVhZGVyU3RhdHVzQ2hhbmdlZChkYXRhKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0Y29uc29sZS5sb2coXCJ3cyBtZXNzYWdlIHdpdGggdW5rbm93biB0eXBlXCIsIHR5cGUpXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEZpbHRlcnMgb3V0IHNwZWNpZmljIHR5cGVzIGZyb20gQHBhcmFtIGVudGl0eVVwZGF0ZXMgdGhhdCB0aGUgY2xpZW50IGRvZXMgbm90IGFjdHVhbGx5IGtub3cgYWJvdXRcblx0ICogKHRoYXQgYXJlIG5vdCBpbiB0dXRhbm90YVR5cGVzKSwgYW5kIHdoaWNoIHNob3VsZCB0aGVyZWZvcmUgbm90IGJlIHByb2Nlc3NlZC5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVtb3ZlVW5rbm93blR5cGVzKGV2ZW50QmF0Y2g6IEVudGl0eVVwZGF0ZVtdKTogUHJvbWlzZTxFbnRpdHlVcGRhdGVbXT4ge1xuXHRcdHJldHVybiBwcm9taXNlRmlsdGVyKGV2ZW50QmF0Y2gsIGFzeW5jIChlbnRpdHlVcGRhdGUpID0+IHtcblx0XHRcdGNvbnN0IHR5cGVSZWYgPSBuZXcgVHlwZVJlZihlbnRpdHlVcGRhdGUuYXBwbGljYXRpb24sIGVudGl0eVVwZGF0ZS50eXBlKVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdH0gY2F0Y2ggKF9lcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJpZ25vcmluZyBlbnRpdHlFdmVudFVwZGF0ZSBmb3IgdW5rbm93biB0eXBlIHdpdGggdHlwZUlkXCIsIGdldFR5cGVJZCh0eXBlUmVmKSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgb25DbG9zZShldmVudDogQ2xvc2VFdmVudCkge1xuXHRcdHRoaXMuZmFpbGVkQ29ubmVjdGlvbkF0dGVtcHRzKytcblx0XHRjb25zb2xlLmxvZyhcIndzIGNsb3NlIGV2ZW50OlwiLCBldmVudCwgXCJzdGF0ZTpcIiwgdGhpcy5zdGF0ZSlcblxuXHRcdHRoaXMudXNlckZhY2FkZS5zZXRMZWFkZXJTdGF0dXMoXG5cdFx0XHRjcmVhdGVXZWJzb2NrZXRMZWFkZXJTdGF0dXMoe1xuXHRcdFx0XHRsZWFkZXJTdGF0dXM6IGZhbHNlLFxuXHRcdFx0fSksXG5cdFx0KVxuXG5cdFx0dGhpcy5zbGVlcERldGVjdG9yLnN0b3AoKVxuXG5cdFx0Ly8gQXZvaWQgcnVubmluZyBpbnRvIHBlbmFsdGllcyB3aGVuIHRyeWluZyB0byBhdXRoZW50aWNhdGUgd2l0aCBhbiBpbnZhbGlkIHNlc3Npb25cblx0XHQvLyBOb3RBdXRoZW50aWNhdGVkRXhjZXB0aW9uIDQwMSwgQWNjZXNzRGVhY3RpdmF0ZWRFeGNlcHRpb24gNDcwLCBBY2Nlc3NCbG9ja2VkIDQ3MlxuXHRcdC8vIGRvIG5vdCBjYXRjaCBzZXNzaW9uIGV4cGlyZWQgaGVyZSBiZWNhdXNlIHdlYnNvY2tldCB3aWxsIGJlIHJldXNlZCB3aGVuIHdlIGF1dGhlbnRpY2F0ZSBhZ2FpblxuXHRcdGNvbnN0IHNlcnZlckNvZGUgPSBldmVudC5jb2RlIC0gNDAwMFxuXG5cdFx0aWYgKFtOb3RBdXRob3JpemVkRXJyb3IuQ09ERSwgQWNjZXNzRGVhY3RpdmF0ZWRFcnJvci5DT0RFLCBBY2Nlc3NCbG9ja2VkRXJyb3IuQ09ERV0uaW5jbHVkZXMoc2VydmVyQ29kZSkpIHtcblx0XHRcdHRoaXMudGVybWluYXRlKClcblx0XHRcdHRoaXMubGlzdGVuZXIub25FcnJvcihoYW5kbGVSZXN0RXJyb3Ioc2VydmVyQ29kZSwgXCJ3ZWIgc29ja2V0IGVycm9yXCIsIG51bGwsIG51bGwpKVxuXHRcdH0gZWxzZSBpZiAoc2VydmVyQ29kZSA9PT0gU2Vzc2lvbkV4cGlyZWRFcnJvci5DT0RFKSB7XG5cdFx0XHQvLyBzZXNzaW9uIGlzIGV4cGlyZWQuIGRvIG5vdCB0cnkgdG8gcmVjb25uZWN0IHVudGlsIHRoZSB1c2VyIGNyZWF0ZXMgYSBuZXcgc2Vzc2lvblxuXHRcdFx0dGhpcy5zdGF0ZSA9IEV2ZW50QnVzU3RhdGUuU3VzcGVuZGVkXG5cdFx0XHR0aGlzLmxpc3RlbmVyLm9uV2Vic29ja2V0U3RhdGVDaGFuZ2VkKFdzQ29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcpXG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBFdmVudEJ1c1N0YXRlLkF1dG9tYXRpYyAmJiB0aGlzLnVzZXJGYWNhZGUuaXNGdWxseUxvZ2dlZEluKCkpIHtcblx0XHRcdHRoaXMubGlzdGVuZXIub25XZWJzb2NrZXRTdGF0ZUNoYW5nZWQoV3NDb25uZWN0aW9uU3RhdGUuY29ubmVjdGluZylcblxuXHRcdFx0aWYgKHRoaXMuaW1tZWRpYXRlUmVjb25uZWN0KSB7XG5cdFx0XHRcdHRoaXMuaW1tZWRpYXRlUmVjb25uZWN0ID0gZmFsc2Vcblx0XHRcdFx0dGhpcy50cnlSZWNvbm5lY3QoZmFsc2UsIGZhbHNlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGV0IHJlY29ubmVjdGlvbkludGVydmFsOiByZWFkb25seSBbbnVtYmVyLCBudW1iZXJdXG5cblx0XHRcdFx0aWYgKHNlcnZlckNvZGUgPT09IE5PUk1BTF9TSFVURE9XTl9DTE9TRV9DT0RFKSB7XG5cdFx0XHRcdFx0cmVjb25uZWN0aW9uSW50ZXJ2YWwgPSBSRUNPTk5FQ1RfSU5URVJWQUwuTEFSR0Vcblx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLmZhaWxlZENvbm5lY3Rpb25BdHRlbXB0cyA9PT0gMSkge1xuXHRcdFx0XHRcdHJlY29ubmVjdGlvbkludGVydmFsID0gUkVDT05ORUNUX0lOVEVSVkFMLlNNQUxMXG5cdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5mYWlsZWRDb25uZWN0aW9uQXR0ZW1wdHMgPT09IDIpIHtcblx0XHRcdFx0XHRyZWNvbm5lY3Rpb25JbnRlcnZhbCA9IFJFQ09OTkVDVF9JTlRFUlZBTC5NRURJVU1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZWNvbm5lY3Rpb25JbnRlcnZhbCA9IFJFQ09OTkVDVF9JTlRFUlZBTC5MQVJHRVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy50cnlSZWNvbm5lY3QoZmFsc2UsIGZhbHNlLCBTRUNPTkRfTVMgKiByYW5kb21JbnRGcm9tSW50ZXJ2YWwocmVjb25uZWN0aW9uSW50ZXJ2YWxbMF0sIHJlY29ubmVjdGlvbkludGVydmFsWzFdKSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluaXRFbnRpdHlFdmVudHMoY29ubmVjdE1vZGU6IENvbm5lY3RNb2RlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gcGF1c2UgcHJvY2Vzc2luZyBlbnRpdHkgdXBkYXRlIG1lc3NhZ2Ugd2hpbGUgaW5pdGlhbGl6aW5nIGV2ZW50IHF1ZXVlXG5cdFx0dGhpcy5lbnRpdHlVcGRhdGVNZXNzYWdlUXVldWUucGF1c2UoKVxuXG5cdFx0Ly8gcGF1c2UgZXZlbnQgcXVldWUgYW5kIGFkZCBhbGwgbWlzc2VkIGVudGl0eSBldmVudHMgZmlyc3Rcblx0XHR0aGlzLmV2ZW50UXVldWUucGF1c2UoKVxuXG5cdFx0Y29uc3QgZXhpc3RpbmdDb25uZWN0aW9uID0gY29ubmVjdE1vZGUgPT0gQ29ubmVjdE1vZGUuUmVjb25uZWN0ICYmIHRoaXMubGFzdEVudGl0eUV2ZW50SWRzLnNpemUgPiAwXG5cdFx0Y29uc3QgcCA9IGV4aXN0aW5nQ29ubmVjdGlvbiA/IHRoaXMubG9hZE1pc3NlZEVudGl0eUV2ZW50cyh0aGlzLmV2ZW50UXVldWUpIDogdGhpcy5pbml0T25OZXdDb25uZWN0aW9uKClcblxuXHRcdHJldHVybiBwXG5cdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdHRoaXMuZW50aXR5VXBkYXRlTWVzc2FnZVF1ZXVlLnJlc3VtZSgpXG5cdFx0XHRcdHRoaXMuZXZlbnRRdWV1ZS5yZXN1bWUoKVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhDb25uZWN0aW9uRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJ3cyBub3QgY29ubmVjdGVkIGluIGNvbm5lY3QoKSwgY2xvc2Ugd2Vic29ja2V0XCIsIGUpXG5cdFx0XHRcdFx0dGhpcy5jbG9zZShDbG9zZUV2ZW50QnVzT3B0aW9uLlJlY29ubmVjdClcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoQ2FuY2VsbGVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHQvLyB0aGUgcHJvY2Vzc2luZyB3YXMgYWJvcnRlZCBkdWUgdG8gYSByZWNvbm5lY3QuIGRvIG5vdCByZXNldCBhbnkgYXR0cmlidXRlcyBiZWNhdXNlIHRoZXkgbWlnaHQgYWxyZWFkeSBiZSBpbiB1c2Ugc2luY2UgcmVjb25uZWN0aW9uXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJ3cyBjYW5jZWxsZWQgcmV0cnkgcHJvY2VzcyBlbnRpdHkgZXZlbnRzIGFmdGVyIHJlY29ubmVjdFwiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhTZXJ2aWNlVW5hdmFpbGFibGVFcnJvciwgYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0XHQvLyBhIFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yIGlzIGEgdGVtcG9yYXJ5IGVycm9yIGFuZCB3ZSBoYXZlIHRvIHJldHJ5IHRvIGF2b2lkIGRhdGEgaW5jb25zaXN0ZW5jaWVzXG5cdFx0XHRcdFx0Ly8gc29tZSBFdmVudEJhdGNoZXMvbWlzc2VkIGV2ZW50cyBhcmUgcHJvY2Vzc2VkIGFscmVhZHkgbm93XG5cdFx0XHRcdFx0Ly8gZm9yIGFuIGV4aXN0aW5nIGNvbm5lY3Rpb24gd2UganVzdCBrZWVwIHRoZSBjdXJyZW50IHN0YXRlIGFuZCBjb250aW51ZSBsb2FkaW5nIG1pc3NlZCBldmVudHMgZm9yIHRoZSBvdGhlciBncm91cHNcblx0XHRcdFx0XHQvLyBmb3IgYSBuZXcgY29ubmVjdGlvbiB3ZSByZXNldCB0aGUgbGFzdCBlbnRpdHkgZXZlbnQgaWRzIGJlY2F1c2Ugb3RoZXJ3aXNlIHRoaXMgd291bGQgbm90IGJlIGNvbXBsZXRlZCBpbiB0aGUgbmV4dCB0cnlcblx0XHRcdFx0XHRpZiAoIWV4aXN0aW5nQ29ubmVjdGlvbikge1xuXHRcdFx0XHRcdFx0dGhpcy5sYXN0RW50aXR5RXZlbnRJZHMuY2xlYXIoKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwid3MgcmV0cnkgaW5pdCBlbnRpdHkgZXZlbnRzIGluIFwiLCBSRVRSWV9BRlRFUl9TRVJWSUNFX1VOQVZBSUxBQkxFX0VSUk9SX01TLCBlKVxuXHRcdFx0XHRcdGxldCBwcm9taXNlID0gZGVsYXkoUkVUUllfQUZURVJfU0VSVklDRV9VTkFWQUlMQUJMRV9FUlJPUl9NUykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBpZiB3ZSBoYXZlIGEgd2Vic29ja2V0IHJlY29ubmVjdCB3ZSBoYXZlIHRvIHN0b3AgcmV0cnlpbmdcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNlcnZpY2VVbmF2YWlsYWJsZVJldHJ5ID09PSBwcm9taXNlKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwid3MgcmV0cnkgaW5pdGlhbGl6aW5nIGVudGl0eSBldmVudHNcIilcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuaW5pdEVudGl0eUV2ZW50cyhjb25uZWN0TW9kZSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwid3MgY2FuY2VsIGluaXRpYWxpemluZyBlbnRpdHkgZXZlbnRzXCIpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR0aGlzLnNlcnZpY2VVbmF2YWlsYWJsZVJldHJ5ID0gcHJvbWlzZVxuXHRcdFx0XHRcdHJldHVybiBwcm9taXNlXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKE91dE9mU3luY0Vycm9yLCBhc3luYyAoZSkgPT4ge1xuXHRcdFx0XHRcdC8vIHdlIGRpZCBub3QgY2hlY2sgZm9yIHVwZGF0ZXMgZm9yIHRvbyBsb25nLCBzbyBzb21lIG1pc3NlZCBFbnRpdHlFdmVudEJhdGNoZXMgY2FuIG5vdCBiZSBsb2FkZWQgYW55IG1vcmVcblx0XHRcdFx0XHQvLyBwdXJnZSBjYWNoZSBpZiBvdXQgb2Ygc3luY1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGUucHVyZ2VTdG9yYWdlKClcblx0XHRcdFx0XHQvLyBXZSB3YW50IHVzZXJzIHRvIHJlLWxvZ2luLiBCeSB0aGUgdGltZSB3ZSBnZXQgaGVyZSB0aGV5IHByb2JhYmx5IGFscmVhZHkgaGF2ZSBsb2FkZWQgc29tZSBlbnRpdGllcyB3aGljaCB3ZSBjYW5ub3QgdXBkYXRlXG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHR0aGlzLmVudGl0eVVwZGF0ZU1lc3NhZ2VRdWV1ZS5yZXN1bWUoKVxuXG5cdFx0XHRcdHRoaXMuZXZlbnRRdWV1ZS5yZXN1bWUoKVxuXG5cdFx0XHRcdHRoaXMubGlzdGVuZXIub25FcnJvcihlKVxuXHRcdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaW5pdE9uTmV3Q29ubmVjdGlvbigpIHtcblx0XHRjb25zdCB7IGxhc3RJZHMsIHNvbWVJZHNXZXJlQ2FjaGVkIH0gPSBhd2FpdCB0aGlzLnJldHJpZXZlTGFzdEVudGl0eUV2ZW50SWRzKClcblx0XHQvLyBGaXJzdCwgd2UgcmVjb3JkIGxhc3RFbnRpdHlFdmVudElkcy4gV2UgbmVlZCB0aGlzIHRvIGtub3cgd2hhdCB3ZSBuZWVkIHRvIHJlLWZldGNoLlxuXHRcdC8vIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBjYWNoZSBiZWNhdXNlIHdlIG1pZ2h0IGhhdmUgYWxyZWFkeSBkb3dubG9hZGVkIHRoZW0gYnV0IGNhY2hlIG1pZ2h0IG5vdCBoYXZlIHByb2Nlc3NlZCB0aGVtIHlldC5cblx0XHQvLyBJbXBvcnRhbnQ6IGRvIGl0IGluIG9uZSBzdGVwIHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZSBwYXJ0aWFsIElEcyBpbiB0aGUgbWFwIGluIGNhc2UgYW4gZXJyb3Igb2NjdXJzLlxuXHRcdHRoaXMubGFzdEVudGl0eUV2ZW50SWRzID0gbGFzdElkc1xuXG5cdFx0Ly8gU2Vjb25kLCB3ZSBuZWVkIHRvIGluaXRpYWxpemUgdGhlIGNhY2hlIHRvby5cblx0XHRpZiAoc29tZUlkc1dlcmVDYWNoZWQpIHtcblx0XHRcdC8vIElmIHNvbWUgb2YgdGhlIGxhc3QgSURzIHdlcmUgcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlIHRoZW4gd2Ugd2FudCB0byBsb2FkIGZyb20gdGhhdCBwb2ludCB0byBicmluZyBjYWNoZSB1cC10by1kYXRlLiBUaGlzIGlzIG1vc3RseSBpbXBvcnRhbnQgZm9yXG5cdFx0XHQvLyBwZXJzaXN0ZW50IGNhY2hlLlxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkTWlzc2VkRW50aXR5RXZlbnRzKHRoaXMuZXZlbnRRdWV1ZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gSWYgdGhlIGNhY2hlIGlzIGNsZWFuIHRoZW4gdGhpcyBpcyBhIGNsZWFuIGNhY2hlIChlaXRoZXIgZXBoZW1lcmFsIGFmdGVyIGZpcnN0IGNvbm5lY3Qgb3IgcGVyc2lzdGVudCB3aXRoIGVtcHR5IERCKS5cblx0XHRcdC8vIFdlIG5lZWQgdG8gcmVjb3JkIHRoZSB0aW1lIGV2ZW4gaWYgd2UgZG9uJ3QgcHJvY2VzcyBhbnl0aGluZyB0byBsYXRlciBrbm93IGlmIHdlIGFyZSBvdXQgb2Ygc3luYyBvciBub3QuXG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlLnJlY29yZFN5bmNUaW1lKClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgbGF0ZXN0IGV2ZW50IGJhdGNoIGlkcyBmb3IgZWFjaCBvZiB0aGUgdXNlcnMgZ3JvdXBzIG9yIG1pbiBpZCBpZiB0aGVyZSBpcyBubyBldmVudCBiYXRjaCB5ZXQuXG5cdCAqIFRoaXMgaXMgbmVlZGVkIHRvIGtub3cgZnJvbSB3aGVyZSB0byBzdGFydCBsb2FkaW5nIG1pc3NlZCBldmVudHMgd2hlbiB3ZSBjb25uZWN0LlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyByZXRyaWV2ZUxhc3RFbnRpdHlFdmVudElkcygpOiBQcm9taXNlPHsgbGFzdElkczogTWFwPElkLCBBcnJheTxJZD4+OyBzb21lSWRzV2VyZUNhY2hlZDogYm9vbGVhbiB9PiB7XG5cdFx0Ly8gc2V0IGFsbCBsYXN0IGV2ZW50IGlkcyBpbiBvbmUgc3RlcCB0byBhdm9pZCB0aGF0IHdlIGhhdmUganVzdCBzZXQgdGhlbSBmb3IgYSBmZXcgZ3JvdXBzIHdoZW4gYSBTZXJ2aWNlVW5hdmFpbGFibGVFcnJvciBvY2N1cnNcblx0XHRjb25zdCBsYXN0SWRzOiBNYXA8SWQsIEFycmF5PElkPj4gPSBuZXcgTWFwKClcblx0XHRsZXQgc29tZUlkc1dlcmVDYWNoZWQgPSBmYWxzZVxuXHRcdGZvciAoY29uc3QgZ3JvdXBJZCBvZiB0aGlzLmV2ZW50R3JvdXBzKCkpIHtcblx0XHRcdGNvbnN0IGNhY2hlZEJhdGNoSWQgPSBhd2FpdCB0aGlzLmNhY2hlLmdldExhc3RFbnRpdHlFdmVudEJhdGNoRm9yR3JvdXAoZ3JvdXBJZClcblx0XHRcdGlmIChjYWNoZWRCYXRjaElkICE9IG51bGwpIHtcblx0XHRcdFx0bGFzdElkcy5zZXQoZ3JvdXBJZCwgW2NhY2hlZEJhdGNoSWRdKVxuXHRcdFx0XHRzb21lSWRzV2VyZUNhY2hlZCA9IHRydWVcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGJhdGNoZXMgPSBhd2FpdCB0aGlzLmVudGl0eS5sb2FkUmFuZ2UoRW50aXR5RXZlbnRCYXRjaFR5cGVSZWYsIGdyb3VwSWQsIEdFTkVSQVRFRF9NQVhfSUQsIDEsIHRydWUpXG5cdFx0XHRcdGNvbnN0IGJhdGNoSWQgPSBiYXRjaGVzLmxlbmd0aCA9PT0gMSA/IGdldEVsZW1lbnRJZChiYXRjaGVzWzBdKSA6IEdFTkVSQVRFRF9NSU5fSURcblx0XHRcdFx0bGFzdElkcy5zZXQoZ3JvdXBJZCwgW2JhdGNoSWRdKVxuXHRcdFx0XHQvLyBJbiBjYXNlIHdlIGRvbid0IHJlY2VpdmUgYW55IGV2ZW50cyBmb3IgdGhlIGdyb3VwIHRoaXMgdGltZSB3ZSB3YW50IHRvIHN0aWxsIGRvd25sb2FkIGZyb20gdGhpcyBwb2ludCBuZXh0IHRpbWUuXG5cdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGUuc2V0TGFzdEVudGl0eUV2ZW50QmF0Y2hGb3JHcm91cChncm91cElkLCBiYXRjaElkKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7IGxhc3RJZHMsIHNvbWVJZHNXZXJlQ2FjaGVkIH1cblx0fVxuXG5cdC8qKiBMb2FkIGV2ZW50IGJhdGNoZXMgc2luY2UgdGhlIGxhc3QgdGltZSB3ZSB3ZXJlIGNvbm5lY3RlZCB0byBicmluZyBjYWNoZSBhbmQgb3RoZXIgdGhpbmdzIHVwLXRvLWRhdGUuXG5cdCAqIEBwYXJhbSBldmVudFF1ZXVlIGlzIHBhc3NlZCBpbiBmb3IgdGVzdGluZ1xuXHQgKiBAVmlzaWJsZUZvclRlc3Rpbmdcblx0ICogKi9cblx0YXN5bmMgbG9hZE1pc3NlZEVudGl0eUV2ZW50cyhldmVudFF1ZXVlOiBFdmVudFF1ZXVlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLnVzZXJGYWNhZGUuaXNGdWxseUxvZ2dlZEluKCkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGF3YWl0IHRoaXMuY2hlY2tPdXRPZlN5bmMoKVxuXG5cdFx0bGV0IGV2ZW50QmF0Y2hlczogRW50aXR5RXZlbnRCYXRjaFtdID0gW11cblx0XHRmb3IgKGxldCBncm91cElkIG9mIHRoaXMuZXZlbnRHcm91cHMoKSkge1xuXHRcdFx0Y29uc3QgZXZlbnRCYXRjaEZvckdyb3VwID0gYXdhaXQgdGhpcy5sb2FkRW50aXR5RXZlbnRzRm9yR3JvdXAoZ3JvdXBJZClcblx0XHRcdGV2ZW50QmF0Y2hlcyA9IGV2ZW50QmF0Y2hlcy5jb25jYXQoZXZlbnRCYXRjaEZvckdyb3VwKVxuXHRcdH1cblxuXHRcdGNvbnN0IHRpbWVTb3J0ZWRFdmVudEJhdGNoZXMgPSBldmVudEJhdGNoZXMuc29ydCgoYSwgYikgPT4gY29tcGFyZU9sZGVzdEZpcnN0KGdldEVsZW1lbnRJZChhKSwgZ2V0RWxlbWVudElkKGIpKSlcblx0XHQvLyBDb3VudCBhbGwgYmF0Y2hlcyB0aGF0IHdpbGwgYWN0dWFsbHkgYmUgcHJvY2Vzc2VkIHNvIHRoYXQgdGhlIHByb2dyZXNzIGlzIGNvcnJlY3Rcblx0XHRsZXQgdG90YWxFeHBlY3RlZEJhdGNoZXMgPSAwXG5cdFx0Zm9yIChjb25zdCBiYXRjaCBvZiB0aW1lU29ydGVkRXZlbnRCYXRjaGVzKSB7XG5cdFx0XHRjb25zdCBmaWx0ZXJlZEVudGl0eVVwZGF0ZXMgPSBhd2FpdCB0aGlzLnJlbW92ZVVua25vd25UeXBlcyhiYXRjaC5ldmVudHMpXG5cdFx0XHRjb25zdCBiYXRjaFdhc0FkZGVkVG9RdWV1ZSA9IHRoaXMuYWRkQmF0Y2goZ2V0RWxlbWVudElkKGJhdGNoKSwgZ2V0TGlzdElkKGJhdGNoKSwgZmlsdGVyZWRFbnRpdHlVcGRhdGVzLCBldmVudFF1ZXVlKVxuXHRcdFx0aWYgKGJhdGNoV2FzQWRkZWRUb1F1ZXVlKSB7XG5cdFx0XHRcdHRvdGFsRXhwZWN0ZWRCYXRjaGVzKytcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBXZSBvbmx5IGhhdmUgdGhlIGNvcnJlY3QgYW1vdW50IG9mIHRvdGFsIHdvcmsgYWZ0ZXIgYWRkaW5nIGFsbCBlbnRpdHkgZXZlbnQgYmF0Y2hlcy5cblx0XHQvLyBUaGUgcHJvZ3Jlc3MgZm9yIHByb2Nlc3NlZCBiYXRjaGVzIGlzIHRyYWNrZWQgaW5zaWRlIHRoZSBldmVudCBxdWV1ZS5cblx0XHRjb25zdCBwcm9ncmVzc01vbml0b3IgPSBuZXcgUHJvZ3Jlc3NNb25pdG9yRGVsZWdhdGUodGhpcy5wcm9ncmVzc1RyYWNrZXIsIHRvdGFsRXhwZWN0ZWRCYXRjaGVzICsgMSlcblx0XHRjb25zb2xlLmxvZyhcIndzXCIsIGBwcm9ncmVzcyBtb25pdG9yIGV4cGVjdHMgJHt0b3RhbEV4cGVjdGVkQmF0Y2hlc30gZXZlbnRzYClcblx0XHRhd2FpdCBwcm9ncmVzc01vbml0b3Iud29ya0RvbmUoMSkgLy8gc2hvdyBwcm9ncmVzcyByaWdodCBhd2F5XG5cdFx0ZXZlbnRRdWV1ZS5zZXRQcm9ncmVzc01vbml0b3IocHJvZ3Jlc3NNb25pdG9yKVxuXG5cdFx0Ly8gV2UndmUgbG9hZGVkIGFsbCB0aGUgYmF0Y2hlcywgd2UndmUgYWRkZWQgdGhlbSB0byB0aGUgcXVldWUsIHdlIGNhbiBsZXQgdGhlIGNhY2hlIHJlbWVtYmVyIHN5bmMgcG9pbnQgZm9yIHVzIHRvIGRldGVjdCBvdXQgb2Ygc3luYyBub3cuXG5cdFx0Ly8gSXQgaXMgcG9zc2libGUgdGhhdCB3ZSB3aWxsIHJlY29yZCB0aGUgdGltZSBiZWZvcmUgdGhlIGJhdGNoIHdpbGwgYmUgcHJvY2Vzc2VkIGJ1dCB0aGUgcmlzayBpcyBsb3cuXG5cdFx0YXdhaXQgdGhpcy5jYWNoZS5yZWNvcmRTeW5jVGltZSgpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRFbnRpdHlFdmVudHNGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8RW50aXR5RXZlbnRCYXRjaFtdPiB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmVudGl0eS5sb2FkQWxsKEVudGl0eUV2ZW50QmF0Y2hUeXBlUmVmLCBncm91cElkLCB0aGlzLmdldExhc3RFdmVudEJhdGNoSWRPck1pbklkRm9yR3JvdXAoZ3JvdXBJZCkpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RBdXRob3JpemVkRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJ3cyBjb3VsZCBub3QgZG93bmxvYWQgZW50aXR5IHVwZGF0ZXMsIGxvc3QgcGVybWlzc2lvblwiKVxuXHRcdFx0XHRyZXR1cm4gW11cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNoZWNrT3V0T2ZTeW5jKCkge1xuXHRcdC8vIFdlIHRyeSB0byBkZXRlY3Qgd2hldGhlciBldmVudCBiYXRjaGVzIGhhdmUgYWxyZWFkeSBleHBpcmVkLlxuXHRcdC8vIElmIHRoaXMgaGFwcGVuZWQgd2UgZG9uJ3QgbmVlZCB0byBkb3dubG9hZCBhbnl0aGluZywgd2UgbmVlZCB0byBwdXJnZSB0aGUgY2FjaGUgYW5kIHN0YXJ0IGFsbCBvdmVyLlxuXHRcdGlmIChhd2FpdCB0aGlzLmNhY2hlLmlzT3V0T2ZTeW5jKCkpIHtcblx0XHRcdC8vIFdlIGhhbmRsZSBpdCB3aGVyZSB3ZSBpbml0aWFsaXplIHRoZSBjb25uZWN0aW9uIGFuZCBwdXJnZSB0aGUgY2FjaGUgdGhlcmUuXG5cdFx0XHR0aHJvdyBuZXcgT3V0T2ZTeW5jRXJyb3IoXCJzb21lIG1pc3NlZCBFbnRpdHlFdmVudEJhdGNoZXMgY2Fubm90IGJlIGxvYWRlZCBhbnkgbW9yZVwiKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZXZlbnRRdWV1ZUNhbGxiYWNrKG1vZGlmaWNhdGlvbjogUXVldWVkQmF0Y2gpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5wcm9jZXNzRXZlbnRCYXRjaChtb2RpZmljYXRpb24pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJ3cyBlcnJvciB3aGlsZSBwcm9jZXNzaW5nIGV2ZW50IGJhdGNoZXNcIiwgZSlcblx0XHRcdHRoaXMubGlzdGVuZXIub25FcnJvcihlKVxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZW50aXR5VXBkYXRlTWVzc2FnZVF1ZXVlQ2FsbGJhY2soYmF0Y2g6IFF1ZXVlZEJhdGNoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5hZGRCYXRjaChiYXRjaC5iYXRjaElkLCBiYXRjaC5ncm91cElkLCBiYXRjaC5ldmVudHMsIHRoaXMuZXZlbnRRdWV1ZSlcblx0XHR0aGlzLmV2ZW50UXVldWUucmVzdW1lKClcblx0fVxuXG5cdHByaXZhdGUgdW5zdWJzY3JpYmVGcm9tT2xkV2Vic29ja2V0KCkge1xuXHRcdGlmICh0aGlzLnNvY2tldCkge1xuXHRcdFx0Ly8gUmVtb3ZlIGxpc3RlbmVycy4gV2UgZG9uJ3Qgd2FudCBvbGQgc29ja2V0IHRvIG1lc3Mgb3VyIHN0YXRlXG5cdFx0XHR0aGlzLnNvY2tldC5vbm9wZW4gPSB0aGlzLnNvY2tldC5vbmNsb3NlID0gdGhpcy5zb2NrZXQub25lcnJvciA9IHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IGlkZW50aXR5XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB0ZXJtaW5hdGUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5zdGF0ZSA9IEV2ZW50QnVzU3RhdGUuVGVybWluYXRlZFxuXG5cdFx0dGhpcy5yZXNldCgpXG5cblx0XHR0aGlzLmxpc3RlbmVyLm9uV2Vic29ja2V0U3RhdGVDaGFuZ2VkKFdzQ29ubmVjdGlvblN0YXRlLnRlcm1pbmF0ZWQpXG5cdH1cblxuXHQvKipcblx0ICogVHJpZXMgdG8gcmVjb25uZWN0IHRoZSB3ZWJzb2NrZXQgaWYgaXQgaXMgbm90IGNvbm5lY3RlZC5cblx0ICovXG5cdHByaXZhdGUgcmVjb25uZWN0KGNsb3NlSWZPcGVuOiBib29sZWFuLCBlbmFibGVBdXRvbWF0aWNTdGF0ZTogYm9vbGVhbikge1xuXHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XCJ3cyByZWNvbm5lY3Qgc29ja2V0LnJlYWR5U3RhdGU6IChDT05ORUNUSU5HPTAsIE9QRU49MSwgQ0xPU0lORz0yLCBDTE9TRUQ9Myk6IFwiICsgKHRoaXMuc29ja2V0ID8gdGhpcy5zb2NrZXQucmVhZHlTdGF0ZSA6IFwibnVsbFwiKSxcblx0XHRcdFwic3RhdGU6XCIsXG5cdFx0XHR0aGlzLnN0YXRlLFxuXHRcdFx0XCJjbG9zZUlmT3BlbjpcIixcblx0XHRcdGNsb3NlSWZPcGVuLFxuXHRcdFx0XCJlbmFibGVBdXRvbWF0aWNTdGF0ZTpcIixcblx0XHRcdGVuYWJsZUF1dG9tYXRpY1N0YXRlLFxuXHRcdClcblxuXHRcdGlmICh0aGlzLnN0YXRlICE9PSBFdmVudEJ1c1N0YXRlLlRlcm1pbmF0ZWQgJiYgZW5hYmxlQXV0b21hdGljU3RhdGUpIHtcblx0XHRcdHRoaXMuc3RhdGUgPSBFdmVudEJ1c1N0YXRlLkF1dG9tYXRpY1xuXHRcdH1cblxuXHRcdGlmIChjbG9zZUlmT3BlbiAmJiB0aGlzLnNvY2tldCAmJiB0aGlzLnNvY2tldC5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuXHRcdFx0dGhpcy5pbW1lZGlhdGVSZWNvbm5lY3QgPSB0cnVlXG5cdFx0XHR0aGlzLnNvY2tldC5jbG9zZSgpXG5cdFx0fSBlbHNlIGlmIChcblx0XHRcdCh0aGlzLnNvY2tldCA9PSBudWxsIHx8IHRoaXMuc29ja2V0LnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TRUQgfHwgdGhpcy5zb2NrZXQucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0LkNMT1NJTkcpICYmXG5cdFx0XHR0aGlzLnN0YXRlICE9PSBFdmVudEJ1c1N0YXRlLlRlcm1pbmF0ZWQgJiZcblx0XHRcdHRoaXMudXNlckZhY2FkZS5pc0Z1bGx5TG9nZ2VkSW4oKVxuXHRcdCkge1xuXHRcdFx0Ly8gRG9uJ3QgdHJ5IHRvIGNvbm5lY3QgcmlnaHQgYXdheSBiZWNhdXNlIGNvbm5lY3Rpb24gbWF5IG5vdCBiZSBhY3R1YWxseSB0aGVyZVxuXHRcdFx0Ly8gc2VlICMxMTY1XG5cdFx0XHRpZiAodGhpcy5jb25uZWN0VGltZXIpIHtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdFRpbWVyKVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmNvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jb25uZWN0KENvbm5lY3RNb2RlLlJlY29ubmVjdCksIDEwMClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFkZEJhdGNoKGJhdGNoSWQ6IElkLCBncm91cElkOiBJZCwgZXZlbnRzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZT4sIGV2ZW50UXVldWU6IEV2ZW50UXVldWUpOiBib29sZWFuIHtcblx0XHRjb25zdCBsYXN0Rm9yR3JvdXAgPSB0aGlzLmxhc3RFbnRpdHlFdmVudElkcy5nZXQoZ3JvdXBJZCkgfHwgW11cblx0XHQvLyBmaW5kIHRoZSBwb3NpdGlvbiBmb3IgaW5zZXJ0aW5nIGludG8gbGFzdCBlbnRpdHkgZXZlbnRzIChuZWdhdGl2ZSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFzIG5vdCBwcmVzZW50IGluIHRoZSBhcnJheSlcblx0XHRjb25zdCBpbmRleCA9IGJpbmFyeVNlYXJjaChsYXN0Rm9yR3JvdXAsIGJhdGNoSWQsIGNvbXBhcmVPbGRlc3RGaXJzdClcblx0XHRsZXQgd2FzQWRkZWRcblxuXHRcdGlmIChpbmRleCA8IDApIHtcblx0XHRcdGxhc3RGb3JHcm91cC5zcGxpY2UoLWluZGV4LCAwLCBiYXRjaElkKVxuXHRcdFx0Ly8gb25seSBhZGQgdGhlIGJhdGNoIGlmIGl0IHdhcyBub3QgcHJvY2VzcyBiZWZvcmVcblx0XHRcdHdhc0FkZGVkID0gZXZlbnRRdWV1ZS5hZGQoYmF0Y2hJZCwgZ3JvdXBJZCwgZXZlbnRzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR3YXNBZGRlZCA9IGZhbHNlXG5cdFx0fVxuXG5cdFx0aWYgKGxhc3RGb3JHcm91cC5sZW5ndGggPiBNQVhfRVZFTlRfSURTX1FVRVVFX0xFTkdUSCkge1xuXHRcdFx0bGFzdEZvckdyb3VwLnNoaWZ0KClcblx0XHR9XG5cblx0XHR0aGlzLmxhc3RFbnRpdHlFdmVudElkcy5zZXQoYmF0Y2hJZCwgbGFzdEZvckdyb3VwKVxuXG5cdFx0aWYgKHdhc0FkZGVkKSB7XG5cdFx0XHR0aGlzLmxhc3RBZGRlZEJhdGNoRm9yR3JvdXAuc2V0KGdyb3VwSWQsIGJhdGNoSWQpXG5cdFx0fVxuXHRcdHJldHVybiB3YXNBZGRlZFxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwcm9jZXNzRXZlbnRCYXRjaChiYXRjaDogUXVldWVkQmF0Y2gpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKHRoaXMuaXNUZXJtaW5hdGVkKCkpIHJldHVyblxuXHRcdFx0Y29uc3QgZmlsdGVyZWRFdmVudHMgPSBhd2FpdCB0aGlzLmNhY2hlLmVudGl0eUV2ZW50c1JlY2VpdmVkKGJhdGNoKVxuXHRcdFx0aWYgKCF0aGlzLmlzVGVybWluYXRlZCgpKSBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uRW50aXR5RXZlbnRzUmVjZWl2ZWQoZmlsdGVyZWRFdmVudHMsIGJhdGNoLmJhdGNoSWQsIGJhdGNoLmdyb3VwSWQpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBTZXJ2aWNlVW5hdmFpbGFibGVFcnJvcikge1xuXHRcdFx0XHQvLyBhIFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yIGlzIGEgdGVtcG9yYXJ5IGVycm9yIGFuZCB3ZSBoYXZlIHRvIHJldHJ5IHRvIGF2b2lkIGRhdGEgaW5jb25zaXN0ZW5jaWVzXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwid3MgcmV0cnkgcHJvY2Vzc2luZyBldmVudCBpbiAzMHNcIiwgZSlcblx0XHRcdFx0Y29uc3QgcmV0cnlQcm9taXNlID0gZGVsYXkoUkVUUllfQUZURVJfU0VSVklDRV9VTkFWQUlMQUJMRV9FUlJPUl9NUykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gaWYgd2UgaGF2ZSBhIHdlYnNvY2tldCByZWNvbm5lY3Qgd2UgaGF2ZSB0byBzdG9wIHJldHJ5aW5nXG5cdFx0XHRcdFx0aWYgKHRoaXMuc2VydmljZVVuYXZhaWxhYmxlUmV0cnkgPT09IHJldHJ5UHJvbWlzZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucHJvY2Vzc0V2ZW50QmF0Y2goYmF0Y2gpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBDYW5jZWxsZWRFcnJvcihcInN0b3AgcmV0cnkgcHJvY2Vzc2luZyBhZnRlciBzZXJ2aWNlIHVuYXZhaWxhYmxlIGR1ZSB0byByZWNvbm5lY3RcIilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdHRoaXMuc2VydmljZVVuYXZhaWxhYmxlUmV0cnkgPSByZXRyeVByb21pc2Vcblx0XHRcdFx0cmV0dXJuIHJldHJ5UHJvbWlzZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJFVkVOVFwiLCBcImVycm9yXCIsIGUpXG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdldExhc3RFdmVudEJhdGNoSWRPck1pbklkRm9yR3JvdXAoZ3JvdXBJZDogSWQpOiBJZCB7XG5cdFx0Y29uc3QgbGFzdElkcyA9IHRoaXMubGFzdEVudGl0eUV2ZW50SWRzLmdldChncm91cElkKVxuXG5cdFx0cmV0dXJuIGxhc3RJZHMgJiYgbGFzdElkcy5sZW5ndGggPiAwID8gbGFzdFRocm93KGxhc3RJZHMpIDogR0VORVJBVEVEX01JTl9JRFxuXHR9XG5cblx0cHJpdmF0ZSBpc1Rlcm1pbmF0ZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc3RhdGUgPT09IEV2ZW50QnVzU3RhdGUuVGVybWluYXRlZFxuXHR9XG5cblx0cHJpdmF0ZSBldmVudEdyb3VwcygpOiBJZFtdIHtcblx0XHRyZXR1cm4gdGhpcy51c2VyRmFjYWRlXG5cdFx0XHQuZ2V0TG9nZ2VkSW5Vc2VyKClcblx0XHRcdC5tZW1iZXJzaGlwcy5maWx0ZXIoKG1lbWJlcnNoaXApID0+IG1lbWJlcnNoaXAuZ3JvdXBUeXBlICE9PSBHcm91cFR5cGUuTWFpbGluZ0xpc3QpXG5cdFx0XHQubWFwKChtZW1iZXJzaGlwKSA9PiBtZW1iZXJzaGlwLmdyb3VwKVxuXHRcdFx0LmNvbmNhdCh0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkudXNlckdyb3VwLmdyb3VwKVxuXHR9XG59XG4iLCIvLyBUaGlzIGlzIGFuIHVuZm9ydHVuYXRlIHJlcGxhY2VtZW50IGZvciBAc2luZHJlc29yaHVzL2lzIHRoYXQgd2UgbmVlZCB0b1xuLy8gcmUtaW1wbGVtZW50IGZvciBwZXJmb3JtYW5jZSBwdXJwb3Nlcy4gSW4gcGFydGljdWxhciB0aGUgaXMub2JzZXJ2YWJsZSgpXG4vLyBjaGVjayBpcyBleHBlbnNpdmUsIGFuZCB1bm5lY2Vzc2FyeSBmb3Igb3VyIHB1cnBvc2VzLiBUaGUgdmFsdWVzIHJldHVybmVkXG4vLyBhcmUgY29tcGF0aWJsZSB3aXRoIEBzaW5kcmVzb3JodXMvaXMsIGhvd2V2ZXIuXG5cbmNvbnN0IHR5cGVvZnMgPSBbXG4gICdzdHJpbmcnLFxuICAnbnVtYmVyJyxcbiAgJ2JpZ2ludCcsXG4gICdzeW1ib2wnXG5dO1xuXG5jb25zdCBvYmplY3RUeXBlTmFtZXMgPSBbXG4gICdGdW5jdGlvbicsXG4gICdHZW5lcmF0b3InLFxuICAnQXN5bmNHZW5lcmF0b3InLFxuICAnR2VuZXJhdG9yRnVuY3Rpb24nLFxuICAnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsXG4gICdBc3luY0Z1bmN0aW9uJyxcbiAgJ09ic2VydmFibGUnLFxuICAnQXJyYXknLFxuICAnQnVmZmVyJyxcbiAgJ09iamVjdCcsXG4gICdSZWdFeHAnLFxuICAnRGF0ZScsXG4gICdFcnJvcicsXG4gICdNYXAnLFxuICAnU2V0JyxcbiAgJ1dlYWtNYXAnLFxuICAnV2Vha1NldCcsXG4gICdBcnJheUJ1ZmZlcicsXG4gICdTaGFyZWRBcnJheUJ1ZmZlcicsXG4gICdEYXRhVmlldycsXG4gICdQcm9taXNlJyxcbiAgJ1VSTCcsXG4gICdIVE1MRWxlbWVudCcsXG4gICdJbnQ4QXJyYXknLFxuICAnVWludDhBcnJheScsXG4gICdVaW50OENsYW1wZWRBcnJheScsXG4gICdJbnQxNkFycmF5JyxcbiAgJ1VpbnQxNkFycmF5JyxcbiAgJ0ludDMyQXJyYXknLFxuICAnVWludDMyQXJyYXknLFxuICAnRmxvYXQzMkFycmF5JyxcbiAgJ0Zsb2F0NjRBcnJheScsXG4gICdCaWdJbnQ2NEFycmF5JyxcbiAgJ0JpZ1VpbnQ2NEFycmF5J1xuXTtcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGlzICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnXG4gIH1cbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCdcbiAgfVxuICBpZiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuICdib29sZWFuJ1xuICB9XG4gIGNvbnN0IHR5cGVPZiA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGVvZnMuaW5jbHVkZXModHlwZU9mKSkge1xuICAgIHJldHVybiB0eXBlT2ZcbiAgfVxuICAvKiBjOCBpZ25vcmUgbmV4dCA0ICovXG4gIC8vIG5vdCBnb2luZyB0byBib3RoZXIgdGVzdGluZyB0aGlzLCBpdCdzIG5vdCBnb2luZyB0byBiZSB2YWxpZCBhbnl3YXlcbiAgaWYgKHR5cGVPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiAnRnVuY3Rpb24nXG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuICdBcnJheSdcbiAgfVxuICBpZiAoaXNCdWZmZXIkMSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJ0J1ZmZlcidcbiAgfVxuICBjb25zdCBvYmplY3RUeXBlID0gZ2V0T2JqZWN0VHlwZSh2YWx1ZSk7XG4gIGlmIChvYmplY3RUeXBlKSB7XG4gICAgcmV0dXJuIG9iamVjdFR5cGVcbiAgfVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICByZXR1cm4gJ09iamVjdCdcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0J1ZmZlciQxICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IuaXNCdWZmZXIgJiYgdmFsdWUuY29uc3RydWN0b3IuaXNCdWZmZXIuY2FsbChudWxsLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfVxuICovXG5mdW5jdGlvbiBnZXRPYmplY3RUeXBlICh2YWx1ZSkge1xuICBjb25zdCBvYmplY3RUeXBlTmFtZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkuc2xpY2UoOCwgLTEpO1xuICBpZiAob2JqZWN0VHlwZU5hbWVzLmluY2x1ZGVzKG9iamVjdFR5cGVOYW1lKSkge1xuICAgIHJldHVybiBvYmplY3RUeXBlTmFtZVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuY2xhc3MgVHlwZSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbWFqb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtib29sZWFufSB0ZXJtaW5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IgKG1ham9yLCBuYW1lLCB0ZXJtaW5hbCkge1xuICAgIHRoaXMubWFqb3IgPSBtYWpvcjtcbiAgICB0aGlzLm1ham9yRW5jb2RlZCA9IG1ham9yIDw8IDU7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnRlcm1pbmFsID0gdGVybWluYWw7XG4gIH1cblxuICAvKiBjOCBpZ25vcmUgbmV4dCAzICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gYFR5cGVbJHt0aGlzLm1ham9yfV0uJHt0aGlzLm5hbWV9YFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VHlwZX0gdHlwXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAqL1xuICBjb21wYXJlICh0eXApIHtcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAxICovXG4gICAgcmV0dXJuIHRoaXMubWFqb3IgPCB0eXAubWFqb3IgPyAtMSA6IHRoaXMubWFqb3IgPiB0eXAubWFqb3IgPyAxIDogMFxuICB9XG59XG5cbi8vIGNvbnZlcnQgdG8gc3RhdGljIGZpZWxkcyB3aGVuIGJldHRlciBzdXBwb3J0ZWRcblR5cGUudWludCA9IG5ldyBUeXBlKDAsICd1aW50JywgdHJ1ZSk7XG5UeXBlLm5lZ2ludCA9IG5ldyBUeXBlKDEsICduZWdpbnQnLCB0cnVlKTtcblR5cGUuYnl0ZXMgPSBuZXcgVHlwZSgyLCAnYnl0ZXMnLCB0cnVlKTtcblR5cGUuc3RyaW5nID0gbmV3IFR5cGUoMywgJ3N0cmluZycsIHRydWUpO1xuVHlwZS5hcnJheSA9IG5ldyBUeXBlKDQsICdhcnJheScsIGZhbHNlKTtcblR5cGUubWFwID0gbmV3IFR5cGUoNSwgJ21hcCcsIGZhbHNlKTtcblR5cGUudGFnID0gbmV3IFR5cGUoNiwgJ3RhZycsIGZhbHNlKTsgLy8gdGVybWluYWw/XG5UeXBlLmZsb2F0ID0gbmV3IFR5cGUoNywgJ2Zsb2F0JywgdHJ1ZSk7XG5UeXBlLmZhbHNlID0gbmV3IFR5cGUoNywgJ2ZhbHNlJywgdHJ1ZSk7XG5UeXBlLnRydWUgPSBuZXcgVHlwZSg3LCAndHJ1ZScsIHRydWUpO1xuVHlwZS5udWxsID0gbmV3IFR5cGUoNywgJ251bGwnLCB0cnVlKTtcblR5cGUudW5kZWZpbmVkID0gbmV3IFR5cGUoNywgJ3VuZGVmaW5lZCcsIHRydWUpO1xuVHlwZS5icmVhayA9IG5ldyBUeXBlKDcsICdicmVhaycsIHRydWUpO1xuLy8gVHlwZS5pbmRlZmluaXRlTGVuZ3RoID0gbmV3IFR5cGUoMCwgJ2luZGVmaW5pdGVMZW5ndGgnLCB0cnVlKVxuXG5jbGFzcyBUb2tlbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1R5cGV9IHR5cGVcbiAgICogQHBhcmFtIHthbnl9IFt2YWx1ZV1cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtlbmNvZGVkTGVuZ3RoXVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHR5cGUsIHZhbHVlLCBlbmNvZGVkTGVuZ3RoKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5lbmNvZGVkTGVuZ3RoID0gZW5jb2RlZExlbmd0aDtcbiAgICAvKiogQHR5cGUge1VpbnQ4QXJyYXl8dW5kZWZpbmVkfSAqL1xuICAgIHRoaXMuZW5jb2RlZEJ5dGVzID0gdW5kZWZpbmVkO1xuICAgIC8qKiBAdHlwZSB7VWludDhBcnJheXx1bmRlZmluZWR9ICovXG4gICAgdGhpcy5ieXRlVmFsdWUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiBjOCBpZ25vcmUgbmV4dCAzICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gYFRva2VuWyR7dGhpcy50eXBlfV0uJHt0aGlzLnZhbHVlfWBcbiAgfVxufVxuXG4vLyBVc2UgVWludDhBcnJheSBkaXJlY3RseSBpbiB0aGUgYnJvd3NlciwgdXNlIEJ1ZmZlciBpbiBOb2RlLmpzIGJ1dCBkb24ndFxuLy8gc3BlYWsgaXRzIG5hbWUgZGlyZWN0bHkgdG8gYXZvaWQgYnVuZGxlcnMgcHVsbGluZyBpbiB0aGUgYEJ1ZmZlcmAgcG9seWZpbGxcblxuLy8gQHRzLWlnbm9yZVxuY29uc3QgdXNlQnVmZmVyID0gZ2xvYmFsVGhpcy5wcm9jZXNzICYmXG4gIC8vIEB0cy1pZ25vcmVcbiAgIWdsb2JhbFRoaXMucHJvY2Vzcy5icm93c2VyICYmXG4gIC8vIEB0cy1pZ25vcmVcbiAgZ2xvYmFsVGhpcy5CdWZmZXIgJiZcbiAgLy8gQHRzLWlnbm9yZVxuICB0eXBlb2YgZ2xvYmFsVGhpcy5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbic7XG5cbmNvbnN0IHRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5jb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNCdWZmZXIgKGJ1Zikge1xuICAvLyBAdHMtaWdub3JlXG4gIHJldHVybiB1c2VCdWZmZXIgJiYgZ2xvYmFsVGhpcy5CdWZmZXIuaXNCdWZmZXIoYnVmKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheXxudW1iZXJbXX0gYnVmXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX1cbiAqL1xuZnVuY3Rpb24gYXNVOEEgKGJ1Zikge1xuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIShidWYgaW5zdGFuY2VvZiBVaW50OEFycmF5KSkge1xuICAgIHJldHVybiBVaW50OEFycmF5LmZyb20oYnVmKVxuICB9XG4gIHJldHVybiBpc0J1ZmZlcihidWYpID8gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ1ZmZlciwgYnVmLmJ5dGVPZmZzZXQsIGJ1Zi5ieXRlTGVuZ3RoKSA6IGJ1ZlxufVxuXG5jb25zdCB0b1N0cmluZyA9IHVzZUJ1ZmZlclxuICA/IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb3BlcmF0b3ItbGluZWJyZWFrXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBieXRlc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmRcbiAgICAgKi9cbiAgICAoYnl0ZXMsIHN0YXJ0LCBlbmQpID0+IHtcbiAgICAgIHJldHVybiBlbmQgLSBzdGFydCA+IDY0XG4gICAgICAgID8gLy8gZXNsaW50LWRpc2FibGUtbGluZSBvcGVyYXRvci1saW5lYnJlYWtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5CdWZmZXIuZnJvbShieXRlcy5zdWJhcnJheShzdGFydCwgZW5kKSkudG9TdHJpbmcoJ3V0ZjgnKVxuICAgICAgICA6IHV0ZjhTbGljZShieXRlcywgc3RhcnQsIGVuZClcbiAgICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0IDExICovXG4gIDogLy8gZXNsaW50LWRpc2FibGUtbGluZSBvcGVyYXRvci1saW5lYnJlYWtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ5dGVzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGVuZFxuICAgICAqL1xuICAgIChieXRlcywgc3RhcnQsIGVuZCkgPT4ge1xuICAgICAgcmV0dXJuIGVuZCAtIHN0YXJ0ID4gNjRcbiAgICAgICAgPyB0ZXh0RGVjb2Rlci5kZWNvZGUoYnl0ZXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gICAgICAgIDogdXRmOFNsaWNlKGJ5dGVzLCBzdGFydCwgZW5kKVxuICAgIH07XG5cbmNvbnN0IGZyb21TdHJpbmcgPSB1c2VCdWZmZXJcbiAgPyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG9wZXJhdG9yLWxpbmVicmVha1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAgICAgKi9cbiAgICAoc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gc3RyaW5nLmxlbmd0aCA+IDY0XG4gICAgICAgID8gLy8gZXNsaW50LWRpc2FibGUtbGluZSBvcGVyYXRvci1saW5lYnJlYWtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5CdWZmZXIuZnJvbShzdHJpbmcpXG4gICAgICAgIDogdXRmOFRvQnl0ZXMoc3RyaW5nKVxuICAgIH1cbiAgLyogYzggaWdub3JlIG5leHQgNyAqL1xuICA6IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb3BlcmF0b3ItbGluZWJyZWFrXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xuICAgICAqL1xuICAgIChzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBzdHJpbmcubGVuZ3RoID4gNjQgPyB0ZXh0RW5jb2Rlci5lbmNvZGUoc3RyaW5nKSA6IHV0ZjhUb0J5dGVzKHN0cmluZylcbiAgICB9O1xuXG4vKipcbiAqIEJ1ZmZlciB2YXJpYW50IG5vdCBmYXN0IGVub3VnaCBmb3Igd2hhdCB3ZSBuZWVkXG4gKiBAcGFyYW0ge251bWJlcltdfSBhcnJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxuICovXG5jb25zdCBmcm9tQXJyYXkgPSAoYXJyKSA9PiB7XG4gIHJldHVybiBVaW50OEFycmF5LmZyb20oYXJyKVxufTtcblxuY29uc3Qgc2xpY2UgPSB1c2VCdWZmZXJcbiAgPyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG9wZXJhdG9yLWxpbmVicmVha1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZW5kXG4gICAgICovXG4gICAgKGJ5dGVzLCBzdGFydCwgZW5kKSA9PiB7XG4gICAgICBpZiAoaXNCdWZmZXIoYnl0ZXMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShieXRlcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBieXRlcy5zbGljZShzdGFydCwgZW5kKVxuICAgIH1cbiAgLyogYzggaWdub3JlIG5leHQgOSAqL1xuICA6IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb3BlcmF0b3ItbGluZWJyZWFrXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBieXRlc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmRcbiAgICAgKi9cbiAgICAoYnl0ZXMsIHN0YXJ0LCBlbmQpID0+IHtcbiAgICAgIHJldHVybiBieXRlcy5zbGljZShzdGFydCwgZW5kKVxuICAgIH07XG5cbmNvbnN0IGNvbmNhdCA9IHVzZUJ1ZmZlclxuICA/IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb3BlcmF0b3ItbGluZWJyZWFrXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5W119IGNodW5rc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAgICAgKiBAcmV0dXJucyB7VWludDhBcnJheX1cbiAgICAgKi9cbiAgICAoY2h1bmtzLCBsZW5ndGgpID0+IHtcbiAgICAgIC8vIG1pZ2h0IGdldCBhIHN0cmF5IHBsYWluIEFycmF5IGhlcmVcbiAgICAgIC8qIGM4IGlnbm9yZSBuZXh0IDEgKi9cbiAgICAgIGNodW5rcyA9IGNodW5rcy5tYXAoKGMpID0+IGMgaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgID8gY1xuICAgICAgICAvLyB0aGlzIGNhc2UgaXMgb2NjYXNpb25hbGx5IG1pc3NlZCBkdXJpbmcgdGVzdCBydW5zIHNvIGJlY29tZXMgY292ZXJhZ2UtZmxha3lcbiAgICAgICAgLyogYzggaWdub3JlIG5leHQgNCAqL1xuICAgICAgICA6IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb3BlcmF0b3ItbGluZWJyZWFrXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5CdWZmZXIuZnJvbShjKSk7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICByZXR1cm4gYXNVOEEoZ2xvYmFsVGhpcy5CdWZmZXIuY29uY2F0KGNodW5rcywgbGVuZ3RoKSlcbiAgICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0IDE5ICovXG4gIDogLy8gZXNsaW50LWRpc2FibGUtbGluZSBvcGVyYXRvci1saW5lYnJlYWtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXlbXX0gY2h1bmtzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICAgICAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxuICAgICAqL1xuICAgIChjaHVua3MsIGxlbmd0aCkgPT4ge1xuICAgICAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgICAgIGxldCBvZmYgPSAwO1xuICAgICAgZm9yIChsZXQgYiBvZiBjaHVua3MpIHtcbiAgICAgICAgaWYgKG9mZiArIGIubGVuZ3RoID4gb3V0Lmxlbmd0aCkge1xuICAgICAgICAgIC8vIGZpbmFsIGNodW5rIHRoYXQncyBiaWdnZXIgdGhhbiB3ZSBuZWVkXG4gICAgICAgICAgYiA9IGIuc3ViYXJyYXkoMCwgb3V0Lmxlbmd0aCAtIG9mZik7XG4gICAgICAgIH1cbiAgICAgICAgb3V0LnNldChiLCBvZmYpO1xuICAgICAgICBvZmYgKz0gYi5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0XG4gICAgfTtcblxuY29uc3QgYWxsb2MgPSB1c2VCdWZmZXJcbiAgPyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG9wZXJhdG9yLWxpbmVicmVha1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzaXplXG4gICAgICogQHJldHVybnMge1VpbnQ4QXJyYXl9XG4gICAgICovXG4gICAgKHNpemUpID0+IHtcbiAgICAgIC8vIHdlIGFsd2F5cyB3cml0ZSBvdmVyIHRoZSBjb250ZW50cyB3ZSBleHBvc2Ugc28gdGhpcyBzaG91bGQgYmUgc2FmZVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcmV0dXJuIGdsb2JhbFRoaXMuQnVmZmVyLmFsbG9jVW5zYWZlKHNpemUpXG4gICAgfVxuICAvKiBjOCBpZ25vcmUgbmV4dCA4ICovXG4gIDogLy8gZXNsaW50LWRpc2FibGUtbGluZSBvcGVyYXRvci1saW5lYnJlYWtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2l6ZVxuICAgICAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxuICAgICAqL1xuICAgIChzaXplKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc2l6ZSlcbiAgICB9O1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYjFcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYjJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUgKGIxLCBiMikge1xuICAvKiBjOCBpZ25vcmUgbmV4dCA1ICovXG4gIGlmIChpc0J1ZmZlcihiMSkgJiYgaXNCdWZmZXIoYjIpKSB7XG4gICAgLy8gcHJvYmFibHkgbm90IHBvc3NpYmxlIHRvIGdldCBoZXJlIGluIHRoZSBjdXJyZW50IEFQSVxuICAgIC8vIEB0cy1pZ25vcmUgQnVmZmVyXG4gICAgcmV0dXJuIGIxLmNvbXBhcmUoYjIpXG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBiMS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChiMVtpXSA9PT0gYjJbaV0pIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIHJldHVybiBiMVtpXSA8IGIyW2ldID8gLTEgOiAxXG4gIH0gLyogYzggaWdub3JlIG5leHQgMyAqL1xuICByZXR1cm4gMFxufVxuXG4vLyBUaGUgYmVsb3cgY29kZSBpcyB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2xvc3VyZS1saWJyYXJ5L2Jsb2IvODU5OGQ4NzI0MmFmNTlhYWMyMzMyNzA3NDJjODk4NGUyYjJiZGJlMC9jbG9zdXJlL2dvb2cvY3J5cHQvY3J5cHQuanMjTDExNy1MMTQzXG4vLyBMaWNlbnNlZCBBcGFjaGUtMi4wLlxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtudW1iZXJbXX1cbiAqL1xuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cikge1xuICBjb25zdCBvdXQgPSBbXTtcbiAgbGV0IHAgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgIG91dFtwKytdID0gYztcbiAgICB9IGVsc2UgaWYgKGMgPCAyMDQ4KSB7XG4gICAgICBvdXRbcCsrXSA9IChjID4+IDYpIHwgMTkyO1xuICAgICAgb3V0W3ArK10gPSAoYyAmIDYzKSB8IDEyODtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKChjICYgMHhGQzAwKSA9PT0gMHhEODAwKSAmJiAoaSArIDEpIDwgc3RyLmxlbmd0aCAmJlxuICAgICAgKChzdHIuY2hhckNvZGVBdChpICsgMSkgJiAweEZDMDApID09PSAweERDMDApKSB7XG4gICAgICAvLyBTdXJyb2dhdGUgUGFpclxuICAgICAgYyA9IDB4MTAwMDAgKyAoKGMgJiAweDAzRkYpIDw8IDEwKSArIChzdHIuY2hhckNvZGVBdCgrK2kpICYgMHgwM0ZGKTtcbiAgICAgIG91dFtwKytdID0gKGMgPj4gMTgpIHwgMjQwO1xuICAgICAgb3V0W3ArK10gPSAoKGMgPj4gMTIpICYgNjMpIHwgMTI4O1xuICAgICAgb3V0W3ArK10gPSAoKGMgPj4gNikgJiA2MykgfCAxMjg7XG4gICAgICBvdXRbcCsrXSA9IChjICYgNjMpIHwgMTI4O1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRbcCsrXSA9IChjID4+IDEyKSB8IDIyNDtcbiAgICAgIG91dFtwKytdID0gKChjID4+IDYpICYgNjMpIHwgMTI4O1xuICAgICAgb3V0W3ArK10gPSAoYyAmIDYzKSB8IDEyODtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG4vLyBUaGUgYmVsb3cgY29kZSBpcyBtb3N0bHkgdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlclxuLy8gTGljZW5zZWQgTUlULiBDb3B5cmlnaHQgKGMpIEZlcm9zcyBBYm91a2hhZGlqZWhcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIG9mZnNldCwgZW5kKSB7XG4gIGNvbnN0IHJlcyA9IFtdO1xuXG4gIHdoaWxlIChvZmZzZXQgPCBlbmQpIHtcbiAgICBjb25zdCBmaXJzdEJ5dGUgPSBidWZbb2Zmc2V0XTtcbiAgICBsZXQgY29kZVBvaW50ID0gbnVsbDtcbiAgICBsZXQgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweGVmKSA/IDQgOiAoZmlyc3RCeXRlID4gMHhkZikgPyAzIDogKGZpcnN0Qnl0ZSA+IDB4YmYpID8gMiA6IDE7XG5cbiAgICBpZiAob2Zmc2V0ICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIGxldCBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnQ7XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbb2Zmc2V0ICsgMV07XG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhjMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxZikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNmKTtcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Zikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltvZmZzZXQgKyAxXTtcbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbb2Zmc2V0ICsgMl07XG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhjMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4YzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4ZikgPDwgMHhjIHwgKHNlY29uZEJ5dGUgJiAweDNmKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzZik7XG4gICAgICAgICAgICAvKiBjOCBpZ25vcmUgbmV4dCAzICovXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N2ZmICYmICh0ZW1wQ29kZVBvaW50IDwgMHhkODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweGRmZmYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW29mZnNldCArIDFdO1xuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltvZmZzZXQgKyAyXTtcbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW29mZnNldCArIDNdO1xuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4YzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweGMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4YzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4ZikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzZikgPDwgMHhjIHwgKHRoaXJkQnl0ZSAmIDB4M2YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzZik7XG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4ZmZmZiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogYzggaWdub3JlIG5leHQgNSAqL1xuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4ZmZmZDtcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxO1xuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhmZmZmKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDA7XG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzZmYgfCAweGQ4MDApO1xuICAgICAgY29kZVBvaW50ID0gMHhkYzAwIHwgY29kZVBvaW50ICYgMHgzZmY7XG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KTtcbiAgICBvZmZzZXQgKz0gYnl0ZXNQZXJTZXF1ZW5jZTtcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbmNvbnN0IE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwO1xuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyW119IGNvZGVQb2ludHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICBjb25zdCBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aDtcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0IDEwICovXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbi8qKlxuICogQmwgaXMgYSBsaXN0IG9mIGJ5dGUgY2h1bmtzLCBzaW1pbGFyIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9ydmFnZy9ibCBidXQgZm9yXG4gKiB3cml0aW5nIHJhdGhlciB0aGFuIHJlYWRpbmcuXG4gKiBBIEJsIG9iamVjdCBhY2NlcHRzIHNldCgpIG9wZXJhdGlvbnMgZm9yIGluZGl2aWR1YWwgYnl0ZXMgYW5kIGNvcHlUbygpIGZvclxuICogaW5zZXJ0aW5nIGJ5dGUgYXJyYXlzLiBUaGVzZSB3cml0ZSBvcGVyYXRpb25zIGRvbid0IGF1dG9tYXRpY2FsbHkgaW5jcmVtZW50XG4gKiB0aGUgaW50ZXJuYWwgY3Vyc29yIHNvIGl0cyBcImxlbmd0aFwiIHdvbid0IGJlIGNoYW5nZWQuIEluc3RlYWQsIGluY3JlbWVudCgpXG4gKiBtdXN0IGJlIGNhbGxlZCB0byBleHRlbmQgaXRzIGxlbmd0aCB0byBjb3ZlciB0aGUgaW5zZXJ0ZWQgZGF0YS5cbiAqIFRoZSB0b0J5dGVzKCkgY2FsbCB3aWxsIGNvbnZlcnQgYWxsIGludGVybmFsIG1lbW9yeSB0byBhIHNpbmdsZSBVaW50OEFycmF5IG9mXG4gKiB0aGUgY29ycmVjdCBsZW5ndGgsIHRydW5jYXRpbmcgYW55IGRhdGEgdGhhdCBpcyBzdG9yZWQgYnV0IGhhc24ndCBiZWVuXG4gKiBpbmNsdWRlZCBieSBhbiBpbmNyZW1lbnQoKS5cbiAqIGdldCgpIGNhbiByZXRyaWV2ZSBhIHNpbmdsZSBieXRlLlxuICogQWxsIG9wZXJhdGlvbnMgKGV4Y2VwdCB0b0J5dGVzKCkpIHRha2UgYW4gXCJvZmZzZXRcIiBhcmd1bWVudCB0aGF0IHdpbGwgcGVyZm9ybVxuICogdGhlIHdyaXRlIGF0IHRoZSBvZmZzZXQgX2Zyb20gdGhlIGN1cnJlbnQgY3Vyc29yXy4gRm9yIG1vc3Qgb3BlcmF0aW9ucyB0aGlzXG4gKiB3aWxsIGJlIGAwYCB0byB3cml0ZSBhdCB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gYnV0IGl0IGNhbiBiZSBhaGVhZCBvZlxuICogdGhlIGN1cnJlbnQgY3Vyc29yLiBOZWdhdGl2ZSBvZmZzZXRzIHByb2JhYmx5IHdvcmsgYnV0IGFyZSB1bnRlc3RlZC5cbiAqL1xuXG5cbi8vIHRoZSB0cy1pZ25vcmVzIGluIHRoaXMgZmlsZSBhcmUgYWxtb3N0IGFsbCBmb3IgdGhlIGBVaW50OEFycmF5fG51bWJlcltdYCBkdWFsaXR5IHRoYXQgZXhpc3RzXG4vLyBmb3IgcGVyZiByZWFzb25zLiBDb25zaWRlciBiZXR0ZXIgYXBwcm9hY2hlcyB0byB0aGlzIG9yIHJlbW92aW5nIGl0IGVudGlyZWx5LCBpdCBpcyBxdWl0ZVxuLy8gcmlza3kgYmVjYXVzZSBvZiBzb21lIGFzc3VtcHRpb25zIGFib3V0IHNtYWxsIGNodW5rcyA9PT0gbnVtYmVyW10gYW5kIGV2ZXJ5dGhpbmcgZWxzZSA9PT0gVWludDhBcnJheS5cblxuY29uc3QgZGVmYXVsdENodW5rU2l6ZSA9IDI1NjtcblxuY2xhc3MgQmwge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjaHVua1NpemVdXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoY2h1bmtTaXplID0gZGVmYXVsdENodW5rU2l6ZSkge1xuICAgIHRoaXMuY2h1bmtTaXplID0gY2h1bmtTaXplO1xuICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgIHRoaXMuY3Vyc29yID0gMDtcbiAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICB0aGlzLm1heEN1cnNvciA9IC0xO1xuICAgIC8qKiBAdHlwZSB7KFVpbnQ4QXJyYXl8bnVtYmVyW10pW119ICovXG4gICAgdGhpcy5jaHVua3MgPSBbXTtcbiAgICAvLyBrZWVwIHRoZSBmaXJzdCBjaHVuayBhcm91bmQgaWYgd2UgY2FuIHRvIHNhdmUgYWxsb2NhdGlvbnMgZm9yIGZ1dHVyZSBlbmNvZGVzXG4gICAgLyoqIEB0eXBlIHtVaW50OEFycmF5fG51bWJlcltdfG51bGx9ICovXG4gICAgdGhpcy5faW5pdFJldXNlQ2h1bmsgPSBudWxsO1xuICB9XG5cbiAgcmVzZXQgKCkge1xuICAgIHRoaXMuY3Vyc29yID0gMDtcbiAgICB0aGlzLm1heEN1cnNvciA9IC0xO1xuICAgIGlmICh0aGlzLmNodW5rcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY2h1bmtzID0gW107XG4gICAgfVxuICAgIGlmICh0aGlzLl9pbml0UmV1c2VDaHVuayAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jaHVua3MucHVzaCh0aGlzLl9pbml0UmV1c2VDaHVuayk7XG4gICAgICB0aGlzLm1heEN1cnNvciA9IHRoaXMuX2luaXRSZXVzZUNodW5rLmxlbmd0aCAtIDE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheXxudW1iZXJbXX0gYnl0ZXNcbiAgICovXG4gIHB1c2ggKGJ5dGVzKSB7XG4gICAgbGV0IHRvcENodW5rID0gdGhpcy5jaHVua3NbdGhpcy5jaHVua3MubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgbmV3TWF4ID0gdGhpcy5jdXJzb3IgKyBieXRlcy5sZW5ndGg7XG4gICAgaWYgKG5ld01heCA8PSB0aGlzLm1heEN1cnNvciArIDEpIHtcbiAgICAgIC8vIHdlIGhhdmUgYXQgbGVhc3Qgb25lIGNodW5rIGFuZCB3ZSBjYW4gZml0IHRoZXNlIGJ5dGVzIGludG8gdGhhdCBjaHVua1xuICAgICAgY29uc3QgY2h1bmtQb3MgPSB0b3BDaHVuay5sZW5ndGggLSAodGhpcy5tYXhDdXJzb3IgLSB0aGlzLmN1cnNvcikgLSAxO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgdG9wQ2h1bmsuc2V0KGJ5dGVzLCBjaHVua1Bvcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNhbid0IGZpdCBpdCBpblxuICAgICAgaWYgKHRvcENodW5rKSB7XG4gICAgICAgIC8vIHRyaXAgdGhlIGxhc3QgY2h1bmsgdG8gYGN1cnNvcmAgaWYgd2UgbmVlZCB0b1xuICAgICAgICBjb25zdCBjaHVua1BvcyA9IHRvcENodW5rLmxlbmd0aCAtICh0aGlzLm1heEN1cnNvciAtIHRoaXMuY3Vyc29yKSAtIDE7XG4gICAgICAgIGlmIChjaHVua1BvcyA8IHRvcENodW5rLmxlbmd0aCkge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB0aGlzLmNodW5rc1t0aGlzLmNodW5rcy5sZW5ndGggLSAxXSA9IHRvcENodW5rLnN1YmFycmF5KDAsIGNodW5rUG9zKTtcbiAgICAgICAgICB0aGlzLm1heEN1cnNvciA9IHRoaXMuY3Vyc29yIC0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGJ5dGVzLmxlbmd0aCA8IDY0ICYmIGJ5dGVzLmxlbmd0aCA8IHRoaXMuY2h1bmtTaXplKSB7XG4gICAgICAgIC8vIG1ha2UgYSBuZXcgY2h1bmsgYW5kIGNvcHkgdGhlIG5ldyBvbmUgaW50byBpdFxuICAgICAgICB0b3BDaHVuayA9IGFsbG9jKHRoaXMuY2h1bmtTaXplKTtcbiAgICAgICAgdGhpcy5jaHVua3MucHVzaCh0b3BDaHVuayk7XG4gICAgICAgIHRoaXMubWF4Q3Vyc29yICs9IHRvcENodW5rLmxlbmd0aDtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRSZXVzZUNodW5rID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5faW5pdFJldXNlQ2h1bmsgPSB0b3BDaHVuaztcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHRvcENodW5rLnNldChieXRlcywgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBwdXNoIHRoZSBuZXcgYnl0ZXMgaW4gYXMgaXRzIG93biBjaHVua1xuICAgICAgICB0aGlzLmNodW5rcy5wdXNoKGJ5dGVzKTtcbiAgICAgICAgdGhpcy5tYXhDdXJzb3IgKz0gYnl0ZXMubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmN1cnNvciArPSBieXRlcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVzZXRdXG4gICAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxuICAgKi9cbiAgdG9CeXRlcyAocmVzZXQgPSBmYWxzZSkge1xuICAgIGxldCBieXRzO1xuICAgIGlmICh0aGlzLmNodW5rcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IGNodW5rID0gdGhpcy5jaHVua3NbMF07XG4gICAgICBpZiAocmVzZXQgJiYgdGhpcy5jdXJzb3IgPiBjaHVuay5sZW5ndGggLyAyKSB7XG4gICAgICAgIC8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBieXRzID0gdGhpcy5jdXJzb3IgPT09IGNodW5rLmxlbmd0aCA/IGNodW5rIDogY2h1bmsuc3ViYXJyYXkoMCwgdGhpcy5jdXJzb3IpO1xuICAgICAgICB0aGlzLl9pbml0UmV1c2VDaHVuayA9IG51bGw7XG4gICAgICAgIHRoaXMuY2h1bmtzID0gW107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGJ5dHMgPSBzbGljZShjaHVuaywgMCwgdGhpcy5jdXJzb3IpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBieXRzID0gY29uY2F0KHRoaXMuY2h1bmtzLCB0aGlzLmN1cnNvcik7XG4gICAgfVxuICAgIGlmIChyZXNldCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYnl0c1xuICB9XG59XG5cbmNvbnN0IGRlY29kZUVyclByZWZpeCA9ICdDQk9SIGRlY29kZSBlcnJvcjonO1xuY29uc3QgZW5jb2RlRXJyUHJlZml4ID0gJ0NCT1IgZW5jb2RlIGVycm9yOic7XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gbmVlZFxuICovXG5mdW5jdGlvbiBhc3NlcnRFbm91Z2hEYXRhIChkYXRhLCBwb3MsIG5lZWQpIHtcbiAgaWYgKGRhdGEubGVuZ3RoIC0gcG9zIDwgbmVlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IG5vdCBlbm91Z2ggZGF0YSBmb3IgdHlwZWApXG4gIH1cbn1cblxuLyogZ2xvYmFscyBCaWdJbnQgKi9cblxuXG5jb25zdCB1aW50Qm91bmRhcmllcyA9IFsyNCwgMjU2LCA2NTUzNiwgNDI5NDk2NzI5NiwgQmlnSW50KCcxODQ0Njc0NDA3MzcwOTU1MTYxNicpXTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2JsLmpzJykuQmx9IEJsXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5EZWNvZGVPcHRpb25zfSBEZWNvZGVPcHRpb25zXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gcmVhZFVpbnQ4IChkYXRhLCBvZmZzZXQsIG9wdGlvbnMpIHtcbiAgYXNzZXJ0RW5vdWdoRGF0YShkYXRhLCBvZmZzZXQsIDEpO1xuICBjb25zdCB2YWx1ZSA9IGRhdGFbb2Zmc2V0XTtcbiAgaWYgKG9wdGlvbnMuc3RyaWN0ID09PSB0cnVlICYmIHZhbHVlIDwgdWludEJvdW5kYXJpZXNbMF0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBpbnRlZ2VyIGVuY29kZWQgaW4gbW9yZSBieXRlcyB0aGFuIG5lY2Vzc2FyeSAoc3RyaWN0IGRlY29kZSlgKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiByZWFkVWludDE2IChkYXRhLCBvZmZzZXQsIG9wdGlvbnMpIHtcbiAgYXNzZXJ0RW5vdWdoRGF0YShkYXRhLCBvZmZzZXQsIDIpO1xuICBjb25zdCB2YWx1ZSA9IChkYXRhW29mZnNldF0gPDwgOCkgfCBkYXRhW29mZnNldCArIDFdO1xuICBpZiAob3B0aW9ucy5zdHJpY3QgPT09IHRydWUgJiYgdmFsdWUgPCB1aW50Qm91bmRhcmllc1sxXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGludGVnZXIgZW5jb2RlZCBpbiBtb3JlIGJ5dGVzIHRoYW4gbmVjZXNzYXJ5IChzdHJpY3QgZGVjb2RlKWApXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHJlYWRVaW50MzIgKGRhdGEsIG9mZnNldCwgb3B0aW9ucykge1xuICBhc3NlcnRFbm91Z2hEYXRhKGRhdGEsIG9mZnNldCwgNCk7XG4gIGNvbnN0IHZhbHVlID0gKGRhdGFbb2Zmc2V0XSAqIDE2Nzc3MjE2IC8qIDIgKiogMjQgKi8pICsgKGRhdGFbb2Zmc2V0ICsgMV0gPDwgMTYpICsgKGRhdGFbb2Zmc2V0ICsgMl0gPDwgOCkgKyBkYXRhW29mZnNldCArIDNdO1xuICBpZiAob3B0aW9ucy5zdHJpY3QgPT09IHRydWUgJiYgdmFsdWUgPCB1aW50Qm91bmRhcmllc1syXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGludGVnZXIgZW5jb2RlZCBpbiBtb3JlIGJ5dGVzIHRoYW4gbmVjZXNzYXJ5IChzdHJpY3QgZGVjb2RlKWApXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtudW1iZXJ8YmlnaW50fVxuICovXG5mdW5jdGlvbiByZWFkVWludDY0IChkYXRhLCBvZmZzZXQsIG9wdGlvbnMpIHtcbiAgLy8gYXNzdW1lIEJpZ0ludCwgY29udmVydCBiYWNrIHRvIE51bWJlciBpZiB3aXRoaW4gc2FmZSByYW5nZVxuICBhc3NlcnRFbm91Z2hEYXRhKGRhdGEsIG9mZnNldCwgOCk7XG4gIGNvbnN0IGhpID0gKGRhdGFbb2Zmc2V0XSAqIDE2Nzc3MjE2IC8qIDIgKiogMjQgKi8pICsgKGRhdGFbb2Zmc2V0ICsgMV0gPDwgMTYpICsgKGRhdGFbb2Zmc2V0ICsgMl0gPDwgOCkgKyBkYXRhW29mZnNldCArIDNdO1xuICBjb25zdCBsbyA9IChkYXRhW29mZnNldCArIDRdICogMTY3NzcyMTYgLyogMiAqKiAyNCAqLykgKyAoZGF0YVtvZmZzZXQgKyA1XSA8PCAxNikgKyAoZGF0YVtvZmZzZXQgKyA2XSA8PCA4KSArIGRhdGFbb2Zmc2V0ICsgN107XG4gIGNvbnN0IHZhbHVlID0gKEJpZ0ludChoaSkgPDwgQmlnSW50KDMyKSkgKyBCaWdJbnQobG8pO1xuICBpZiAob3B0aW9ucy5zdHJpY3QgPT09IHRydWUgJiYgdmFsdWUgPCB1aW50Qm91bmRhcmllc1szXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGludGVnZXIgZW5jb2RlZCBpbiBtb3JlIGJ5dGVzIHRoYW4gbmVjZXNzYXJ5IChzdHJpY3QgZGVjb2RlKWApXG4gIH1cbiAgaWYgKHZhbHVlIDw9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSlcbiAgfVxuICBpZiAob3B0aW9ucy5hbGxvd0JpZ0ludCA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB2YWx1ZVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGludGVnZXJzIG91dHNpZGUgb2YgdGhlIHNhZmUgaW50ZWdlciByYW5nZSBhcmUgbm90IHN1cHBvcnRlZGApXG59XG5cbi8qIG5vdCByZXF1aXJlZCB0aGFua3MgdG8gcXVpY2tbXSBsaXN0XG5jb25zdCBvbmVCeXRlVG9rZW5zID0gbmV3IEFycmF5KDI0KS5maWxsKDApLm1hcCgodiwgaSkgPT4gbmV3IFRva2VuKFR5cGUudWludCwgaSwgMSkpXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlVWludENvbXBhY3QgKGRhdGEsIHBvcywgbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9uZUJ5dGVUb2tlbnNbbWlub3JdXG59XG4qL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVVpbnQ4IChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudWludCwgcmVhZFVpbnQ4KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCAyKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVVpbnQxNiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLnVpbnQsIHJlYWRVaW50MTYoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyksIDMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlVWludDMyIChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudWludCwgcmVhZFVpbnQzMihkYXRhLCBwb3MgKyAxLCBvcHRpb25zKSwgNSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVVaW50NjQgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgVG9rZW4oVHlwZS51aW50LCByZWFkVWludDY0KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCA5KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Qmx9IGJ1ZlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVWludCAoYnVmLCB0b2tlbikge1xuICByZXR1cm4gZW5jb2RlVWludFZhbHVlKGJ1ZiwgMCwgdG9rZW4udmFsdWUpXG59XG5cbi8qKlxuICogQHBhcmFtIHtCbH0gYnVmXG4gKiBAcGFyYW0ge251bWJlcn0gbWFqb3JcbiAqIEBwYXJhbSB7bnVtYmVyfGJpZ2ludH0gdWludFxuICovXG5mdW5jdGlvbiBlbmNvZGVVaW50VmFsdWUgKGJ1ZiwgbWFqb3IsIHVpbnQpIHtcbiAgaWYgKHVpbnQgPCB1aW50Qm91bmRhcmllc1swXSkge1xuICAgIGNvbnN0IG51aW50ID0gTnVtYmVyKHVpbnQpO1xuICAgIC8vIHBhY2sgaW50byBvbmUgYnl0ZSwgbWlub3I9MCwgYWRkaXRpb25hbD12YWx1ZVxuICAgIGJ1Zi5wdXNoKFttYWpvciB8IG51aW50XSk7XG4gIH0gZWxzZSBpZiAodWludCA8IHVpbnRCb3VuZGFyaWVzWzFdKSB7XG4gICAgY29uc3QgbnVpbnQgPSBOdW1iZXIodWludCk7XG4gICAgLy8gcGFjayBpbnRvIHR3byBieXRlLCBtaW5vcj0wLCBhZGRpdGlvbmFsPTI0XG4gICAgYnVmLnB1c2goW21ham9yIHwgMjQsIG51aW50XSk7XG4gIH0gZWxzZSBpZiAodWludCA8IHVpbnRCb3VuZGFyaWVzWzJdKSB7XG4gICAgY29uc3QgbnVpbnQgPSBOdW1iZXIodWludCk7XG4gICAgLy8gcGFjayBpbnRvIHRocmVlIGJ5dGUsIG1pbm9yPTAsIGFkZGl0aW9uYWw9MjVcbiAgICBidWYucHVzaChbbWFqb3IgfCAyNSwgbnVpbnQgPj4+IDgsIG51aW50ICYgMHhmZl0pO1xuICB9IGVsc2UgaWYgKHVpbnQgPCB1aW50Qm91bmRhcmllc1szXSkge1xuICAgIGNvbnN0IG51aW50ID0gTnVtYmVyKHVpbnQpO1xuICAgIC8vIHBhY2sgaW50byBmaXZlIGJ5dGUsIG1pbm9yPTAsIGFkZGl0aW9uYWw9MjZcbiAgICBidWYucHVzaChbbWFqb3IgfCAyNiwgKG51aW50ID4+PiAyNCkgJiAweGZmLCAobnVpbnQgPj4+IDE2KSAmIDB4ZmYsIChudWludCA+Pj4gOCkgJiAweGZmLCBudWludCAmIDB4ZmZdKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBidWludCA9IEJpZ0ludCh1aW50KTtcbiAgICBpZiAoYnVpbnQgPCB1aW50Qm91bmRhcmllc1s0XSkge1xuICAgICAgLy8gcGFjayBpbnRvIG5pbmUgYnl0ZSwgbWlub3I9MCwgYWRkaXRpb25hbD0yN1xuICAgICAgY29uc3Qgc2V0ID0gW21ham9yIHwgMjcsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuICAgICAgLy8gc2ltdWxhdGUgYml0d2lzZSBhYm92ZSAzMiBiaXRzXG4gICAgICBsZXQgbG8gPSBOdW1iZXIoYnVpbnQgJiBCaWdJbnQoMHhmZmZmZmZmZikpO1xuICAgICAgbGV0IGhpID0gTnVtYmVyKGJ1aW50ID4+IEJpZ0ludCgzMikgJiBCaWdJbnQoMHhmZmZmZmZmZikpO1xuICAgICAgc2V0WzhdID0gbG8gJiAweGZmO1xuICAgICAgbG8gPSBsbyA+PiA4O1xuICAgICAgc2V0WzddID0gbG8gJiAweGZmO1xuICAgICAgbG8gPSBsbyA+PiA4O1xuICAgICAgc2V0WzZdID0gbG8gJiAweGZmO1xuICAgICAgbG8gPSBsbyA+PiA4O1xuICAgICAgc2V0WzVdID0gbG8gJiAweGZmO1xuICAgICAgc2V0WzRdID0gaGkgJiAweGZmO1xuICAgICAgaGkgPSBoaSA+PiA4O1xuICAgICAgc2V0WzNdID0gaGkgJiAweGZmO1xuICAgICAgaGkgPSBoaSA+PiA4O1xuICAgICAgc2V0WzJdID0gaGkgJiAweGZmO1xuICAgICAgaGkgPSBoaSA+PiA4O1xuICAgICAgc2V0WzFdID0gaGkgJiAweGZmO1xuICAgICAgYnVmLnB1c2goc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZW5jb3VudGVyZWQgQmlnSW50IGxhcmdlciB0aGFuIGFsbG93YWJsZSByYW5nZWApXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZVVpbnQuZW5jb2RlZFNpemUgPSBmdW5jdGlvbiBlbmNvZGVkU2l6ZSAodG9rZW4pIHtcbiAgcmV0dXJuIGVuY29kZVVpbnRWYWx1ZS5lbmNvZGVkU2l6ZSh0b2tlbi52YWx1ZSlcbn07XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHVpbnRcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZVVpbnRWYWx1ZS5lbmNvZGVkU2l6ZSA9IGZ1bmN0aW9uIGVuY29kZWRTaXplICh1aW50KSB7XG4gIGlmICh1aW50IDwgdWludEJvdW5kYXJpZXNbMF0pIHtcbiAgICByZXR1cm4gMVxuICB9XG4gIGlmICh1aW50IDwgdWludEJvdW5kYXJpZXNbMV0pIHtcbiAgICByZXR1cm4gMlxuICB9XG4gIGlmICh1aW50IDwgdWludEJvdW5kYXJpZXNbMl0pIHtcbiAgICByZXR1cm4gM1xuICB9XG4gIGlmICh1aW50IDwgdWludEJvdW5kYXJpZXNbM10pIHtcbiAgICByZXR1cm4gNVxuICB9XG4gIHJldHVybiA5XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRvazFcbiAqIEBwYXJhbSB7VG9rZW59IHRvazJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZVVpbnQuY29tcGFyZVRva2VucyA9IGZ1bmN0aW9uIGNvbXBhcmVUb2tlbnMgKHRvazEsIHRvazIpIHtcbiAgcmV0dXJuIHRvazEudmFsdWUgPCB0b2syLnZhbHVlID8gLTEgOiB0b2sxLnZhbHVlID4gdG9rMi52YWx1ZSA/IDEgOiAvKiBjOCBpZ25vcmUgbmV4dCAqLyAwXG59O1xuXG4vKiBlc2xpbnQtZW52IGVzMjAyMCAqL1xuXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9ibC5qcycpLkJsfSBCbFxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vaW50ZXJmYWNlJykuRGVjb2RlT3B0aW9uc30gRGVjb2RlT3B0aW9uc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlTmVnaW50OCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLm5lZ2ludCwgLTEgLSByZWFkVWludDgoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyksIDIpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlTmVnaW50MTYgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgVG9rZW4oVHlwZS5uZWdpbnQsIC0xIC0gcmVhZFVpbnQxNihkYXRhLCBwb3MgKyAxLCBvcHRpb25zKSwgMylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVOZWdpbnQzMiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLm5lZ2ludCwgLTEgLSByZWFkVWludDMyKGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCA1KVxufVxuXG5jb25zdCBuZWcxYiA9IEJpZ0ludCgtMSk7XG5jb25zdCBwb3MxYiA9IEJpZ0ludCgxKTtcblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVOZWdpbnQ2NCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgY29uc3QgaW50ID0gcmVhZFVpbnQ2NChkYXRhLCBwb3MgKyAxLCBvcHRpb25zKTtcbiAgaWYgKHR5cGVvZiBpbnQgIT09ICdiaWdpbnQnKSB7XG4gICAgY29uc3QgdmFsdWUgPSAtMSAtIGludDtcbiAgICBpZiAodmFsdWUgPj0gTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIpIHtcbiAgICAgIHJldHVybiBuZXcgVG9rZW4oVHlwZS5uZWdpbnQsIHZhbHVlLCA5KVxuICAgIH1cbiAgfVxuICBpZiAob3B0aW9ucy5hbGxvd0JpZ0ludCAhPT0gdHJ1ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGludGVnZXJzIG91dHNpZGUgb2YgdGhlIHNhZmUgaW50ZWdlciByYW5nZSBhcmUgbm90IHN1cHBvcnRlZGApXG4gIH1cbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLm5lZ2ludCwgbmVnMWIgLSBCaWdJbnQoaW50KSwgOSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0JsfSBidWZcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKi9cbmZ1bmN0aW9uIGVuY29kZU5lZ2ludCAoYnVmLCB0b2tlbikge1xuICBjb25zdCBuZWdpbnQgPSB0b2tlbi52YWx1ZTtcbiAgY29uc3QgdW5zaWduZWQgPSAodHlwZW9mIG5lZ2ludCA9PT0gJ2JpZ2ludCcgPyAobmVnaW50ICogbmVnMWIgLSBwb3MxYikgOiAobmVnaW50ICogLTEgLSAxKSk7XG4gIGVuY29kZVVpbnRWYWx1ZShidWYsIHRva2VuLnR5cGUubWFqb3JFbmNvZGVkLCB1bnNpZ25lZCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZU5lZ2ludC5lbmNvZGVkU2l6ZSA9IGZ1bmN0aW9uIGVuY29kZWRTaXplICh0b2tlbikge1xuICBjb25zdCBuZWdpbnQgPSB0b2tlbi52YWx1ZTtcbiAgY29uc3QgdW5zaWduZWQgPSAodHlwZW9mIG5lZ2ludCA9PT0gJ2JpZ2ludCcgPyAobmVnaW50ICogbmVnMWIgLSBwb3MxYikgOiAobmVnaW50ICogLTEgLSAxKSk7XG4gIC8qIGM4IGlnbm9yZSBuZXh0IDQgKi9cbiAgLy8gaGFuZGxlZCBieSBxdWlja0VuY29kZSwgd2Ugc2hvdWxkbid0IGdldCBoZXJlIGJ1dCBpdCdzIGluY2x1ZGVkIGZvciBjb21wbGV0ZW5lc3NcbiAgaWYgKHVuc2lnbmVkIDwgdWludEJvdW5kYXJpZXNbMF0pIHtcbiAgICByZXR1cm4gMVxuICB9XG4gIGlmICh1bnNpZ25lZCA8IHVpbnRCb3VuZGFyaWVzWzFdKSB7XG4gICAgcmV0dXJuIDJcbiAgfVxuICBpZiAodW5zaWduZWQgPCB1aW50Qm91bmRhcmllc1syXSkge1xuICAgIHJldHVybiAzXG4gIH1cbiAgaWYgKHVuc2lnbmVkIDwgdWludEJvdW5kYXJpZXNbM10pIHtcbiAgICByZXR1cm4gNVxuICB9XG4gIHJldHVybiA5XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRvazFcbiAqIEBwYXJhbSB7VG9rZW59IHRvazJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZU5lZ2ludC5jb21wYXJlVG9rZW5zID0gZnVuY3Rpb24gY29tcGFyZVRva2VucyAodG9rMSwgdG9rMikge1xuICAvLyBvcHBvc2l0ZSBvZiB0aGUgdWludCBjb21wYXJpc29uIHNpbmNlIHdlIHN0b3JlIHRoZSB1aW50IHZlcnNpb24gaW4gYnl0ZXNcbiAgcmV0dXJuIHRvazEudmFsdWUgPCB0b2syLnZhbHVlID8gMSA6IHRvazEudmFsdWUgPiB0b2syLnZhbHVlID8gLTEgOiAvKiBjOCBpZ25vcmUgbmV4dCAqLyAwXG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYmwuanMnKS5CbH0gQmxcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2ludGVyZmFjZScpLkRlY29kZU9wdGlvbnN9IERlY29kZU9wdGlvbnNcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWZpeFxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiB0b1Rva2VuJDMgKGRhdGEsIHBvcywgcHJlZml4LCBsZW5ndGgpIHtcbiAgYXNzZXJ0RW5vdWdoRGF0YShkYXRhLCBwb3MsIHByZWZpeCArIGxlbmd0aCk7XG4gIGNvbnN0IGJ1ZiA9IHNsaWNlKGRhdGEsIHBvcyArIHByZWZpeCwgcG9zICsgcHJlZml4ICsgbGVuZ3RoKTtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLmJ5dGVzLCBidWYsIHByZWZpeCArIGxlbmd0aClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBfb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVCeXRlc0NvbXBhY3QgKGRhdGEsIHBvcywgbWlub3IsIF9vcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDMoZGF0YSwgcG9zLCAxLCBtaW5vcilcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVCeXRlczggKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDMoZGF0YSwgcG9zLCAyLCByZWFkVWludDgoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQnl0ZXMxNiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4kMyhkYXRhLCBwb3MsIDMsIHJlYWRVaW50MTYoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQnl0ZXMzMiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4kMyhkYXRhLCBwb3MsIDUsIHJlYWRVaW50MzIoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8vIFRPRE86IG1heWJlIHdlIHNob3VsZG4ndCBzdXBwb3J0IHRoaXMgLi5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQnl0ZXM2NCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgY29uc3QgbCA9IHJlYWRVaW50NjQoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyk7XG4gIGlmICh0eXBlb2YgbCA9PT0gJ2JpZ2ludCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSA2NC1iaXQgaW50ZWdlciBieXRlcyBsZW5ndGhzIG5vdCBzdXBwb3J0ZWRgKVxuICB9XG4gIHJldHVybiB0b1Rva2VuJDMoZGF0YSwgcG9zLCA5LCBsKVxufVxuXG4vKipcbiAqIGBlbmNvZGVkQnl0ZXNgIGFsbG93cyBmb3IgY2FjaGluZyB3aGVuIHdlIGRvIGEgYnl0ZSB2ZXJzaW9uIG9mIGEgc3RyaW5nXG4gKiBmb3Iga2V5IHNvcnRpbmcgcHVycG9zZXNcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX1cbiAqL1xuZnVuY3Rpb24gdG9rZW5CeXRlcyAodG9rZW4pIHtcbiAgaWYgKHRva2VuLmVuY29kZWRCeXRlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdG9rZW4uZW5jb2RlZEJ5dGVzID0gdG9rZW4udHlwZSA9PT0gVHlwZS5zdHJpbmcgPyBmcm9tU3RyaW5nKHRva2VuLnZhbHVlKSA6IHRva2VuLnZhbHVlO1xuICB9XG4gIC8vIEB0cy1pZ25vcmUgYydtb25cbiAgcmV0dXJuIHRva2VuLmVuY29kZWRCeXRlc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7Qmx9IGJ1ZlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqL1xuZnVuY3Rpb24gZW5jb2RlQnl0ZXMgKGJ1ZiwgdG9rZW4pIHtcbiAgY29uc3QgYnl0ZXMgPSB0b2tlbkJ5dGVzKHRva2VuKTtcbiAgZW5jb2RlVWludFZhbHVlKGJ1ZiwgdG9rZW4udHlwZS5tYWpvckVuY29kZWQsIGJ5dGVzLmxlbmd0aCk7XG4gIGJ1Zi5wdXNoKGJ5dGVzKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZW5jb2RlQnl0ZXMuZW5jb2RlZFNpemUgPSBmdW5jdGlvbiBlbmNvZGVkU2l6ZSAodG9rZW4pIHtcbiAgY29uc3QgYnl0ZXMgPSB0b2tlbkJ5dGVzKHRva2VuKTtcbiAgcmV0dXJuIGVuY29kZVVpbnRWYWx1ZS5lbmNvZGVkU2l6ZShieXRlcy5sZW5ndGgpICsgYnl0ZXMubGVuZ3RoXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRvazFcbiAqIEBwYXJhbSB7VG9rZW59IHRvazJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZUJ5dGVzLmNvbXBhcmVUb2tlbnMgPSBmdW5jdGlvbiBjb21wYXJlVG9rZW5zICh0b2sxLCB0b2syKSB7XG4gIHJldHVybiBjb21wYXJlQnl0ZXModG9rZW5CeXRlcyh0b2sxKSwgdG9rZW5CeXRlcyh0b2syKSlcbn07XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBiMVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBiMlxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUJ5dGVzIChiMSwgYjIpIHtcbiAgcmV0dXJuIGIxLmxlbmd0aCA8IGIyLmxlbmd0aCA/IC0xIDogYjEubGVuZ3RoID4gYjIubGVuZ3RoID8gMSA6IGNvbXBhcmUoYjEsIGIyKVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYmwuanMnKS5CbH0gQmxcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2ludGVyZmFjZScpLkRlY29kZU9wdGlvbnN9IERlY29kZU9wdGlvbnNcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWZpeFxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIHRvVG9rZW4kMiAoZGF0YSwgcG9zLCBwcmVmaXgsIGxlbmd0aCwgb3B0aW9ucykge1xuICBjb25zdCB0b3RMZW5ndGggPSBwcmVmaXggKyBsZW5ndGg7XG4gIGFzc2VydEVub3VnaERhdGEoZGF0YSwgcG9zLCB0b3RMZW5ndGgpO1xuICBjb25zdCB0b2sgPSBuZXcgVG9rZW4oVHlwZS5zdHJpbmcsIHRvU3RyaW5nKGRhdGEsIHBvcyArIHByZWZpeCwgcG9zICsgdG90TGVuZ3RoKSwgdG90TGVuZ3RoKTtcbiAgaWYgKG9wdGlvbnMucmV0YWluU3RyaW5nQnl0ZXMgPT09IHRydWUpIHtcbiAgICB0b2suYnl0ZVZhbHVlID0gc2xpY2UoZGF0YSwgcG9zICsgcHJlZml4LCBwb3MgKyB0b3RMZW5ndGgpO1xuICB9XG4gIHJldHVybiB0b2tcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVN0cmluZ0NvbXBhY3QgKGRhdGEsIHBvcywgbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4kMihkYXRhLCBwb3MsIDEsIG1pbm9yLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVN0cmluZzggKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDIoZGF0YSwgcG9zLCAyLCByZWFkVWludDgoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyksIG9wdGlvbnMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlU3RyaW5nMTYgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDIoZGF0YSwgcG9zLCAzLCByZWFkVWludDE2KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVN0cmluZzMyIChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9Ub2tlbiQyKGRhdGEsIHBvcywgNSwgcmVhZFVpbnQzMihkYXRhLCBwb3MgKyAxLCBvcHRpb25zKSwgb3B0aW9ucylcbn1cblxuLy8gVE9ETzogbWF5YmUgd2Ugc2hvdWxkbid0IHN1cHBvcnQgdGhpcyAuLlxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVTdHJpbmc2NCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgY29uc3QgbCA9IHJlYWRVaW50NjQoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyk7XG4gIGlmICh0eXBlb2YgbCA9PT0gJ2JpZ2ludCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSA2NC1iaXQgaW50ZWdlciBzdHJpbmcgbGVuZ3RocyBub3Qgc3VwcG9ydGVkYClcbiAgfVxuICByZXR1cm4gdG9Ub2tlbiQyKGRhdGEsIHBvcywgOSwgbCwgb3B0aW9ucylcbn1cblxuY29uc3QgZW5jb2RlU3RyaW5nID0gZW5jb2RlQnl0ZXM7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9ibC5qcycpLkJsfSBCbFxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vaW50ZXJmYWNlJykuRGVjb2RlT3B0aW9uc30gRGVjb2RlT3B0aW9uc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBfZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IF9wb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVmaXhcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gdG9Ub2tlbiQxIChfZGF0YSwgX3BvcywgcHJlZml4LCBsZW5ndGgpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLmFycmF5LCBsZW5ndGgsIHByZWZpeClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBfb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVBcnJheUNvbXBhY3QgKGRhdGEsIHBvcywgbWlub3IsIF9vcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDEoZGF0YSwgcG9zLCAxLCBtaW5vcilcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVBcnJheTggKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiB0b1Rva2VuJDEoZGF0YSwgcG9zLCAyLCByZWFkVWludDgoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQXJyYXkxNiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4kMShkYXRhLCBwb3MsIDMsIHJlYWRVaW50MTYoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQXJyYXkzMiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4kMShkYXRhLCBwb3MsIDUsIHJlYWRVaW50MzIoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8vIFRPRE86IG1heWJlIHdlIHNob3VsZG4ndCBzdXBwb3J0IHRoaXMgLi5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlQXJyYXk2NCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgY29uc3QgbCA9IHJlYWRVaW50NjQoZGF0YSwgcG9zICsgMSwgb3B0aW9ucyk7XG4gIGlmICh0eXBlb2YgbCA9PT0gJ2JpZ2ludCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSA2NC1iaXQgaW50ZWdlciBhcnJheSBsZW5ndGhzIG5vdCBzdXBwb3J0ZWRgKVxuICB9XG4gIHJldHVybiB0b1Rva2VuJDEoZGF0YSwgcG9zLCA5LCBsKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZUFycmF5SW5kZWZpbml0ZSAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuYWxsb3dJbmRlZmluaXRlID09PSBmYWxzZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGluZGVmaW5pdGUgbGVuZ3RoIGl0ZW1zIG5vdCBhbGxvd2VkYClcbiAgfVxuICByZXR1cm4gdG9Ub2tlbiQxKGRhdGEsIHBvcywgMSwgSW5maW5pdHkpXG59XG5cbi8qKlxuICogQHBhcmFtIHtCbH0gYnVmXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICovXG5mdW5jdGlvbiBlbmNvZGVBcnJheSAoYnVmLCB0b2tlbikge1xuICBlbmNvZGVVaW50VmFsdWUoYnVmLCBUeXBlLmFycmF5Lm1ham9yRW5jb2RlZCwgdG9rZW4udmFsdWUpO1xufVxuXG4vLyB1c2luZyBhbiBhcnJheSBhcyBhIG1hcCBrZXksIGFyZSB5b3Ugc3VyZSBhYm91dCB0aGlzPyB3ZSBjYW4gb25seSBzb3J0XG4vLyBieSBtYXAgbGVuZ3RoIGhlcmUsIGl0J3MgdXAgdG8gdGhlIGVuY29kZXIgdG8gZGVjaWRlIHRvIGxvb2sgZGVlcGVyXG5lbmNvZGVBcnJheS5jb21wYXJlVG9rZW5zID0gZW5jb2RlVWludC5jb21wYXJlVG9rZW5zO1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5lbmNvZGVBcnJheS5lbmNvZGVkU2l6ZSA9IGZ1bmN0aW9uIGVuY29kZWRTaXplICh0b2tlbikge1xuICByZXR1cm4gZW5jb2RlVWludFZhbHVlLmVuY29kZWRTaXplKHRva2VuLnZhbHVlKVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2JsLmpzJykuQmx9IEJsXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5EZWNvZGVPcHRpb25zfSBEZWNvZGVPcHRpb25zXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IF9kYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gX3Bvc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWZpeFxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiB0b1Rva2VuIChfZGF0YSwgX3BvcywgcHJlZml4LCBsZW5ndGgpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLm1hcCwgbGVuZ3RoLCBwcmVmaXgpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gX29wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlTWFwQ29tcGFjdCAoZGF0YSwgcG9zLCBtaW5vciwgX29wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4oZGF0YSwgcG9zLCAxLCBtaW5vcilcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVNYXA4IChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9Ub2tlbihkYXRhLCBwb3MsIDIsIHJlYWRVaW50OChkYXRhLCBwb3MgKyAxLCBvcHRpb25zKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVNYXAxNiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRvVG9rZW4oZGF0YSwgcG9zLCAzLCByZWFkVWludDE2KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZU1hcDMyIChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9Ub2tlbihkYXRhLCBwb3MsIDUsIHJlYWRVaW50MzIoZGF0YSwgcG9zICsgMSwgb3B0aW9ucykpXG59XG5cbi8vIFRPRE86IG1heWJlIHdlIHNob3VsZG4ndCBzdXBwb3J0IHRoaXMgLi5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlTWFwNjQgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIGNvbnN0IGwgPSByZWFkVWludDY0KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpO1xuICBpZiAodHlwZW9mIGwgPT09ICdiaWdpbnQnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gNjQtYml0IGludGVnZXIgbWFwIGxlbmd0aHMgbm90IHN1cHBvcnRlZGApXG4gIH1cbiAgcmV0dXJuIHRvVG9rZW4oZGF0YSwgcG9zLCA5LCBsKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZU1hcEluZGVmaW5pdGUgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmFsbG93SW5kZWZpbml0ZSA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBpbmRlZmluaXRlIGxlbmd0aCBpdGVtcyBub3QgYWxsb3dlZGApXG4gIH1cbiAgcmV0dXJuIHRvVG9rZW4oZGF0YSwgcG9zLCAxLCBJbmZpbml0eSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0JsfSBidWZcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKi9cbmZ1bmN0aW9uIGVuY29kZU1hcCAoYnVmLCB0b2tlbikge1xuICBlbmNvZGVVaW50VmFsdWUoYnVmLCBUeXBlLm1hcC5tYWpvckVuY29kZWQsIHRva2VuLnZhbHVlKTtcbn1cblxuLy8gdXNpbmcgYSBtYXAgYXMgYSBtYXAga2V5LCBhcmUgeW91IHN1cmUgYWJvdXQgdGhpcz8gd2UgY2FuIG9ubHkgc29ydFxuLy8gYnkgbWFwIGxlbmd0aCBoZXJlLCBpdCdzIHVwIHRvIHRoZSBlbmNvZGVyIHRvIGRlY2lkZSB0byBsb29rIGRlZXBlclxuZW5jb2RlTWFwLmNvbXBhcmVUb2tlbnMgPSBlbmNvZGVVaW50LmNvbXBhcmVUb2tlbnM7XG5cbi8qKlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmVuY29kZU1hcC5lbmNvZGVkU2l6ZSA9IGZ1bmN0aW9uIGVuY29kZWRTaXplICh0b2tlbikge1xuICByZXR1cm4gZW5jb2RlVWludFZhbHVlLmVuY29kZWRTaXplKHRva2VuLnZhbHVlKVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2JsLmpzJykuQmx9IEJsXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5EZWNvZGVPcHRpb25zfSBEZWNvZGVPcHRpb25zXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IF9kYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gX3Bvc1xuICogQHBhcmFtIHtudW1iZXJ9IG1pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IF9vcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVRhZ0NvbXBhY3QgKF9kYXRhLCBfcG9zLCBtaW5vciwgX29wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLnRhZywgbWlub3IsIDEpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlVGFnOCAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLnRhZywgcmVhZFVpbnQ4KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCAyKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVRhZzE2IChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudGFnLCByZWFkVWludDE2KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCAzKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVRhZzMyIChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudGFnLCByZWFkVWludDMyKGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCA1KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZVRhZzY0IChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudGFnLCByZWFkVWludDY0KGRhdGEsIHBvcyArIDEsIG9wdGlvbnMpLCA5KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Qmx9IGJ1ZlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVGFnIChidWYsIHRva2VuKSB7XG4gIGVuY29kZVVpbnRWYWx1ZShidWYsIFR5cGUudGFnLm1ham9yRW5jb2RlZCwgdG9rZW4udmFsdWUpO1xufVxuXG5lbmNvZGVUYWcuY29tcGFyZVRva2VucyA9IGVuY29kZVVpbnQuY29tcGFyZVRva2VucztcblxuLyoqXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZW5jb2RlVGFnLmVuY29kZWRTaXplID0gZnVuY3Rpb24gZW5jb2RlZFNpemUgKHRva2VuKSB7XG4gIHJldHVybiBlbmNvZGVVaW50VmFsdWUuZW5jb2RlZFNpemUodG9rZW4udmFsdWUpXG59O1xuXG4vLyBUT0RPOiBzaGlmdCBzb21lIG9mIHRoZSBieXRlcyBsb2dpYyB0byBieXRlcy11dGlscyBzbyB3ZSBjYW4gdXNlIEJ1ZmZlclxuLy8gd2hlcmUgcG9zc2libGVcblxuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYmwuanMnKS5CbH0gQmxcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2ludGVyZmFjZScpLkRlY29kZU9wdGlvbnN9IERlY29kZU9wdGlvbnNcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2ludGVyZmFjZScpLkVuY29kZU9wdGlvbnN9IEVuY29kZU9wdGlvbnNcbiAqL1xuXG5jb25zdCBNSU5PUl9GQUxTRSA9IDIwO1xuY29uc3QgTUlOT1JfVFJVRSA9IDIxO1xuY29uc3QgTUlOT1JfTlVMTCA9IDIyO1xuY29uc3QgTUlOT1JfVU5ERUZJTkVEID0gMjM7XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBfZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IF9wb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVVbmRlZmluZWQgKF9kYXRhLCBfcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuYWxsb3dVbmRlZmluZWQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gdW5kZWZpbmVkIHZhbHVlcyBhcmUgbm90IHN1cHBvcnRlZGApXG4gIH0gZWxzZSBpZiAob3B0aW9ucy5jb2VyY2VVbmRlZmluZWRUb051bGwgPT09IHRydWUpIHtcbiAgICByZXR1cm4gbmV3IFRva2VuKFR5cGUubnVsbCwgbnVsbCwgMSlcbiAgfVxuICByZXR1cm4gbmV3IFRva2VuKFR5cGUudW5kZWZpbmVkLCB1bmRlZmluZWQsIDEpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBfZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IF9wb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVCcmVhayAoX2RhdGEsIF9wb3MsIF9taW5vciwgb3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5hbGxvd0luZGVmaW5pdGUgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gaW5kZWZpbml0ZSBsZW5ndGggaXRlbXMgbm90IGFsbG93ZWRgKVxuICB9XG4gIHJldHVybiBuZXcgVG9rZW4oVHlwZS5icmVhaywgdW5kZWZpbmVkLCAxKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVG9rZW4gKHZhbHVlLCBieXRlcywgb3B0aW9ucykge1xuICBpZiAob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmFsbG93TmFOID09PSBmYWxzZSAmJiBOdW1iZXIuaXNOYU4odmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBOYU4gdmFsdWVzIGFyZSBub3Qgc3VwcG9ydGVkYClcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuYWxsb3dJbmZpbml0eSA9PT0gZmFsc2UgJiYgKHZhbHVlID09PSBJbmZpbml0eSB8fCB2YWx1ZSA9PT0gLUluZmluaXR5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gSW5maW5pdHkgdmFsdWVzIGFyZSBub3Qgc3VwcG9ydGVkYClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLmZsb2F0LCB2YWx1ZSwgYnl0ZXMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gX21pbm9yXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtUb2tlbn1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlRmxvYXQxNiAoZGF0YSwgcG9zLCBfbWlub3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGNyZWF0ZVRva2VuKHJlYWRGbG9hdDE2KGRhdGEsIHBvcyArIDEpLCAzLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHBhcmFtIHtudW1iZXJ9IF9taW5vclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VG9rZW59XG4gKi9cbmZ1bmN0aW9uIGRlY29kZUZsb2F0MzIgKGRhdGEsIHBvcywgX21pbm9yLCBvcHRpb25zKSB7XG4gIHJldHVybiBjcmVhdGVUb2tlbihyZWFkRmxvYXQzMihkYXRhLCBwb3MgKyAxKSwgNSwgb3B0aW9ucylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBfbWlub3JcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1Rva2VufVxuICovXG5mdW5jdGlvbiBkZWNvZGVGbG9hdDY0IChkYXRhLCBwb3MsIF9taW5vciwgb3B0aW9ucykge1xuICByZXR1cm4gY3JlYXRlVG9rZW4ocmVhZEZsb2F0NjQoZGF0YSwgcG9zICsgMSksIDksIG9wdGlvbnMpXG59XG5cbi8qKlxuICogQHBhcmFtIHtCbH0gYnVmXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICogQHBhcmFtIHtFbmNvZGVPcHRpb25zfSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIGVuY29kZUZsb2F0IChidWYsIHRva2VuLCBvcHRpb25zKSB7XG4gIGNvbnN0IGZsb2F0ID0gdG9rZW4udmFsdWU7XG5cbiAgaWYgKGZsb2F0ID09PSBmYWxzZSkge1xuICAgIGJ1Zi5wdXNoKFtUeXBlLmZsb2F0Lm1ham9yRW5jb2RlZCB8IE1JTk9SX0ZBTFNFXSk7XG4gIH0gZWxzZSBpZiAoZmxvYXQgPT09IHRydWUpIHtcbiAgICBidWYucHVzaChbVHlwZS5mbG9hdC5tYWpvckVuY29kZWQgfCBNSU5PUl9UUlVFXSk7XG4gIH0gZWxzZSBpZiAoZmxvYXQgPT09IG51bGwpIHtcbiAgICBidWYucHVzaChbVHlwZS5mbG9hdC5tYWpvckVuY29kZWQgfCBNSU5PUl9OVUxMXSk7XG4gIH0gZWxzZSBpZiAoZmxvYXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1Zi5wdXNoKFtUeXBlLmZsb2F0Lm1ham9yRW5jb2RlZCB8IE1JTk9SX1VOREVGSU5FRF0pO1xuICB9IGVsc2Uge1xuICAgIGxldCBkZWNvZGVkO1xuICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XG4gICAgaWYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZmxvYXQ2NCAhPT0gdHJ1ZSkge1xuICAgICAgZW5jb2RlRmxvYXQxNihmbG9hdCk7XG4gICAgICBkZWNvZGVkID0gcmVhZEZsb2F0MTYodWk4YSwgMSk7XG4gICAgICBpZiAoZmxvYXQgPT09IGRlY29kZWQgfHwgTnVtYmVyLmlzTmFOKGZsb2F0KSkge1xuICAgICAgICB1aThhWzBdID0gMHhmOTtcbiAgICAgICAgYnVmLnB1c2godWk4YS5zbGljZSgwLCAzKSk7XG4gICAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW5jb2RlRmxvYXQzMihmbG9hdCk7XG4gICAgICAgIGRlY29kZWQgPSByZWFkRmxvYXQzMih1aThhLCAxKTtcbiAgICAgICAgaWYgKGZsb2F0ID09PSBkZWNvZGVkKSB7XG4gICAgICAgICAgdWk4YVswXSA9IDB4ZmE7XG4gICAgICAgICAgYnVmLnB1c2godWk4YS5zbGljZSgwLCA1KSk7XG4gICAgICAgICAgc3VjY2VzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICBlbmNvZGVGbG9hdDY0KGZsb2F0KTtcbiAgICAgIGRlY29kZWQgPSByZWFkRmxvYXQ2NCh1aThhLCAxKTtcbiAgICAgIHVpOGFbMF0gPSAweGZiO1xuICAgICAgYnVmLnB1c2godWk4YS5zbGljZSgwLCA5KSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZW5jb2RlRmxvYXQuZW5jb2RlZFNpemUgPSBmdW5jdGlvbiBlbmNvZGVkU2l6ZSAodG9rZW4sIG9wdGlvbnMpIHtcbiAgY29uc3QgZmxvYXQgPSB0b2tlbi52YWx1ZTtcblxuICBpZiAoZmxvYXQgPT09IGZhbHNlIHx8IGZsb2F0ID09PSB0cnVlIHx8IGZsb2F0ID09PSBudWxsIHx8IGZsb2F0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgaWYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZmxvYXQ2NCAhPT0gdHJ1ZSkge1xuICAgIGVuY29kZUZsb2F0MTYoZmxvYXQpO1xuICAgIGxldCBkZWNvZGVkID0gcmVhZEZsb2F0MTYodWk4YSwgMSk7XG4gICAgaWYgKGZsb2F0ID09PSBkZWNvZGVkIHx8IE51bWJlci5pc05hTihmbG9hdCkpIHtcbiAgICAgIHJldHVybiAzXG4gICAgfVxuICAgIGVuY29kZUZsb2F0MzIoZmxvYXQpO1xuICAgIGRlY29kZWQgPSByZWFkRmxvYXQzMih1aThhLCAxKTtcbiAgICBpZiAoZmxvYXQgPT09IGRlY29kZWQpIHtcbiAgICAgIHJldHVybiA1XG4gICAgfVxuICB9XG4gIHJldHVybiA5XG59O1xuXG5jb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoOSk7XG5jb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIsIDEpO1xuY29uc3QgdWk4YSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgMCk7XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGlucFxuICovXG5mdW5jdGlvbiBlbmNvZGVGbG9hdDE2IChpbnApIHtcbiAgaWYgKGlucCA9PT0gSW5maW5pdHkpIHtcbiAgICBkYXRhVmlldy5zZXRVaW50MTYoMCwgMHg3YzAwLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAoaW5wID09PSAtSW5maW5pdHkpIHtcbiAgICBkYXRhVmlldy5zZXRVaW50MTYoMCwgMHhmYzAwLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAoTnVtYmVyLmlzTmFOKGlucCkpIHtcbiAgICBkYXRhVmlldy5zZXRVaW50MTYoMCwgMHg3ZTAwLCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgZGF0YVZpZXcuc2V0RmxvYXQzMigwLCBpbnApO1xuICAgIGNvbnN0IHZhbHUzMiA9IGRhdGFWaWV3LmdldFVpbnQzMigwKTtcbiAgICBjb25zdCBleHBvbmVudCA9ICh2YWx1MzIgJiAweDdmODAwMDAwKSA+PiAyMztcbiAgICBjb25zdCBtYW50aXNzYSA9IHZhbHUzMiAmIDB4N2ZmZmZmO1xuXG4gICAgLyogYzggaWdub3JlIG5leHQgNiAqL1xuICAgIGlmIChleHBvbmVudCA9PT0gMHhmZikge1xuICAgICAgLy8gdG9vIGJpZywgSW5maW5pdHksIGJ1dCB0aGlzIHNob3VsZCBiZSBoYXJkIChpbXBvc3NpYmxlPykgdG8gdHJpZ2dlclxuICAgICAgZGF0YVZpZXcuc2V0VWludDE2KDAsIDB4N2MwMCwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZXhwb25lbnQgPT09IDB4MDApIHtcbiAgICAgIC8vIDAuMCwgLTAuMCBhbmQgc3Vibm9ybWFscywgc2hvdWxkbid0IGJlIHBvc3NpYmxlIHRvIGdldCBoZXJlIGJlY2F1c2UgMC4wIHNob3VsZCBiZSBjb3VudGVkIGFzIGFuIGludFxuICAgICAgZGF0YVZpZXcuc2V0VWludDE2KDAsICgoaW5wICYgMHg4MDAwMDAwMCkgPj4gMTYpIHwgKG1hbnRpc3NhID4+IDEzKSwgZmFsc2UpO1xuICAgIH0gZWxzZSB7IC8vIHN0YW5kYXJkIG51bWJlcnNcbiAgICAgIC8vIGNodW5rcyBvZiBsb2dpYyBoZXJlIGJvcnJvd2VkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL1BKSy9saWJjYm9yL2Jsb2IvYzc4ZjQzNzE4MjUzM2UzZWZhOGQ5NjNmZjRiOTQ1YmI2MzVjMjI4NC9zcmMvY2Jvci9lbmNvZGluZy5jI0wxMjdcbiAgICAgIGNvbnN0IGxvZ2ljYWxFeHBvbmVudCA9IGV4cG9uZW50IC0gMTI3O1xuICAgICAgLy8gTm93IHdlIGtub3cgdGhhdCAyXmV4cG9uZW50IDw9IDAgbG9naWNhbGx5XG4gICAgICAvKiBjOCBpZ25vcmUgbmV4dCA2ICovXG4gICAgICBpZiAobG9naWNhbEV4cG9uZW50IDwgLTI0KSB7XG4gICAgICAgIC8qIE5vIHVuYW1iaWd1b3VzIHJlcHJlc2VudGF0aW9uIGV4aXN0cywgdGhpcyBmbG9hdCBpcyBub3QgYSBoYWxmIGZsb2F0XG4gICAgICAgICAgYW5kIGlzIHRvbyBzbWFsbCB0byBiZSByZXByZXNlbnRlZCB1c2luZyBhIGhhbGYsIHJvdW5kIG9mZiB0byB6ZXJvLlxuICAgICAgICAgIENvbnNpc3RlbnQgd2l0aCB0aGUgcmVmZXJlbmNlIGltcGxlbWVudGF0aW9uLiAqL1xuICAgICAgICAvLyBzaG91bGQgYmUgZGlmZmljdWx0IChpbXBvc3NpYmxlPykgdG8gZ2V0IGhlcmUgaW4gSlNcbiAgICAgICAgZGF0YVZpZXcuc2V0VWludDE2KDAsIDApO1xuICAgICAgfSBlbHNlIGlmIChsb2dpY2FsRXhwb25lbnQgPCAtMTQpIHtcbiAgICAgICAgLyogT2Zmc2V0IHRoZSByZW1haW5pbmcgZGVjaW1hbCBwbGFjZXMgYnkgc2hpZnRpbmcgdGhlIHNpZ25pZmljYW5kLCB0aGVcbiAgICAgICAgICB2YWx1ZSBpcyBsb3N0LiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIGRlY2lzaW9uIHRoYXQgd29ya3MgYXJvdW5kIHRoZVxuICAgICAgICAgIGFic2VuY2Ugb2Ygc3RhbmRhcmQgaGFsZi1mbG9hdCBpbiB0aGUgbGFuZ3VhZ2UuICovXG4gICAgICAgIGRhdGFWaWV3LnNldFVpbnQxNigwLCAoKHZhbHUzMiAmIDB4ODAwMDAwMDApID4+IDE2KSB8IC8qIHNpZ24gYml0ICovICgxIDw8ICgyNCArIGxvZ2ljYWxFeHBvbmVudCkpLCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhVmlldy5zZXRVaW50MTYoMCwgKCh2YWx1MzIgJiAweDgwMDAwMDAwKSA+PiAxNikgfCAoKGxvZ2ljYWxFeHBvbmVudCArIDE1KSA8PCAxMCkgfCAobWFudGlzc2EgPj4gMTMpLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1aThhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiByZWFkRmxvYXQxNiAodWk4YSwgcG9zKSB7XG4gIGlmICh1aThhLmxlbmd0aCAtIHBvcyA8IDIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBub3QgZW5vdWdoIGRhdGEgZm9yIGZsb2F0MTZgKVxuICB9XG5cbiAgY29uc3QgaGFsZiA9ICh1aThhW3Bvc10gPDwgOCkgKyB1aThhW3BvcyArIDFdO1xuICBpZiAoaGFsZiA9PT0gMHg3YzAwKSB7XG4gICAgcmV0dXJuIEluZmluaXR5XG4gIH1cbiAgaWYgKGhhbGYgPT09IDB4ZmMwMCkge1xuICAgIHJldHVybiAtSW5maW5pdHlcbiAgfVxuICBpZiAoaGFsZiA9PT0gMHg3ZTAwKSB7XG4gICAgcmV0dXJuIE5hTlxuICB9XG4gIGNvbnN0IGV4cCA9IChoYWxmID4+IDEwKSAmIDB4MWY7XG4gIGNvbnN0IG1hbnQgPSBoYWxmICYgMHgzZmY7XG4gIGxldCB2YWw7XG4gIGlmIChleHAgPT09IDApIHtcbiAgICB2YWwgPSBtYW50ICogKDIgKiogLTI0KTtcbiAgfSBlbHNlIGlmIChleHAgIT09IDMxKSB7XG4gICAgdmFsID0gKG1hbnQgKyAxMDI0KSAqICgyICoqIChleHAgLSAyNSkpO1xuICAvKiBjOCBpZ25vcmUgbmV4dCA0ICovXG4gIH0gZWxzZSB7XG4gICAgLy8gbWF5IG5vdCBiZSBwb3NzaWJsZSB0byBnZXQgaGVyZVxuICAgIHZhbCA9IG1hbnQgPT09IDAgPyBJbmZpbml0eSA6IE5hTjtcbiAgfVxuICByZXR1cm4gKGhhbGYgJiAweDgwMDApID8gLXZhbCA6IHZhbFxufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbnBcbiAqL1xuZnVuY3Rpb24gZW5jb2RlRmxvYXQzMiAoaW5wKSB7XG4gIGRhdGFWaWV3LnNldEZsb2F0MzIoMCwgaW5wLCBmYWxzZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1aThhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiByZWFkRmxvYXQzMiAodWk4YSwgcG9zKSB7XG4gIGlmICh1aThhLmxlbmd0aCAtIHBvcyA8IDQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBub3QgZW5vdWdoIGRhdGEgZm9yIGZsb2F0MzJgKVxuICB9XG4gIGNvbnN0IG9mZnNldCA9ICh1aThhLmJ5dGVPZmZzZXQgfHwgMCkgKyBwb3M7XG4gIHJldHVybiBuZXcgRGF0YVZpZXcodWk4YS5idWZmZXIsIG9mZnNldCwgNCkuZ2V0RmxvYXQzMigwLCBmYWxzZSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gaW5wXG4gKi9cbmZ1bmN0aW9uIGVuY29kZUZsb2F0NjQgKGlucCkge1xuICBkYXRhVmlldy5zZXRGbG9hdDY0KDAsIGlucCwgZmFsc2UpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdWk4YVxuICogQHBhcmFtIHtudW1iZXJ9IHBvc1xuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gcmVhZEZsb2F0NjQgKHVpOGEsIHBvcykge1xuICBpZiAodWk4YS5sZW5ndGggLSBwb3MgPCA4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gbm90IGVub3VnaCBkYXRhIGZvciBmbG9hdDY0YClcbiAgfVxuICBjb25zdCBvZmZzZXQgPSAodWk4YS5ieXRlT2Zmc2V0IHx8IDApICsgcG9zO1xuICByZXR1cm4gbmV3IERhdGFWaWV3KHVpOGEuYnVmZmVyLCBvZmZzZXQsIDgpLmdldEZsb2F0NjQoMCwgZmFsc2UpXG59XG5cbi8qKlxuICogQHBhcmFtIHtUb2tlbn0gX3RvazFcbiAqIEBwYXJhbSB7VG9rZW59IF90b2syXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5lbmNvZGVGbG9hdC5jb21wYXJlVG9rZW5zID0gZW5jb2RlVWludC5jb21wYXJlVG9rZW5zO1xuLypcbmVuY29kZUZsb2F0LmNvbXBhcmVUb2tlbnMgPSBmdW5jdGlvbiBjb21wYXJlVG9rZW5zIChfdG9rMSwgX3RvazIpIHtcbiAgcmV0dXJuIF90b2sxXG4gIHRocm93IG5ldyBFcnJvcihgJHtlbmNvZGVFcnJQcmVmaXh9IGNhbm5vdCB1c2UgZmxvYXRzIGFzIG1hcCBrZXlzYClcbn1cbiovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vaW50ZXJmYWNlJykuRGVjb2RlT3B0aW9uc30gRGVjb2RlT3B0aW9uc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zXG4gKiBAcGFyYW0ge251bWJlcn0gbWlub3JcbiAqL1xuZnVuY3Rpb24gaW52YWxpZE1pbm9yIChkYXRhLCBwb3MsIG1pbm9yKSB7XG4gIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGVuY291bnRlcmVkIGludmFsaWQgbWlub3IgKCR7bWlub3J9KSBmb3IgbWFqb3IgJHtkYXRhW3Bvc10gPj4+IDV9YClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbXNnXG4gKiBAcmV0dXJucyB7KCk9PmFueX1cbiAqL1xuZnVuY3Rpb24gZXJyb3JlciAobXNnKSB7XG4gIHJldHVybiAoKSA9PiB7IHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9ICR7bXNnfWApIH1cbn1cblxuLyoqIEB0eXBlIHsoKGRhdGE6VWludDhBcnJheSwgcG9zOm51bWJlciwgbWlub3I6bnVtYmVyLCBvcHRpb25zPzpEZWNvZGVPcHRpb25zKSA9PiBhbnkpW119ICovXG5jb25zdCBqdW1wID0gW107XG5cbi8vIHVuc2lnbmVkIGludGVnZXIsIDB4MDAuLjB4MTcgKDAuLjIzKVxuZm9yIChsZXQgaSA9IDA7IGkgPD0gMHgxNzsgaSsrKSB7XG4gIGp1bXBbaV0gPSBpbnZhbGlkTWlub3I7IC8vIHVpbnQuZGVjb2RlVWludENvbXBhY3QsIGhhbmRsZWQgYnkgcXVpY2tbXVxufVxuanVtcFsweDE4XSA9IGRlY29kZVVpbnQ4OyAvLyB1bnNpZ25lZCBpbnRlZ2VyLCBvbmUtYnl0ZSB1aW50OF90IGZvbGxvd3Ncbmp1bXBbMHgxOV0gPSBkZWNvZGVVaW50MTY7IC8vIHVuc2lnbmVkIGludGVnZXIsIHR3by1ieXRlIHVpbnQxNl90IGZvbGxvd3Ncbmp1bXBbMHgxYV0gPSBkZWNvZGVVaW50MzI7IC8vIHVuc2lnbmVkIGludGVnZXIsIGZvdXItYnl0ZSB1aW50MzJfdCBmb2xsb3dzXG5qdW1wWzB4MWJdID0gZGVjb2RlVWludDY0OyAvLyB1bnNpZ25lZCBpbnRlZ2VyLCBlaWdodC1ieXRlIHVpbnQ2NF90IGZvbGxvd3Ncbmp1bXBbMHgxY10gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4MWRdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweDFlXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHgxZl0gPSBpbnZhbGlkTWlub3I7XG4vLyBuZWdhdGl2ZSBpbnRlZ2VyLCAtMS0weDAwLi4tMS0weDE3ICgtMS4uLTI0KVxuZm9yIChsZXQgaSA9IDB4MjA7IGkgPD0gMHgzNzsgaSsrKSB7XG4gIGp1bXBbaV0gPSBpbnZhbGlkTWlub3I7IC8vIG5lZ2ludERlY29kZSwgaGFuZGxlZCBieSBxdWlja1tdXG59XG5qdW1wWzB4MzhdID0gZGVjb2RlTmVnaW50ODsgLy8gbmVnYXRpdmUgaW50ZWdlciwgLTEtbiBvbmUtYnl0ZSB1aW50OF90IGZvciBuIGZvbGxvd3Ncbmp1bXBbMHgzOV0gPSBkZWNvZGVOZWdpbnQxNjsgLy8gbmVnYXRpdmUgaW50ZWdlciwgLTEtbiB0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiBmb2xsb3dzXG5qdW1wWzB4M2FdID0gZGVjb2RlTmVnaW50MzI7IC8vIG5lZ2F0aXZlIGludGVnZXIsIC0xLW4gZm91ci1ieXRlIHVpbnQzMl90IGZvciBmb2xsb3dzXG5qdW1wWzB4M2JdID0gZGVjb2RlTmVnaW50NjQ7IC8vIG5lZ2F0aXZlIGludGVnZXIsIC0xLW4gZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgZm9sbG93c1xuanVtcFsweDNjXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHgzZF0gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4M2VdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweDNmXSA9IGludmFsaWRNaW5vcjtcbi8vIGJ5dGUgc3RyaW5nLCAweDAwLi4weDE3IGJ5dGVzIGZvbGxvd1xuZm9yIChsZXQgaSA9IDB4NDA7IGkgPD0gMHg1NzsgaSsrKSB7XG4gIGp1bXBbaV0gPSBkZWNvZGVCeXRlc0NvbXBhY3Q7XG59XG5qdW1wWzB4NThdID0gZGVjb2RlQnl0ZXM4OyAvLyBieXRlIHN0cmluZywgb25lLWJ5dGUgdWludDhfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3dcbmp1bXBbMHg1OV0gPSBkZWNvZGVCeXRlczE2OyAvLyBieXRlIHN0cmluZywgdHdvLWJ5dGUgdWludDE2X3QgZm9yIG4sIGFuZCB0aGVuIG4gYnl0ZXMgZm9sbG93XG5qdW1wWzB4NWFdID0gZGVjb2RlQnl0ZXMzMjsgLy8gYnl0ZSBzdHJpbmcsIGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3dcbmp1bXBbMHg1Yl0gPSBkZWNvZGVCeXRlczY0OyAvLyBieXRlIHN0cmluZywgZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3dcbmp1bXBbMHg1Y10gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4NWRdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweDVlXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHg1Zl0gPSBlcnJvcmVyKCdpbmRlZmluaXRlIGxlbmd0aCBieXRlcy9zdHJpbmdzIGFyZSBub3Qgc3VwcG9ydGVkJyk7IC8vIGJ5dGUgc3RyaW5nLCBieXRlIHN0cmluZ3MgZm9sbG93LCB0ZXJtaW5hdGVkIGJ5IFwiYnJlYWtcIlxuLy8gVVRGLTggc3RyaW5nIDB4MDAuLjB4MTcgYnl0ZXMgZm9sbG93XG5mb3IgKGxldCBpID0gMHg2MDsgaSA8PSAweDc3OyBpKyspIHtcbiAganVtcFtpXSA9IGRlY29kZVN0cmluZ0NvbXBhY3Q7XG59XG5qdW1wWzB4NzhdID0gZGVjb2RlU3RyaW5nODsgLy8gVVRGLTggc3RyaW5nLCBvbmUtYnl0ZSB1aW50OF90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvd1xuanVtcFsweDc5XSA9IGRlY29kZVN0cmluZzE2OyAvLyBVVEYtOCBzdHJpbmcsIHR3by1ieXRlIHVpbnQxNl90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvd1xuanVtcFsweDdhXSA9IGRlY29kZVN0cmluZzMyOyAvLyBVVEYtOCBzdHJpbmcsIGZvdXItYnl0ZSB1aW50MzJfdCBmb3IgbiwgYW5kIHRoZW4gbiBieXRlcyBmb2xsb3dcbmp1bXBbMHg3Yl0gPSBkZWNvZGVTdHJpbmc2NDsgLy8gVVRGLTggc3RyaW5nLCBlaWdodC1ieXRlIHVpbnQ2NF90IGZvciBuLCBhbmQgdGhlbiBuIGJ5dGVzIGZvbGxvd1xuanVtcFsweDdjXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHg3ZF0gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4N2VdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweDdmXSA9IGVycm9yZXIoJ2luZGVmaW5pdGUgbGVuZ3RoIGJ5dGVzL3N0cmluZ3MgYXJlIG5vdCBzdXBwb3J0ZWQnKTsgLy8gVVRGLTggc3RyaW5ncyBmb2xsb3csIHRlcm1pbmF0ZWQgYnkgXCJicmVha1wiXG4vLyBhcnJheSwgMHgwMC4uMHgxNyBkYXRhIGl0ZW1zIGZvbGxvd1xuZm9yIChsZXQgaSA9IDB4ODA7IGkgPD0gMHg5NzsgaSsrKSB7XG4gIGp1bXBbaV0gPSBkZWNvZGVBcnJheUNvbXBhY3Q7XG59XG5qdW1wWzB4OThdID0gZGVjb2RlQXJyYXk4OyAvLyBhcnJheSwgb25lLWJ5dGUgdWludDhfdCBmb3IgbiwgYW5kIHRoZW4gbiBkYXRhIGl0ZW1zIGZvbGxvd1xuanVtcFsweDk5XSA9IGRlY29kZUFycmF5MTY7IC8vIGFycmF5LCB0d28tYnl0ZSB1aW50MTZfdCBmb3IgbiwgYW5kIHRoZW4gbiBkYXRhIGl0ZW1zIGZvbGxvd1xuanVtcFsweDlhXSA9IGRlY29kZUFycmF5MzI7IC8vIGFycmF5LCBmb3VyLWJ5dGUgdWludDMyX3QgZm9yIG4sIGFuZCB0aGVuIG4gZGF0YSBpdGVtcyBmb2xsb3dcbmp1bXBbMHg5Yl0gPSBkZWNvZGVBcnJheTY0OyAvLyBhcnJheSwgZWlnaHQtYnl0ZSB1aW50NjRfdCBmb3IgbiwgYW5kIHRoZW4gbiBkYXRhIGl0ZW1zIGZvbGxvd1xuanVtcFsweDljXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHg5ZF0gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4OWVdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweDlmXSA9IGRlY29kZUFycmF5SW5kZWZpbml0ZTsgLy8gYXJyYXksIGRhdGEgaXRlbXMgZm9sbG93LCB0ZXJtaW5hdGVkIGJ5IFwiYnJlYWtcIlxuLy8gbWFwLCAweDAwLi4weDE3IHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93XG5mb3IgKGxldCBpID0gMHhhMDsgaSA8PSAweGI3OyBpKyspIHtcbiAganVtcFtpXSA9IGRlY29kZU1hcENvbXBhY3Q7XG59XG5qdW1wWzB4YjhdID0gZGVjb2RlTWFwODsgLy8gbWFwLCBvbmUtYnl0ZSB1aW50OF90IGZvciBuLCBhbmQgdGhlbiBuIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93XG5qdW1wWzB4YjldID0gZGVjb2RlTWFwMTY7IC8vIG1hcCwgdHdvLWJ5dGUgdWludDE2X3QgZm9yIG4sIGFuZCB0aGVuIG4gcGFpcnMgb2YgZGF0YSBpdGVtcyBmb2xsb3dcbmp1bXBbMHhiYV0gPSBkZWNvZGVNYXAzMjsgLy8gbWFwLCBmb3VyLWJ5dGUgdWludDMyX3QgZm9yIG4sIGFuZCB0aGVuIG4gcGFpcnMgb2YgZGF0YSBpdGVtcyBmb2xsb3dcbmp1bXBbMHhiYl0gPSBkZWNvZGVNYXA2NDsgLy8gbWFwLCBlaWdodC1ieXRlIHVpbnQ2NF90IGZvciBuLCBhbmQgdGhlbiBuIHBhaXJzIG9mIGRhdGEgaXRlbXMgZm9sbG93XG5qdW1wWzB4YmNdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweGJkXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHhiZV0gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4YmZdID0gZGVjb2RlTWFwSW5kZWZpbml0ZTsgLy8gbWFwLCBwYWlycyBvZiBkYXRhIGl0ZW1zIGZvbGxvdywgdGVybWluYXRlZCBieSBcImJyZWFrXCJcbi8vIHRhZ3NcbmZvciAobGV0IGkgPSAweGMwOyBpIDw9IDB4ZDc7IGkrKykge1xuICBqdW1wW2ldID0gZGVjb2RlVGFnQ29tcGFjdDtcbn1cbmp1bXBbMHhkOF0gPSBkZWNvZGVUYWc4O1xuanVtcFsweGQ5XSA9IGRlY29kZVRhZzE2O1xuanVtcFsweGRhXSA9IGRlY29kZVRhZzMyO1xuanVtcFsweGRiXSA9IGRlY29kZVRhZzY0O1xuanVtcFsweGRjXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHhkZF0gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4ZGVdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweGRmXSA9IGludmFsaWRNaW5vcjtcbi8vIDB4ZTAuLjB4ZjMgc2ltcGxlIHZhbHVlcywgdW5zdXBwb3J0ZWRcbmZvciAobGV0IGkgPSAweGUwOyBpIDw9IDB4ZjM7IGkrKykge1xuICBqdW1wW2ldID0gZXJyb3Jlcignc2ltcGxlIHZhbHVlcyBhcmUgbm90IHN1cHBvcnRlZCcpO1xufVxuanVtcFsweGY0XSA9IGludmFsaWRNaW5vcjsgLy8gZmFsc2UsIGhhbmRsZWQgYnkgcXVpY2tbXVxuanVtcFsweGY1XSA9IGludmFsaWRNaW5vcjsgLy8gdHJ1ZSwgaGFuZGxlZCBieSBxdWlja1tdXG5qdW1wWzB4ZjZdID0gaW52YWxpZE1pbm9yOyAvLyBudWxsLCBoYW5kbGVkIGJ5IHF1aWNrW11cbmp1bXBbMHhmN10gPSBkZWNvZGVVbmRlZmluZWQ7IC8vIHVuZGVmaW5lZFxuanVtcFsweGY4XSA9IGVycm9yZXIoJ3NpbXBsZSB2YWx1ZXMgYXJlIG5vdCBzdXBwb3J0ZWQnKTsgLy8gc2ltcGxlIHZhbHVlLCBvbmUgYnl0ZSBmb2xsb3dzLCB1bnN1cHBvcnRlZFxuanVtcFsweGY5XSA9IGRlY29kZUZsb2F0MTY7IC8vIGhhbGYtcHJlY2lzaW9uIGZsb2F0ICh0d28tYnl0ZSBJRUVFIDc1NClcbmp1bXBbMHhmYV0gPSBkZWNvZGVGbG9hdDMyOyAvLyBzaW5nbGUtcHJlY2lzaW9uIGZsb2F0IChmb3VyLWJ5dGUgSUVFRSA3NTQpXG5qdW1wWzB4ZmJdID0gZGVjb2RlRmxvYXQ2NDsgLy8gZG91YmxlLXByZWNpc2lvbiBmbG9hdCAoZWlnaHQtYnl0ZSBJRUVFIDc1NClcbmp1bXBbMHhmY10gPSBpbnZhbGlkTWlub3I7XG5qdW1wWzB4ZmRdID0gaW52YWxpZE1pbm9yO1xuanVtcFsweGZlXSA9IGludmFsaWRNaW5vcjtcbmp1bXBbMHhmZl0gPSBkZWNvZGVCcmVhazsgLy8gXCJicmVha1wiIHN0b3AgY29kZVxuXG4vKiogQHR5cGUge1Rva2VuW119ICovXG5jb25zdCBxdWljayA9IFtdO1xuLy8gaW50cyA8MjRcbmZvciAobGV0IGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICBxdWlja1tpXSA9IG5ldyBUb2tlbihUeXBlLnVpbnQsIGksIDEpO1xufVxuLy8gbmVnaW50cyA+PSAtMjRcbmZvciAobGV0IGkgPSAtMTsgaSA+PSAtMjQ7IGktLSkge1xuICBxdWlja1szMSAtIGldID0gbmV3IFRva2VuKFR5cGUubmVnaW50LCBpLCAxKTtcbn1cbi8vIGVtcHR5IGJ5dGVzXG5xdWlja1sweDQwXSA9IG5ldyBUb2tlbihUeXBlLmJ5dGVzLCBuZXcgVWludDhBcnJheSgwKSwgMSk7XG4vLyBlbXB0eSBzdHJpbmdcbnF1aWNrWzB4NjBdID0gbmV3IFRva2VuKFR5cGUuc3RyaW5nLCAnJywgMSk7XG4vLyBlbXB0eSBsaXN0XG5xdWlja1sweDgwXSA9IG5ldyBUb2tlbihUeXBlLmFycmF5LCAwLCAxKTtcbi8vIGVtcHR5IG1hcFxucXVpY2tbMHhhMF0gPSBuZXcgVG9rZW4oVHlwZS5tYXAsIDAsIDEpO1xuLy8gZmFsc2VcbnF1aWNrWzB4ZjRdID0gbmV3IFRva2VuKFR5cGUuZmFsc2UsIGZhbHNlLCAxKTtcbi8vIHRydWVcbnF1aWNrWzB4ZjVdID0gbmV3IFRva2VuKFR5cGUudHJ1ZSwgdHJ1ZSwgMSk7XG4vLyBudWxsXG5xdWlja1sweGY2XSA9IG5ldyBUb2tlbihUeXBlLm51bGwsIG51bGwsIDEpO1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKiBAcmV0dXJucyB7VWludDhBcnJheXx1bmRlZmluZWR9XG4gKi9cbmZ1bmN0aW9uIHF1aWNrRW5jb2RlVG9rZW4gKHRva2VuKSB7XG4gIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgIGNhc2UgVHlwZS5mYWxzZTpcbiAgICAgIHJldHVybiBmcm9tQXJyYXkoWzB4ZjRdKVxuICAgIGNhc2UgVHlwZS50cnVlOlxuICAgICAgcmV0dXJuIGZyb21BcnJheShbMHhmNV0pXG4gICAgY2FzZSBUeXBlLm51bGw6XG4gICAgICByZXR1cm4gZnJvbUFycmF5KFsweGY2XSlcbiAgICBjYXNlIFR5cGUuYnl0ZXM6XG4gICAgICBpZiAoIXRva2VuLnZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnJvbUFycmF5KFsweDQwXSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIGNhc2UgVHlwZS5zdHJpbmc6XG4gICAgICBpZiAodG9rZW4udmFsdWUgPT09ICcnKSB7XG4gICAgICAgIHJldHVybiBmcm9tQXJyYXkoWzB4NjBdKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBUeXBlLmFycmF5OlxuICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmcm9tQXJyYXkoWzB4ODBdKVxuICAgICAgfVxuICAgICAgLyogYzggaWdub3JlIG5leHQgMiAqL1xuICAgICAgLy8gc2hvdWxkbid0IGJlIHBvc3NpYmxlIGlmIHRoaXMgd2VyZSBjYWxsZWQgd2hlbiB0aGVyZSB3YXMgb25seSBvbmUgdG9rZW5cbiAgICAgIHJldHVyblxuICAgIGNhc2UgVHlwZS5tYXA6XG4gICAgICBpZiAodG9rZW4udmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZyb21BcnJheShbMHhhMF0pXG4gICAgICB9XG4gICAgICAvKiBjOCBpZ25vcmUgbmV4dCAyICovXG4gICAgICAvLyBzaG91bGRuJ3QgYmUgcG9zc2libGUgaWYgdGhpcyB3ZXJlIGNhbGxlZCB3aGVuIHRoZXJlIHdhcyBvbmx5IG9uZSB0b2tlblxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBUeXBlLnVpbnQ6XG4gICAgICBpZiAodG9rZW4udmFsdWUgPCAyNCkge1xuICAgICAgICByZXR1cm4gZnJvbUFycmF5KFtOdW1iZXIodG9rZW4udmFsdWUpXSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIGNhc2UgVHlwZS5uZWdpbnQ6XG4gICAgICBpZiAodG9rZW4udmFsdWUgPj0gLTI0KSB7XG4gICAgICAgIHJldHVybiBmcm9tQXJyYXkoWzMxIC0gTnVtYmVyKHRva2VuLnZhbHVlKV0pXG4gICAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5FbmNvZGVPcHRpb25zfSBFbmNvZGVPcHRpb25zXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5PcHRpb25hbFR5cGVFbmNvZGVyfSBPcHRpb25hbFR5cGVFbmNvZGVyXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5SZWZlcmVuY2V9IFJlZmVyZW5jZVxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vaW50ZXJmYWNlJykuU3RyaWN0VHlwZUVuY29kZXJ9IFN0cmljdFR5cGVFbmNvZGVyXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5Ub2tlblR5cGVFbmNvZGVyfSBUb2tlblR5cGVFbmNvZGVyXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5Ub2tlbk9yTmVzdGVkVG9rZW5zfSBUb2tlbk9yTmVzdGVkVG9rZW5zXG4gKi9cblxuLyoqIEB0eXBlIHtFbmNvZGVPcHRpb25zfSAqL1xuY29uc3QgZGVmYXVsdEVuY29kZU9wdGlvbnMgPSB7XG4gIGZsb2F0NjQ6IGZhbHNlLFxuICBtYXBTb3J0ZXIsXG4gIHF1aWNrRW5jb2RlVG9rZW5cbn07XG5cbi8qKiBAcmV0dXJucyB7VG9rZW5UeXBlRW5jb2RlcltdfSAqL1xuZnVuY3Rpb24gbWFrZUNib3JFbmNvZGVycyAoKSB7XG4gIGNvbnN0IGVuY29kZXJzID0gW107XG4gIGVuY29kZXJzW1R5cGUudWludC5tYWpvcl0gPSBlbmNvZGVVaW50O1xuICBlbmNvZGVyc1tUeXBlLm5lZ2ludC5tYWpvcl0gPSBlbmNvZGVOZWdpbnQ7XG4gIGVuY29kZXJzW1R5cGUuYnl0ZXMubWFqb3JdID0gZW5jb2RlQnl0ZXM7XG4gIGVuY29kZXJzW1R5cGUuc3RyaW5nLm1ham9yXSA9IGVuY29kZVN0cmluZztcbiAgZW5jb2RlcnNbVHlwZS5hcnJheS5tYWpvcl0gPSBlbmNvZGVBcnJheTtcbiAgZW5jb2RlcnNbVHlwZS5tYXAubWFqb3JdID0gZW5jb2RlTWFwO1xuICBlbmNvZGVyc1tUeXBlLnRhZy5tYWpvcl0gPSBlbmNvZGVUYWc7XG4gIGVuY29kZXJzW1R5cGUuZmxvYXQubWFqb3JdID0gZW5jb2RlRmxvYXQ7XG4gIHJldHVybiBlbmNvZGVyc1xufVxuXG5jb25zdCBjYm9yRW5jb2RlcnMgPSBtYWtlQ2JvckVuY29kZXJzKCk7XG5cbmNvbnN0IGJ1ZiA9IG5ldyBCbCgpO1xuXG4vKiogQGltcGxlbWVudHMge1JlZmVyZW5jZX0gKi9cbmNsYXNzIFJlZiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdHxhbnlbXX0gb2JqXG4gICAqIEBwYXJhbSB7UmVmZXJlbmNlfHVuZGVmaW5lZH0gcGFyZW50XG4gICAqL1xuICBjb25zdHJ1Y3RvciAob2JqLCBwYXJlbnQpIHtcbiAgICB0aGlzLm9iaiA9IG9iajtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdHxhbnlbXX0gb2JqXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaW5jbHVkZXMgKG9iaikge1xuICAgIC8qKiBAdHlwZSB7UmVmZXJlbmNlfHVuZGVmaW5lZH0gKi9cbiAgICBsZXQgcCA9IHRoaXM7XG4gICAgZG8ge1xuICAgICAgaWYgKHAub2JqID09PSBvYmopIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9IHdoaWxlIChwID0gcC5wYXJlbnQpIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1JlZmVyZW5jZXx1bmRlZmluZWR9IHN0YWNrXG4gICAqIEBwYXJhbSB7b2JqZWN0fGFueVtdfSBvYmpcbiAgICogQHJldHVybnMge1JlZmVyZW5jZX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVDaGVjayAoc3RhY2ssIG9iaikge1xuICAgIGlmIChzdGFjayAmJiBzdGFjay5pbmNsdWRlcyhvYmopKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZW5jb2RlRXJyUHJlZml4fSBvYmplY3QgY29udGFpbnMgY2lyY3VsYXIgcmVmZXJlbmNlc2ApXG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVmKG9iaiwgc3RhY2spXG4gIH1cbn1cblxuY29uc3Qgc2ltcGxlVG9rZW5zID0ge1xuICBudWxsOiBuZXcgVG9rZW4oVHlwZS5udWxsLCBudWxsKSxcbiAgdW5kZWZpbmVkOiBuZXcgVG9rZW4oVHlwZS51bmRlZmluZWQsIHVuZGVmaW5lZCksXG4gIHRydWU6IG5ldyBUb2tlbihUeXBlLnRydWUsIHRydWUpLFxuICBmYWxzZTogbmV3IFRva2VuKFR5cGUuZmFsc2UsIGZhbHNlKSxcbiAgZW1wdHlBcnJheTogbmV3IFRva2VuKFR5cGUuYXJyYXksIDApLFxuICBlbXB0eU1hcDogbmV3IFRva2VuKFR5cGUubWFwLCAwKVxufTtcblxuLyoqIEB0eXBlIHt7W3R5cGVOYW1lOiBzdHJpbmddOiBTdHJpY3RUeXBlRW5jb2Rlcn19ICovXG5jb25zdCB0eXBlRW5jb2RlcnMgPSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb2JqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfdHlwXG4gICAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gX29wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtfcmVmU3RhY2tdXG4gICAqIEByZXR1cm5zIHtUb2tlbk9yTmVzdGVkVG9rZW5zfVxuICAgKi9cbiAgbnVtYmVyIChvYmosIF90eXAsIF9vcHRpb25zLCBfcmVmU3RhY2spIHtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIob2JqKSB8fCAhTnVtYmVyLmlzU2FmZUludGVnZXIob2JqKSkge1xuICAgICAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLmZsb2F0LCBvYmopXG4gICAgfSBlbHNlIGlmIChvYmogPj0gMCkge1xuICAgICAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLnVpbnQsIG9iailcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLm5lZ2ludCwgb2JqKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9ialxuICAgKiBAcGFyYW0ge3N0cmluZ30gX3R5cFxuICAgKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IF9vcHRpb25zXG4gICAqIEBwYXJhbSB7UmVmZXJlbmNlfSBbX3JlZlN0YWNrXVxuICAgKiBAcmV0dXJucyB7VG9rZW5Pck5lc3RlZFRva2Vuc31cbiAgICovXG4gIGJpZ2ludCAob2JqLCBfdHlwLCBfb3B0aW9ucywgX3JlZlN0YWNrKSB7XG4gICAgaWYgKG9iaiA+PSBCaWdJbnQoMCkpIHtcbiAgICAgIHJldHVybiBuZXcgVG9rZW4oVHlwZS51aW50LCBvYmopXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgVG9rZW4oVHlwZS5uZWdpbnQsIG9iailcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvYmpcbiAgICogQHBhcmFtIHtzdHJpbmd9IF90eXBcbiAgICogQHBhcmFtIHtFbmNvZGVPcHRpb25zfSBfb3B0aW9uc1xuICAgKiBAcGFyYW0ge1JlZmVyZW5jZX0gW19yZWZTdGFja11cbiAgICogQHJldHVybnMge1Rva2VuT3JOZXN0ZWRUb2tlbnN9XG4gICAqL1xuICBVaW50OEFycmF5IChvYmosIF90eXAsIF9vcHRpb25zLCBfcmVmU3RhY2spIHtcbiAgICByZXR1cm4gbmV3IFRva2VuKFR5cGUuYnl0ZXMsIG9iailcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9ialxuICAgKiBAcGFyYW0ge3N0cmluZ30gX3R5cFxuICAgKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IF9vcHRpb25zXG4gICAqIEBwYXJhbSB7UmVmZXJlbmNlfSBbX3JlZlN0YWNrXVxuICAgKiBAcmV0dXJucyB7VG9rZW5Pck5lc3RlZFRva2Vuc31cbiAgICovXG4gIHN0cmluZyAob2JqLCBfdHlwLCBfb3B0aW9ucywgX3JlZlN0YWNrKSB7XG4gICAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLnN0cmluZywgb2JqKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb2JqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfdHlwXG4gICAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gX29wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtfcmVmU3RhY2tdXG4gICAqIEByZXR1cm5zIHtUb2tlbk9yTmVzdGVkVG9rZW5zfVxuICAgKi9cbiAgYm9vbGVhbiAob2JqLCBfdHlwLCBfb3B0aW9ucywgX3JlZlN0YWNrKSB7XG4gICAgcmV0dXJuIG9iaiA/IHNpbXBsZVRva2Vucy50cnVlIDogc2ltcGxlVG9rZW5zLmZhbHNlXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBfb2JqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfdHlwXG4gICAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gX29wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtfcmVmU3RhY2tdXG4gICAqIEByZXR1cm5zIHtUb2tlbk9yTmVzdGVkVG9rZW5zfVxuICAgKi9cbiAgbnVsbCAoX29iaiwgX3R5cCwgX29wdGlvbnMsIF9yZWZTdGFjaykge1xuICAgIHJldHVybiBzaW1wbGVUb2tlbnMubnVsbFxuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gX29ialxuICAgKiBAcGFyYW0ge3N0cmluZ30gX3R5cFxuICAgKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IF9vcHRpb25zXG4gICAqIEBwYXJhbSB7UmVmZXJlbmNlfSBbX3JlZlN0YWNrXVxuICAgKiBAcmV0dXJucyB7VG9rZW5Pck5lc3RlZFRva2Vuc31cbiAgICovXG4gIHVuZGVmaW5lZCAoX29iaiwgX3R5cCwgX29wdGlvbnMsIF9yZWZTdGFjaykge1xuICAgIHJldHVybiBzaW1wbGVUb2tlbnMudW5kZWZpbmVkXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvYmpcbiAgICogQHBhcmFtIHtzdHJpbmd9IF90eXBcbiAgICogQHBhcmFtIHtFbmNvZGVPcHRpb25zfSBfb3B0aW9uc1xuICAgKiBAcGFyYW0ge1JlZmVyZW5jZX0gW19yZWZTdGFja11cbiAgICogQHJldHVybnMge1Rva2VuT3JOZXN0ZWRUb2tlbnN9XG4gICAqL1xuICBBcnJheUJ1ZmZlciAob2JqLCBfdHlwLCBfb3B0aW9ucywgX3JlZlN0YWNrKSB7XG4gICAgcmV0dXJuIG5ldyBUb2tlbihUeXBlLmJ5dGVzLCBuZXcgVWludDhBcnJheShvYmopKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb2JqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfdHlwXG4gICAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gX29wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtfcmVmU3RhY2tdXG4gICAqIEByZXR1cm5zIHtUb2tlbk9yTmVzdGVkVG9rZW5zfVxuICAgKi9cbiAgRGF0YVZpZXcgKG9iaiwgX3R5cCwgX29wdGlvbnMsIF9yZWZTdGFjaykge1xuICAgIHJldHVybiBuZXcgVG9rZW4oVHlwZS5ieXRlcywgbmV3IFVpbnQ4QXJyYXkob2JqLmJ1ZmZlciwgb2JqLmJ5dGVPZmZzZXQsIG9iai5ieXRlTGVuZ3RoKSlcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9ialxuICAgKiBAcGFyYW0ge3N0cmluZ30gX3R5cFxuICAgKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtyZWZTdGFja11cbiAgICogQHJldHVybnMge1Rva2VuT3JOZXN0ZWRUb2tlbnN9XG4gICAqL1xuICBBcnJheSAob2JqLCBfdHlwLCBvcHRpb25zLCByZWZTdGFjaykge1xuICAgIGlmICghb2JqLmxlbmd0aCkge1xuICAgICAgaWYgKG9wdGlvbnMuYWRkQnJlYWtUb2tlbnMgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIFtzaW1wbGVUb2tlbnMuZW1wdHlBcnJheSwgbmV3IFRva2VuKFR5cGUuYnJlYWspXVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNpbXBsZVRva2Vucy5lbXB0eUFycmF5XG4gICAgfVxuICAgIHJlZlN0YWNrID0gUmVmLmNyZWF0ZUNoZWNrKHJlZlN0YWNrLCBvYmopO1xuICAgIGNvbnN0IGVudHJpZXMgPSBbXTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBlIG9mIG9iaikge1xuICAgICAgZW50cmllc1tpKytdID0gb2JqZWN0VG9Ub2tlbnMoZSwgb3B0aW9ucywgcmVmU3RhY2spO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5hZGRCcmVha1Rva2Vucykge1xuICAgICAgcmV0dXJuIFtuZXcgVG9rZW4oVHlwZS5hcnJheSwgb2JqLmxlbmd0aCksIGVudHJpZXMsIG5ldyBUb2tlbihUeXBlLmJyZWFrKV1cbiAgICB9XG4gICAgcmV0dXJuIFtuZXcgVG9rZW4oVHlwZS5hcnJheSwgb2JqLmxlbmd0aCksIGVudHJpZXNdXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvYmpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cFxuICAgKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtSZWZlcmVuY2V9IFtyZWZTdGFja11cbiAgICogQHJldHVybnMge1Rva2VuT3JOZXN0ZWRUb2tlbnN9XG4gICAqL1xuICBPYmplY3QgKG9iaiwgdHlwLCBvcHRpb25zLCByZWZTdGFjaykge1xuICAgIC8vIGNvdWxkIGJlIGFuIE9iamVjdCBvciBhIE1hcFxuICAgIGNvbnN0IGlzTWFwID0gdHlwICE9PSAnT2JqZWN0JztcbiAgICAvLyBpdCdzIHNsaWdodGx5IHF1aWNrZXIgdG8gdXNlIE9iamVjdC5rZXlzKCkgdGhhbiBPYmplY3QuZW50cmllcygpXG4gICAgY29uc3Qga2V5cyA9IGlzTWFwID8gb2JqLmtleXMoKSA6IE9iamVjdC5rZXlzKG9iaik7XG4gICAgY29uc3QgbGVuZ3RoID0gaXNNYXAgPyBvYmouc2l6ZSA6IGtleXMubGVuZ3RoO1xuICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICBpZiAob3B0aW9ucy5hZGRCcmVha1Rva2VucyA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gW3NpbXBsZVRva2Vucy5lbXB0eU1hcCwgbmV3IFRva2VuKFR5cGUuYnJlYWspXVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNpbXBsZVRva2Vucy5lbXB0eU1hcFxuICAgIH1cbiAgICByZWZTdGFjayA9IFJlZi5jcmVhdGVDaGVjayhyZWZTdGFjaywgb2JqKTtcbiAgICAvKiogQHR5cGUge1Rva2VuT3JOZXN0ZWRUb2tlbnNbXX0gKi9cbiAgICBjb25zdCBlbnRyaWVzID0gW107XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGVudHJpZXNbaSsrXSA9IFtcbiAgICAgICAgb2JqZWN0VG9Ub2tlbnMoa2V5LCBvcHRpb25zLCByZWZTdGFjayksXG4gICAgICAgIG9iamVjdFRvVG9rZW5zKGlzTWFwID8gb2JqLmdldChrZXkpIDogb2JqW2tleV0sIG9wdGlvbnMsIHJlZlN0YWNrKVxuICAgICAgXTtcbiAgICB9XG4gICAgc29ydE1hcEVudHJpZXMoZW50cmllcywgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuYWRkQnJlYWtUb2tlbnMpIHtcbiAgICAgIHJldHVybiBbbmV3IFRva2VuKFR5cGUubWFwLCBsZW5ndGgpLCBlbnRyaWVzLCBuZXcgVG9rZW4oVHlwZS5icmVhayldXG4gICAgfVxuICAgIHJldHVybiBbbmV3IFRva2VuKFR5cGUubWFwLCBsZW5ndGgpLCBlbnRyaWVzXVxuICB9XG59O1xuXG50eXBlRW5jb2RlcnMuTWFwID0gdHlwZUVuY29kZXJzLk9iamVjdDtcbnR5cGVFbmNvZGVycy5CdWZmZXIgPSB0eXBlRW5jb2RlcnMuVWludDhBcnJheTtcbmZvciAoY29uc3QgdHlwIG9mICdVaW50OENsYW1wZWQgVWludDE2IFVpbnQzMiBJbnQ4IEludDE2IEludDMyIEJpZ1VpbnQ2NCBCaWdJbnQ2NCBGbG9hdDMyIEZsb2F0NjQnLnNwbGl0KCcgJykpIHtcbiAgdHlwZUVuY29kZXJzW2Ake3R5cH1BcnJheWBdID0gdHlwZUVuY29kZXJzLkRhdGFWaWV3O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBvYmpcbiAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gW29wdGlvbnNdXG4gKiBAcGFyYW0ge1JlZmVyZW5jZX0gW3JlZlN0YWNrXVxuICogQHJldHVybnMge1Rva2VuT3JOZXN0ZWRUb2tlbnN9XG4gKi9cbmZ1bmN0aW9uIG9iamVjdFRvVG9rZW5zIChvYmosIG9wdGlvbnMgPSB7fSwgcmVmU3RhY2spIHtcbiAgY29uc3QgdHlwID0gaXMob2JqKTtcbiAgY29uc3QgY3VzdG9tVHlwZUVuY29kZXIgPSAob3B0aW9ucyAmJiBvcHRpb25zLnR5cGVFbmNvZGVycyAmJiAvKiogQHR5cGUge09wdGlvbmFsVHlwZUVuY29kZXJ9ICovIG9wdGlvbnMudHlwZUVuY29kZXJzW3R5cF0pIHx8IHR5cGVFbmNvZGVyc1t0eXBdO1xuICBpZiAodHlwZW9mIGN1c3RvbVR5cGVFbmNvZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdG9rZW5zID0gY3VzdG9tVHlwZUVuY29kZXIob2JqLCB0eXAsIG9wdGlvbnMsIHJlZlN0YWNrKTtcbiAgICBpZiAodG9rZW5zICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0b2tlbnNcbiAgICB9XG4gIH1cbiAgY29uc3QgdHlwZUVuY29kZXIgPSB0eXBlRW5jb2RlcnNbdHlwXTtcbiAgaWYgKCF0eXBlRW5jb2Rlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtlbmNvZGVFcnJQcmVmaXh9IHVuc3VwcG9ydGVkIHR5cGU6ICR7dHlwfWApXG4gIH1cbiAgcmV0dXJuIHR5cGVFbmNvZGVyKG9iaiwgdHlwLCBvcHRpb25zLCByZWZTdGFjaylcbn1cblxuLypcbkNCT1Iga2V5IHNvcnRpbmcgaXMgYSBtZXNzLlxuXG5UaGUgY2Fub25pY2FsaXNhdGlvbiByZWNvbW1lbmRhdGlvbiBmcm9tIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3MDQ5I3NlY3Rpb24tMy45XG5pbmNsdWRlcyB0aGUgd29yZGluZzpcblxuPiBUaGUga2V5cyBpbiBldmVyeSBtYXAgbXVzdCBiZSBzb3J0ZWQgbG93ZXN0IHZhbHVlIHRvIGhpZ2hlc3QuXG4+IFNvcnRpbmcgaXMgcGVyZm9ybWVkIG9uIHRoZSBieXRlcyBvZiB0aGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGtleVxuPiBkYXRhIGl0ZW1zIHdpdGhvdXQgcGF5aW5nIGF0dGVudGlvbiB0byB0aGUgMy81IGJpdCBzcGxpdHRpbmcgZm9yXG4+IG1ham9yIHR5cGVzLlxuPiAuLi5cbj4gICogIElmIHR3byBrZXlzIGhhdmUgZGlmZmVyZW50IGxlbmd0aHMsIHRoZSBzaG9ydGVyIG9uZSBzb3J0c1xuICAgICAgZWFybGllcjtcbj4gICogIElmIHR3byBrZXlzIGhhdmUgdGhlIHNhbWUgbGVuZ3RoLCB0aGUgb25lIHdpdGggdGhlIGxvd2VyIHZhbHVlXG4gICAgICBpbiAoYnl0ZS13aXNlKSBsZXhpY2FsIG9yZGVyIHNvcnRzIGVhcmxpZXIuXG5cbjEuIEl0IGlzIG5vdCBjbGVhciB3aGF0IFwiYnl0ZXMgb2YgdGhlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBrZXlcIiBtZWFuczogaXMgaXRcbiAgIHRoZSBDQk9SIHJlcHJlc2VudGF0aW9uLCBvciB0aGUgYmluYXJ5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QgaXRzZWxmP1xuICAgQ29uc2lkZXIgdGhlIGludCBhbmQgdWludCBkaWZmZXJlbmNlIGhlcmUuXG4yLiBJdCBpcyBub3QgY2xlYXIgd2hhdCBcIndpdGhvdXQgcGF5aW5nIGF0dGVudGlvbiB0b1wiIG1lYW5zOiBkbyB3ZSBpbmNsdWRlIGl0XG4gICBhbmQgY29tcGFyZSBvbiB0aGF0PyBPciBkbyB3ZSBvbWl0IHRoZSBzcGVjaWFsIHByZWZpeCBieXRlLCAobW9zdGx5KSB0cmVhdGluZ1xuICAgdGhlIGtleSBpbiBpdHMgcGxhaW4gYmluYXJ5IHJlcHJlc2VudGF0aW9uIGZvcm0uXG5cblRoZSBGSURPIDIuMDogQ2xpZW50IFRvIEF1dGhlbnRpY2F0b3IgUHJvdG9jb2wgc3BlYyB0YWtlcyB0aGUgb3JpZ2luYWwgQ0JPUlxud29yZGluZyBhbmQgY2xhcmlmaWVzIGl0IGFjY29yZGluZyB0byB0aGVpciB1bmRlcnN0YW5kaW5nLlxuaHR0cHM6Ly9maWRvYWxsaWFuY2Uub3JnL3NwZWNzL2ZpZG8tdjIuMC1yZC0yMDE3MDkyNy9maWRvLWNsaWVudC10by1hdXRoZW50aWNhdG9yLXByb3RvY29sLXYyLjAtcmQtMjAxNzA5MjcuaHRtbCNtZXNzYWdlLWVuY29kaW5nXG5cbj4gVGhlIGtleXMgaW4gZXZlcnkgbWFwIG11c3QgYmUgc29ydGVkIGxvd2VzdCB2YWx1ZSB0byBoaWdoZXN0LiBTb3J0aW5nIGlzXG4+IHBlcmZvcm1lZCBvbiB0aGUgYnl0ZXMgb2YgdGhlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBrZXkgZGF0YSBpdGVtcyB3aXRob3V0XG4+IHBheWluZyBhdHRlbnRpb24gdG8gdGhlIDMvNSBiaXQgc3BsaXR0aW5nIGZvciBtYWpvciB0eXBlcy4gVGhlIHNvcnRpbmcgcnVsZXNcbj4gYXJlOlxuPiAgKiBJZiB0aGUgbWFqb3IgdHlwZXMgYXJlIGRpZmZlcmVudCwgdGhlIG9uZSB3aXRoIHRoZSBsb3dlciB2YWx1ZSBpbiBudW1lcmljYWxcbj4gICAgb3JkZXIgc29ydHMgZWFybGllci5cbj4gICogSWYgdHdvIGtleXMgaGF2ZSBkaWZmZXJlbnQgbGVuZ3RocywgdGhlIHNob3J0ZXIgb25lIHNvcnRzIGVhcmxpZXI7XG4+ICAqIElmIHR3byBrZXlzIGhhdmUgdGhlIHNhbWUgbGVuZ3RoLCB0aGUgb25lIHdpdGggdGhlIGxvd2VyIHZhbHVlIGluXG4+ICAgIChieXRlLXdpc2UpIGxleGljYWwgb3JkZXIgc29ydHMgZWFybGllci5cblxuU29tZSBvdGhlciBpbXBsZW1lbnRhdGlvbnMsIHN1Y2ggYXMgYm9yYywgZG8gYSBmdWxsIGVuY29kZSB0aGVuIGRvIGFcbmxlbmd0aC1maXJzdCwgYnl0ZS13aXNlLXNlY29uZCBjb21wYXJpc29uOlxuaHR0cHM6Ly9naXRodWIuY29tL2RpZ25pZmllZHF1aXJlL2JvcmMvYmxvYi9iNmJhZThiMGJjZGU3YzM5NzZiMGYwZjA5NTcyMDgwOTVjMzkyYTM2L3NyYy9lbmNvZGVyLmpzI0wzNThcbmh0dHBzOi8vZ2l0aHViLmNvbS9kaWduaWZpZWRxdWlyZS9ib3JjL2Jsb2IvYjZiYWU4YjBiY2RlN2MzOTc2YjBmMGYwOTU3MjA4MDk1YzM5MmEzNi9zcmMvdXRpbHMuanMjTDE0My1MMTUxXG5cblRoaXMgaGFzIHRoZSBiZW5lZml0IG9mIGJlaW5nIGFibGUgdG8gZWFzaWx5IGhhbmRsZSBhcmJpdHJhcnkga2V5cywgaW5jbHVkaW5nXG5jb21wbGV4IHR5cGVzIChtYXBzIGFuZCBhcnJheXMpLlxuXG5XZSdsbCBvcHQgZm9yIHRoZSBGSURPIGFwcHJvYWNoLCBzaW5jZSBpdCBhZmZvcmRzIHNvbWUgZWZmaWNpZXMgc2luY2Ugd2UgZG9uJ3Rcbm5lZWQgYSBmdWxsIGVuY29kZSBvZiBlYWNoIGtleSB0byBkZXRlcm1pbmUgb3JkZXIgYW5kIGNhbiBkZWZlciB0byB0aGUgdHlwZXNcbnRvIGRldGVybWluZSBob3cgdG8gbW9zdCBlZmZpY2llbnRseSBvcmRlciB0aGVpciB2YWx1ZXMgKGkuZS4gaW50IGFuZCB1aW50XG5vcmRlcmluZyBjYW4gYmUgZG9uZSBvbiB0aGUgbnVtYmVycywgbm8gbmVlZCBmb3IgYnl0ZS13aXNlLCBmb3IgZXhhbXBsZSkuXG5cblJlY29tbWVuZGF0aW9uOiBzdGljayB0byBzaW5nbGUga2V5IHR5cGVzIG9yIHlvdSdsbCBnZXQgaW50byB0cm91YmxlLCBhbmQgcHJlZmVyXG5zdHJpbmcga2V5cyBiZWNhdXNlIGl0J3MgbXVjaCBzaW1wbGVyIHRoYXQgd2F5LlxuKi9cblxuLypcbihVUERBVEUsIERlYyAyMDIwKVxuaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzg5NDkgaXMgdGhlIHVwZGF0ZWQgQ0JPUiBzcGVjIGFuZCBjbGFyaWZpZXMgc29tZVxub2YgdGhlIHF1ZXN0aW9ucyBhYm92ZSB3aXRoIGEgbmV3IHJlY29tbWVuZGF0aW9uIGZvciBzb3J0aW5nIG9yZGVyIGJlaW5nIG11Y2hcbmNsb3NlciB0byB3aGF0IHdvdWxkIGJlIGV4cGVjdGVkIGluIG90aGVyIGVudmlyb25tZW50cyAoaS5lLiBubyBsZW5ndGgtZmlyc3RcbndlaXJkbmVzcykuXG5UaGlzIG5ldyBzb3J0aW5nIG9yZGVyIGlzIG5vdCB5ZXQgaW1wbGVtZW50ZWQgaGVyZSBidXQgY291bGQgYmUgYWRkZWQgYXMgYW5cbm9wdGlvbi4gXCJEZXRlcm1pbmlzbVwiIChjYW5vbmljaXR5KSBpcyBzeXN0ZW0gZGVwZW5kZW50IGFuZCBpdCdzIGRpZmZpY3VsdCB0b1xuY2hhbmdlIGV4aXN0aW5nIHN5c3RlbXMgdGhhdCBhcmUgYnVpbHQgd2l0aCBleGlzdGluZyBleHBlY3RhdGlvbnMuIFNvIGlmIGEgbmV3XG5vcmRlcmluZyBpcyBpbnRyb2R1Y2VkIGhlcmUsIHRoZSBvbGQgbmVlZHMgdG8gYmUga2VwdCBhcyB3ZWxsIHdpdGggdGhlIHVzZXJcbmhhdmluZyB0aGUgb3B0aW9uLlxuKi9cblxuLyoqXG4gKiBAcGFyYW0ge1Rva2VuT3JOZXN0ZWRUb2tlbnNbXX0gZW50cmllc1xuICogQHBhcmFtIHtFbmNvZGVPcHRpb25zfSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHNvcnRNYXBFbnRyaWVzIChlbnRyaWVzLCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLm1hcFNvcnRlcikge1xuICAgIGVudHJpZXMuc29ydChvcHRpb25zLm1hcFNvcnRlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0geyhUb2tlbnxUb2tlbltdKVtdfSBlMVxuICogQHBhcmFtIHsoVG9rZW58VG9rZW5bXSlbXX0gZTJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG1hcFNvcnRlciAoZTEsIGUyKSB7XG4gIC8vIHRoZSBrZXkgcG9zaXRpb24gKFswXSkgY291bGQgaGF2ZSBhIHNpbmdsZSB0b2tlbiBvciBhbiBhcnJheVxuICAvLyBhbG1vc3QgYWx3YXlzIGl0J2xsIGJlIGEgc2luZ2xlIHRva2VuIGJ1dCBjb21wbGV4IGtleSBtaWdodCBnZXQgaW52b2x2ZWRcbiAgLyogYzggaWdub3JlIG5leHQgMiAqL1xuICBjb25zdCBrZXlUb2tlbjEgPSBBcnJheS5pc0FycmF5KGUxWzBdKSA/IGUxWzBdWzBdIDogZTFbMF07XG4gIGNvbnN0IGtleVRva2VuMiA9IEFycmF5LmlzQXJyYXkoZTJbMF0pID8gZTJbMF1bMF0gOiBlMlswXTtcblxuICAvLyBkaWZmZXJlbnQga2V5IHR5cGVzXG4gIGlmIChrZXlUb2tlbjEudHlwZSAhPT0ga2V5VG9rZW4yLnR5cGUpIHtcbiAgICByZXR1cm4ga2V5VG9rZW4xLnR5cGUuY29tcGFyZShrZXlUb2tlbjIudHlwZSlcbiAgfVxuXG4gIGNvbnN0IG1ham9yID0ga2V5VG9rZW4xLnR5cGUubWFqb3I7XG4gIC8vIFRPRE86IGhhbmRsZSBjYXNlIHdoZXJlIGNtcCA9PT0gMCBidXQgdGhlcmUgYXJlIG1vcmUga2V5VG9rZW4gZS4gY29tcGxleCB0eXBlKVxuICBjb25zdCB0Y21wID0gY2JvckVuY29kZXJzW21ham9yXS5jb21wYXJlVG9rZW5zKGtleVRva2VuMSwga2V5VG9rZW4yKTtcbiAgLyogYzggaWdub3JlIG5leHQgNSAqL1xuICBpZiAodGNtcCA9PT0gMCkge1xuICAgIC8vIGR1cGxpY2F0ZSBrZXkgb3IgY29tcGxleCB0eXBlIHdoZXJlIHRoZSBmaXJzdCB0b2tlbiBtYXRjaGVkLFxuICAgIC8vIGkuZS4gYSBtYXAgb3IgYXJyYXkgYW5kIHdlJ3JlIG9ubHkgY29tcGFyaW5nIHRoZSBvcGVuaW5nIHRva2VuXG4gICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBjb21wbGV4IGtleSB0eXBlcyB1c2VkLCBDQk9SIGtleSBzb3J0aW5nIGd1YXJhbnRlZXMgYXJlIGdvbmUnKTtcbiAgfVxuICByZXR1cm4gdGNtcFxufVxuXG4vKipcbiAqIEBwYXJhbSB7Qmx9IGJ1ZlxuICogQHBhcmFtIHtUb2tlbk9yTmVzdGVkVG9rZW5zfSB0b2tlbnNcbiAqIEBwYXJhbSB7VG9rZW5UeXBlRW5jb2RlcltdfSBlbmNvZGVyc1xuICogQHBhcmFtIHtFbmNvZGVPcHRpb25zfSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRW5jb2RlZCAoYnVmLCB0b2tlbnMsIGVuY29kZXJzLCBvcHRpb25zKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHRva2VucykpIHtcbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgICAgdG9rZW5zVG9FbmNvZGVkKGJ1ZiwgdG9rZW4sIGVuY29kZXJzLCBvcHRpb25zKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZW5jb2RlcnNbdG9rZW5zLnR5cGUubWFqb3JdKGJ1ZiwgdG9rZW5zLCBvcHRpb25zKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcGFyYW0ge1Rva2VuVHlwZUVuY29kZXJbXX0gZW5jb2RlcnNcbiAqIEBwYXJhbSB7RW5jb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1VpbnQ4QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUN1c3RvbSAoZGF0YSwgZW5jb2RlcnMsIG9wdGlvbnMpIHtcbiAgY29uc3QgdG9rZW5zID0gb2JqZWN0VG9Ub2tlbnMoZGF0YSwgb3B0aW9ucyk7XG4gIGlmICghQXJyYXkuaXNBcnJheSh0b2tlbnMpICYmIG9wdGlvbnMucXVpY2tFbmNvZGVUb2tlbikge1xuICAgIGNvbnN0IHF1aWNrQnl0ZXMgPSBvcHRpb25zLnF1aWNrRW5jb2RlVG9rZW4odG9rZW5zKTtcbiAgICBpZiAocXVpY2tCeXRlcykge1xuICAgICAgcmV0dXJuIHF1aWNrQnl0ZXNcbiAgICB9XG4gICAgY29uc3QgZW5jb2RlciA9IGVuY29kZXJzW3Rva2Vucy50eXBlLm1ham9yXTtcbiAgICBpZiAoZW5jb2Rlci5lbmNvZGVkU2l6ZSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGVuY29kZXIuZW5jb2RlZFNpemUodG9rZW5zLCBvcHRpb25zKTtcbiAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBCbChzaXplKTtcbiAgICAgIGVuY29kZXIoYnVmLCB0b2tlbnMsIG9wdGlvbnMpO1xuICAgICAgLyogYzggaWdub3JlIG5leHQgNCAqL1xuICAgICAgLy8gdGhpcyB3b3VsZCBiZSBhIHByb2JsZW0gd2l0aCBlbmNvZGVkU2l6ZSgpIGZ1bmN0aW9uc1xuICAgICAgaWYgKGJ1Zi5jaHVua3MubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBlcnJvcjogcHJlLWNhbGN1bGF0ZWQgbGVuZ3RoIGZvciAke3Rva2Vuc30gd2FzIHdyb25nYClcbiAgICAgIH1cbiAgICAgIHJldHVybiBhc1U4QShidWYuY2h1bmtzWzBdKVxuICAgIH1cbiAgfVxuICBidWYucmVzZXQoKTtcbiAgdG9rZW5zVG9FbmNvZGVkKGJ1ZiwgdG9rZW5zLCBlbmNvZGVycywgb3B0aW9ucyk7XG4gIHJldHVybiBidWYudG9CeXRlcyh0cnVlKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcGFyYW0ge0VuY29kZU9wdGlvbnN9IFtvcHRpb25zXVxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZSAoZGF0YSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEVuY29kZU9wdGlvbnMsIG9wdGlvbnMpO1xuICByZXR1cm4gZW5jb2RlQ3VzdG9tKGRhdGEsIGNib3JFbmNvZGVycywgb3B0aW9ucylcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3Rva2VuLmpzJykuVG9rZW59IFRva2VuXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5EZWNvZGVPcHRpb25zfSBEZWNvZGVPcHRpb25zXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9pbnRlcmZhY2UnKS5EZWNvZGVUb2tlbml6ZXJ9IERlY29kZVRva2VuaXplclxuICovXG5cbmNvbnN0IGRlZmF1bHREZWNvZGVPcHRpb25zID0ge1xuICBzdHJpY3Q6IGZhbHNlLFxuICBhbGxvd0luZGVmaW5pdGU6IHRydWUsXG4gIGFsbG93VW5kZWZpbmVkOiB0cnVlLFxuICBhbGxvd0JpZ0ludDogdHJ1ZVxufTtcblxuLyoqXG4gKiBAaW1wbGVtZW50cyB7RGVjb2RlVG9rZW5pemVyfVxuICovXG5jbGFzcyBUb2tlbmlzZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gICAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGRhdGEsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX3BvcyA9IDA7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgcG9zICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcG9zXG4gIH1cblxuICBkb25lICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcG9zID49IHRoaXMuZGF0YS5sZW5ndGhcbiAgfVxuXG4gIG5leHQgKCkge1xuICAgIGNvbnN0IGJ5dCA9IHRoaXMuZGF0YVt0aGlzLl9wb3NdO1xuICAgIGxldCB0b2tlbiA9IHF1aWNrW2J5dF07XG4gICAgaWYgKHRva2VuID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGRlY29kZXIgPSBqdW1wW2J5dF07XG4gICAgICAvKiBjOCBpZ25vcmUgbmV4dCA0ICovXG4gICAgICAvLyBpZiB3ZSdyZSBoZXJlIHRoZW4gdGhlcmUncyBzb21ldGhpbmcgd3Jvbmcgd2l0aCBvdXIganVtcCBvciBxdWljayBsaXN0cyFcbiAgICAgIGlmICghZGVjb2Rlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBubyBkZWNvZGVyIGZvciBtYWpvciB0eXBlICR7Ynl0ID4+PiA1fSAoYnl0ZSAweCR7Ynl0LnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpfSlgKVxuICAgICAgfVxuICAgICAgY29uc3QgbWlub3IgPSBieXQgJiAzMTtcbiAgICAgIHRva2VuID0gZGVjb2Rlcih0aGlzLmRhdGEsIHRoaXMuX3BvcywgbWlub3IsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuICAgIC8vIEB0cy1pZ25vcmUgd2UgZ2V0IHRvIGFzc3VtZSBlbmNvZGVkTGVuZ3RoIGlzIHNldCAoY3Jvc3NpbmcgZmluZ2VycyBzbGlnaHRseSlcbiAgICB0aGlzLl9wb3MgKz0gdG9rZW4uZW5jb2RlZExlbmd0aDtcbiAgICByZXR1cm4gdG9rZW5cbiAgfVxufVxuXG5jb25zdCBET05FID0gU3ltYm9sLmZvcignRE9ORScpO1xuY29uc3QgQlJFQUsgPSBTeW1ib2wuZm9yKCdCUkVBSycpO1xuXG4vKipcbiAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gKiBAcGFyYW0ge0RlY29kZVRva2VuaXplcn0gdG9rZW5pc2VyXG4gKiBAcGFyYW0ge0RlY29kZU9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHthbnl8QlJFQUt8RE9ORX1cbiAqL1xuZnVuY3Rpb24gdG9rZW5Ub0FycmF5ICh0b2tlbiwgdG9rZW5pc2VyLCBvcHRpb25zKSB7XG4gIGNvbnN0IGFyciA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2VuLnZhbHVlOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRva2Vuc1RvT2JqZWN0KHRva2VuaXNlciwgb3B0aW9ucyk7XG4gICAgaWYgKHZhbHVlID09PSBCUkVBSykge1xuICAgICAgaWYgKHRva2VuLnZhbHVlID09PSBJbmZpbml0eSkge1xuICAgICAgICAvLyBub3JtYWwgZW5kIHRvIGluZGVmaW5pdGUgbGVuZ3RoIGFycmF5XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBnb3QgdW5leHBlY3RlZCBicmVhayB0byBsZW5ndGhlZCBhcnJheWApXG4gICAgfVxuICAgIGlmICh2YWx1ZSA9PT0gRE9ORSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZm91bmQgYXJyYXkgYnV0IG5vdCBlbm91Z2ggZW50cmllcyAoZ290ICR7aX0sIGV4cGVjdGVkICR7dG9rZW4udmFsdWV9KWApXG4gICAgfVxuICAgIGFycltpXSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBhcnJcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICogQHBhcmFtIHtEZWNvZGVUb2tlbml6ZXJ9IHRva2VuaXNlclxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7YW55fEJSRUFLfERPTkV9XG4gKi9cbmZ1bmN0aW9uIHRva2VuVG9NYXAgKHRva2VuLCB0b2tlbmlzZXIsIG9wdGlvbnMpIHtcbiAgY29uc3QgdXNlTWFwcyA9IG9wdGlvbnMudXNlTWFwcyA9PT0gdHJ1ZTtcbiAgY29uc3Qgb2JqID0gdXNlTWFwcyA/IHVuZGVmaW5lZCA6IHt9O1xuICBjb25zdCBtID0gdXNlTWFwcyA/IG5ldyBNYXAoKSA6IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbi52YWx1ZTsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gdG9rZW5zVG9PYmplY3QodG9rZW5pc2VyLCBvcHRpb25zKTtcbiAgICBpZiAoa2V5ID09PSBCUkVBSykge1xuICAgICAgaWYgKHRva2VuLnZhbHVlID09PSBJbmZpbml0eSkge1xuICAgICAgICAvLyBub3JtYWwgZW5kIHRvIGluZGVmaW5pdGUgbGVuZ3RoIG1hcFxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZ290IHVuZXhwZWN0ZWQgYnJlYWsgdG8gbGVuZ3RoZWQgbWFwYClcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gRE9ORSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZm91bmQgbWFwIGJ1dCBub3QgZW5vdWdoIGVudHJpZXMgKGdvdCAke2l9IFtubyBrZXldLCBleHBlY3RlZCAke3Rva2VuLnZhbHVlfSlgKVxuICAgIH1cbiAgICBpZiAodXNlTWFwcyAhPT0gdHJ1ZSAmJiB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gbm9uLXN0cmluZyBrZXlzIG5vdCBzdXBwb3J0ZWQgKGdvdCAke3R5cGVvZiBrZXl9KWApXG4gICAgfVxuICAgIGlmIChvcHRpb25zLnJlamVjdER1cGxpY2F0ZU1hcEtleXMgPT09IHRydWUpIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGlmICgodXNlTWFwcyAmJiBtLmhhcyhrZXkpKSB8fCAoIXVzZU1hcHMgJiYgKGtleSBpbiBvYmopKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGVjb2RlRXJyUHJlZml4fSBmb3VuZCByZXBlYXQgbWFwIGtleSBcIiR7a2V5fVwiYClcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgdmFsdWUgPSB0b2tlbnNUb09iamVjdCh0b2tlbmlzZXIsIG9wdGlvbnMpO1xuICAgIGlmICh2YWx1ZSA9PT0gRE9ORSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZm91bmQgbWFwIGJ1dCBub3QgZW5vdWdoIGVudHJpZXMgKGdvdCAke2l9IFtubyB2YWx1ZV0sIGV4cGVjdGVkICR7dG9rZW4udmFsdWV9KWApXG4gICAgfVxuICAgIGlmICh1c2VNYXBzKSB7XG4gICAgICAvLyBAdHMtaWdub3JlIFRPRE8gcmVjb25zaWRlciB0aGlzIC4uIG1heWJlIG5lZWRzIHRvIGJlIHN0cmljdCBhYm91dCBrZXkgdHlwZXNcbiAgICAgIG0uc2V0KGtleSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlIFRPRE8gcmVjb25zaWRlciB0aGlzIC4uIG1heWJlIG5lZWRzIHRvIGJlIHN0cmljdCBhYm91dCBrZXkgdHlwZXNcbiAgICAgIG9ialtrZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIC8vIEB0cy1pZ25vcmUgYydtb24gbWFuXG4gIHJldHVybiB1c2VNYXBzID8gbSA6IG9ialxufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2RlVG9rZW5pemVyfSB0b2tlbmlzZXJcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge2FueXxCUkVBS3xET05FfVxuICovXG5mdW5jdGlvbiB0b2tlbnNUb09iamVjdCAodG9rZW5pc2VyLCBvcHRpb25zKSB7XG4gIC8vIHNob3VsZCB3ZSBzdXBwb3J0IGFycmF5IGFzIGFuIGFyZ3VtZW50P1xuICAvLyBjaGVjayBmb3IgdG9rZW5JdGVyW1N5bWJvbC5pdGVyYXRvcl0gYW5kIHJlcGxhY2UgdG9rZW5JdGVyIHdpdGggd2hhdCB0aGF0IHJldHVybnM/XG4gIGlmICh0b2tlbmlzZXIuZG9uZSgpKSB7XG4gICAgcmV0dXJuIERPTkVcbiAgfVxuXG4gIGNvbnN0IHRva2VuID0gdG9rZW5pc2VyLm5leHQoKTtcblxuICBpZiAodG9rZW4udHlwZSA9PT0gVHlwZS5icmVhaykge1xuICAgIHJldHVybiBCUkVBS1xuICB9XG5cbiAgaWYgKHRva2VuLnR5cGUudGVybWluYWwpIHtcbiAgICByZXR1cm4gdG9rZW4udmFsdWVcbiAgfVxuXG4gIGlmICh0b2tlbi50eXBlID09PSBUeXBlLmFycmF5KSB7XG4gICAgcmV0dXJuIHRva2VuVG9BcnJheSh0b2tlbiwgdG9rZW5pc2VyLCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKHRva2VuLnR5cGUgPT09IFR5cGUubWFwKSB7XG4gICAgcmV0dXJuIHRva2VuVG9NYXAodG9rZW4sIHRva2VuaXNlciwgb3B0aW9ucylcbiAgfVxuXG4gIGlmICh0b2tlbi50eXBlID09PSBUeXBlLnRhZykge1xuICAgIGlmIChvcHRpb25zLnRhZ3MgJiYgdHlwZW9mIG9wdGlvbnMudGFnc1t0b2tlbi52YWx1ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0IHRhZ2dlZCA9IHRva2Vuc1RvT2JqZWN0KHRva2VuaXNlciwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gb3B0aW9ucy50YWdzW3Rva2VuLnZhbHVlXSh0YWdnZWQpXG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IHRhZyBub3Qgc3VwcG9ydGVkICgke3Rva2VuLnZhbHVlfSlgKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQnKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtEZWNvZGVPcHRpb25zfSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHtbYW55LCBVaW50OEFycmF5XX1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlRmlyc3QgKGRhdGEsIG9wdGlvbnMpIHtcbiAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gZGF0YSB0byBkZWNvZGUgbXVzdCBiZSBhIFVpbnQ4QXJyYXlgKVxuICB9XG4gIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0RGVjb2RlT3B0aW9ucywgb3B0aW9ucyk7XG4gIGNvbnN0IHRva2VuaXNlciA9IG9wdGlvbnMudG9rZW5pemVyIHx8IG5ldyBUb2tlbmlzZXIoZGF0YSwgb3B0aW9ucyk7XG4gIGNvbnN0IGRlY29kZWQgPSB0b2tlbnNUb09iamVjdCh0b2tlbmlzZXIsIG9wdGlvbnMpO1xuICBpZiAoZGVjb2RlZCA9PT0gRE9ORSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGRpZCBub3QgZmluZCBhbnkgY29udGVudCB0byBkZWNvZGVgKVxuICB9XG4gIGlmIChkZWNvZGVkID09PSBCUkVBSykge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtkZWNvZGVFcnJQcmVmaXh9IGdvdCB1bmV4cGVjdGVkIGJyZWFrYClcbiAgfVxuICByZXR1cm4gW2RlY29kZWQsIGRhdGEuc3ViYXJyYXkodG9rZW5pc2VyLnBvcygpKV1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7RGVjb2RlT3B0aW9uc30gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5mdW5jdGlvbiBkZWNvZGUgKGRhdGEsIG9wdGlvbnMpIHtcbiAgY29uc3QgW2RlY29kZWQsIHJlbWFpbmRlcl0gPSBkZWNvZGVGaXJzdChkYXRhLCBvcHRpb25zKTtcbiAgaWYgKHJlbWFpbmRlci5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2RlY29kZUVyclByZWZpeH0gdG9vIG1hbnkgdGVybWluYWxzLCBkYXRhIG1ha2VzIG5vIHNlbnNlYClcbiAgfVxuICByZXR1cm4gZGVjb2RlZFxufVxuXG5leHBvcnQgeyBUb2tlbiwgVG9rZW5pc2VyIGFzIFRva2VuaXplciwgVHlwZSwgZGVjb2RlLCBkZWNvZGVGaXJzdCwgZW5jb2RlLCB0b2tlbnNUb09iamVjdCB9O1xuIiwiaW1wb3J0IHsgTGlzdEVsZW1lbnRFbnRpdHkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eVR5cGVzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnRUeXBlUmVmLCBNYWlsIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGZyZWV6ZU1hcCwgZ2V0VHlwZUlkLCBUeXBlUmVmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBDVVNUT01fTUFYX0lELCBDVVNUT01fTUlOX0lELCBmaXJzdEJpZ2dlclRoYW5TZWNvbmQsIGdldEVsZW1lbnRJZCwgTE9BRF9NVUxUSVBMRV9MSU1JVCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgcmVzb2x2ZVR5cGVSZWZlcmVuY2UgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBDYWNoZVN0b3JhZ2UsIEV4cG9zZWRDYWNoZVN0b3JhZ2UsIFJhbmdlIH0gZnJvbSBcIi4vRGVmYXVsdEVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgeyBFbnRpdHlSZXN0Q2xpZW50IH0gZnJvbSBcIi4vRW50aXR5UmVzdENsaWVudC5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IEVudGl0eVVwZGF0ZSB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnNcIlxuXG4vKipcbiAqIHVwZGF0ZSB3aGVuIGltcGxlbWVudGluZyBjdXN0b20gY2FjaGUgaGFuZGxlcnMuXG4gKiBhZGQgbmV3IHR5cGVzIHRvIHRoZSB1bmlvbiB3aGVuIGltcGxlbWVudGluZyBuZXdcbiAqIGN1c3RvbSBjYWNoZSBoYW5kbGVycy5cbiAqL1xudHlwZSBDdXN0b21DYWNoZUhhbmRsZWRUeXBlID0gbmV2ZXIgfCBDYWxlbmRhckV2ZW50IHwgTWFpbFxuXG4vKipcbiAqIG1ha2VzIHN1cmUgdGhhdCBhbnkge3JlZjxBPiwgaGFuZGxlcjxBPn0gcGFpciBwYXNzZWQgdG9cbiAqIHRoZSBjb25zdHJ1Y3RvciB1c2VzIHRoZSBzYW1lIEEgZm9yIGJvdGggcHJvcHMgYW5kIHRoYXQgdGhleVxuICogYXJlIHR5cGVzIGZvciB3aGljaCB3ZSBhY3R1YWxseSBkbyBjdXN0b20gaGFuZGxpbmcuXG4gKi9cbnR5cGUgQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwcGluZyA9IEN1c3RvbUNhY2hlSGFuZGxlZFR5cGUgZXh0ZW5kcyBpbmZlciBBXG5cdD8gQSBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5XG5cdFx0PyB7IHJlZjogVHlwZVJlZjxBPjsgaGFuZGxlcjogQ3VzdG9tQ2FjaGVIYW5kbGVyPEE+IH1cblx0XHQ6IG5ldmVyXG5cdDogbmV2ZXJcblxuLyoqXG4gKiB3cmFwcGVyIGZvciBhIFR5cGVSZWYgLT4gQ3VzdG9tQ2FjaGVIYW5kbGVyIG1hcCB0aGF0J3MgbmVlZGVkIGJlY2F1c2Ugd2UgY2FuJ3RcbiAqIHVzZSBUeXBlUmVmcyBkaXJlY3RseSBhcyBtYXAga2V5cyBkdWUgdG8gb2JqZWN0IGlkZW50aXR5IG5vdCBtYXRjaGluZy5cbiAqXG4gKiBpdCBpcyBtb3N0bHkgcmVhZC1vbmx5XG4gKi9cbmV4cG9ydCBjbGFzcyBDdXN0b21DYWNoZUhhbmRsZXJNYXAge1xuXHRwcml2YXRlIHJlYWRvbmx5IGhhbmRsZXJzOiBSZWFkb25seU1hcDxzdHJpbmcsIEN1c3RvbUNhY2hlSGFuZGxlcjxMaXN0RWxlbWVudEVudGl0eT4+XG5cblx0Y29uc3RydWN0b3IoLi4uYXJnczogUmVhZG9ubHlBcnJheTxDdXN0b21DYWNoZUhhbmRsZXJNYXBwaW5nPikge1xuXHRcdGNvbnN0IGhhbmRsZXJzOiBNYXA8c3RyaW5nLCBDdXN0b21DYWNoZUhhbmRsZXI8TGlzdEVsZW1lbnRFbnRpdHk+PiA9IG5ldyBNYXAoKVxuXHRcdGZvciAoY29uc3QgeyByZWYsIGhhbmRsZXIgfSBvZiBhcmdzKSB7XG5cdFx0XHRjb25zdCBrZXkgPSBnZXRUeXBlSWQocmVmKVxuXHRcdFx0aGFuZGxlcnMuc2V0KGtleSwgaGFuZGxlcilcblx0XHR9XG5cdFx0dGhpcy5oYW5kbGVycyA9IGZyZWV6ZU1hcChoYW5kbGVycylcblx0fVxuXG5cdGdldDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4pOiBDdXN0b21DYWNoZUhhbmRsZXI8VD4gfCB1bmRlZmluZWQge1xuXHRcdGNvbnN0IHR5cGVJZCA9IGdldFR5cGVJZCh0eXBlUmVmKVxuXHRcdC8vIG1hcCBpcyBmcm96ZW4gYWZ0ZXIgdGhlIGNvbnN0cnVjdG9yLiBjb25zdHJ1Y3RvciBhcmcgdHlwZXMgYXJlIHNldCB1cCB0byB1cGhvbGQgdGhpcyBpbnZhcmlhbnQuXG5cdFx0cmV0dXJuIHRoaXMuaGFuZGxlcnMuZ2V0KHR5cGVJZCkgYXMgQ3VzdG9tQ2FjaGVIYW5kbGVyPFQ+IHwgdW5kZWZpbmVkXG5cdH1cbn1cblxuLyoqXG4gKiBTb21lIHR5cGVzIGFyZSBub3QgY2FjaGVkIGxpa2Ugb3RoZXIgdHlwZXMsIGZvciBleGFtcGxlIGJlY2F1c2UgdGhlaXIgY3VzdG9tIElkcyBhcmUgbm90IHNvcnRhYmxlLlxuICogbWFrZSBzdXJlIHRvIHVwZGF0ZSBDdXN0b21IYW5kbGVkVHlwZSB3aGVuIGltcGxlbWVudGluZyB0aGlzIGZvciBhIG5ldyB0eXBlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUNhY2hlSGFuZGxlcjxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+IHtcblx0bG9hZFJhbmdlPzogKHN0b3JhZ2U6IEV4cG9zZWRDYWNoZVN0b3JhZ2UsIGxpc3RJZDogSWQsIHN0YXJ0OiBJZCwgY291bnQ6IG51bWJlciwgcmV2ZXJzZTogYm9vbGVhbikgPT4gUHJvbWlzZTxUW10+XG5cblx0Z2V0RWxlbWVudElkc0luQ2FjaGVSYW5nZT86IChzdG9yYWdlOiBFeHBvc2VkQ2FjaGVTdG9yYWdlLCBsaXN0SWQ6IElkLCBpZHM6IEFycmF5PElkPikgPT4gUHJvbWlzZTxBcnJheTxJZD4+XG5cblx0c2hvdWxkTG9hZE9uQ3JlYXRlRXZlbnQ/OiAoZXZlbnQ6IEVudGl0eVVwZGF0ZSkgPT4gUHJvbWlzZTxib29sZWFuPlxufVxuXG4vKipcbiAqIGltcGxlbWVudHMgcmFuZ2UgbG9hZGluZyBpbiBKUyBiZWNhdXNlIHRoZSBjdXN0b20gSWRzIG9mIGNhbGVuZGFyIGV2ZW50cyBwcmV2ZW50IHVzIGZyb20gZG9pbmdcbiAqIHRoaXMgZWZmZWN0aXZlbHkgaW4gdGhlIGRhdGFiYXNlLlxuICovXG5leHBvcnQgY2xhc3MgQ3VzdG9tQ2FsZW5kYXJFdmVudENhY2hlSGFuZGxlciBpbXBsZW1lbnRzIEN1c3RvbUNhY2hlSGFuZGxlcjxDYWxlbmRhckV2ZW50PiB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZW50aXR5UmVzdENsaWVudDogRW50aXR5UmVzdENsaWVudCkge31cblxuXHRhc3luYyBsb2FkUmFuZ2Uoc3RvcmFnZTogQ2FjaGVTdG9yYWdlLCBsaXN0SWQ6IElkLCBzdGFydDogSWQsIGNvdW50OiBudW1iZXIsIHJldmVyc2U6IGJvb2xlYW4pOiBQcm9taXNlPENhbGVuZGFyRXZlbnRbXT4ge1xuXHRcdGNvbnN0IHJhbmdlID0gYXdhaXQgc3RvcmFnZS5nZXRSYW5nZUZvckxpc3QoQ2FsZW5kYXJFdmVudFR5cGVSZWYsIGxpc3RJZClcblxuXHRcdC8vaWYgb2ZmbGluZSBkYiBmb3IgdGhpcyBsaXN0IGlzIGVtcHR5IGxvYWQgZnJvbSBzZXJ2ZXJcblx0XHRsZXQgcmF3TGlzdDogQXJyYXk8Q2FsZW5kYXJFdmVudD4gPSBbXVxuXHRcdGlmIChyYW5nZSA9PSBudWxsKSB7XG5cdFx0XHRsZXQgY2h1bms6IEFycmF5PENhbGVuZGFyRXZlbnQ+ID0gW11cblx0XHRcdGxldCBjdXJyZW50TWluID0gQ1VTVE9NX01JTl9JRFxuXHRcdFx0d2hpbGUgKHRydWUpIHtcblx0XHRcdFx0Y2h1bmsgPSBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZFJhbmdlKENhbGVuZGFyRXZlbnRUeXBlUmVmLCBsaXN0SWQsIGN1cnJlbnRNaW4sIExPQURfTVVMVElQTEVfTElNSVQsIGZhbHNlKVxuXHRcdFx0XHRyYXdMaXN0LnB1c2goLi4uY2h1bmspXG5cdFx0XHRcdGlmIChjaHVuay5sZW5ndGggPCBMT0FEX01VTFRJUExFX0xJTUlUKSBicmVha1xuXHRcdFx0XHRjdXJyZW50TWluID0gZ2V0RWxlbWVudElkKGNodW5rW2NodW5rLmxlbmd0aCAtIDFdKVxuXHRcdFx0fVxuXHRcdFx0Zm9yIChjb25zdCBldmVudCBvZiByYXdMaXN0KSB7XG5cdFx0XHRcdGF3YWl0IHN0b3JhZ2UucHV0KGV2ZW50KVxuXHRcdFx0fVxuXG5cdFx0XHQvLyB3ZSBoYXZlIGFsbCBldmVudHMgbm93XG5cdFx0XHRhd2FpdCBzdG9yYWdlLnNldE5ld1JhbmdlRm9yTGlzdChDYWxlbmRhckV2ZW50VHlwZVJlZiwgbGlzdElkLCBDVVNUT01fTUlOX0lELCBDVVNUT01fTUFYX0lEKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmFzc2VydENvcnJlY3RSYW5nZShyYW5nZSlcblx0XHRcdHJhd0xpc3QgPSBhd2FpdCBzdG9yYWdlLmdldFdob2xlTGlzdChDYWxlbmRhckV2ZW50VHlwZVJlZiwgbGlzdElkKVxuXHRcdFx0Y29uc29sZS5sb2coYENhbGVuZGFyRXZlbnQgbGlzdCAke2xpc3RJZH0gaGFzICR7cmF3TGlzdC5sZW5ndGh9IGV2ZW50c2ApXG5cdFx0fVxuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKENhbGVuZGFyRXZlbnRUeXBlUmVmKVxuXHRcdGNvbnN0IHNvcnRlZExpc3QgPSByZXZlcnNlXG5cdFx0XHQ/IHJhd0xpc3Rcblx0XHRcdFx0XHQuZmlsdGVyKChjYWxlbmRhckV2ZW50KSA9PiBmaXJzdEJpZ2dlclRoYW5TZWNvbmQoc3RhcnQsIGdldEVsZW1lbnRJZChjYWxlbmRhckV2ZW50KSwgdHlwZU1vZGVsKSlcblx0XHRcdFx0XHQuc29ydCgoYSwgYikgPT4gKGZpcnN0QmlnZ2VyVGhhblNlY29uZChnZXRFbGVtZW50SWQoYiksIGdldEVsZW1lbnRJZChhKSwgdHlwZU1vZGVsKSA/IDEgOiAtMSkpXG5cdFx0XHQ6IHJhd0xpc3Rcblx0XHRcdFx0XHQuZmlsdGVyKChjYWxlbmRhckV2ZW50KSA9PiBmaXJzdEJpZ2dlclRoYW5TZWNvbmQoZ2V0RWxlbWVudElkKGNhbGVuZGFyRXZlbnQpLCBzdGFydCwgdHlwZU1vZGVsKSlcblx0XHRcdFx0XHQuc29ydCgoYSwgYikgPT4gKGZpcnN0QmlnZ2VyVGhhblNlY29uZChnZXRFbGVtZW50SWQoYSksIGdldEVsZW1lbnRJZChiKSwgdHlwZU1vZGVsKSA/IDEgOiAtMSkpXG5cdFx0cmV0dXJuIHNvcnRlZExpc3Quc2xpY2UoMCwgY291bnQpXG5cdH1cblxuXHRwcml2YXRlIGFzc2VydENvcnJlY3RSYW5nZShyYW5nZTogUmFuZ2UpIHtcblx0XHRpZiAocmFuZ2UubG93ZXIgIT09IENVU1RPTV9NSU5fSUQgfHwgcmFuZ2UudXBwZXIgIT09IENVU1RPTV9NQVhfSUQpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBJbnZhbGlkIHJhbmdlIGZvciBDYWxlbmRhckV2ZW50OiAke0pTT04uc3RyaW5naWZ5KHJhbmdlKX1gKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGdldEVsZW1lbnRJZHNJbkNhY2hlUmFuZ2Uoc3RvcmFnZTogQ2FjaGVTdG9yYWdlLCBsaXN0SWQ6IElkLCBpZHM6IEFycmF5PElkPik6IFByb21pc2U8QXJyYXk8SWQ+PiB7XG5cdFx0Y29uc3QgcmFuZ2UgPSBhd2FpdCBzdG9yYWdlLmdldFJhbmdlRm9yTGlzdChDYWxlbmRhckV2ZW50VHlwZVJlZiwgbGlzdElkKVxuXHRcdGlmIChyYW5nZSkge1xuXHRcdFx0dGhpcy5hc3NlcnRDb3JyZWN0UmFuZ2UocmFuZ2UpXG5cdFx0XHQvLyBhc3N1bWUgbm9uZSBvZiB0aGUgZ2l2ZW4gSWRzIGFyZSBhbHJlYWR5IGNhY2hlZCB0byBtYWtlIHN1cmUgdGhleSBhcmUgbG9hZGVkIG5vd1xuXHRcdFx0cmV0dXJuIGlkc1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1c3RvbU1haWxFdmVudENhY2hlSGFuZGxlciBpbXBsZW1lbnRzIEN1c3RvbUNhY2hlSGFuZGxlcjxNYWlsPiB7XG5cdGFzeW5jIHNob3VsZExvYWRPbkNyZWF0ZUV2ZW50KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdC8vIE5ldyBlbWFpbHMgc2hvdWxkIGJlIHByZS1jYWNoZWQuXG5cdFx0Ly8gIC0gd2UgbmVlZCB0aGVtIHRvIGRpc3BsYXkgdGhlIGZvbGRlciBjb250ZW50c1xuXHRcdC8vICAtIHdpbGwgdmVyeSBsaWtlbHkgYmUgbG9hZGVkIGJ5IGluZGV4ZXIgbGF0ZXJcblx0XHQvLyAgLSB3ZSBtaWdodCBoYXZlIHRoZSBpbnN0YW5jZSBpbiBvZmZsaW5lIGNhY2hlIGFscmVhZHkgYmVjYXVzZSBvZiBub3RpZmljYXRpb24gcHJvY2Vzc1xuXHRcdHJldHVybiB0cnVlXG5cdH1cbn1cbiIsImltcG9ydCB7IG1hcE9iamVjdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuXG5leHBvcnQgdHlwZSBTcWxWYWx1ZSA9IG51bGwgfCBzdHJpbmcgfCBudW1iZXIgfCBVaW50OEFycmF5XG5cbi8qKlxuICogVHlwZSB0YWcgZm9yIHZhbHVlcyBiZWluZyBwYXNzZWQgdG8gU1FMIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3FsVHlwZSB7XG5cdE51bGwgPSBcIlNxbE51bGxcIixcblx0TnVtYmVyID0gXCJTcWxOdW1cIixcblx0U3RyaW5nID0gXCJTcWxTdHJcIixcblx0Qnl0ZXMgPSBcIlNxbEJ5dGVzXCIsXG59XG5cbmV4cG9ydCB0eXBlIEZvcm1hdHRlZFF1ZXJ5ID0geyBxdWVyeTogc3RyaW5nOyBwYXJhbXM6IFRhZ2dlZFNxbFZhbHVlW10gfVxuZXhwb3J0IHR5cGUgVGFnZ2VkU3FsVmFsdWUgPVxuXHR8IHsgdHlwZTogU3FsVHlwZS5OdWxsOyB2YWx1ZTogbnVsbCB9XG5cdHwgeyB0eXBlOiBTcWxUeXBlLlN0cmluZzsgdmFsdWU6IHN0cmluZyB9XG5cdHwgeyB0eXBlOiBTcWxUeXBlLk51bWJlcjsgdmFsdWU6IG51bWJlciB9XG5cdHwgeyB0eXBlOiBTcWxUeXBlLkJ5dGVzOyB2YWx1ZTogVWludDhBcnJheSB9XG5cbmV4cG9ydCBmdW5jdGlvbiB0YWdTcWxPYmplY3QocGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBTcWxWYWx1ZT4pOiBSZWNvcmQ8c3RyaW5nLCBUYWdnZWRTcWxWYWx1ZT4ge1xuXHRyZXR1cm4gbWFwT2JqZWN0KChwOiBTcWxWYWx1ZSkgPT4gdGFnU3FsVmFsdWUocCksIHBhcmFtcylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRhZ1NxbFZhbHVlKHBhcmFtOiBTcWxWYWx1ZSk6IFRhZ2dlZFNxbFZhbHVlIHtcblx0aWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdHJldHVybiB7IHR5cGU6IFNxbFR5cGUuU3RyaW5nLCB2YWx1ZTogcGFyYW0gfVxuXHR9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiB7IHR5cGU6IFNxbFR5cGUuTnVtYmVyLCB2YWx1ZTogcGFyYW0gfVxuXHR9IGVsc2UgaWYgKHBhcmFtID09IG51bGwpIHtcblx0XHRyZXR1cm4geyB0eXBlOiBTcWxUeXBlLk51bGwsIHZhbHVlOiBudWxsIH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4geyB0eXBlOiBTcWxUeXBlLkJ5dGVzLCB2YWx1ZTogcGFyYW0gfVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnRhZ1NxbFZhbHVlKHRhZ2dlZDogVGFnZ2VkU3FsVmFsdWUpOiBTcWxWYWx1ZSB7XG5cdHJldHVybiB0YWdnZWQudmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVudGFnU3FsT2JqZWN0KHRhZ2dlZDogUmVjb3JkPHN0cmluZywgVGFnZ2VkU3FsVmFsdWU+KTogUmVjb3JkPHN0cmluZywgU3FsVmFsdWU+IHtcblx0cmV0dXJuIG1hcE9iamVjdCgocDogVGFnZ2VkU3FsVmFsdWUpID0+IHAudmFsdWUsIHRhZ2dlZClcbn1cbiIsImltcG9ydCB7IEZvcm1hdHRlZFF1ZXJ5LCBTcWxWYWx1ZSwgVGFnZ2VkU3FsVmFsdWUsIHRhZ1NxbFZhbHVlIH0gZnJvbSBcIi4vU3FsVmFsdWUuanNcIlxuXG4vKipcbiAqIHRoaXMgdGFnZ2VkIHRlbXBsYXRlIGZ1bmN0aW9uIGV4aXN0cyBiZWNhdXNlIGFuZHJvaWQgZG9lc24ndCBhbGxvdyB1cyB0byBkZWZpbmUgU1FMIGZ1bmN0aW9ucywgc28gd2UgaGF2ZSBtYWRlIGEgd2F5IHRvIGlubGluZVxuICogU1FMIGZyYWdtZW50cyBpbnRvIHF1ZXJpZXMuXG4gKiB0byBtYWtlIGl0IGxlc3MgZXJyb3ItcHJvbmUsIHdlIGF1dG9tYXRlIHRoZSBnZW5lcmF0aW9uIG9mIHRoZSBwYXJhbXMgYXJyYXkgZm9yIHRoZSBhY3R1YWwgc3FsIGNhbGwuXG4gKiBJbiB0aGlzIHdheSwgd2Ugb2ZmbG9hZCB0aGUgZXNjYXBpbmcgb2YgYWN0dWFsIHVzZXIgY29udGVudCB0byB0aGUgU1FMIGVuZ2luZSwgd2hpY2ggbWFrZXMgdGhpcyBzYWZlIGZyb20gYW4gU1FMSSBwb2ludCBvZiB2aWV3LlxuICpcbiAqIHVzYWdlIGV4YW1wbGU6XG4gKiBjb25zdCB0eXBlID0gXCJzeXMvVXNlclwiXG4gKiBjb25zdCBsaXN0SWQgPSBcInNvbWVMaXN0XCJcbiAqIGNvbnN0IHN0YXJ0SWQgPSBcIkFCQ1wiXG4gKiBzcWxgU0VMRUNUIGVudGl0eSBGUk9NIGxpc3RfZW50aXRpZXMgV0hFUkUgdHlwZSA9ICR7dHlwZX0gQU5EIGxpc3RJZCA9ICR7bGlzdElkfSBBTkQgJHtmaXJzdElkQmlnZ2VyKHN0YXJ0SWQsIFwiZWxlbWVudElkXCIpfWBcbiAqXG4gKiB0aGlzIHdpbGwgcmVzdWx0IGluXG4gKiBjb25zdCB7cXVlcnksIHBhcmFtc30gPSB7XG4gKiAgICAgcXVlcnk6IGBTRUxFQ1QgZW50aXR5IEZST00gbGlzdF9lbnRpdGllcyBXSEVSRSB0eXBlID0gPyBBTkQgbGlzdElkID0gPyBBTkQgKENBU0UgV0hFTiBsZW5ndGgoPykgPiBsZW5ndGgoZWxlbWVudElkKSBUSEVOIDEgV0hFTiBsZW5ndGgoPykgPCBsZW5ndGgoZWxlbWVudElkKSBUSEVOIDAgRUxTRSA/ID4gZWxlbWVudElkIEVORClgLFxuICogICAgIHBhcmFtczogW1xuICogICAgIFx0XHR7dHlwZTogU3FsVHlwZS5TdHJpbmcsIHZhbHVlOiBcInN5cy9Vc2VyXCJ9LFxuICogICAgIFx0XHR7dHlwZTogU3FsVHlwZS5TdHJpbmcsIHZhbHVlOiBcInNvbWVMaXN0XCJ9LFxuICogICAgIFx0XHR7dHlwZTogU3FsVHlwZS5TdHJpbmcsIHZhbHVlOiBcIkFCQ1wifSxcbiAqICAgICBcdFx0e3R5cGU6IFNxbFR5cGUuU3RyaW5nLCB2YWx1ZTogXCJBQkNcIn0sXG4gKiAgICAgXHRcdHt0eXBlOiBTcWxUeXBlLlN0cmluZywgdmFsdWU6IFwiQUJDXCJ9XG4gKiAgICAgXVxuICogfVxuICpcbiAqIHdoaWNoIGNhbiBiZSBjb25zdW1lZCBieSBzcWwucnVuKHF1ZXJ5LCBwYXJhbXMpLlxuICpcbiAqIEl0IGlzIGltcG9ydGFudCB0aGF0IHRoZSBjYWxsZXIgZW5zdXJlcyB0aGF0IHRoZSBhbW91bnQgb2YgU1FMIHZhcmlhYmxlcyBkb2VzIG5vdCBleGNlZWQgTUFYX1NBRkVfU1FMX1ZBUlMhXG4gKiBWaW9sYXRpbmcgdGhpcyBydWxlIHdpbGwgbGVhZCB0byBhbiB1bmNhdWdodCBlcnJvciB3aXRoIGJhZCBzdGFjayB0cmFjZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzcWwocXVlcnlQYXJ0czogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnBhcmFtSW5zdGFuY2VzOiAoU3FsVmFsdWUgfCBTcWxGcmFnbWVudClbXSk6IEZvcm1hdHRlZFF1ZXJ5IHtcblx0bGV0IHF1ZXJ5ID0gXCJcIlxuXHRsZXQgcGFyYW1zOiBUYWdnZWRTcWxWYWx1ZVtdID0gW11cblx0bGV0IGk6IG51bWJlclxuXHRmb3IgKGkgPSAwOyBpIDwgcGFyYW1JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcblx0XHRxdWVyeSArPSBxdWVyeVBhcnRzW2ldXG5cdFx0Y29uc3QgcGFyYW0gPSBwYXJhbUluc3RhbmNlc1tpXVxuXHRcdGlmIChwYXJhbSBpbnN0YW5jZW9mIFNxbEZyYWdtZW50KSB7XG5cdFx0XHRxdWVyeSArPSBwYXJhbS50ZXh0XG5cdFx0XHRwYXJhbXMucHVzaCguLi5wYXJhbS5wYXJhbXMubWFwKHRhZ1NxbFZhbHVlKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cXVlcnkgKz0gXCI/XCJcblx0XHRcdHBhcmFtcy5wdXNoKHRhZ1NxbFZhbHVlKHBhcmFtKSlcblx0XHR9XG5cdH1cblx0cXVlcnkgKz0gcXVlcnlQYXJ0c1tpXVxuXHRyZXR1cm4geyBxdWVyeSwgcGFyYW1zIH1cbn1cblxuZXhwb3J0IHR5cGUgVW50YWdnZWRRdWVyeSA9IHsgcXVlcnk6IHN0cmluZzsgcGFyYW1zOiByZWFkb25seSBTcWxWYWx1ZVtdIH1cblxuLyoqXG4gKiBMaWtlIHtAbGluayBzcWx9IGJ1dCB3aXRob3V0IHRhZ2dpbmcgdGhlIHZhbHVlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNxbChxdWVyeVBhcnRzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4ucGFyYW1JbnN0YW5jZXM6IChTcWxWYWx1ZSB8IFNxbEZyYWdtZW50KVtdKTogVW50YWdnZWRRdWVyeSB7XG5cdGxldCBxdWVyeSA9IFwiXCJcblx0bGV0IHBhcmFtczogU3FsVmFsdWVbXSA9IFtdXG5cdGxldCBpOiBudW1iZXJcblx0Zm9yIChpID0gMDsgaSA8IHBhcmFtSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0cXVlcnkgKz0gcXVlcnlQYXJ0c1tpXVxuXHRcdGNvbnN0IHBhcmFtID0gcGFyYW1JbnN0YW5jZXNbaV1cblx0XHRpZiAocGFyYW0gaW5zdGFuY2VvZiBTcWxGcmFnbWVudCkge1xuXHRcdFx0cXVlcnkgKz0gcGFyYW0udGV4dFxuXHRcdFx0cGFyYW1zLnB1c2goLi4ucGFyYW0ucGFyYW1zKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVyeSArPSBcIj9cIlxuXHRcdFx0cGFyYW1zLnB1c2gocGFyYW0pXG5cdFx0fVxuXHR9XG5cdHF1ZXJ5ICs9IHF1ZXJ5UGFydHNbaV1cblx0cmV0dXJuIHsgcXVlcnksIHBhcmFtcyB9XG59XG5cbmV4cG9ydCBjbGFzcyBTcWxGcmFnbWVudCB7XG5cdGNvbnN0cnVjdG9yKHJlYWRvbmx5IHRleHQ6IHN0cmluZywgcmVhZG9ubHkgcGFyYW1zOiBTcWxWYWx1ZVtdKSB7fVxufVxuIiwiaW1wb3J0IHsgRWxlbWVudEVudGl0eSwgTGlzdEVsZW1lbnRFbnRpdHksIFNvbWVFbnRpdHksIFR5cGVNb2RlbCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5VHlwZXMuanNcIlxuaW1wb3J0IHsgQ1VTVE9NX01JTl9JRCwgZmlyc3RCaWdnZXJUaGFuU2Vjb25kLCBHRU5FUkFURURfTUlOX0lELCBnZXRFbGVtZW50SWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IENhY2hlU3RvcmFnZSwgZXhwYW5kSWQsIEV4cG9zZWRDYWNoZVN0b3JhZ2UsIExhc3RVcGRhdGVUaW1lIH0gZnJvbSBcIi4uL3Jlc3QvRGVmYXVsdEVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgKiBhcyBjYm9yZyBmcm9tIFwiY2JvcmdcIlxuaW1wb3J0IHsgRW5jb2RlT3B0aW9ucywgVG9rZW4sIFR5cGUgfSBmcm9tIFwiY2JvcmdcIlxuaW1wb3J0IHtcblx0YXNzZXJ0LFxuXHRhc3NlcnROb3ROdWxsLFxuXHRiYXNlNjRFeHRUb0Jhc2U2NCxcblx0YmFzZTY0VG9CYXNlNjRFeHQsXG5cdGJhc2U2NFRvQmFzZTY0VXJsLFxuXHRiYXNlNjRVcmxUb0Jhc2U2NCxcblx0Z2V0VHlwZUlkLFxuXHRncm91cEJ5QW5kTWFwVW5pcXVlbHksXG5cdG1hcE51bGxhYmxlLFxuXHRzcGxpdEluQ2h1bmtzLFxuXHRUeXBlUmVmLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGlzRGVza3RvcCwgaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSwgaXNUZXN0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgbW9kZWxJbmZvcywgcmVzb2x2ZVR5cGVSZWZlcmVuY2UgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBEYXRlUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0RhdGVQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBUb2tlbk9yTmVzdGVkVG9rZW5zIH0gZnJvbSBcImNib3JnL2ludGVyZmFjZVwiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50VHlwZVJlZiwgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgT2ZmbGluZVN0b3JhZ2VNaWdyYXRvciB9IGZyb20gXCIuL09mZmxpbmVTdG9yYWdlTWlncmF0b3IuanNcIlxuaW1wb3J0IHsgQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwLCBDdXN0b21DYWxlbmRhckV2ZW50Q2FjaGVIYW5kbGVyLCBDdXN0b21NYWlsRXZlbnRDYWNoZUhhbmRsZXIgfSBmcm9tIFwiLi4vcmVzdC9DdXN0b21DYWNoZUhhbmRsZXIuanNcIlxuaW1wb3J0IHsgRW50aXR5UmVzdENsaWVudCB9IGZyb20gXCIuLi9yZXN0L0VudGl0eVJlc3RDbGllbnQuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uLy4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0ludGVyV2luZG93RXZlbnRGYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEZvcm1hdHRlZFF1ZXJ5LCBTcWxWYWx1ZSwgVGFnZ2VkU3FsVmFsdWUsIHVudGFnU3FsT2JqZWN0IH0gZnJvbSBcIi4vU3FsVmFsdWUuanNcIlxuaW1wb3J0IHsgQXNzb2NpYXRpb25UeXBlLCBDYXJkaW5hbGl0eSwgVHlwZSBhcyBUeXBlSWQsIFZhbHVlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IE91dE9mU3luY0Vycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9PdXRPZlN5bmNFcnJvci5qc1wiXG5pbXBvcnQgeyBzcWwsIFNxbEZyYWdtZW50IH0gZnJvbSBcIi4vU3FsLmpzXCJcblxuLyoqXG4gKiB0aGlzIGlzIHRoZSB2YWx1ZSBvZiBTUUxJVEVfTUFYX1ZBUklBQkxFX05VTUJFUiBpbiBzcWxpdGUzLmNcbiAqIGl0IG1heSBjaGFuZ2UgaWYgdGhlIHNxbGl0ZSB2ZXJzaW9uIGlzIHVwZGF0ZWQuXG4gKiAqL1xuY29uc3QgTUFYX1NBRkVfU1FMX1ZBUlMgPSAzMjc2NlxuXG5mdW5jdGlvbiBkYXRlRW5jb2RlcihkYXRhOiBEYXRlLCB0eXA6IHN0cmluZywgb3B0aW9uczogRW5jb2RlT3B0aW9ucyk6IFRva2VuT3JOZXN0ZWRUb2tlbnMgfCBudWxsIHtcblx0Y29uc3QgdGltZSA9IGRhdGEuZ2V0VGltZSgpXG5cdHJldHVybiBbXG5cdFx0Ly8gaHR0cHM6Ly9kYXRhdHJhY2tlci5pZXRmLm9yZy9kb2MvcmZjODk0My9cblx0XHRuZXcgVG9rZW4oVHlwZS50YWcsIDEwMCksXG5cdFx0bmV3IFRva2VuKHRpbWUgPCAwID8gVHlwZS5uZWdpbnQgOiBUeXBlLnVpbnQsIHRpbWUpLFxuXHRdXG59XG5cbmZ1bmN0aW9uIGRhdGVEZWNvZGVyKGJ5dGVzOiBudW1iZXIpOiBEYXRlIHtcblx0cmV0dXJuIG5ldyBEYXRlKGJ5dGVzKVxufVxuXG5leHBvcnQgY29uc3QgY3VzdG9tVHlwZUVuY29kZXJzOiB7IFt0eXBlTmFtZTogc3RyaW5nXTogdHlwZW9mIGRhdGVFbmNvZGVyIH0gPSBPYmplY3QuZnJlZXplKHtcblx0RGF0ZTogZGF0ZUVuY29kZXIsXG59KVxuXG50eXBlIFR5cGVEZWNvZGVyID0gKF86IGFueSkgPT4gYW55XG5leHBvcnQgY29uc3QgY3VzdG9tVHlwZURlY29kZXJzOiBBcnJheTxUeXBlRGVjb2Rlcj4gPSAoKCkgPT4ge1xuXHRjb25zdCB0YWdzOiBBcnJheTxUeXBlRGVjb2Rlcj4gPSBbXVxuXHR0YWdzWzEwMF0gPSBkYXRlRGVjb2RlclxuXHRyZXR1cm4gdGFnc1xufSkoKVxuXG4vKipcbiAqIEZvciBlYWNoIG9mIHRoZXNlIGtleXMgd2UgdHJhY2sgdGhlIGN1cnJlbnQgdmVyc2lvbiBpbiB0aGUgZGF0YWJhc2UuXG4gKiBUaGUga2V5cyBhcmUgZGlmZmVyZW50IG1vZGVsIHZlcnNpb25zIChiZWNhdXNlIHdlIG5lZWQgdG8gbWlncmF0ZSB0aGUgZGF0YSB3aXRoIGNlcnRhaW4gbW9kZWwgdmVyc2lvbiBjaGFuZ2VzKSBhbmQgXCJvZmZsaW5lXCIga2V5IHdoaWNoIGlzIHVzZWQgdG8gdHJhY2tcbiAqIG1pZ3JhdGlvbnMgdGhhdCBhcmUgbmVlZGVkIGZvciBvdGhlciByZWFzb25zIGUuZy4gaWYgREIgc3RydWN0dXJlIGNoYW5nZXMgb3IgaWYgd2UgbmVlZCB0byBpbnZhbGlkYXRlIHNvbWUgdGFibGVzLlxuICovXG5leHBvcnQgdHlwZSBWZXJzaW9uTWV0YWRhdGFCYXNlS2V5ID0ga2V5b2YgdHlwZW9mIG1vZGVsSW5mb3MgfCBcIm9mZmxpbmVcIlxuXG50eXBlIFZlcnNpb25NZXRhZGF0YUVudHJpZXMgPSB7XG5cdC8vIFllcyB0aGlzIGlzIGN1cnNlZCwgZ2l2ZSBtZSBhIGJyZWFrXG5cdFtQIGluIFZlcnNpb25NZXRhZGF0YUJhc2VLZXkgYXMgYCR7UH0tdmVyc2lvbmBdOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPZmZsaW5lRGJNZXRhIGV4dGVuZHMgVmVyc2lvbk1ldGFkYXRhRW50cmllcyB7XG5cdGxhc3RVcGRhdGVUaW1lOiBudW1iZXJcblx0dGltZVJhbmdlRGF5czogbnVtYmVyXG59XG5cbmNvbnN0IFRhYmxlRGVmaW5pdGlvbnMgPSBPYmplY3QuZnJlZXplKHtcblx0Ly8gcGx1cyBvd25lckdyb3VwIGFkZGVkIGluIGEgbWlncmF0aW9uXG5cdGxpc3RfZW50aXRpZXM6XG5cdFx0XCJ0eXBlIFRFWFQgTk9UIE5VTEwsIGxpc3RJZCBURVhUIE5PVCBOVUxMLCBlbGVtZW50SWQgVEVYVCBOT1QgTlVMTCwgb3duZXJHcm91cCBURVhULCBlbnRpdHkgQkxPQiBOT1QgTlVMTCwgUFJJTUFSWSBLRVkgKHR5cGUsIGxpc3RJZCwgZWxlbWVudElkKVwiLFxuXHQvLyBwbHVzIG93bmVyR3JvdXAgYWRkZWQgaW4gYSBtaWdyYXRpb25cblx0ZWxlbWVudF9lbnRpdGllczogXCJ0eXBlIFRFWFQgTk9UIE5VTEwsIGVsZW1lbnRJZCBURVhUIE5PVCBOVUxMLCBvd25lckdyb3VwIFRFWFQsIGVudGl0eSBCTE9CIE5PVCBOVUxMLCBQUklNQVJZIEtFWSAodHlwZSwgZWxlbWVudElkKVwiLFxuXHRyYW5nZXM6IFwidHlwZSBURVhUIE5PVCBOVUxMLCBsaXN0SWQgVEVYVCBOT1QgTlVMTCwgbG93ZXIgVEVYVCBOT1QgTlVMTCwgdXBwZXIgVEVYVCBOT1QgTlVMTCwgUFJJTUFSWSBLRVkgKHR5cGUsIGxpc3RJZClcIixcblx0bGFzdFVwZGF0ZUJhdGNoSWRQZXJHcm91cElkOiBcImdyb3VwSWQgVEVYVCBOT1QgTlVMTCwgYmF0Y2hJZCBURVhUIE5PVCBOVUxMLCBQUklNQVJZIEtFWSAoZ3JvdXBJZClcIixcblx0bWV0YWRhdGE6IFwia2V5IFRFWFQgTk9UIE5VTEwsIHZhbHVlIEJMT0IsIFBSSU1BUlkgS0VZIChrZXkpXCIsXG5cdGJsb2JfZWxlbWVudF9lbnRpdGllczpcblx0XHRcInR5cGUgVEVYVCBOT1QgTlVMTCwgbGlzdElkIFRFWFQgTk9UIE5VTEwsIGVsZW1lbnRJZCBURVhUIE5PVCBOVUxMLCBvd25lckdyb3VwIFRFWFQsIGVudGl0eSBCTE9CIE5PVCBOVUxMLCBQUklNQVJZIEtFWSAodHlwZSwgbGlzdElkLCBlbGVtZW50SWQpXCIsXG59IGFzIGNvbnN0KVxuXG50eXBlIFJhbmdlID0geyBsb3dlcjogSWQ7IHVwcGVyOiBJZCB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2ZmbGluZVN0b3JhZ2VJbml0QXJncyB7XG5cdHVzZXJJZDogSWRcblx0ZGF0YWJhc2VLZXk6IFVpbnQ4QXJyYXlcblx0dGltZVJhbmdlRGF5czogbnVtYmVyIHwgbnVsbFxuXHRmb3JjZU5ld0RhdGFiYXNlOiBib29sZWFuXG59XG5cbmV4cG9ydCBjbGFzcyBPZmZsaW5lU3RvcmFnZSBpbXBsZW1lbnRzIENhY2hlU3RvcmFnZSwgRXhwb3NlZENhY2hlU3RvcmFnZSB7XG5cdHByaXZhdGUgY3VzdG9tQ2FjaGVIYW5kbGVyOiBDdXN0b21DYWNoZUhhbmRsZXJNYXAgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHVzZXJJZDogSWQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHRpbWVSYW5nZURheXM6IG51bWJlciB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzcWxDaXBoZXJGYWNhZGU6IFNxbENpcGhlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGludGVyV2luZG93RXZlbnRTZW5kZXI6IEludGVyV2luZG93RXZlbnRGYWNhZGVTZW5kRGlzcGF0Y2hlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWlncmF0b3I6IE9mZmxpbmVTdG9yYWdlTWlncmF0b3IsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjbGVhbmVyOiBPZmZsaW5lU3RvcmFnZUNsZWFuZXIsXG5cdCkge1xuXHRcdGFzc2VydChpc09mZmxpbmVTdG9yYWdlQXZhaWxhYmxlKCkgfHwgaXNUZXN0KCksIFwiT2ZmbGluZSBzdG9yYWdlIGlzIG5vdCBhdmFpbGFibGUuXCIpXG5cdH1cblxuXHQvKipcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gd2hldGhlciB0aGUgZGF0YWJhc2Ugd2FzIG5ld2x5IGNyZWF0ZWQgb3Igbm90XG5cdCAqL1xuXHRhc3luYyBpbml0KHsgdXNlcklkLCBkYXRhYmFzZUtleSwgdGltZVJhbmdlRGF5cywgZm9yY2VOZXdEYXRhYmFzZSB9OiBPZmZsaW5lU3RvcmFnZUluaXRBcmdzKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0dGhpcy51c2VySWQgPSB1c2VySWRcblx0XHR0aGlzLnRpbWVSYW5nZURheXMgPSB0aW1lUmFuZ2VEYXlzXG5cdFx0aWYgKGZvcmNlTmV3RGF0YWJhc2UpIHtcblx0XHRcdGlmIChpc0Rlc2t0b3AoKSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmludGVyV2luZG93RXZlbnRTZW5kZXIubG9jYWxVc2VyRGF0YUludmFsaWRhdGVkKHVzZXJJZClcblx0XHRcdH1cblx0XHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLmRlbGV0ZURiKHVzZXJJZClcblx0XHR9XG5cdFx0Ly8gV2Ugb3BlbiBkYXRhYmFzZSBoZXJlLCBhbmQgaXQgaXMgY2xvc2VkIGluIHRoZSBuYXRpdmUgc2lkZSB3aGVuIHRoZSB3aW5kb3cgaXMgY2xvc2VkIG9yIHRoZSBwYWdlIGlzIHJlbG9hZGVkXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUub3BlbkRiKHVzZXJJZCwgZGF0YWJhc2VLZXkpXG5cdFx0YXdhaXQgdGhpcy5jcmVhdGVUYWJsZXMoKVxuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMubWlncmF0b3IubWlncmF0ZSh0aGlzLCB0aGlzLnNxbENpcGhlckZhY2FkZSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE91dE9mU3luY0Vycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihcIk9mZmxpbmUgZGIgaXMgb3V0IG9mIHN5bmMhXCIsIGUpXG5cdFx0XHRcdGF3YWl0IHRoaXMucmVjcmVhdGVEYkZpbGUodXNlcklkLCBkYXRhYmFzZUtleSlcblx0XHRcdFx0YXdhaXQgdGhpcy5taWdyYXRvci5taWdyYXRlKHRoaXMsIHRoaXMuc3FsQ2lwaGVyRmFjYWRlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBpZiBub3RoaW5nIGlzIHdyaXR0ZW4gaGVyZSwgaXQgbWVhbnMgaXQncyBhIG5ldyBkYXRhYmFzZVxuXHRcdHJldHVybiAoYXdhaXQgdGhpcy5nZXRMYXN0VXBkYXRlVGltZSgpKS50eXBlID09PSBcIm5ldmVyXCJcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcmVjcmVhdGVEYkZpbGUodXNlcklkOiBzdHJpbmcsIGRhdGFiYXNlS2V5OiBVaW50OEFycmF5KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc29sZS5sb2coYHJlY3JlYXRpbmcgREIgZmlsZSBmb3IgdXNlcklkICR7dXNlcklkfWApXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuY2xvc2VEYigpXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuZGVsZXRlRGIodXNlcklkKVxuXHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLm9wZW5EYih1c2VySWQsIGRhdGFiYXNlS2V5KVxuXHRcdGF3YWl0IHRoaXMuY3JlYXRlVGFibGVzKClcblx0fVxuXG5cdC8qKlxuXHQgKiBjdXJyZW50bHksIHdlIGNsb3NlIERCcyBmcm9tIHRoZSBuYXRpdmUgc2lkZSAobWFpbmx5IG9uIHRoaW5ncyBsaWtlIHJlbG9hZCBhbmQgb24gYW5kcm9pZCdzIG9uRGVzdHJveSlcblx0ICovXG5cdGFzeW5jIGRlaW5pdCgpIHtcblx0XHR0aGlzLnVzZXJJZCA9IG51bGxcblx0XHRhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5jbG9zZURiKClcblx0fVxuXG5cdGFzeW5jIGRlbGV0ZUlmRXhpc3RzKHR5cGVSZWY6IFR5cGVSZWY8U29tZUVudGl0eT4sIGxpc3RJZDogSWQgfCBudWxsLCBlbGVtZW50SWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdHlwZSA9IGdldFR5cGVJZCh0eXBlUmVmKVxuXHRcdGxldCB0eXBlTW9kZWw6IFR5cGVNb2RlbFxuXHRcdHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0ZWxlbWVudElkID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgZWxlbWVudElkKVxuXHRcdGxldCBmb3JtYXR0ZWRRdWVyeVxuXHRcdHN3aXRjaCAodHlwZU1vZGVsLnR5cGUpIHtcblx0XHRcdGNhc2UgVHlwZUlkLkVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHRcdFx0IEZST00gZWxlbWVudF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgZWxlbWVudElkID0gJHtlbGVtZW50SWR9YFxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBUeXBlSWQuTGlzdEVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHRcdFx0IEZST00gbGlzdF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgbGlzdElkID0gJHtsaXN0SWR9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgZWxlbWVudElkID0gJHtlbGVtZW50SWR9YFxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBUeXBlSWQuQmxvYkVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHRcdFx0IEZST00gYmxvYl9lbGVtZW50X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0XHQgV0hFUkUgdHlwZSA9ICR7dHlwZX1cblx0XHRcdFx0XHRcdFx0XHRcdCAgIEFORCBsaXN0SWQgPSAke2xpc3RJZH1cblx0XHRcdFx0XHRcdFx0XHRcdCAgIEFORCBlbGVtZW50SWQgPSAke2VsZW1lbnRJZH1gXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJtdXN0IGJlIGEgcGVyc2lzdGVudCB0eXBlXCIpXG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnJ1bihmb3JtYXR0ZWRRdWVyeS5xdWVyeSwgZm9ybWF0dGVkUXVlcnkucGFyYW1zKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlQWxsT2ZUeXBlKHR5cGVSZWY6IFR5cGVSZWY8U29tZUVudGl0eT4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB0eXBlID0gZ2V0VHlwZUlkKHR5cGVSZWYpXG5cdFx0bGV0IHR5cGVNb2RlbDogVHlwZU1vZGVsXG5cdFx0dHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRsZXQgZm9ybWF0dGVkUXVlcnlcblx0XHRzd2l0Y2ggKHR5cGVNb2RlbC50eXBlKSB7XG5cdFx0XHRjYXNlIFR5cGVJZC5FbGVtZW50OlxuXHRcdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBERUxFVEVcblx0XHRcdFx0XHRcdFx0XHRcdCBGUk9NIGVsZW1lbnRfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdCBXSEVSRSB0eXBlID0gJHt0eXBlfWBcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgVHlwZUlkLkxpc3RFbGVtZW50OlxuXHRcdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBERUxFVEVcblx0XHRcdFx0XHRcdFx0XHRcdCBGUk9NIGxpc3RfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdCBXSEVSRSB0eXBlID0gJHt0eXBlfWBcblx0XHRcdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKGZvcm1hdHRlZFF1ZXJ5LnF1ZXJ5LCBmb3JtYXR0ZWRRdWVyeS5wYXJhbXMpXG5cdFx0XHRcdGF3YWl0IHRoaXMuZGVsZXRlQWxsUmFuZ2VzRm9yVHlwZSh0eXBlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdGNhc2UgVHlwZUlkLkJsb2JFbGVtZW50OlxuXHRcdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBERUxFVEVcblx0XHRcdFx0XHRcdFx0XHRcdCBGUk9NIGJsb2JfZWxlbWVudF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9YFxuXHRcdFx0XHRicmVha1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibXVzdCBiZSBhIHBlcnNpc3RlbnQgdHlwZVwiKVxuXHRcdH1cblx0XHRhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5ydW4oZm9ybWF0dGVkUXVlcnkucXVlcnksIGZvcm1hdHRlZFF1ZXJ5LnBhcmFtcylcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZGVsZXRlQWxsUmFuZ2VzRm9yVHlwZSh0eXBlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB7IHF1ZXJ5LCBwYXJhbXMgfSA9IHNxbGBERUxFVEVcblx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSByYW5nZXNcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgdHlwZSA9ICR7dHlwZX1gXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdH1cblxuXHRhc3luYyBnZXQ8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQgfCBudWxsLCBlbGVtZW50SWQ6IElkKTogUHJvbWlzZTxUIHwgbnVsbD4ge1xuXHRcdGNvbnN0IHR5cGUgPSBnZXRUeXBlSWQodHlwZVJlZilcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGVsZW1lbnRJZCA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIGVsZW1lbnRJZClcblx0XHRsZXQgZm9ybWF0dGVkUXVlcnlcblx0XHRzd2l0Y2ggKHR5cGVNb2RlbC50eXBlKSB7XG5cdFx0XHRjYXNlIFR5cGVJZC5FbGVtZW50OlxuXHRcdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBTRUxFQ1QgZW50aXR5XG5cdFx0XHRcdFx0XHRcdFx0XHQgZnJvbSBlbGVtZW50X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0XHQgV0hFUkUgdHlwZSA9ICR7dHlwZX1cblx0XHRcdFx0XHRcdFx0XHRcdCAgIEFORCBlbGVtZW50SWQgPSAke2VsZW1lbnRJZH1gXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIFR5cGVJZC5MaXN0RWxlbWVudDpcblx0XHRcdFx0Zm9ybWF0dGVkUXVlcnkgPSBzcWxgU0VMRUNUIGVudGl0eVxuXHRcdFx0XHRcdFx0XHRcdFx0IGZyb20gbGlzdF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgbGlzdElkID0gJHtsaXN0SWR9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgZWxlbWVudElkID0gJHtlbGVtZW50SWR9YFxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBUeXBlSWQuQmxvYkVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYFNFTEVDVCBlbnRpdHlcblx0XHRcdFx0XHRcdFx0XHRcdCBmcm9tIGJsb2JfZWxlbWVudF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgbGlzdElkID0gJHtsaXN0SWR9XG5cdFx0XHRcdFx0XHRcdFx0XHQgICBBTkQgZWxlbWVudElkID0gJHtlbGVtZW50SWR9YFxuXHRcdFx0XHRicmVha1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibXVzdCBiZSBhIHBlcnNpc3RlbnQgdHlwZVwiKVxuXHRcdH1cblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5nZXQoZm9ybWF0dGVkUXVlcnkucXVlcnksIGZvcm1hdHRlZFF1ZXJ5LnBhcmFtcylcblx0XHRyZXR1cm4gcmVzdWx0Py5lbnRpdHkgPyBhd2FpdCB0aGlzLmRlc2VyaWFsaXplKHR5cGVSZWYsIHJlc3VsdC5lbnRpdHkudmFsdWUgYXMgVWludDhBcnJheSkgOiBudWxsXG5cdH1cblxuXHRhc3luYyBwcm92aWRlTXVsdGlwbGU8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBlbGVtZW50SWRzOiBJZFtdKTogUHJvbWlzZTxBcnJheTxUPj4ge1xuXHRcdGlmIChlbGVtZW50SWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRlbGVtZW50SWRzID0gZWxlbWVudElkcy5tYXAoKGVsKSA9PiBlbnN1cmVCYXNlNjRFeHQodHlwZU1vZGVsLCBlbCkpXG5cblx0XHRjb25zdCB0eXBlID0gZ2V0VHlwZUlkKHR5cGVSZWYpXG5cdFx0Y29uc3Qgc2VyaWFsaXplZExpc3Q6IFJlYWRvbmx5QXJyYXk8UmVjb3JkPHN0cmluZywgVGFnZ2VkU3FsVmFsdWU+PiA9IGF3YWl0IHRoaXMuYWxsQ2h1bmtlZChcblx0XHRcdE1BWF9TQUZFX1NRTF9WQVJTIC0gMixcblx0XHRcdGVsZW1lbnRJZHMsXG5cdFx0XHQoYykgPT4gc3FsYFNFTEVDVCBlbnRpdHlcblx0XHRcdFx0XHQgICBGUk9NIGxpc3RfZW50aXRpZXNcblx0XHRcdFx0XHQgICBXSEVSRSB0eXBlID0gJHt0eXBlfVxuXHRcdFx0XHRcdFx0IEFORCBsaXN0SWQgPSAke2xpc3RJZH1cblx0XHRcdFx0XHRcdCBBTkQgZWxlbWVudElkIElOICR7cGFyYW1MaXN0KGMpfWAsXG5cdFx0KVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmRlc2VyaWFsaXplTGlzdChcblx0XHRcdHR5cGVSZWYsXG5cdFx0XHRzZXJpYWxpemVkTGlzdC5tYXAoKHIpID0+IHIuZW50aXR5LnZhbHVlIGFzIFVpbnQ4QXJyYXkpLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIGdldElkc0luUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTxBcnJheTxJZD4+IHtcblx0XHRjb25zdCB0eXBlID0gZ2V0VHlwZUlkKHR5cGVSZWYpXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRjb25zdCByYW5nZSA9IGF3YWl0IHRoaXMuZ2V0UmFuZ2UodHlwZVJlZiwgbGlzdElkKVxuXHRcdGlmIChyYW5nZSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYG5vIHJhbmdlIGV4aXN0cyBmb3IgJHt0eXBlfSBhbmQgbGlzdCAke2xpc3RJZH1gKVxuXHRcdH1cblx0XHRjb25zdCB7IHF1ZXJ5LCBwYXJhbXMgfSA9IHNxbGBTRUxFQ1QgZWxlbWVudElkXG5cdFx0XHRcdFx0XHRcdFx0XHQgIEZST00gbGlzdF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0ICBXSEVSRSB0eXBlID0gJHt0eXBlfVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRBTkQgbGlzdElkID0gJHtsaXN0SWR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdEFORCAoZWxlbWVudElkID0gJHtyYW5nZS5sb3dlcn1cblx0XHRcdFx0XHRcdFx0XHRcdFx0ICBPUiAke2ZpcnN0SWRCaWdnZXIoXCJlbGVtZW50SWRcIiwgcmFuZ2UubG93ZXIpfSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0QU5EIE5PVCAoJHtmaXJzdElkQmlnZ2VyKFwiZWxlbWVudElkXCIsIHJhbmdlLnVwcGVyKX0pYFxuXHRcdGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5hbGwocXVlcnksIHBhcmFtcylcblx0XHRyZXR1cm4gcm93cy5tYXAoKHJvdykgPT4gY3VzdG9tSWRUb0Jhc2U2NFVybCh0eXBlTW9kZWwsIHJvdy5lbGVtZW50SWQudmFsdWUgYXMgc3RyaW5nKSlcblx0fVxuXG5cdC8qKiBkb24ndCB1c2UgdGhpcyBpbnRlcm5hbGx5IGluIHRoaXMgY2xhc3MsIHVzZSBPZmZsaW5lU3RvcmFnZTo6Z2V0UmFuZ2UgaW5zdGVhZC4gT2ZmbGluZVN0b3JhZ2UgaXNcblx0ICogdXNpbmcgY29udmVydGVkIGN1c3RvbSBJRHMgaW50ZXJuYWxseSB3aGljaCBpcyB1bmRvbmUgd2hlbiB1c2luZyB0aGlzIHRvIGFjY2VzcyB0aGUgcmFuZ2UuXG5cdCAqL1xuXHRhc3luYyBnZXRSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTxSYW5nZSB8IG51bGw+IHtcblx0XHRsZXQgcmFuZ2UgPSBhd2FpdCB0aGlzLmdldFJhbmdlKHR5cGVSZWYsIGxpc3RJZClcblx0XHRpZiAocmFuZ2UgPT0gbnVsbCkgcmV0dXJuIHJhbmdlXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG93ZXI6IGN1c3RvbUlkVG9CYXNlNjRVcmwodHlwZU1vZGVsLCByYW5nZS5sb3dlciksXG5cdFx0XHR1cHBlcjogY3VzdG9tSWRUb0Jhc2U2NFVybCh0eXBlTW9kZWwsIHJhbmdlLnVwcGVyKSxcblx0XHR9XG5cdH1cblxuXHRhc3luYyBpc0VsZW1lbnRJZEluQ2FjaGVSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGVsZW1lbnRJZDogSWQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGVsZW1lbnRJZCA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIGVsZW1lbnRJZClcblxuXHRcdGNvbnN0IHJhbmdlID0gYXdhaXQgdGhpcy5nZXRSYW5nZSh0eXBlUmVmLCBsaXN0SWQpXG5cdFx0cmV0dXJuIHJhbmdlICE9IG51bGwgJiYgIWZpcnN0QmlnZ2VyVGhhblNlY29uZChlbGVtZW50SWQsIHJhbmdlLnVwcGVyKSAmJiAhZmlyc3RCaWdnZXJUaGFuU2Vjb25kKHJhbmdlLmxvd2VyLCBlbGVtZW50SWQpXG5cdH1cblxuXHRhc3luYyBwcm92aWRlRnJvbVJhbmdlPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCwgc3RhcnQ6IElkLCBjb3VudDogbnVtYmVyLCByZXZlcnNlOiBib29sZWFuKTogUHJvbWlzZTxUW10+IHtcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdHN0YXJ0ID0gZW5zdXJlQmFzZTY0RXh0KHR5cGVNb2RlbCwgc3RhcnQpXG5cdFx0Y29uc3QgdHlwZSA9IGdldFR5cGVJZCh0eXBlUmVmKVxuXHRcdGxldCBmb3JtYXR0ZWRRdWVyeVxuXHRcdGlmIChyZXZlcnNlKSB7XG5cdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBTRUxFQ1QgZW50aXR5XG5cdFx0XHRcdFx0XHRcdFx0IEZST00gbGlzdF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdCBXSEVSRSB0eXBlID0gJHt0eXBlfVxuXHRcdFx0XHRcdFx0XHRcdCAgIEFORCBsaXN0SWQgPSAke2xpc3RJZH1cblx0XHRcdFx0XHRcdFx0XHQgICBBTkQgJHtmaXJzdElkQmlnZ2VyKHN0YXJ0LCBcImVsZW1lbnRJZFwiKX1cblx0XHRcdFx0XHRcdFx0XHQgT1JERVIgQlkgTEVOR1RIKGVsZW1lbnRJZCkgREVTQywgZWxlbWVudElkIERFU0MgTElNSVQgJHtjb3VudH1gXG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYFNFTEVDVCBlbnRpdHlcblx0XHRcdFx0XHRcdFx0XHQgRlJPTSBsaXN0X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0IFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0ICAgQU5EIGxpc3RJZCA9ICR7bGlzdElkfVxuXHRcdFx0XHRcdFx0XHRcdCAgIEFORCAke2ZpcnN0SWRCaWdnZXIoXCJlbGVtZW50SWRcIiwgc3RhcnQpfVxuXHRcdFx0XHRcdFx0XHRcdCBPUkRFUiBCWSBMRU5HVEgoZWxlbWVudElkKSBBU0MsIGVsZW1lbnRJZCBBU0MgTElNSVQgJHtjb3VudH1gXG5cdFx0fVxuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gZm9ybWF0dGVkUXVlcnlcblx0XHRjb25zdCBzZXJpYWxpemVkTGlzdDogUmVhZG9ubHlBcnJheTxSZWNvcmQ8c3RyaW5nLCBUYWdnZWRTcWxWYWx1ZT4+ID0gYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuYWxsKHF1ZXJ5LCBwYXJhbXMpXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuZGVzZXJpYWxpemVMaXN0KFxuXHRcdFx0dHlwZVJlZixcblx0XHRcdHNlcmlhbGl6ZWRMaXN0Lm1hcCgocikgPT4gci5lbnRpdHkudmFsdWUgYXMgVWludDhBcnJheSksXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgcHV0KG9yaWdpbmFsRW50aXR5OiBTb21lRW50aXR5KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3Qgc2VyaWFsaXplZEVudGl0eSA9IHRoaXMuc2VyaWFsaXplKG9yaWdpbmFsRW50aXR5KVxuXHRcdGxldCB7IGxpc3RJZCwgZWxlbWVudElkIH0gPSBleHBhbmRJZChvcmlnaW5hbEVudGl0eS5faWQpXG5cdFx0Y29uc3QgdHlwZSA9IGdldFR5cGVJZChvcmlnaW5hbEVudGl0eS5fdHlwZSlcblx0XHRjb25zdCBvd25lckdyb3VwID0gb3JpZ2luYWxFbnRpdHkuX293bmVyR3JvdXBcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShvcmlnaW5hbEVudGl0eS5fdHlwZSlcblx0XHRlbGVtZW50SWQgPSBlbnN1cmVCYXNlNjRFeHQodHlwZU1vZGVsLCBlbGVtZW50SWQpXG5cdFx0bGV0IGZvcm1hdHRlZFF1ZXJ5OiBGb3JtYXR0ZWRRdWVyeVxuXHRcdHN3aXRjaCAodHlwZU1vZGVsLnR5cGUpIHtcblx0XHRcdGNhc2UgVHlwZUlkLkVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYElOU0VSVFxuXHRcdFx0XHRPUiBSRVBMQUNFIElOVE8gZWxlbWVudF9lbnRpdGllcyAodHlwZSwgZWxlbWVudElkLCBvd25lckdyb3VwLCBlbnRpdHkpIFZBTFVFUyAoXG5cdFx0XHRcdCR7dHlwZX0sXG5cdFx0XHRcdCR7ZWxlbWVudElkfSxcblx0XHRcdFx0JHtvd25lckdyb3VwfSxcblx0XHRcdFx0JHtzZXJpYWxpemVkRW50aXR5fVxuXHRcdFx0XHQpYFxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBUeXBlSWQuTGlzdEVsZW1lbnQ6XG5cdFx0XHRcdGZvcm1hdHRlZFF1ZXJ5ID0gc3FsYElOU0VSVFxuXHRcdFx0XHRPUiBSRVBMQUNFIElOVE8gbGlzdF9lbnRpdGllcyAodHlwZSwgbGlzdElkLCBlbGVtZW50SWQsIG93bmVyR3JvdXAsIGVudGl0eSkgVkFMVUVTIChcblx0XHRcdFx0JHt0eXBlfSxcblx0XHRcdFx0JHtsaXN0SWR9LFxuXHRcdFx0XHQke2VsZW1lbnRJZH0sXG5cdFx0XHRcdCR7b3duZXJHcm91cH0sXG5cdFx0XHRcdCR7c2VyaWFsaXplZEVudGl0eX1cblx0XHRcdFx0KWBcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgVHlwZUlkLkJsb2JFbGVtZW50OlxuXHRcdFx0XHRmb3JtYXR0ZWRRdWVyeSA9IHNxbGBJTlNFUlRcblx0XHRcdFx0T1IgUkVQTEFDRSBJTlRPIGJsb2JfZWxlbWVudF9lbnRpdGllcyAodHlwZSwgbGlzdElkLCBlbGVtZW50SWQsIG93bmVyR3JvdXAsIGVudGl0eSkgVkFMVUVTIChcblx0XHRcdFx0JHt0eXBlfSxcblx0XHRcdFx0JHtsaXN0SWR9LFxuXHRcdFx0XHQke2VsZW1lbnRJZH0sXG5cdFx0XHRcdCR7b3duZXJHcm91cH0sXG5cdFx0XHRcdCR7c2VyaWFsaXplZEVudGl0eX1cblx0XHRcdFx0KWBcblx0XHRcdFx0YnJlYWtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIm11c3QgYmUgYSBwZXJzaXN0ZW50IHR5cGVcIilcblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKGZvcm1hdHRlZFF1ZXJ5LnF1ZXJ5LCBmb3JtYXR0ZWRRdWVyeS5wYXJhbXMpXG5cdH1cblxuXHRhc3luYyBzZXRMb3dlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGxvd2VySWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0bG93ZXJJZCA9IGVuc3VyZUJhc2U2NEV4dChhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKSwgbG93ZXJJZClcblx0XHRjb25zdCB0eXBlID0gZ2V0VHlwZUlkKHR5cGVSZWYpXG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgVVBEQVRFIHJhbmdlc1xuXHRcdFx0XHRcdFx0XHRcdFx0ICBTRVQgbG93ZXIgPSAke2xvd2VySWR9XG5cdFx0XHRcdFx0XHRcdFx0XHQgIFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdEFORCBsaXN0SWQgPSAke2xpc3RJZH1gXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdH1cblxuXHRhc3luYyBzZXRVcHBlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIHVwcGVySWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dXBwZXJJZCA9IGVuc3VyZUJhc2U2NEV4dChhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKSwgdXBwZXJJZClcblx0XHRjb25zdCB0eXBlID0gZ2V0VHlwZUlkKHR5cGVSZWYpXG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgVVBEQVRFIHJhbmdlc1xuXHRcdFx0XHRcdFx0XHRcdFx0ICBTRVQgdXBwZXIgPSAke3VwcGVySWR9XG5cdFx0XHRcdFx0XHRcdFx0XHQgIFdIRVJFIHR5cGUgPSAke3R5cGV9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdEFORCBsaXN0SWQgPSAke2xpc3RJZH1gXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdH1cblxuXHRhc3luYyBzZXROZXdSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBsb3dlcjogSWQsIHVwcGVyOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0bG93ZXIgPSBlbnN1cmVCYXNlNjRFeHQodHlwZU1vZGVsLCBsb3dlcilcblx0XHR1cHBlciA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIHVwcGVyKVxuXG5cdFx0Y29uc3QgdHlwZSA9IGdldFR5cGVJZCh0eXBlUmVmKVxuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYElOU0VSVFxuXHRcdE9SIFJFUExBQ0UgSU5UTyByYW5nZXMgVkFMVUVTIChcblx0XHQke3R5cGV9LFxuXHRcdCR7bGlzdElkfSxcblx0XHQke2xvd2VyfSxcblx0XHQke3VwcGVyfVxuXHRcdClgXG5cdFx0cmV0dXJuIHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnJ1bihxdWVyeSwgcGFyYW1zKVxuXHR9XG5cblx0YXN5bmMgZ2V0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8SWQgfCBudWxsPiB7XG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgU0VMRUNUIGJhdGNoSWRcblx0XHRcdFx0XHRcdFx0XHRcdCAgZnJvbSBsYXN0VXBkYXRlQmF0Y2hJZFBlckdyb3VwSWRcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgZ3JvdXBJZCA9ICR7Z3JvdXBJZH1gXG5cdFx0Y29uc3Qgcm93ID0gKGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLmdldChxdWVyeSwgcGFyYW1zKSkgYXMgeyBiYXRjaElkOiBUYWdnZWRTcWxWYWx1ZSB9IHwgbnVsbFxuXHRcdHJldHVybiAocm93Py5iYXRjaElkPy52YWx1ZSA/PyBudWxsKSBhcyBJZCB8IG51bGxcblx0fVxuXG5cdGFzeW5jIHB1dExhc3RCYXRjaElkRm9yR3JvdXAoZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgSU5TRVJUXG5cdFx0T1IgUkVQTEFDRSBJTlRPIGxhc3RVcGRhdGVCYXRjaElkUGVyR3JvdXBJZCBWQUxVRVMgKFxuXHRcdCR7Z3JvdXBJZH0sXG5cdFx0JHtiYXRjaElkfVxuXHRcdClgXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdH1cblxuXHRhc3luYyBnZXRMYXN0VXBkYXRlVGltZSgpOiBQcm9taXNlPExhc3RVcGRhdGVUaW1lPiB7XG5cdFx0Y29uc3QgdGltZSA9IGF3YWl0IHRoaXMuZ2V0TWV0YWRhdGEoXCJsYXN0VXBkYXRlVGltZVwiKVxuXHRcdHJldHVybiB0aW1lID8geyB0eXBlOiBcInJlY29yZGVkXCIsIHRpbWUgfSA6IHsgdHlwZTogXCJuZXZlclwiIH1cblx0fVxuXG5cdGFzeW5jIHB1dExhc3RVcGRhdGVUaW1lKG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB0aGlzLnB1dE1ldGFkYXRhKFwibGFzdFVwZGF0ZVRpbWVcIiwgbXMpXG5cdH1cblxuXHRhc3luYyBwdXJnZVN0b3JhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChsZXQgbmFtZSBvZiBPYmplY3Qua2V5cyhUYWJsZURlZmluaXRpb25zKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKFxuXHRcdFx0XHRgREVMRVRFXG5cdFx0XHRcdCBGUk9NICR7bmFtZX1gLFxuXHRcdFx0XHRbXSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRhc3luYyBkZWxldGVSYW5nZSh0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+LCBsaXN0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHRcdFx0ICBGUk9NIHJhbmdlc1xuXHRcdFx0XHRcdFx0XHRcdFx0ICBXSEVSRSB0eXBlID0gJHtnZXRUeXBlSWQodHlwZVJlZil9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdEFORCBsaXN0SWQgPSAke2xpc3RJZH1gXG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdH1cblxuXHRhc3luYyBnZXRSYXdMaXN0RWxlbWVudHNPZlR5cGUodHlwZVJlZjogVHlwZVJlZjxMaXN0RWxlbWVudEVudGl0eT4pOiBQcm9taXNlPEFycmF5PExpc3RFbGVtZW50RW50aXR5Pj4ge1xuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYFNFTEVDVCBlbnRpdHlcblx0XHRcdFx0XHRcdFx0XHRcdCAgZnJvbSBsaXN0X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0XHQgIFdIRVJFIHR5cGUgPSAke2dldFR5cGVJZCh0eXBlUmVmKX1gXG5cdFx0Y29uc3QgaXRlbXMgPSAoYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuYWxsKHF1ZXJ5LCBwYXJhbXMpKSA/PyBbXVxuXHRcdHJldHVybiBpdGVtcy5tYXAoKGl0ZW0pID0+IHRoaXMuZGVjb2RlQ2JvckVudGl0eShpdGVtLmVudGl0eS52YWx1ZSBhcyBVaW50OEFycmF5KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIExpc3RFbGVtZW50RW50aXR5KVxuXHR9XG5cblx0YXN5bmMgZ2V0UmF3RWxlbWVudHNPZlR5cGUodHlwZVJlZjogVHlwZVJlZjxFbGVtZW50RW50aXR5Pik6IFByb21pc2U8QXJyYXk8RWxlbWVudEVudGl0eT4+IHtcblx0XHRjb25zdCB7IHF1ZXJ5LCBwYXJhbXMgfSA9IHNxbGBTRUxFQ1QgZW50aXR5XG5cdFx0XHRcdFx0XHRcdFx0XHQgIGZyb20gZWxlbWVudF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHRcdFx0ICBXSEVSRSB0eXBlID0gJHtnZXRUeXBlSWQodHlwZVJlZil9YFxuXHRcdGNvbnN0IGl0ZW1zID0gKGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLmFsbChxdWVyeSwgcGFyYW1zKSkgPz8gW11cblx0XHRyZXR1cm4gaXRlbXMubWFwKChpdGVtKSA9PiB0aGlzLmRlY29kZUNib3JFbnRpdHkoaXRlbS5lbnRpdHkudmFsdWUgYXMgVWludDhBcnJheSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiBFbGVtZW50RW50aXR5KVxuXHR9XG5cblx0YXN5bmMgZ2V0RWxlbWVudHNPZlR5cGU8VCBleHRlbmRzIEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4pOiBQcm9taXNlPEFycmF5PFQ+PiB7XG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgU0VMRUNUIGVudGl0eVxuXHRcdFx0XHRcdFx0XHRcdFx0ICBmcm9tIGVsZW1lbnRfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgdHlwZSA9ICR7Z2V0VHlwZUlkKHR5cGVSZWYpfWBcblx0XHRjb25zdCBpdGVtcyA9IChhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5hbGwocXVlcnksIHBhcmFtcykpID8/IFtdXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuZGVzZXJpYWxpemVMaXN0KFxuXHRcdFx0dHlwZVJlZixcblx0XHRcdGl0ZW1zLm1hcCgocm93KSA9PiByb3cuZW50aXR5LnZhbHVlIGFzIFVpbnQ4QXJyYXkpLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIGdldFdob2xlTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQpOiBQcm9taXNlPEFycmF5PFQ+PiB7XG5cdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgU0VMRUNUIGVudGl0eVxuXHRcdFx0XHRcdFx0XHRcdFx0ICBGUk9NIGxpc3RfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgdHlwZSA9ICR7Z2V0VHlwZUlkKHR5cGVSZWYpfVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRBTkQgbGlzdElkID0gJHtsaXN0SWR9YFxuXHRcdGNvbnN0IGl0ZW1zID0gKGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLmFsbChxdWVyeSwgcGFyYW1zKSkgPz8gW11cblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5kZXNlcmlhbGl6ZUxpc3QoXG5cdFx0XHR0eXBlUmVmLFxuXHRcdFx0aXRlbXMubWFwKChyb3cpID0+IHJvdy5lbnRpdHkudmFsdWUgYXMgVWludDhBcnJheSksXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgZHVtcE1ldGFkYXRhKCk6IFByb21pc2U8UGFydGlhbDxPZmZsaW5lRGJNZXRhPj4ge1xuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJTRUxFQ1QgKiBmcm9tIG1ldGFkYXRhXCJcblx0XHRjb25zdCBzdG9yZWQgPSAoYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuYWxsKHF1ZXJ5LCBbXSkpLm1hcCgocm93KSA9PiBbcm93LmtleS52YWx1ZSBhcyBzdHJpbmcsIHJvdy52YWx1ZS52YWx1ZSBhcyBVaW50OEFycmF5XSBhcyBjb25zdClcblx0XHRyZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHN0b3JlZC5tYXAoKFtrZXksIHZhbHVlXSkgPT4gW2tleSwgY2JvcmcuZGVjb2RlKHZhbHVlKV0pKSBhcyBPZmZsaW5lRGJNZXRhXG5cdH1cblxuXHRhc3luYyBzZXRTdG9yZWRNb2RlbFZlcnNpb24obW9kZWw6IFZlcnNpb25NZXRhZGF0YUJhc2VLZXksIHZlcnNpb246IG51bWJlcikge1xuXHRcdHJldHVybiB0aGlzLnB1dE1ldGFkYXRhKGAke21vZGVsfS12ZXJzaW9uYCwgdmVyc2lvbilcblx0fVxuXG5cdGdldEN1c3RvbUNhY2hlSGFuZGxlck1hcChlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50KTogQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwIHtcblx0XHRpZiAodGhpcy5jdXN0b21DYWNoZUhhbmRsZXIgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5jdXN0b21DYWNoZUhhbmRsZXIgPSBuZXcgQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmVmOiBDYWxlbmRhckV2ZW50VHlwZVJlZixcblx0XHRcdFx0XHRoYW5kbGVyOiBuZXcgQ3VzdG9tQ2FsZW5kYXJFdmVudENhY2hlSGFuZGxlcihlbnRpdHlSZXN0Q2xpZW50KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0eyByZWY6IE1haWxUeXBlUmVmLCBoYW5kbGVyOiBuZXcgQ3VzdG9tTWFpbEV2ZW50Q2FjaGVIYW5kbGVyKCkgfSxcblx0XHRcdClcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuY3VzdG9tQ2FjaGVIYW5kbGVyXG5cdH1cblxuXHRnZXRVc2VySWQoKTogSWQge1xuXHRcdHJldHVybiBhc3NlcnROb3ROdWxsKHRoaXMudXNlcklkLCBcIk5vIHVzZXIgaWQsIG5vdCBpbml0aWFsaXplZD9cIilcblx0fVxuXG5cdGFzeW5jIGRlbGV0ZUFsbE93bmVkQnkob3duZXI6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0e1xuXHRcdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSBlbGVtZW50X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgb3duZXJHcm91cCA9ICR7b3duZXJ9YFxuXHRcdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUucnVuKHF1ZXJ5LCBwYXJhbXMpXG5cdFx0fVxuXHRcdHtcblx0XHRcdC8vIGZpcnN0LCBjaGVjayB3aGljaCBsaXN0IElkcyBjb250YWluIGVudGl0aWVzIG93bmVkIGJ5IHRoZSBsb3N0IGdyb3VwXG5cdFx0XHRjb25zdCB7IHF1ZXJ5LCBwYXJhbXMgfSA9IHNxbGBTRUxFQ1QgbGlzdElkLCB0eXBlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSBsaXN0X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgb3duZXJHcm91cCA9ICR7b3duZXJ9YFxuXHRcdFx0Y29uc3QgcmFuZ2VSb3dzID0gYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuYWxsKHF1ZXJ5LCBwYXJhbXMpXG5cdFx0XHRjb25zdCByb3dzID0gcmFuZ2VSb3dzLm1hcCgocm93KSA9PiB1bnRhZ1NxbE9iamVjdChyb3cpIGFzIHsgbGlzdElkOiBzdHJpbmc7IHR5cGU6IHN0cmluZyB9KVxuXHRcdFx0Y29uc3QgbGlzdElkc0J5VHlwZTogTWFwPHN0cmluZywgU2V0PElkPj4gPSBncm91cEJ5QW5kTWFwVW5pcXVlbHkoXG5cdFx0XHRcdHJvd3MsXG5cdFx0XHRcdChyb3cpID0+IHJvdy50eXBlLFxuXHRcdFx0XHQocm93KSA9PiByb3cubGlzdElkLFxuXHRcdFx0KVxuXHRcdFx0Ly8gZGVsZXRlIHRoZSByYW5nZXMgZm9yIHRob3NlIGxpc3RJZHNcblx0XHRcdGZvciAoY29uc3QgW3R5cGUsIGxpc3RJZHNdIG9mIGxpc3RJZHNCeVR5cGUuZW50cmllcygpKSB7XG5cdFx0XHRcdC8vIHRoaXMgcGFydGljdWxhciBxdWVyeSB1c2VzIG9uZSBvdGhlciBTUUwgdmFyIGZvciB0aGUgdHlwZS5cblx0XHRcdFx0Y29uc3Qgc2FmZUNodW5rU2l6ZSA9IE1BWF9TQUZFX1NRTF9WQVJTIC0gMVxuXHRcdFx0XHRjb25zdCBsaXN0SWRBcnIgPSBBcnJheS5mcm9tKGxpc3RJZHMpXG5cdFx0XHRcdGF3YWl0IHRoaXMucnVuQ2h1bmtlZChcblx0XHRcdFx0XHRzYWZlQ2h1bmtTaXplLFxuXHRcdFx0XHRcdGxpc3RJZEFycixcblx0XHRcdFx0XHQoYykgPT4gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHQgICBGUk9NIHJhbmdlc1xuXHRcdFx0XHRcdFx0XHQgICBXSEVSRSB0eXBlID0gJHt0eXBlfVxuXHRcdFx0XHRcdFx0XHRcdCBBTkQgbGlzdElkIElOICR7cGFyYW1MaXN0KGMpfWAsXG5cdFx0XHRcdClcblx0XHRcdFx0YXdhaXQgdGhpcy5ydW5DaHVua2VkKFxuXHRcdFx0XHRcdHNhZmVDaHVua1NpemUsXG5cdFx0XHRcdFx0bGlzdElkQXJyLFxuXHRcdFx0XHRcdChjKSA9PiBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdCAgIEZST00gbGlzdF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHQgICBXSEVSRSB0eXBlID0gJHt0eXBlfVxuXHRcdFx0XHRcdFx0XHRcdCBBTkQgbGlzdElkIElOICR7cGFyYW1MaXN0KGMpfWAsXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9XG5cdFx0e1xuXHRcdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSBibG9iX2VsZW1lbnRfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICBXSEVSRSBvd25lckdyb3VwID0gJHtvd25lcn1gXG5cdFx0XHRhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5ydW4ocXVlcnksIHBhcmFtcylcblx0XHR9XG5cdFx0e1xuXHRcdFx0Y29uc3QgeyBxdWVyeSwgcGFyYW1zIH0gPSBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSBsYXN0VXBkYXRlQmF0Y2hJZFBlckdyb3VwSWRcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICBXSEVSRSBncm91cElkID0gJHtvd25lcn1gXG5cdFx0XHRhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5ydW4ocXVlcnksIHBhcmFtcylcblx0XHR9XG5cdH1cblxuXHRhc3luYyBkZWxldGVXaG9sZUxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5sb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkKVxuXHRcdGF3YWl0IHRoaXMuZGVsZXRlUmFuZ2UodHlwZVJlZiwgbGlzdElkKVxuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYERFTEVURVxuXHRcdFx0XHRcdFx0XHRcdFx0ICBGUk9NIGxpc3RfZW50aXRpZXNcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgbGlzdElkID0gJHtsaXN0SWR9YFxuXHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnJ1bihxdWVyeSwgcGFyYW1zKVxuXHRcdGF3YWl0IHRoaXMudW5sb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwdXRNZXRhZGF0YTxLIGV4dGVuZHMga2V5b2YgT2ZmbGluZURiTWV0YT4oa2V5OiBLLCB2YWx1ZTogT2ZmbGluZURiTWV0YVtLXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBlbmNvZGVkVmFsdWVcblx0XHR0cnkge1xuXHRcdFx0ZW5jb2RlZFZhbHVlID0gY2JvcmcuZW5jb2RlKHZhbHVlKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiW09mZmxpbmVTdG9yYWdlXSBmYWlsZWQgdG8gZW5jb2RlIG1ldGFkYXRhIGZvciBrZXlcIiwga2V5LCBcIndpdGggdmFsdWVcIiwgdmFsdWUpXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYElOU0VSVFxuXHRcdE9SIFJFUExBQ0UgSU5UTyBtZXRhZGF0YSBWQUxVRVMgKFxuXHRcdCR7a2V5fSxcblx0XHQke2VuY29kZWRWYWx1ZX1cblx0XHQpYFxuXHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnJ1bihxdWVyeSwgcGFyYW1zKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBnZXRNZXRhZGF0YTxLIGV4dGVuZHMga2V5b2YgT2ZmbGluZURiTWV0YT4oa2V5OiBLKTogUHJvbWlzZTxPZmZsaW5lRGJNZXRhW0tdIHwgbnVsbD4ge1xuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYFNFTEVDVCB2YWx1ZVxuXHRcdFx0XHRcdFx0XHRcdFx0ICBmcm9tIG1ldGFkYXRhXG5cdFx0XHRcdFx0XHRcdFx0XHQgIFdIRVJFIGtleSA9ICR7a2V5fWBcblx0XHRjb25zdCBlbmNvZGVkID0gYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuZ2V0KHF1ZXJ5LCBwYXJhbXMpXG5cdFx0cmV0dXJuIGVuY29kZWQgJiYgY2JvcmcuZGVjb2RlKGVuY29kZWQudmFsdWUudmFsdWUgYXMgVWludDhBcnJheSlcblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhciBvdXQgdW5uZWVkZWQgZGF0YSBmcm9tIHRoZSBvZmZsaW5lIGRhdGFiYXNlIChpLmUuIHRyYXNoIGFuZCBzcGFtIGxpc3RzLCBvbGQgZGF0YSkuXG5cdCAqIFRoaXMgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgbG9naW4gKENhY2hlUG9zdExvZ2luQWN0aW9ucy50cykgdG8gZW5zdXJlIGZhc3QgbG9naW4gdGltZS5cblx0ICogQHBhcmFtIHRpbWVSYW5nZURheXM6IHRoZSBtYXhpbXVtIGFnZSBvZiBkYXlzIHRoYXQgbWFpbHMgc2hvdWxkIGJlIHRvIGJlIGtlcHQgaW4gdGhlIGRhdGFiYXNlLiBpZiBudWxsLCB3aWxsIHVzZSBhIGRlZmF1bHQgdmFsdWVcblx0ICogQHBhcmFtIHVzZXJJZCBpZCBvZiB0aGUgY3VycmVudCB1c2VyLiBkZWZhdWx0LCBsYXN0IHN0b3JlZCB1c2VySWRcblx0ICovXG5cdGFzeW5jIGNsZWFyRXhjbHVkZWREYXRhKHRpbWVSYW5nZURheXM6IG51bWJlciB8IG51bGwgPSB0aGlzLnRpbWVSYW5nZURheXMsIHVzZXJJZDogSWQgPSB0aGlzLmdldFVzZXJJZCgpKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5jbGVhbmVyLmNsZWFuT2ZmbGluZURiKHRoaXMsIHRpbWVSYW5nZURheXMsIHVzZXJJZCwgdGhpcy5kYXRlUHJvdmlkZXIubm93KCkpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNyZWF0ZVRhYmxlcygpIHtcblx0XHRmb3IgKGxldCBbbmFtZSwgZGVmaW5pdGlvbl0gb2YgT2JqZWN0LmVudHJpZXMoVGFibGVEZWZpbml0aW9ucykpIHtcblx0XHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnJ1bihcblx0XHRcdFx0YENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICR7bmFtZX1cblx0XHRcdFx0IChcblx0XHRcdFx0XHQgJHtkZWZpbml0aW9ufVxuXHRcdFx0XHQgKWAsXG5cdFx0XHRcdFtdLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGdldFJhbmdlKHR5cGVSZWY6IFR5cGVSZWY8RWxlbWVudEVudGl0eSB8IExpc3RFbGVtZW50RW50aXR5PiwgbGlzdElkOiBJZCk6IFByb21pc2U8UmFuZ2UgfCBudWxsPiB7XG5cdFx0Y29uc3QgdHlwZSA9IGdldFR5cGVJZCh0eXBlUmVmKVxuXHRcdGNvbnN0IHsgcXVlcnksIHBhcmFtcyB9ID0gc3FsYFNFTEVDVCB1cHBlciwgbG93ZXJcblx0XHRcdFx0XHRcdFx0XHRcdCAgRlJPTSByYW5nZXNcblx0XHRcdFx0XHRcdFx0XHRcdCAgV0hFUkUgdHlwZSA9ICR7dHlwZX1cblx0XHRcdFx0XHRcdFx0XHRcdFx0QU5EIGxpc3RJZCA9ICR7bGlzdElkfWBcblx0XHRjb25zdCByb3cgPSAoYXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUuZ2V0KHF1ZXJ5LCBwYXJhbXMpKSA/PyBudWxsXG5cblx0XHRyZXR1cm4gbWFwTnVsbGFibGUocm93LCB1bnRhZ1NxbE9iamVjdCkgYXMgUmFuZ2UgfCBudWxsXG5cdH1cblxuXHRhc3luYyBkZWxldGVJbih0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+LCBsaXN0SWQ6IElkIHwgbnVsbCwgZWxlbWVudElkczogSWRbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChlbGVtZW50SWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRzd2l0Y2ggKHR5cGVNb2RlbC50eXBlKSB7XG5cdFx0XHRjYXNlIFR5cGVJZC5FbGVtZW50OlxuXHRcdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5ydW5DaHVua2VkKFxuXHRcdFx0XHRcdE1BWF9TQUZFX1NRTF9WQVJTIC0gMSxcblx0XHRcdFx0XHRlbGVtZW50SWRzLFxuXHRcdFx0XHRcdChjKSA9PiBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdCAgIEZST00gZWxlbWVudF9lbnRpdGllc1xuXHRcdFx0XHRcdFx0XHQgICBXSEVSRSB0eXBlID0gJHtnZXRUeXBlSWQodHlwZVJlZil9XG5cdFx0XHRcdFx0XHRcdFx0IEFORCBlbGVtZW50SWQgSU4gJHtwYXJhbUxpc3QoYyl9YCxcblx0XHRcdFx0KVxuXHRcdFx0Y2FzZSBUeXBlSWQuTGlzdEVsZW1lbnQ6XG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLnJ1bkNodW5rZWQoXG5cdFx0XHRcdFx0TUFYX1NBRkVfU1FMX1ZBUlMgLSAyLFxuXHRcdFx0XHRcdGVsZW1lbnRJZHMsXG5cdFx0XHRcdFx0KGMpID0+IHNxbGBERUxFVEVcblx0XHRcdFx0XHRcdFx0ICAgRlJPTSBsaXN0X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdCAgIFdIRVJFIHR5cGUgPSAke2dldFR5cGVJZCh0eXBlUmVmKX1cblx0XHRcdFx0XHRcdFx0XHQgQU5EIGxpc3RJZCA9ICR7bGlzdElkfVxuXHRcdFx0XHRcdFx0XHRcdCBBTkQgZWxlbWVudElkIElOICR7cGFyYW1MaXN0KGMpfWAsXG5cdFx0XHRcdClcblx0XHRcdGNhc2UgVHlwZUlkLkJsb2JFbGVtZW50OlxuXHRcdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5ydW5DaHVua2VkKFxuXHRcdFx0XHRcdE1BWF9TQUZFX1NRTF9WQVJTIC0gMixcblx0XHRcdFx0XHRlbGVtZW50SWRzLFxuXHRcdFx0XHRcdChjKSA9PiBzcWxgREVMRVRFXG5cdFx0XHRcdFx0XHRcdCAgIEZST00gYmxvYl9lbGVtZW50X2VudGl0aWVzXG5cdFx0XHRcdFx0XHRcdCAgIFdIRVJFIHR5cGUgPSAke2dldFR5cGVJZCh0eXBlUmVmKX1cblx0XHRcdFx0XHRcdFx0XHQgQU5EIGxpc3RJZCA9ICR7bGlzdElkfVxuXHRcdFx0XHRcdFx0XHRcdCBBTkQgZWxlbWVudElkIElOICR7cGFyYW1MaXN0KGMpfWAsXG5cdFx0XHRcdClcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIm11c3QgYmUgYSBwZXJzaXN0ZW50IHR5cGVcIilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogV2Ugd2FudCB0byBsb2NrIHRoZSBhY2Nlc3MgdG8gdGhlIFwicmFuZ2VzXCIgZGIgd2hlbiB1cGRhdGluZyAvIHJlYWRpbmcgdGhlXG5cdCAqIG9mZmxpbmUgYXZhaWxhYmxlIG1haWwgbGlzdCAvIG1haWxzZXQgcmFuZ2VzIGZvciBlYWNoIG1haWwgbGlzdCAocmVmZXJlbmNlZCB1c2luZyB0aGUgbGlzdElkKS5cblx0ICogQHBhcmFtIGxpc3RJZCB0aGUgbWFpbCBsaXN0IG9yIG1haWwgc2V0IGVudHJ5IGxpc3QgdGhhdCB3ZSB3YW50IHRvIGxvY2tcblx0ICovXG5cdGFzeW5jIGxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQ6IElkKSB7XG5cdFx0YXdhaXQgdGhpcy5zcWxDaXBoZXJGYWNhZGUubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGlzIGlzIHRoZSBjb3VudGVycGFydCB0byB0aGUgZnVuY3Rpb24gXCJsb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkKVwiLlxuXHQgKiBAcGFyYW0gbGlzdElkIHRoZSBtYWlsIGxpc3QgdGhhdCB3ZSB3YW50IHRvIHVubG9ja1xuXHQgKi9cblx0YXN5bmMgdW5sb2NrUmFuZ2VzRGJBY2Nlc3MobGlzdElkOiBJZCkge1xuXHRcdGF3YWl0IHRoaXMuc3FsQ2lwaGVyRmFjYWRlLnVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZVJhbmdlRm9yTGlzdEFuZERlbGV0ZU9ic29sZXRlRGF0YTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIHJhd0N1dG9mZklkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0Y29uc3QgaXNDdXN0b21JZCA9IGlzQ3VzdG9tSWRUeXBlKHR5cGVNb2RlbClcblx0XHRjb25zdCBjb252ZXJ0ZWRDdXRvZmZJZCA9IGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWwsIHJhd0N1dG9mZklkKVxuXG5cdFx0Y29uc3QgcmFuZ2UgPSBhd2FpdCB0aGlzLmdldFJhbmdlKHR5cGVSZWYsIGxpc3RJZClcblx0XHRpZiAocmFuZ2UgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHJhbmdlIGZvciBhIGdpdmVuIGxpc3QgaXMgY29tcGxldGUgZnJvbSB0aGUgYmVnaW5uaW5nIChzdGFydHMgYXQgR0VORVJBVEVEX01JTl9JRCksIHRoZW4gd2Ugb25seSB3YW50IHRvIGFjdHVhbGx5IG1vZGlmeSB0aGVcblx0XHQvLyBzYXZlZCByYW5nZSBpZiB3ZSB3b3VsZCBiZSByZW1vdmluZyBlbGVtZW50cyBmcm9tIHRoZSBsaXN0LCBpbiBvcmRlciB0byBub3QgbG9zZSB0aGUgaW5mb3JtYXRpb24gdGhhdCB0aGUgcmFuZ2UgaXMgY29tcGxldGUgaW4gc3RvcmFnZS5cblx0XHQvLyBTbyB3ZSBoYXZlIHRvIGNoZWNrIGhvdyBvbGQgdGhlIG9sZGVzdCBlbGVtZW50IGluIHNhaWQgcmFuZ2UgaXMuIElmIGl0IGlzIG5ld2VyIHRoYW4gY3V0b2ZmSWQsIHRoZW4gd2Ugd2lsbCBub3QgbW9kaWZ5IHRoZSByYW5nZSxcblx0XHQvLyBvdGhlcndpc2Ugd2Ugd2lsbCBqdXN0IG1vZGlmeSBpdCBub3JtYWxseVxuXHRcdGNvbnN0IGV4cGVjdGVkTWluSWQgPSBpc0N1c3RvbUlkID8gQ1VTVE9NX01JTl9JRCA6IEdFTkVSQVRFRF9NSU5fSURcblx0XHRpZiAocmFuZ2UubG93ZXIgPT09IGV4cGVjdGVkTWluSWQpIHtcblx0XHRcdGNvbnN0IGVudGl0aWVzID0gYXdhaXQgdGhpcy5wcm92aWRlRnJvbVJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgZXhwZWN0ZWRNaW5JZCwgMSwgZmFsc2UpXG5cdFx0XHRjb25zdCBpZCA9IG1hcE51bGxhYmxlKGVudGl0aWVzWzBdLCBnZXRFbGVtZW50SWQpXG5cdFx0XHRjb25zdCByYW5nZVdvbnRCZU1vZGlmaWVkID0gaWQgPT0gbnVsbCB8fCBmaXJzdEJpZ2dlclRoYW5TZWNvbmQoaWQsIGNvbnZlcnRlZEN1dG9mZklkKSB8fCBpZCA9PT0gY29udmVydGVkQ3V0b2ZmSWRcblx0XHRcdGlmIChyYW5nZVdvbnRCZU1vZGlmaWVkKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChmaXJzdEJpZ2dlclRoYW5TZWNvbmQoY29udmVydGVkQ3V0b2ZmSWQsIHJhbmdlLmxvd2VyKSkge1xuXHRcdFx0Ly8gSWYgdGhlIHVwcGVyIGlkIG9mIHRoZSByYW5nZSBpcyBiZWxvdyB0aGUgY3V0b2ZmLCB0aGVuIHRoZSBlbnRpcmUgcmFuZ2Ugd2lsbCBiZSBkZWxldGVkIGZyb20gdGhlIHN0b3JhZ2Vcblx0XHRcdC8vIHNvIHdlIGp1c3QgZGVsZXRlIHRoZSByYW5nZSBhcyB3ZWxsXG5cdFx0XHQvLyBPdGhlcndpc2UsIHdlIG9ubHkgd2FudCB0byBtb2RpZnlcblx0XHRcdGlmIChmaXJzdEJpZ2dlclRoYW5TZWNvbmQoY29udmVydGVkQ3V0b2ZmSWQsIHJhbmdlLnVwcGVyKSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmRlbGV0ZVJhbmdlKHR5cGVSZWYsIGxpc3RJZClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2V0TG93ZXJSYW5nZUZvckxpc3QodHlwZVJlZiwgbGlzdElkLCByYXdDdXRvZmZJZClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNlcmlhbGl6ZShvcmlnaW5hbEVudGl0eTogU29tZUVudGl0eSk6IFVpbnQ4QXJyYXkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gY2JvcmcuZW5jb2RlKG9yaWdpbmFsRW50aXR5LCB7IHR5cGVFbmNvZGVyczogY3VzdG9tVHlwZUVuY29kZXJzIH0pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJbT2ZmbGluZVN0b3JhZ2VdIGZhaWxlZCB0byBlbmNvZGUgZW50aXR5IG9mIHR5cGVcIiwgb3JpZ2luYWxFbnRpdHkuX3R5cGUsIFwid2l0aCBpZFwiLCBvcmlnaW5hbEVudGl0eS5faWQpXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgdGhlIHR5cGUgZnJvbSBDQk9SIHJlcHJlc2VudGF0aW9uIHRvIHRoZSBydW50aW1lIHR5cGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZGVzZXJpYWxpemU8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxvYWRlZDogVWludDhBcnJheSk6IFByb21pc2U8VCB8IG51bGw+IHtcblx0XHRsZXQgZGVzZXJpYWxpemVkXG5cdFx0dHJ5IHtcblx0XHRcdGRlc2VyaWFsaXplZCA9IHRoaXMuZGVjb2RlQ2JvckVudGl0eShsb2FkZWQpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5sb2coZSlcblx0XHRcdGNvbnNvbGUubG9nKGBFcnJvciB3aXRoIENCT1IgZGVjb2RlLiBUcnlpbmcgdG8gZGVjb2RlIChvZiB0eXBlOiAke3R5cGVvZiBsb2FkZWR9KTogJHtsb2FkZWR9YClcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblx0XHRyZXR1cm4gKGF3YWl0IHRoaXMuZml4dXBUeXBlUmVmcyh0eXBlTW9kZWwsIGRlc2VyaWFsaXplZCkpIGFzIFRcblx0fVxuXG5cdHByaXZhdGUgZGVjb2RlQ2JvckVudGl0eShsb2FkZWQ6IFVpbnQ4QXJyYXkpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG5cdFx0cmV0dXJuIGNib3JnLmRlY29kZShsb2FkZWQsIHsgdGFnczogY3VzdG9tVHlwZURlY29kZXJzIH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGZpeHVwVHlwZVJlZnModHlwZU1vZGVsOiBUeXBlTW9kZWwsIGRlc2VyaWFsaXplZDogYW55KTogUHJvbWlzZTx1bmtub3duPiB7XG5cdFx0Ly8gVHlwZVJlZiBjYW5ub3QgYmUgZGVzZXJpYWxpemVkIGJhY2sgYXV0b21hdGljYWxseS4gV2UgY291bGQgd3JpdGUgYSBjb2RlYyBmb3IgaXQgYnV0IHdlIGRvbid0IGFjdHVhbGx5IG5lZWQgdG8gc3RvcmUgaXQgc28gd2UganVzdCBcInBhdGNoXCIgaXQuXG5cdFx0Ly8gU29tZSBwbGFjZXMgcmVseSBvbiBUeXBlUmVmIGJlaW5nIGEgY2xhc3MgYW5kIG5vdCBhIHBsYWluIG9iamVjdC5cblx0XHQvLyBXZSBhbHNvIGhhdmUgdG8gdXBkYXRlIGFsbCBhZ2dyZWdhdGVzLCByZWN1cnNpdmVseS5cblx0XHRkZXNlcmlhbGl6ZWQuX3R5cGUgPSBuZXcgVHlwZVJlZih0eXBlTW9kZWwuYXBwLCB0eXBlTW9kZWwubmFtZSlcblx0XHRmb3IgKGNvbnN0IFthc3NvY2lhdGlvbk5hbWUsIGFzc29jaWF0aW9uTW9kZWxdIG9mIE9iamVjdC5lbnRyaWVzKHR5cGVNb2RlbC5hc3NvY2lhdGlvbnMpKSB7XG5cdFx0XHRpZiAoYXNzb2NpYXRpb25Nb2RlbC50eXBlID09PSBBc3NvY2lhdGlvblR5cGUuQWdncmVnYXRpb24pIHtcblx0XHRcdFx0Y29uc3QgYWdncmVnYXRlVHlwZVJlZiA9IG5ldyBUeXBlUmVmKGFzc29jaWF0aW9uTW9kZWwuZGVwZW5kZW5jeSA/PyB0eXBlTW9kZWwuYXBwLCBhc3NvY2lhdGlvbk1vZGVsLnJlZlR5cGUpXG5cdFx0XHRcdGNvbnN0IGFnZ3JlZ2F0ZVR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKGFnZ3JlZ2F0ZVR5cGVSZWYpXG5cdFx0XHRcdHN3aXRjaCAoYXNzb2NpYXRpb25Nb2RlbC5jYXJkaW5hbGl0eSkge1xuXHRcdFx0XHRcdGNhc2UgQ2FyZGluYWxpdHkuT25lOlxuXHRcdFx0XHRcdGNhc2UgQ2FyZGluYWxpdHkuWmVyb09yT25lOiB7XG5cdFx0XHRcdFx0XHRjb25zdCBhZ2dyZWdhdGUgPSBkZXNlcmlhbGl6ZWRbYXNzb2NpYXRpb25OYW1lXVxuXHRcdFx0XHRcdFx0aWYgKGFnZ3JlZ2F0ZSkge1xuXHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmZpeHVwVHlwZVJlZnMoYWdncmVnYXRlVHlwZU1vZGVsLCBhZ2dyZWdhdGUpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYXNlIENhcmRpbmFsaXR5LkFueToge1xuXHRcdFx0XHRcdFx0Y29uc3QgYWdncmVnYXRlTGlzdCA9IGRlc2VyaWFsaXplZFthc3NvY2lhdGlvbk5hbWVdXG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IGFnZ3JlZ2F0ZSBvZiBhZ2dyZWdhdGVMaXN0KSB7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuZml4dXBUeXBlUmVmcyhhZ2dyZWdhdGVUeXBlTW9kZWwsIGFnZ3JlZ2F0ZSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBkZXNlcmlhbGl6ZWRcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZGVzZXJpYWxpemVMaXN0PFQgZXh0ZW5kcyBTb21lRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsb2FkZWQ6IEFycmF5PFVpbnQ4QXJyYXk+KTogUHJvbWlzZTxBcnJheTxUPj4ge1xuXHRcdC8vIG1hbnVhbGx5IHJlaW1wbGVtZW50aW5nIHByb21pc2VNYXAgdG8gbWFrZSBzdXJlIHdlIGRvbid0IGhpdCB0aGUgc2NoZWR1bGVyIHNpbmNlIHRoZXJlJ3Mgbm90aGluZyBhY3R1YWxseSBhc3luYyBoYXBwZW5pbmdcblx0XHRjb25zdCByZXN1bHQ6IEFycmF5PFQ+ID0gW11cblx0XHRmb3IgKGNvbnN0IGVudGl0eSBvZiBsb2FkZWQpIHtcblx0XHRcdGNvbnN0IGRlc2VyaWFsaXplZCA9IGF3YWl0IHRoaXMuZGVzZXJpYWxpemUodHlwZVJlZiwgZW50aXR5KVxuXHRcdFx0aWYgKGRlc2VyaWFsaXplZCAhPSBudWxsKSB7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKGRlc2VyaWFsaXplZClcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdFxuXHR9XG5cblx0LyoqXG5cdCAqIGNvbnZlbmllbmNlIG1ldGhvZCB0byBydW4gYSBwb3RlbnRpYWxseSB0b28gbGFyZ2UgcXVlcnkgb3ZlciBzZXZlcmFsIGNodW5rcy5cblx0ICogY2h1bmtTaXplIG11c3QgYmUgY2hvc2VuIHN1Y2ggdGhhdCB0aGUgdG90YWwgbnVtYmVyIG9mIFNRTCB2YXJpYWJsZXMgaW4gdGhlIGZpbmFsIHF1ZXJ5IGRvZXMgbm90IGV4Y2VlZCBNQVhfU0FGRV9TUUxfVkFSU1xuXHQgKiAqL1xuXHRwcml2YXRlIGFzeW5jIHJ1bkNodW5rZWQoY2h1bmtTaXplOiBudW1iZXIsIG9yaWdpbmFsTGlzdDogU3FsVmFsdWVbXSwgZm9ybWF0dGVyOiAoY2h1bms6IFNxbFZhbHVlW10pID0+IEZvcm1hdHRlZFF1ZXJ5KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCBjaHVuayBvZiBzcGxpdEluQ2h1bmtzKGNodW5rU2l6ZSwgb3JpZ2luYWxMaXN0KSkge1xuXHRcdFx0Y29uc3QgZm9ybWF0dGVkUXVlcnkgPSBmb3JtYXR0ZXIoY2h1bmspXG5cdFx0XHRhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5ydW4oZm9ybWF0dGVkUXVlcnkucXVlcnksIGZvcm1hdHRlZFF1ZXJ5LnBhcmFtcylcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogY29udmVuaWVuY2UgbWV0aG9kIHRvIGV4ZWN1dGUgYSBwb3RlbnRpYWxseSB0b28gbGFyZ2UgcXVlcnkgb3ZlciBzZXZlcmFsIGNodW5rcy5cblx0ICogY2h1bmtTaXplIG11c3QgYmUgY2hvc2VuIHN1Y2ggdGhhdCB0aGUgdG90YWwgbnVtYmVyIG9mIFNRTCB2YXJpYWJsZXMgaW4gdGhlIGZpbmFsIHF1ZXJ5IGRvZXMgbm90IGV4Y2VlZCBNQVhfU0FGRV9TUUxfVkFSU1xuXHQgKiAqL1xuXHRwcml2YXRlIGFzeW5jIGFsbENodW5rZWQoXG5cdFx0Y2h1bmtTaXplOiBudW1iZXIsXG5cdFx0b3JpZ2luYWxMaXN0OiBTcWxWYWx1ZVtdLFxuXHRcdGZvcm1hdHRlcjogKGNodW5rOiBTcWxWYWx1ZVtdKSA9PiBGb3JtYXR0ZWRRdWVyeSxcblx0KTogUHJvbWlzZTxBcnJheTxSZWNvcmQ8c3RyaW5nLCBUYWdnZWRTcWxWYWx1ZT4+PiB7XG5cdFx0Y29uc3QgcmVzdWx0OiBBcnJheTxSZWNvcmQ8c3RyaW5nLCBUYWdnZWRTcWxWYWx1ZT4+ID0gW11cblx0XHRmb3IgKGNvbnN0IGNodW5rIG9mIHNwbGl0SW5DaHVua3MoY2h1bmtTaXplLCBvcmlnaW5hbExpc3QpKSB7XG5cdFx0XHRjb25zdCBmb3JtYXR0ZWRRdWVyeSA9IGZvcm1hdHRlcihjaHVuaylcblx0XHRcdHJlc3VsdC5wdXNoKC4uLihhd2FpdCB0aGlzLnNxbENpcGhlckZhY2FkZS5hbGwoZm9ybWF0dGVkUXVlcnkucXVlcnksIGZvcm1hdHRlZFF1ZXJ5LnBhcmFtcykpKVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0XG5cdH1cbn1cblxuLypcbiAqIHVzZWQgdG8gYXV0b21hdGljYWxseSBjcmVhdGUgdGhlIHJpZ2h0IGFtb3VudCBvZiBTUUwgdmFyaWFibGVzIGZvciBzZWxlY3RpbmcgaWRzIGZyb20gYSBkeW5hbWljIGxpc3QuXG4gKiBtdXN0IGJlIHVzZWQgd2l0aGluIHNxbGA8cXVlcnk+YCB0ZW1wbGF0ZSBzdHJpbmcgdG8gaW5saW5lIHRoZSBsb2dpYyBpbnRvIHRoZSBxdWVyeS5cbiAqXG4gKiBJdCBpcyB2ZXJ5IGltcG9ydGFudCB0aGF0IHBhcmFtcyBpcyBrZXB0IHRvIGEgc2l6ZSBzdWNoIHRoYXQgdGhlIHRvdGFsIGFtb3VudCBvZiBTUUwgdmFyaWFibGVzIGlzXG4gKiBsZXNzIHRoYW4gTUFYX1NBRkVfU1FMX1ZBUlMuXG4gKi9cbmZ1bmN0aW9uIHBhcmFtTGlzdChwYXJhbXM6IFNxbFZhbHVlW10pOiBTcWxGcmFnbWVudCB7XG5cdGNvbnN0IHFzID0gcGFyYW1zLm1hcCgoKSA9PiBcIj9cIikuam9pbihcIixcIilcblx0cmV0dXJuIG5ldyBTcWxGcmFnbWVudChgKCR7cXN9KWAsIHBhcmFtcylcbn1cblxuLyoqXG4gKiBjb21wYXJpc29uIHRvIHNlbGVjdCBpZHMgdGhhdCBhcmUgYmlnZ2VyIG9yIHNtYWxsZXIgdGhhbiBhIHBhcmFtZXRlciBpZFxuICogbXVzdCBiZSB1c2VkIHdpdGhpbiBzcWxgPHF1ZXJ5PmAgdGVtcGxhdGUgc3RyaW5nIHRvIGlubGluZSB0aGUgbG9naWMgaW50byB0aGUgcXVlcnkuXG4gKlxuICogd2lsbCBhbHdheXMgaW5zZXJ0IDMgY29uc3RhbnRzIGFuZCAzIFNRTCB2YXJpYWJsZXMgaW50byB0aGUgcXVlcnkuXG4gKi9cbmZ1bmN0aW9uIGZpcnN0SWRCaWdnZXIoLi4uYXJnczogW3N0cmluZywgXCJlbGVtZW50SWRcIl0gfCBbXCJlbGVtZW50SWRcIiwgc3RyaW5nXSk6IFNxbEZyYWdtZW50IHtcblx0bGV0IFtsLCByXTogW3N0cmluZywgc3RyaW5nXSA9IGFyZ3Ncblx0bGV0IHZcblx0aWYgKGwgPT09IFwiZWxlbWVudElkXCIpIHtcblx0XHR2ID0gclxuXHRcdHIgPSBcIj9cIlxuXHR9IGVsc2Uge1xuXHRcdHYgPSBsXG5cdFx0bCA9IFwiP1wiXG5cdH1cblx0cmV0dXJuIG5ldyBTcWxGcmFnbWVudChgKENBU0UgV0hFTiBsZW5ndGgoJHtsfSkgPiBsZW5ndGgoJHtyfSkgVEhFTiAxIFdIRU4gbGVuZ3RoKCR7bH0pIDwgbGVuZ3RoKCR7cn0pIFRIRU4gMCBFTFNFICR7bH0gPiAke3J9IEVORClgLCBbdiwgdiwgdl0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0N1c3RvbUlkVHlwZSh0eXBlTW9kZWw6IFR5cGVNb2RlbCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gdHlwZU1vZGVsLnZhbHVlcy5faWQudHlwZSA9PT0gVmFsdWVUeXBlLkN1c3RvbUlkXG59XG5cbi8qKlxuICogV2Ugc3RvcmUgY3VzdG9tSWRzIGFzIGJhc2U2NGV4dCBpbiB0aGUgZGIgdG8gbWFrZSB0aGVtIHNvcnRhYmxlLCBidXQgd2UgZ2V0IHRoZW0gYXMgYmFzZTY0dXJsIGZyb20gdGhlIHNlcnZlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZUJhc2U2NEV4dCh0eXBlTW9kZWw6IFR5cGVNb2RlbCwgZWxlbWVudElkOiBJZCk6IElkIHtcblx0aWYgKGlzQ3VzdG9tSWRUeXBlKHR5cGVNb2RlbCkpIHtcblx0XHRyZXR1cm4gYmFzZTY0VG9CYXNlNjRFeHQoYmFzZTY0VXJsVG9CYXNlNjQoZWxlbWVudElkKSlcblx0fVxuXHRyZXR1cm4gZWxlbWVudElkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXN0b21JZFRvQmFzZTY0VXJsKHR5cGVNb2RlbDogVHlwZU1vZGVsLCBlbGVtZW50SWQ6IElkKTogSWQge1xuXHRpZiAoaXNDdXN0b21JZFR5cGUodHlwZU1vZGVsKSkge1xuXHRcdHJldHVybiBiYXNlNjRUb0Jhc2U2NFVybChiYXNlNjRFeHRUb0Jhc2U2NChlbGVtZW50SWQpKVxuXHR9XG5cdHJldHVybiBlbGVtZW50SWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPZmZsaW5lU3RvcmFnZUNsZWFuZXIge1xuXHRjbGVhbk9mZmxpbmVEYihvZmZsaW5lU3RvcmFnZTogT2ZmbGluZVN0b3JhZ2UsIHRpbWVSYW5nZURheXM6IG51bWJlciB8IG51bGwsIHVzZXJJZDogSWQsIG5vdzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPlxufVxuIiwiaW1wb3J0IHtcblx0Q2FjaGVNb2RlLFxuXHRFbnRpdHlSZXN0Q2xpZW50LFxuXHRFbnRpdHlSZXN0Q2xpZW50RXJhc2VPcHRpb25zLFxuXHRFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMsXG5cdEVudGl0eVJlc3RDbGllbnRTZXR1cE9wdGlvbnMsXG5cdEVudGl0eVJlc3RJbnRlcmZhY2UsXG5cdGdldENhY2hlTW9kZUJlaGF2aW9yLFxuXHRPd25lckVuY1Nlc3Npb25LZXlQcm92aWRlcixcbn0gZnJvbSBcIi4vRW50aXR5UmVzdENsaWVudFwiXG5pbXBvcnQgeyByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB7IE9wZXJhdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGRpZmZlcmVuY2UsIGdldEZpcnN0T3JUaHJvdywgZ2V0VHlwZUlkLCBncm91cEJ5LCBpc0VtcHR5LCBpc1NhbWVUeXBlUmVmLCBsYXN0VGhyb3csIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdEF1ZGl0TG9nRW50cnlUeXBlUmVmLFxuXHRCdWNrZXRQZXJtaXNzaW9uVHlwZVJlZixcblx0RW50aXR5RXZlbnRCYXRjaFR5cGVSZWYsXG5cdEVudGl0eVVwZGF0ZSxcblx0R3JvdXBLZXlUeXBlUmVmLFxuXHRLZXlSb3RhdGlvblR5cGVSZWYsXG5cdFBlcm1pc3Npb25UeXBlUmVmLFxuXHRSZWNvdmVyQ29kZVR5cGVSZWYsXG5cdFJlamVjdGVkU2VuZGVyVHlwZVJlZixcblx0U2Vjb25kRmFjdG9yVHlwZVJlZixcblx0U2Vzc2lvblR5cGVSZWYsXG5cdFVzZXIsXG5cdFVzZXJHcm91cEtleURpc3RyaWJ1dGlvblR5cGVSZWYsXG5cdFVzZXJHcm91cFJvb3RUeXBlUmVmLFxuXHRVc2VyVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBWYWx1ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL0VudGl0eUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBOb3RBdXRob3JpemVkRXJyb3IsIE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQge1xuXHRDYWxlbmRhckV2ZW50VWlkSW5kZXhUeXBlUmVmLFxuXHRNYWlsLFxuXHRNYWlsRGV0YWlsc0Jsb2JUeXBlUmVmLFxuXHRNYWlsRm9sZGVyVHlwZVJlZixcblx0TWFpbFNldEVudHJ5VHlwZVJlZixcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBDVVNUT01fTUFYX0lELCBDVVNUT01fTUlOX0lELCBmaXJzdEJpZ2dlclRoYW5TZWNvbmQsIEdFTkVSQVRFRF9NQVhfSUQsIEdFTkVSQVRFRF9NSU5fSUQsIGdldEVsZW1lbnRJZCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHR5cGUgeyBMaXN0RWxlbWVudEVudGl0eSwgU29tZUVudGl0eSwgVHlwZU1vZGVsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlUeXBlc1wiXG5pbXBvcnQgeyBRdWV1ZWRCYXRjaCB9IGZyb20gXCIuLi9FdmVudFF1ZXVlLmpzXCJcbmltcG9ydCB7IEVOVElUWV9FVkVOVF9CQVRDSF9FWFBJUkVfTVMgfSBmcm9tIFwiLi4vRXZlbnRCdXNDbGllbnRcIlxuaW1wb3J0IHsgQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwIH0gZnJvbSBcIi4vQ3VzdG9tQ2FjaGVIYW5kbGVyLmpzXCJcbmltcG9ydCB7IGNvbnRhaW5zRXZlbnRPZlR5cGUsIEVudGl0eVVwZGF0ZURhdGEsIGdldEV2ZW50T2ZUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBpc0N1c3RvbUlkVHlwZSB9IGZyb20gXCIuLi9vZmZsaW5lL09mZmxpbmVTdG9yYWdlLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuLyoqXG4gKlxuICogVGhlIG1pbmltdW0gc2l6ZSBvZiBhIHJhbmdlIHJlcXVlc3Qgd2hlbiBleHRlbmRpbmcgYW4gZXhpc3RpbmcgcmFuZ2VcbiAqIEJlY2F1c2Ugd2UgZXh0ZW5kIGJ5IG1ha2luZyAocG90ZW50aWFsbHkpIG1hbnkgcmFuZ2UgcmVxdWVzdHMgdW50aWwgd2UgcmVhY2ggdGhlIHN0YXJ0SWRcbiAqIFdlIHdhbnQgdG8gYXZvaWQgdGhhdCB0aGUgcmVxdWVzdHMgYXJlIHRvbyBzbWFsbFxuICovXG5leHBvcnQgY29uc3QgRVhURU5EX1JBTkdFX01JTl9DSFVOS19TSVpFID0gNDBcbmNvbnN0IElHTk9SRURfVFlQRVMgPSBbXG5cdEVudGl0eUV2ZW50QmF0Y2hUeXBlUmVmLFxuXHRQZXJtaXNzaW9uVHlwZVJlZixcblx0QnVja2V0UGVybWlzc2lvblR5cGVSZWYsXG5cdFNlc3Npb25UeXBlUmVmLFxuXHRTZWNvbmRGYWN0b3JUeXBlUmVmLFxuXHRSZWNvdmVyQ29kZVR5cGVSZWYsXG5cdFJlamVjdGVkU2VuZGVyVHlwZVJlZixcblx0Ly8gd2hlbiBkb2luZyBhdXRvbWF0aWMgY2FsZW5kYXIgdXBkYXRlcywgd2Ugd2lsbCBtaXNzIHVpZCBpbmRleCBlbnRpdHkgdXBkYXRlcyBpZiB3ZSdyZSB1c2luZyB0aGUgY2FjaGUuXG5cdC8vIHRoaXMgaXMgbWFpbmx5IGNhdXNlZCBieSBzb21lIGNhbGVuZGFyaW5nIGFwcHMgc2VuZGluZyB0aGUgc2FtZSB1cGRhdGUgbXVsdGlwbGUgdGltZXMgaW4gdGhlIHNhbWUgbWFpbC5cblx0Ly8gdGhlIGVhcmxpZXN0IHBsYWNlIHdoZXJlIHdlIGNvdWxkIGRlZHVwbGljYXRlIHdvdWxkIGJlIGluIGVudGl0eUV2ZW50c1JlY2VpdmVkIG9uIHRoZSBjYWxlbmRhck1vZGVsLlxuXHRDYWxlbmRhckV2ZW50VWlkSW5kZXhUeXBlUmVmLFxuXHRLZXlSb3RhdGlvblR5cGVSZWYsXG5cdFVzZXJHcm91cFJvb3RUeXBlUmVmLFxuXHRVc2VyR3JvdXBLZXlEaXN0cmlidXRpb25UeXBlUmVmLFxuXHRBdWRpdExvZ0VudHJ5VHlwZVJlZiwgLy8gU2hvdWxkIG5vdCBiZSBwYXJ0IG9mIGNhY2hlZCBkYXRhIGJlY2F1c2UgdGhlcmUgYXJlIGVycm9ycyBpbnNpZGUgZW50aXR5IGV2ZW50IHByb2Nlc3NpbmcgYWZ0ZXIgcm90YXRpbmcgdGhlIGFkbWluIGdyb3VwIGtleVxuXSBhcyBjb25zdFxuXG4vKipcbiAqIExpc3Qgb2YgdHlwZXMgY29udGFpbmluZyBhIGN1c3RvbUlkIHRoYXQgd2Ugd2FudCB0byBleHBsaWNpdGx5IGVuYWJsZSBjYWNoaW5nIGZvci5cbiAqIEN1c3RvbUlkIHR5cGVzIGFyZSBub3QgY2FjaGVkIGJ5IGRlZmF1bHQgYmVjYXVzZSB0aGVpciBpZCBpcyB1c2luZyBiYXNlNjRVcmxFbmNvZGluZyB3aGlsZSBHZW5lcmF0ZWRVSWQgdHlwZXMgYXJlIHVzaW5nIGJhc2U2NEV4dCBlbmNvZGluZy5cbiAqIGJhc2U2NFVybCBlbmNvZGluZyByZXN1bHRzIGluIGEgZGlmZmVyZW50IHNvcnQgb3JkZXIgb2YgZWxlbWVudHMgdGhhdCB3ZSBoYXZlIG9uIHRoZSBzZXJ2ZXIsIHRoaXMgaXMgcHJvYmxlbWF0aWMgZm9yIGNhY2hpbmcgTEVUIGFuZCB0aGVpciByYW5nZXMuXG4gKiBXaGVuIGVuYWJsaW5nIGNhY2hpbmcgZm9yIGN1c3RvbUlkIHR5cGVzIHdlIGNvbnZlcnQgdGhlIGlkIHRoYXQgd2Ugc3RvcmUgaW4gY2FjaGUgZnJvbSBiYXNlNjRVcmwgdG8gYmFzZTY0RXh0IHNvIHdlIGhhdmUgdGhlIHNhbWUgc29ydCBvcmRlci4gKHNlZSBmdW5jdGlvblxuICogT2ZmbGluZVN0b3JhZ2UuZW5zdXJlQmFzZTY0RXh0KS4gSW4gdGhlb3J5LCB3ZSBjYW4gdHJ5IHRvIGVuYWJsZSBjYWNoaW5nIGZvciBhbGwgdHlwZXMgYnV0IGFzIG9mIG5vdyB3ZSBlbmFibGUgaXQgZm9yIGEgbGltaXRlZCBhbW91bnQgb2YgdHlwZXMgYmVjYXVzZSB0aGVyZVxuICogYXJlIG90aGVyIHdheXMgdG8gY2FjaGUgY3VzdG9tSWQgdHlwZXMgKHNlZSBpbXBsZW1lbnRhdGlvbiBvZiBDdXN0b21DYWNoZUhhbmRsZXIpXG4gKi9cbmNvbnN0IENBQ0hFQUJMRV9DVVNUT01JRF9UWVBFUyA9IFtNYWlsU2V0RW50cnlUeXBlUmVmLCBHcm91cEtleVR5cGVSZWZdIGFzIGNvbnN0XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW50aXR5UmVzdENhY2hlIGV4dGVuZHMgRW50aXR5UmVzdEludGVyZmFjZSB7XG5cdC8qKlxuXHQgKiBDbGVhciBvdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBjYWNoZS5cblx0ICovXG5cdHB1cmdlU3RvcmFnZSgpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgYmF0Y2ggaWQgb2YgdGhlIG1vc3QgcmVjZW50bHkgcHJvY2Vzc2VkIGJhdGNoIGZvciB0aGUgZ2l2ZW4gZ3JvdXAuXG5cdCAqL1xuXHRnZXRMYXN0RW50aXR5RXZlbnRCYXRjaEZvckdyb3VwKGdyb3VwSWQ6IElkKTogUHJvbWlzZTxJZCB8IG51bGw+XG5cblx0LyoqXG5cdCAqIFNhdmVkIHRoYSBiYXRjaCBpZCBvZiB0aGUgbW9zdCByZWNlbnRseSBwcm9jZXNzZWQgYmF0Y2ggbWFudWFsbHkuXG5cdCAqXG5cdCAqIElzIG5lZWRlZCB3aGVuIHRoZSBjYWNoZSBpcyBuZXcgYnV0IHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIG5leHQgdGltZSB3ZSB3aWxsIGRvd25sb2FkIGZyb20gdGhpcyBtb21lbnQsIGV2ZW4gaWYgd2UgZG9uJ3QgcmVjZWl2ZSBhbnkgZXZlbnRzLlxuXHQgKi9cblx0c2V0TGFzdEVudGl0eUV2ZW50QmF0Y2hGb3JHcm91cChncm91cElkOiBJZCwgYmF0Y2hJZDogSWQpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIFBlcnNpc3QgdGhlIGxhc3QgdGltZSBjbGllbnQgZG93bmxvYWRlZCBldmVudCBiYXRjaGVzLiBUaGlzIGlzIG5vdCB0aGUgbGFzdCAqcHJvY2Vzc2VkKiBpdGVtLCBtZXJlbHkgd2hlbiB0aGluZ3Mgd2VyZSAqZG93bmxvYWRlZCouIFdlIHVzZSBpdCB0b1xuXHQgKiBkZXRlY3Qgb3V0LW9mLXN5bmMuXG5cdCAqL1xuXHRyZWNvcmRTeW5jVGltZSgpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIEZldGNoIHRoZSB0aW1lIHNpbmNlIGxhc3QgdGltZSB3ZSBkb3dubG9hZGVkIGV2ZW50IGJhdGNoZXMuXG5cdCAqL1xuXHR0aW1lU2luY2VMYXN0U3luY01zKCk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD5cblxuXHQvKipcblx0ICogRGV0ZWN0IGlmIG91dCBvZiBzeW5jIGJhc2VkIG9uIHN0b3JlZCBcImxhc3RVcGRhdGVUaW1lXCIgYW5kIHRoZSBjdXJyZW50IHNlcnZlciB0aW1lXG5cdCAqL1xuXHRpc091dE9mU3luYygpOiBQcm9taXNlPGJvb2xlYW4+XG59XG5cbmV4cG9ydCB0eXBlIFJhbmdlID0geyBsb3dlcjogSWQ7IHVwcGVyOiBJZCB9XG5cbmV4cG9ydCB0eXBlIExhc3RVcGRhdGVUaW1lID0geyB0eXBlOiBcInJlY29yZGVkXCI7IHRpbWU6IG51bWJlciB9IHwgeyB0eXBlOiBcIm5ldmVyXCIgfSB8IHsgdHlwZTogXCJ1bmluaXRpYWxpemVkXCIgfVxuXG4vKipcbiAqIFBhcnQgb2YgdGhlIGNhY2hlIHN0b3JhZ2Ugb25seSB3aXRoIHN1YnNldCBvZiBDYWNoZVN0b3JhZ2UgZnVuY3Rpb25hbGl0eVxuICpcbiAqIFNlcGFyYXRlIGZyb20gdGhlIHJlc3Qgb2YgdGhlIGNhY2hlIGFzIGEgbmFycm93IGludGVyZmFjZSB0byBub3QgZXhwb3NlIHRoZSB3aG9sZSBzdG9yYWdlIGZvciBjYXNlcyB3aGVyZSB3ZSB3YW50IHRvIG9ubHkgZ2V0IHRoZSBjYWNoZWQgcGFydCBvZiB0aGUgbGlzdCB0b1xuICogZGlzcGxheSBpdCBldmVuIGlmIHdlIGNhbid0IGxvYWQgdGhlIGZ1bGwgcGFnZSBmcm9tIHRoZSBzZXJ2ZXIgb3IgbmVlZCBzb21lIG1ldGFkYXRhLlxuICpcbiAqIGFsc28gZXhwb3NlcyBmdW5jdGlvbnMgdG8gcmVwYWlyIGFuIG91dGRhdGVkIGNhY2hlIGluIGNhc2Ugd2UgY2FuJ3QgYWNjZXNzIHRoZSBzZXJ2ZXIgd2l0aG91dCBnZXR0aW5nIGEgbmV3IHZlcnNpb24gb2YgYSBjYWNoZWQgZW50aXR5XG4gKiAobWFpbmx5IHBhc3N3b3JkIGNoYW5nZXMpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhwb3NlZENhY2hlU3RvcmFnZSB7XG5cdGdldDxUIGV4dGVuZHMgU29tZUVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGlkOiBJZCk6IFByb21pc2U8VCB8IG51bGw+XG5cblx0LyoqXG5cdCAqIExvYWQgcmFuZ2Ugb2YgZW50aXRpZXMuIERvZXMgbm90IGluY2x1ZGUge0BwYXJhbSBzdGFydH0uXG5cdCAqIElmIHtAcGFyYW0gcmV2ZXJzZX0gaXMgZmFsc2UgdGhlbiByZXR1cm5zIGVudGl0aWVzIG5ld2VyIHRoYW4ge0BwYXJhbSBzdGFydH0gaW4gYXNjZW5kaW5nIG9yZGVyIHNvcnRlZCBieVxuXHQgKiBlbGVtZW50SWQuXG5cdCAqIElmIHtAcGFyYW0gcmV2ZXJzZX0gaXMgdHJ1ZSB0aGVuIHJldHVybnMgZW50aXRpZXMgb2xkZXIgdGhhbiB7QHBhcmFtIHN0YXJ0fSBpbiBkZXNjZW5kaW5nIG9yZGVyIHNvcnRlZCBieVxuXHQgKiBlbGVtZW50SWQuXG5cdCAqL1xuXHRwcm92aWRlRnJvbVJhbmdlPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCwgc3RhcnQ6IElkLCBjb3VudDogbnVtYmVyLCByZXZlcnNlOiBib29sZWFuKTogUHJvbWlzZTxUW10+XG5cblx0LyoqXG5cdCAqIExvYWQgYSBzZXQgb2YgbGlzdCBlbGVtZW50IGVudGl0aWVzIGJ5IGlkLiBNaXNzaW5nIGVsZW1lbnRzIGFyZSBub3QgcmV0dXJuZWQsIG5vIGVycm9yIGlzIHRocm93bi5cblx0ICovXG5cdHByb3ZpZGVNdWx0aXBsZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGVsZW1lbnRJZHM6IElkW10pOiBQcm9taXNlPEFycmF5PFQ+PlxuXG5cdC8qKlxuXHQgKiByZXRyaWV2ZSBhbGwgbGlzdCBlbGVtZW50cyB0aGF0IGFyZSBpbiB0aGUgY2FjaGVcblx0ICogQHBhcmFtIHR5cGVSZWZcblx0ICogQHBhcmFtIGxpc3RJZFxuXHQgKi9cblx0Z2V0V2hvbGVMaXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCk6IFByb21pc2U8QXJyYXk8VD4+XG5cblx0Z2V0TGFzdFVwZGF0ZVRpbWUoKTogUHJvbWlzZTxMYXN0VXBkYXRlVGltZT5cblxuXHRjbGVhckV4Y2x1ZGVkRGF0YSgpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIHJlbW92ZSBhbiBFbGVtZW50RW50aXR5IGZyb20gdGhlIGNhY2hlIGJ5IHR5cGVSZWYgYW5kIElkLlxuXHQgKiB0aGUgZXhwb3NlZCBpbnRlcmZhY2UgaXMgaW50ZW50aW9uYWxseSBtb3JlIG5hcnJvdyB0aGFuIHRoZSBpbnRlcm5hbCBjYWNoZVN0b3JhZ2UgYmVjYXVzZVxuXHQgKiB3ZSBtdXN0IG1haW50YWluIHRoZSBpbnRlZ3JpdHkgb2Ygb3VyIGxpc3QgcmFuZ2VzLlxuXHQgKiAqL1xuXHRkZWxldGVJZkV4aXN0czxUIGV4dGVuZHMgU29tZUVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGlkOiBJZCk6IFByb21pc2U8dm9pZD5cblxuXHQvKiogZGVsZXRlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIHR5cGUgdGhhdCBzaGFyZSB7QHBhcmFtIGxpc3RJZH0uIGFsc28gZGVsZXRlcyB0aGUgcmFuZ2Ugb2YgdGhhdCBsaXN0LiAqL1xuXHRkZWxldGVXaG9sZUxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkKTogUHJvbWlzZTx2b2lkPlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhY2hlU3RvcmFnZSBleHRlbmRzIEV4cG9zZWRDYWNoZVN0b3JhZ2Uge1xuXHQvKipcblx0ICogR2V0IGEgZ2l2ZW4gZW50aXR5IGZyb20gdGhlIGNhY2hlLCBleHBlY3RzIHRoYXQgeW91IGhhdmUgYWxyZWFkeSBjaGVja2VkIGZvciBleGlzdGVuY2Vcblx0ICovXG5cdGdldDxUIGV4dGVuZHMgU29tZUVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCB8IG51bGwsIGlkOiBJZCk6IFByb21pc2U8VCB8IG51bGw+XG5cblx0LyoqXG5cdCAqIGdldCBhIG1hcCB3aXRoIGNhY2hlIGhhbmRsZXJzIGZvciB0aGUgY3VzdG9tSWQgdHlwZXMgdGhpcyBzdG9yYWdlIGltcGxlbWVudGF0aW9uIHN1cHBvcnRzXG5cdCAqIGN1c3RvbUlkIHR5cGVzIHRoYXQgZG9uJ3QgaGF2ZSBhIGN1c3RvbSBoYW5kbGVyIGRvbid0IGdldCBzZXJ2ZWQgZnJvbSB0aGUgY2FjaGVcblx0ICovXG5cdGdldEN1c3RvbUNhY2hlSGFuZGxlck1hcChlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50KTogQ3VzdG9tQ2FjaGVIYW5kbGVyTWFwXG5cblx0aXNFbGVtZW50SWRJbkNhY2hlUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBpZDogSWQpOiBQcm9taXNlPGJvb2xlYW4+XG5cblx0cHV0KG9yaWdpbmFsRW50aXR5OiBTb21lRW50aXR5KTogUHJvbWlzZTx2b2lkPlxuXG5cdGdldFJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQpOiBQcm9taXNlPFJhbmdlIHwgbnVsbD5cblxuXHRzZXRVcHBlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGlkOiBJZCk6IFByb21pc2U8dm9pZD5cblxuXHRzZXRMb3dlclJhbmdlRm9yTGlzdDxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGlkOiBJZCk6IFByb21pc2U8dm9pZD5cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBsaXN0IGNhY2hlIGlmIHRoZXJlIGlzIG5vbmUuIFJlc2V0cyBldmVyeXRoaW5nIGJ1dCBlbGVtZW50cy5cblx0ICogQHBhcmFtIHR5cGVSZWZcblx0ICogQHBhcmFtIGxpc3RJZFxuXHQgKiBAcGFyYW0gbG93ZXJcblx0ICogQHBhcmFtIHVwcGVyXG5cdCAqL1xuXHRzZXROZXdSYW5nZUZvckxpc3Q8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkLCBsb3dlcjogSWQsIHVwcGVyOiBJZCk6IFByb21pc2U8dm9pZD5cblxuXHRnZXRJZHNJblJhbmdlPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4odHlwZVJlZjogVHlwZVJlZjxUPiwgbGlzdElkOiBJZCk6IFByb21pc2U8QXJyYXk8SWQ+PlxuXG5cdC8qKlxuXHQgKiBQZXJzaXN0IHRoZSBsYXN0IHByb2Nlc3NlZCBiYXRjaCBmb3IgYSBnaXZlbiBncm91cCBpZC5cblx0ICovXG5cdHB1dExhc3RCYXRjaElkRm9yR3JvdXAoZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkKTogUHJvbWlzZTx2b2lkPlxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZSB0aGUgbGVhc3QgcHJvY2Vzc2VkIGJhdGNoIGlkIGZvciBhIGdpdmVuIGdyb3VwLlxuXHQgKi9cblx0Z2V0TGFzdEJhdGNoSWRGb3JHcm91cChncm91cElkOiBJZCk6IFByb21pc2U8SWQgfCBudWxsPlxuXG5cdGRlbGV0ZUlmRXhpc3RzPFQgZXh0ZW5kcyBTb21lRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBsaXN0SWQ6IElkIHwgbnVsbCwgaWQ6IElkKTogUHJvbWlzZTx2b2lkPlxuXG5cdHB1cmdlU3RvcmFnZSgpOiBQcm9taXNlPHZvaWQ+XG5cblx0cHV0TGFzdFVwZGF0ZVRpbWUodmFsdWU6IG51bWJlcik6IFByb21pc2U8dm9pZD5cblxuXHRnZXRVc2VySWQoKTogSWRcblxuXHRkZWxldGVBbGxPd25lZEJ5KG93bmVyOiBJZCk6IFByb21pc2U8dm9pZD5cblxuXHQvKipcblx0ICogV2Ugd2FudCB0byBsb2NrIHRoZSBhY2Nlc3MgdG8gdGhlIFwicmFuZ2VzXCIgZGIgd2hlbiB1cGRhdGluZyAvIHJlYWRpbmcgdGhlXG5cdCAqIG9mZmxpbmUgYXZhaWxhYmxlIG1haWwgbGlzdCByYW5nZXMgZm9yIGVhY2ggbWFpbCBsaXN0IChyZWZlcmVuY2VkIHVzaW5nIHRoZSBsaXN0SWQpXG5cdCAqIEBwYXJhbSBsaXN0SWQgdGhlIG1haWwgbGlzdCB0aGF0IHdlIHdhbnQgdG8gbG9ja1xuXHQgKi9cblx0bG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZDogSWQpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIFRoaXMgaXMgdGhlIGNvdW50ZXJwYXJ0IHRvIHRoZSBmdW5jdGlvbiBcImxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQpXCJcblx0ICogQHBhcmFtIGxpc3RJZCB0aGUgbWFpbCBsaXN0IHRoYXQgd2Ugd2FudCB0byB1bmxvY2tcblx0ICovXG5cdHVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZDogSWQpOiBQcm9taXNlPHZvaWQ+XG59XG5cbi8qKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBwcm92aWRlcyBhIGNhY2hpbmcgbWVjaGFuaXNtIHRvIHRoZSByZXN0IGNoYWluLlxuICogSXQgZm9yd2FyZHMgcmVxdWVzdHMgdG8gdGhlIGVudGl0eSByZXN0IGNsaWVudC5cbiAqIFRoZSBjYWNoZSB3b3JrcyBhcyBmb2xsb3dzOlxuICogSWYgYSByZWFkIGZyb20gdGhlIHRhcmdldCBmYWlscywgdGhlIHJlcXVlc3QgZmFpbHMuXG4gKiBJZiBhIHJlYWQgZnJvbSB0aGUgdGFyZ2V0IGlzIHN1Y2Nlc3NmdWwsIHRoZSBjYWNoZSBpcyB3cml0dGVuIGFuZCB0aGUgZWxlbWVudCByZXR1cm5lZC5cbiAqIEZvciBMRVRzIHRoZSBjYWNoZSBzdG9yZXMgb25lIHJhbmdlIHBlciBsaXN0IGlkLiBpZiBhIHJhbmdlIGlzIHJlcXVlc3RlZCBzdGFydGluZyBpbiB0aGUgc3RvcmVkIHJhbmdlIG9yIGF0IHRoZSByYW5nZSBlbmRzIHRoZSBtaXNzaW5nIGVsZW1lbnRzIGFyZSBsb2FkZWQgZnJvbSB0aGUgc2VydmVyLlxuICogT25seSByYW5nZXMgd2l0aCBlbGVtZW50cyB3aXRoIGdlbmVyYXRlZCBpZHMgYXJlIHN0b3JlZCBpbiB0aGUgY2FjaGUuIEN1c3RvbSBpZCBlbGVtZW50cyBhcmUgb25seSBzdG9yZWQgYXMgc2luZ2xlIGVsZW1lbnQgY3VycmVudGx5LiBJZiBuZWVkZWQgdGhpcyBoYXMgdG8gYmUgZXh0ZW5kZWQgZm9yIHJhbmdlcy5cbiAqIFJhbmdlIHJlcXVlc3RzIHN0YXJ0aW5nIG91dHNpZGUgdGhlIHN0b3JlZCByYW5nZSBhcmUgb25seSBhbGxvd2VkIGlmIHRoZSBkaXJlY3Rpb24gaXMgYXdheSBmcm9tIHRoZSBzdG9yZWQgcmFuZ2UuIEluIHRoaXMgY2FzZSB3ZSBsb2FkIGZyb20gdGhlIHJhbmdlIGVuZCB0byBhdm9pZCBnYXBzIGluIHRoZSBzdG9yZWQgcmFuZ2UuXG4gKiBSZXF1ZXN0cyBmb3IgY3JlYXRpbmcgb3IgdXBkYXRpbmcgZWxlbWVudHMgYXJlIGFsd2F5cyBmb3J3YXJkZWQgYW5kIG5vdCBkaXJlY3RseSBzdG9yZWQgaW4gdGhlIGNhY2hlLlxuICogT24gRXZlbnRCdXNDbGllbnQgbm90aWZpY2F0aW9ucyB1cGRhdGVkIGVsZW1lbnRzIGFyZSBzdG9yZWQgaW4gdGhlIGNhY2hlIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjYWNoZS5cbiAqIE9uIEV2ZW50QnVzQ2xpZW50IG5vdGlmaWNhdGlvbnMgbmV3IGVsZW1lbnRzIGFyZSBvbmx5IHN0b3JlZCBpbiB0aGUgY2FjaGUgaWYgdGhleSBhcmUgTEVUcyBhbmQgaW4gdGhlIHN0b3JlZCByYW5nZS5cbiAqIE9uIEV2ZW50QnVzQ2xpZW50IG5vdGlmaWNhdGlvbnMgZGVsZXRlZCBlbGVtZW50cyBhcmUgcmVtb3ZlZCBmcm9tIHRoZSBjYWNoZS5cbiAqXG4gKiBSYW5nZSBoYW5kbGluZzpcbiAqIHwgICAgICAgICAgPHw+ICAgICAgICBjIGQgZSBmIGcgaCBpIGogayAgICAgIDx8PiAgICAgICAgICAgICB8XG4gKiBNSU5fSUQgIGxvd2VyUmFuZ2VJZCAgICAgaWRzIGluIHJhbmdlICAgIHVwcGVyUmFuZ2VJZCAgICBNQVhfSURcbiAqIGxvd2VyUmFuZ2VJZCBtYXkgYmUgYW55dGhpbmcgZnJvbSBNSU5fSUQgdG8gYywgdXBwZXJSYW5nZUlkIG1heSBiZSBhbnl0aGluZyBmcm9tIGsgdG8gTUFYX0lEXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWZhdWx0RW50aXR5UmVzdENhY2hlIGltcGxlbWVudHMgRW50aXR5UmVzdENhY2hlIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBlbnRpdHlSZXN0Q2xpZW50OiBFbnRpdHlSZXN0Q2xpZW50LCBwcml2YXRlIHJlYWRvbmx5IHN0b3JhZ2U6IENhY2hlU3RvcmFnZSkge31cblxuXHRhc3luYyBsb2FkPFQgZXh0ZW5kcyBTb21lRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBpZDogUHJvcGVydHlUeXBlPFQsIFwiX2lkXCI+LCBvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMgPSB7fSk6IFByb21pc2U8VD4ge1xuXHRcdGNvbnN0IHVzZUNhY2hlID0gYXdhaXQgdGhpcy5zaG91bGRVc2VDYWNoZSh0eXBlUmVmLCBvcHRzKVxuXHRcdGlmICghdXNlQ2FjaGUpIHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZCh0eXBlUmVmLCBpZCwgb3B0cylcblx0XHR9XG5cblx0XHRjb25zdCB7IGxpc3RJZCwgZWxlbWVudElkIH0gPSBleHBhbmRJZChpZClcblx0XHRjb25zdCBjYWNoaW5nQmVoYXZpb3IgPSBnZXRDYWNoZU1vZGVCZWhhdmlvcihvcHRzLmNhY2hlTW9kZSlcblx0XHRjb25zdCBjYWNoZWRFbnRpdHkgPSBjYWNoaW5nQmVoYXZpb3IucmVhZHNGcm9tQ2FjaGUgPyBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0KHR5cGVSZWYsIGxpc3RJZCwgZWxlbWVudElkKSA6IG51bGxcblxuXHRcdGlmIChjYWNoZWRFbnRpdHkgPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgZW50aXR5ID0gYXdhaXQgdGhpcy5lbnRpdHlSZXN0Q2xpZW50LmxvYWQodHlwZVJlZiwgaWQsIG9wdHMpXG5cdFx0XHRpZiAoY2FjaGluZ0JlaGF2aW9yLndyaXRlc1RvQ2FjaGUpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnB1dChlbnRpdHkpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZW50aXR5XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNhY2hlZEVudGl0eVxuXHR9XG5cblx0YXN5bmMgbG9hZE11bHRpcGxlPFQgZXh0ZW5kcyBTb21lRW50aXR5Pihcblx0XHR0eXBlUmVmOiBUeXBlUmVmPFQ+LFxuXHRcdGxpc3RJZDogSWQgfCBudWxsLFxuXHRcdGlkczogQXJyYXk8SWQ+LFxuXHRcdG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyPzogT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIsXG5cdFx0b3B0czogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zID0ge30sXG5cdCk6IFByb21pc2U8QXJyYXk8VD4+IHtcblx0XHRjb25zdCB1c2VDYWNoZSA9IGF3YWl0IHRoaXMuc2hvdWxkVXNlQ2FjaGUodHlwZVJlZiwgb3B0cylcblx0XHRpZiAoIXVzZUNhY2hlKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5lbnRpdHlSZXN0Q2xpZW50LmxvYWRNdWx0aXBsZSh0eXBlUmVmLCBsaXN0SWQsIGlkcywgb3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIsIG9wdHMpXG5cdFx0fVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLl9sb2FkTXVsdGlwbGUodHlwZVJlZiwgbGlzdElkLCBpZHMsIG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyLCBvcHRzKVxuXHR9XG5cblx0c2V0dXA8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGxpc3RJZDogSWQgfCBudWxsLCBpbnN0YW5jZTogVCwgZXh0cmFIZWFkZXJzPzogRGljdCwgb3B0aW9ucz86IEVudGl0eVJlc3RDbGllbnRTZXR1cE9wdGlvbnMpOiBQcm9taXNlPElkPiB7XG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5UmVzdENsaWVudC5zZXR1cChsaXN0SWQsIGluc3RhbmNlLCBleHRyYUhlYWRlcnMsIG9wdGlvbnMpXG5cdH1cblxuXHRzZXR1cE11bHRpcGxlPFQgZXh0ZW5kcyBTb21lRW50aXR5PihsaXN0SWQ6IElkIHwgbnVsbCwgaW5zdGFuY2VzOiBBcnJheTxUPik6IFByb21pc2U8QXJyYXk8SWQ+PiB7XG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5UmVzdENsaWVudC5zZXR1cE11bHRpcGxlKGxpc3RJZCwgaW5zdGFuY2VzKVxuXHR9XG5cblx0dXBkYXRlPFQgZXh0ZW5kcyBTb21lRW50aXR5PihpbnN0YW5jZTogVCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmVudGl0eVJlc3RDbGllbnQudXBkYXRlKGluc3RhbmNlKVxuXHR9XG5cblx0ZXJhc2U8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGluc3RhbmNlOiBULCBvcHRpb25zPzogRW50aXR5UmVzdENsaWVudEVyYXNlT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmVudGl0eVJlc3RDbGllbnQuZXJhc2UoaW5zdGFuY2UsIG9wdGlvbnMpXG5cdH1cblxuXHRnZXRMYXN0RW50aXR5RXZlbnRCYXRjaEZvckdyb3VwKGdyb3VwSWQ6IElkKTogUHJvbWlzZTxJZCB8IG51bGw+IHtcblx0XHRyZXR1cm4gdGhpcy5zdG9yYWdlLmdldExhc3RCYXRjaElkRm9yR3JvdXAoZ3JvdXBJZClcblx0fVxuXG5cdHNldExhc3RFbnRpdHlFdmVudEJhdGNoRm9yR3JvdXAoZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuc3RvcmFnZS5wdXRMYXN0QmF0Y2hJZEZvckdyb3VwKGdyb3VwSWQsIGJhdGNoSWQpXG5cdH1cblxuXHRwdXJnZVN0b3JhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc29sZS5sb2coXCJQdXJnaW5nIHRoZSB1c2VyJ3Mgb2ZmbGluZSBkYXRhYmFzZVwiKVxuXHRcdHJldHVybiB0aGlzLnN0b3JhZ2UucHVyZ2VTdG9yYWdlKClcblx0fVxuXG5cdGFzeW5jIGlzT3V0T2ZTeW5jKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHRpbWVTaW5jZUxhc3RTeW5jID0gYXdhaXQgdGhpcy50aW1lU2luY2VMYXN0U3luY01zKClcblx0XHRyZXR1cm4gdGltZVNpbmNlTGFzdFN5bmMgIT0gbnVsbCAmJiB0aW1lU2luY2VMYXN0U3luYyA+IEVOVElUWV9FVkVOVF9CQVRDSF9FWFBJUkVfTVNcblx0fVxuXG5cdGFzeW5jIHJlY29yZFN5bmNUaW1lKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHRpbWVzdGFtcCA9IHRoaXMuZ2V0U2VydmVyVGltZXN0YW1wTXMoKVxuXHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5wdXRMYXN0VXBkYXRlVGltZSh0aW1lc3RhbXApXG5cdH1cblxuXHRhc3luYyB0aW1lU2luY2VMYXN0U3luY01zKCk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuXHRcdGNvbnN0IGxhc3RVcGRhdGUgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0TGFzdFVwZGF0ZVRpbWUoKVxuXHRcdGxldCBsYXN0VXBkYXRlVGltZTogbnVtYmVyXG5cdFx0c3dpdGNoIChsYXN0VXBkYXRlLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWNvcmRlZFwiOlxuXHRcdFx0XHRsYXN0VXBkYXRlVGltZSA9IGxhc3RVcGRhdGUudGltZVxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBcIm5ldmVyXCI6XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRjYXNlIFwidW5pbml0aWFsaXplZFwiOlxuXHRcdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIk9mZmxpbmUgc3RvcmFnZSBpcyBub3QgaW5pdGlhbGl6ZWRcIilcblx0XHR9XG5cdFx0Y29uc3Qgbm93ID0gdGhpcy5nZXRTZXJ2ZXJUaW1lc3RhbXBNcygpXG5cdFx0cmV0dXJuIG5vdyAtIGxhc3RVcGRhdGVUaW1lXG5cdH1cblxuXHRwcml2YXRlIGdldFNlcnZlclRpbWVzdGFtcE1zKCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5UmVzdENsaWVudC5nZXRSZXN0Q2xpZW50KCkuZ2V0U2VydmVyVGltZXN0YW1wTXMoKVxuXHR9XG5cblx0LyoqXG5cdCAqIERlbGV0ZSBhIGNhY2hlZCBlbnRpdHkuIFNvbWV0aW1lcyB0aGlzIGlzIG5lY2Vzc2FyeSB0byBkbyB0byBlbnN1cmUgeW91IGFsd2F5cyBsb2FkIHRoZSBuZXcgdmVyc2lvblxuXHQgKi9cblx0ZGVsZXRlRnJvbUNhY2hlSWZFeGlzdHM8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQgfCBudWxsLCBlbGVtZW50SWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuc3RvcmFnZS5kZWxldGVJZkV4aXN0cyh0eXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRJZClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgX2xvYWRNdWx0aXBsZTxUIGV4dGVuZHMgU29tZUVudGl0eT4oXG5cdFx0dHlwZVJlZjogVHlwZVJlZjxUPixcblx0XHRsaXN0SWQ6IElkIHwgbnVsbCxcblx0XHRpZHM6IEFycmF5PElkPixcblx0XHRvd25lckVuY1Nlc3Npb25LZXlQcm92aWRlcj86IE93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyLFxuXHRcdG9wdHM6IEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyA9IHt9LFxuXHQpOiBQcm9taXNlPEFycmF5PFQ+PiB7XG5cdFx0Y29uc3QgY2FjaGluZ0JlaGF2aW9yID0gZ2V0Q2FjaGVNb2RlQmVoYXZpb3Iob3B0cy5jYWNoZU1vZGUpXG5cdFx0Y29uc3QgZW50aXRpZXNJbkNhY2hlOiBUW10gPSBbXVxuXG5cdFx0bGV0IGlkc1RvTG9hZDogSWRbXVxuXHRcdGlmIChjYWNoaW5nQmVoYXZpb3IucmVhZHNGcm9tQ2FjaGUpIHtcblx0XHRcdGlkc1RvTG9hZCA9IFtdXG5cdFx0XHRmb3IgKGNvbnN0IGlkIG9mIGlkcykge1xuXHRcdFx0XHRjb25zdCBjYWNoZWRFbnRpdHkgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0KHR5cGVSZWYsIGxpc3RJZCwgaWQpXG5cdFx0XHRcdGlmIChjYWNoZWRFbnRpdHkgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGVudGl0aWVzSW5DYWNoZS5wdXNoKGNhY2hlZEVudGl0eSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZHNUb0xvYWQucHVzaChpZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZHNUb0xvYWQgPSBpZHNcblx0XHR9XG5cblx0XHRpZiAoaWRzVG9Mb2FkLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IGVudGl0aWVzRnJvbVNlcnZlciA9IGF3YWl0IHRoaXMuZW50aXR5UmVzdENsaWVudC5sb2FkTXVsdGlwbGUodHlwZVJlZiwgbGlzdElkLCBpZHNUb0xvYWQsIG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyLCBvcHRzKVxuXHRcdFx0aWYgKGNhY2hpbmdCZWhhdmlvci53cml0ZXNUb0NhY2hlKSB7XG5cdFx0XHRcdGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzRnJvbVNlcnZlcikge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5wdXQoZW50aXR5KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZW50aXRpZXNGcm9tU2VydmVyLmNvbmNhdChlbnRpdGllc0luQ2FjaGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBlbnRpdGllc0luQ2FjaGVcblx0XHR9XG5cdH1cblxuXHRhc3luYyBsb2FkUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pihcblx0XHR0eXBlUmVmOiBUeXBlUmVmPFQ+LFxuXHRcdGxpc3RJZDogSWQsXG5cdFx0c3RhcnQ6IElkLFxuXHRcdGNvdW50OiBudW1iZXIsXG5cdFx0cmV2ZXJzZTogYm9vbGVhbixcblx0XHRvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMgPSB7fSxcblx0KTogUHJvbWlzZTxUW10+IHtcblx0XHRjb25zdCBjdXN0b21IYW5kbGVyID0gdGhpcy5zdG9yYWdlLmdldEN1c3RvbUNhY2hlSGFuZGxlck1hcCh0aGlzLmVudGl0eVJlc3RDbGllbnQpLmdldCh0eXBlUmVmKVxuXHRcdGlmIChjdXN0b21IYW5kbGVyICYmIGN1c3RvbUhhbmRsZXIubG9hZFJhbmdlKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgY3VzdG9tSGFuZGxlci5sb2FkUmFuZ2UodGhpcy5zdG9yYWdlLCBsaXN0SWQsIHN0YXJ0LCBjb3VudCwgcmV2ZXJzZSlcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXHRcdGNvbnN0IHVzZUNhY2hlID0gKGF3YWl0IHRoaXMuc2hvdWxkVXNlQ2FjaGUodHlwZVJlZiwgb3B0cykpICYmIGlzQ2FjaGVkUmFuZ2VUeXBlKHR5cGVNb2RlbCwgdHlwZVJlZilcblxuXHRcdGlmICghdXNlQ2FjaGUpIHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZFJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlLCBvcHRzKVxuXHRcdH1cblxuXHRcdGNvbnN0IGJlaGF2aW9yID0gZ2V0Q2FjaGVNb2RlQmVoYXZpb3Iob3B0cy5jYWNoZU1vZGUpXG5cdFx0aWYgKCFiZWhhdmlvci5yZWFkc0Zyb21DYWNoZSkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJjYW5ub3Qgd3JpdGUgdG8gY2FjaGUgd2l0aG91dCByZWFkaW5nIHdpdGggcmFuZ2UgcmVxdWVzdHNcIilcblx0XHR9XG5cblx0XHQvLyBXZSBsb2NrIGFjY2VzcyB0byB0aGUgXCJyYW5nZXNcIiBkYiBoZXJlIGluIG9yZGVyIHRvIHByZXZlbnQgcmFjZSBjb25kaXRpb25zIHdoZW4gYWNjZXNzaW5nIHRoZSByYW5nZXMgZGF0YWJhc2UuXG5cdFx0YXdhaXQgdGhpcy5zdG9yYWdlLmxvY2tSYW5nZXNEYkFjY2VzcyhsaXN0SWQpXG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmFuZ2UgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0UmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZClcblxuXHRcdFx0aWYgKGJlaGF2aW9yLndyaXRlc1RvQ2FjaGUpIHtcblx0XHRcdFx0aWYgKHJhbmdlID09IG51bGwpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBvcHVsYXRlTmV3TGlzdFdpdGhSYW5nZSh0eXBlUmVmLCBsaXN0SWQsIHN0YXJ0LCBjb3VudCwgcmV2ZXJzZSwgb3B0cylcblx0XHRcdFx0fSBlbHNlIGlmIChpc1N0YXJ0SWRXaXRoaW5SYW5nZShyYW5nZSwgc3RhcnQsIHR5cGVNb2RlbCkpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmV4dGVuZEZyb21XaXRoaW5SYW5nZSh0eXBlUmVmLCBsaXN0SWQsIHN0YXJ0LCBjb3VudCwgcmV2ZXJzZSwgb3B0cylcblx0XHRcdFx0fSBlbHNlIGlmIChpc1JhbmdlUmVxdWVzdEF3YXlGcm9tRXhpc3RpbmdSYW5nZShyYW5nZSwgcmV2ZXJzZSwgc3RhcnQsIHR5cGVNb2RlbCkpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmV4dGVuZEF3YXlGcm9tUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UsIG9wdHMpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5leHRlbmRUb3dhcmRzUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UsIG9wdHMpXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuc3RvcmFnZS5wcm92aWRlRnJvbVJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHJhbmdlICYmIGlzU3RhcnRJZFdpdGhpblJhbmdlKHJhbmdlLCBzdGFydCwgdHlwZU1vZGVsKSkge1xuXHRcdFx0XHRcdGNvbnN0IHByb3ZpZGVkID0gYXdhaXQgdGhpcy5zdG9yYWdlLnByb3ZpZGVGcm9tUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UpXG5cdFx0XHRcdFx0Y29uc3QgeyBuZXdTdGFydCwgbmV3Q291bnQgfSA9IGF3YWl0IHRoaXMucmVjYWxjdWxhdGVSYW5nZVJlcXVlc3QodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UpXG5cdFx0XHRcdFx0Y29uc3QgbmV3RWxlbWVudHMgPSBuZXdDb3VudCA+IDAgPyBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZFJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgbmV3U3RhcnQsIG5ld0NvdW50LCByZXZlcnNlKSA6IFtdXG5cdFx0XHRcdFx0cmV0dXJuIHByb3ZpZGVkLmNvbmNhdChuZXdFbGVtZW50cylcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBTaW5jZSBvdXIgc3RhcnRpbmcgSUQgaXMgbm90IGluIG91ciByYW5nZSwgd2UgY2FuJ3QgdXNlIHRoZSBjYWNoZSBiZWNhdXNlIHdlIGRvbid0IGtub3cgZXhhY3RseSB3aGF0XG5cdFx0XHRcdFx0Ly8gZWxlbWVudHMgYXJlIG1pc3NpbmcuXG5cdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHQvLyBUaGlzIGNhbiByZXN1bHQgaW4gdXMgcmUtcmV0cmlldmluZyBlbGVtZW50cyB3ZSBhbHJlYWR5IGhhdmUuIFNpbmNlIHdlIGFueXdheSBtdXN0IGRvIGEgcmVxdWVzdCxcblx0XHRcdFx0XHQvLyB0aGlzIGlzIGZpbmUuXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuZW50aXR5UmVzdENsaWVudC5sb2FkUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBzdGFydCwgY291bnQsIHJldmVyc2UsIG9wdHMpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gV2UgdW5sb2NrIGFjY2VzcyB0byB0aGUgXCJyYW5nZXNcIiBkYiBoZXJlLiBXZSBsb2NrIGl0IGluIG9yZGVyIHRvIHByZXZlbnQgcmFjZSBjb25kaXRpb25zIHdoZW4gYWNjZXNzaW5nIHRoZSBcInJhbmdlc1wiIGRhdGFiYXNlLlxuXHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnVubG9ja1Jhbmdlc0RiQWNjZXNzKGxpc3RJZClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBsaXN0IHJhbmdlLCByZWFkaW5nIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgc2VydmVyIHRoYXQgaXQgY2FuXG5cdCAqIHJhbmdlOiAgICAgICAgIChub25lKVxuXHQgKiByZXF1ZXN0OiAgICAgICAqLS0tLS0tLS0tPlxuXHQgKiByYW5nZSBiZWNvbWVzOiB8LS0tLS0tLS0tfFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBwb3B1bGF0ZU5ld0xpc3RXaXRoUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pihcblx0XHR0eXBlUmVmOiBUeXBlUmVmPFQ+LFxuXHRcdGxpc3RJZDogSWQsXG5cdFx0c3RhcnQ6IElkLFxuXHRcdGNvdW50OiBudW1iZXIsXG5cdFx0cmV2ZXJzZTogYm9vbGVhbixcblx0XHRvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMsXG5cdCkge1xuXHRcdC8vIENyZWF0ZSBhIG5ldyByYW5nZSBhbmQgbG9hZCBldmVyeXRoaW5nXG5cdFx0Y29uc3QgZW50aXRpZXMgPSBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZFJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlLCBvcHRzKVxuXG5cdFx0Ly8gSW5pdGlhbGl6ZSBhIG5ldyByYW5nZSBmb3IgdGhpcyBsaXN0XG5cdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnNldE5ld1JhbmdlRm9yTGlzdCh0eXBlUmVmLCBsaXN0SWQsIHN0YXJ0LCBzdGFydClcblxuXHRcdC8vIFRoZSByYW5nZSBib3VuZHMgd2lsbCBiZSB1cGRhdGVkIGluIGhlcmVcblx0XHRhd2FpdCB0aGlzLnVwZGF0ZVJhbmdlSW5TdG9yYWdlKHR5cGVSZWYsIGxpc3RJZCwgY291bnQsIHJldmVyc2UsIGVudGl0aWVzKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgcGFydCBvZiBhIHJlcXVlc3QgZnJvbSB0aGUgY2FjaGUsIGFuZCB0aGUgcmVtYWluZGVyIGlzIGxvYWRlZCBmcm9tIHRoZSBzZXJ2ZXJcblx0ICogcmFuZ2U6ICAgICAgICAgIHwtLS0tLS0tLS18XG5cdCAqIHJlcXVlc3Q6ICAgICAgICAgICAgICotLS0tLS0tLS0tLS0tLT5cblx0ICogcmFuZ2UgYmVjb21lczogfC0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBleHRlbmRGcm9tV2l0aGluUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pihcblx0XHR0eXBlUmVmOiBUeXBlUmVmPFQ+LFxuXHRcdGxpc3RJZDogSWQsXG5cdFx0c3RhcnQ6IElkLFxuXHRcdGNvdW50OiBudW1iZXIsXG5cdFx0cmV2ZXJzZTogYm9vbGVhbixcblx0XHRvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMsXG5cdCkge1xuXHRcdGNvbnN0IHsgbmV3U3RhcnQsIG5ld0NvdW50IH0gPSBhd2FpdCB0aGlzLnJlY2FsY3VsYXRlUmFuZ2VSZXF1ZXN0KHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlKVxuXHRcdGlmIChuZXdDb3VudCA+IDApIHtcblx0XHRcdC8vIFdlIHdpbGwgYmUgYWJsZSB0byBwcm92aWRlIHNvbWUgZW50aXRpZXMgZnJvbSB0aGUgY2FjaGUsIHNvIHdlIGp1c3Qgd2FudCB0byBsb2FkIHRoZSByZW1haW5pbmcgZW50aXRpZXMgZnJvbSB0aGUgc2VydmVyXG5cdFx0XHRjb25zdCBlbnRpdGllcyA9IGF3YWl0IHRoaXMuZW50aXR5UmVzdENsaWVudC5sb2FkUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBuZXdTdGFydCwgbmV3Q291bnQsIHJldmVyc2UsIG9wdHMpXG5cdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZVJhbmdlSW5TdG9yYWdlKHR5cGVSZWYsIGxpc3RJZCwgbmV3Q291bnQsIHJldmVyc2UsIGVudGl0aWVzKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCB3YXMgb3V0c2lkZSB0aGUgcmFuZ2UsIGFuZCB3ZSBhcmUgbG9hZGluZyBhd2F5IGZyb20gdGhlIHJhbmdlXG5cdCAqIEtlZXBzIGxvYWRpbmcgZWxlbWVudHMgZnJvbSB0aGUgZW5kIG9mIHRoZSByYW5nZSBpbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBzdGFydElkLlxuXHQgKiBSZXR1cm5zIG9uY2UgYWxsIGF2YWlsYWJsZSBlbGVtZW50cyBoYXZlIGJlZW4gbG9hZGVkIG9yIHRoZSByZXF1ZXN0ZWQgbnVtYmVyIGlzIGluIGNhY2hlXG5cdCAqIHJhbmdlOiAgICAgICAgICB8LS0tLS0tLS0tfFxuXHQgKiByZXF1ZXN0OiAgICAgICAgICAgICAgICAgICAgICotLS0tLS0tPlxuXHQgKiByYW5nZSBiZWNvbWVzOiAgfC0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBleHRlbmRBd2F5RnJvbVJhbmdlPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4oXG5cdFx0dHlwZVJlZjogVHlwZVJlZjxUPixcblx0XHRsaXN0SWQ6IElkLFxuXHRcdHN0YXJ0OiBJZCxcblx0XHRjb3VudDogbnVtYmVyLFxuXHRcdHJldmVyc2U6IGJvb2xlYW4sXG5cdFx0b3B0czogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zLFxuXHQpIHtcblx0XHQvLyBTdGFydCBpcyBvdXRzaWRlIHRoZSByYW5nZSwgYW5kIHdlIGFyZSBsb2FkaW5nIGF3YXkgZnJvbSB0aGUgcmFuZ2UsIHNvIHdlIGdyb3cgdW50aWwgd2UgYXJlIGFibGUgdG8gcHJvdmlkZSBlbm91Z2hcblx0XHQvLyBlbnRpdGllcyBzdGFydGluZyBhdCBzdGFydElkXG5cdFx0d2hpbGUgKHRydWUpIHtcblx0XHRcdGNvbnN0IHJhbmdlID0gYXNzZXJ0Tm90TnVsbChhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0UmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZCkpXG5cblx0XHRcdC8vIFdoaWNoIGVuZCBvZiB0aGUgcmFuZ2UgdG8gc3RhcnQgbG9hZGluZyBmcm9tXG5cdFx0XHRjb25zdCBsb2FkU3RhcnRJZCA9IHJldmVyc2UgPyByYW5nZS5sb3dlciA6IHJhbmdlLnVwcGVyXG5cblx0XHRcdGNvbnN0IHJlcXVlc3RDb3VudCA9IE1hdGgubWF4KGNvdW50LCBFWFRFTkRfUkFOR0VfTUlOX0NIVU5LX1NJWkUpXG5cblx0XHRcdC8vIExvYWQgc29tZSBlbnRpdGllc1xuXHRcdFx0Y29uc3QgZW50aXRpZXMgPSBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZFJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgbG9hZFN0YXJ0SWQsIHJlcXVlc3RDb3VudCwgcmV2ZXJzZSwgb3B0cylcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlUmFuZ2VJblN0b3JhZ2UodHlwZVJlZiwgbGlzdElkLCByZXF1ZXN0Q291bnQsIHJldmVyc2UsIGVudGl0aWVzKVxuXG5cdFx0XHQvLyBJZiB3ZSBleGhhdXN0ZWQgdGhlIGVudGl0aWVzIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0aWYgKGVudGl0aWVzLmxlbmd0aCA8IHJlcXVlc3RDb3VudCkge1xuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUcnkgdG8gZ2V0IGVub3VnaCBlbnRpdGllcyBmcm9tIGNhY2hlXG5cdFx0XHRjb25zdCBlbnRpdGllc0Zyb21DYWNoZSA9IGF3YWl0IHRoaXMuc3RvcmFnZS5wcm92aWRlRnJvbVJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlKVxuXG5cdFx0XHQvLyBJZiBjYWNoZSBpcyBub3cgY2FwYWJsZSBvZiBwcm92aWRpbmcgdGhlIHdob2xlIHJlcXVlc3Rcblx0XHRcdGlmIChlbnRpdGllc0Zyb21DYWNoZS5sZW5ndGggPT09IGNvdW50KSB7XG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIExvYWRzIGFsbCBlbGVtZW50cyBmcm9tIHRoZSBzdGFydElkIGluIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJhbmdlXG5cdCAqIE9uY2UgY29tcGxldGUsIHJldHVybnMgYXMgbWFueSBlbGVtZW50cyBhcyBpdCBjYW4gZnJvbSB0aGUgb3JpZ2luYWwgcmVxdWVzdFxuXHQgKiByYW5nZTogICAgICAgICB8LS0tLS0tLS0tfFxuXHQgKiByZXF1ZXN0OiAgICAgICAgICAgICAgICAgICAgIDwtLS0tLS0qXG5cdCAqIHJhbmdlIGJlY29tZXM6IHwtLS0tLS0tLS0tLS0tLS0tLS0tLXxcblx0ICogb3Jcblx0ICogcmFuZ2U6ICAgICAgICAgICAgICB8LS0tLS0tLS0tfFxuXHQgKiByZXF1ZXN0OiAgICAgICA8LS0tLS0tLS0tLS0tLS0tLS0tLSpcblx0ICogcmFuZ2UgYmVjb21lczogfC0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBleHRlbmRUb3dhcmRzUmFuZ2U8VCBleHRlbmRzIExpc3RFbGVtZW50RW50aXR5Pihcblx0XHR0eXBlUmVmOiBUeXBlUmVmPFQ+LFxuXHRcdGxpc3RJZDogSWQsXG5cdFx0c3RhcnQ6IElkLFxuXHRcdGNvdW50OiBudW1iZXIsXG5cdFx0cmV2ZXJzZTogYm9vbGVhbixcblx0XHRvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMsXG5cdCkge1xuXHRcdHdoaWxlICh0cnVlKSB7XG5cdFx0XHRjb25zdCByYW5nZSA9IGFzc2VydE5vdE51bGwoYXdhaXQgdGhpcy5zdG9yYWdlLmdldFJhbmdlRm9yTGlzdCh0eXBlUmVmLCBsaXN0SWQpKVxuXG5cdFx0XHRjb25zdCBsb2FkU3RhcnRJZCA9IHJldmVyc2UgPyByYW5nZS51cHBlciA6IHJhbmdlLmxvd2VyXG5cblx0XHRcdGNvbnN0IHJlcXVlc3RDb3VudCA9IE1hdGgubWF4KGNvdW50LCBFWFRFTkRfUkFOR0VfTUlOX0NIVU5LX1NJWkUpXG5cblx0XHRcdGNvbnN0IGVudGl0aWVzID0gYXdhaXQgdGhpcy5lbnRpdHlSZXN0Q2xpZW50LmxvYWRSYW5nZSh0eXBlUmVmLCBsaXN0SWQsIGxvYWRTdGFydElkLCByZXF1ZXN0Q291bnQsICFyZXZlcnNlLCBvcHRzKVxuXG5cdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZVJhbmdlSW5TdG9yYWdlKHR5cGVSZWYsIGxpc3RJZCwgcmVxdWVzdENvdW50LCAhcmV2ZXJzZSwgZW50aXRpZXMpXG5cblx0XHRcdC8vIFRoZSBjYWxsIHRvIGB1cGRhdGVSYW5nZUluU3RvcmFnZWAgd2lsbCBoYXZlIHNldCB0aGUgcmFuZ2UgYm91bmRzIHRvIEdFTkVSQVRFRF9NSU5fSUQvR0VORVJBVEVEX01BWF9JRFxuXHRcdFx0Ly8gaW4gdGhlIGNhc2UgdGhhdCB3ZSBoYXZlIGV4aGF1c3RlZCBhbGwgZWxlbWVudHMgZnJvbSB0aGUgc2VydmVyLCBzbyBpZiB0aGF0IGhhcHBlbnMsIHdlIHdpbGwgYWxzbyBlbmQgdXAgYnJlYWtpbmcgaGVyZVxuXHRcdFx0aWYgKGF3YWl0IHRoaXMuc3RvcmFnZS5pc0VsZW1lbnRJZEluQ2FjaGVSYW5nZSh0eXBlUmVmLCBsaXN0SWQsIHN0YXJ0KSkge1xuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGF3YWl0IHRoaXMuZXh0ZW5kRnJvbVdpdGhpblJhbmdlKHR5cGVSZWYsIGxpc3RJZCwgc3RhcnQsIGNvdW50LCByZXZlcnNlLCBvcHRzKVxuXHR9XG5cblx0LyoqXG5cdCAqIEdpdmVuIHRoZSBwYXJhbWV0ZXJzIGFuZCByZXN1bHQgb2YgYSByYW5nZSByZXF1ZXN0LFxuXHQgKiBJbnNlcnRzIHRoZSByZXN1bHQgaW50byBzdG9yYWdlLCBhbmQgdXBkYXRlcyB0aGUgcmFuZ2UgYm91bmRzXG5cdCAqIGJhc2VkIG9uIG51bWJlciBvZiBlbnRpdGllcyByZXF1ZXN0ZWQgYW5kIHRoZSBhY3R1YWwgYW1vdW50IHRoYXQgd2VyZSByZWNlaXZlZFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVSYW5nZUluU3RvcmFnZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KFxuXHRcdHR5cGVSZWY6IFR5cGVSZWY8VD4sXG5cdFx0bGlzdElkOiBJZCxcblx0XHRjb3VudFJlcXVlc3RlZDogbnVtYmVyLFxuXHRcdHdhc1JldmVyc2VSZXF1ZXN0OiBib29sZWFuLFxuXHRcdHJlY2VpdmVkRW50aXRpZXM6IFRbXSxcblx0KSB7XG5cdFx0Y29uc3QgaXNDdXN0b21JZCA9IGlzQ3VzdG9tSWRUeXBlKGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpKVxuXHRcdGxldCBlbGVtZW50c1RvQWRkID0gcmVjZWl2ZWRFbnRpdGllc1xuXHRcdGlmICh3YXNSZXZlcnNlUmVxdWVzdCkge1xuXHRcdFx0Ly8gRW5zdXJlIHRoYXQgZWxlbWVudHMgYXJlIGNhY2hlZCBpbiBhc2NlbmRpbmcgKG5vdCByZXZlcnNlKSBvcmRlclxuXHRcdFx0ZWxlbWVudHNUb0FkZCA9IHJlY2VpdmVkRW50aXRpZXMucmV2ZXJzZSgpXG5cdFx0XHRpZiAocmVjZWl2ZWRFbnRpdGllcy5sZW5ndGggPCBjb3VudFJlcXVlc3RlZCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImZpbmlzaGVkIGxvYWRpbmcsIHNldHRpbmcgbWluIGlkXCIpXG5cdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5zZXRMb3dlclJhbmdlRm9yTGlzdCh0eXBlUmVmLCBsaXN0SWQsIGlzQ3VzdG9tSWQgPyBDVVNUT01fTUlOX0lEIDogR0VORVJBVEVEX01JTl9JRClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEFmdGVyIHJldmVyc2luZyB0aGUgbGlzdCB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgbGlzdCBpcyB0aGUgbG93ZXIgcmFuZ2UgbGltaXRcblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnNldExvd2VyUmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZCwgZ2V0RWxlbWVudElkKGdldEZpcnN0T3JUaHJvdyhyZWNlaXZlZEVudGl0aWVzKSkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbGlzdCBpcyB0aGUgdXBwZXIgcmFuZ2UgbGltaXRcblx0XHRcdGlmIChyZWNlaXZlZEVudGl0aWVzLmxlbmd0aCA8IGNvdW50UmVxdWVzdGVkKSB7XG5cdFx0XHRcdC8vIGFsbCBlbGVtZW50cyBoYXZlIGJlZW4gbG9hZGVkLCBzbyB0aGUgdXBwZXIgcmFuZ2UgbXVzdCBiZSBzZXQgdG8gTUFYX0lEXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiZmluaXNoZWQgbG9hZGluZywgc2V0dGluZyBtYXggaWRcIilcblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnNldFVwcGVyUmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZCwgaXNDdXN0b21JZCA/IENVU1RPTV9NQVhfSUQgOiBHRU5FUkFURURfTUFYX0lEKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnNldFVwcGVyUmFuZ2VGb3JMaXN0KHR5cGVSZWYsIGxpc3RJZCwgZ2V0RWxlbWVudElkKGxhc3RUaHJvdyhyZWNlaXZlZEVudGl0aWVzKSkpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0YXdhaXQgUHJvbWlzZS5hbGwoZWxlbWVudHNUb0FkZC5tYXAoKGVsZW1lbnQpID0+IHRoaXMuc3RvcmFnZS5wdXQoZWxlbWVudCkpKVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZXMgdGhlIG5ldyBzdGFydCB2YWx1ZSBmb3IgdGhlIGdldEVsZW1lbnRSYW5nZSByZXF1ZXN0IGFuZCB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJlYWQgaW5cblx0ICogb3JkZXIgdG8gcmVhZCBubyBkdXBsaWNhdGUgdmFsdWVzLlxuXHQgKiBAcmV0dXJuIHJldHVybnMgdGhlIG5ldyBzdGFydCBhbmQgY291bnQgdmFsdWUuIEltcG9ydGFudDogY291bnQgY2FuIGJlIG5lZ2F0aXZlIGlmIGV2ZXJ5dGhpbmcgaXMgY2FjaGVkXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIHJlY2FsY3VsYXRlUmFuZ2VSZXF1ZXN0PFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4oXG5cdFx0dHlwZVJlZjogVHlwZVJlZjxUPixcblx0XHRsaXN0SWQ6IElkLFxuXHRcdHN0YXJ0OiBJZCxcblx0XHRjb3VudDogbnVtYmVyLFxuXHRcdHJldmVyc2U6IGJvb2xlYW4sXG5cdCk6IFByb21pc2U8eyBuZXdTdGFydDogc3RyaW5nOyBuZXdDb3VudDogbnVtYmVyIH0+IHtcblx0XHRsZXQgYWxsUmFuZ2VMaXN0ID0gYXdhaXQgdGhpcy5zdG9yYWdlLmdldElkc0luUmFuZ2UodHlwZVJlZiwgbGlzdElkKVxuXHRcdGxldCBlbGVtZW50c1RvUmVhZCA9IGNvdW50XG5cdFx0bGV0IHN0YXJ0RWxlbWVudElkID0gc3RhcnRcblx0XHRjb25zdCByYW5nZSA9IGF3YWl0IHRoaXMuc3RvcmFnZS5nZXRSYW5nZUZvckxpc3QodHlwZVJlZiwgbGlzdElkKVxuXHRcdGlmIChyYW5nZSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4geyBuZXdTdGFydDogc3RhcnQsIG5ld0NvdW50OiBjb3VudCB9XG5cdFx0fVxuXHRcdGNvbnN0IHsgbG93ZXIsIHVwcGVyIH0gPSByYW5nZVxuXHRcdGxldCBpbmRleE9mU3RhcnQgPSBhbGxSYW5nZUxpc3QuaW5kZXhPZihzdGFydClcblxuXHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKHR5cGVSZWYpXG5cdFx0Y29uc3QgaXNDdXN0b21JZCA9IGlzQ3VzdG9tSWRUeXBlKHR5cGVNb2RlbClcblx0XHRpZiAoXG5cdFx0XHQoIXJldmVyc2UgJiYgKGlzQ3VzdG9tSWQgPyB1cHBlciA9PT0gQ1VTVE9NX01BWF9JRCA6IHVwcGVyID09PSBHRU5FUkFURURfTUFYX0lEKSkgfHxcblx0XHRcdChyZXZlcnNlICYmIChpc0N1c3RvbUlkID8gbG93ZXIgPT09IENVU1RPTV9NSU5fSUQgOiBsb3dlciA9PT0gR0VORVJBVEVEX01JTl9JRCkpXG5cdFx0KSB7XG5cdFx0XHQvLyB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoZSBjb21wbGV0ZSByYW5nZSBpbiB0aGUgZGVzaXJlZCBkaXJlY3Rpb24sIHNvIHdlIGRvIG5vdCBoYXZlIHRvIGxvYWQgZnJvbSBzZXJ2ZXJcblx0XHRcdGVsZW1lbnRzVG9SZWFkID0gMFxuXHRcdH0gZWxzZSBpZiAoYWxsUmFuZ2VMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0Ly8gRWxlbWVudCByYW5nZSBpcyBlbXB0eSwgc28gcmVhZCBhbGwgZWxlbWVudHNcblx0XHRcdGVsZW1lbnRzVG9SZWFkID0gY291bnRcblx0XHR9IGVsc2UgaWYgKGluZGV4T2ZTdGFydCAhPT0gLTEpIHtcblx0XHRcdC8vIFN0YXJ0IGVsZW1lbnQgaXMgbG9jYXRlZCBpbiBhbGxSYW5nZSByZWFkIG9ubHkgZWxlbWVudHMgdGhhdCBhcmUgbm90IGluIGFsbFJhbmdlLlxuXHRcdFx0aWYgKHJldmVyc2UpIHtcblx0XHRcdFx0ZWxlbWVudHNUb1JlYWQgPSBjb3VudCAtIGluZGV4T2ZTdGFydFxuXHRcdFx0XHRzdGFydEVsZW1lbnRJZCA9IGFsbFJhbmdlTGlzdFswXSAvLyB1c2UgdGhlIGxvd2VzdCBpZCBpbiBhbGxSYW5nZSBhcyBzdGFydCBlbGVtZW50XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlbGVtZW50c1RvUmVhZCA9IGNvdW50IC0gKGFsbFJhbmdlTGlzdC5sZW5ndGggLSAxIC0gaW5kZXhPZlN0YXJ0KVxuXHRcdFx0XHRzdGFydEVsZW1lbnRJZCA9IGFsbFJhbmdlTGlzdFthbGxSYW5nZUxpc3QubGVuZ3RoIC0gMV0gLy8gdXNlIHRoZSAgaGlnaGVzdCBpZCBpbiBhbGxSYW5nZSBhcyBzdGFydCBlbGVtZW50XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChsb3dlciA9PT0gc3RhcnQgfHwgKGZpcnN0QmlnZ2VyVGhhblNlY29uZChzdGFydCwgbG93ZXIsIHR5cGVNb2RlbCkgJiYgZmlyc3RCaWdnZXJUaGFuU2Vjb25kKGFsbFJhbmdlTGlzdFswXSwgc3RhcnQsIHR5cGVNb2RlbCkpKSB7XG5cdFx0XHQvLyBTdGFydCBlbGVtZW50IGlzIG5vdCBpbiBhbGxSYW5nZSBidXQgaGFzIGJlZW4gdXNlZCBoYXMgc3RhcnQgZWxlbWVudCBmb3IgYSByYW5nZSByZXF1ZXN0LCBlZy4gRW50aXR5UmVzdEludGVyZmFjZS5HRU5FUkFURURfTUlOX0lELCBvciBzdGFydCBpcyBiZXR3ZWVuIGxvd2VyIHJhbmdlIGlkIGFuZCBsb3dlc3QgZWxlbWVudCBpbiByYW5nZVxuXHRcdFx0aWYgKCFyZXZlcnNlKSB7XG5cdFx0XHRcdC8vIGlmIG5vdCByZXZlcnNlIHJlYWQgb25seSBlbGVtZW50cyB0aGF0IGFyZSBub3QgaW4gYWxsUmFuZ2Vcblx0XHRcdFx0c3RhcnRFbGVtZW50SWQgPSBhbGxSYW5nZUxpc3RbYWxsUmFuZ2VMaXN0Lmxlbmd0aCAtIDFdIC8vIHVzZSB0aGUgIGhpZ2hlc3QgaWQgaW4gYWxsUmFuZ2UgYXMgc3RhcnQgZWxlbWVudFxuXHRcdFx0XHRlbGVtZW50c1RvUmVhZCA9IGNvdW50IC0gYWxsUmFuZ2VMaXN0Lmxlbmd0aFxuXHRcdFx0fVxuXHRcdFx0Ly8gaWYgcmV2ZXJzZSByZWFkIGFsbCBlbGVtZW50c1xuXHRcdH0gZWxzZSBpZiAoXG5cdFx0XHR1cHBlciA9PT0gc3RhcnQgfHxcblx0XHRcdChmaXJzdEJpZ2dlclRoYW5TZWNvbmQoc3RhcnQsIGFsbFJhbmdlTGlzdFthbGxSYW5nZUxpc3QubGVuZ3RoIC0gMV0sIHR5cGVNb2RlbCkgJiYgZmlyc3RCaWdnZXJUaGFuU2Vjb25kKHVwcGVyLCBzdGFydCwgdHlwZU1vZGVsKSlcblx0XHQpIHtcblx0XHRcdC8vIFN0YXJ0IGVsZW1lbnQgaXMgbm90IGluIGFsbFJhbmdlIGJ1dCBoYXMgYmVlbiB1c2VkIGhhcyBzdGFydCBlbGVtZW50IGZvciBhIHJhbmdlIHJlcXVlc3QsIGVnLiBFbnRpdHlSZXN0SW50ZXJmYWNlLkdFTkVSQVRFRF9NQVhfSUQsIG9yIHN0YXJ0IGlzIGJldHdlZW4gdXBwZXIgcmFuZ2UgaWQgYW5kIGhpZ2hlc3QgZWxlbWVudCBpbiByYW5nZVxuXHRcdFx0aWYgKHJldmVyc2UpIHtcblx0XHRcdFx0Ly8gaWYgbm90IHJldmVyc2UgcmVhZCBvbmx5IGVsZW1lbnRzIHRoYXQgYXJlIG5vdCBpbiBhbGxSYW5nZVxuXHRcdFx0XHRzdGFydEVsZW1lbnRJZCA9IGFsbFJhbmdlTGlzdFswXSAvLyB1c2UgdGhlICBoaWdoZXN0IGlkIGluIGFsbFJhbmdlIGFzIHN0YXJ0IGVsZW1lbnRcblx0XHRcdFx0ZWxlbWVudHNUb1JlYWQgPSBjb3VudCAtIGFsbFJhbmdlTGlzdC5sZW5ndGhcblx0XHRcdH1cblx0XHRcdC8vIGlmIG5vdCByZXZlcnNlIHJlYWQgYWxsIGVsZW1lbnRzXG5cdFx0fVxuXHRcdHJldHVybiB7IG5ld1N0YXJ0OiBzdGFydEVsZW1lbnRJZCwgbmV3Q291bnQ6IGVsZW1lbnRzVG9SZWFkIH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyB3aGVuIHRoZSBlbnRpdHkgaXMgbG9hZGVkIGZyb20gdGhlIHNlcnZlciBpZiBuZWNlc3Nhcnlcblx0ICogQHByZSBUaGUgbGFzdCBjYWxsIG9mIHRoaXMgZnVuY3Rpb24gbXVzdCBiZSByZXNvbHZlZC4gVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgdGhhdCBlLmcuIHdoaWxlXG5cdCAqIGxvYWRpbmcgYSBjcmVhdGVkIGluc3RhbmNlIGZyb20gdGhlIHNlcnZlciB3ZSByZWNlaXZlIGFuIHVwZGF0ZSBvZiB0aGF0IGluc3RhbmNlIGFuZCBpZ25vcmUgaXQgYmVjYXVzZSB0aGUgaW5zdGFuY2UgaXMgbm90IGluIHRoZSBjYWNoZSB5ZXQuXG5cdCAqXG5cdCAqIEByZXR1cm4gUHJvbWlzZSwgd2hpY2ggcmVzb2x2ZXMgdG8gdGhlIGFycmF5IG9mIHZhbGlkIGV2ZW50cyAoaWYgcmVzcG9uc2UgaXMgTm90Rm91bmQgb3IgTm90QXV0aG9yaXplZCB3ZSBmaWx0ZXIgaXQgb3V0KVxuXHQgKi9cblx0YXN5bmMgZW50aXR5RXZlbnRzUmVjZWl2ZWQoYmF0Y2g6IFF1ZXVlZEJhdGNoKTogUHJvbWlzZTxBcnJheTxFbnRpdHlVcGRhdGU+PiB7XG5cdFx0YXdhaXQgdGhpcy5yZWNvcmRTeW5jVGltZSgpXG5cblx0XHQvLyB3ZSBoYW5kbGUgcG9zdCBtdWx0aXBsZSBjcmVhdGUgb3BlcmF0aW9ucyBzZXBhcmF0ZWx5IHRvIG9wdGltaXplIHRoZSBudW1iZXIgb2YgcmVxdWVzdHMgd2l0aCBnZXRNdWx0aXBsZVxuXHRcdGNvbnN0IGNyZWF0ZVVwZGF0ZXNGb3JMRVRzOiBFbnRpdHlVcGRhdGVbXSA9IFtdXG5cdFx0Y29uc3QgcmVndWxhclVwZGF0ZXM6IEVudGl0eVVwZGF0ZVtdID0gW10gLy8gYWxsIHVwZGF0ZXMgbm90IHJlc3VsdGluZyBmcm9tIHBvc3QgbXVsdGlwbGUgcmVxdWVzdHNcblx0XHRjb25zdCB1cGRhdGVzQXJyYXkgPSBiYXRjaC5ldmVudHNcblx0XHRmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzQXJyYXkpIHtcblx0XHRcdGNvbnN0IHR5cGVSZWYgPSBuZXcgVHlwZVJlZih1cGRhdGUuYXBwbGljYXRpb24sIHVwZGF0ZS50eXBlKVxuXG5cdFx0XHQvLyBtb25pdG9yIGFwcGxpY2F0aW9uIGlzIGlnbm9yZWRcblx0XHRcdGlmICh1cGRhdGUuYXBwbGljYXRpb24gPT09IFwibW9uaXRvclwiKSBjb250aW51ZVxuXHRcdFx0Ly8gbWFpbHMgYXJlIGlnbm9yZWQgYmVjYXVzZSBtb3ZlIG9wZXJhdGlvbnMgYXJlIGhhbmRsZWQgYXMgYSBzcGVjaWFsIGV2ZW50IChhbmQgbm8gcG9zdCBtdWx0aXBsZSBpcyBwb3NzaWJsZSlcblx0XHRcdGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkNSRUFURSAmJiBnZXRVcGRhdGVJbnN0YW5jZUlkKHVwZGF0ZSkuaW5zdGFuY2VMaXN0SWQgIT0gbnVsbCAmJiAhaXNTYW1lVHlwZVJlZih0eXBlUmVmLCBNYWlsVHlwZVJlZikpIHtcblx0XHRcdFx0Y3JlYXRlVXBkYXRlc0ZvckxFVHMucHVzaCh1cGRhdGUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZWd1bGFyVXBkYXRlcy5wdXNoKHVwZGF0ZSlcblx0XHRcdFx0YXdhaXQgdGhpcy5jaGVja0Zvck1haWxTZXRNaWdyYXRpb24odHlwZVJlZiwgdXBkYXRlKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGNyZWF0ZVVwZGF0ZXNGb3JMRVRzUGVyTGlzdCA9IGdyb3VwQnkoY3JlYXRlVXBkYXRlc0ZvckxFVHMsICh1cGRhdGUpID0+IHVwZGF0ZS5pbnN0YW5jZUxpc3RJZClcblxuXHRcdGNvbnN0IHBvc3RNdWx0aXBsZUV2ZW50VXBkYXRlczogRW50aXR5VXBkYXRlW11bXSA9IFtdXG5cdFx0Ly8gd2UgZmlyc3QgaGFuZGxlIHBvdGVudGlhbCBwb3N0IG11bHRpcGxlIHVwZGF0ZXMgaW4gZ2V0IG11bHRpcGxlIHJlcXVlc3RzXG5cdFx0Zm9yIChsZXQgW2luc3RhbmNlTGlzdElkLCB1cGRhdGVzXSBvZiBjcmVhdGVVcGRhdGVzRm9yTEVUc1Blckxpc3QpIHtcblx0XHRcdGNvbnN0IGZpcnN0VXBkYXRlID0gdXBkYXRlc1swXVxuXHRcdFx0Y29uc3QgdHlwZVJlZiA9IG5ldyBUeXBlUmVmPExpc3RFbGVtZW50RW50aXR5PihmaXJzdFVwZGF0ZS5hcHBsaWNhdGlvbiwgZmlyc3RVcGRhdGUudHlwZSlcblx0XHRcdGNvbnN0IGlkcyA9IHVwZGF0ZXMubWFwKCh1cGRhdGUpID0+IHVwZGF0ZS5pbnN0YW5jZUlkKVxuXG5cdFx0XHQvLyBXZSBvbmx5IHdhbnQgdG8gbG9hZCB0aGUgaW5zdGFuY2VzIHRoYXQgYXJlIGluIGNhY2hlIHJhbmdlXG5cdFx0XHRjb25zdCBjdXN0b21IYW5kbGVyID0gdGhpcy5zdG9yYWdlLmdldEN1c3RvbUNhY2hlSGFuZGxlck1hcCh0aGlzLmVudGl0eVJlc3RDbGllbnQpLmdldCh0eXBlUmVmKVxuXHRcdFx0Y29uc3QgaWRzSW5DYWNoZVJhbmdlID1cblx0XHRcdFx0Y3VzdG9tSGFuZGxlciAmJiBjdXN0b21IYW5kbGVyLmdldEVsZW1lbnRJZHNJbkNhY2hlUmFuZ2Vcblx0XHRcdFx0XHQ/IGF3YWl0IGN1c3RvbUhhbmRsZXIuZ2V0RWxlbWVudElkc0luQ2FjaGVSYW5nZSh0aGlzLnN0b3JhZ2UsIGluc3RhbmNlTGlzdElkLCBpZHMpXG5cdFx0XHRcdFx0OiBhd2FpdCB0aGlzLmdldEVsZW1lbnRJZHNJbkNhY2hlUmFuZ2UodHlwZVJlZiwgaW5zdGFuY2VMaXN0SWQsIGlkcylcblxuXHRcdFx0aWYgKGlkc0luQ2FjaGVSYW5nZS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cG9zdE11bHRpcGxlRXZlbnRVcGRhdGVzLnB1c2godXBkYXRlcylcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHVwZGF0ZXNOb3RJbkNhY2hlUmFuZ2UgPVxuXHRcdFx0XHRcdGlkc0luQ2FjaGVSYW5nZS5sZW5ndGggPT09IHVwZGF0ZXMubGVuZ3RoID8gW10gOiB1cGRhdGVzLmZpbHRlcigodXBkYXRlKSA9PiAhaWRzSW5DYWNoZVJhbmdlLmluY2x1ZGVzKHVwZGF0ZS5pbnN0YW5jZUlkKSlcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIGxvYWRNdWx0aXBsZSBpcyBvbmx5IGNhbGxlZCB0byBjYWNoZSB0aGUgZWxlbWVudHMgYW5kIGNoZWNrIHdoaWNoIG9uZXMgcmV0dXJuIGVycm9yc1xuXHRcdFx0XHRcdGNvbnN0IHJldHVybmVkSW5zdGFuY2VzID0gYXdhaXQgdGhpcy5fbG9hZE11bHRpcGxlKHR5cGVSZWYsIGluc3RhbmNlTGlzdElkLCBpZHNJbkNhY2hlUmFuZ2UsIHVuZGVmaW5lZCwgeyBjYWNoZU1vZGU6IENhY2hlTW9kZS5Xcml0ZU9ubHkgfSlcblx0XHRcdFx0XHQvL1dlIGRvIG5vdCB3YW50IHRvIHBhc3MgdXBkYXRlcyB0aGF0IGNhdXNlZCBhbiBlcnJvclxuXHRcdFx0XHRcdGlmIChyZXR1cm5lZEluc3RhbmNlcy5sZW5ndGggIT09IGlkc0luQ2FjaGVSYW5nZS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHJldHVybmVkSWRzID0gcmV0dXJuZWRJbnN0YW5jZXMubWFwKChpbnN0YW5jZSkgPT4gZ2V0RWxlbWVudElkKGluc3RhbmNlKSlcblx0XHRcdFx0XHRcdHBvc3RNdWx0aXBsZUV2ZW50VXBkYXRlcy5wdXNoKHVwZGF0ZXMuZmlsdGVyKCh1cGRhdGUpID0+IHJldHVybmVkSWRzLmluY2x1ZGVzKHVwZGF0ZS5pbnN0YW5jZUlkKSkuY29uY2F0KHVwZGF0ZXNOb3RJbkNhY2hlUmFuZ2UpKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRwb3N0TXVsdGlwbGVFdmVudFVwZGF0ZXMucHVzaCh1cGRhdGVzKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90QXV0aG9yaXplZEVycm9yKSB7XG5cdFx0XHRcdFx0XHQvLyByZXR1cm4gdXBkYXRlcyB0aGF0IGFyZSBub3QgaW4gY2FjaGUgUmFuZ2UgaWYgTm90QXV0aG9yaXplZEVycm9yIChmb3IgdGhvc2UgdXBkYXRlcyB0aGF0IGFyZSBpbiBjYWNoZSByYW5nZSlcblx0XHRcdFx0XHRcdHBvc3RNdWx0aXBsZUV2ZW50VXBkYXRlcy5wdXNoKHVwZGF0ZXNOb3RJbkNhY2hlUmFuZ2UpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBvdGhlckV2ZW50VXBkYXRlczogRW50aXR5VXBkYXRlW10gPSBbXVxuXHRcdGZvciAobGV0IHVwZGF0ZSBvZiByZWd1bGFyVXBkYXRlcykge1xuXHRcdFx0Y29uc3QgeyBvcGVyYXRpb24sIHR5cGUsIGFwcGxpY2F0aW9uIH0gPSB1cGRhdGVcblx0XHRcdGNvbnN0IHsgaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQgfSA9IGdldFVwZGF0ZUluc3RhbmNlSWQodXBkYXRlKVxuXHRcdFx0Y29uc3QgdHlwZVJlZiA9IG5ldyBUeXBlUmVmPFNvbWVFbnRpdHk+KGFwcGxpY2F0aW9uLCB0eXBlKVxuXG5cdFx0XHRzd2l0Y2ggKG9wZXJhdGlvbikge1xuXHRcdFx0XHRjYXNlIE9wZXJhdGlvblR5cGUuVVBEQVRFOiB7XG5cdFx0XHRcdFx0Y29uc3QgaGFuZGxlZFVwZGF0ZSA9IGF3YWl0IHRoaXMucHJvY2Vzc1VwZGF0ZUV2ZW50KHR5cGVSZWYsIHVwZGF0ZSlcblx0XHRcdFx0XHRpZiAoaGFuZGxlZFVwZGF0ZSkge1xuXHRcdFx0XHRcdFx0b3RoZXJFdmVudFVwZGF0ZXMucHVzaChoYW5kbGVkVXBkYXRlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhayAvLyBkbyBicmVhayBpbnN0ZWFkIG9mIGNvbnRpbnVlIHRvIGF2b2lkIGlkZSB3YXJuaW5nc1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgT3BlcmF0aW9uVHlwZS5ERUxFVEU6IHtcblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRpc1NhbWVUeXBlUmVmKE1haWxUeXBlUmVmLCB0eXBlUmVmKSAmJlxuXHRcdFx0XHRcdFx0Y29udGFpbnNFdmVudE9mVHlwZSh1cGRhdGVzQXJyYXkgYXMgUmVhZG9ubHk8RW50aXR5VXBkYXRlRGF0YVtdPiwgT3BlcmF0aW9uVHlwZS5DUkVBVEUsIGluc3RhbmNlSWQpXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHQvLyBtb3ZlIGZvciBtYWlsIGlzIGhhbmRsZWQgaW4gY3JlYXRlIGV2ZW50LlxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihNYWlsVHlwZVJlZiwgdHlwZVJlZikpIHtcblx0XHRcdFx0XHRcdC8vIGRlbGV0ZSBtYWlsRGV0YWlscyBpZiB0aGV5IGFyZSBhdmFpbGFibGUgKGFzIHdlIGRvbid0IHNlbmQgYW4gZXZlbnQgZm9yIHRoaXMgdHlwZSlcblx0XHRcdFx0XHRcdGNvbnN0IG1haWwgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0KE1haWxUeXBlUmVmLCBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZClcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5kZWxldGVJZkV4aXN0cyh0eXBlUmVmLCBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZClcblx0XHRcdFx0XHRcdGlmIChtYWlsPy5tYWlsRGV0YWlscyAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5kZWxldGVJZkV4aXN0cyhNYWlsRGV0YWlsc0Jsb2JUeXBlUmVmLCBtYWlsLm1haWxEZXRhaWxzWzBdLCBtYWlsLm1haWxEZXRhaWxzWzFdKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnN0b3JhZ2UuZGVsZXRlSWZFeGlzdHModHlwZVJlZiwgaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG90aGVyRXZlbnRVcGRhdGVzLnB1c2godXBkYXRlKVxuXHRcdFx0XHRcdGJyZWFrIC8vIGRvIGJyZWFrIGluc3RlYWQgb2YgY29udGludWUgdG8gYXZvaWQgaWRlIHdhcm5pbmdzXG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSBPcGVyYXRpb25UeXBlLkNSRUFURToge1xuXHRcdFx0XHRcdGNvbnN0IGhhbmRsZWRVcGRhdGUgPSBhd2FpdCB0aGlzLnByb2Nlc3NDcmVhdGVFdmVudCh0eXBlUmVmLCB1cGRhdGUsIHVwZGF0ZXNBcnJheSlcblx0XHRcdFx0XHRpZiAoaGFuZGxlZFVwZGF0ZSkge1xuXHRcdFx0XHRcdFx0b3RoZXJFdmVudFVwZGF0ZXMucHVzaChoYW5kbGVkVXBkYXRlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhayAvLyBkbyBicmVhayBpbnN0ZWFkIG9mIGNvbnRpbnVlIHRvIGF2b2lkIGlkZSB3YXJuaW5nc1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJVbmtub3duIG9wZXJhdGlvbiB0eXBlOiBcIiArIG9wZXJhdGlvbilcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gdGhlIHdob2xlIGJhdGNoIGhhcyBiZWVuIHdyaXR0ZW4gc3VjY2Vzc2Z1bGx5XG5cdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnB1dExhc3RCYXRjaElkRm9yR3JvdXAoYmF0Y2guZ3JvdXBJZCwgYmF0Y2guYmF0Y2hJZClcblx0XHQvLyBtZXJnZSB0aGUgcmVzdWx0c1xuXHRcdHJldHVybiBvdGhlckV2ZW50VXBkYXRlcy5jb25jYXQocG9zdE11bHRpcGxlRXZlbnRVcGRhdGVzLmZsYXQoKSlcblx0fVxuXG5cdC8qKiBSZXR1cm5zIHtudWxsfSB3aGVuIHRoZSB1cGRhdGUgc2hvdWxkIGJlIHNraXBwZWQuICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0NyZWF0ZUV2ZW50KHR5cGVSZWY6IFR5cGVSZWY8YW55PiwgdXBkYXRlOiBFbnRpdHlVcGRhdGUsIGJhdGNoOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZT4pOiBQcm9taXNlPEVudGl0eVVwZGF0ZSB8IG51bGw+IHtcblx0XHQvLyBkbyBub3QgcmV0dXJuIHVuZGVmaW5lZCB0byBhdm9pZCBpbXBsaWNpdCByZXR1cm5zXG5cdFx0Y29uc3QgeyBpbnN0YW5jZUlkLCBpbnN0YW5jZUxpc3RJZCB9ID0gZ2V0VXBkYXRlSW5zdGFuY2VJZCh1cGRhdGUpXG5cblx0XHQvLyBXZSBwdXQgbmV3IGluc3RhbmNlcyBpbnRvIGNhY2hlIG9ubHkgd2hlbiBpdCdzIGEgbmV3IGluc3RhbmNlIGluIHRoZSBjYWNoZWQgcmFuZ2Ugd2hpY2ggaXMgb25seSBmb3IgdGhlIGxpc3QgaW5zdGFuY2VzLlxuXHRcdGlmIChpbnN0YW5jZUxpc3RJZCAhPSBudWxsKSB7XG5cdFx0XHRjb25zdCBkZWxldGVFdmVudCA9IGdldEV2ZW50T2ZUeXBlKGJhdGNoLCBPcGVyYXRpb25UeXBlLkRFTEVURSwgaW5zdGFuY2VJZClcblxuXHRcdFx0Y29uc3QgbWFpbCA9IGRlbGV0ZUV2ZW50ICYmIGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHR5cGVSZWYpID8gYXdhaXQgdGhpcy5zdG9yYWdlLmdldChNYWlsVHlwZVJlZiwgZGVsZXRlRXZlbnQuaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQpIDogbnVsbFxuXHRcdFx0Ly8gYXZvaWQgZG93bmxvYWRpbmcgbmV3IG1haWwgZWxlbWVudCBmb3Igbm9uLW1haWxTZXQgdXNlci5cblx0XHRcdC8vIGNhbiBiZSByZW1vdmVkIG9uY2UgYWxsIG1haWxib3ggaGF2ZSBiZWVuIG1pZ3JhdGVkIHRvIG1haWxTZXQgKG9uY2UgbGFzdE5vbk91dGRhdGVkQ2xpZW50VmVyc2lvbiBpcyA+PSB2MjQyKVxuXHRcdFx0aWYgKGRlbGV0ZUV2ZW50ICE9IG51bGwgJiYgbWFpbCAhPSBudWxsICYmIGlzRW1wdHkobWFpbC5zZXRzKSkge1xuXHRcdFx0XHQvLyBJdCBpcyBhIG1vdmUgZXZlbnQgZm9yIGNhY2hlZCBtYWlsXG5cdFx0XHRcdGF3YWl0IHRoaXMuc3RvcmFnZS5kZWxldGVJZkV4aXN0cyh0eXBlUmVmLCBkZWxldGVFdmVudC5pbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZClcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVMaXN0SWRPZk1haWxBbmRVcGRhdGVDYWNoZShtYWlsLCBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZClcblx0XHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gSWYgdGhlcmUgaXMgYSBjdXN0b20gaGFuZGxlciB3ZSBmb2xsb3cgaXRzIGRlY2lzaW9uLlxuXHRcdFx0XHQvLyBPdGhlcndpc2UsIHdlIGRvIGEgcmFuZ2UgY2hlY2sgdG8gc2VlIGlmIHdlIG5lZWQgdG8ga2VlcCB0aGUgcmFuZ2UgdXAtdG8tZGF0ZS5cblx0XHRcdFx0Y29uc3Qgc2hvdWxkTG9hZCA9XG5cdFx0XHRcdFx0KGF3YWl0IHRoaXMuc3RvcmFnZS5nZXRDdXN0b21DYWNoZUhhbmRsZXJNYXAodGhpcy5lbnRpdHlSZXN0Q2xpZW50KS5nZXQodHlwZVJlZik/LnNob3VsZExvYWRPbkNyZWF0ZUV2ZW50Py4odXBkYXRlKSkgPz9cblx0XHRcdFx0XHQoYXdhaXQgdGhpcy5zdG9yYWdlLmlzRWxlbWVudElkSW5DYWNoZVJhbmdlKHR5cGVSZWYsIGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkKSlcblx0XHRcdFx0aWYgKHNob3VsZExvYWQpIHtcblx0XHRcdFx0XHQvLyBObyBuZWVkIHRvIHRyeSB0byBkb3dubG9hZCBzb21ldGhpbmcgdGhhdCdzIG5vdCB0aGVyZSBhbnltb3JlXG5cdFx0XHRcdFx0Ly8gV2UgZG8gbm90IGNvbnN1bHQgY3VzdG9tIGhhbmRsZXJzIGhlcmUgYmVjYXVzZSB0aGV5IGFyZSBvbmx5IG5lZWRlZCBmb3IgbGlzdCBlbGVtZW50cy5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImRvd25sb2FkaW5nIGNyZWF0ZSBldmVudCBmb3JcIiwgZ2V0VHlwZUlkKHR5cGVSZWYpLCBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZClcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlSZXN0Q2xpZW50XG5cdFx0XHRcdFx0XHQubG9hZCh0eXBlUmVmLCBbaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWRdKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGVudGl0eSkgPT4gdGhpcy5zdG9yYWdlLnB1dChlbnRpdHkpKVxuXHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4gdXBkYXRlKVxuXHRcdFx0XHRcdFx0LmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmIChpc0V4cGVjdGVkRXJyb3JGb3JTeW5jaHJvbml6YXRpb24oZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdXBkYXRlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBnaXZlbiBtYWlsIHdpdGggdGhlIG5ldyBsaXN0IGlkIGFuZCBhZGQgaXQgdG8gdGhlIGNhY2hlLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyB1cGRhdGVMaXN0SWRPZk1haWxBbmRVcGRhdGVDYWNoZShtYWlsOiBNYWlsLCBuZXdMaXN0SWQ6IElkLCBlbGVtZW50SWQ6IElkKSB7XG5cdFx0Ly8gSW4gY2FzZSBvZiBhIG1vdmUgb3BlcmF0aW9uIHdlIGhhdmUgdG8gcmVwbGFjZSB0aGUgbGlzdCBpZCBhbHdheXMsIGFzIHRoZSBtYWlsIGlzIHN0b3JlZCBpbiBhbm90aGVyIGZvbGRlci5cblx0XHRtYWlsLl9pZCA9IFtuZXdMaXN0SWQsIGVsZW1lbnRJZF1cblx0XHRpZiAobWFpbC5idWNrZXRLZXkgIT0gbnVsbCkge1xuXHRcdFx0Ly8gV2l0aCB0aGUgc2ltcGxpZmllZCBwZXJtaXNzaW9uIHN5c3RlbSAoTWFpbERldGFpbHMpIHdlIGFsc28gaGF2ZSB0byB1cGRhdGUgdGhlIGJ1Y2tldEVuY1Nlc3Npb25LZXkgZm9yIHRoZSBtYWlsLFxuXHRcdFx0Ly8gd2hpY2ggYWxzbyByZWZlcmVuY2VzIHRoZSBtYWlsIGxpc3QgaWQuIFdlIG5lZWQgdGhpcyBmb3Igc29tZSBjYXNlcyB3aGVuIHRoZSBtb3ZlIG9wZXJhdGlvbiB3YXMgZXhlY3V0ZWRcblx0XHRcdC8vIGJlZm9yZSB0aGUgVXBkYXRlU2Vzc2lvbktleVNlcnZpY2UgaGFzIGJlZW4gZXhlY3V0ZWQsIGUuZy4gd2hlbiB1c2luZyBpbmJveCBydWxlcy5cblx0XHRcdC8vIFRoZSBVcGRhdGVTZXNzaW9uS2V5U2VydmljZSB3b3VsZCByZW1vdmUgdGhlIGJ1Y2tldEtleSBmcm9tIHRoZSBtYWlsIGFuZCB0aGVyZSBpcyBubyBuZWVkIHRvIHN5bmNocm9uaXplIGl0IGFueW1vcmUuXG5cdFx0XHRjb25zdCBtYWlsU2Vzc2lvbktleSA9IG1haWwuYnVja2V0S2V5LmJ1Y2tldEVuY1Nlc3Npb25LZXlzLmZpbmQoKGJ1Y2tldEVuY1Nlc3Npb25LZXkpID0+IGlzU2FtZUlkKGJ1Y2tldEVuY1Nlc3Npb25LZXkuaW5zdGFuY2VJZCwgZWxlbWVudElkKSlcblx0XHRcdGlmIChtYWlsU2Vzc2lvbktleSkge1xuXHRcdFx0XHRtYWlsU2Vzc2lvbktleS5pbnN0YW5jZUxpc3QgPSBuZXdMaXN0SWRcblx0XHRcdH1cblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zdG9yYWdlLnB1dChtYWlsKVxuXHR9XG5cblx0LyoqIFJldHVybnMge251bGx9IHdoZW4gdGhlIHVwZGF0ZSBzaG91bGQgYmUgc2tpcHBlZC4gKi9cblx0cHJpdmF0ZSBhc3luYyBwcm9jZXNzVXBkYXRlRXZlbnQodHlwZVJlZjogVHlwZVJlZjxTb21lRW50aXR5PiwgdXBkYXRlOiBFbnRpdHlVcGRhdGUpOiBQcm9taXNlPEVudGl0eVVwZGF0ZSB8IG51bGw+IHtcblx0XHRjb25zdCB7IGluc3RhbmNlSWQsIGluc3RhbmNlTGlzdElkIH0gPSBnZXRVcGRhdGVJbnN0YW5jZUlkKHVwZGF0ZSlcblx0XHRjb25zdCBjYWNoZWQgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0KHR5cGVSZWYsIGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkKVxuXHRcdC8vIE5vIG5lZWQgdG8gdHJ5IHRvIGRvd25sb2FkIHNvbWV0aGluZyB0aGF0J3Mgbm90IHRoZXJlIGFueW1vcmVcblx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdC8vIGluIGNhc2UgdGhpcyBpcyBhbiB1cGRhdGUgZm9yIHRoZSB1c2VyIGluc3RhbmNlOiBpZiB0aGUgcGFzc3dvcmQgY2hhbmdlZCB3ZSdsbCBiZSBsb2dnZWQgb3V0IGF0IHRoaXMgcG9pbnRcblx0XHRcdFx0Ly8gaWYgd2UgZG9uJ3QgY2F0Y2ggdGhlIGV4cGVjdGVkIE5vdEF1dGhlbnRpY2F0ZWQgRXJyb3IgdGhhdCByZXN1bHRzIGZyb20gdHJ5aW5nIHRvIGxvYWQgYW55dGhpbmcgd2l0aFxuXHRcdFx0XHQvLyB0aGUgb2xkIHVzZXIuXG5cdFx0XHRcdC8vIExldHRpbmcgdGhlIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciBwcm9wYWdhdGUgdG8gdGhlIG1haW4gdGhyZWFkIGluc3RlYWQgb2YgdHJ5aW5nIHRvIGhhbmRsZSBpdCBvdXJzZWx2ZXNcblx0XHRcdFx0Ly8gb3IgdGhyb3dpbmcgb3V0IHRoZSB1cGRhdGUgZHJvcHMgdXMgb250byB0aGUgbG9naW4gcGFnZSBhbmQgaW50byB0aGUgc2Vzc2lvbiByZWNvdmVyeSBmbG93IGlmIHRoZSB1c2VyXG5cdFx0XHRcdC8vIGNsaWNrcyB0aGVpciBzYXZlZCBjcmVkZW50aWFscyBhZ2FpbiwgYnV0IGxldHMgdGhlbSBzdGlsbCB1c2Ugb2ZmbGluZSBsb2dpbiBpZiB0aGV5IHRyeSB0byB1c2UgdGhlXG5cdFx0XHRcdC8vIG91dGRhdGVkIGNyZWRlbnRpYWxzIHdoaWxlIG5vdCBjb25uZWN0ZWQgdG8gdGhlIGludGVybmV0LlxuXHRcdFx0XHRjb25zdCBuZXdFbnRpdHkgPSBhd2FpdCB0aGlzLmVudGl0eVJlc3RDbGllbnQubG9hZCh0eXBlUmVmLCBjb2xsYXBzZUlkKGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkKSlcblx0XHRcdFx0aWYgKGlzU2FtZVR5cGVSZWYodHlwZVJlZiwgVXNlclR5cGVSZWYpKSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVVcGRhdGVkVXNlcihjYWNoZWQsIG5ld0VudGl0eSlcblx0XHRcdFx0fVxuXHRcdFx0XHRhd2FpdCB0aGlzLnN0b3JhZ2UucHV0KG5ld0VudGl0eSlcblx0XHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBJZiB0aGUgZW50aXR5IGlzIG5vdCB0aGVyZSBhbnltb3JlIHdlIHNob3VsZCBldmljdCBpdCBmcm9tIHRoZSBjYWNoZSBhbmQgbm90IGtlZXAgdGhlIG91dGRhdGVkL25vbmV4aXN0aW5nIGluc3RhbmNlIGFyb3VuZC5cblx0XHRcdFx0Ly8gRXZlbiBmb3IgbGlzdCBlbGVtZW50cyB0aGlzIHNob3VsZCBiZSBzYWZlIGFzIHRoZSBpbnN0YW5jZSBpcyBub3QgdGhlcmUgYW55bW9yZSBhbmQgaXMgZGVmaW5pdGVseSBub3QgaW4gdGhpcyB2ZXJzaW9uXG5cdFx0XHRcdGlmIChpc0V4cGVjdGVkRXJyb3JGb3JTeW5jaHJvbml6YXRpb24oZSkpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgSW5zdGFuY2Ugbm90IGZvdW5kIHdoZW4gcHJvY2Vzc2luZyB1cGRhdGUgZm9yICR7SlNPTi5zdHJpbmdpZnkodXBkYXRlKX0sIGRlbGV0aW5nIGZyb20gdGhlIGNhY2hlLmApXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLmRlbGV0ZUlmRXhpc3RzKHR5cGVSZWYsIGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkKVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB1cGRhdGVcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlVXBkYXRlZFVzZXIoY2FjaGVkOiBTb21lRW50aXR5LCBuZXdFbnRpdHk6IFNvbWVFbnRpdHkpIHtcblx0XHQvLyBXaGVuIHdlIGFyZSByZW1vdmVkIGZyb20gYSBncm91cCB3ZSBqdXN0IGdldCBhbiB1cGRhdGUgZm9yIG91ciB1c2VyXG5cdFx0Ly8gd2l0aCBubyBtZW1iZXJzaGlwIG9uIGl0LiBXZSBuZWVkIHRvIGNsZWFuIHVwIGFsbCB0aGUgZW50aXRpZXMgdGhhdFxuXHRcdC8vIGJlbG9uZyB0byB0aGF0IGdyb3VwIHNpbmNlIHdlIHNob3VsZG4ndCBiZSBhYmxlIHRvIGFjY2VzcyB0aGVtIGFueW1vcmVcblx0XHQvLyBhbmQgd2Ugd29uJ3QgZ2V0IGFueSB1cGRhdGUgb3IgYW5vdGhlciBjaGFuY2UgdG8gY2xlYW4gdGhlbSB1cC5cblx0XHRjb25zdCBvbGRVc2VyID0gY2FjaGVkIGFzIFVzZXJcblx0XHRpZiAob2xkVXNlci5faWQgIT09IHRoaXMuc3RvcmFnZS5nZXRVc2VySWQoKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IG5ld1VzZXIgPSBuZXdFbnRpdHkgYXMgVXNlclxuXHRcdGNvbnN0IHJlbW92ZWRTaGlwcyA9IGRpZmZlcmVuY2Uob2xkVXNlci5tZW1iZXJzaGlwcywgbmV3VXNlci5tZW1iZXJzaGlwcywgKGwsIHIpID0+IGwuX2lkID09PSByLl9pZClcblx0XHRmb3IgKGNvbnN0IHNoaXAgb2YgcmVtb3ZlZFNoaXBzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkxvc3QgbWVtYmVyc2hpcCBvbiBcIiwgc2hpcC5faWQsIHNoaXAuZ3JvdXBUeXBlKVxuXHRcdFx0YXdhaXQgdGhpcy5zdG9yYWdlLmRlbGV0ZUFsbE93bmVkQnkoc2hpcC5ncm91cClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICpcblx0ICogQHJldHVybnMge0FycmF5PElkPn0gdGhlIGlkcyB0aGF0IGFyZSBpbiBjYWNoZSByYW5nZSBhbmQgdGhlcmVmb3JlIHNob3VsZCBiZSBjYWNoZWRcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZ2V0RWxlbWVudElkc0luQ2FjaGVSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGxpc3RJZDogSWQsIGlkczogSWRbXSk6IFByb21pc2U8SWRbXT4ge1xuXHRcdGNvbnN0IHJldDogSWRbXSA9IFtdXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChhd2FpdCB0aGlzLnN0b3JhZ2UuaXNFbGVtZW50SWRJbkNhY2hlUmFuZ2UodHlwZVJlZiwgbGlzdElkLCBpZHNbaV0pKSB7XG5cdFx0XHRcdHJldC5wdXNoKGlkc1tpXSlcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJldFxuXHR9XG5cblx0LyoqXG5cdCAqIHRvIGF2b2lkIGV4Y2Vzc2l2ZSBlbnRpdHkgdXBkYXRlcyBhbmQgaW5jb25zaXN0ZW50IG9mZmxpbmUgc3RvcmFnZXMsIHdlIGRvbid0IHNlbmQgZW50aXR5IHVwZGF0ZXMgZm9yIGVhY2ggbWFpbCBzZXQgbWlncmF0ZWQgbWFpbC5cblx0ICogaW5zdGVhZCB3ZSBkZXRlY3QgdGhlIG1haWwgc2V0IG1pZ3JhdGlvbiBmb3IgZWFjaCBmb2xkZXIgYW5kIGRyb3AgaXRzIHdob2xlIGxpc3QgZnJvbSBvZmZsaW5lLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjaGVja0Zvck1haWxTZXRNaWdyYXRpb24odHlwZVJlZjogVHlwZVJlZjx1bmtub3duPiwgdXBkYXRlOiBFbnRpdHlVcGRhdGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiAhPT0gT3BlcmF0aW9uVHlwZS5VUERBVEUgfHwgIWlzU2FtZVR5cGVSZWYodHlwZVJlZiwgTWFpbEZvbGRlclR5cGVSZWYpKSByZXR1cm5cblx0XHQvLyBsb2FkIHRoZSBvbGQgdmVyc2lvbiBvZiB0aGUgZm9sZGVyIG5vdyB0byBjaGVjayBpZiBpdCB3YXMgbWlncmF0ZWQgdG8gbWFpbCBzZXRcblx0XHRjb25zdCBvbGRGb2xkZXIgPSBhd2FpdCB0aGlzLnN0b3JhZ2UuZ2V0KE1haWxGb2xkZXJUeXBlUmVmLCB1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkKVxuXHRcdC8vIGlmIGl0IGFscmVhZHkgaXMgYSBtYWlsIHNldCwgd2UncmUgZG9uZS5cblx0XHQvLyB3ZSBhbHNvIGRlbGV0ZSB0aGUgbWFpbHMgaW4gdGhlIGNhc2Ugd2hlcmUgd2UgZG9uJ3QgaGF2ZSB0aGUgZm9sZGVyIGl0c2VsZiBpbiB0aGUgY2FjaGUuXG5cdFx0Ly8gYmVjYXVzZSB3ZSBjYWNoZSBhZnRlciBsb2FkaW5nIHRoZSBmb2xkZXIsIHdlIHdvbid0IGRvIGl0IGFnYWluIG9uIHRoZSBuZXh0IHVwZGF0ZSBldmVudC5cblx0XHRpZiAob2xkRm9sZGVyICE9IG51bGwgJiYgb2xkRm9sZGVyLmlzTWFpbFNldCkgcmV0dXJuXG5cdFx0Y29uc3QgdXBkYXRlZEZvbGRlciA9IGF3YWl0IHRoaXMuZW50aXR5UmVzdENsaWVudC5sb2FkKE1haWxGb2xkZXJUeXBlUmVmLCBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pXG5cdFx0aWYgKCF1cGRhdGVkRm9sZGVyLmlzTWFpbFNldCkgcmV0dXJuXG5cdFx0YXdhaXQgdGhpcy5zdG9yYWdlLmRlbGV0ZVdob2xlTGlzdChNYWlsVHlwZVJlZiwgdXBkYXRlZEZvbGRlci5tYWlscylcblx0XHRhd2FpdCB0aGlzLnN0b3JhZ2UucHV0KHVwZGF0ZWRGb2xkZXIpXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgaWYgdGhlIGdpdmVuIHJlcXVlc3Qgc2hvdWxkIHVzZSB0aGUgY2FjaGVcblx0ICogQHBhcmFtIHR5cGVSZWYgdHlwZXJlZiBvZiB0aGUgdHlwZVxuXHQgKiBAcGFyYW0gb3B0cyBlbnRpdHkgcmVzdCBjbGllbnQgb3B0aW9ucywgaWYgYW55XG5cdCAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgY2FjaGUgY2FuIGJlIHVzZWQsIGZhbHNlIGlmIGEgZGlyZWN0IG5ldHdvcmsgcmVxdWVzdCBzaG91bGQgYmUgcGVyZm9ybWVkXG5cdCAqL1xuXHRwcml2YXRlIHNob3VsZFVzZUNhY2hlKHR5cGVSZWY6IFR5cGVSZWY8YW55Piwgb3B0cz86IEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyk6IGJvb2xlYW4ge1xuXHRcdC8vIHNvbWUgdHlwZXMgd29uJ3QgYmUgY2FjaGVkXG5cdFx0aWYgKGlzSWdub3JlZFR5cGUodHlwZVJlZikpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdC8vIGlmIGEgc3BlY2lmaWMgdmVyc2lvbiBpcyByZXF1ZXN0ZWQgd2UgaGF2ZSB0byBsb2FkIGFnYWluIGFuZCBkbyBub3Qgd2FudCB0byBzdG9yZSBpdCBpbiB0aGUgY2FjaGVcblx0XHRyZXR1cm4gb3B0cz8ucXVlcnlQYXJhbXM/LnZlcnNpb24gPT0gbnVsbFxuXHR9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIHRoZSBlcnJvciBpcyBleHBlY3RlZCBmb3IgdGhlIGNhc2VzIHdoZXJlIG91ciBsb2NhbCBzdGF0ZSBtaWdodCBub3QgYmUgdXAtdG8tZGF0ZSB3aXRoIHRoZSBzZXJ2ZXIgeWV0LiBFLmcuIHdlIG1pZ2h0IGJlIHByb2Nlc3NpbmcgYW4gdXBkYXRlXG4gKiBmb3IgdGhlIGluc3RhbmNlIHRoYXQgd2FzIGFscmVhZHkgZGVsZXRlZC4gTm9ybWFsbHkgdGhpcyB3b3VsZCBiZSBvcHRpbWl6ZWQgYXdheSBidXQgaXQgbWlnaHQgc3RpbGwgaGFwcGVuIGR1ZSB0byB0aW1pbmcuXG4gKi9cbmZ1bmN0aW9uIGlzRXhwZWN0ZWRFcnJvckZvclN5bmNocm9uaXphdGlvbihlOiBFcnJvcik6IGJvb2xlYW4ge1xuXHRyZXR1cm4gZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IgfHwgZSBpbnN0YW5jZW9mIE5vdEF1dGhvcml6ZWRFcnJvclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kSWQoaWQ6IElkIHwgSWRUdXBsZSk6IHsgbGlzdElkOiBJZCB8IG51bGw7IGVsZW1lbnRJZDogSWQgfSB7XG5cdGlmICh0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bGlzdElkOiBudWxsLFxuXHRcdFx0ZWxlbWVudElkOiBpZCxcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgW2xpc3RJZCwgZWxlbWVudElkXSA9IGlkXG5cdFx0cmV0dXJuIHtcblx0XHRcdGxpc3RJZCxcblx0XHRcdGVsZW1lbnRJZCxcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlSWQobGlzdElkOiBJZCB8IG51bGwsIGVsZW1lbnRJZDogSWQpOiBJZCB8IElkVHVwbGUge1xuXHRpZiAobGlzdElkICE9IG51bGwpIHtcblx0XHRyZXR1cm4gW2xpc3RJZCwgZWxlbWVudElkXVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBlbGVtZW50SWRcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VXBkYXRlSW5zdGFuY2VJZCh1cGRhdGU6IEVudGl0eVVwZGF0ZSk6IHsgaW5zdGFuY2VMaXN0SWQ6IElkIHwgbnVsbDsgaW5zdGFuY2VJZDogSWQgfSB7XG5cdGxldCBpbnN0YW5jZUxpc3RJZFxuXHRpZiAodXBkYXRlLmluc3RhbmNlTGlzdElkID09PSBcIlwiKSB7XG5cdFx0aW5zdGFuY2VMaXN0SWQgPSBudWxsXG5cdH0gZWxzZSB7XG5cdFx0aW5zdGFuY2VMaXN0SWQgPSB1cGRhdGUuaW5zdGFuY2VMaXN0SWRcblx0fVxuXHRyZXR1cm4geyBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZDogdXBkYXRlLmluc3RhbmNlSWQgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgcmFuZ2UgcmVxdWVzdCBiZWdpbnMgaW5zaWRlIGFuIGV4aXN0aW5nIHJhbmdlXG4gKi9cbmZ1bmN0aW9uIGlzU3RhcnRJZFdpdGhpblJhbmdlKHJhbmdlOiBSYW5nZSwgc3RhcnRJZDogSWQsIHR5cGVNb2RlbDogVHlwZU1vZGVsKTogYm9vbGVhbiB7XG5cdHJldHVybiAhZmlyc3RCaWdnZXJUaGFuU2Vjb25kKHN0YXJ0SWQsIHJhbmdlLnVwcGVyLCB0eXBlTW9kZWwpICYmICFmaXJzdEJpZ2dlclRoYW5TZWNvbmQocmFuZ2UubG93ZXIsIHN0YXJ0SWQsIHR5cGVNb2RlbClcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHJhbmdlIHJlcXVlc3QgaXMgZ29pbmcgYXdheSBmcm9tIGFuIGV4aXN0aW5nIHJhbmdlXG4gKiBBc3N1bWVzIHRoYXQgdGhlIHJhbmdlIHJlcXVlc3QgZG9lc24ndCBzdGFydCBpbnNpZGUgdGhlIHJhbmdlXG4gKi9cbmZ1bmN0aW9uIGlzUmFuZ2VSZXF1ZXN0QXdheUZyb21FeGlzdGluZ1JhbmdlKHJhbmdlOiBSYW5nZSwgcmV2ZXJzZTogYm9vbGVhbiwgc3RhcnQ6IHN0cmluZywgdHlwZU1vZGVsOiBUeXBlTW9kZWwpIHtcblx0cmV0dXJuIHJldmVyc2UgPyBmaXJzdEJpZ2dlclRoYW5TZWNvbmQocmFuZ2UubG93ZXIsIHN0YXJ0LCB0eXBlTW9kZWwpIDogZmlyc3RCaWdnZXJUaGFuU2Vjb25kKHN0YXJ0LCByYW5nZS51cHBlciwgdHlwZU1vZGVsKVxufVxuXG4vKipcbiAqIHNvbWUgdHlwZXMgYXJlIGNvbXBsZXRlbHkgaWdub3JlZCBieSB0aGUgY2FjaGUgYW5kIGFsd2F5cyBzZXJ2ZWQgZnJvbSBhIHJlcXVlc3QuXG4gKiBOb3RlOlxuICogaXNDYWNoZWRSYW5nZVR5cGUocmVmKSAtLS0+ICFpc0lnbm9yZWRUeXBlKHJlZikgYnV0XG4gKiBpc0lnbm9yZWRUeXBlKHJlZikgLS8tPiAhaXNDYWNoZWRSYW5nZVR5cGUocmVmKSBiZWNhdXNlIG9mIG9wdGVkLWluIEN1c3RvbUlkIHR5cGVzLlxuICovXG5mdW5jdGlvbiBpc0lnbm9yZWRUeXBlKHR5cGVSZWY6IFR5cGVSZWY8dW5rbm93bj4pOiBib29sZWFuIHtcblx0cmV0dXJuIHR5cGVSZWYuYXBwID09PSBcIm1vbml0b3JcIiB8fCBJR05PUkVEX1RZUEVTLnNvbWUoKHJlZikgPT4gaXNTYW1lVHlwZVJlZih0eXBlUmVmLCByZWYpKVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiBmb3IgdGhlIGdpdmVuIHR5cGUsIHRoYXQgY29udGFpbnMgYSBjdXN0b21JZCwgIGNhY2hpbmcgaXMgZW5hYmxlZC5cbiAqL1xuZnVuY3Rpb24gaXNDYWNoYWJsZUN1c3RvbUlkVHlwZSh0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+KTogYm9vbGVhbiB7XG5cdHJldHVybiBDQUNIRUFCTEVfQ1VTVE9NSURfVFlQRVMuc29tZSgocmVmKSA9PiBpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIHJlZikpXG59XG5cbi8qKlxuICogUmFuZ2VzIGZvciBjdXN0b21JZCB0eXBlcyBhcmUgbm9ybWFsbHkgbm90IGNhY2hlZCwgYnV0IHNvbWUgYXJlIG9wdGVkIGluLlxuICogTm90ZTpcbiAqIGlzQ2FjaGVkUmFuZ2VUeXBlKHJlZikgLS0tPiAhaXNJZ25vcmVkVHlwZShyZWYpIGJ1dFxuICogaXNJZ25vcmVkVHlwZShyZWYpIC0vLT4gIWlzQ2FjaGVkUmFuZ2VUeXBlKHJlZilcbiAqL1xuZnVuY3Rpb24gaXNDYWNoZWRSYW5nZVR5cGUodHlwZU1vZGVsOiBUeXBlTW9kZWwsIHR5cGVSZWY6IFR5cGVSZWY8dW5rbm93bj4pOiBib29sZWFuIHtcblx0cmV0dXJuICghaXNJZ25vcmVkVHlwZSh0eXBlUmVmKSAmJiBpc0dlbmVyYXRlZElkVHlwZSh0eXBlTW9kZWwpKSB8fCBpc0NhY2hhYmxlQ3VzdG9tSWRUeXBlKHR5cGVSZWYpXG59XG5cbmZ1bmN0aW9uIGlzR2VuZXJhdGVkSWRUeXBlKHR5cGVNb2RlbDogVHlwZU1vZGVsKTogYm9vbGVhbiB7XG5cdHJldHVybiB0eXBlTW9kZWwudmFsdWVzLl9pZC50eXBlID09PSBWYWx1ZVR5cGUuR2VuZXJhdGVkSWRcbn1cbiIsImltcG9ydCB7IFJlc3RDbGllbnQsIFN1c3BlbnNpb25CZWhhdmlvciB9IGZyb20gXCIuL1Jlc3RDbGllbnRcIlxuaW1wb3J0IHR5cGUgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vY3J5cHRvL0NyeXB0b0ZhY2FkZVwiXG5pbXBvcnQgeyBfdmVyaWZ5VHlwZSwgSHR0cE1ldGhvZCwgTWVkaWFUeXBlLCByZXNvbHZlVHlwZVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5RnVuY3Rpb25zXCJcbmltcG9ydCB7IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9TZXNzaW9uS2V5Tm90Rm91bmRFcnJvclwiXG5pbXBvcnQgdHlwZSB7IEVudGl0eVVwZGF0ZSB9IGZyb20gXCIuLi8uLi9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgUHVzaElkZW50aWZpZXJUeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRDb25uZWN0aW9uRXJyb3IsXG5cdEludGVybmFsU2VydmVyRXJyb3IsXG5cdE5vdEF1dGhlbnRpY2F0ZWRFcnJvcixcblx0Tm90QXV0aG9yaXplZEVycm9yLFxuXHROb3RGb3VuZEVycm9yLFxuXHRQYXlsb2FkVG9vTGFyZ2VFcnJvcixcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBsYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBpc1NhbWVUeXBlUmVmLCBNYXBwZXIsIG9mQ2xhc3MsIHByb21pc2VNYXAsIHNwbGl0SW5DaHVua3MsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydFdvcmtlck9yTm9kZSB9IGZyb20gXCIuLi8uLi9jb21tb24vRW52XCJcbmltcG9ydCB0eXBlIHsgTGlzdEVsZW1lbnRFbnRpdHksIFNvbWVFbnRpdHksIFR5cGVNb2RlbCB9IGZyb20gXCIuLi8uLi9jb21tb24vRW50aXR5VHlwZXNcIlxuaW1wb3J0IHsgZ2V0RWxlbWVudElkLCBMT0FEX01VTFRJUExFX0xJTUlULCBQT1NUX01VTFRJUExFX0xJTUlUIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9FbnRpdHlDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgU2V0dXBNdWx0aXBsZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9TZXR1cE11bHRpcGxlRXJyb3JcIlxuaW1wb3J0IHsgZXhwYW5kSWQgfSBmcm9tIFwiLi9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB7IEluc3RhbmNlTWFwcGVyIH0gZnJvbSBcIi4uL2NyeXB0by9JbnN0YW5jZU1hcHBlclwiXG5pbXBvcnQgeyBRdWV1ZWRCYXRjaCB9IGZyb20gXCIuLi9FdmVudFF1ZXVlLmpzXCJcbmltcG9ydCB7IEF1dGhEYXRhUHJvdmlkZXIgfSBmcm9tIFwiLi4vZmFjYWRlcy9Vc2VyRmFjYWRlXCJcbmltcG9ydCB7IExvZ2luSW5jb21wbGV0ZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9lcnJvci9Mb2dpbkluY29tcGxldGVFcnJvci5qc1wiXG5pbXBvcnQgeyBCbG9iU2VydmVyVXJsIH0gZnJvbSBcIi4uLy4uL2VudGl0aWVzL3N0b3JhZ2UvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQmxvYkFjY2Vzc1Rva2VuRmFjYWRlIH0gZnJvbSBcIi4uL2ZhY2FkZXMvQmxvYkFjY2Vzc1Rva2VuRmFjYWRlLmpzXCJcbmltcG9ydCB7IEFlc0tleSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtY3J5cHRvXCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB7IFZlcnNpb25lZEVuY3J5cHRlZEtleSwgVmVyc2lvbmVkS2V5IH0gZnJvbSBcIi4uL2NyeXB0by9DcnlwdG9XcmFwcGVyLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcblxuZXhwb3J0IGZ1bmN0aW9uIHR5cGVSZWZUb1BhdGgodHlwZVJlZjogVHlwZVJlZjxhbnk+KTogc3RyaW5nIHtcblx0cmV0dXJuIGAvcmVzdC8ke3R5cGVSZWYuYXBwfS8ke3R5cGVSZWYudHlwZS50b0xvd2VyQ2FzZSgpfWBcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbnRpdHlSZXN0Q2xpZW50U2V0dXBPcHRpb25zIHtcblx0YmFzZVVybD86IHN0cmluZ1xuXHQvKiogVXNlIHRoaXMga2V5IHRvIGVuY3J5cHQgc2Vzc2lvbiBrZXkgaW5zdGVhZCBvZiB0cnlpbmcgdG8gcmVzb2x2ZSB0aGUgb3duZXIga2V5IGJhc2VkIG9uIHRoZSBvd25lckdyb3VwLiAqL1xuXHRvd25lcktleT86IFZlcnNpb25lZEtleVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVudGl0eVJlc3RDbGllbnRVcGRhdGVPcHRpb25zIHtcblx0YmFzZVVybD86IHN0cmluZ1xuXHQvKiogVXNlIHRoZSBrZXkgcHJvdmlkZWQgYnkgdGhpcyB0byBkZWNyeXB0IHRoZSBleGlzdGluZyBvd25lckVuY1Nlc3Npb25LZXkgaW5zdGVhZCBvZiB0cnlpbmcgdG8gcmVzb2x2ZSB0aGUgb3duZXIga2V5IGJhc2VkIG9uIHRoZSBvd25lckdyb3VwLiAqL1xuXHRvd25lcktleVByb3ZpZGVyPzogT3duZXJLZXlQcm92aWRlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVudGl0eVJlc3RDbGllbnRFcmFzZU9wdGlvbnMge1xuXHRleHRyYUhlYWRlcnM/OiBEaWN0XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBob3cgdG8gaGFuZGxlIGNhY2hpbmcgYmVoYXZpb3IgKGkuZS4gcmVhZGluZy93cml0aW5nKS5cbiAqXG4gKiBVc2Uge0BsaW5rIGdldENhY2hlTW9kZUJlaGF2aW9yfSB0byBwcm9ncmFtbWF0aWNhbGx5IGNoZWNrIHRoZSBiZWhhdmlvciBvZiB0aGUgY2FjaGUgbW9kZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQ2FjaGVNb2RlIHtcblx0LyoqIFByZWZlciBjYWNoZWQgdmFsdWUgaWYgaXQncyB0aGVyZSwgb3IgZmFsbCBiYWNrIHRvIG5ldHdvcmsgYW5kIHdyaXRlIGl0IHRvIGNhY2hlLiAqL1xuXHRSZWFkQW5kV3JpdGUsXG5cblx0LyoqXG5cdCAqIEFsd2F5cyByZXRyaWV2ZSBmcm9tIHRoZSBuZXR3b3JrLCBidXQgc3RpbGwgc2F2ZSB0byBjYWNoZS5cblx0ICpcblx0ICogTk9URTogVGhpcyBjYW5ub3QgYmUgdXNlZCB3aXRoIHJhbmdlZCByZXF1ZXN0cy5cblx0ICovXG5cdFdyaXRlT25seSxcblxuXHQvKiogUHJlZmVyIGNhY2hlZCB2YWx1ZSwgYnV0IGluIGNhc2Ugb2YgYSBjYWNoZSBtaXNzLCByZXRyaWV2ZSB0aGUgdmFsdWUgZnJvbSBuZXR3b3JrIHdpdGhvdXQgd3JpdGluZyBpdCB0byBjYWNoZS4gKi9cblx0UmVhZE9ubHksXG59XG5cbi8qKlxuICogR2V0IHRoZSBiZWhhdmlvciBvZiB0aGUgY2FjaGUgbW9kZSBmb3IgdGhlIG9wdGlvbnNcbiAqIEBwYXJhbSBjYWNoZU1vZGUgY2FjaGUgbW9kZSB0byBjaGVjaywgb3IgaWYgYHVuZGVmaW5lZGAsIGNoZWNrIHRoZSBkZWZhdWx0IGNhY2hlIG1vZGUgKHtAbGluayBDYWNoZU1vZGUuUmVhZEFuZFdyaXRlfSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlTW9kZUJlaGF2aW9yKGNhY2hlTW9kZTogQ2FjaGVNb2RlIHwgdW5kZWZpbmVkKToge1xuXHRyZWFkc0Zyb21DYWNoZTogYm9vbGVhblxuXHR3cml0ZXNUb0NhY2hlOiBib29sZWFuXG59IHtcblx0c3dpdGNoIChjYWNoZU1vZGUgPz8gQ2FjaGVNb2RlLlJlYWRBbmRXcml0ZSkge1xuXHRcdGNhc2UgQ2FjaGVNb2RlLlJlYWRBbmRXcml0ZTpcblx0XHRcdHJldHVybiB7IHJlYWRzRnJvbUNhY2hlOiB0cnVlLCB3cml0ZXNUb0NhY2hlOiB0cnVlIH1cblx0XHRjYXNlIENhY2hlTW9kZS5Xcml0ZU9ubHk6XG5cdFx0XHRyZXR1cm4geyByZWFkc0Zyb21DYWNoZTogZmFsc2UsIHdyaXRlc1RvQ2FjaGU6IHRydWUgfVxuXHRcdGNhc2UgQ2FjaGVNb2RlLlJlYWRPbmx5OlxuXHRcdFx0cmV0dXJuIHsgcmVhZHNGcm9tQ2FjaGU6IHRydWUsIHdyaXRlc1RvQ2FjaGU6IGZhbHNlIH1cblx0fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyB7XG5cdHF1ZXJ5UGFyYW1zPzogRGljdFxuXHRleHRyYUhlYWRlcnM/OiBEaWN0XG5cdC8qKiBVc2UgdGhlIGtleSBwcm92aWRlZCBieSB0aGlzIHRvIGRlY3J5cHQgdGhlIGV4aXN0aW5nIG93bmVyRW5jU2Vzc2lvbktleSBpbnN0ZWFkIG9mIHRyeWluZyB0byByZXNvbHZlIHRoZSBvd25lciBrZXkgYmFzZWQgb24gdGhlIG93bmVyR3JvdXAuICovXG5cdG93bmVyS2V5UHJvdmlkZXI/OiBPd25lcktleVByb3ZpZGVyXG5cdC8qKiBEZWZhdWx0cyB0byB7QGxpbmsgQ2FjaGVNb2RlLlJlYWRBbmRXcml0ZSB9Ki9cblx0Y2FjaGVNb2RlPzogQ2FjaGVNb2RlXG5cdGJhc2VVcmw/OiBzdHJpbmdcblx0c3VzcGVuc2lvbkJlaGF2aW9yPzogU3VzcGVuc2lvbkJlaGF2aW9yXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIge1xuXHQoaW5zdGFuY2VFbGVtZW50SWQ6IElkKTogUHJvbWlzZTxWZXJzaW9uZWRFbmNyeXB0ZWRLZXk+XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3duZXJLZXlQcm92aWRlciB7XG5cdChvd25lcktleVZlcnNpb246IG51bWJlcik6IFByb21pc2U8QWVzS2V5PlxufVxuXG4vKipcbiAqIFRoZSBFbnRpdHlSZXN0SW50ZXJmYWNlIHByb3ZpZGVzIGEgY29udmVuaWVudCBpbnRlcmZhY2UgZm9yIGludm9raW5nIHNlcnZlciBzaWRlIFJFU1Qgc2VydmljZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRW50aXR5UmVzdEludGVyZmFjZSB7XG5cdC8qKlxuXHQgKiBSZWFkcyBhIHNpbmdsZSBlbGVtZW50IGZyb20gdGhlIHNlcnZlciAob3IgY2FjaGUpLiBFbnRpdGllcyBhcmUgZGVjcnlwdGVkIGJlZm9yZSB0aGV5IGFyZSByZXR1cm5lZC5cblx0ICogQHBhcmFtIG93bmVyS2V5IFVzZSB0aGlzIGtleSB0byBkZWNyeXB0IHNlc3Npb24ga2V5IGluc3RlYWQgb2YgdHJ5aW5nIHRvIHJlc29sdmUgdGhlIG93bmVyIGtleSBiYXNlZCBvbiB0aGUgb3duZXJHcm91cC5cblx0ICovXG5cdGxvYWQ8VCBleHRlbmRzIFNvbWVFbnRpdHk+KHR5cGVSZWY6IFR5cGVSZWY8VD4sIGlkOiBQcm9wZXJ0eVR5cGU8VCwgXCJfaWRcIj4sIGxvYWRPcHRpb25zPzogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zKTogUHJvbWlzZTxUPlxuXG5cdC8qKlxuXHQgKiBSZWFkcyBhIHJhbmdlIG9mIGVsZW1lbnRzIGZyb20gdGhlIHNlcnZlciAob3IgY2FjaGUpLiBFbnRpdGllcyBhcmUgZGVjcnlwdGVkIGJlZm9yZSB0aGV5IGFyZSByZXR1cm5lZC5cblx0ICovXG5cdGxvYWRSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KFxuXHRcdHR5cGVSZWY6IFR5cGVSZWY8VD4sXG5cdFx0bGlzdElkOiBJZCxcblx0XHRzdGFydDogSWQsXG5cdFx0Y291bnQ6IG51bWJlcixcblx0XHRyZXZlcnNlOiBib29sZWFuLFxuXHRcdGxvYWRPcHRpb25zPzogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zLFxuXHQpOiBQcm9taXNlPFRbXT5cblxuXHQvKipcblx0ICogUmVhZHMgbXVsdGlwbGUgZWxlbWVudHMgZnJvbSB0aGUgc2VydmVyIChvciBjYWNoZSkuIEVudGl0aWVzIGFyZSBkZWNyeXB0ZWQgYmVmb3JlIHRoZXkgYXJlIHJldHVybmVkLlxuXHQgKiBAcGFyYW0gb3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIgdXNlIHRoaXMgdG8gcmVzb2x2ZSB0aGUgaW5zdGFuY2VzIHNlc3Npb24ga2V5IGluIGNhc2UgaW5zdGFuY2Uub3duZXJFbmNTZXNzaW9uS2V5IGlzIG5vdCBkZWZpbmVkICh3aGljaCBtaWdodCBiZSB1bmRlZmluZWQgZm9yIE1haWxEZXRhaWxzIC8gRmlsZXMpXG5cdCAqL1xuXHRsb2FkTXVsdGlwbGU8VCBleHRlbmRzIFNvbWVFbnRpdHk+KFxuXHRcdHR5cGVSZWY6IFR5cGVSZWY8VD4sXG5cdFx0bGlzdElkOiBJZCB8IG51bGwsXG5cdFx0ZWxlbWVudElkczogQXJyYXk8SWQ+LFxuXHRcdG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyPzogT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIsXG5cdFx0bG9hZE9wdGlvbnM/OiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMsXG5cdCk6IFByb21pc2U8QXJyYXk8VD4+XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBzaW5nbGUgZWxlbWVudCBvbiB0aGUgc2VydmVyLiBFbnRpdGllcyBhcmUgZW5jcnlwdGVkIGJlZm9yZSB0aGV5IGFyZSBzZW50LlxuXHQgKi9cblx0c2V0dXA8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGxpc3RJZDogSWQgfCBudWxsLCBpbnN0YW5jZTogVCwgZXh0cmFIZWFkZXJzPzogRGljdCwgb3B0aW9ucz86IEVudGl0eVJlc3RDbGllbnRTZXR1cE9wdGlvbnMpOiBQcm9taXNlPElkPlxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIG11bHRpcGxlIGVsZW1lbnRzIG9uIHRoZSBzZXJ2ZXIuIEVudGl0aWVzIGFyZSBlbmNyeXB0ZWQgYmVmb3JlIHRoZXkgYXJlIHNlbnQuXG5cdCAqL1xuXHRzZXR1cE11bHRpcGxlPFQgZXh0ZW5kcyBTb21lRW50aXR5PihsaXN0SWQ6IElkIHwgbnVsbCwgaW5zdGFuY2VzOiBSZWFkb25seUFycmF5PFQ+KTogUHJvbWlzZTxBcnJheTxJZD4+XG5cblx0LyoqXG5cdCAqIE1vZGlmaWVzIGEgc2luZ2xlIGVsZW1lbnQgb24gdGhlIHNlcnZlci4gRW50aXRpZXMgYXJlIGVuY3J5cHRlZCBiZWZvcmUgdGhleSBhcmUgc2VudC5cblx0ICogQHBhcmFtIGluc3RhbmNlXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHR1cGRhdGU8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGluc3RhbmNlOiBULCBvcHRpb25zPzogRW50aXR5UmVzdENsaWVudFVwZGF0ZU9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqXG5cdCAqIERlbGV0ZXMgYSBzaW5nbGUgZWxlbWVudCBvbiB0aGUgc2VydmVyLlxuXHQgKi9cblx0ZXJhc2U8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGluc3RhbmNlOiBULCBvcHRpb25zPzogRW50aXR5UmVzdENsaWVudEVyYXNlT3B0aW9ucyk6IFByb21pc2U8dm9pZD5cblxuXHQvKipcblx0ICogTXVzdCBiZSBjYWxsZWQgd2hlbiBlbnRpdHkgZXZlbnRzIGFyZSByZWNlaXZlZC5cblx0ICogQHBhcmFtIGJhdGNoIFRoZSBlbnRpdHkgZXZlbnRzIHRoYXQgd2VyZSByZWNlaXZlZC5cblx0ICogQHJldHVybiBTaW1pbGFyIHRvIHRoZSBldmVudHMgaW4gdGhlIGRhdGEgcGFyYW1ldGVyLCBidXQgcmVkdWNlZCBieSB0aGUgZXZlbnRzIHdoaWNoIGFyZSBvYnNvbGV0ZS5cblx0ICovXG5cdGVudGl0eUV2ZW50c1JlY2VpdmVkKGJhdGNoOiBRdWV1ZWRCYXRjaCk6IFByb21pc2U8QXJyYXk8RW50aXR5VXBkYXRlPj5cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGluc3RhbmNlcyBmcm9tIHRoZSBiYWNrZW5kIChkYikgYW5kIGNvbnZlcnRzIHRoZW0gdG8gZW50aXRpZXMuXG4gKlxuICogUGFydCBvZiB0aGlzIHByb2Nlc3MgaXNcbiAqICogdGhlIGRlY3J5cHRpb24gZm9yIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgKEdFVCkgYW5kIHRoZSBlbmNyeXB0aW9uIG9mIGFsbCBpbnN0YW5jZXMgYmVmb3JlIHRoZXkgYXJlIHNlbnQgKFBPU1QsIFBVVClcbiAqICogdGhlIGluamVjdGlvbiBvZiBhZ2dyZWdhdGUgaW5zdGFuY2VzIGZvciB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIChHRVQpXG4gKiAqIGNhY2hpbmcgZm9yIHJldHJpZXZlZCBpbnN0YW5jZXMgKEdFVClcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBFbnRpdHlSZXN0Q2xpZW50IGltcGxlbWVudHMgRW50aXR5UmVzdEludGVyZmFjZSB7XG5cdGdldCBfY3J5cHRvKCk6IENyeXB0b0ZhY2FkZSB7XG5cdFx0cmV0dXJuIHRoaXMubGF6eUNyeXB0bygpXG5cdH1cblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGF1dGhEYXRhUHJvdmlkZXI6IEF1dGhEYXRhUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSByZXN0Q2xpZW50OiBSZXN0Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbGF6eUNyeXB0bzogbGF6eTxDcnlwdG9GYWNhZGU+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYmxvYkFjY2Vzc1Rva2VuRmFjYWRlOiBCbG9iQWNjZXNzVG9rZW5GYWNhZGUsXG5cdCkge31cblxuXHRhc3luYyBsb2FkPFQgZXh0ZW5kcyBTb21lRW50aXR5Pih0eXBlUmVmOiBUeXBlUmVmPFQ+LCBpZDogUHJvcGVydHlUeXBlPFQsIFwiX2lkXCI+LCBvcHRzOiBFbnRpdHlSZXN0Q2xpZW50TG9hZE9wdGlvbnMgPSB7fSk6IFByb21pc2U8VD4ge1xuXHRcdGNvbnN0IHsgbGlzdElkLCBlbGVtZW50SWQgfSA9IGV4cGFuZElkKGlkKVxuXHRcdGNvbnN0IHsgcGF0aCwgcXVlcnlQYXJhbXMsIGhlYWRlcnMsIHR5cGVNb2RlbCB9ID0gYXdhaXQgdGhpcy5fdmFsaWRhdGVBbmRQcmVwYXJlUmVzdFJlcXVlc3QoXG5cdFx0XHR0eXBlUmVmLFxuXHRcdFx0bGlzdElkLFxuXHRcdFx0ZWxlbWVudElkLFxuXHRcdFx0b3B0cy5xdWVyeVBhcmFtcyxcblx0XHRcdG9wdHMuZXh0cmFIZWFkZXJzLFxuXHRcdFx0b3B0cy5vd25lcktleVByb3ZpZGVyLFxuXHRcdClcblx0XHRjb25zdCBqc29uID0gYXdhaXQgdGhpcy5yZXN0Q2xpZW50LnJlcXVlc3QocGF0aCwgSHR0cE1ldGhvZC5HRVQsIHtcblx0XHRcdHF1ZXJ5UGFyYW1zLFxuXHRcdFx0aGVhZGVycyxcblx0XHRcdHJlc3BvbnNlVHlwZTogTWVkaWFUeXBlLkpzb24sXG5cdFx0XHRiYXNlVXJsOiBvcHRzLmJhc2VVcmwsXG5cdFx0fSlcblx0XHRjb25zdCBlbnRpdHkgPSBKU09OLnBhcnNlKGpzb24pXG5cdFx0Y29uc3QgbWlncmF0ZWRFbnRpdHkgPSBhd2FpdCB0aGlzLl9jcnlwdG8uYXBwbHlNaWdyYXRpb25zKHR5cGVSZWYsIGVudGl0eSlcblx0XHRjb25zdCBzZXNzaW9uS2V5ID0gYXdhaXQgdGhpcy5yZXNvbHZlU2Vzc2lvbktleShvcHRzLm93bmVyS2V5UHJvdmlkZXIsIG1pZ3JhdGVkRW50aXR5LCB0eXBlTW9kZWwpXG5cblx0XHRjb25zdCBpbnN0YW5jZSA9IGF3YWl0IHRoaXMuaW5zdGFuY2VNYXBwZXIuZGVjcnlwdEFuZE1hcFRvSW5zdGFuY2U8VD4odHlwZU1vZGVsLCBtaWdyYXRlZEVudGl0eSwgc2Vzc2lvbktleSlcblx0XHRyZXR1cm4gdGhpcy5fY3J5cHRvLmFwcGx5TWlncmF0aW9uc0Zvckluc3RhbmNlKGluc3RhbmNlKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyByZXNvbHZlU2Vzc2lvbktleShvd25lcktleVByb3ZpZGVyOiBPd25lcktleVByb3ZpZGVyIHwgdW5kZWZpbmVkLCBtaWdyYXRlZEVudGl0eTogUmVjb3JkPHN0cmluZywgYW55PiwgdHlwZU1vZGVsOiBUeXBlTW9kZWwpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKG93bmVyS2V5UHJvdmlkZXIgJiYgbWlncmF0ZWRFbnRpdHkuX293bmVyRW5jU2Vzc2lvbktleSkge1xuXHRcdFx0XHRjb25zdCBvd25lcktleSA9IGF3YWl0IG93bmVyS2V5UHJvdmlkZXIoTnVtYmVyKG1pZ3JhdGVkRW50aXR5Ll9vd25lcktleVZlcnNpb24gPz8gMCkpXG5cdFx0XHRcdHJldHVybiB0aGlzLl9jcnlwdG8ucmVzb2x2ZVNlc3Npb25LZXlXaXRoT3duZXJLZXkobWlncmF0ZWRFbnRpdHksIG93bmVyS2V5KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuX2NyeXB0by5yZXNvbHZlU2Vzc2lvbktleSh0eXBlTW9kZWwsIG1pZ3JhdGVkRW50aXR5KVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgU2Vzc2lvbktleU5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYGNvdWxkIG5vdCByZXNvbHZlIHNlc3Npb24ga2V5IGZvciBpbnN0YW5jZSBvZiB0eXBlICR7dHlwZU1vZGVsLmFwcH0vJHt0eXBlTW9kZWwubmFtZX1gLCBlKVxuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGxvYWRSYW5nZTxUIGV4dGVuZHMgTGlzdEVsZW1lbnRFbnRpdHk+KFxuXHRcdHR5cGVSZWY6IFR5cGVSZWY8VD4sXG5cdFx0bGlzdElkOiBJZCxcblx0XHRzdGFydDogSWQsXG5cdFx0Y291bnQ6IG51bWJlcixcblx0XHRyZXZlcnNlOiBib29sZWFuLFxuXHRcdG9wdHM6IEVudGl0eVJlc3RDbGllbnRMb2FkT3B0aW9ucyA9IHt9LFxuXHQpOiBQcm9taXNlPFRbXT4ge1xuXHRcdGNvbnN0IHJhbmdlUmVxdWVzdFBhcmFtcyA9IHtcblx0XHRcdHN0YXJ0OiBTdHJpbmcoc3RhcnQpLFxuXHRcdFx0Y291bnQ6IFN0cmluZyhjb3VudCksXG5cdFx0XHRyZXZlcnNlOiBTdHJpbmcocmV2ZXJzZSksXG5cdFx0fVxuXHRcdGNvbnN0IHsgcGF0aCwgaGVhZGVycywgdHlwZU1vZGVsLCBxdWVyeVBhcmFtcyB9ID0gYXdhaXQgdGhpcy5fdmFsaWRhdGVBbmRQcmVwYXJlUmVzdFJlcXVlc3QoXG5cdFx0XHR0eXBlUmVmLFxuXHRcdFx0bGlzdElkLFxuXHRcdFx0bnVsbCxcblx0XHRcdE9iamVjdC5hc3NpZ24ocmFuZ2VSZXF1ZXN0UGFyYW1zLCBvcHRzLnF1ZXJ5UGFyYW1zKSxcblx0XHRcdG9wdHMuZXh0cmFIZWFkZXJzLFxuXHRcdFx0b3B0cy5vd25lcktleVByb3ZpZGVyLFxuXHRcdClcblx0XHQvLyBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4gaWYgdHlwZSBjaGVja2luZyBpcyBub3QgYnlwYXNzZWQgd2l0aCBhbnlcblx0XHRpZiAodHlwZU1vZGVsLnR5cGUgIT09IFR5cGUuTGlzdEVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihcIm9ubHkgTGlzdEVsZW1lbnQgdHlwZXMgYXJlIHBlcm1pdHRlZFwiKVxuXHRcdGNvbnN0IGpzb24gPSBhd2FpdCB0aGlzLnJlc3RDbGllbnQucmVxdWVzdChwYXRoLCBIdHRwTWV0aG9kLkdFVCwge1xuXHRcdFx0cXVlcnlQYXJhbXMsXG5cdFx0XHRoZWFkZXJzLFxuXHRcdFx0cmVzcG9uc2VUeXBlOiBNZWRpYVR5cGUuSnNvbixcblx0XHRcdGJhc2VVcmw6IG9wdHMuYmFzZVVybCxcblx0XHRcdHN1c3BlbnNpb25CZWhhdmlvcjogb3B0cy5zdXNwZW5zaW9uQmVoYXZpb3IsXG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5faGFuZGxlTG9hZE11bHRpcGxlUmVzdWx0KHR5cGVSZWYsIEpTT04ucGFyc2UoanNvbikpXG5cdH1cblxuXHRhc3luYyBsb2FkTXVsdGlwbGU8VCBleHRlbmRzIFNvbWVFbnRpdHk+KFxuXHRcdHR5cGVSZWY6IFR5cGVSZWY8VD4sXG5cdFx0bGlzdElkOiBJZCB8IG51bGwsXG5cdFx0ZWxlbWVudElkczogQXJyYXk8SWQ+LFxuXHRcdG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyPzogT3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIsXG5cdFx0b3B0czogRW50aXR5UmVzdENsaWVudExvYWRPcHRpb25zID0ge30sXG5cdCk6IFByb21pc2U8QXJyYXk8VD4+IHtcblx0XHRjb25zdCB7IHBhdGgsIGhlYWRlcnMgfSA9IGF3YWl0IHRoaXMuX3ZhbGlkYXRlQW5kUHJlcGFyZVJlc3RSZXF1ZXN0KHR5cGVSZWYsIGxpc3RJZCwgbnVsbCwgb3B0cy5xdWVyeVBhcmFtcywgb3B0cy5leHRyYUhlYWRlcnMsIG9wdHMub3duZXJLZXlQcm92aWRlcilcblx0XHRjb25zdCBpZENodW5rcyA9IHNwbGl0SW5DaHVua3MoTE9BRF9NVUxUSVBMRV9MSU1JVCwgZWxlbWVudElkcylcblx0XHRjb25zdCB0eXBlTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXG5cdFx0Y29uc3QgbG9hZGVkQ2h1bmtzID0gYXdhaXQgcHJvbWlzZU1hcChpZENodW5rcywgYXN5bmMgKGlkQ2h1bmspID0+IHtcblx0XHRcdGxldCBxdWVyeVBhcmFtcyA9IHtcblx0XHRcdFx0aWRzOiBpZENodW5rLmpvaW4oXCIsXCIpLFxuXHRcdFx0fVxuXHRcdFx0bGV0IGpzb246IHN0cmluZ1xuXHRcdFx0aWYgKHR5cGVNb2RlbC50eXBlID09PSBUeXBlLkJsb2JFbGVtZW50KSB7XG5cdFx0XHRcdGpzb24gPSBhd2FpdCB0aGlzLmxvYWRNdWx0aXBsZUJsb2JFbGVtZW50cyhsaXN0SWQsIHF1ZXJ5UGFyYW1zLCBoZWFkZXJzLCBwYXRoLCB0eXBlUmVmLCBvcHRzLnN1c3BlbnNpb25CZWhhdmlvcilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzb24gPSBhd2FpdCB0aGlzLnJlc3RDbGllbnQucmVxdWVzdChwYXRoLCBIdHRwTWV0aG9kLkdFVCwge1xuXHRcdFx0XHRcdHF1ZXJ5UGFyYW1zLFxuXHRcdFx0XHRcdGhlYWRlcnMsXG5cdFx0XHRcdFx0cmVzcG9uc2VUeXBlOiBNZWRpYVR5cGUuSnNvbixcblx0XHRcdFx0XHRiYXNlVXJsOiBvcHRzLmJhc2VVcmwsXG5cdFx0XHRcdFx0c3VzcGVuc2lvbkJlaGF2aW9yOiBvcHRzLnN1c3BlbnNpb25CZWhhdmlvcixcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzLl9oYW5kbGVMb2FkTXVsdGlwbGVSZXN1bHQodHlwZVJlZiwgSlNPTi5wYXJzZShqc29uKSwgb3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIpXG5cdFx0fSlcblx0XHRyZXR1cm4gbG9hZGVkQ2h1bmtzLmZsYXQoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkTXVsdGlwbGVCbG9iRWxlbWVudHMoXG5cdFx0YXJjaGl2ZUlkOiBJZCB8IG51bGwsXG5cdFx0cXVlcnlQYXJhbXM6IHsgaWRzOiBzdHJpbmcgfSxcblx0XHRoZWFkZXJzOiBEaWN0IHwgdW5kZWZpbmVkLFxuXHRcdHBhdGg6IHN0cmluZyxcblx0XHR0eXBlUmVmOiBUeXBlUmVmPGFueT4sXG5cdFx0c3VzcGVuc2lvbkJlaGF2aW9yPzogU3VzcGVuc2lvbkJlaGF2aW9yLFxuXHQpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGlmIChhcmNoaXZlSWQgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiYXJjaGl2ZUlkIG11c3QgYmUgc2V0IHRvIGxvYWQgQmxvYkVsZW1lbnRUeXBlc1wiKVxuXHRcdH1cblx0XHRjb25zdCBkb0Jsb2JSZXF1ZXN0ID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc3QgYmxvYlNlcnZlckFjY2Vzc0luZm8gPSBhd2FpdCB0aGlzLmJsb2JBY2Nlc3NUb2tlbkZhY2FkZS5yZXF1ZXN0UmVhZFRva2VuQXJjaGl2ZShhcmNoaXZlSWQpXG5cdFx0XHRjb25zdCBhZGRpdGlvbmFsUmVxdWVzdFBhcmFtcyA9IE9iamVjdC5hc3NpZ24oXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHRoZWFkZXJzLCAvLyBwcmV2ZW50IENPUlMgcmVxdWVzdCBkdWUgdG8gbm9uIHN0YW5kYXJkIGhlYWRlciB1c2FnZVxuXHRcdFx0XHRxdWVyeVBhcmFtcyxcblx0XHRcdClcblx0XHRcdGNvbnN0IGFsbFBhcmFtcyA9IGF3YWl0IHRoaXMuYmxvYkFjY2Vzc1Rva2VuRmFjYWRlLmNyZWF0ZVF1ZXJ5UGFyYW1zKGJsb2JTZXJ2ZXJBY2Nlc3NJbmZvLCBhZGRpdGlvbmFsUmVxdWVzdFBhcmFtcywgdHlwZVJlZilcblx0XHRcdHJldHVybiB0cnlTZXJ2ZXJzKFxuXHRcdFx0XHRibG9iU2VydmVyQWNjZXNzSW5mby5zZXJ2ZXJzLFxuXHRcdFx0XHRhc3luYyAoc2VydmVyVXJsKSA9PlxuXHRcdFx0XHRcdHRoaXMucmVzdENsaWVudC5yZXF1ZXN0KHBhdGgsIEh0dHBNZXRob2QuR0VULCB7XG5cdFx0XHRcdFx0XHRxdWVyeVBhcmFtczogYWxsUGFyYW1zLFxuXHRcdFx0XHRcdFx0aGVhZGVyczoge30sIC8vIHByZXZlbnQgQ09SUyByZXF1ZXN0IGR1ZSB0byBub24gc3RhbmRhcmQgaGVhZGVyIHVzYWdlXG5cdFx0XHRcdFx0XHRyZXNwb25zZVR5cGU6IE1lZGlhVHlwZS5Kc29uLFxuXHRcdFx0XHRcdFx0YmFzZVVybDogc2VydmVyVXJsLFxuXHRcdFx0XHRcdFx0bm9DT1JTOiB0cnVlLFxuXHRcdFx0XHRcdFx0c3VzcGVuc2lvbkJlaGF2aW9yLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRgY2FuJ3QgbG9hZCBpbnN0YW5jZXMgZnJvbSBzZXJ2ZXIgYCxcblx0XHRcdClcblx0XHR9XG5cdFx0Y29uc3QgZG9FdmljdFRva2VuID0gKCkgPT4gdGhpcy5ibG9iQWNjZXNzVG9rZW5GYWNhZGUuZXZpY3RBcmNoaXZlVG9rZW4oYXJjaGl2ZUlkKVxuXG5cdFx0cmV0dXJuIGRvQmxvYlJlcXVlc3RXaXRoUmV0cnkoZG9CbG9iUmVxdWVzdCwgZG9FdmljdFRva2VuKVxuXHR9XG5cblx0YXN5bmMgX2hhbmRsZUxvYWRNdWx0aXBsZVJlc3VsdDxUIGV4dGVuZHMgU29tZUVudGl0eT4oXG5cdFx0dHlwZVJlZjogVHlwZVJlZjxUPixcblx0XHRsb2FkZWRFbnRpdGllczogQXJyYXk8YW55Pixcblx0XHRvd25lckVuY1Nlc3Npb25LZXlQcm92aWRlcj86IE93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyLFxuXHQpOiBQcm9taXNlPEFycmF5PFQ+PiB7XG5cdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZSh0eXBlUmVmKVxuXG5cdFx0Ly8gUHVzaElkZW50aWZpZXIgd2FzIGNoYW5nZWQgaW4gdGhlIHN5c3RlbSBtb2RlbCB2NDMgdG8gZW5jcnlwdCB0aGUgbmFtZS5cblx0XHQvLyBXZSBjaGVjayBoZXJlIHRvIGNoZWNrIHRoZSB0eXBlIG9ubHkgb25jZSBwZXIgYXJyYXkgYW5kIG5vdCBmb3IgZWFjaCBlbGVtZW50LlxuXHRcdGlmIChpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIFB1c2hJZGVudGlmaWVyVHlwZVJlZikpIHtcblx0XHRcdGF3YWl0IHByb21pc2VNYXAobG9hZGVkRW50aXRpZXMsIChpbnN0YW5jZSkgPT4gdGhpcy5fY3J5cHRvLmFwcGx5TWlncmF0aW9ucyh0eXBlUmVmLCBpbnN0YW5jZSksIHtcblx0XHRcdFx0Y29uY3VycmVuY3k6IDUsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBwcm9taXNlTWFwKFxuXHRcdFx0bG9hZGVkRW50aXRpZXMsXG5cdFx0XHQoaW5zdGFuY2UpID0+IHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2RlY3J5cHRNYXBBbmRNaWdyYXRlKGluc3RhbmNlLCBtb2RlbCwgb3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIpXG5cdFx0XHR9LFxuXHRcdFx0eyBjb25jdXJyZW5jeTogNSB9LFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIF9kZWNyeXB0TWFwQW5kTWlncmF0ZTxUPihpbnN0YW5jZTogYW55LCBtb2RlbDogVHlwZU1vZGVsLCBvd25lckVuY1Nlc3Npb25LZXlQcm92aWRlcj86IE93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyKTogUHJvbWlzZTxUPiB7XG5cdFx0bGV0IHNlc3Npb25LZXk6IEFlc0tleSB8IG51bGxcblx0XHRpZiAob3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIpIHtcblx0XHRcdHNlc3Npb25LZXkgPSBhd2FpdCB0aGlzLl9jcnlwdG8uZGVjcnlwdFNlc3Npb25LZXkoaW5zdGFuY2UsIGF3YWl0IG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyKGdldEVsZW1lbnRJZChpbnN0YW5jZSkpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzZXNzaW9uS2V5ID0gYXdhaXQgdGhpcy5fY3J5cHRvLnJlc29sdmVTZXNzaW9uS2V5KG1vZGVsLCBpbnN0YW5jZSlcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBTZXNzaW9uS2V5Tm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbm90IHJlc29sdmUgc2Vzc2lvbiBrZXlcIiwgZSwgZS5tZXNzYWdlLCBlLnN0YWNrKVxuXHRcdFx0XHRcdHNlc3Npb25LZXkgPSBudWxsIC8vIHdpbGwgcmVzdWx0IGluIF9lcnJvcnMgYmVpbmcgc2V0IG9uIHRoZSBpbnN0YW5jZVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRjb25zdCBkZWNyeXB0ZWRJbnN0YW5jZSA9IGF3YWl0IHRoaXMuaW5zdGFuY2VNYXBwZXIuZGVjcnlwdEFuZE1hcFRvSW5zdGFuY2U8VD4obW9kZWwsIGluc3RhbmNlLCBzZXNzaW9uS2V5KVxuXHRcdHJldHVybiB0aGlzLl9jcnlwdG8uYXBwbHlNaWdyYXRpb25zRm9ySW5zdGFuY2U8VD4oZGVjcnlwdGVkSW5zdGFuY2UpXG5cdH1cblxuXHRhc3luYyBzZXR1cDxUIGV4dGVuZHMgU29tZUVudGl0eT4obGlzdElkOiBJZCB8IG51bGwsIGluc3RhbmNlOiBULCBleHRyYUhlYWRlcnM/OiBEaWN0LCBvcHRpb25zPzogRW50aXR5UmVzdENsaWVudFNldHVwT3B0aW9ucyk6IFByb21pc2U8SWQ+IHtcblx0XHRjb25zdCB0eXBlUmVmID0gaW5zdGFuY2UuX3R5cGVcblx0XHRjb25zdCB7IHR5cGVNb2RlbCwgcGF0aCwgaGVhZGVycywgcXVlcnlQYXJhbXMgfSA9IGF3YWl0IHRoaXMuX3ZhbGlkYXRlQW5kUHJlcGFyZVJlc3RSZXF1ZXN0KFxuXHRcdFx0dHlwZVJlZixcblx0XHRcdGxpc3RJZCxcblx0XHRcdG51bGwsXG5cdFx0XHR1bmRlZmluZWQsXG5cdFx0XHRleHRyYUhlYWRlcnMsXG5cdFx0XHRvcHRpb25zPy5vd25lcktleSxcblx0XHQpXG5cblx0XHRpZiAodHlwZU1vZGVsLnR5cGUgPT09IFR5cGUuTGlzdEVsZW1lbnQpIHtcblx0XHRcdGlmICghbGlzdElkKSB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGlkIG11c3QgYmUgZGVmaW5lZCBmb3IgTEVUc1wiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAobGlzdElkKSB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGlkIG11c3Qgbm90IGJlIGRlZmluZWQgZm9yIEVUc1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IHNrID0gYXdhaXQgdGhpcy5fY3J5cHRvLnNldE5ld093bmVyRW5jU2Vzc2lvbktleSh0eXBlTW9kZWwsIGluc3RhbmNlLCBvcHRpb25zPy5vd25lcktleSlcblxuXHRcdGNvbnN0IGVuY3J5cHRlZEVudGl0eSA9IGF3YWl0IHRoaXMuaW5zdGFuY2VNYXBwZXIuZW5jcnlwdEFuZE1hcFRvTGl0ZXJhbCh0eXBlTW9kZWwsIGluc3RhbmNlLCBzaylcblx0XHRjb25zdCBwZXJzaXN0ZW5jZVBvc3RSZXR1cm4gPSBhd2FpdCB0aGlzLnJlc3RDbGllbnQucmVxdWVzdChwYXRoLCBIdHRwTWV0aG9kLlBPU1QsIHtcblx0XHRcdGJhc2VVcmw6IG9wdGlvbnM/LmJhc2VVcmwsXG5cdFx0XHRxdWVyeVBhcmFtcyxcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRib2R5OiBKU09OLnN0cmluZ2lmeShlbmNyeXB0ZWRFbnRpdHkpLFxuXHRcdFx0cmVzcG9uc2VUeXBlOiBNZWRpYVR5cGUuSnNvbixcblx0XHR9KVxuXHRcdHJldHVybiBKU09OLnBhcnNlKHBlcnNpc3RlbmNlUG9zdFJldHVybikuZ2VuZXJhdGVkSWRcblx0fVxuXG5cdGFzeW5jIHNldHVwTXVsdGlwbGU8VCBleHRlbmRzIFNvbWVFbnRpdHk+KGxpc3RJZDogSWQgfCBudWxsLCBpbnN0YW5jZXM6IEFycmF5PFQ+KTogUHJvbWlzZTxBcnJheTxJZD4+IHtcblx0XHRjb25zdCBjb3VudCA9IGluc3RhbmNlcy5sZW5ndGhcblxuXHRcdGlmIChjb3VudCA8IDEpIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblxuXHRcdGNvbnN0IGluc3RhbmNlQ2h1bmtzID0gc3BsaXRJbkNodW5rcyhQT1NUX01VTFRJUExFX0xJTUlULCBpbnN0YW5jZXMpXG5cdFx0Y29uc3QgdHlwZVJlZiA9IGluc3RhbmNlc1swXS5fdHlwZVxuXHRcdGNvbnN0IHsgdHlwZU1vZGVsLCBwYXRoLCBoZWFkZXJzIH0gPSBhd2FpdCB0aGlzLl92YWxpZGF0ZUFuZFByZXBhcmVSZXN0UmVxdWVzdCh0eXBlUmVmLCBsaXN0SWQsIG51bGwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblx0XHRpZiAodHlwZU1vZGVsLnR5cGUgPT09IFR5cGUuTGlzdEVsZW1lbnQpIHtcblx0XHRcdGlmICghbGlzdElkKSB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGlkIG11c3QgYmUgZGVmaW5lZCBmb3IgTEVUc1wiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAobGlzdElkKSB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGlkIG11c3Qgbm90IGJlIGRlZmluZWQgZm9yIEVUc1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IGVycm9yczogRXJyb3JbXSA9IFtdXG5cdFx0Y29uc3QgZmFpbGVkSW5zdGFuY2VzOiBUW10gPSBbXVxuXHRcdGNvbnN0IGlkQ2h1bmtzOiBBcnJheTxBcnJheTxJZD4+ID0gYXdhaXQgcHJvbWlzZU1hcChpbnN0YW5jZUNodW5rcywgYXN5bmMgKGluc3RhbmNlQ2h1bmspID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGVuY3J5cHRlZEVudGl0aWVzID0gYXdhaXQgcHJvbWlzZU1hcChpbnN0YW5jZUNodW5rLCBhc3luYyAoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHNrID0gYXdhaXQgdGhpcy5fY3J5cHRvLnNldE5ld093bmVyRW5jU2Vzc2lvbktleSh0eXBlTW9kZWwsIGUpXG5cblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5pbnN0YW5jZU1hcHBlci5lbmNyeXB0QW5kTWFwVG9MaXRlcmFsKHR5cGVNb2RlbCwgZSwgc2spXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC8vIGluZm9ybXMgdGhlIHNlcnZlciB0aGF0IHRoaXMgaXMgYSBQT1NUX01VTFRJUExFIHJlcXVlc3Rcblx0XHRcdFx0Y29uc3QgcXVlcnlQYXJhbXMgPSB7XG5cdFx0XHRcdFx0Y291bnQ6IFN0cmluZyhpbnN0YW5jZUNodW5rLmxlbmd0aCksXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgcGVyc2lzdGVuY2VQb3N0UmV0dXJuID0gYXdhaXQgdGhpcy5yZXN0Q2xpZW50LnJlcXVlc3QocGF0aCwgSHR0cE1ldGhvZC5QT1NULCB7XG5cdFx0XHRcdFx0cXVlcnlQYXJhbXMsXG5cdFx0XHRcdFx0aGVhZGVycyxcblx0XHRcdFx0XHRib2R5OiBKU09OLnN0cmluZ2lmeShlbmNyeXB0ZWRFbnRpdGllcyksXG5cdFx0XHRcdFx0cmVzcG9uc2VUeXBlOiBNZWRpYVR5cGUuSnNvbixcblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIHRoaXMucGFyc2VTZXR1cE11bHRpcGxlKHBlcnNpc3RlbmNlUG9zdFJldHVybilcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBQYXlsb2FkVG9vTGFyZ2VFcnJvcikge1xuXHRcdFx0XHRcdC8vIElmIHdlIHRyeSB0byBwb3N0IHRvbyBtYW55IGxhcmdlIGluc3RhbmNlcyB0aGVuIHdlIGdldCBQYXlsb2FkVG9vTGFyZ2Vcblx0XHRcdFx0XHQvLyBTbyB3ZSBmYWxsIGJhY2sgdG8gcG9zdGluZyBzaW5nbGUgaW5zdGFuY2VzXG5cdFx0XHRcdFx0Y29uc3QgcmV0dXJuZWRJZHMgPSBhd2FpdCBwcm9taXNlTWFwKGluc3RhbmNlQ2h1bmssIChpbnN0YW5jZSkgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0dXAobGlzdElkLCBpbnN0YW5jZSkuY2F0Y2goKGUpID0+IHtcblx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goZSlcblx0XHRcdFx0XHRcdFx0ZmFpbGVkSW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0cmV0dXJuIHJldHVybmVkSWRzLmZpbHRlcihCb29sZWFuKSBhcyBJZFtdXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZXJyb3JzLnB1c2goZSlcblx0XHRcdFx0XHRmYWlsZWRJbnN0YW5jZXMucHVzaCguLi5pbnN0YW5jZUNodW5rKVxuXHRcdFx0XHRcdHJldHVybiBbXSBhcyBJZFtdXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0aWYgKGVycm9ycy5sZW5ndGgpIHtcblx0XHRcdGlmIChlcnJvcnMuc29tZShpc09mZmxpbmVFcnJvcikpIHtcblx0XHRcdFx0dGhyb3cgbmV3IENvbm5lY3Rpb25FcnJvcihcIlNldHVwIG11bHRpcGxlIGVudGl0aWVzIGZhaWxlZFwiKVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgbmV3IFNldHVwTXVsdGlwbGVFcnJvcjxUPihcIlNldHVwIG11bHRpcGxlIGVudGl0aWVzIGZhaWxlZFwiLCBlcnJvcnMsIGZhaWxlZEluc3RhbmNlcylcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGlkQ2h1bmtzLmZsYXQoKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHVwZGF0ZTxUIGV4dGVuZHMgU29tZUVudGl0eT4oaW5zdGFuY2U6IFQsIG9wdGlvbnM/OiBFbnRpdHlSZXN0Q2xpZW50VXBkYXRlT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghaW5zdGFuY2UuX2lkKSB0aHJvdyBuZXcgRXJyb3IoXCJJZCBtdXN0IGJlIGRlZmluZWRcIilcblx0XHRjb25zdCB7IGxpc3RJZCwgZWxlbWVudElkIH0gPSBleHBhbmRJZChpbnN0YW5jZS5faWQpXG5cdFx0Y29uc3QgeyBwYXRoLCBxdWVyeVBhcmFtcywgaGVhZGVycywgdHlwZU1vZGVsIH0gPSBhd2FpdCB0aGlzLl92YWxpZGF0ZUFuZFByZXBhcmVSZXN0UmVxdWVzdChcblx0XHRcdGluc3RhbmNlLl90eXBlLFxuXHRcdFx0bGlzdElkLFxuXHRcdFx0ZWxlbWVudElkLFxuXHRcdFx0dW5kZWZpbmVkLFxuXHRcdFx0dW5kZWZpbmVkLFxuXHRcdFx0b3B0aW9ucz8ub3duZXJLZXlQcm92aWRlcixcblx0XHQpXG5cdFx0Y29uc3Qgc2Vzc2lvbktleSA9IGF3YWl0IHRoaXMucmVzb2x2ZVNlc3Npb25LZXkob3B0aW9ucz8ub3duZXJLZXlQcm92aWRlciwgaW5zdGFuY2UsIHR5cGVNb2RlbClcblx0XHRjb25zdCBlbmNyeXB0ZWRFbnRpdHkgPSBhd2FpdCB0aGlzLmluc3RhbmNlTWFwcGVyLmVuY3J5cHRBbmRNYXBUb0xpdGVyYWwodHlwZU1vZGVsLCBpbnN0YW5jZSwgc2Vzc2lvbktleSlcblx0XHRhd2FpdCB0aGlzLnJlc3RDbGllbnQucmVxdWVzdChwYXRoLCBIdHRwTWV0aG9kLlBVVCwge1xuXHRcdFx0YmFzZVVybDogb3B0aW9ucz8uYmFzZVVybCxcblx0XHRcdHF1ZXJ5UGFyYW1zLFxuXHRcdFx0aGVhZGVycyxcblx0XHRcdGJvZHk6IEpTT04uc3RyaW5naWZ5KGVuY3J5cHRlZEVudGl0eSksXG5cdFx0XHRyZXNwb25zZVR5cGU6IE1lZGlhVHlwZS5Kc29uLFxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBlcmFzZTxUIGV4dGVuZHMgU29tZUVudGl0eT4oaW5zdGFuY2U6IFQsIG9wdGlvbnM/OiBFbnRpdHlSZXN0Q2xpZW50RXJhc2VPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeyBsaXN0SWQsIGVsZW1lbnRJZCB9ID0gZXhwYW5kSWQoaW5zdGFuY2UuX2lkKVxuXHRcdGNvbnN0IHsgcGF0aCwgcXVlcnlQYXJhbXMsIGhlYWRlcnMgfSA9IGF3YWl0IHRoaXMuX3ZhbGlkYXRlQW5kUHJlcGFyZVJlc3RSZXF1ZXN0KFxuXHRcdFx0aW5zdGFuY2UuX3R5cGUsXG5cdFx0XHRsaXN0SWQsXG5cdFx0XHRlbGVtZW50SWQsXG5cdFx0XHR1bmRlZmluZWQsXG5cdFx0XHRvcHRpb25zPy5leHRyYUhlYWRlcnMsXG5cdFx0XHR1bmRlZmluZWQsXG5cdFx0KVxuXHRcdGF3YWl0IHRoaXMucmVzdENsaWVudC5yZXF1ZXN0KHBhdGgsIEh0dHBNZXRob2QuREVMRVRFLCB7XG5cdFx0XHRxdWVyeVBhcmFtcyxcblx0XHRcdGhlYWRlcnMsXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIF92YWxpZGF0ZUFuZFByZXBhcmVSZXN0UmVxdWVzdChcblx0XHR0eXBlUmVmOiBUeXBlUmVmPGFueT4sXG5cdFx0bGlzdElkOiBJZCB8IG51bGwsXG5cdFx0ZWxlbWVudElkOiBJZCB8IG51bGwsXG5cdFx0cXVlcnlQYXJhbXM6IERpY3QgfCB1bmRlZmluZWQsXG5cdFx0ZXh0cmFIZWFkZXJzOiBEaWN0IHwgdW5kZWZpbmVkLFxuXHRcdG93bmVyS2V5OiBPd25lcktleVByb3ZpZGVyIHwgVmVyc2lvbmVkS2V5IHwgdW5kZWZpbmVkLFxuXHQpOiBQcm9taXNlPHtcblx0XHRwYXRoOiBzdHJpbmdcblx0XHRxdWVyeVBhcmFtczogRGljdCB8IHVuZGVmaW5lZFxuXHRcdGhlYWRlcnM6IERpY3QgfCB1bmRlZmluZWRcblx0XHR0eXBlTW9kZWw6IFR5cGVNb2RlbFxuXHR9PiB7XG5cdFx0Y29uc3QgdHlwZU1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UodHlwZVJlZilcblxuXHRcdF92ZXJpZnlUeXBlKHR5cGVNb2RlbClcblxuXHRcdGlmIChvd25lcktleSA9PSB1bmRlZmluZWQgJiYgIXRoaXMuYXV0aERhdGFQcm92aWRlci5pc0Z1bGx5TG9nZ2VkSW4oKSAmJiB0eXBlTW9kZWwuZW5jcnlwdGVkKSB7XG5cdFx0XHQvLyBTaG9ydC1jaXJjdWl0IGJlZm9yZSB3ZSBkbyBhbiBhY3R1YWwgcmVxdWVzdCB3aGljaCB3ZSBjYW4ndCBkZWNyeXB0XG5cdFx0XHR0aHJvdyBuZXcgTG9naW5JbmNvbXBsZXRlRXJyb3IoYFRyeWluZyB0byBkbyBhIG5ldHdvcmsgcmVxdWVzdCB3aXRoIGVuY3J5cHRlZCBlbnRpdHkgYnV0IGlzIG5vdCBmdWxseSBsb2dnZWQgaW4geWV0LCB0eXBlOiAke3R5cGVNb2RlbC5uYW1lfWApXG5cdFx0fVxuXG5cdFx0bGV0IHBhdGggPSB0eXBlUmVmVG9QYXRoKHR5cGVSZWYpXG5cblx0XHRpZiAobGlzdElkKSB7XG5cdFx0XHRwYXRoICs9IFwiL1wiICsgbGlzdElkXG5cdFx0fVxuXG5cdFx0aWYgKGVsZW1lbnRJZCkge1xuXHRcdFx0cGF0aCArPSBcIi9cIiArIGVsZW1lbnRJZFxuXHRcdH1cblxuXHRcdGNvbnN0IGhlYWRlcnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmF1dGhEYXRhUHJvdmlkZXIuY3JlYXRlQXV0aEhlYWRlcnMoKSwgZXh0cmFIZWFkZXJzKVxuXG5cdFx0aWYgKE9iamVjdC5rZXlzKGhlYWRlcnMpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE5vdEF1dGhlbnRpY2F0ZWRFcnJvcihcInVzZXIgbXVzdCBiZSBhdXRoZW50aWNhdGVkIGZvciBlbnRpdHkgcmVxdWVzdHNcIilcblx0XHR9XG5cblx0XHRoZWFkZXJzLnYgPSB0eXBlTW9kZWwudmVyc2lvblxuXHRcdHJldHVybiB7XG5cdFx0XHRwYXRoLFxuXHRcdFx0cXVlcnlQYXJhbXMsXG5cdFx0XHRoZWFkZXJzLFxuXHRcdFx0dHlwZU1vZGVsLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBmb3IgdGhlIGFkbWluIGFyZWEgKG5vIGNhY2hlIGF2YWlsYWJsZSlcblx0ICovXG5cdGVudGl0eUV2ZW50c1JlY2VpdmVkKGJhdGNoOiBRdWV1ZWRCYXRjaCk6IFByb21pc2U8QXJyYXk8RW50aXR5VXBkYXRlPj4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoYmF0Y2guZXZlbnRzKVxuXHR9XG5cblx0Z2V0UmVzdENsaWVudCgpOiBSZXN0Q2xpZW50IHtcblx0XHRyZXR1cm4gdGhpcy5yZXN0Q2xpZW50XG5cdH1cblxuXHRwcml2YXRlIHBhcnNlU2V0dXBNdWx0aXBsZShyZXN1bHQ6IGFueSk6IElkW10ge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQpLm1hcCgocjogYW55KSA9PiByLmdlbmVyYXRlZElkKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXNwb25zZTogJHtyZXN1bHR9LCAke2V9YClcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBUcmllcyB0byBydW4gdGhlIG1hcHBlciBhY3Rpb24gYWdhaW5zdCBhIGxpc3Qgb2Ygc2VydmVycy4gSWYgdGhlIGFjdGlvbiByZXNvbHZlc1xuICogc3VjY2Vzc2Z1bGx5LCB0aGUgcmVzdWx0IGlzIHJldHVybmVkLiBJbiBjYXNlIG9mIGFuIENvbm5lY3Rpb25FcnJvciBhbmQgZXJyb3JzXG4gKiB0aGF0IG1pZ2h0IG9jY3VyIG9ubHkgZm9yIGEgc2luZ2xlIGJsb2Igc2VydmVyLCB0aGUgbmV4dCBzZXJ2ZXIgaXMgdHJpZWQuXG4gKiBUaHJvd3MgaW4gYWxsIG90aGVyIGNhc2VzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJ5U2VydmVyczxUPihzZXJ2ZXJzOiBCbG9iU2VydmVyVXJsW10sIG1hcHBlcjogTWFwcGVyPHN0cmluZywgVD4sIGVycm9yTXNnOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcblx0bGV0IGluZGV4ID0gMFxuXHRsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGxcblx0Zm9yIChjb25zdCBzZXJ2ZXIgb2Ygc2VydmVycykge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKHNlcnZlci51cmwsIGluZGV4KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdC8vIEludGVybmFsU2VydmVyRXJyb3IgaXMgcmV0dXJuZWQgd2hlbiBhY2Nlc3NpbmcgYSBjb3JydXB0ZWQgYXJjaGl2ZSwgc28gd2UgcmV0cnlcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgQ29ubmVjdGlvbkVycm9yIHx8IGUgaW5zdGFuY2VvZiBJbnRlcm5hbFNlcnZlckVycm9yIHx8IGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGAke2Vycm9yTXNnfSAke3NlcnZlci51cmx9YCwgZSlcblx0XHRcdFx0ZXJyb3IgPSBlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGluZGV4Kytcblx0fVxuXHR0aHJvdyBlcnJvclxufVxuXG4vKipcbiAqIERvIGEgYmxvYiByZXF1ZXN0IGFuZCByZXRyeSBpdCBpbiBjYXNlIG9mIGEgTm90QXV0aG9yaXplZEVycm9yLCBwZXJmb3JtaW5nIHNvbWUgY2xlYW51cCBiZWZvcmUgcmV0cnlpbmcuXG4gKlxuICogVGhpcyBpcyB1c2VmdWwgZm9yIGJsb2IgcmVxdWVzdHMgdG8gaGFuZGxlIGV4cGlyZWQgdG9rZW5zLCB3aGljaCBjYWggb2NjdXIgaWYgdGhlIHJlcXVlc3RzIHRha2UgYSBsb25nIHRpbWUsIHRoZSBjbGllbnQgZ2V0cyBzdXNwZW5kZWQgb3IgcGF1c2VkIGJ5IHRoZSBPUy5cbiAqIEBwYXJhbSBkb0Jsb2JSZXF1ZXN0XG4gKiBAcGFyYW0gZG9FdmljdFRva2VuQmVmb3JlUmV0cnlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvQmxvYlJlcXVlc3RXaXRoUmV0cnk8VD4oZG9CbG9iUmVxdWVzdDogKCkgPT4gUHJvbWlzZTxUPiwgZG9FdmljdFRva2VuQmVmb3JlUmV0cnk6ICgpID0+IHZvaWQpOiBQcm9taXNlPFQ+IHtcblx0cmV0dXJuIGRvQmxvYlJlcXVlc3QoKS5jYXRjaChcblx0XHQvLyBpbiBjYXNlIG9uZSBvZiB0aGUgY2h1bmtzIGNvdWxkIG5vdCBiZSB1cGxvYWRlZCBiZWNhdXNlIG9mIGFuIGludmFsaWQvZXhwaXJlZCB0b2tlbiB3ZSB1cGxvYWQgYWxsIGNodW5rcyBhZ2FpbiBpbiBvcmRlciB0byBndWFyYW50ZWUgdGhhdCB0aGV5IGFyZSB1cGxvYWRlZCB0byB0aGUgc2FtZSBhcmNoaXZlLlxuXHRcdC8vIHdlIGRvbid0IGhhdmUgdG8gdGFrZSBjYXJlIG9mIGFscmVhZHkgdXBsb2FkZWQgY2h1bmtzLCBhcyB0aGV5IGFyZSB1bnJlZmVyZW5jZWQgYW5kIHdpbGwgYmUgY2xlYW5lZCB1cCBieSB0aGUgc2VydmVyIGF1dG9tYXRpY2FsbHkuXG5cdFx0b2ZDbGFzcyhOb3RBdXRob3JpemVkRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRkb0V2aWN0VG9rZW5CZWZvcmVSZXRyeSgpXG5cdFx0XHRyZXR1cm4gZG9CbG9iUmVxdWVzdCgpXG5cdFx0fSksXG5cdClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldElkcyhcblx0aW5zdGFuY2U6IGFueSxcblx0dHlwZU1vZGVsOiBUeXBlTW9kZWwsXG4pOiB7XG5cdGxpc3RJZDogc3RyaW5nIHwgbnVsbFxuXHRpZDogc3RyaW5nXG59IHtcblx0aWYgKCFpbnN0YW5jZS5faWQpIHRocm93IG5ldyBFcnJvcihcIklkIG11c3QgYmUgZGVmaW5lZFwiKVxuXHRsZXQgbGlzdElkID0gbnVsbFxuXHRsZXQgaWRcblxuXHRpZiAodHlwZU1vZGVsLnR5cGUgPT09IFR5cGUuTGlzdEVsZW1lbnQpIHtcblx0XHRsaXN0SWQgPSBpbnN0YW5jZS5faWRbMF1cblx0XHRpZCA9IGluc3RhbmNlLl9pZFsxXVxuXHR9IGVsc2Uge1xuXHRcdGlkID0gaW5zdGFuY2UuX2lkXG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGxpc3RJZCxcblx0XHRpZCxcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlhLDBCQUFOLE1BQTBEO0NBQ2hFLEFBQWlCO0NB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