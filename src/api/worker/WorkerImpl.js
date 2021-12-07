// @flow
import type {Commands} from "../common/Queue"
import {errorToObj, Queue, Request, WorkerTransport} from "../common/Queue"
import {CryptoError} from "../common/error/CryptoError"
import {BookingFacade, bookingFacade} from "./facades/BookingFacade"
import {NotAuthenticatedError} from "../common/error/RestError"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {initLocator, locator, resetLocator} from "./WorkerLocator"
import {_service} from "./rest/ServiceRestClient"
import {assertWorkerOrNode, isMainOrNode} from "../common/Env"
import type {ContactFormFacade} from "./facades/ContactFormFacade"
import type {BrowserData} from "../../misc/ClientConstants"
import type {InfoMessage} from "../common/CommonTypes"
import {resolveSessionKey} from "./crypto/CryptoFacade"
import {delay, downcast} from "@tutao/tutanota-utils"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {WebsocketCounterData} from "../entities/sys/WebsocketCounterData"
import type {ProgressMonitorId} from "../common/utils/ProgressMonitor";
import type {WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import type {User} from "../entities/sys/User"
import {urlify} from "./Urlifier"
import type {GiftCardFacade} from "./facades/GiftCardFacade"
import type {LoginFacade} from "./facades/LoginFacade"
import type {CustomerFacade} from "./facades/CustomerFacade"
import type {GroupManagementFacade} from "./facades/GroupManagementFacade"
import {ConfigurationDatabase} from "./facades/ConfigurationDatabase"
import {CalendarFacade} from "./facades/CalendarFacade"
import {MailFacade} from "./facades/MailFacade"
import {ShareFacade} from "./facades/ShareFacade"
import {CounterFacade} from "./facades/CounterFacade"
import {Indexer} from "./search/Indexer"
import {SearchFacade} from "./search/SearchFacade"
import {MailAddressFacade} from "./facades/MailAddressFacade"
import {FileFacade} from "./facades/FileFacade"
import {UserManagementFacade} from "./facades/UserManagementFacade"
import {exposeLocal, exposeRemote} from "../common/WorkerProxy"
import type {SearchIndexStateInfo} from "./search/SearchTypes"
import type {DeviceEncryptionFacade} from "./facades/DeviceEncryptionFacade"
import type {EntropySource} from "@tutao/tutanota-crypto"
import {aes256RandomKey, keyToBase64, random} from "@tutao/tutanota-crypto"
import type {NativeInterface} from "../../native/common/NativeInterface"
import type {SecondFactorAuthHandler} from "../../misc/2fa/SecondFactorHandler"
import type {EntityRestInterface} from "./rest/EntityRestClient"


assertWorkerOrNode()

/** Interface of the facades exposed by the worker, basically interface for the worker itself */
export interface WorkerInterface {
	+loginFacade: LoginFacade,
	+customerFacade: CustomerFacade,
	+giftCardFacade: GiftCardFacade,
	+groupManagementFacade: GroupManagementFacade,
	+configFacade: ConfigurationDatabase,
	+calendarFacade: CalendarFacade,
	+mailFacade: MailFacade,
	+shareFacade: ShareFacade,
	+counterFacade: CounterFacade,
	+indexerFacade: Indexer,
	+searchFacade: SearchFacade,
	+bookingFacade: BookingFacade,
	+mailAddressFacade: MailAddressFacade,
	+fileFacade: FileFacade,
	+userManagementFacade: UserManagementFacade;
	+contactFormFacade: ContactFormFacade;
	+deviceEncryptionFacade: DeviceEncryptionFacade;
	+restInterface: EntityRestInterface;
}

/** Interface for the "main"/webpage context of the app, interface for the worker client. */
export interface MainInterface {
	+secondFactorAuthenticationHandler: SecondFactorAuthHandler;
}

type WorkerRequest = Request<WorkerRequestType>

export class WorkerImpl implements NativeInterface {
	_scope: ?DedicatedWorkerGlobalScope
	_queue: Queue<MainRequestType, WorkerRequestType>;
	_newEntropy: number;
	_lastEntropyUpdate: number;

	constructor(self: ?DedicatedWorkerGlobalScope) {
		this._scope = self
		this._newEntropy = -1
		this._lastEntropyUpdate = new Date().getTime()
		this._queue = new Queue(
			this._scope && new WorkerTransport(this._scope),
			this.queueCommands(this.exposedInterface)
		)
	}

	async init(browserData: BrowserData): Promise<void> {

		await initLocator(this, browserData);

		const workerScope = this._scope

		// only register oncaught error handler if we are in the *real* worker scope
		// Otherwise uncaught error handler might end up in an infinite loop for test cases.
		if (workerScope && !isMainOrNode()) {

			// $FlowIssue[incompatible-call]
			workerScope.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
				this.sendError(event.reason)
			})

			workerScope.onerror = (e: string | Event, source, lineno, colno, error) => {
				console.error("workerImpl.onerror", e, source, lineno, colno, error)
				if (error instanceof Error) {
					this.sendError(error)
				} else {
					const err = new Error(e)
					err.lineNumber = lineno
					err.columnNumber = colno
					err.fileName = source
					this.sendError(err)
				}
				return true
			}
		}
	}

	get exposedInterface(): WorkerInterface {
		return {
			get loginFacade() {
				return locator.login
			},
			get customerFacade() {
				return locator.customer
			},
			get giftCardFacade() {
				return locator.giftCards
			},
			get groupManagementFacade() {
				return locator.groupManagement
			},
			get configFacade() {
				return locator.configFacade
			},
			get calendarFacade() {
				return locator.calendar
			},
			get mailFacade() {
				return locator.mail
			},
			get shareFacade() {
				return locator.share
			},
			get counterFacade() {
				return locator.counters
			},
			get indexerFacade() {
				return locator.indexer
			},
			get searchFacade() {
				return locator.search
			},
			get bookingFacade() {
				return bookingFacade
			},
			get mailAddressFacade() {
				return locator.mailAddress
			},
			get fileFacade() {
				return locator.file
			},
			get userManagementFacade() {
				return locator.userManagement
			},
			get contactFormFacade() {
				return locator.contactFormFacade
			},
			get deviceEncryptionFacade() {
				return locator.deviceEncryptionFacade
			},
			get restInterface() {
				return locator.cache
			}
		}
	}

	queueCommands(exposedWorker: WorkerInterface): Commands<WorkerRequestType> {
		return {
			testEcho: (message: any) => Promise.resolve({msg: ">>> " + message.args[0].msg}),
			testError: (message: any) => {
				const errorTypes = {
					ProgrammingError,
					CryptoError,
					NotAuthenticatedError
				}
				let ErrorType = errorTypes[message.args[0].errorType]
				return Promise.reject(new ErrorType(`wtf: ${message.args[0].errorType}`))
			},
			reset: (message: WorkerRequest) => {
				return resetLocator()
			},
			restRequest: (message: WorkerRequest) => {
				message.args[3] = Object.assign(locator.login.createAuthHeaders(), message.args[3])
				return locator.restClient.request(...message.args)
			},
			serviceRequest: (message: WorkerRequest) => {
				return _service.apply(null, message.args)
			},
			entropy: (message: WorkerRequest) => {
				return this.addEntropy(message.args[0])
			},
			tryReconnectEventBus(message: WorkerRequest) {
				locator.eventBusClient.tryReconnect(...message.args)
				return Promise.resolve()
			},
			generateSsePushIdentifer: () => {
				return Promise.resolve(keyToBase64(aes256RandomKey()))
			},
			closeEventBus: (message: WorkerRequest) => {
				locator.eventBusClient.close(message.args[0])
				return Promise.resolve()
			},
			resolveSessionKey: (message: WorkerRequest) => {
				return resolveSessionKey.apply(null, message.args).then(sk => sk ? keyToBase64(sk) : null)
			},
			getLog: () => {
				const global = downcast(self)
				if (global.logger) {
					return Promise.resolve(global.logger.getEntries())
				} else {
					return Promise.resolve([])
				}
			},
			urlify: async (message: WorkerRequest) => {
				const html: string = message.args[0]
				return Promise.resolve(urlify(html))
			},
			facade: exposeLocal(exposedWorker),
		}
	}

	invokeNative(msg: Request<NativeRequestType>): Promise<any> {
		return this._queue.postRequest(new Request("execNative", [msg.requestType, msg.args]))
	}


	getMainInterface(): MainInterface {
		return exposeRemote(this._queue)
	}

	/**
	 * Adds entropy to the randomizer. Updated the stored entropy for a user when enough entropy has been collected.
	 * @param entropy
	 * @returns {Promise.<void>}
	 */
	addEntropy(entropy: {source: EntropySource, entropy: number, data: number | Array<number>}[]): Promise<void> {
		try {
			return random.addEntropy(entropy)
		} finally {
			this._newEntropy = this._newEntropy + entropy.reduce((sum, value) => value.entropy + sum, 0)
			let now = new Date().getTime()
			if (this._newEntropy > 5000 && (now - this._lastEntropyUpdate) > 1000 * 60 * 5) {
				this._lastEntropyUpdate = now
				this._newEntropy = 0
				locator.login.storeEntropy()
			}
		}
	}

	entityEventsReceived(data: EntityUpdate[], eventOwnerGroupId: Id): Promise<void> {
		return this._queue.postRequest(new Request("entityEvent", [data, eventOwnerGroupId]))
	}

	sendError(e: Error): Promise<void> {
		return this._queue.postRequest(new Request("error", [errorToObj(e)]))
	}

	sendProgress(progressPercentage: number): Promise<void> {
		return this._queue.postRequest(new Request("progress", [progressPercentage])).then(() => {
			// the worker sometimes does not send the request if it does not get time
			return delay(0)
		})
	}

	sendIndexState(state: SearchIndexStateInfo): Promise<void> {
		return this._queue.postRequest(new Request("updateIndexState", [state]))
	}

	updateWebSocketState(state: WsConnectionState): Promise<void> {
		console.log("ws displayed state: ", state)
		return this._queue.postRequest(new Request("updateWebSocketState", [state]))
	}

	updateCounter(update: WebsocketCounterData): Promise<void> {
		return this._queue.postRequest(new Request("counterUpdate", [update]))
	}

	infoMessage(message: InfoMessage): Promise<void> {
		return this._queue.postRequest(new Request("infoMessage", [message]))
	}

	createProgressMonitor(totalWork: number): Promise<ProgressMonitorId> {
		return this._queue.postRequest(new Request("createProgressMonitor", [totalWork]))
	}

	progressWorkDone(reference: ProgressMonitorId, totalWork: number): Promise<void> {
		return this._queue.postRequest(new Request("progressWorkDone", [reference, totalWork]))
	}

	updateLeaderStatus(status: WebsocketLeaderStatus): Promise<void> {
		return this._queue.postRequest(new Request("updateLeaderStatus", [status]))
	}

	writeIndexerDebugLog(reason: string, user: User): Promise<void> {
		return this._queue.postRequest(new Request("writeIndexerDebugLog", [reason, user]))
	}
}


