// @flow
import {CryptoError} from "../common/error/CryptoError"
import type {Commands} from "../common/Queue"
import {Queue, Request, WorkerTransport} from "../common/Queue"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {assertMainOrNode} from "../common/Env"
import type {IMainLocator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, downcast, identity, TypeRef} from "@tutao/tutanota-utils"
import {objToError} from "../common/utils/Utils"
import stream from "mithril/stream/stream.js"
import type {InfoMessage} from "../common/CommonTypes"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {createWebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {addSearchIndexDebugEntry} from "../../misc/IndexerDebugLogger"
import type {MainInterface, WorkerInterface} from "../worker/WorkerImpl"
import {exposeLocal, exposeRemote} from "../common/WorkerProxy"
import type {TypeModel} from "../common/EntityTypes"
import type {EntropySource} from "@tutao/tutanota-crypto"
import type {CloseEventBusOptionEnum} from "../common/TutanotaConstants"

assertMainOrNode()

type progressUpdater = (number) => mixed;
type MainRequest = Request<MainRequestType>

export class WorkerClient implements EntityRestInterface {

	_deferredInitialized: DeferredObject<void> = defer()
	_isInitialized: boolean = false

	get initialized(): Promise<void> {
		return this._deferredInitialized.promise
	}

	_queue: Queue<WorkerRequestType, MainRequestType>;
	_progressUpdater: ?progressUpdater;
	_wsConnection: Stream<WsConnectionState> = stream("terminated");
	+infoMessages: Stream<InfoMessage>;
	_leaderStatus: WebsocketLeaderStatus


	constructor() {
		this._leaderStatus = createWebsocketLeaderStatus({leaderStatus: false}) //init as non-leader
		this.infoMessages = stream()
		this.initialized.then(() => {
			this._isInitialized = true
		})
	}

	async init(locator: IMainLocator): Promise<void> {
		if (env.mode !== "Test") {
			const {prefixWithoutFile} = window.tutao.appState
			// In apps/desktop we load HTML file and url ends on path/index.html so we want to load path/WorkerBootstrap.js.
			// In browser we load at domain.com or localhost/path (locally) and we want to load domain.com/WorkerBootstrap.js or
			// localhost/path/WorkerBootstrap.js respectively.
			// Service worker has similar logic but it has luxury of knowing that it's served as sw.js.
			const workerUrl = prefixWithoutFile + '/worker-bootstrap.js'
			const worker = new Worker(workerUrl)
			this._queue = new Queue(new WorkerTransport(worker), this.queueCommands(locator))

			await this._queue.postRequest(new Request('setup', [
				window.env,
				this._getInitialEntropy(),
				client.browserData()
			]))

			worker.onerror = (e: any) => {
				throw new CryptoError("could not setup worker", e)
			}
		} else {
			// node: we do not use workers but connect the client and the worker queues directly with each other
			// attention: do not load directly with require() here because in the browser SystemJS would load the WorkerImpl in the client although this code is not executed
			// $FlowIssue[cannot-resolve-name] flow doesn't know globalThis
			const WorkerImpl = globalThis.testWorker
			const workerImpl = new WorkerImpl(this, true)
			await workerImpl.init(client.browserData())
			workerImpl._queue._transport = {
				postMessage: msg => this._queue.handleMessage(msg)
			}
			this._queue = new Queue(({
					postMessage: function (msg) {
						workerImpl._queue.handleMessage(msg)
					}
				}: any),
				this.queueCommands(locator)
			)
		}

		this._deferredInitialized.resolve()
	}


	queueCommands(locator: IMainLocator): Commands<MainRequestType> {
		return {
			execNative: (message: MainRequest) =>
				locator.native.invokeNative(new Request(downcast(message.args[0]), downcast(message.args[1]))),
			entityEvent: (message: MainRequest) => {
				return locator.eventController.notificationReceived(downcast(message.args[0]), downcast(message.args[1]))
			},
			error: (message: MainRequest) => {
				handleUncaughtError(objToError((message).args[0]))
				return Promise.resolve()
			},
			progress: (message: MainRequest) => {
				const progressUpdater = this._progressUpdater
				if (progressUpdater) {
					progressUpdater(downcast(message.args[0]))
				}
				return Promise.resolve()
			},
			updateIndexState: (message: MainRequest) => {
				locator.search.indexState(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateWebSocketState: (message: MainRequest) => {
				this._wsConnection(downcast(message.args[0]));
				return Promise.resolve()
			},
			counterUpdate: (message: MainRequest) => {
				locator.eventController.counterUpdateReceived(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateLeaderStatus: (message: MainRequest) => {
				this._leaderStatus = downcast(message.args[0])
				return Promise.resolve()
			},
			infoMessage: (message: MainRequest) => {
				this.infoMessages(downcast(message.args[0]))
				return Promise.resolve()
			},
			createProgressMonitor: (message: MainRequest) => {
				const work = downcast(message.args[0])
				const reference = locator.progressTracker.registerMonitor(work)
				return Promise.resolve(reference)
			},
			progressWorkDone: (message: MainRequest) => {
				const reference = downcast(message.args[0])
				const workDone = downcast(message.args[1])
				const monitor = locator.progressTracker.getMonitor(reference)
				monitor && monitor.workDone(workDone)
				return Promise.resolve()
			},
			writeIndexerDebugLog: (message: MainRequest) => {
				const reason = downcast(message.args[0])
				const user = downcast(message.args[1])
				addSearchIndexDebugEntry(reason, user)
				return Promise.resolve()
			},
			facade: exposeLocal<MainInterface, MainRequestType>({
				get secondFactorAuthenticationHandler() {
					return locator.secondFactorHandler
				}
			}),
		}
	}

	getWorkerInterface(): WorkerInterface {
		return exposeRemote<WorkerInterface, WorkerRequestType, MainRequestType>(this._queue)
	}

	tryReconnectEventBus(closeIfOpen: boolean, enableAutomaticState: boolean, delay: ?number = null): Promise<void> {
		return this._postRequest(new Request('tryReconnectEventBus', [closeIfOpen, enableAutomaticState, delay]))
	}

	restRequest<T>(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener): Promise<any> {
		return this._postRequest(new Request('restRequest', Array.from(arguments)))
	}

	resolveSessionKey(typeModel: TypeModel, instance: Object): Promise<?string> {
		return this._postRequest(new Request('resolveSessionKey', arguments))
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params): Promise<any> {
		return this._postRequest(new Request('entityRequest', Array.from(arguments)))
	}

	entityEventsReceived(data: Array<EntityUpdate>): Promise<Array<EntityUpdate>> {
		throw new Error("must not be used")
	}

	serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum | StorageServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<any> {
		return this._postRequest(new Request('serviceRequest', Array.from(arguments)))
	}

	entropy(entropyCache: {source: EntropySource, entropy: number, data: number}[]): Promise<void> {
		return this._postRequest(new Request('entropy', Array.from(arguments)))
	}

	async _postRequest(msg: Request<WorkerRequestType>): Promise<any> {
		await this.initialized
		return this._queue.postRequest(msg)
	}

	registerProgressUpdater(updater: ?progressUpdater) {
		this._progressUpdater = updater
	}

	unregisterProgressUpdater(updater: ?progressUpdater) {
		// another one might have been registered in the mean time
		if (this._progressUpdater === updater) {
			this._progressUpdater = null
		}
	}

	generateSsePushIdentifer(): Promise<string> {
		return this._postRequest(new Request('generateSsePushIdentifer', arguments))
	}

	wsConnection(): Stream<WsConnectionState> {
		return this._wsConnection.map(identity)
	}

	closeEventBus(closeOption: CloseEventBusOptionEnum): Promise<void> {
		return this._queue.postRequest(new Request("closeEventBus", [closeOption]))
	}

	reset(): Promise<void> {
		return this._postRequest(new Request('reset', []))
	}

	getLog(): Promise<Array<string>> {
		return this._queue.postRequest(new Request("getLog", []))
	}

	isLeader(): boolean {
		return this._leaderStatus.leaderStatus
	}

	urlify(html: string): Promise<string> {
		return this._postRequest(new Request('urlify', arguments))
	}


	/**
	 * Add data from either secure random source or Math.random as entropy.
	 */
	_getInitialEntropy(): Array<{source: EntropySource, entropy: number, data: number}> {

		const valueList = new Uint32Array(16)
		crypto.getRandomValues(valueList)
		const entropy: Array<{source: EntropySource, entropy: number, data: number}> = []
		for (let i = 0; i < valueList.length; i++) {
			// 32 because we have 32-bit values Uint32Array
			entropy.push({source: "random", entropy: 32, data: valueList[i]})
		}
		return entropy
	}
}

export function bootstrapWorker(locator: IMainLocator): WorkerClient {
	const worker = new WorkerClient()
	const start = Date.now()
	worker.init(locator).then(() => console.log("worker init time (ms):", Date.now() - start))
	return worker
}