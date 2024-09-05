import type { Commands } from "../../../common/api/common/threading/MessageDispatcher.js"
import { errorToObj, MessageDispatcher, Request } from "../../../common/api/common/threading/MessageDispatcher.js"
import { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import { NotAuthenticatedError } from "../../../common/api/common/error/RestError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { initLocator, locator, resetLocator } from "./WorkerLocator.js"
import { assertWorkerOrNode, isMainOrNode } from "../../../common/api/common/Env.js"
import type { BrowserData } from "../../../common/misc/ClientConstants.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { LoginFacade } from "../../../common/api/worker/facades/LoginFacade.js"
import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import type { GroupManagementFacade } from "../../../common/api/worker/facades/lazy/GroupManagementFacade.js"
import { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { ShareFacade } from "../../../common/api/worker/facades/lazy/ShareFacade.js"
import { CounterFacade } from "../../../common/api/worker/facades/lazy/CounterFacade.js"
import type { Indexer } from "../index/Indexer.js"
import { SearchFacade } from "../index/SearchFacade.js"
import { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade.js"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade.js"
import { DelayedImpls, exposeLocalDelayed, exposeRemote } from "../../../common/api/common/WorkerProxy.js"
import { random } from "@tutao/tutanota-crypto"
import type { NativeInterface } from "../../../common/native/common/NativeInterface.js"
import type { EntityRestInterface } from "../../../common/api/worker/rest/EntityRestClient.js"
import { RestClient } from "../../../common/api/worker/rest/RestClient.js"
import { IServiceExecutor } from "../../../common/api/common/ServiceRequest.js"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import { BlobAccessTokenFacade } from "../../../common/api/worker/facades/BlobAccessTokenFacade.js"
import { EntropyFacade } from "../../../common/api/worker/facades/EntropyFacade.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade.js"
import { WebWorkerTransport } from "../../../common/api/common/threading/Transport.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { RecoverCodeFacade } from "../../../common/api/worker/facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { ExposedEventBus, MainInterface, WorkerRandomizer } from "../../../common/api/worker/workerInterfaces.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { CryptoWrapper } from "../../../common/api/worker/crypto/CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "../../../common/api/worker/crypto/AsymmetricCryptoFacade.js"

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
	readonly cacheManagementFacade: CacheManagementFacade
	readonly counterFacade: CounterFacade
	readonly indexerFacade: Indexer
	readonly searchFacade: SearchFacade
	readonly bookingFacade: BookingFacade
	readonly mailAddressFacade: MailAddressFacade
	readonly blobAccessTokenFacade: BlobAccessTokenFacade
	readonly blobFacade: BlobFacade
	readonly userManagementFacade: UserManagementFacade
	readonly recoverCodeFacade: RecoverCodeFacade
	readonly restInterface: EntityRestInterface
	readonly serviceExecutor: IServiceExecutor
	readonly cryptoWrapper: CryptoWrapper
	readonly asymmetricCryptoFacade: AsymmetricCryptoFacade
	readonly cryptoFacade: CryptoFacade
	readonly cacheStorage: ExposedCacheStorage
	readonly sqlCipherFacade: SqlCipherFacade
	readonly random: WorkerRandomizer
	readonly eventBus: ExposedEventBus
	readonly entropyFacade: EntropyFacade
	readonly workerFacade: WorkerFacade
	readonly contactFacade: ContactFacade
}

type WorkerRequest = Request<WorkerRequestType>

export class WorkerImpl implements NativeInterface {
	private readonly _scope: DedicatedWorkerGlobalScope
	private readonly _dispatcher: MessageDispatcher<MainRequestType, WorkerRequestType>

	constructor(self: DedicatedWorkerGlobalScope) {
		this._scope = self
		this._dispatcher = new MessageDispatcher(new WebWorkerTransport(this._scope), this.queueCommands(this.exposedInterface), "worker-main")
	}

	async init(browserData: BrowserData): Promise<void> {
		// import("tuta-sdk").then(async (module) => {
		// 	// await module.default("wasm/tutasdk.wasm")
		// 	const entityClient = new module.EntityClient()
		// 	const typeRef = new module.TypeRef("tutanota", "Mail")
		// 	console.log("result from rust: ", awai t entityClient.load_element(typeRef, "myId"))
		// 	typeRef.free()
		// 	entityClient.free()
		// })

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

	get exposedInterface(): DelayedImpls<WorkerInterface> {
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

			async indexerFacade() {
				return locator.indexer()
			},

			async searchFacade() {
				return locator.search()
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

			async cryptoWrapper() {
				return locator.cryptoWrapper
			},

			async asymmetricCryptoFacade() {
				return locator.asymmetricCrypto
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

	queueCommands(exposedWorker: DelayedImpls<WorkerInterface>): Commands<WorkerRequestType> {
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
				// This horror is to add auth headers to the admin client
				const args = message.args as Parameters<RestClient["request"]>
				let [path, method, options] = args
				options = options ?? {}
				options.headers = { ...locator.user.createAuthHeaders(), ...options.headers }
				return locator.restClient.request(path, method, options)
			},

			facade: exposeLocalDelayed<DelayedImpls<WorkerInterface>, WorkerRequestType>(exposedWorker),
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
