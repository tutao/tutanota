import type {Commands} from "../common/MessageDispatcher"
import {errorToObj, MessageDispatcher, Request, WorkerTransport} from "../common/MessageDispatcher"
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
import {delay} from "@tutao/tutanota-utils"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {WebsocketCounterData} from "../entities/sys/WebsocketCounterData"
import type {ProgressMonitorId} from "../common/utils/ProgressMonitor"
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
import {WsConnectionState} from "../main/WorkerClient";
import {RestClient} from "./rest/RestClient"

assertWorkerOrNode()

/** Interface of the facades exposed by the worker, basically interface for the worker itself */
export interface WorkerInterface {
	readonly loginFacade: LoginFacade
	readonly customerFacade: CustomerFacade
	readonly giftCardFacade: GiftCardFacade
	readonly groupManagementFacade: GroupManagementFacade
	readonly configFacade: ConfigurationDatabase
	readonly calendarFacade: CalendarFacade
	readonly mailFacade: MailFacade
	readonly shareFacade: ShareFacade
	readonly counterFacade: CounterFacade
	readonly indexerFacade: Indexer
	readonly searchFacade: SearchFacade
	readonly bookingFacade: BookingFacade
	readonly mailAddressFacade: MailAddressFacade
	readonly fileFacade: FileFacade
	readonly userManagementFacade: UserManagementFacade
	readonly contactFormFacade: ContactFormFacade
	readonly deviceEncryptionFacade: DeviceEncryptionFacade
	readonly restInterface: EntityRestInterface
}

/** Interface for the "main"/webpage context of the app, interface for the worker client. */
export interface MainInterface {
	readonly secondFactorAuthenticationHandler: SecondFactorAuthHandler
}

type WorkerRequest = Request<WorkerRequestType>

export class WorkerImpl implements NativeInterface {
	private readonly _scope: DedicatedWorkerGlobalScope
	private readonly _dispatcher: MessageDispatcher<MainRequestType, WorkerRequestType>
	private _newEntropy: number
	private _lastEntropyUpdate: number

	constructor(self: DedicatedWorkerGlobalScope) {
		this._scope = self
		this._newEntropy = -1
		this._lastEntropyUpdate = new Date().getTime()
		this._dispatcher = new MessageDispatcher(new WorkerTransport(this._scope), this.queueCommands(this.exposedInterface))
	}

	async init(browserData: BrowserData): Promise<void> {
		await initLocator(this, browserData)
		const workerScope = this._scope

		// only register oncaught error handler if we are in the *real* worker scope
		// Otherwise uncaught error handler might end up in an infinite loop for test cases.
		if (workerScope && !isMainOrNode()) {
			workerScope.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
				this.sendError(event.reason)
			})

			// @ts-ignore
			workerScope.onerror = (e: string | Event, source, lineno, colno, error) => {
				console.error("workerImpl.onerror", e, source, lineno, colno, error)

				if (error instanceof Error) {
					this.sendError(error)
				} else {
					// @ts-ignore
					const err = new Error(e)
					// @ts-ignore
					err.lineNumber = lineno
					// @ts-ignore
					err.columnNumber = colno
					// @ts-ignore
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
			},
		}
	}

	queueCommands(exposedWorker: WorkerInterface): Commands<WorkerRequestType> {
		return {
			setup: async (message) => {
				console.error("WorkerImpl: setup was called after bootstrap! message: ", message)
			},
			testEcho: (message) =>
				Promise.resolve({
					msg: ">>> " + message.args[0].msg,
				}),
			testError: (message) => {
				const errorTypes = {
					ProgrammingError,
					CryptoError,
					NotAuthenticatedError,
				}
				// @ts-ignore
				let ErrorType = errorTypes[message.args[0].errorType]
				return Promise.reject(new ErrorType(`wtf: ${message.args[0].errorType}`))
			},
			reset: (message: WorkerRequest) => {
				return resetLocator()
			},
			restRequest: (message: WorkerRequest) => {
				message.args[3] = Object.assign(locator.login.createAuthHeaders(), message.args[3])
				const args = message.args as Parameters<RestClient["request"]>
				return locator.restClient.request(...args)
			},
			serviceRequest: (message: WorkerRequest) => {
				const args = message.args as Parameters<typeof _service>
				return _service(...args)
			},
			entropy: (message: WorkerRequest) => {
				return this.addEntropy(message.args[0])
			},

			tryReconnectEventBus(message: WorkerRequest) {
				locator.eventBusClient.tryReconnect(
					message.args[0],
					message.args[1],
					message.args[2],
				)
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
				return resolveSessionKey.apply(null, message.args).then((sk: BitArray) => (sk ? keyToBase64(sk) : null))
			},
			getLog: () => {
				const global = self as any

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
		return this._dispatcher.postRequest(new Request("execNative", [msg.requestType, msg.args]))
	}

	getMainInterface(): MainInterface {
		return exposeRemote<MainInterface>(request => this._dispatcher.postRequest(request))
	}

	/**
	 * Adds entropy to the randomizer. Updated the stored entropy for a user when enough entropy has been collected.
	 * @param entropy
	 * @returns {Promise.<void>}
	 */
	addEntropy(
		entropy: {
			source: EntropySource
			entropy: number
			data: number | Array<number>
		}[],
	): Promise<void> {
		try {
			return random.addEntropy(entropy)
		} finally {
			this._newEntropy = this._newEntropy + entropy.reduce((sum, value) => value.entropy + sum, 0)
			let now = new Date().getTime()

			if (this._newEntropy > 5000 && now - this._lastEntropyUpdate > 1000 * 60 * 5) {
				this._lastEntropyUpdate = now
				this._newEntropy = 0
				locator.login.storeEntropy()
			}
		}
	}

	entityEventsReceived(data: EntityUpdate[], eventOwnerGroupId: Id): Promise<void> {
		return this._dispatcher.postRequest(new Request("entityEvent", [data, eventOwnerGroupId]))
	}

	sendError(e: Error): Promise<void> {
		return this._dispatcher.postRequest(new Request("error", [errorToObj(e)]))
	}

	sendProgress(progressPercentage: number): Promise<void> {
		return this._dispatcher.postRequest(new Request("progress", [progressPercentage])).then(() => {
			// the worker sometimes does not send the request if it does not get time
			return delay(0)
		})
	}

	sendIndexState(state: SearchIndexStateInfo): Promise<void> {
		return this._dispatcher.postRequest(new Request("updateIndexState", [state]))
	}

	updateWebSocketState(state: WsConnectionState): Promise<void> {
		console.log("ws displayed state: ", state)
		return this._dispatcher.postRequest(new Request("updateWebSocketState", [state]))
	}

	updateCounter(update: WebsocketCounterData): Promise<void> {
		return this._dispatcher.postRequest(new Request("counterUpdate", [update]))
	}

	infoMessage(message: InfoMessage): Promise<void> {
		return this._dispatcher.postRequest(new Request("infoMessage", [message]))
	}

	createProgressMonitor(totalWork: number): Promise<ProgressMonitorId> {
		return this._dispatcher.postRequest(new Request("createProgressMonitor", [totalWork]))
	}

	progressWorkDone(reference: ProgressMonitorId, totalWork: number): Promise<void> {
		return this._dispatcher.postRequest(new Request("progressWorkDone", [reference, totalWork]))
	}

	updateLeaderStatus(status: WebsocketLeaderStatus): Promise<void> {
		return this._dispatcher.postRequest(new Request("updateLeaderStatus", [status]))
	}

	writeIndexerDebugLog(reason: string, user: User): Promise<void> {
		return this._dispatcher.postRequest(new Request("writeIndexerDebugLog", [reason, user]))
	}
}