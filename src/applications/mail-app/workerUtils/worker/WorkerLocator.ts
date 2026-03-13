import { CacheInfo, LoginFacade, LoginFailReason, LoginListener } from "../../../../platform-kit/base/facades/LoginFacade.js"
import type { WorkerImpl } from "./WorkerImpl.js"
import type { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade.js"
import { DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import type { GroupManagementFacade } from "../../../../platform-kit/base/facades/lazy/GroupManagementFacade.js"
import type { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import type { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade.js"
import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import type { CounterFacade } from "../../../../platform-kit/network/CounterFacade.js"
import { EventBusClient } from "../../../../platform-kit/network/EventBusClient.js"
import { ProgressMonitorDelegate } from "../../../common/api/worker/ProgressMonitorDelegate.js"
import {
	assertWorkerOrNode,
	Const,
	getWebsocketBaseUrl,
	isAdminClient,
	isAndroidApp,
	isBrowser,
	isIOSApp,
	isOfflineStorageAvailable,
	isTest,
	ProgrammingError,
	SessionType,
} from "../../../../platform-kit/app-env"
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { Challenge, UserTypeRef } from "@tutao/entities/sys"
import type { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import type { ShareFacade } from "../../../../platform-kit/base/facades/lazy/ShareFacade.js"
import { RestClient, restSuspension as susHandler } from "../../../../platform-kit/rest-client"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { DeviceEncryptionFacade } from "../../../../platform-kit/base/crypto/DeviceEncryptionFacade.js"
import type { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface.js"
import {
	ExportFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacadeSendDispatcher,
	NativeCryptoFacadeSendDispatcher,
	NativePushFacadeSendDispatcher,
	SqlCipherFacadeSendDispatcher,
} from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { CryptoFacade } from "../../../../platform-kit/base/crypto/CryptoFacade.js"
import { AdminClientDummyEntityRestCache } from "../../../common/api/worker/rest/AdminClientDummyEntityRestCache.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../common/api/common/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy.js"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade.js"
import { InstanceSessionKeysCache } from "../../../../app-kit/local-store/InstanceSessionKeysCache.js"
import { KeyCache } from "../../../../app-kit/local-store/KeyCache.js"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator.js"
import { CryptoWrapper, random, SYMMETRIC_CIPHER_FACADE } from "../../../../platform-kit/crypto"
import { assertNotNull, DateProvider, delay, lazy, lazyAsync, lazyMemoized } from "../../../../platform-kit/utils"
import { EntropyFacade } from "../../../../platform-kit/base/facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../../../../platform-kit/network/BlobAccessTokenFacade.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { NativeArgon2idFacade } from "../../../../platform-kit/base/crypto/NativeArgon2idFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "../../../../platform-kit/base/crypto/KyberFacade.js"
import { PQFacade } from "../../../../platform-kit/base/crypto/PQFacade.js"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { KeyLoaderFacade } from "../../../../platform-kit/base/crypto/KeyLoaderFacade.js"
import { KeyRotationFacade } from "../../../../platform-kit/base/crypto/KeyRotationFacade.js"
import {
	ApplicationTypesFacade,
	InstancePipeline,
	NamedClientModel,
	PatchMerger,
	ServerModelInfo,
	TypeModelResolver,
	UpdateAppTypesHashMiddleware,
} from "../../../../platform-kit/instance-pipeline"
import { RecoverCodeFacade } from "../../../../platform-kit/base/facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { MailOfflineCleaner } from "../offline/MailOfflineCleaner.js"
import { AsymmetricCryptoFacade } from "../../../../platform-kit/base/crypto/AsymmetricCryptoFacade.js"
import { KeyVerificationFacade } from "../../../../platform-kit/base/facades/lazy/KeyVerificationFacade"
import PublicEncryptionKeyProvider from "../../../../platform-kit/base/crypto/PublicEncryptionKeyProvider.js"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage.js"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider.js"
import type { BulkMailLoader } from "../index/BulkMailLoader.js"
import type { MailExportFacade } from "../../../common/api/worker/facades/lazy/MailExportFacade"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "../../../../platform-kit/base/crypto/Ed25519Facade"
import type { Indexer } from "../index/Indexer"
import type { SearchFacade } from "../index/SearchFacade"
import type { ContactIndexer } from "../index/ContactIndexer"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { CustomCalendarEventCacheHandler } from "../../../calendar-app/workerUtils/worker/CustomCalendarEventCacheHandler"
import { CustomMailEventCacheHandler } from "./CustomMailEventCacheHandler"
import type { ContactSearchFacade } from "../index/ContactSearchFacade"
import type { IndexedDbSearchFacade } from "../index/IndexedDbSearchFacade.js"
import type { OfflineStorageSearchFacade } from "../index/OfflineStorageSearchFacade.js"
import { RolloutFacade } from "../../../../platform-kit/base/facades/RolloutFacade"
import { PublicKeySignatureFacade } from "../../../../platform-kit/base/crypto/PublicKeySignatureFacade"
import { AdminKeyLoaderFacade } from "../../../../platform-kit/base/crypto/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../../platform-kit/base/crypto/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../../platform-kit/base/crypto/PublicIdentityKeyProvider"
import { type IdentityKeyTrustDatabase, KeyVerificationTableDefinitions } from "../../../../app-kit/local-store/IdentityKeyTrustDatabase"
import { AutosaveFacade } from "../../../common/api/worker/facades/lazy/AutosaveFacade"
import type { SpamClassifier } from "../spamClassification/SpamClassifier"
import { SpamClassifierStorageFacade } from "../../../common/api/worker/facades/lazy/SpamClassifierStorageFacade"
import { PublicEncryptionKeyCache } from "../../../../app-kit/local-store/PublicEncryptionKeyCache"
import type { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	IndexedDbLastProcessedEventBatchStorageFacade,
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage"
import { AlarmFacade } from "../../../common/api/worker/facades/lazy/AlarmFacade"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp.js"
import { createRsaImplementation, RsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { Argon2idFacade, WASMArgon2idFacade } from "../../../../platform-kit/base/crypto/WasmArgon2idFacade"
import { KeyAuthenticationFacade } from "../../../../platform-kit/network/KeyAuthenticationFacade"
import { EntityRestClient } from "../../../../platform-kit/network/EntityRestClient"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { ServiceExecutor } from "../../../../platform-kit/network/ServiceExecutor"
import { Credentials } from "../../../../platform-kit/network/types"
import { EntityRestInterface } from "../../../../platform-kit/network/EntityRestCacheInterface"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { ConnectionError, ServiceUnavailableError } from "@tutao/rest-client/error"

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
	alarmFacade: lazyAsync<AlarmFacade>

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
	autosaveFacade: lazyAsync<AutosaveFacade>

	// used to cache between resets
	_worker: WorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>

	//contact
	contactFacade: lazyAsync<ContactFacade>

	//spam classification
	spamClassifier: lazyAsync<SpamClassifier>
	spamClassifierStorageFacade: lazyAsync<SpamClassifierStorageFacade>

	// drive
	driveFacade: lazyAsync<DriveFacade>

	lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider>
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
	const { IdentityKeyTrustDatabase } = await import("../../../../app-kit/local-store/IdentityKeyTrustDatabase")

	locator._worker = worker
	locator._browserData = browserData
	locator._apps = apps
	locator.keyCache = new KeyCache()
	locator.cryptoWrapper = new CryptoWrapper()
	locator.user = new UserFacade(locator.keyCache, locator.cryptoWrapper)
	locator.workerFacade = new WorkerFacade()
	const dateProvider = new NoZoneDateProvider()

	const mainInterface = worker.getMainInterface()

	const suspensionHandler = new susHandler.SuspensionHandler(self, () =>
		mainInterface.infoMessageHandler.onInfoMessage({
			translationKey: "clientSuspensionWait_label",
			args: {},
		}),
	)
	const fileFacadeSendDispatcher = new FileFacadeSendDispatcher(worker)
	const fileApp = new NativeFileApp(fileFacadeSendDispatcher, new ExportFacadeSendDispatcher(worker))

	locator.rsa = await createRsaImplementation(worker)
	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()

	let applicationTypesFacade: lazy<ApplicationTypesFacade> = lazyMemoized(
		() => new ApplicationTypesFacade(locator.restClient, fileFacadeSendDispatcher, serverModelInfo),
	)

	const clientModelInfo = initClientModels(apps)
	const serverModelInfo = ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, (expectedHash: string | null) => {
		return applicationTypesFacade().getServerApplicationTypesJson(expectedHash)
	})

	locator.restClient = new RestClient(suspensionHandler, domainConfig, String(browserData.clientPlatform)).addMiddleware(
		new UpdateAppTypesHashMiddleware(serverModelInfo),
	)
	const typeModelResolver = new TypeModelResolver(clientModelInfo, serverModelInfo)
	locator.instancePipeline = new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
		() => locator.keyLoader,
		SYMMETRIC_CIPHER_FACADE,
	)
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instancePipeline, () => locator.crypto, typeModelResolver)
	locator.applicationTypesFacade = applicationTypesFacade()
	locator.entropyFacade = new EntropyFacade(locator.user, locator.serviceExecutor, random, () => locator.keyLoader)
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, locator.user, dateProvider, typeModelResolver)

	const lazyCrypto = () => locator.crypto
	const entityRestClient = new EntityRestClient(
		locator.user,
		locator.restClient,
		lazyCrypto,
		locator.instancePipeline,
		locator.blobAccessToken,
		typeModelResolver,
		lazyCrypto,
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
			throw new ProgrammingError("getting indexerCore when we should be using SQLite (local-store storage)")
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
				locator.bulkMailLoader,
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

	const offlineStorageIndexerPersistence = lazyMemoized(async () => {
		const { OfflineStoragePersistence } = await import("../index/OfflineStoragePersistence.js")
		return new OfflineStoragePersistence(locator.sqlCipherFacade)
	})

	let offlineStorageProvider
	if (isOfflineStorageAvailable()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			const { SearchTableDefinitions } = await import("../index/OfflineStoragePersistence.js")
			const { AutosaveDraftsTableDefinitions } = await import("../../../common/api/worker/facades/lazy/OfflineStorageAutosaveFacade.js")
			const { SpamClassificationTableDefinitions } = await import("../../../common/api/worker/facades/lazy/OfflineStorageSpamClassifierStorageFacade.js")

			const customCacheHandler = new CustomCacheHandlerMap(
				{
					ref: CalendarEventTypeRef,
					handler: new CustomCalendarEventCacheHandler(entityRestClient, typeModelResolver),
				},
				{
					ref: MailTypeRef,
					handler: new CustomMailEventCacheHandler(mailIndexer),
				},
				{
					ref: UserTypeRef,
					handler: new CustomUserCacheHandler(locator.cacheStorage, await locator.spamClassifierStorageFacade()),
				},
			)

			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(createOfflineStorageMigrations(locator.sqlCipherFacade, locator.applicationTypesFacade)),
				new MailOfflineCleaner(),
				locator.instancePipeline.modelMapper,
				typeModelResolver,
				customCacheHandler,
				Object.assign({}, KeyVerificationTableDefinitions, SearchTableDefinitions, AutosaveDraftsTableDefinitions, SpamClassificationTableDefinitions),
			)
		}
	} else {
		offlineStorageProvider = async () => null
	}
	const ephemeralStorageProvider = async () => {
		const customCacheHandler = new CustomCacheHandlerMap({
			ref: UserTypeRef,
			handler: new CustomUserCacheHandler(locator.cacheStorage, await locator.spamClassifierStorageFacade()),
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
	locator.patchMerger = new PatchMerger(locator.cacheStorage, locator.instancePipeline, typeModelResolver, () => locator.crypto, SYMMETRIC_CIPHER_FACADE)

	locator.lastProcessedEventBatchStorageFacade = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			return new OfflineStorageLastProcessedEventBatchStorageFacade(locator.sqlCipherFacade)
		} else if (isBrowser()) {
			return new IndexedDbLastProcessedEventBatchStorageFacade(indexerCore, ephemeralStorageProvider, mailIndexer)
		} else {
			return new NoOpLastProcessedEventBatchStorageFacade()
		}
	})

	// We don't want to cache within the admin client
	let cache: DefaultEntityRestCache | null = null
	if (!isAdminClient()) {
		cache = new DefaultEntityRestCache(
			entityRestClient,
			maybeUninitializedStorage,
			typeModelResolver,
			locator.patchMerger,
			locator.lastProcessedEventBatchStorageFacade,
		)
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
		return async () => {
			// On platforms with offline cache we just use cache as we are not bounded by memory.
			if (isOfflineStorageAvailable()) {
				return new BulkMailLoader(locator.cachingEntityClient, locator.cachingEntityClient, mailFacade)
			} else {
				// On platforms without offline cache we use new ephemeral cache storage for mails only and uncached storage for the rest
				// We create empty CustomCacheHandlerMap because this cache is separate anyway and user updates don't matter.
				return new BulkMailLoader(
					new EntityClient(
						new DefaultEntityRestCache(
							entityRestClient,
							await ephemeralStorageProvider(),
							typeModelResolver,
							locator.patchMerger,
							locator.lastProcessedEventBatchStorageFacade,
						),
						typeModelResolver,
					),
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

		if (isOfflineStorageAvailable()) {
			const { OfflineStorageIndexer } = await import("../index/OfflineStorageIndexer.js")
			const persistence = await offlineStorageIndexerPersistence()
			return new OfflineStorageIndexer(locator.user, persistence, await mailIndexer(), mainInterface.infoMessageHandler, contact)
		} else {
			const { IndexedDbIndexer } = await import("../index/IndexedDbIndexer.js")
			const core = await indexerCore()
			return new IndexedDbIndexer(
				serverDateProvider,
				await db(),
				core,
				mainInterface.infoMessageHandler,
				locator.cachingEntityClient,
				await mailIndexer(),
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

	locator.identityKeyTrustDatabase = new IdentityKeyTrustDatabase(locator.sqlCipherFacade, () => locator.login)
	locator.publicIdentityKeyProvider = new PublicIdentityKeyProvider(
		locator.serviceExecutor,
		locator.cachingEntityClient,
		locator.keyAuthenticationFacade,
		locator.keyLoader,
		locator.identityKeyTrustDatabase,
	)
	locator.keyVerification = lazyMemoized(async () => {
		const { KeyVerificationFacade } = await import("../../../../platform-kit/base/facades/lazy/KeyVerificationFacade.js")
		return new KeyVerificationFacade(locator.publicKeySignatureFacade, locator.publicIdentityKeyProvider, locator.identityKeyTrustDatabase)
	})

	const publicEncryptionKeyCache = new PublicEncryptionKeyCache() // should not expose this
	locator.publicEncryptionKeyProvider = new PublicEncryptionKeyProvider(locator.serviceExecutor, locator.keyVerification, publicEncryptionKeyCache)
	const adminKeyLoaderProvider = () => locator.adminKeyLoader

	locator.asymmetricCrypto = new AsymmetricCryptoFacade(
		locator.rsa,
		locator.pqFacade,
		locator.keyLoader,
		locator.cryptoWrapper,
		locator.serviceExecutor,
		locator.publicEncryptionKeyProvider,
		adminKeyLoaderProvider,
	)

	locator.adminKeyLoader = new AdminKeyLoaderFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.keyLoader,
		locator.cacheManagement,
		locator.asymmetricCrypto,
		locator.cryptoWrapper,
		locator.keyAuthenticationFacade,
	)

	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.serviceExecutor,
		locator.instancePipeline,
		locator.cacheManagement,
		locator.keyLoader,
		locator.asymmetricCrypto,
		locator.publicEncryptionKeyProvider,
		new InstanceSessionKeysCache(),
		locator.cryptoWrapper,
		lazyMemoized(() => locator.keyRotation),
		typeModelResolver,
		async (error: Error) => {
			await worker.sendError(error)
		},
	)

	locator.recoverCode = lazyMemoized(async () => {
		const { RecoverCodeFacade } = await import("../../../../platform-kit/base/facades/lazy/RecoverCodeFacade.js")
		return new RecoverCodeFacade(locator.user, locator.cachingEntityClient, locator.login, locator.keyLoader)
	})
	locator.share = lazyMemoized(async () => {
		const { ShareFacade } = await import("../../../../platform-kit/base/facades/lazy/ShareFacade.js")
		return new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient, locator.keyLoader)
	})
	locator.counters = lazyMemoized(async () => {
		const { CounterFacade } = await import("../../../../platform-kit/network/CounterFacade.js")
		return new CounterFacade(locator.serviceExecutor)
	})

	locator.identityKeyCreator = lazyMemoized(async () => {
		const { IdentityKeyCreator } = await import("../../../../platform-kit/base/crypto/IdentityKeyCreator.js")
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
		const { GroupManagementFacade } = await import("../../../../platform-kit/base/facades/lazy/GroupManagementFacade.js")
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
		async onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				// index new items in background
				console.log("initIndexer and SpamClassifier after log in")
				await fullLoginIndexerInit(worker)
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
	const { DatabaseKeyFactory } = await import("../../../../platform-kit/base/crypto/DatabaseKeyFactory.js")

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
		locator.applicationTypesFacade,
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
		return new BlobFacade(
			locator.restClient,
			suspensionHandler,
			fileApp,
			aesApp,
			locator.instancePipeline,
			locator.crypto,
			locator.blobAccessToken,
			mainInterface.uploadProgressListener,
		)
	})
	locator.mail = lazyMemoized(async () => {
		const { MailFacade } = await import("../../../common/api/worker/facades/lazy/MailFacade.js")

		return new MailFacade(
			locator.user,
			locator.cachingEntityClient,
			locator.crypto,
			locator.cryptoWrapper,
			locator.serviceExecutor,
			await locator.blob(),
			fileApp,
			locator.login,
			locator.keyLoader,
			locator.publicEncryptionKeyProvider,
		)
	})

	locator.spamClassifier = lazyMemoized(async () => {
		const { SpamClassifierDataDealer } = await import("../spamClassification/SpamClassifierDataDealer")
		const { SpamClassifier } = await import("../spamClassification/SpamClassifier")
		const spamClassificationDataDealer = new SpamClassifierDataDealer(locator.cachingEntityClient, locator.bulkMailLoader, locator.mail)
		return new SpamClassifier(await locator.spamClassifierStorageFacade(), spamClassificationDataDealer)
	})

	locator.alarmFacade = lazyMemoized(async () => {
		const { AlarmFacade } = await import("../../../common/api/worker/facades/lazy/AlarmFacade.js")
		const nativePushFacade = new NativePushFacadeSendDispatcher(worker)

		return new AlarmFacade(
			locator.user,
			locator.serviceExecutor,
			locator.cryptoWrapper,
			locator.crypto,
			nativePushFacade,
			locator.instancePipeline,
			mainInterface.infoMessageHandler,
		)
	})

	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("../../../common/api/worker/facades/lazy/CalendarFacade.js")

		return new CalendarFacade(
			locator.user,
			await locator.groupManagement(),
			locator.cache as DefaultEntityRestCache,
			nonCachingEntityClient, // without cache
			mainInterface.operationProgressTracker,
			locator.serviceExecutor,
			locator.cachingEntityClient,
			await locator.alarmFacade(),
		)
	})

	locator.mailAddress = lazyMemoized(async () => {
		const { MailAddressFacade } = await import("../../../common/api/worker/facades/lazy/MailAddressFacade.js")
		return new MailAddressFacade(
			locator.user,
			locator.adminKeyLoader,
			locator.serviceExecutor,
			nonCachingEntityClient, // without cache
			dateProvider,
		)
	})
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("../../../common/api/worker/facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.keyLoader, locator.user)
	})

	if (isOfflineStorageAvailable()) {
		locator.autosaveFacade = lazyMemoized(async () => {
			const { OfflineStorageAutosaveFacade } = await import("../../../common/api/worker/facades/lazy/OfflineStorageAutosaveFacade.js")
			return new OfflineStorageAutosaveFacade(locator.sqlCipherFacade)
		})
	} else {
		locator.autosaveFacade = locator.configFacade
	}

	if (isOfflineStorageAvailable()) {
		locator.spamClassifierStorageFacade = lazyMemoized(async () => {
			const { OfflineStorageSpamClassifierStorageFacade } = await import(
				"../../../common/api/worker/facades/lazy/OfflineStorageSpamClassifierStorageFacade.js"
			)
			return new OfflineStorageSpamClassifierStorageFacade(locator.sqlCipherFacade)
		})
	} else {
		locator.spamClassifierStorageFacade = locator.configFacade
	}

	const eventBusCoordinator = new EventBusEventCoordinator(
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
		async (events, batchId, groupId, isInitialSyncDone) => {
			const indexer = await locator.indexer()
			await indexer.processEntityEvents(events, batchId, groupId, isInitialSyncDone)
		},
		locator.rolloutFacade,
		locator.groupManagement,
		locator.identityKeyCreator,
		mainInterface.syncTracker,
	)
	locator.eventBusClient = new EventBusClient(
		mainInterface.wsConnectivityListener,
		eventBusCoordinator,
		cache ?? new AdminClientDummyEntityRestCache(),
		locator.user,
		locator.instancePipeline,
		(path) => new WebSocket(domainConfig.websocketUrl + path),
		new SleepDetector(scheduler, dateProvider),
		typeModelResolver,
		locator.crypto,
		locator.crypto,
		locator.lastProcessedEventBatchStorageFacade,
		serverDateProvider,
		(totalWork) => new ProgressMonitorDelegate(mainInterface.progressTracker, totalWork),
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
		const { DriveFacade } = await import("../../../common/api/worker/facades/lazy/DriveFacade.js")
		return new DriveFacade(
			locator.keyLoader,
			await locator.blob(),
			locator.user,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.crypto,
			locator.cryptoWrapper,
		)
	})
}

const RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000

async function fullLoginIndexerInit(worker: WorkerImpl): Promise<void> {
	const indexer = await locator.indexer()
	try {
		await indexer.fullLoginInit({
			user: assertNotNull(locator.user.getUser()),
		})
	} catch (e) {
		if (e instanceof ServiceUnavailableError) {
			console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
			await delay(RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ServiceUnavailableError")
			return fullLoginIndexerInit(worker)
		} else if (e instanceof ConnectionError) {
			console.log("Retry init indexer in 30 seconds after ConnectionError")
			await delay(RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ConnectionError")
			return fullLoginIndexerInit(worker)
		} else {
			console.log("send indexer error to main thread", e)
			// not awaiting
			// noinspection ES6MissingAwait
			worker.sendError(e)
			return
		}
	}
}

export async function resetLocator(): Promise<void> {
	await locator.login.resetSession()
	await initLocator(locator._worker, locator._browserData, locator._apps)
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
