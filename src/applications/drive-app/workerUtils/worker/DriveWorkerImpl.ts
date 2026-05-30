import { assertWorkerOrNode, isMainOrNode, ProgrammingError } from "../../../../platform-kit/app-env"
import { initLocator, locator, resetLocator } from "./DriveWorkerLocator.js"
import { DelayedImpls, exposeLocalDelayed, exposeRemote } from "../../../common/api/common/WorkerProxy.js"
import { random } from "../../../../platform-kit/crypto"
import { CommonWorkerInterface, MainInterface } from "../../../common/api/worker/workerInterfaces.js"
import { CryptoError } from "../../../../platform-kit/crypto/error"
import { errorToObj } from "../../../../platform-kit/utils"
import { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface"
import { MessageDispatcher } from "../../../../app-kit/native-bridge/shared/MessageDispatcher"
import { WebWorkerTransport } from "../../../../app-kit/native-bridge/common/threading/WebTransport"
import { Commands } from "../../../../app-kit/native-bridge/shared/MessageTypes"
import { Request } from "../../../../app-kit/native-bridge/shared/MessageTypes.js"
import { objToError } from "../../../common/api/common/utils/ErrorUtils"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { NamedClientModel } from "@tutao/instance-pipeline"
import { NotAuthenticatedError } from "../../../../platform-kit/rest-client/error"

assertWorkerOrNode()

type WorkerRequest = Request<WorkerRequestType>

export class DriveWorkerImpl implements NativeInterface {
	private readonly _scope: DedicatedWorkerGlobalScope
	private readonly _dispatcher: MessageDispatcher<MainRequestType, WorkerRequestType>

	constructor(self: DedicatedWorkerGlobalScope) {
		this._scope = self
		this._dispatcher = new MessageDispatcher(new WebWorkerTransport(this._scope), this.queueCommands(this.exposedInterface), "worker-main", objToError)
	}

	async init(browserData: BrowserData, apps: Array<NamedClientModel>): Promise<void> {
		await initLocator(this, browserData, apps)
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
				return locator.base.login
			},

			async customerFacade() {
				return locator.customer()
			},

			async giftCardFacade() {
				return locator.giftCards()
			},

			async groupManagementFacade() {
				return locator.base.groupManagement()
			},

			async identityKeyCreator() {
				return locator.base.identityKeyCreator()
			},

			async configFacade() {
				return locator.configFacade()
			},

			async calendarFacade() {
				throw new Error("not implemented")
			},

			async alarmFacade() {
				throw new Error("not implemented")
			},

			async mailFacade() {
				throw new Error("not implemented")
			},

			async shareFacade() {
				return locator.base.share()
			},

			async cacheManagementFacade() {
				return locator.cacheManagement()
			},

			async counterFacade() {
				return locator.base.counters()
			},

			async bookingFacade() {
				return locator.booking()
			},

			async mailAddressFacade() {
				return locator.mailAddress()
			},

			async keyVerificationFacade() {
				return locator.base.keyVerification()
			},

			async blobAccessTokenFacade() {
				return locator.base.blobAccessToken
			},

			async blobFacade() {
				return locator.blob()
			},

			async userManagementFacade() {
				return locator.userManagement()
			},

			async recoverCodeFacade() {
				return locator.base.recoverCode()
			},

			async restInterface() {
				return locator.base.cache
			},

			async serviceExecutor() {
				return locator.base.serviceExecutor
			},

			async cryptoFacade() {
				return locator.base.crypto
			},

			async publicEncryptionKeyProvider() {
				return locator.base.publicEncryptionKeyProvider
			},

			async publicIdentityKeyProvider() {
				return locator.base.publicIdentityKeyProvider
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
				return locator.base.entropyFacade
			},

			async workerFacade() {
				return locator.workerFacade
			},

			async contactFacade() {
				throw new Error("not implemented")
			},

			async applicationTypesFacade() {
				return locator.base.applicationTypesFacade
			},

			async driveFacade() {
				return locator.driveFacade()
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
				return Promise.reject(new Error(`restRequest is not implemented for Drive worker`))
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
