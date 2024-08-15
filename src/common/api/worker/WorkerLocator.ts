import { CacheInfo, LoginFacade, LoginListener } from "./facades/LoginFacade"
import type { WorkerImpl } from "./WorkerImpl"
import type { Indexer } from "./search/Indexer"
import type { EntityRestInterface } from "./rest/EntityRestClient"
import { EntityRestClient } from "./rest/EntityRestClient"
import type { UserManagementFacade } from "./facades/lazy/UserManagementFacade.js"
import { CacheStorage, DefaultEntityRestCache } from "./rest/DefaultEntityRestCache.js"
import type { GroupManagementFacade } from "./facades/lazy/GroupManagementFacade.js"
import type { MailFacade } from "./facades/lazy/MailFacade.js"
import type { MailAddressFacade } from "./facades/lazy/MailAddressFacade.js"
import type { CustomerFacade } from "./facades/lazy/CustomerFacade.js"
import type { CounterFacade } from "./facades/lazy/CounterFacade.js"
import { EventBusClient } from "./EventBusClient"
import { assertWorkerOrNode, getWebsocketBaseUrl, isAdminClient, isAndroidApp, isBrowser, isIOSApp, isOfflineStorageAvailable, isTest } from "../common/Env"
import { Const } from "../common/TutanotaConstants"
import type { BrowserData } from "../../misc/ClientConstants"
import type { CalendarFacade } from "./facades/lazy/CalendarFacade.js"
import type { ShareFacade } from "./facades/lazy/ShareFacade.js"
import { RestClient } from "./rest/RestClient"
import { SuspensionHandler } from "./SuspensionHandler"
import { EntityClient } from "../common/EntityClient"
import type { GiftCardFacade } from "./facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "./facades/lazy/ConfigurationDatabase.js"
import { DeviceEncryptionFacade } from "./facades/DeviceEncryptionFacade"
import type { NativeInterface } from "../../native/common/NativeInterface"
import { NativeFileApp } from "../../native/common/FileApp"
import { AesApp } from "../../native/worker/AesApp"
import type { RsaImplementation } from "./crypto/RsaImplementation"
import { createRsaImplementation } from "./crypto/RsaImplementation"
import { CryptoFacade } from "./crypto/CryptoFacade"
import { InstanceMapper } from "./crypto/InstanceMapper"
import { AdminClientDummyEntityRestCache } from "./rest/AdminClientDummyEntityRestCache.js"
import { SleepDetector } from "./utils/SleepDetector.js"
import { SchedulerImpl } from "../common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../common/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "./rest/CacheStorageProxy"
import { IServiceExecutor } from "../common/ServiceRequest"
import { ServiceExecutor } from "./rest/ServiceExecutor"
import type { BookingFacade } from "./facades/lazy/BookingFacade.js"
import type { BlobFacade } from "./facades/lazy/BlobFacade.js"
import { UserFacade } from "./facades/UserFacade"
import { OfflineStorage, OfflineStorageCleaner } from "./offline/OfflineStorage.js"
import { OFFLINE_STORAGE_MIGRATIONS, OfflineStorageMigrator } from "./offline/OfflineStorageMigrator.js"
import { modelInfos } from "../common/EntityFunctions.js"
import { FileFacadeSendDispatcher } from "../../native/common/generatedipc/FileFacadeSendDispatcher.js"
import { NativePushFacadeSendDispatcher } from "../../native/common/generatedipc/NativePushFacadeSendDispatcher.js"
import { NativeCryptoFacadeSendDispatcher } from "../../native/common/generatedipc/NativeCryptoFacadeSendDispatcher"
import { random } from "@tutao/tutanota-crypto"
import { ExportFacadeSendDispatcher } from "../../native/common/generatedipc/ExportFacadeSendDispatcher.js"
import { assertNotNull, delay, lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacadeSendDispatcher } from "../../native/common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { EntropyFacade } from "./facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "./facades/BlobAccessTokenFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "./crypto/OwnerEncSessionKeysUpdateQueue.js"
import { EventBusEventCoordinator } from "./EventBusEventCoordinator.js"
import { WorkerFacade } from "./facades/WorkerFacade.js"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import type { SearchFacade } from "./search/SearchFacade.js"
import { Challenge } from "../entities/sys/TypeRefs.js"
import { LoginFailReason } from "../main/PageContextLoginListener.js"
import { ConnectionError, ServiceUnavailableError } from "../common/error/RestError.js"
import { SessionType } from "../common/SessionType.js"
import { Argon2idFacade, NativeArgon2idFacade, WASMArgon2idFacade } from "./facades/Argon2idFacade.js"
import { DomainConfigProvider } from "../common/DomainConfigProvider.js"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "./facades/KyberFacade.js"
import { PQFacade } from "./facades/PQFacade.js"
import { PdfWriter } from "./pdf/PdfWriter.js"
import { ContactFacade } from "./facades/lazy/ContactFacade.js"
import { KeyLoaderFacade } from "./facades/KeyLoaderFacade.js"
import { KeyRotationFacade } from "./facades/KeyRotationFacade.js"
import { KeyCache } from "./facades/KeyCache.js"
import { cryptoWrapper } from "./crypto/CryptoWrapper.js"
import { RecoverCodeFacade } from "./facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "./facades/lazy/CacheManagementFacade.js"
import type { Credentials } from "../../misc/credentials/Credentials.js"

assertWorkerOrNode()

export type WorkerLocatorType = {
	// network & encryption
	restClient: RestClient
	serviceExecutor: IServiceExecutor
	crypto: CryptoFacade
	instanceMapper: InstanceMapper
	cacheStorage: CacheStorage
	cache: EntityRestInterface
	cachingEntityClient: EntityClient
	eventBusClient: EventBusClient
	rsa: RsaImplementation
	kyberFacade: KyberFacade
	pqFacade: PQFacade
	entropyFacade: EntropyFacade
	blobAccessToken: BlobAccessTokenFacade
	keyCache: KeyCache
	keyLoader: KeyLoaderFacade
	keyRotation: KeyRotationFacade

	// login
	user: UserFacade
	login: LoginFacade

	// domains
	blob: lazyAsync<BlobFacade>
	mail: lazyAsync<MailFacade>
	calendar: lazyAsync<CalendarFacade>
	counters: lazyAsync<CounterFacade>
	Const: Record<string, any>

	// search & indexing
	indexer: lazyAsync<Indexer>
	search: lazyAsync<SearchFacade>

	// management facades
	groupManagement: lazyAsync<GroupManagementFacade>
	userManagement: lazyAsync<UserManagementFacade>
	recoverCode: lazyAsync<RecoverCodeFacade>
	customer: lazyAsync<CustomerFacade>
	giftCards: lazyAsync<GiftCardFacade>
	mailAddress: lazyAsync<MailAddressFacade>
	booking: lazyAsync<BookingFacade>
	share: lazyAsync<ShareFacade>
	cacheManagement: lazyAsync<CacheManagementFacade>

	// misc & native
	configFacade: lazyAsync<ConfigurationDatabase>
	deviceEncryptionFacade: DeviceEncryptionFacade
	native: NativeInterface
	workerFacade: WorkerFacade
	sqlCipherFacade: SqlCipherFacade
	pdfWriter: lazyAsync<PdfWriter>

	// used to cache between resets
	_browserData: BrowserData
	_offlineStorageCleaner: OfflineStorageCleaner

	//contact
	contactFacade: lazyAsync<ContactFacade>
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData, offlineStorageCleaner: OfflineStorageCleaner) {
	locator.keyCache = new KeyCache()
	locator.user = new UserFacade(locator.keyCache)
	locator.workerFacade = new WorkerFacade()
	const dateProvider = new NoZoneDateProvider()

	const mainInterface = worker.getMainInterface()

	const suspensionHandler = new SuspensionHandler(mainInterface.infoMessageHandler, self)
	locator.instanceMapper = new InstanceMapper()
	locator.rsa = await createRsaImplementation(worker)

	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()

	locator.restClient = new RestClient(suspensionHandler, domainConfig)
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instanceMapper, () => locator.crypto)
	locator.entropyFacade = new EntropyFacade(locator.user, locator.serviceExecutor, random, () => locator.keyLoader)
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, dateProvider, locator.user)
	const entityRestClient = new EntityRestClient(locator.user, locator.restClient, () => locator.crypto, locator.instanceMapper, locator.blobAccessToken)
	locator._browserData = browserData
	locator._offlineStorageCleaner = offlineStorageCleaner

	locator.native = worker
	locator.booking = lazyMemoized(async () => {
		const { BookingFacade } = await import("./facades/lazy/BookingFacade.js")
		return new BookingFacade(locator.serviceExecutor)
	})

	let offlineStorageProvider
	if (isOfflineStorageAvailable() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos),
				offlineStorageCleaner,
			)
		}
	} else {
		offlineStorageProvider = async () => null
	}
	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("./pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(worker, offlineStorageProvider)

	locator.cacheStorage = maybeUninitializedStorage

	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(worker), new ExportFacadeSendDispatcher(worker))

	// We don't want to cache within the admin client
	let cache: DefaultEntityRestCache | null = null
	if (!isAdminClient()) {
		cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage)
	}

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache)
	const nonCachingEntityClient = new EntityClient(entityRestClient)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("./facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, assertNotNull(cache))
	})

	locator.indexer = lazyMemoized(async () => {
		const { Indexer } = await import("./search/Indexer.js")
		return new Indexer(entityRestClient, mainInterface.infoMessageHandler, browserData, locator.cache as DefaultEntityRestCache, await locator.mail())
	})

	if (isIOSApp() || isAndroidApp()) {
		locator.kyberFacade = new NativeKyberFacade(new NativeCryptoFacadeSendDispatcher(worker))
	} else {
		locator.kyberFacade = new WASMKyberFacade()
	}

	locator.pqFacade = new PQFacade(locator.kyberFacade)

	locator.keyLoader = new KeyLoaderFacade(locator.keyCache, locator.user, locator.cachingEntityClient, locator.cacheManagement)

	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.rsa,
		locator.serviceExecutor,
		locator.instanceMapper,
		new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor),
		locator.pqFacade,
		cache,
		locator.keyLoader,
	)

	locator.recoverCode = lazyMemoized(async () => {
		const { RecoverCodeFacade } = await import("./facades/lazy/RecoverCodeFacade.js")
		return new RecoverCodeFacade(locator.user, locator.cachingEntityClient, locator.login, locator.keyLoader)
	})
	locator.share = lazyMemoized(async () => {
		const { ShareFacade } = await import("./facades/lazy/ShareFacade.js")
		return new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient, locator.keyLoader)
	})
	locator.counters = lazyMemoized(async () => {
		const { CounterFacade } = await import("./facades/lazy/CounterFacade.js")
		return new CounterFacade(locator.serviceExecutor)
	})
	locator.groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("./facades/lazy/GroupManagementFacade.js")
		return new GroupManagementFacade(
			locator.user,
			await locator.counters(),
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.pqFacade,
			locator.keyLoader,
			await locator.cacheManagement(),
		)
	})
	locator.keyRotation = new KeyRotationFacade(
		locator.cachingEntityClient,
		locator.keyLoader,
		locator.pqFacade,
		locator.serviceExecutor,
		cryptoWrapper,
		locator.recoverCode,
		locator.user,
		locator.crypto,
		locator.share,
		locator.groupManagement,
	)

	const loginListener: LoginListener = {
		onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				// index new items in background
				console.log("initIndexer after log in")

				initIndexer(worker, cacheInfo, locator.keyLoader)
			}

			return mainInterface.loginListener.onFullLoginSuccess(sessionType, cacheInfo, credentials)
		},

		onLoginFailure(reason: LoginFailReason): Promise<void> {
			return mainInterface.loginListener.onLoginFailure(reason)
		},

		onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
			return mainInterface.loginListener.onSecondFactorChallenge(sessionId, challenges, mailAddress)
		},
	}

	let argon2idFacade: Argon2idFacade
	if (!isBrowser()) {
		argon2idFacade = new NativeArgon2idFacade(new NativeCryptoFacadeSendDispatcher(worker))
	} else {
		argon2idFacade = new WASMArgon2idFacade()
	}

	locator.deviceEncryptionFacade = new DeviceEncryptionFacade()
	const { DatabaseKeyFactory } = await import("../../misc/credentials/DatabaseKeyFactory.js")

	locator.login = new LoginFacade(
		worker,
		locator.restClient,
		/**
		 * we don't want to try to use the cache in the login facade, because it may not be available (when no user is logged in)
		 */
		new EntityClient(locator.cache),
		loginListener,
		locator.instanceMapper,
		locator.crypto,
		locator.keyRotation,
		maybeUninitializedStorage,
		locator.serviceExecutor,
		locator.user,
		locator.blobAccessToken,
		locator.entropyFacade,
		new DatabaseKeyFactory(locator.deviceEncryptionFacade),
		argon2idFacade,
		nonCachingEntityClient,
	)

	locator.search = lazyMemoized(async () => {
		const { SearchFacade } = await import("./search/SearchFacade.js")
		const indexer = await locator.indexer()
		const suggestionFacades = [indexer._contact.suggestionFacade]
		return new SearchFacade(locator.user, indexer.db, indexer._mail, suggestionFacades, browserData, locator.cachingEntityClient)
	})
	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("./facades/lazy/UserManagementFacade.js")
		return new UserManagementFacade(
			locator.user,
			await locator.groupManagement(),
			await locator.counters(),
			locator.cachingEntityClient,
			locator.serviceExecutor,
			mainInterface.operationProgressTracker,
			locator.login,
			locator.pqFacade,
			locator.keyLoader,
			await locator.recoverCode(),
		)
	})
	locator.customer = lazyMemoized(async () => {
		const { CustomerFacade } = await import("./facades/lazy/CustomerFacade.js")
		return new CustomerFacade(
			locator.user,
			await locator.groupManagement(),
			await locator.userManagement(),
			await locator.counters(),
			locator.rsa,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			await locator.booking(),
			locator.crypto,
			mainInterface.operationProgressTracker,
			locator.pdfWriter,
			locator.pqFacade,
			locator.keyLoader,
			await locator.recoverCode(),
		)
	})
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("./facades/lazy/BlobFacade.js")
		return new BlobFacade(
			locator.user,
			locator.serviceExecutor,
			locator.restClient,
			suspensionHandler,
			fileApp,
			aesApp,
			locator.instanceMapper,
			locator.crypto,
			locator.blobAccessToken,
			cache,
		)
	})
	locator.mail = lazyMemoized(async () => {
		const { MailFacade } = await import("./facades/lazy/MailFacade.js")
		return new MailFacade(
			locator.user,
			locator.cachingEntityClient,
			locator.crypto,
			locator.serviceExecutor,
			await locator.blob(),
			fileApp,
			locator.login,
			locator.keyLoader,
		)
	})
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("./facades/lazy/CalendarFacade.js")
		return new CalendarFacade(
			locator.user,
			await locator.groupManagement(),
			assertNotNull(cache),
			nonCachingEntityClient, // without cache
			nativePushFacade,
			mainInterface.operationProgressTracker,
			locator.instanceMapper,
			locator.serviceExecutor,
			locator.crypto,
			mainInterface.infoMessageHandler,
		)
	})

	locator.mailAddress = lazyMemoized(async () => {
		const { MailAddressFacade } = await import("./facades/lazy/MailAddressFacade.js")
		return new MailAddressFacade(
			locator.user,
			await locator.groupManagement(),
			locator.serviceExecutor,
			nonCachingEntityClient, // without cache
		)
	})
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("./facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.keyLoader, locator.user)
	})

	const eventBusCoordinator = new EventBusEventCoordinator(
		worker,
		mainInterface.wsConnectivityListener,
		locator.mail,
		locator.indexer,
		locator.user,
		locator.cachingEntityClient,
		mainInterface.eventController,
		locator.configFacade,
		locator.keyRotation,
		locator.cacheManagement,
	)

	locator.eventBusClient = new EventBusClient(
		eventBusCoordinator,
		cache ?? new AdminClientDummyEntityRestCache(),
		locator.user,
		locator.cachingEntityClient,
		locator.instanceMapper,
		(path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path),
		new SleepDetector(scheduler, dateProvider),
		mainInterface.progressTracker,
	)
	locator.login.init(locator.eventBusClient)
	locator.Const = Const
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("./facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader)
	})
	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("./facades/lazy/ContactFacade.js")
		return new ContactFacade(new EntityClient(locator.cache))
	})
}

const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000

async function initIndexer(worker: WorkerImpl, cacheInfo: CacheInfo, keyLoaderFacade: KeyLoaderFacade): Promise<void> {
	const indexer = await locator.indexer()
	try {
		await indexer.init({
			user: assertNotNull(locator.user.getUser()),
			cacheInfo,
			keyLoaderFacade,
		})
	} catch (e) {
		if (e instanceof ServiceUnavailableError) {
			console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ServiceUnavailableError")
			return initIndexer(worker, cacheInfo, keyLoaderFacade)
		} else if (e instanceof ConnectionError) {
			console.log("Retry init indexer in 30 seconds after ConnectionError")
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ConnectionError")
			return initIndexer(worker, cacheInfo, keyLoaderFacade)
		} else {
			// not awaiting
			worker.sendError(e)
			return
		}
	}
	if (cacheInfo.isPersistent && cacheInfo.isNewOfflineDb) {
		// not awaiting
		indexer.enableMailIndexing()
	}
}

export async function resetLocator(): Promise<void> {
	await locator.login.resetSession()
	await initLocator(locator.login.worker, locator._browserData, locator._offlineStorageCleaner)
}

if (typeof self !== "undefined") {
	;(self as unknown as WorkerGlobalScope).locator = locator // export in worker scope
}

/*
 * @returns true if webassembly is supported
 */
export function isWebAssemblySupported() {
	return typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function"
}
