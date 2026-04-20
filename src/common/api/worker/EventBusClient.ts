import { assertWorkerOrNode, CloseEventBusOption, GroupType, isBrowser, Mode, SECOND_MS } from "@tutao/app-env"
import * as restError from "@tutao/rest-client/error"
import {
	AttributeModel,
	Entity,
	entityUpdateUtils,
	hasError,
	ServerModelParsedInstance,
	ServerModelUntypedInstance,
	sysModelInfo,
	sysTypeRefs,
	timestampToGeneratedId,
	tutanotaModelInfo,
	tutanotaTypeRefs,
	TypeModelResolver,
	GENERATED_MIN_ID,
} from "@tutao/typerefs"
import { AppName, delay, identity, isSameTypeRef, lazyAsync, Nullable, ofClass, promiseMap, randomIntFromInterval, TypeRef } from "@tutao/utils"
import { OutOfSyncError } from "../common/error/OutOfSyncError"
import { CancelledError } from "../common/error/CancelledError"
import { WsConnectionState } from "../main/WorkerClient"
import { EntityRestCache } from "./rest/DefaultEntityRestCache.js"
import { SleepDetector } from "./utils/SleepDetector.js"
import { UserFacade } from "./facades/UserFacade"
import { EntityAdapter, InstancePipeline } from "@tutao/instance-pipeline"
import { CryptoFacade } from "./crypto/CryptoFacade"
import { SessionKeyNotFoundError } from "@tutao/crypto/error"
import { isExpectedErrorForSynchronization } from "../common/utils/ErrorUtils"
import { ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { WebsocketConnectivityListener } from "../../misc/WebsocketConnectivityModel"
import { LastProcessedEventBatchStorageFacade } from "./LastProcessedEventBatchStorageFacade"
import { DateProvider } from "../common/DateProvider"
import { ExposedProgressTracker } from "../main/ProgressTracker"
import { ProgressMonitorDelegate } from "./ProgressMonitorDelegate"
import { filterIndexMemberships } from "../common/utils/IndexUtils"

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

/** Known types of messages that can be received over websocket. */
const enum MessageType {
	EntityUpdate = "entityUpdate",
	UnreadCounterUpdate = "unreadCounterUpdate",
	PhishingMarkers = "phishingMarkers",
	LeaderStatus = "leaderStatus",
	OperationStatusUpdate = "operationStatusUpdate",
	InitialSyncDone = "initialSyncDone",
	InitialSyncWorkEstimate = "initialSyncWorkEstimate",
}

export const enum ConnectMode {
	Initial,
	Reconnect,
}

export interface EventBusListener {
	onCounterChanged(counter: sysTypeRefs.WebsocketCounterData): unknown

	onEntityEventsReceived(
		events: readonly entityUpdateUtils.EntityUpdateData[],
		batchId: Id,
		groupId: Id,
		progressMonitorId: Nullable<ProgressMonitorId>,
		isInitialSyncDone: boolean,
	): Promise<void>

	/**
	 * @param markers only phishing (not spam) markers will be sent as event bus updates
	 */
	onPhishingMarkersReceived(markers: tutanotaTypeRefs.ReportedMailFieldMarker[]): unknown

	onError(tutanotaError: Error): void

	onSyncDone(): unknown

	onOperationStatusUpdate(update: sysTypeRefs.OperationStatusUpdate): unknown
}

const PROGRESS_SYNC_DONE_TIMEOUT_DEBOUNCE_MS = 1000

export class EventBusClient {
	private state: EventBusState
	private socket: WebSocket | null
	private immediateReconnect: boolean = false // if true tries to reconnect immediately after the websocket is closed

	private lastAntiphishingMarkersId: Id | null = null

	private reconnectTimer: TimeoutID | null
	private connectTimer: TimeoutID | null

	private progressMonitor: ProgressMonitorDelegate | null = null
	private isInitialSyncDone: boolean = false

	/**
	 * The artificial work that is added as an overstatement, to make sure the progress bar is not completed too early.
	 * e.g. group 1 has 5 batches, group 2 has 10000 batches; since sending the messages for group 2 takes time,
	 * it is possible that the progress bar is completed before the group 2 messages are sent from the server.
	 *
	 * In this case, we add 25 artificial work to the progress bar, and complete it
	 * (with a Timeout of PROGRESS_SYNC_DONE_TIMEOUT_DEBOUNCE_MS), when we receive the initialSyncDone message.
	 * Since we receive the initialSyncDone message only after the group2 also sends its messages,
	 * we can be sure that the progress bar is not completed too early.
	 */
	private readonly artificialWorkEstimate = 25
	private readonly initialWorkDone = 25

	/**
	 * Represents multiple retried executions due to a ServiceUnavailableError
	 * We store the retry promise of connection as GENERATED_MIN_ID and for other retries of batch processing as BatchId
	 */
	private batchIdToServiceUnavailableRetryMap: Map<Id, Promise<void>> = new Map()
	private failedConnectionAttempts: number = 0

	constructor(
		private readonly connectivityListener: WebsocketConnectivityListener,
		private readonly listener: EventBusListener,
		private readonly cache: EntityRestCache,
		private readonly userFacade: UserFacade,
		private readonly instancePipeline: InstancePipeline,
		private readonly socketFactory: (path: string) => WebSocket,
		private readonly sleepDetector: SleepDetector,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly cryptoFacade: CryptoFacade,
		private readonly lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchStorageFacade>,
		private readonly serverDateProvider: DateProvider,
		private readonly progressTracker: ExposedProgressTracker,
	) {
		// We are not connected by default and will not try to unless connect() is called
		this.state = EventBusState.Terminated
		this.socket = null
		this.reconnectTimer = null
		this.connectTimer = null
		this.reset()
	}

	private reset() {
		this.immediateReconnect = false

		this.batchIdToServiceUnavailableRetryMap = new Map()
	}

	/**
	 * Opens a WebSocket connection to receive server events.
	 * @param connectMode
	 */
	async connect(connectMode: ConnectMode) {
		console.log("ws connect reconnect:", connectMode === ConnectMode.Reconnect, "state:", this.state)
		// make sure a retry will be cancelled by setting _serviceUnavailableRetry to null
		this.batchIdToServiceUnavailableRetryMap = new Map()

		this.connectivityListener.updateWebSocketState(WsConnectionState.connecting)

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
			(this.lastAntiphishingMarkersId ? "&lastPhishingMarkersId=" + this.lastAntiphishingMarkersId : "") +
			(env.clientName ? "&clientName=" + env.clientName : "") +
			(env.networkDebugging ? "&network-debugging=" + "enable-network-debugging" : "")

		// the server sends web socket messages for **missed entity events**, after a new websocket connection
		// has been opened for all given groups, when the groupsToLastEventBatchIds query parameter is set on
		// init or reconnect.
		let groupsToLastEventBatchIdsQuery = "&groupsToLastEventBatchIds="
		const eventGroups = this.eventGroups()
		const groupsToLastEventBatchIds = new Map<Id, Id>()
		for (const groupId of eventGroups) {
			const lastProcessedEventBatchStorageFacade = await this.lastProcessedEventBatchStorageFacade()
			const lastProcessedBatchId = await lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId)
			if (lastProcessedBatchId != null) {
				groupsToLastEventBatchIds.set(groupId, lastProcessedBatchId)
			}
		}
		for (const [groupId, lastEventBatchId] of groupsToLastEventBatchIds) {
			groupsToLastEventBatchIdsQuery += groupId + "=" + lastEventBatchId + ";"
		}

		if (groupsToLastEventBatchIds.size === 0) {
			this.isInitialSyncDone = true
		}

		const path = "/event?" + authQuery + (groupsToLastEventBatchIds.size > 0 ? groupsToLastEventBatchIdsQuery : "")

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
				this.connectivityListener.updateWebSocketState(WsConnectionState.connecting)
				break
			case CloseEventBusOption.Reconnect:
				this.connectivityListener.updateWebSocketState(WsConnectionState.connecting)
				break
		}

		this.socket?.close()
	}

	async tryReconnect(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null): Promise<void> {
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

		const p = this.initEntityEvents(connectMode)

		this.connectivityListener.updateWebSocketState(WsConnectionState.connected)

		return p
	}

	private async decodeEntityEventValue<E extends Entity>(messageType: TypeRef<E>, untypedInstance: ServerModelUntypedInstance): Promise<E> {
		const untypedInstanceSanitized = AttributeModel.removeNetworkDebuggingInfoIfNeeded(untypedInstance)
		return await this.instancePipeline.decryptAndMap(messageType, untypedInstanceSanitized, null)
	}

	private onError(error: any) {
		console.log("ws error:", error, JSON.stringify(error), "state:", this.state)
	}

	private async onMessage(message: MessageEvent<string>): Promise<void> {
		const [type, ...values] = message.data.split(";")
		const value = values.join(";")

		switch (type) {
			case MessageType.EntityUpdate: {
				const entityUpdateData = await this.decodeEntityEventValue(sysTypeRefs.WebsocketEntityDataTypeRef, JSON.parse(value))
				this.typeModelResolver.setServerApplicationTypesModelHash(entityUpdateData.applicationTypesHash)

				// We only process entity updates for apps and types the clients know about.
				// We drop the other entity updates early on before constructing TypeRefs for them.
				const entityUpdatesForClientApps = entityUpdateData.entityUpdates.filter(async (entityUpdate) => {
					return await this.typeModelResolver.isKnownClientTypeReference(entityUpdate.application, parseInt(entityUpdate.typeId))
				})

				const updates = await promiseMap(entityUpdatesForClientApps, async (event) => {
					let { parsedInstance, parsedBlobInstance } = await this.getParsedInstanceFromEntityEvent(event)
					return entityUpdateUtils.entityUpdateToUpdateData(event, parsedInstance, parsedBlobInstance)
				})
				const groupId = entityUpdateData.eventBatchOwner
				const batchId = entityUpdateData.eventBatchId

				if (this.isInitialSyncDone && !this.progressMonitor?.isDone()) {
					// the initial sync is done; this is to add work for entity updates we receive right after the initial sync is done,
					// such as two entity updates per mail after the ProcessInboxService call. We complete this added work in the EventController
					await this.progressMonitor?.updateTotalWork(this.progressMonitor.totalWork + 1)
				}
				await this.processEventBatch(updates, batchId, groupId, this.isInitialSyncDone)
				break
			}
			case MessageType.UnreadCounterUpdate: {
				const counterData = await this.decodeEntityEventValue(sysTypeRefs.WebsocketCounterDataTypeRef, JSON.parse(value))
				this.typeModelResolver.setServerApplicationTypesModelHash(counterData.applicationTypesHash)
				this.listener.onCounterChanged(counterData)
				break
			}
			case MessageType.PhishingMarkers: {
				const data = await this.decodeEntityEventValue(tutanotaTypeRefs.PhishingMarkerWebsocketDataTypeRef, JSON.parse(value))
				this.typeModelResolver.setServerApplicationTypesModelHash(data.applicationTypesHash)

				this.lastAntiphishingMarkersId = data.lastId
				this.listener.onPhishingMarkersReceived(data.markers)
				break
			}
			case MessageType.LeaderStatus: {
				const data = await this.decodeEntityEventValue(sysTypeRefs.WebsocketLeaderStatusTypeRef, JSON.parse(value))
				if (data.applicationTypesHash) {
					this.typeModelResolver.setServerApplicationTypesModelHash(data.applicationTypesHash)
				}

				this.userFacade.setLeaderStatus(data)
				await this.connectivityListener.onLeaderStatusMessageReceived(data)
				break
			}
			case MessageType.OperationStatusUpdate: {
				const data = await this.decodeEntityEventValue(sysTypeRefs.OperationStatusUpdateTypeRef, JSON.parse(value))
				this.listener.onOperationStatusUpdate(data)
				break
			}
			case MessageType.InitialSyncDone: {
				console.log("Reached final event, sync is done")

				this.isInitialSyncDone = true
				this.listener.onSyncDone()

				setTimeout(() => this.progressMonitor?.workDone(this.artificialWorkEstimate), PROGRESS_SYNC_DONE_TIMEOUT_DEBOUNCE_MS)
				break
			}
			case MessageType.InitialSyncWorkEstimate: {
				const newWorkEstimate = Number.parseInt(value)
				if (newWorkEstimate === 0) {
					break
				}

				if (this.progressMonitor == null) {
					// add and finish some work (25) directly, to immediately show some progress and start estimating
					this.progressMonitor = new ProgressMonitorDelegate(
						this.progressTracker,
						newWorkEstimate + this.artificialWorkEstimate + this.initialWorkDone,
					)
					await this.progressMonitor.workDone(this.initialWorkDone)
				} else {
					await this.progressMonitor.updateTotalWork(this.progressMonitor.totalWork + newWorkEstimate)
				}
				break
			}
			default:
				console.log("ws message with unknown type", type)
				break
		}
	}

	private async getParsedInstanceFromEntityEvent(
		event: sysTypeRefs.EntityUpdate,
	): Promise<{ parsedInstance: Nullable<ServerModelParsedInstance>; parsedBlobInstance: Nullable<ServerModelParsedInstance> }> {
		const typeRef = new TypeRef<any>(event.application as AppName, parseInt(event.typeId))
		if (event.instance != null) {
			try {
				const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
				const untypedInstance = JSON.parse(event.instance) as ServerModelUntypedInstance
				const untypedInstanceSanitized = AttributeModel.removeNetworkDebuggingInfoIfNeeded(untypedInstance)
				const encryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(serverTypeModel, untypedInstanceSanitized)
				const entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline.modelMapper)
				const migratedEntity = await this.cryptoFacade.applyMigrations(typeRef, entityAdapter)
				const sessionKey = await this.cryptoFacade.resolveSessionKey(migratedEntity)
				const parsedInstance = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
					serverTypeModel,
					encryptedParsedInstance,
					sessionKey,
					entityAdapter._kdfNonce,
					entityAdapter._ownerGroup,
				)

				// we do not want to process the instance if there are _errors (when decrypting)
				if (!hasError(parsedInstance)) {
					if (isSameTypeRef(tutanotaTypeRefs.MailTypeRef, typeRef) && event.blobInstance != null) {
						// handle MailDetails blobs
						const mailDetailsBlobServerTypeModel = await this.typeModelResolver.resolveServerTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
						const mailDetailsBlobUntypedInstance = JSON.parse(event.blobInstance) as ServerModelUntypedInstance
						const mailDetailsBlobUntypedInstanceSanitized = AttributeModel.removeNetworkDebuggingInfoIfNeeded(mailDetailsBlobUntypedInstance)
						const mailDetailsBlobEncryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(
							mailDetailsBlobServerTypeModel,
							mailDetailsBlobUntypedInstanceSanitized,
						)
						const parsedBlobInstance = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
							mailDetailsBlobServerTypeModel,
							mailDetailsBlobEncryptedParsedInstance,
							sessionKey,
							entityAdapter._kdfNonce,
							entityAdapter._ownerGroup,
						)
						return { parsedInstance, parsedBlobInstance }
					}
					return { parsedInstance, parsedBlobInstance: null }
				} else {
					return { parsedInstance: null, parsedBlobInstance: null }
				}
			} catch (e) {
				if (e instanceof SessionKeyNotFoundError) {
					// After resolving the main instance with the BucketKey, the _ownerEncSessionKeys for files on the mails are
					// updated only after the UpdateSessionKeyService call, while the _ownerEncSessionKey for the main instance is
					// immediately updated. Therefore, there is a brief period where the File created after a reply to a mail has
					// null _ownerEncSessionKey. This means we cannot use the instance on the update for the File type.
					return { parsedInstance: null, parsedBlobInstance: null }
				} else {
					throw e
				}
			}
		}
		return { parsedInstance: null, parsedBlobInstance: null }
	}

	private onClose(event: CloseEvent) {
		this.failedConnectionAttempts++
		console.log("ws close event:", event, "state:", this.state)

		this.userFacade.setLeaderStatus(
			sysTypeRefs.createWebsocketLeaderStatus({
				leaderStatus: false,
				// a valid applicationVersionSum and applicationTypesHash can only be provided by the server
				applicationVersionSum: null,
				applicationTypesHash: null,
			}),
		)

		this.sleepDetector.stop()

		// Avoid running into penalties when trying to authenticate with an invalid session
		// NotAuthenticatedException 401, AccessDeactivatedException 470, AccessBlocked 472
		// do not catch session expired here because websocket will be reused when we authenticate again
		const serverCode = event.code - 4000

		if ([restError.NotAuthorizedError.CODE, restError.AccessDeactivatedError.CODE, restError.TooManyRequestsError.CODE].includes(serverCode)) {
			this.terminate()
			this.listener.onError(restError.handleRestError(serverCode, "web socket error", null, null))
		} else if (serverCode === restError.SessionExpiredError.CODE) {
			// session is expired. do not try to reconnect until the user creates a new session
			this.state = EventBusState.Suspended
			this.connectivityListener.updateWebSocketState(WsConnectionState.connecting)
		} else if (this.state === EventBusState.Automatic && this.userFacade.isFullyLoggedIn()) {
			this.connectivityListener.updateWebSocketState(WsConnectionState.connecting)

			if (this.immediateReconnect) {
				this.immediateReconnect = false
				this.tryReconnect(false, false)
			} else {
				let reconnectionInterval: readonly [number, number]

				if (serverCode === NORMAL_SHUTDOWN_CLOSE_CODE || serverCode === restError.TooManyRequestsError.CODE) {
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
		return this.initConnection()
			.catch(
				ofClass(restError.ConnectionError, (e) => {
					console.log("ws not connected in connect(), close websocket", e)
					this.close(CloseEventBusOption.Reconnect)
				}),
			)
			.catch(
				ofClass(CancelledError, () => {
					// the processing was aborted due to a reconnect. do not reset any attributes because they might already be in use since reconnection
					console.log("ws cancelled retry process entity events after reconnect")
				}),
			)
			.catch(
				ofClass(restError.TooManyRequestsError, async (e) => {
					// a ServiceUnavailableError is a temporary error, and we have to retry to avoid data inconsistencies
					console.log("ws retry init entity events in ", RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS, e)
					let promise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
						// if we have a websocket reconnect we have to stop retrying
						if (this.batchIdToServiceUnavailableRetryMap.has(GENERATED_MIN_ID)) {
							console.log("ws retry initializing entity events")
							return this.initEntityEvents(connectMode)
						} else {
							console.log("ws cancel initializing entity events")
						}
					})
					// Since this is the initial connect, overriding a previous connect in case of failure may not
					// cause any problems, thus GENERATED_MIN_ID is used as a placeholder for initial connection.
					this.batchIdToServiceUnavailableRetryMap.set(GENERATED_MIN_ID, promise)
					return promise
				}),
			)
			.catch(
				ofClass(OutOfSyncError, async (e) => {
					// we did not check for updates for too long, so some missed EntityEventBatches can not be loaded any more
					// purge cache if out of sync
					await this.cache.purgeStorage()
					// We want users to re-login. By the time we get here they probably already have loaded some entities which we cannot update
					throw e
				}),
			)
			.catch((e) => {
				this.listener.onError(e)
			})
	}

	private async initConnection() {
		const someIdsWereCached = await this.updateLastEntityEventIds()

		// Second, we need to initialize the cache too.
		if (!someIdsWereCached) {
			// If the cache is clean then this is a clean cache (either ephemeral after first connect or persistent with empty DB).
			// We need to record the time even if we don't process anything to later know if we are out of sync or not.
			await this.cache.recordSyncTime()
			this.listener.onSyncDone()
		} else {
			await this.checkOutOfSync()
		}
	}

	/**
	 * Gets the latest event batch ids for each of the users groups or min id if there is no event batch yet.
	 * This is needed to know from where to start loading missed events when we connect.
	 */
	private async updateLastEntityEventIds(): Promise<boolean> {
		// set all last event ids in one step to avoid that we have just set them for a few groups when a ServiceUnavailableError occurs
		let someIdsWereCached = false
		const lastProcessedEventBatchStorageFacade = await this.lastProcessedEventBatchStorageFacade()
		for (const groupId of this.eventGroups()) {
			const cachedBatchId = await lastProcessedEventBatchStorageFacade.getLastEntityEventBatchForGroup(groupId)
			if (cachedBatchId != null) {
				someIdsWereCached = true
			} else {
				const FIVE_SECONDS_IN_MILLISECONDS = 5000
				const recentTimestampToGeneratedId = timestampToGeneratedId(this.serverDateProvider.now() - FIVE_SECONDS_IN_MILLISECONDS)
				await lastProcessedEventBatchStorageFacade.putLastEntityEventBatchForGroup(groupId, recentTimestampToGeneratedId)
			}
		}

		return someIdsWereCached
	}

	private async checkOutOfSync(): Promise<void> {
		// We try to detect whether event batches have already expired.
		// If this happened we don't need to download anything, we need to purge the cache and start all over.
		if (await this.cache.isOutOfSync()) {
			// We handle it where we initialize the connection and purge the cache there.
			throw new OutOfSyncError("some missed EntityEventBatches cannot be loaded any more")
		}
	}

	private unsubscribeFromOldWebsocket() {
		if (this.socket) {
			// Remove listeners. We don't want old socket to mess our state
			this.socket.onopen = this.socket.onclose = this.socket.onerror = this.socket.onmessage = identity
		}
	}

	private terminate() {
		this.state = EventBusState.Terminated

		this.reset()

		this.connectivityListener.updateWebSocketState(WsConnectionState.terminated)
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

			this.connectTimer = setTimeout(async () => await this.connect(ConnectMode.Reconnect), 100)
		}
	}

	private async processEventBatch(entityUpdates: entityUpdateUtils.EntityUpdateData[], batchId: Id, groupId: Id, isInitialSyncDone: boolean): Promise<void> {
		try {
			if (this.isTerminated()) return
			const filteredEvents = await this.cache.entityEventsReceived(entityUpdates, batchId, groupId)
			if (!this.isTerminated()) {
				const progressMonitorId = (await this.progressMonitor?.progressMonitorId) ?? null
				await this.listener.onEntityEventsReceived(filteredEvents, batchId, groupId, progressMonitorId, isInitialSyncDone)
			}
		} catch (e) {
			if (e instanceof restError.ServiceUnavailableError) {
				// a ServiceUnavailableError is a temporary error, and we have to retry to avoid data inconsistencies
				console.log("ws retry processing event in 30s", e)
				const retryPromise = delay(RETRY_AFTER_SERVICE_UNAVAILABLE_ERROR_MS).then(() => {
					// if we have a websocket reconnect we have to stop retrying
					if (this.batchIdToServiceUnavailableRetryMap.has(batchId)) {
						return this.processEventBatch(entityUpdates, batchId, groupId, isInitialSyncDone)
					} else {
						throw new CancelledError("stop retry processing after service unavailable due to reconnect")
					}
				})
				this.batchIdToServiceUnavailableRetryMap.set(batchId, retryPromise)
				return retryPromise
			} else {
				if (!isExpectedErrorForSynchronization(e)) {
					console.log("EVENT", "error", e)
					throw e
				}
			}
		}
	}

	private isTerminated() {
		return this.state === EventBusState.Terminated
	}

	private eventGroups(): Id[] {
		const user = this.userFacade.getLoggedInUser()
		if ((!isBrowser() && !(env.mode === Mode.Admin)) || env.mode === Mode.Test) {
			return user.memberships
				.filter((membership) => membership.groupType !== GroupType.MailingList)
				.concat(user.userGroup)
				.map((membership) => membership.group)
		} else {
			return filterIndexMemberships(user)
				.concat(user.userGroup)
				.map((membership) => membership.group)
		}
	}
}
