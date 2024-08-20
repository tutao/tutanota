import type { Commands } from "../../../common/api/common/threading/MessageDispatcher.js"
import { errorToObj, MessageDispatcher, Request } from "../../../common/api/common/threading/MessageDispatcher.js"
import { NotAuthenticatedError } from "../../../common/api/common/error/RestError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { initLocator, locator, resetLocator } from "./CalendarWorkerLocator.js"
import { assertWorkerOrNode, isMainOrNode } from "../../../common/api/common/Env.js"
import type { BrowserData } from "../../../common/misc/ClientConstants.js"
import { DelayedImpls, exposeLocalDelayed, exposeRemote } from "../../../common/api/common/WorkerProxy.js"
import { random } from "@tutao/tutanota-crypto"
import type { NativeInterface } from "../../../common/native/common/NativeInterface.js"
import { WebWorkerTransport } from "../../../common/api/common/threading/Transport.js"
import { CommonWorkerInterface, MainInterface } from "../../../common/api/worker/workerInterfaces.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

assertWorkerOrNode()

type WorkerRequest = Request<WorkerRequestType>

export class CalendarWorkerImpl implements NativeInterface {
	private readonly _scope: DedicatedWorkerGlobalScope
	private readonly _dispatcher: MessageDispatcher<MainRequestType, WorkerRequestType>

	constructor(self: DedicatedWorkerGlobalScope) {
		this._scope = self
		this._dispatcher = new MessageDispatcher(new WebWorkerTransport(this._scope), this.queueCommands(this.exposedInterface), "worker-main")
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

	get exposedInterface(): DelayedImpls<CommonWorkerInterface> {
		return {
			async loginFacade() {
				return locator.login
			},

			async customerFacade() {
				return locator.customer()
			},

			async giftCardFacade() {
				return locator.giftCards()
			},

			async groupManagementFacade() {
				return locator.groupManagement()
			},

			async configFacade() {
				return locator.configFacade()
			},

			async calendarFacade() {
				return locator.calendar()
			},

			async mailFacade() {
				return locator.mail()
			},

			async shareFacade() {
				return locator.share()
			},

			async cacheManagementFacade() {
				return locator.cacheManagement()
			},

			async counterFacade() {
				return locator.counters()
			},

			async bookingFacade() {
				return locator.booking()
			},

			async mailAddressFacade() {
				return locator.mailAddress()
			},

			async blobAccessTokenFacade() {
				return locator.blobAccessToken
			},

			async blobFacade() {
				return locator.blob()
			},

			async userManagementFacade() {
				return locator.userManagement()
			},

			async recoverCodeFacade() {
				return locator.recoverCode()
			},

			async restInterface() {
				return locator.cache
			},

			async serviceExecutor() {
				return locator.serviceExecutor
			},

			async cryptoFacade() {
				return locator.crypto
			},

			async cacheStorage() {
				return locator.cacheStorage
			},

			async sqlCipherFacade() {
				return locator.sqlCipherFacade
			},

			async random() {
				return {
					async generateRandomNumber(nbrOfBytes: number) {
						return random.generateRandomNumber(nbrOfBytes)
					},
				}
			},

			async eventBus() {
				return locator.eventBusClient
			},

			async entropyFacade() {
				return locator.entropyFacade
			},

			async workerFacade() {
				return locator.workerFacade
			},

			async contactFacade() {
				return locator.contactFacade()
			},
		}
	}

	queueCommands(exposedWorker: DelayedImpls<CommonWorkerInterface>): Commands<WorkerRequestType> {
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
				// Rest Requests only come from the admin client, not needed here
				return Promise.reject(new Error(`restRequest is not implemented for Calendar Worker`))
			},

			facade: exposeLocalDelayed<DelayedImpls<CommonWorkerInterface>, WorkerRequestType>(exposedWorker),
		}
	}

	invokeNative(requestType: string, args: ReadonlyArray<unknown>): Promise<any> {
		return this._dispatcher.postRequest(new Request("execNative", [requestType, args]))
	}

	getMainInterface(): MainInterface {
		return exposeRemote<MainInterface>((request) => this._dispatcher.postRequest(request))
	}

	sendError(e: Error): Promise<void> {
		return this._dispatcher.postRequest(new Request("error", [errorToObj(e)]))
	}
}
