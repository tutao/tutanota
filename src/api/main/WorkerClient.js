// @flow
import {CryptoError} from "../common/error/CryptoError"
import {Queue, Request} from "../common/WorkerProtocol"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {assertMainOrNode} from "../common/Env"
import type {CloseEventBusOptionEnum, EntropySrcEnum} from "../common/TutanotaConstants"
import {EntropySrc} from "../common/TutanotaConstants"
import type {IMainLocator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import {downcast, identity, TypeRef} from "@tutao/tutanota-utils"
import {objToError} from "../common/utils/Utils"
import stream from "mithril/stream/stream.js"
import type {InfoMessage} from "../common/CommonTypes"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {createWebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {addSearchIndexDebugEntry} from "../../misc/IndexerDebugLogger"
import type {WorkerInterface} from "../worker/WorkerImpl"
import {exposeRemote} from "../common/WorkerProxy"
import type {TypeModel} from "../common/EntityTypes"

assertMainOrNode()

interface Message {
	id: string,
	type: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType,
	args: mixed[]
}

type progressUpdater = (number) => mixed;

export class WorkerClient implements EntityRestInterface {
	initialized: Promise<void>;
	_isInitialized: boolean = false

	_queue: Queue;
	_progressUpdater: ?progressUpdater;
	_wsConnection: Stream<WsConnectionState> = stream("terminated");
	+infoMessages: Stream<InfoMessage>;
	_leaderStatus: WebsocketLeaderStatus


	constructor(locator: IMainLocator) {
		this._leaderStatus = createWebsocketLeaderStatus({leaderStatus: false}) //init as non-leader
		this.infoMessages = stream()
		this._initWorker()

		this.initialized.then(() => {
			this._isInitialized = true
			this._initServices()
		})
		this._queue.setCommands({
			execNative: (message: Message) =>
				import("../../native/common/NativeWrapper").then(({nativeApp}) =>
					nativeApp.invokeNative(new Request(downcast(message.args[0]), downcast(message.args[1])))),
			entityEvent: (message: Message) => {
				return locator.eventController.notificationReceived(downcast(message.args[0]), downcast(message.args[1]))
			},
			error: (message: Message) => {
				handleUncaughtError(objToError((message).args[0]))
				return Promise.resolve()
			},
			progress: (message: Message) => {
				const progressUpdater = this._progressUpdater
				if (progressUpdater) {
					progressUpdater(downcast(message.args[0]))
				}
				return Promise.resolve()
			},
			updateIndexState: (message: Message) => {
				locator.search.indexState(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateWebSocketState: (message: Message) => {
				this._wsConnection(downcast(message.args[0]));
				return Promise.resolve()
			},
			counterUpdate: (message: Message) => {
				locator.eventController.counterUpdateReceived(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateLeaderStatus: (message: Message) => {
				this._leaderStatus = downcast(message.args[0])
				return Promise.resolve()
			},
			infoMessage: (message: Message) => {
				this.infoMessages(downcast(message.args[0]))
				return Promise.resolve()
			},
			createProgressMonitor: (message: Message) => {
				const work = downcast(message.args[0])
				const reference = locator.progressTracker.registerMonitor(work)
				return Promise.resolve(reference)
			},
			progressWorkDone: (message: Message) => {
				const reference = downcast(message.args[0])
				const workDone = downcast(message.args[1])
				const monitor = locator.progressTracker.getMonitor(reference)
				monitor && monitor.workDone(workDone)
				return Promise.resolve()
			},
			writeIndexerDebugLog: (message: Message) => {
				const reason = downcast(message.args[0])
				const user = downcast(message.args[1])
				addSearchIndexDebugEntry(reason, user)
				return Promise.resolve()
			}
		})
	}

	getWorkerInterface(): WorkerInterface {
		return exposeRemote<WorkerInterface>(this._queue)
	}

	_initWorker() {
		if (env.mode !== "Test") {
			const {prefixWithoutFile} = window.tutao.appState
			// In apps/desktop we load HTML file and url ends on path/index.html so we want to load path/WorkerBootstrap.js.
			// In browser we load at domain.com or localhost/path (locally) and we want to load domain.com/WorkerBootstrap.js or
			// localhost/path/WorkerBootstrap.js respectively.
			// Service worker has similar logic but it has luxury of knowing that it's served as sw.js.
			const workerUrl = prefixWithoutFile + '/worker-bootstrap.js'
			const worker = new Worker(workerUrl)
			this._queue = new Queue(worker)

			let start = new Date().getTime()
			this.initialized = this._queue
			                       .postMessage(new Request('setup', [
				                       window.env,
				                       this._getInitialEntropy(),
				                       client.browserData()
			                       ]))
			                       .then(() => console.log("worker init time (ms):", new Date().getTime() - start))

			worker.onerror = (e: any) => {
				throw new CryptoError("could not setup worker", e)
			}
		} else {
			// node: we do not use workers but connect the client and the worker queues directly with each other
			// attention: do not load directly with require() here because in the browser SystemJS would load the WorkerImpl in the client although this code is not executed
			// $FlowIssue[cannot-resolve-name] flow doesn't know globalThis
			const WorkerImpl = globalThis.testWorker
			const workerImpl = new WorkerImpl(this, true, client.browserData())
			workerImpl._queue._transport = {postMessage: msg => this._queue._handleMessage(msg)}
			this._queue = new Queue(({
				postMessage: function (msg) {
					workerImpl._queue._handleMessage(msg)

				}
			}: any))
			this.initialized = Promise.resolve()
		}
	}

	_initServices() {
		import("../../native/common/NativeWrapper").then(({nativeApp}) => nativeApp.initOnMain())
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

	entropy(entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		return this._postRequest(new Request('entropy', Array.from(arguments)))
	}

	async _postRequest(msg: Request): Promise<any> {
		await this.initialized
		return this._queue.postMessage(msg)
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
		return this._queue.postMessage(new Request("closeEventBus", [closeOption]))
	}

	reset(): Promise<void> {
		return this._postRequest(new Request('reset', []))
	}

	getLog(): Promise<Array<string>> {
		return this._queue.postMessage(new Request("getLog", []))
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
	_getInitialEntropy(): Array<{source: EntropySrcEnum, entropy: number, data: number}> {
		const valueList = new Uint32Array(16)
		crypto.getRandomValues(valueList)
		const entropy: Array<{source: EntropySrcEnum, entropy: number, data: number}> = []
		for (let i = 0; i < valueList.length; i++) {
			// 32 because we have 32-bit values Uint32Array
			entropy.push({source: EntropySrc.random, entropy: 32, data: valueList[i]})
		}
		return entropy
	}
}

export function bootstrapWorker(locator: IMainLocator): WorkerClient {
	return new WorkerClient(locator)
}