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
import { Credentials } from "../../../common/misc/credentials/Credentials.js"
import { AsymmetricCryptoFacade } from "../../../common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { KeyVerificationFacade } from "../../../common/api/worker/facades/lazy/KeyVerificationFacade"
import { KeyAuthenticationFacade } from "../../../common/api/worker/facades/KeyAuthenticationFacade.js"
import { PublicEncryptionKeyProvider } from "../../../common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { EphemeralCacheStorage } from "../../../common/api/worker/rest/EphemeralCacheStorage.js"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider.js"
import type { BulkMailLoader } from "../index/BulkMailLoader.js"
import type { MailExportFacade } from "../../../common/api/worker/facades/lazy/MailExportFacade"
import { InstancePipeline } from "../../../common/api/worker/crypto/InstancePipeline"
import { ApplicationTypesFacade } from "../../../common/api/worker/facades/ApplicationTypesFacade"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "../../../common/api/worker/facades/Ed25519Facade"
import { ClientModelInfo, ServerModelInfo, TypeModelResolver } from "../../../common/api/common/EntityFunctions"
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
import type { ContactSearchFacade } from "../index/ContactSearchFacade"
import type { IndexedDbSearchFacade } from "../index/IndexedDbSearchFacade.js"
import type { OfflineStorageSearchFacade } from "../index/OfflineStorageSearchFacade.js"
import { PatchMerger } from "../../../common/api/worker/offline/PatchMerger"
import { EventInstancePrefetcher } from "../../../common/api/worker/EventInstancePrefetcher"
import { RolloutFacade } from "../../../common/api/worker/facades/RolloutFacade"
import { PublicKeySignatureFacade } from "../../../common/api/worker/facades/PublicKeySignatureFacade"
import { AdminKeyLoaderFacade } from "../../../common/api/worker/facades/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../common/api/worker/facades/lazy/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../common/api/worker/facades/PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase, KeyVerificationTableDefinitions } from "../../../common/api/worker/facades/IdentityKeyTrustDatabase"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"

assertWorkerOrNode()

export type WorkerLocatorType = {
	// network & encryption
	restClient: RestClient
	serviceExecutor: IServiceExecutor
	cryptoWrapper: CryptoWrapper
	keyAuthenticationFacade: KeyAuthenticationFacade
	asymmetricCrypto: AsymmetricCryptoFacade
	crypto: CryptoFacade
	instancePipeline: InstancePipeline
	patchMerger: PatchMerger
	applicationTypesFacade: ApplicationTypesFacade
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
	adminKeyLoader: AdminKeyLoaderFacade
	publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	publicIdentityKeyProvider: PublicIdentityKeyProvider
	identityKeyTrustDatabase: IdentityKeyTrustDatabase
	keyRotation: KeyRotationFacade
	ed25519Facade: Ed25519Facade
	publicKeySignatureFacade: PublicKeySignatureFacade
	rolloutFacade: RolloutFacade

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
	contactSearch: lazyAsync<ContactSearchFacade>

	// management facades
	groupManagement: lazyAsync<GroupManagementFacade>
	identityKeyCreator: lazyAsync<IdentityKeyCreator>
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

	// drive
	driveFacade: lazyAsync<DriveFacade>
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

	const suspensionHandler = new SuspensionHandler(self, () =>
		mainInterface.infoMessageHandler.onInfoMessage({
			translationKey: "clientSuspensionWait_label",
			args: {},
		}),
	)
	const fileFacadeSendDispatcher = new FileFacadeSendDispatcher(worker)
	const fileApp = new NativeFileApp(fileFacadeSendDispatcher, new ExportFacadeSendDispatcher(worker))

	locator.rsa = await createRsaImplementation(worker)
	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()

	const clientModelInfo = ClientModelInfo.getInstance()
	const serverModelInfo = ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, (expectedHash: string | null) =>
		locator.applicationTypesFacade.getServerApplicationTypesJson(expectedHash),
	)
	locator.restClient = new RestClient(suspensionHandler, domainConfig, serverModelInfo)
	const typeModelResolver = new TypeModelResolver(clientModelInfo, serverModelInfo)
	locator.instancePipeline = new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
	)
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instancePipeline, () => locator.crypto, typeModelResolver)
	locator.applicationTypesFacade = new ApplicationTypesFacade(locator.restClient, fileFacadeSendDispatcher, serverModelInfo)
	locator.entropyFacade = new EntropyFacade(locator.user, locator.serviceExecutor, random, () => locator.keyLoader)
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, locator.user, dateProvider, typeModelResolver)

	const entityRestClient = new EntityRestClient(
		locator.user,
		locator.restClient,
		() => locator.crypto,
		locator.instancePipeline,
		locator.blobAccessToken,
		typeModelResolver,
	)
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
		const { OfflineStorageMailIndexerBackend } = await import("../index/OfflineStorageMailIndexerBackend")
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
				() => new OfflineStorageMailIndexerBackend(persistence),
			)
		} else {
			const core = await indexerCore()
			return new MailIndexer(
				mainInterface.infoMessageHandler,
				bulkLoaderFactory,
				locator.cachingEntityClient,
				dateProvider,
				mailFacade,
				(userId) => new IndexedDbMailIndexerBackend(core, userId, typeModelResolver),
			)
		}
	})

	const contactSuggestionFacade = lazyMemoized(async () => {
		const { SuggestionFacade } = await import("../index/SuggestionFacade")
		return new SuggestionFacade(ContactTypeRef, await db(), typeModelResolver)
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
			const backend = new IndexedDbContactIndexerBackend(core, locator.cachingEntityClient, await contactSuggestionFacade(), typeModelResolver)
			return new ContactIndexer(locator.cachingEntityClient, locator.user, backend)
		}
	})

	let offlineStorageProvider
	if (isOfflineStorageAvailable() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			const { KeyVerificationTableDefinitions } = await import("../../../common/api/worker/facades/IdentityKeyTrustDatabase.js")
			const { SearchTableDefinitions } = await import("../index/OfflineStoragePersistence.js")

			const customCacheHandler = new CustomCacheHandlerMap(
				{
					ref: CalendarEventTypeRef,
					handler: new CustomCalendarEventCacheHandler(entityRestClient, typeModelResolver),
				},
				{ ref: MailTypeRef, handler: new CustomMailEventCacheHandler(mailIndexer) },
				{ ref: UserTypeRef, handler: new CustomUserCacheHandler(locator.cacheStorage) },
			)
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS),
				new MailOfflineCleaner(),
				locator.instancePipeline.modelMapper,
				typeModelResolver,
				customCacheHandler,
				Object.assign({}, KeyVerificationTableDefinitions, SearchTableDefinitions),
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
		return new EphemeralCacheStorage(locator.instancePipeline.modelMapper, typeModelResolver, customCacheHandler)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		(error: Error) => worker.sendError(error),
		ephemeralStorageProvider,
		offlineStorageProvider,
	)

	locator.cacheStorage = maybeUninitializedStorage

	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	locator.patchMerger = new PatchMerger(locator.cacheStorage, locator.instancePipeline, typeModelResolver, () => locator.crypto)

	// We don't want to cache within the admin client
	let cache: DefaultEntityRestCache | null = null
	if (!isAdminClient()) {
		cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage, typeModelResolver, locator.patchMerger)
	}

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache, typeModelResolver)
	const nonCachingEntityClient = new EntityClient(entityRestClient, typeModelResolver)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, assertNotNull(cache))
	})

	/** Slightly annoying two-stage init: first import bulk loader, then we can have a factory for it. */
	const prepareBulkLoaderFactory = async () => {
		const { BulkMailLoader } = await import("../index/BulkMailLoader.js")
		const mailFacade = await locator.mail()
		return () => {
			// On platforms with offline cache we just use cache as we are not bounded by memory.
			if (isOfflineStorageAvailable()) {
				return new BulkMailLoader(locator.cachingEntityClient, locator.cachingEntityClient, mailFacade)
			} else {
				// On platforms without offline cache we use new ephemeral cache storage for mails only and uncached storage for the rest
				// We create empty CustomCacheHandlerMap because this cache is separate anyway and user updates don't matter.
				const cacheStorage = new EphemeralCacheStorage(locator.instancePipeline.modelMapper, typeModelResolver, new CustomCacheHandlerMap())
				return new BulkMailLoader(
					new EntityClient(new DefaultEntityRestCache(entityRestClient, cacheStorage, typeModelResolver, locator.patchMerger), typeModelResolver),
					new EntityClient(entityRestClient, typeModelResolver),
					mailFacade,
				)
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
			return new IndexedDbIndexer(
				serverDateProvider,
				await db(),
				core,
				mainInterface.infoMessageHandler,
				locator.cachingEntityClient,
				mail,
				contact,
				typeModelResolver,
				locator.keyLoader,
			)
		}
	})

	if (isIOSApp() || isAndroidApp()) {
		locator.kyberFacade = new NativeKyberFacade(new NativeCryptoFacadeSendDispatcher(worker))
		locator.ed25519Facade = new NativeEd25519Facade(new NativeCryptoFacadeSendDispatcher(worker))
	} else {
		locator.kyberFacade = new WASMKyberFacade()
		locator.ed25519Facade = new WASMEd25519Facade()
	}

	locator.pqFacade = new PQFacade(locator.kyberFacade)

	locator.publicKeySignatureFacade = new PublicKeySignatureFacade(locator.ed25519Facade, locator.cryptoWrapper)

	locator.keyAuthenticationFacade = new KeyAuthenticationFacade(locator.cryptoWrapper)
	locator.keyLoader = new KeyLoaderFacade(locator.keyCache, locator.user, locator.cachingEntityClient, locator.cacheManagement, locator.cryptoWrapper)
	locator.adminKeyLoader = new AdminKeyLoaderFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.keyLoader,
		locator.cacheManagement,
		locator.asymmetricCrypto,
		locator.cryptoWrapper,
		locator.keyAuthenticationFacade,
	)

	locator.identityKeyTrustDatabase = new IdentityKeyTrustDatabase(locator.sqlCipherFacade, () => locator.login)
	locator.publicIdentityKeyProvider = new PublicIdentityKeyProvider(
		locator.serviceExecutor,
		locator.cachingEntityClient,
		locator.keyAuthenticationFacade,
		locator.keyLoader,
		locator.identityKeyTrustDatabase,
	)
	locator.keyVerification = lazyMemoized(async () => {
		const { KeyVerificationFacade } = await import("../../../common/api/worker/facades/lazy/KeyVerificationFacade.js")
		return new KeyVerificationFacade(locator.publicKeySignatureFacade, locator.publicIdentityKeyProvider, locator.identityKeyTrustDatabase)
	})

	locator.publicEncryptionKeyProvider = new PublicEncryptionKeyProvider(locator.serviceExecutor, locator.keyVerification)
	const adminKeyLoaderProvider = () => locator.adminKeyLoader

	locator.asymmetricCrypto = new AsymmetricCryptoFacade(
		locator.rsa,
		locator.pqFacade,
		locator.keyLoader,
		locator.cryptoWrapper,
		locator.serviceExecutor,
		locator.keyVerification,
		locator.publicEncryptionKeyProvider,
		adminKeyLoaderProvider,
	)

	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.serviceExecutor,
		locator.instancePipeline,
		new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor, typeModelResolver),
		cache,
		locator.keyLoader,
		locator.asymmetricCrypto,
		locator.publicEncryptionKeyProvider,
		lazyMemoized(() => locator.keyRotation),
		typeModelResolver,
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

	locator.identityKeyCreator = lazyMemoized(async () => {
		const { IdentityKeyCreator } = await import("../../../common/api/worker/facades/lazy/IdentityKeyCreator.js")
		return new IdentityKeyCreator(
			locator.user,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.keyLoader,
			locator.adminKeyLoader,
			await locator.cacheManagement(),
			locator.asymmetricCrypto,
			locator.cryptoWrapper,
			locator.keyAuthenticationFacade,
			locator.ed25519Facade,
			locator.publicKeySignatureFacade,
		)
	})

	locator.groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("../../../common/api/worker/facades/lazy/GroupManagementFacade.js")
		return new GroupManagementFacade(
			locator.user,
			await locator.counters(),
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.pqFacade,
			locator.keyLoader,
			locator.adminKeyLoader,
			await locator.cacheManagement(),
			locator.cryptoWrapper,
			await locator.identityKeyCreator(),
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
		locator.keyAuthenticationFacade,
		locator.publicEncryptionKeyProvider,
		locator.publicKeySignatureFacade,
		locator.adminKeyLoader,
	)
	locator.rolloutFacade = new RolloutFacade(locator.serviceExecutor, async (error: Error) => {
		await worker.sendError(error)
	})

	const loginListener: LoginListener = {
		async onPartialLoginSuccess(sessionType: SessionType, _cacheInfo: CacheInfo, _credentials: Credentials): Promise<void> {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				const indexer = await locator.indexer()
				await indexer.partialLoginInit()
			}
		},
		onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				// index new items in background
				console.log("initIndexer after log in")
				fullLoginIndexerInit(worker)
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
		new EntityClient(locator.cache, typeModelResolver),
		loginListener,
		locator.instancePipeline,
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
		typeModelResolver,
		locator.rolloutFacade,
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
				typeModelResolver,
			)
		}
	})

	locator.contactSearch = lazyMemoized(async () => {
		const search = await locator.search()
		if (isOfflineStorageAvailable()) {
			const { OfflineStorageContactSearchFacade } = await import("../index/OfflineStorageContactSearchFacade")
			return new OfflineStorageContactSearchFacade(search as OfflineStorageSearchFacade)
		} else {
			const { IndexedDbContactSearchFacade } = await import("../index/IndexedDbContactSearchFacade")
			return new IndexedDbContactSearchFacade(search as IndexedDbSearchFacade, typeModelResolver)
		}
	})

	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("../../../common/api/worker/facades/lazy/UserManagementFacade.js")
		return new UserManagementFacade(
			locator.user,
			await locator.groupManagement(),
			await locator.counters(),
			locator.serviceExecutor,
			mainInterface.operationProgressTracker,
			locator.login,
			locator.pqFacade,
			locator.keyLoader,
			await locator.recoverCode(),
			locator.adminKeyLoader,
			await locator.identityKeyCreator(),
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
			locator.publicEncryptionKeyProvider,
			locator.cryptoWrapper,
		)
	})
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("../../../common/api/worker/facades/lazy/BlobFacade.js")
		return new BlobFacade(locator.restClient, suspensionHandler, fileApp, aesApp, locator.instancePipeline, locator.crypto, locator.blobAccessToken)
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
			locator.publicEncryptionKeyProvider,
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
			locator.serviceExecutor,
			locator.crypto,
			mainInterface.infoMessageHandler,
			locator.instancePipeline,
			locator.cachingEntityClient,
		)
	})

	locator.mailAddress = lazyMemoized(async () => {
		const { MailAddressFacade } = await import("../../../common/api/worker/facades/lazy/MailAddressFacade.js")
		return new MailAddressFacade(
			locator.user,
			locator.adminKeyLoader,
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
		async (events, batchId, groupId) => {
			const indexer = await locator.indexer()
			await indexer.processEntityEvents(events, batchId, groupId)
		},
		locator.rolloutFacade,
		locator.groupManagement,
		locator.identityKeyCreator,
		mainInterface.syncTracker,
	)
	const prefetcher = new EventInstancePrefetcher(locator.cache)
	locator.eventBusClient = new EventBusClient(
		eventBusCoordinator,
		cache ?? new AdminClientDummyEntityRestCache(),
		locator.user,
		locator.cachingEntityClient,
		locator.instancePipeline,
		(path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path),
		new SleepDetector(scheduler, dateProvider),
		mainInterface.progressTracker,
		typeModelResolver,
		locator.crypto,
		prefetcher,
	)
	locator.login.init(locator.eventBusClient)
	locator.Const = Const
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("../../../common/api/worker/facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader)
	})
	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("../../../common/api/worker/facades/lazy/ContactFacade.js")
		return new ContactFacade(new EntityClient(locator.cache, typeModelResolver))
	})
	locator.mailExportFacade = lazyMemoized(async () => {
		const { MailExportFacade } = await import("../../../common/api/worker/facades/lazy/MailExportFacade.js")
		const { MailExportTokenFacade } = await import("../../../common/api/worker/facades/lazy/MailExportTokenFacade.js")
		const mailExportTokenFacade = new MailExportTokenFacade(locator.serviceExecutor)
		return new MailExportFacade(mailExportTokenFacade, await locator.bulkMailLoader(), await locator.blob(), locator.crypto, locator.blobAccessToken)
	})
	locator.driveFacade = lazyMemoized(async () => {
		return new DriveFacade(locator.keyLoader, await locator.blob(), locator.user, locator.cachingEntityClient, locator.serviceExecutor)
	})
}

const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000

async function fullLoginIndexerInit(worker: WorkerImpl): Promise<void> {
	const indexer = await locator.indexer()
	try {
		await indexer.fullLoginInit({
			user: assertNotNull(locator.user.getUser()),
		})
	} catch (e) {
		if (e instanceof ServiceUnavailableError) {
			console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ServiceUnavailableError")
			return fullLoginIndexerInit(worker)
		} else if (e instanceof ConnectionError) {
			console.log("Retry init indexer in 30 seconds after ConnectionError")
			await delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ConnectionError")
			return fullLoginIndexerInit(worker)
		} else {
			// not awaiting
			console.log("send indexer error to main thread", e)
			worker.sendError(e)
			return
		}
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
