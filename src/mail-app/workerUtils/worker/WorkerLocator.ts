import { CacheInfo, LoginFacade, LoginListener } from "../../../common/api/worker/facades/LoginFacade.js"
import type { WorkerImpl } from "./WorkerImpl.js"
import type { EntityRestInterface } from "../../../common/api/worker/rest/EntityRestClient.js"
import { EntityRestClient } from "../../../common/api/worker/rest/EntityRestClient.js"
import type { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade.js"
import { CacheStorage, DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import type { GroupManagementFacade } from "../../../common/api/worker/facades/lazy/GroupManagementFacade.js"
import type { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import type { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade.js"
import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import type { CounterFacade } from "../../../common/api/worker/facades/lazy/CounterFacade.js"
import { EventBusClient } from "../../../common/api/worker/EventBusClient.js"
import {
	assertWorkerOrNode,
	getWebsocketBaseUrl,
	isAdminClient,
	isAndroidApp,
	isBrowser,
	isIOSApp,
	isOfflineStorageAvailable,
	isTest,
} from "../../../common/api/common/Env.js"
import { Const } from "../../../common/api/common/TutanotaConstants.js"
import type { BrowserData } from "../../../common/misc/ClientConstants.js"
import type { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import type { ShareFacade } from "../../../common/api/worker/facades/lazy/ShareFacade.js"
import { RestClient } from "../../../common/api/worker/rest/RestClient.js"
import { SuspensionHandler } from "../../../common/api/worker/SuspensionHandler.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { DeviceEncryptionFacade } from "../../../common/api/worker/facades/DeviceEncryptionFacade.js"
import type { NativeInterface } from "../../../common/native/common/NativeInterface.js"
import { NativeFileApp } from "../../../common/native/common/FileApp.js"
import { AesApp } from "../../../common/native/worker/AesApp.js"
import type { RsaImplementation } from "../../../common/api/worker/crypto/RsaImplementation.js"
import { createRsaImplementation } from "../../../common/api/worker/crypto/RsaImplementation.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import { InstanceMapper } from "../../../common/api/worker/crypto/InstanceMapper.js"
import { AdminClientDummyEntityRestCache } from "../../../common/api/worker/rest/AdminClientDummyEntityRestCache.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../common/api/common/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "../../../common/api/worker/rest/CacheStorageProxy.js"
import { IServiceExecutor } from "../../../common/api/common/ServiceRequest.js"
import { ServiceExecutor } from "../../../common/api/worker/rest/ServiceExecutor.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { UserFacade } from "../../../common/api/worker/facades/UserFacade.js"
import { OfflineStorage } from "../../../common/api/worker/offline/OfflineStorage.js"
import { OFFLINE_STORAGE_MIGRATIONS, OfflineStorageMigrator } from "../../../common/api/worker/offline/OfflineStorageMigrator.js"
import { modelInfos } from "../../../common/api/common/EntityFunctions.js"
import { FileFacadeSendDispatcher } from "../../../common/native/common/generatedipc/FileFacadeSendDispatcher.js"
import { NativePushFacadeSendDispatcher } from "../../../common/native/common/generatedipc/NativePushFacadeSendDispatcher.js"
import { NativeCryptoFacadeSendDispatcher } from "../../../common/native/common/generatedipc/NativeCryptoFacadeSendDispatcher.js"
import { random } from "@tutao/tutanota-crypto"
import { ExportFacadeSendDispatcher } from "../../../common/native/common/generatedipc/ExportFacadeSendDispatcher.js"
import { assertNotNull, delay, lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../../common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacadeSendDispatcher } from "../../../common/native/common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { EntropyFacade } from "../../../common/api/worker/facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../../../common/api/worker/facades/BlobAccessTokenFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade.js"
import { Challenge, UserTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { LoginFailReason } from "../../../common/api/main/PageContextLoginListener.js"
import { ConnectionError, ServiceUnavailableError } from "../../../common/api/common/error/RestError.js"
import { SessionType } from "../../../common/api/common/SessionType.js"
import { Argon2idFacade, NativeArgon2idFacade, WASMArgon2idFacade } from "../../../common/api/worker/facades/Argon2idFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "../../../common/api/worker/facades/KyberFacade.js"
import { PQFacade } from "../../../common/api/worker/facades/PQFacade.js"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { KeyLoaderFacade } from "../../../common/api/worker/facades/KeyLoaderFacade.js"
import { KeyRotationFacade } from "../../../common/api/worker/facades/KeyRotationFacade.js"
import { KeyCache } from "../../../common/api/worker/facades/KeyCache.js"
import { CryptoWrapper } from "../../../common/api/worker/crypto/CryptoWrapper.js"
import { RecoverCodeFacade } from "../../../common/api/worker/facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { MailOfflineCleaner } from "../offline/MailOfflineCleaner.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { Credentials } from "../../../common/misc/credentials/Credentials.js"
import { AsymmetricCryptoFacade } from "../../../common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { KeyVerificationFacade } from "../../../common/api/worker/facades/lazy/KeyVerificationFacade"
import { KeyAuthenticationFacade } from "../../../common/api/worker/facades/KeyAuthenticationFacade.js"
import { PublicKeyProvider } from "../../../common/api/worker/facades/PublicKeyProvider.js"
import { EphemeralCacheStorage } from "../../../common/api/worker/rest/EphemeralCacheStorage.js"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider.js"
import type { BulkMailLoader } from "../index/BulkMailLoader.js"
import type { MailExportFacade } from "../../../common/api/worker/facades/lazy/MailExportFacade"
import type { Indexer } from "../index/Indexer"
import type { SearchFacade } from "../index/SearchFacade"
import type { ContactIndexer } from "../index/ContactIndexer"
import { CustomCacheHandlerMap } from "../../../common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/cacheHandler/CustomUserCacheHandler"
import { CustomCalendarEventCacheHandler } from "../../../common/api/worker/rest/cacheHandler/CustomCalendarEventCacheHandler"
import { CustomMailEventCacheHandler } from "../../../common/api/worker/rest/cacheHandler/CustomMailEventCacheHandler"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { DateProvider } from "../../../common/api/common/DateProvider"

assertWorkerOrNode()

export type WorkerLocatorType = {
	// network & encryption
	restClient: RestClient
	serviceExecutor: IServiceExecutor
	cryptoWrapper: CryptoWrapper
	asymmetricCrypto: AsymmetricCryptoFacade
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
	publicKeyProvider: PublicKeyProvider
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
	keyVerification: lazyAsync<KeyVerificationFacade>

	// misc & native
	configFacade: lazyAsync<ConfigurationDatabase>
	deviceEncryptionFacade: DeviceEncryptionFacade
	native: NativeInterface
	workerFacade: WorkerFacade
	sqlCipherFacade: SqlCipherFacade
	pdfWriter: lazyAsync<PdfWriter>
	bulkMailLoader: lazyAsync<BulkMailLoader>
	mailExportFacade: lazyAsync<MailExportFacade>

	// used to cache between resets
	_worker: WorkerImpl
	_browserData: BrowserData

	//contact
	contactFacade: lazyAsync<ContactFacade>
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	locator._worker = worker
	locator._browserData = browserData
	locator.keyCache = new KeyCache()
	locator.cryptoWrapper = new CryptoWrapper()
	locator.user = new UserFacade(locator.keyCache, locator.cryptoWrapper)
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
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, locator.user, dateProvider)
	const entityRestClient = new EntityRestClient(locator.user, locator.restClient, () => locator.crypto, locator.instanceMapper, locator.blobAccessToken)

	locator.native = worker
	locator.booking = lazyMemoized(async () => {
		const { BookingFacade } = await import("../../../common/api/worker/facades/lazy/BookingFacade.js")
		return new BookingFacade(locator.serviceExecutor)
	})

	const db = lazyMemoized(async () => {
		const { newSearchIndexDB } = await import("../index/IndexedDbIndexer.js")
		const { EncryptedDbWrapper } = await import("../../../common/api/worker/search/EncryptedDbWrapper")
		return new EncryptedDbWrapper(newSearchIndexDB())
	})

	const indexerCore = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			throw new ProgrammingError("getting indexerCore when we should be using SQLite (offline storage)")
		}
		const { IndexerCore } = await import("../index/IndexerCore.js")
		return new IndexerCore(await db(), browserData)
	})

	const mailIndexer = lazyMemoized(async () => {
		const { IndexedDbMailIndexerBackend } = await import("../index/IndexedDbMailIndexerBackend")
		const { SqliteMailIndexerBackend } = await import("../index/SqliteMailIndexerBackend")
		const { MailIndexer } = await import("../index/MailIndexer.js")
		const bulkLoaderFactory = await prepareBulkLoaderFactory()
		const dateProvider = new LocalTimeDateProvider()
		const mailFacade = await locator.mail()
		if (isOfflineStorageAvailable()) {
			const persistence = await offlineStorageIndexerPersistence()
			return new MailIndexer(
				mainInterface.infoMessageHandler,
				bulkLoaderFactory,
				locator.cachingEntityClient,
				dateProvider,
				mailFacade,
				() => new SqliteMailIndexerBackend(persistence),
			)
		} else {
			const core = await indexerCore()
			return new MailIndexer(
				mainInterface.infoMessageHandler,
				bulkLoaderFactory,
				locator.cachingEntityClient,
				dateProvider,
				mailFacade,
				(userId) => new IndexedDbMailIndexerBackend(core, userId),
			)
		}
	})

	const contactSuggestionFacade = lazyMemoized(async () => {
		const { SuggestionFacade } = await import("../index/SuggestionFacade")
		return new SuggestionFacade(ContactTypeRef, await db())
	})

	const contactIndexer = lazyMemoized(async (): Promise<ContactIndexer> => {
		const { OfflineStorageContactIndexerBackend } = await import("../index/OfflineStorageContactIndexerBackend")
		const { IndexedDbContactIndexerBackend } = await import("../index/IndexedDbContactIndexerBackend")
		const { ContactIndexer } = await import("../index/ContactIndexer.js")

		if (isOfflineStorageAvailable()) {
			const persistence = await offlineStorageIndexerPersistence()
			const backend = new OfflineStorageContactIndexerBackend(locator.cachingEntityClient, persistence)
			return new ContactIndexer(locator.cachingEntityClient, locator.user, backend)
		} else {
			const core = await indexerCore()
			const backend = new IndexedDbContactIndexerBackend(core, locator.cachingEntityClient, await contactSuggestionFacade())
			return new ContactIndexer(locator.cachingEntityClient, locator.user, backend)
		}
	})

	let offlineStorageProvider
	if (isOfflineStorageAvailable() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			const customCacheHandler = new CustomCacheHandlerMap(
				{
					ref: CalendarEventTypeRef,
					handler: new CustomCalendarEventCacheHandler(entityRestClient),
				},
				{ ref: MailTypeRef, handler: new CustomMailEventCacheHandler(mailIndexer) },
				{ ref: UserTypeRef, handler: new CustomUserCacheHandler(locator.cacheStorage) },
			)
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos),
				new MailOfflineCleaner(),
				customCacheHandler,
			)
		}
	} else {
		offlineStorageProvider = async () => null
	}
	const ephemeralStorageProvider = async () => {
		const customCacheHandler = new CustomCacheHandlerMap({
			ref: UserTypeRef,
			handler: new CustomUserCacheHandler(locator.cacheStorage),
		})
		return new EphemeralCacheStorage(customCacheHandler)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		(error: Error) => worker.sendError(error),
		offlineStorageProvider,
		ephemeralStorageProvider,
	)

	locator.cacheStorage = maybeUninitializedStorage

	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

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
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, assertNotNull(cache))
	})

	/** Slightly annoying two-stage init: first import bulk loader, then we can have a factory for it. */
	const prepareBulkLoaderFactory = async () => {
		const { BulkMailLoader } = await import("../index/BulkMailLoader.js")
		return () => {
			// On platforms with offline cache we just use cache as we are not bounded by memory.
			if (isOfflineStorageAvailable()) {
				return new BulkMailLoader(locator.cachingEntityClient, locator.cachingEntityClient)
			} else {
				// On platforms without offline cache we use new ephemeral cache storage for mails only and uncached storage for the rest
				// We create empty CustomCacheHandlerMap because this cache is separate anyway and user updates don't matter.
				const cacheStorage = new EphemeralCacheStorage(new CustomCacheHandlerMap())
				return new BulkMailLoader(new EntityClient(new DefaultEntityRestCache(entityRestClient, cacheStorage)), new EntityClient(entityRestClient))
			}
		}
	}
	locator.bulkMailLoader = async () => {
		const factory = await prepareBulkLoaderFactory()
		return factory()
	}

	const offlineStorageIndexerPersistence = lazyMemoized(async () => {
		const { OfflineStoragePersistence } = await import("../index/OfflineStoragePersistence.js")
		return new OfflineStoragePersistence(locator.sqlCipherFacade)
	})

	const serverDateProvider: DateProvider = {
		now(): number {
			return locator.restClient.getServerTimestampMs()
		},
		timeZone(): string {
			throw new ProgrammingError("Not supported")
		},
	}

	locator.indexer = lazyMemoized(async () => {
		const contact = await contactIndexer()
		const mail = await mailIndexer()

		if (isOfflineStorageAvailable()) {
			const { OfflineStorageIndexer } = await import("../index/OfflineStorageIndexer.js")
			const persistence = await offlineStorageIndexerPersistence()
			return new OfflineStorageIndexer(locator.user, persistence, mail, mainInterface.infoMessageHandler, contact)
		} else {
			const { IndexedDbIndexer } = await import("../index/IndexedDbIndexer.js")
			const core = await indexerCore()
			return new IndexedDbIndexer(serverDateProvider, await db(), core, mainInterface.infoMessageHandler, locator.cachingEntityClient, mail, contact)
		}
	})

	if (isIOSApp() || isAndroidApp()) {
		locator.kyberFacade = new NativeKyberFacade(new NativeCryptoFacadeSendDispatcher(worker))
	} else {
		locator.kyberFacade = new WASMKyberFacade()
	}

	locator.pqFacade = new PQFacade(locator.kyberFacade)

	locator.keyLoader = new KeyLoaderFacade(locator.keyCache, locator.user, locator.cachingEntityClient, locator.cacheManagement)

	locator.publicKeyProvider = new PublicKeyProvider(locator.serviceExecutor)

	locator.keyVerification = lazyMemoized(async () => {
		const { KeyVerificationFacade } = await import("../../../common/api/worker/facades/lazy/KeyVerificationFacade.js")
		return new KeyVerificationFacade(locator.customer, locator.sqlCipherFacade, locator.publicKeyProvider)
	})

	locator.asymmetricCrypto = new AsymmetricCryptoFacade(
		locator.rsa,
		locator.pqFacade,
		locator.keyLoader,
		locator.cryptoWrapper,
		locator.serviceExecutor,
		locator.keyVerification,
		locator.publicKeyProvider,
	)

	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.serviceExecutor,
		locator.instanceMapper,
		new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor),
		cache,
		locator.keyLoader,
		locator.asymmetricCrypto,
		locator.keyVerification,
		locator.publicKeyProvider,
		lazyMemoized(() => locator.keyRotation),
	)

	locator.recoverCode = lazyMemoized(async () => {
		const { RecoverCodeFacade } = await import("../../../common/api/worker/facades/lazy/RecoverCodeFacade.js")
		return new RecoverCodeFacade(locator.user, locator.cachingEntityClient, locator.login, locator.keyLoader)
	})
	locator.share = lazyMemoized(async () => {
		const { ShareFacade } = await import("../../../common/api/worker/facades/lazy/ShareFacade.js")
		return new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient, locator.keyLoader)
	})
	locator.counters = lazyMemoized(async () => {
		const { CounterFacade } = await import("../../../common/api/worker/facades/lazy/CounterFacade.js")
		return new CounterFacade(locator.serviceExecutor)
	})
	const keyAuthenticationFacade = new KeyAuthenticationFacade(locator.cryptoWrapper)
	locator.groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("../../../common/api/worker/facades/lazy/GroupManagementFacade.js")
		return new GroupManagementFacade(
			locator.user,
			await locator.counters(),
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.pqFacade,
			locator.keyLoader,
			await locator.cacheManagement(),
			locator.asymmetricCrypto,
			locator.cryptoWrapper,
			keyAuthenticationFacade,
		)
	})
	locator.keyRotation = new KeyRotationFacade(
		locator.cachingEntityClient,
		locator.keyLoader,
		locator.pqFacade,
		locator.serviceExecutor,
		locator.cryptoWrapper,
		locator.recoverCode,
		locator.user,
		locator.crypto,
		locator.share,
		locator.groupManagement,
		locator.asymmetricCrypto,
		keyAuthenticationFacade,
		locator.publicKeyProvider,
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
	const { DatabaseKeyFactory } = await import("../../../common/misc/credentials/DatabaseKeyFactory.js")

	locator.login = new LoginFacade(
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
		async (error: Error) => {
			await worker.sendError(error)
		},
		locator.cacheManagement,
	)

	locator.search = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			const { OfflineStorageSearchFacade } = await import("../index/OfflineStorageSearchFacade.js")
			return new OfflineStorageSearchFacade(locator.sqlCipherFacade, await mailIndexer(), await contactIndexer())
		} else {
			const { IndexedDbSearchFacade } = await import("../index/IndexedDbSearchFacade.js")
			return new IndexedDbSearchFacade(
				locator.user,
				await db(),
				await mailIndexer(),
				await contactSuggestionFacade(),
				browserData,
				locator.cachingEntityClient,
			)
		}
	})
	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("../../../common/api/worker/facades/lazy/UserManagementFacade.js")
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
		const { CustomerFacade } = await import("../../../common/api/worker/facades/lazy/CustomerFacade.js")
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
			locator.asymmetricCrypto,
			locator.publicKeyProvider,
		)
	})
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("../../../common/api/worker/facades/lazy/BlobFacade.js")
		return new BlobFacade(locator.restClient, suspensionHandler, fileApp, aesApp, locator.instanceMapper, locator.crypto, locator.blobAccessToken)
	})
	locator.mail = lazyMemoized(async () => {
		const { MailFacade } = await import("../../../common/api/worker/facades/lazy/MailFacade.js")
		return new MailFacade(
			locator.user,
			locator.cachingEntityClient,
			locator.crypto,
			locator.serviceExecutor,
			await locator.blob(),
			fileApp,
			locator.login,
			locator.keyLoader,
			locator.publicKeyProvider,
		)
	})
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("../../../common/api/worker/facades/lazy/CalendarFacade.js")
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
		const { MailAddressFacade } = await import("../../../common/api/worker/facades/lazy/MailAddressFacade.js")
		return new MailAddressFacade(
			locator.user,
			await locator.groupManagement(),
			locator.serviceExecutor,
			nonCachingEntityClient, // without cache
		)
	})
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("../../../common/api/worker/facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.keyLoader, locator.user)
	})

	const eventBusCoordinator = new EventBusEventCoordinator(
		mainInterface.wsConnectivityListener,
		locator.mail,
		locator.user,
		locator.cachingEntityClient,
		mainInterface.eventController,
		locator.configFacade,
		locator.keyRotation,
		locator.cacheManagement,
		async (error: Error) => {
			await worker.sendError(error)
		},
		async (queuedBatch: QueuedBatch[]) => {
			const indexer = await locator.indexer()
			for (const batch of queuedBatch) {
				await indexer.processEntityEvents(batch.events, batch.batchId, batch.groupId)
			}
		},
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
		mainInterface.syncTracker,
	)
	locator.login.init(locator.eventBusClient)
	locator.Const = Const
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("../../../common/api/worker/facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader)
	})
	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("../../../common/api/worker/facades/lazy/ContactFacade.js")
		return new ContactFacade(new EntityClient(locator.cache))
	})
	locator.mailExportFacade = lazyMemoized(async () => {
		const { MailExportFacade } = await import("../../../common/api/worker/facades/lazy/MailExportFacade.js")
		const { MailExportTokenFacade } = await import("../../../common/api/worker/facades/lazy/MailExportTokenFacade.js")
		const mailExportTokenFacade = new MailExportTokenFacade(locator.serviceExecutor)
		return new MailExportFacade(mailExportTokenFacade, await locator.bulkMailLoader(), await locator.blob(), locator.crypto, locator.blobAccessToken)
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
			console.log("send indexer error to main thread", e)
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
	await initLocator(locator._worker, locator._browserData)
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
