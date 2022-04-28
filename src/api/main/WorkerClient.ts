import {CryptoError} from "../common/error/CryptoError"
import type {Commands} from "../common/MessageDispatcher"
import {MessageDispatcher, Request, WorkerTransport} from "../common/MessageDispatcher"
import {assertMainOrNode} from "../common/Env"
import type {IMainLocator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, downcast, identity} from "@tutao/tutanota-utils"
import {objToError} from "../common/utils/Utils"
import type {InfoMessage} from "../common/CommonTypes"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import type {MainInterface, WorkerInterface} from "../worker/WorkerImpl"
import {exposeLocal, exposeRemote} from "../common/WorkerProxy"
import type {EntropySource} from "@tutao/tutanota-crypto"
import type {CloseEventBusOption} from "../common/TutanotaConstants"
import stream from "mithril/stream"
import type {RestClient} from "../worker/rest/RestClient"
import {createWebsocketLeaderStatus, WebsocketLeaderStatus} from "../entities/sys/TypeRefs"

assertMainOrNode()

type ProgressUpdater = (progress: number) => unknown
type MainRequest = Request<MainRequestType>

export const enum WsConnectionState {
	connecting, connected, terminated
}

export class WorkerClient {
	private _deferredInitialized: DeferredObject<void> = defer()
	private _isInitialized: boolean = false

	private _dispatcher!: MessageDispatcher<WorkerRequestType, MainRequestType>
	private _progressUpdater: ProgressUpdater | null = null
	readonly _wsConnection: stream<WsConnectionState> = stream(WsConnectionState.terminated)
	// Should be empty stream unless there's really a message.
	readonly infoMessages: stream<InfoMessage> = stream()
	private _leaderStatus: WebsocketLeaderStatus

	constructor() {
		this._leaderStatus = createWebsocketLeaderStatus({
			leaderStatus: false,  // init as non-leader
		})

		this.initialized.then(() => {
			this._isInitialized = true
		})
	}

	get initialized(): Promise<void> {
		return this._deferredInitialized.promise
	}

	async init(locator: IMainLocator): Promise<void> {
		if (env.mode !== "Test") {
			const {prefixWithoutFile} = window.tutao.appState
			// In apps/desktop we load HTML file and url ends on path/index.html so we want to load path/WorkerBootstrap.js.
			// In browser we load at domain.com or localhost/path (locally) and we want to load domain.com/WorkerBootstrap.js or
			// localhost/path/WorkerBootstrap.js respectively.
			// Service worker has similar logic but it has luxury of knowing that it's served as sw.js.
			const workerUrl = prefixWithoutFile + "/worker-bootstrap.js"
			const worker = new Worker(workerUrl)
			this._dispatcher = new MessageDispatcher(new WorkerTransport(worker), this.queueCommands(locator))
			await this._dispatcher.postRequest(new Request("setup", [window.env, this._getInitialEntropy(), client.browserData()]))

			worker.onerror = (e: any) => {
				throw new CryptoError("could not setup worker", e)
			}
		} else {
			// node: we do not use workers but connect the client and the worker queues directly with each other
			// attention: do not load directly with require() here because in the browser SystemJS would load the WorkerImpl in the client although this code is not executed
			// @ts-ignore
			const WorkerImpl = globalThis.testWorker
			const workerImpl = new WorkerImpl(this, true)
			await workerImpl.init(client.browserData())
			workerImpl._queue._transport = {
				postMessage: (msg: any) => this._dispatcher.handleMessage(msg),
			}
			this._dispatcher = new MessageDispatcher(
				{
					postMessage: function (msg: any) {
						workerImpl._queue.handleMessage(msg)
					},
				} as any,
				this.queueCommands(locator),
			)
		}

		this._deferredInitialized.resolve()
	}

	queueCommands(locator: IMainLocator): Commands<MainRequestType> {
		return {
			execNative: (message: MainRequest) => locator.native.invokeNative(new Request(downcast(message.args[0]), downcast(message.args[1]))),
			entityEvent: (message: MainRequest) => {
				return locator.eventController.notificationReceived(downcast(message.args[0]), downcast(message.args[1]))
			},
			error: (message: MainRequest) => {
				handleUncaughtError(objToError(message.args[0]))
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
				this._wsConnection(downcast(message.args[0]))

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
				const work = downcast<number>(message.args[0])
				const reference = locator.progressTracker.registerMonitor(work)
				return Promise.resolve(reference)
			},
			progressWorkDone: (message: MainRequest) => {
				const reference = downcast<number>(message.args[0])
				const workDone = downcast<number>(message.args[1])
				const monitor = locator.progressTracker.getMonitor(reference)
				monitor && monitor.workDone(workDone)
				return Promise.resolve()
			},
			facade: exposeLocal<MainInterface, MainRequestType>({
				get secondFactorAuthenticationHandler() {
					return locator.secondFactorHandler
				},
			}),
		}
	}

	getWorkerInterface(): WorkerInterface {
		return exposeRemote<WorkerInterface>(async request => this._postRequest(request))
	}

	tryReconnectEventBus(closeIfOpen: boolean, enableAutomaticState: boolean, delay: number | null = null): Promise<void> {
		return this._postRequest(new Request("tryReconnectEventBus", [closeIfOpen, enableAutomaticState, delay]))
	}

	/** Only used in admin client, */
	restRequest(...args: Parameters<RestClient["request"]>): Promise<any | null> {
		return this._postRequest(new Request("restRequest", Array.from(arguments)))
	}

	entropy(entropyCache: {source: EntropySource, entropy: number, data: number}[]): Promise<void> {
		return this._postRequest(new Request("entropy", [entropyCache]))
	}

	/** @private visible for tests */
	async _postRequest(msg: Request<WorkerRequestType>): Promise<any> {
		await this.initialized
		return this._dispatcher.postRequest(msg)
	}

	registerProgressUpdater(updater: ProgressUpdater | null) {
		this._progressUpdater = updater
	}

	unregisterProgressUpdater(updater: ProgressUpdater | null) {
		// another one might have been registered in the mean time
		if (this._progressUpdater === updater) {
			this._progressUpdater = null
		}
	}

	generateSsePushIdentifer(): Promise<string> {
		return this._postRequest(new Request("generateSsePushIdentifer", [...arguments]))
	}

	wsConnection(): stream<WsConnectionState> {
		return this._wsConnection.map(identity)
	}

	closeEventBus(closeOption: CloseEventBusOption): Promise<void> {
		return this._dispatcher.postRequest(new Request("closeEventBus", [closeOption]))
	}

	reset(): Promise<void> {
		return this._postRequest(new Request("reset", []))
	}

	getLog(): Promise<Array<string>> {
		return this._dispatcher.postRequest(new Request("getLog", []))
	}

	isLeader(): boolean {
		return this._leaderStatus.leaderStatus
	}

	urlify(html: string): Promise<string> {
		return this._postRequest(new Request("urlify", [html]))
	}

	/**
	 * Add data from either secure random source or Math.random as entropy.
	 */
	_getInitialEntropy(): Array<{
		source: EntropySource
		entropy: number
		data: number
	}> {
		const valueList = new Uint32Array(16)
		crypto.getRandomValues(valueList)
		const entropy: Array<{
			source: EntropySource
			entropy: number
			data: number
		}> = []

		for (let i = 0; i < valueList.length; i++) {
			// 32 because we have 32-bit values Uint32Array
			entropy.push({
				source: "random",
				entropy: 32,
				data: valueList[i],
			})
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