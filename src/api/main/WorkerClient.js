// @flow
import {CryptoError} from "../common/error/CryptoError"
import {Queue, Request} from "../common/WorkerProtocol"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {assertMainOrNode, isMain} from "../common/Env"
import type {CloseEventBusOptionEnum, EntropySrcEnum} from "../common/TutanotaConstants"
import {locator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import {downcast, identity, objToError} from "../common/utils/Utils"
import stream from "mithril/stream/stream.js"
import type {InfoMessage} from "../common/CommonTypes"
import type {CalendarFacade} from "../worker/facades/CalendarFacade"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {createWebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {TypeRef} from "../common/utils/TypeRef"
import {addSearchIndexDebugEntry} from "../../misc/IndexerDebugLogger"
import type {GiftCardFacade} from "../worker/facades/GiftCardFacade"
import type {CustomerFacade} from "../worker/facades/CustomerFacade"
import type {WorkerInterface} from "../worker/WorkerImpl"
import type {GroupManagementFacade} from "../worker/facades/GroupManagementFacade"
import type {ConfigurationDatabase} from "../worker/facades/ConfigurationDatabase"
import type {MailFacade} from "../worker/facades/MailFacade"
import type {ShareFacade} from "../worker/facades/ShareFacade"
import type {CounterFacade} from "../worker/facades/CounterFacade"
import type {Indexer} from "../worker/search/Indexer"
import type {MailAddressFacade} from "../worker/facades/MailAddressFacade"
import type {FileFacade} from "../worker/facades/FileFacade"
import type {SearchFacade} from "../worker/search/SearchFacade"
import type {BookingFacade} from "../worker/facades/BookingFacade"
import type {UserManagementFacade} from "../worker/facades/UserManagementFacade"
import type {ContactFormFacade} from "../worker/facades/ContactFormFacade"
import {exposeRemote} from "../common/WorkerProxy"
import type {TypeModel} from "../common/EntityTypes"
import type {LoginFacade} from "../worker/facades/LoginFacade"

assertMainOrNode()

interface Message {
	id: string,
	type: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType,
	args: mixed[]
}

type progressUpdater = (number) => mixed;

export class WorkerClient implements EntityRestInterface, WorkerInterface {
	initialized: Promise<void>;
	_isInitialized: boolean = false

	_queue: Queue;
	_progressUpdater: ?progressUpdater;
	_wsConnection: Stream<WsConnectionState> = stream("terminated");
	+infoMessages: Stream<InfoMessage>;
	_leaderStatus: WebsocketLeaderStatus

	+loginFacade: LoginFacade;
	+customerFacade: CustomerFacade;
	+giftCardFacade: GiftCardFacade;
	+groupManagementFacade: GroupManagementFacade;
	+configFacade: ConfigurationDatabase;
	+calendarFacade: CalendarFacade;
	+mailFacade: MailFacade;
	+shareFacade: ShareFacade;
	+counterFacade: CounterFacade;
	+indexerFacade: Indexer;
	+searchFacade: SearchFacade;
	+bookingFacade: BookingFacade;
	+mailAddressFacade: MailAddressFacade;
	+fileFacade: FileFacade;
	+userManagementFacade: UserManagementFacade;
	+contactFormFacade: ContactFormFacade;

	constructor() {
		this._leaderStatus = createWebsocketLeaderStatus({leaderStatus: false}) //init as non-leader
		this.infoMessages = stream()
		locator.init(this)
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

		const {
			loginFacade,
			customerFacade,
			giftCardFacade,
			groupManagementFacade,
			configFacade,
			calendarFacade,
			mailFacade,
			shareFacade,
			counterFacade,
			indexerFacade,
			searchFacade,
			bookingFacade,
			mailAddressFacade,
			fileFacade,
			userManagementFacade,
			contactFormFacade
		} = exposeRemote<WorkerInterface>(this._queue)

		this.loginFacade = loginFacade
		this.customerFacade = customerFacade
		this.giftCardFacade = giftCardFacade
		this.groupManagementFacade = groupManagementFacade
		this.configFacade = configFacade
		this.calendarFacade = calendarFacade
		this.mailFacade = mailFacade
		this.shareFacade = shareFacade
		this.counterFacade = counterFacade
		this.indexerFacade = indexerFacade
		this.searchFacade = searchFacade
		this.bookingFacade = bookingFacade
		this.mailAddressFacade = mailAddressFacade
		this.fileFacade = fileFacade
		this.userManagementFacade = userManagementFacade
		this.contactFormFacade = contactFormFacade
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
				                       window.env, locator.entropyCollector.getInitialEntropy(), client.browserData()
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
		if (isMain()) {
			locator.entropyCollector.start()
		}
		import("../../native/common/NativeWrapper").then(({nativeApp}) => nativeApp.init())
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

	_postRequest(msg: Request): Promise<any> {
		if (!this._isInitialized) {
			throw new Error("worker has not been initialized, request: " + msg.type)
		}
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
}

export const worker: WorkerClient = new WorkerClient()
