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
import {EventBusClient} from "./EventBusClient"
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
import type {NativeInterface} from "../../native/common/NativeInterface"
import {NativeFileApp} from "../../native/common/FileApp"
import {AesApp} from "../../native/worker/AesApp"
import type {RsaImplementation} from "./crypto/RsaImplementation"
import {createRsaImplementation} from "./crypto/RsaImplementation"
import {CryptoFacade, CryptoFacadeImpl} from "./crypto/CryptoFacade"
import {InstanceMapper} from "./crypto/InstanceMapper"
import {EphemeralCacheStorage} from "./rest/EphemeralCacheStorage"
import {AdminClientRestCacheDummy} from "./rest/AdminClientRestCacheDummy"
import {SleepDetector} from "./utils/SleepDetector.js"
import {SchedulerImpl} from "../common/utils/Scheduler.js"
import {WorkerDateProvider} from "./utils/WorkerDateProvider.js"
import {LateInitializedCacheStorage, LateInitializedCacheStorageImpl} from "./rest/CacheStorageProxy"
import {IServiceExecutor} from "../common/ServiceRequest"
import {ServiceExecutor} from "./rest/ServiceExecutor"
import {BookingFacade} from "./facades/BookingFacade"
import {BlobFacade} from "./facades/BlobFacade"
import {DesktopConfigKey} from "../../desktop/config/ConfigKeys"
import {CacheStorage} from "./rest/EntityRestCache.js"
import {UserFacade} from "./facades/UserFacade"
import {OfflineStorage} from "./offline/OfflineStorage.js"
import {exposeNativeInterface} from "../common/ExposeNativeInterface"
import {OFFLINE_STORAGE_MIGRATIONS, OfflineStorageMigrator} from "./offline/OfflineStorageMigrator.js"
import {modelInfos} from "../common/EntityFunctions.js"
import {CustomCacheHandlerMap, CustomCalendarEventCacheHandler} from "./rest/CustomCacheHandler.js"
import {CalendarEventTypeRef} from "../entities/tutanota/TypeRefs.js"
import {FileFacadeSendDispatcher} from "../../native/common/generatedipc/FileFacadeSendDispatcher.js"
import {NativePushFacadeSendDispatcher} from "../../native/common/generatedipc/NativePushFacadeSendDispatcher.js"
import {NativeCryptoFacadeSendDispatcher} from "../../native/common/generatedipc/NativeCryptoFacadeSendDispatcher"
import {random} from "@tutao/tutanota-crypto"
import {SettingsFacadeSendDispatcher} from "../../native/common/generatedipc/SettingsFacadeSendDispatcher.js"

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
	cacheStorage: CacheStorage
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

	const settingsFacade = new SettingsFacadeSendDispatcher(worker)

	const offlineStorageProvider = async () => {
		if (isOfflineStorageAvailable() && await settingsFacade.getBooleanConfigValue(DesktopConfigKey.offlineStorageEnabled)) {
			const {offlineDbFacade} = exposeNativeInterface(locator.native)
			return new OfflineStorage(offlineDbFacade, new WorkerDateProvider(), new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos))
		} else {
			return null
		}
	}

	const maybeUninitializedStorage = isOfflineStorageAvailable()
		? new LateInitializedCacheStorageImpl(worker, offlineStorageProvider)
		: new AlwaysInitializedStorage()

	locator.cacheStorage = maybeUninitializedStorage

	const fileApp = new NativeFileApp(worker, new FileFacadeSendDispatcher(worker))

	// We don't wont to cache within the admin client
	let cache: EntityRestCache | null = null
	if (!isAdminClient()) {
		const customCacheHandlers = isDesktop() && await settingsFacade.getBooleanConfigValue(DesktopConfigKey.offlineStorageEnabled)
			? new CustomCacheHandlerMap({ref: CalendarEventTypeRef, handler: new CustomCalendarEventCacheHandler(entityRestClient)})
			: new CustomCacheHandlerMap()
		cache = new EntityRestCache(entityRestClient, maybeUninitializedStorage, customCacheHandlers)
	}

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache)
	locator.indexer = new Indexer(entityRestClient, worker, browserData, locator.cache as EntityRestCache)
	const mainInterface = worker.getMainInterface()

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
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = new BlobFacade(locator.user, locator.serviceExecutor, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.crypto)
	locator.file = new FileFacade(locator.user, locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.serviceExecutor, locator.crypto)
	locator.mail = new MailFacade(locator.user, locator.file, locator.cachingEntityClient, locator.crypto, locator.serviceExecutor, locator.blob)
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
	// not needed for admin client
	if (cache) {
		locator.calendar = new CalendarFacade(locator.user, locator.groupManagement, cache, nativePushFacade, worker, locator.instanceMapper, locator.serviceExecutor, locator.crypto)
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
	locator.giftCards = new GiftCardFacadeImpl(locator.user, locator.customer, locator.serviceExecutor, locator.crypto)
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

// for cases where we know offlineStorage won't be available
class AlwaysInitializedStorage extends EphemeralCacheStorage implements LateInitializedCacheStorage {
	async initialize(): Promise<{isPersistent: false, isNewOfflineDb: false}> {
		return {
			isPersistent: false,
			isNewOfflineDb: false
		}
	}
}