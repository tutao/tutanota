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
import {FileFacade} from "./facades/FileFacade"
import {SearchFacade} from "./search/SearchFacade"
import {CustomerFacadeImpl} from "./facades/CustomerFacade"
import {CounterFacade} from "./facades/CounterFacade"
import {ENTITY_EVENT_BATCH_EXPIRE_MS, EventBusClient} from "./EventBusClient"
import {assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isDesktop, isOfflineStorageAvailable} from "../common/Env"
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
import type {ExposedNativeInterface, NativeInterface} from "../../native/common/NativeInterface"
import {NativeFileApp} from "../../native/common/FileApp"
import {AesApp} from "../../native/worker/AesApp"
import type {RsaImplementation} from "./crypto/RsaImplementation"
import {createRsaImplementation} from "./crypto/RsaImplementation"
import {CryptoFacade, CryptoFacadeImpl} from "./crypto/CryptoFacade"
import {InstanceMapper} from "./crypto/InstanceMapper"
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
import {BlobFacade} from "./facades/BlobFacade"
import {NativeSystemApp} from "../../native/common/NativeSystemApp"
import {DesktopConfigKey} from "../../desktop/config/ConfigKeys"
import {CacheStorageFactory} from "./rest/CacheStorageFactory"
import {UserFacade} from "./facades/UserFacade"

assertWorkerOrNode()

export type WorkerLocatorType = {
	serviceExecutor: IServiceExecutor
	login: LoginFacadeImpl
	user: UserFacade
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
	rsa: RsaImplementation
	crypto: CryptoFacade
	instanceMapper: InstanceMapper
	booking: BookingFacade
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	locator.user = new UserFacade()

	const suspensionHandler = new SuspensionHandler(worker, self)
	locator.instanceMapper = new InstanceMapper()
	locator.rsa = await createRsaImplementation(worker)
	locator.restClient = new RestClient(suspensionHandler)
	locator.serviceExecutor = new ServiceExecutor(
		locator.restClient,
		locator.user,
		locator.instanceMapper,
		() => locator.crypto,
	)
	const entityRestClient = new EntityRestClient(locator.user, locator.restClient, () => locator.crypto, locator.instanceMapper)
	locator._browserData = browserData

	locator.native = worker
	locator.booking = new BookingFacade(locator.serviceExecutor)

	const maybeUninitializedStorage = isOfflineStorageAvailable()
		? new LateInitializedCacheStorageImpl(new CacheStorageFactory(() => locator.restClient.getServerTimestampMs(), worker, locator.native))
		: new AlwaysInitializedStorage()

	// We don't wont to cache within the admin client
	const cache = isAdminClient() ? null : new EntityRestCache(entityRestClient, maybeUninitializedStorage)

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache)
	locator.indexer = new Indexer(entityRestClient, worker, browserData, locator.cache as EntityRestCache)
	const mainInterface = worker.getMainInterface()

	const fileApp = new NativeFileApp(worker)
	const systemApp = new NativeSystemApp(worker, fileApp)

	locator.crypto = new CryptoFacadeImpl(locator.user, locator.cachingEntityClient, locator.restClient, locator.rsa, locator.serviceExecutor)
	locator.login = new LoginFacadeImpl(
		worker,
		locator.restClient,
		/**
		 * we don't want to try to use the cache in the login facade, because it may not be available (when no user is logged in)
		 */
		new EntityClient(locator.cache),
		mainInterface.loginListener,
		locator.instanceMapper,
		locator.crypto,
		maybeUninitializedStorage.initialize.bind(maybeUninitializedStorage),
		locator.serviceExecutor,
		async () => isDesktop() && await systemApp.getConfigValue(DesktopConfigKey.offlineStorageEnabled),
		locator.user,
	)
	const suggestionFacades = [
		locator.indexer._contact.suggestionFacade,
		locator.indexer._groupInfo.suggestionFacade,
		locator.indexer._whitelabelChildIndexer.suggestionFacade,
	]
	locator.search = new SearchFacade(locator.user, locator.indexer.db, locator.indexer._mail, suggestionFacades, browserData, locator.cachingEntityClient)
	locator.counters = new CounterFacade(locator.serviceExecutor)
	locator.groupManagement = new GroupManagementFacadeImpl(locator.user, locator.counters, locator.cachingEntityClient, locator.rsa, locator.serviceExecutor)
	locator.userManagement = new UserManagementFacade(
		worker,
		locator.user,
		locator.groupManagement,
		locator.counters,
		locator.rsa,
		locator.cachingEntityClient,
		locator.serviceExecutor,
	)
	locator.customer = new CustomerFacadeImpl(
		worker,
		locator.user,
		locator.groupManagement,
		locator.userManagement,
		locator.counters,
		locator.rsa,
		locator.cachingEntityClient,
		locator.serviceExecutor,
		locator.booking,
		locator.crypto,
	)
	const aesApp = new AesApp(worker)
	locator.blob = new BlobFacade(locator.user, locator.serviceExecutor, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.crypto)
	locator.file = new FileFacade(locator.user, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.serviceExecutor, locator.crypto)
	locator.mail = new MailFacade(locator.user, locator.file, locator.cachingEntityClient, locator.crypto, locator.serviceExecutor, locator.blob)
	// not needed for admin client
	if (cache) {
		locator.calendar = new CalendarFacade(locator.user, locator.groupManagement, cache, worker, worker, locator.instanceMapper, locator.serviceExecutor, locator.crypto)
	}
	locator.mailAddress = new MailAddressFacade(locator.user, locator.serviceExecutor)

	const dateProvider = new WorkerDateProvider()
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.eventBusClient = new EventBusClient(
		worker,
		locator.indexer,
		cache ?? new AdminClientRestCacheDummy(),
		locator.mail,
		locator.user,
		locator.cachingEntityClient,
		locator.instanceMapper,
		(path) => new WebSocket(getWebsocketOrigin() + path),
		new SleepDetector(scheduler, dateProvider),
		locator.login,
	)
	locator.login.init(locator.indexer, locator.eventBusClient)
	locator.Const = Const
	locator.share = new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient)
	locator.giftCards = new GiftCardFacadeImpl(locator.user, locator.serviceExecutor, locator.crypto)
	locator.configFacade = new ConfigurationDatabase(locator.user)
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
				const {offlineDbFacade} = exposeRemote<ExposedNativeInterface>((request) => locator.native.invokeNative(request))
				const offlineStorage = new OfflineStorage(offlineDbFacade)
				await offlineStorage.init(args.userId, uint8ArrayToKey(args.databaseKey))
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