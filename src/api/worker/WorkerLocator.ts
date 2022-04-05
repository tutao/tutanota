import {LoginFacadeImpl} from "./facades/LoginFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {Indexer} from "./search/Indexer"
import type {EntityRestInterface} from "./rest/EntityRestClient"
import {EntityRestClient} from "./rest/EntityRestClient"
import {UserManagementFacade} from "./facades/UserManagementFacade"
import {EntityRestCache} from "./rest/EntityRestCache"
import {GroupManagementFacadeImpl} from "./facades/GroupManagementFacade"
import {MailFacade} from "./facades/MailFacade"
import {MailAddressFacade} from "./facades/MailAddressFacade"
import {BlobFacade} from "./facades/BlobFacade.js"
import {FileFacade} from "./facades/FileFacade.js"
import {SearchFacade} from "./search/SearchFacade"
import {CustomerFacadeImpl} from "./facades/CustomerFacade"
import {CounterFacade} from "./facades/CounterFacade"
import {ENTITY_EVENT_BATCH_EXPIRE_MS, EventBusClient} from "./EventBusClient"
import {assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isOfflineStorageAvailable} from "../common/Env"
import {Const} from "../common/TutanotaConstants"
import type {BrowserData} from "../../misc/ClientConstants"
import {CalendarFacade} from "./facades/CalendarFacade"
import {ShareFacade} from "./facades/ShareFacade"
import {RestClient} from "./rest/RestClient"
import {SuspensionHandler} from "./SuspensionHandler"
import {EntityClient} from "../common/EntityClient"
import {GiftCardFacadeImpl} from "./facades/GiftCardFacade"
import {ConfigurationDatabase} from "./facades/ConfigurationDatabase"
import type {ContactFormFacade} from "./facades/ContactFormFacade"
import {ContactFormFacadeImpl} from "./facades/ContactFormFacade"
import type {DeviceEncryptionFacade} from "./facades/DeviceEncryptionFacade"
import {Aes256DeviceEncryptionFacade} from "./facades/DeviceEncryptionFacade"
import type {NativeInterface} from "../../native/common/NativeInterface"
import {NativeFileApp} from "../../native/common/FileApp"
import {AesApp} from "../../native/worker/AesApp"
import type {RsaImplementation} from "./crypto/RsaImplementation"
import {createRsaImplementation} from "./crypto/RsaImplementation"
import {CryptoFacade, CryptoFacadeImpl} from "./crypto/CryptoFacade"
import {InstanceMapper} from "./crypto/InstanceMapper"
import type {SecondFactorAuthHandler} from "../../misc/2fa/SecondFactorHandler"
import {EphemeralCacheStorage} from "./rest/EphemeralCacheStorage"
import {OfflineStorage} from "./rest/OfflineStorage"
import {exposeRemote} from "../common/WorkerProxy"
import {AdminClientRestCacheDummy} from "./rest/AdminClientRestCacheDummy"
import {SleepDetector} from "./utils/SleepDetector.js"
import {SchedulerImpl} from "../common/utils/Scheduler.js"
import {WorkerDateProvider} from "./utils/WorkerDateProvider.js"
import {LateInitializedCacheStorage, LateInitializedCacheStorageImpl} from "./rest/CacheStorageProxy"
import {uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../common/ServiceRequest"
import {ServiceExecutor} from "./rest/ServiceExecutor"
import {BookingFacade} from "./facades/BookingFacade"
import {OutOfSyncError} from "../common/error/OutOfSyncError"

assertWorkerOrNode()

export type WorkerLocatorType = {
	serviceExecutor: IServiceExecutor
	login: LoginFacadeImpl
	indexer: Indexer
	cache: EntityRestInterface
	cachingEntityClient: EntityClient
	search: SearchFacade
	groupManagement: GroupManagementFacadeImpl
	userManagement: UserManagementFacade
	customer: CustomerFacadeImpl
	file: FileFacade
	blob: BlobFacade
	mail: MailFacade
	calendar: CalendarFacade
	mailAddress: MailAddressFacade
	counters: CounterFacade
	eventBusClient: EventBusClient
	_indexedDbSupported: boolean
	_browserData: BrowserData
	Const: Record<string, any>
	share: ShareFacade
	restClient: RestClient
	giftCards: GiftCardFacadeImpl
	configFacade: ConfigurationDatabase
	contactFormFacade: ContactFormFacade
	deviceEncryptionFacade: DeviceEncryptionFacade
	native: NativeInterface
	secondFactorAuthenticationHandler: SecondFactorAuthHandler
	rsa: RsaImplementation
	crypto: CryptoFacade
	instanceMapper: InstanceMapper
	booking: BookingFacade
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	const getAuthHeaders = () => locator.login.createAuthHeaders()

	const suspensionHandler = new SuspensionHandler(worker, self)
	locator.instanceMapper = new InstanceMapper()
	locator.rsa = await createRsaImplementation(worker)
	locator.restClient = new RestClient(suspensionHandler)
	locator.serviceExecutor = new ServiceExecutor(
		locator.restClient,
		() => locator.login.createAuthHeaders(),
		locator.instanceMapper,
		() => locator.crypto,
	)
	const entityRestClient = new EntityRestClient(getAuthHeaders, locator.restClient, () => locator.crypto, locator.instanceMapper)
	locator._browserData = browserData

	locator.native = worker
	locator.booking = new BookingFacade(locator.serviceExecutor)

	const uninitializedStorage = makeCacheStorage(() => locator.restClient.getServerTimestampMs(), worker)

	// We don't wont to cache within the admin client
	const cache = isAdminClient() ? null : new EntityRestCache(entityRestClient, uninitializedStorage)

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache)
	locator.indexer = new Indexer(entityRestClient, worker, browserData, locator.cache as EntityRestCache)
	const mainInterface = worker.getMainInterface()
	locator.secondFactorAuthenticationHandler = mainInterface.secondFactorAuthenticationHandler
	locator.login = new LoginFacadeImpl(
		worker,
		locator.restClient,
		/**
		 * we don't want to try to use the cache in the login facade, because it may not be available (when no user is logged in)
		 */
		new EntityClient(entityRestClient),
		locator.secondFactorAuthenticationHandler,
		locator.instanceMapper,
		() => locator.crypto,
		uninitializedStorage.initialize.bind(uninitializedStorage),
		locator.serviceExecutor,
	)
	locator.crypto = new CryptoFacadeImpl(locator.login, locator.cachingEntityClient, locator.restClient, locator.rsa, locator.serviceExecutor)
	const suggestionFacades = [
		locator.indexer._contact.suggestionFacade,
		locator.indexer._groupInfo.suggestionFacade,
		locator.indexer._whitelabelChildIndexer.suggestionFacade,
	]
	locator.search = new SearchFacade(locator.login, locator.indexer.db, locator.indexer._mail, suggestionFacades, browserData, locator.cachingEntityClient)
	locator.counters = new CounterFacade(locator.serviceExecutor)
	locator.groupManagement = new GroupManagementFacadeImpl(locator.login, locator.counters, locator.cachingEntityClient, locator.rsa, locator.serviceExecutor)
	locator.userManagement = new UserManagementFacade(
		worker,
		locator.login,
		locator.groupManagement,
		locator.counters,
		locator.rsa,
		locator.cachingEntityClient,
		locator.serviceExecutor,
	)
	locator.customer = new CustomerFacadeImpl(
		worker,
		locator.login,
		locator.groupManagement,
		locator.userManagement,
		locator.counters,
		locator.rsa,
		locator.cachingEntityClient,
		locator.serviceExecutor,
		locator.booking,
	)
	const fileApp = new NativeFileApp(worker)
	const aesApp = new AesApp(worker)
	locator.blob = new BlobFacade(locator.login, locator.serviceExecutor, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.crypto)
	locator.file = new FileFacade(locator.login, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.serviceExecutor)
	locator.mail = new MailFacade(locator.login, locator.file, locator.blob, locator.cachingEntityClient, locator.crypto, locator.serviceExecutor)
	// not needed for admin client
	if (cache) {
		locator.calendar = new CalendarFacade(locator.login, locator.groupManagement, cache, worker, worker, locator.instanceMapper, locator.serviceExecutor)
	}
	locator.mailAddress = new MailAddressFacade(locator.login, locator.serviceExecutor)

	const dateProvider = new WorkerDateProvider()
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.eventBusClient = new EventBusClient(
		worker,
		locator.indexer,
		cache ?? new AdminClientRestCacheDummy(),
		locator.mail,
		locator.login,
		locator.cachingEntityClient,
		locator.instanceMapper,
		(path) => new WebSocket(getWebsocketOrigin() + path),
		new SleepDetector(scheduler, dateProvider),
	)
	locator.login.init(locator.indexer, locator.eventBusClient)
	locator.Const = Const
	locator.share = new ShareFacade(locator.login, locator.crypto, locator.serviceExecutor)
	locator.giftCards = new GiftCardFacadeImpl(locator.login, locator.serviceExecutor)
	locator.configFacade = new ConfigurationDatabase(locator.login)
	locator.contactFormFacade = new ContactFormFacadeImpl(locator.restClient, locator.instanceMapper)
	locator.deviceEncryptionFacade = new Aes256DeviceEncryptionFacade()
}

export async function resetLocator(): Promise<void> {
	await locator.login.resetSession()
	await initLocator(locator.login.worker, locator._browserData)
}

if (typeof self !== "undefined") {
	(self as unknown as WorkerGlobalScope).locator = locator // export in worker scope
}

function makeCacheStorage(getServerTime: () => number, worker: WorkerImpl): LateInitializedCacheStorage {
	if (isOfflineStorageAvailable()) {
		return new LateInitializedCacheStorageImpl(async (args) => {
			if (args.persistent) {
				const {offlineDbFacade} = exposeRemote((request) => locator.native.invokeNative(request))
				const offlineStorage = new OfflineStorage(offlineDbFacade)
				await offlineStorage.init(args.userId, uint8ArrayToKey(args.databaseKey))

				const lastUpdateTime = await offlineStorage.getLastUpdateTime()
				if (lastUpdateTime != null) {
					const serverTime = getServerTime()
					if (serverTime - lastUpdateTime > ENTITY_EVENT_BATCH_EXPIRE_MS) {
						console.log(`Purging database for user ${args.userId} because it is out of sync`)
						await offlineStorage.purgeStorage()
						worker.sendError(new OutOfSyncError("database is out of sync"))
					}
				}
				return offlineStorage
			} else {
				return new EphemeralCacheStorage()
			}
		})
	} else {
		return new AlwaysInitializedStorage()
	}
}

// for cases where we know offlineStorage won't be available
class AlwaysInitializedStorage extends EphemeralCacheStorage implements LateInitializedCacheStorage {
	async initialize(): Promise<void> {
		// do nothing
	}
}