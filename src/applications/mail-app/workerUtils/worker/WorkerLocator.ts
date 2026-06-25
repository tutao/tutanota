import type { WorkerImpl } from "./WorkerImpl.js"
import type { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade.js"
import { DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import type { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import type { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade.js"
import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import { EventBusClient } from "../../../../app-kit/local-store/event/EventBusClient.js"
import { ProgressMonitorDelegate } from "../../../common/api/worker/ProgressMonitorDelegate.js"
import {
	assertWorkerOrNode,
	Const,
	getWebsocketBaseUrl,
	isAdminClient,
	isBrowser,
	isOfflineStorageAvailable,
	ProgrammingError,
} from "../../../../platform-kit/app-env"
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { UserTypeRef } from "@tutao/entities/sys"
import type { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
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
import { AdminClientDummyEntityRestCache } from "../../../common/api/worker/rest/AdminClientDummyEntityRestCache.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../../platform-kit/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import type { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { KeyVerificationTableDefinitions, type LocalIdentityKeyTrustDatabase } from "../../../../app-kit/local-store/LocalIdentityKeyTrustDatabase"
import type { AutosaveFacade } from "../../../common/api/worker/facades/lazy/AutosaveFacade"
import type { SpamClassifier } from "../spamClassification/SpamClassifier"
import { SpamClassifierStorageFacade } from "../../../common/api/worker/facades/lazy/SpamClassifierStorageFacade"
import type { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	IndexedDbLastProcessedEventBatchStorageFacade,
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage"
import { AlarmFacade } from "../../../common/api/worker/facades/lazy/AlarmFacade"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp.js"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { CustomCalendarEventCacheHandler } from "../../../calendar-app/workerUtils/worker/CustomCalendarEventCacheHandler"
import { CustomMailEventCacheHandler } from "./CustomMailEventCacheHandler"
import type { ContactSearchFacade } from "../index/ContactSearchFacade"
import type { IndexedDbSearchFacade } from "../index/IndexedDbSearchFacade.js"
import type { OfflineStorageSearchFacade } from "../index/OfflineStorageSearchFacade.js"
import type { BulkMailLoader } from "../index/BulkMailLoader.js"
import type { MailExportFacade } from "../../../common/api/worker/facades/lazy/MailExportFacade"
import type { Indexer } from "../index/Indexer"
import type { SearchFacade } from "../index/SearchFacade"
import type { ContactIndexer } from "../index/ContactIndexer"
import { MailOfflineCleaner } from "../offline/MailOfflineCleaner.js"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage.js"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { NamedClientModel } from "../../../../platform-kit/instance-pipeline"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, DateProvider, lazyAsync, lazyMemoized } from "../../../../platform-kit/utils"
import { MailLoginListener } from "./MailLoginListener"
import { BaseLocator } from "../../../../platform-kit/base/BaseLocator.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator.js"
import { createBaseLocator } from "../../../../platform-kit/base/BaseLocator"
import { createRsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { TutanotaEntityMigrator } from "../../../common/api/worker/TutanotaEntityMigrator.js"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"
import { CustomContactEventCacheHandler } from "./CustomContactEventCacheHandler"

assertWorkerOrNode()

export type WorkerLocatorType = {
	// Base: all platform-kit typed instances
	base: BaseLocator

	// App-kit infrastructure
	cacheStorage: CacheStorage
	eventBusClient: EventBusClient
	identityKeyTrustDatabase: LocalIdentityKeyTrustDatabase
	native: NativeInterface
	workerFacade: WorkerFacade
	sqlCipherFacade: SqlCipherFacade

	// Domain facades
	blob: lazyAsync<BlobFacade>
	mail: lazyAsync<MailFacade>
	calendar: lazyAsync<CalendarFacade>
	alarmFacade: lazyAsync<AlarmFacade>
	Const: Record<string, any>

	// Search & indexing (mail-specific)
	indexer: lazyAsync<Indexer>
	search: lazyAsync<SearchFacade>
	contactSearch: lazyAsync<ContactSearchFacade>
	bulkMailLoader: lazyAsync<BulkMailLoader>

	// Management facades
	userManagement: lazyAsync<UserManagementFacade>
	customer: lazyAsync<CustomerFacade>
	giftCards: lazyAsync<GiftCardFacade>
	mailAddress: lazyAsync<MailAddressFacade>
	booking: lazyAsync<BookingFacade>
	cacheManagement: lazyAsync<CacheManagementFacade>

	// Misc facades
	configFacade: lazyAsync<ConfigurationDatabase>
	pdfWriter: lazyAsync<PdfWriter>
	mailExportFacade: lazyAsync<MailExportFacade>
	autosaveFacade: lazyAsync<AutosaveFacade>
	contactFacade: lazyAsync<ContactFacade>
	spamClassifier: lazyAsync<SpamClassifier>
	spamClassifierStorageFacade: lazyAsync<SpamClassifierStorageFacade>
	driveFacade: lazyAsync<DriveFacade>

	// Meta
	_worker: WorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>
}

export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
	const { LocalIdentityKeyTrustDatabase } = await import("../../../../app-kit/local-store/LocalIdentityKeyTrustDatabase")

	locator._worker = worker
	locator._browserData = browserData
	locator._apps = apps
	locator.workerFacade = new WorkerFacade()

	const mainInterface = worker.getMainInterface()
	const dateProvider = new NoZoneDateProvider()
	const fileFacadeSendDispatcher = new FileFacadeSendDispatcher(worker)
	const fileApp = new NativeFileApp(fileFacadeSendDispatcher, new ExportFacadeSendDispatcher(worker))

	locator.native = worker

	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	// Indexing state — no factory deps, can be defined early
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

	const offlineStorageIndexerPersistence = lazyMemoized(async () => {
		const { OfflineStoragePersistence } = await import("../index/OfflineStoragePersistence.js")
		return new OfflineStoragePersistence(locator.sqlCipherFacade)
	})

	// These lazy closures reference locator.base.* — safe because they're only called after createBaseLocator returns
	const mailIndexer = lazyMemoized(async () => {
		const { IndexedDbMailIndexerBackend } = await import("../index/IndexedDbMailIndexerBackend")
		const { OfflineStorageMailIndexerBackend } = await import("../index/OfflineStorageMailIndexerBackend")
		const { MailIndexer } = await import("../index/MailIndexer.js")
		const bulkLoaderFactory = await prepareBulkLoaderFactory()
		const mailDateProvider = new LocalTimeDateProvider()
		const mailFacade = await locator.mail()
		if (isOfflineStorageAvailable()) {
			const persistence = await offlineStorageIndexerPersistence()
			return new MailIndexer(
				mainInterface.infoMessageHandler,
				bulkLoaderFactory,
				locator.base.cachingEntityClient,
				mailDateProvider,
				mailFacade,
				() => new OfflineStorageMailIndexerBackend(persistence),
			)
		} else {
			const core = await indexerCore()
			return new MailIndexer(
				mainInterface.infoMessageHandler,
				locator.bulkMailLoader,
				locator.base.cachingEntityClient,
				mailDateProvider,
				mailFacade,
				(userId) => new IndexedDbMailIndexerBackend(core, userId, locator.base.typeModelResolver),
			)
		}
	})

	const contactSuggestionFacade = lazyMemoized(async () => {
		const { SuggestionFacade } = await import("../index/SuggestionFacade")
		return new SuggestionFacade(ContactTypeRef, await db(), locator.base.typeModelResolver)
	})

	const contactIndexer = lazyMemoized(async (): Promise<ContactIndexer> => {
		const { OfflineStorageContactIndexerBackend } = await import("../index/OfflineStorageContactIndexerBackend")
		const { IndexedDbContactIndexerBackend } = await import("../index/IndexedDbContactIndexerBackend")
		const { ContactIndexer } = await import("../index/ContactIndexer.js")

		if (isOfflineStorageAvailable()) {
			const persistence = await offlineStorageIndexerPersistence()
			const backend = new OfflineStorageContactIndexerBackend(locator.base.cachingEntityClient, persistence)
			return new ContactIndexer(locator.base.cachingEntityClient, locator.base.user, backend)
		} else {
			const core = await indexerCore()
			const backend = new IndexedDbContactIndexerBackend(
				core,
				locator.base.cachingEntityClient,
				await contactSuggestionFacade(),
				locator.base.typeModelResolver,
			)
			return new ContactIndexer(locator.base.cachingEntityClient, locator.base.user, backend)
		}
	})

	const prepareBulkLoaderFactory = async () => {
		const { BulkMailLoader } = await import("../index/BulkMailLoader.js")
		const mailFacade = await locator.mail()
		return async () => {
			if (isOfflineStorageAvailable()) {
				return new BulkMailLoader(locator.base.cachingEntityClient, locator.base.cachingEntityClient, mailFacade)
			} else {
				return new BulkMailLoader(
					new EntityClient(
						new DefaultEntityRestCache(
							locator.base.entityRestClient,
							await ephemeralStorageProvider(),
							locator.base.typeModelResolver,
							locator.base.patchMerger,
							locator.base.lastProcessedEventBatchStorageFacade,
						),
						locator.base.typeModelResolver,
					),
					new EntityClient(locator.base.entityRestClient, locator.base.typeModelResolver),
					mailFacade,
				)
			}
		}
	}
	locator.bulkMailLoader = async () => {
		const factory = await prepareBulkLoaderFactory()
		return factory()
	}

	// Storage setup
	if (isOfflineStorageAvailable()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
	}

	// offlineStorageProvider and ephemeralStorageProvider reference locator.base.* lazily — only called during login init
	let offlineStorageProvider: () => Promise<OfflineStorage | null>
	if (isOfflineStorageAvailable()) {
		offlineStorageProvider = async () => {
			const { SearchTableDefinitions } = await import("../index/OfflineStoragePersistence.js")
			const { AutosaveDraftsTableDefinitions } = await import("../../../common/api/worker/facades/lazy/OfflineStorageAutosaveFacade.js")
			const { SpamClassificationTableDefinitions } = await import("../../../common/api/worker/facades/lazy/OfflineStorageSpamClassifierStorageFacade.js")

			const customCacheHandler = new CustomCacheHandlerMap(
				{
					ref: CalendarEventTypeRef,
					handler: new CustomCalendarEventCacheHandler(locator.base.entityRestClient, locator.base.typeModelResolver),
				},
				{
					ref: MailTypeRef,
					handler: new CustomMailEventCacheHandler(mailIndexer),
				},
				{
					ref: ContactTypeRef,
					handler: new CustomContactEventCacheHandler(contactIndexer),
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
				new OfflineStorageMigrator(createOfflineStorageMigrations(locator.sqlCipherFacade, locator.base.applicationTypesFacade)),
				new MailOfflineCleaner(),
				locator.base.instancePipeline.modelMapper,
				locator.base.typeModelResolver,
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
		return new EphemeralCacheStorage(locator.base.instancePipeline.modelMapper, locator.base.typeModelResolver, customCacheHandler)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		(error: Error) => worker.sendError(error),
		ephemeralStorageProvider,
		offlineStorageProvider,
	)
	locator.cacheStorage = maybeUninitializedStorage

	const lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider> = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			return new OfflineStorageLastProcessedEventBatchStorageFacade(locator.sqlCipherFacade)
		} else if (isBrowser()) {
			return new IndexedDbLastProcessedEventBatchStorageFacade(indexerCore, ephemeralStorageProvider, mailIndexer)
		} else {
			return new NoOpLastProcessedEventBatchStorageFacade()
		}
	})

	locator.identityKeyTrustDatabase = new LocalIdentityKeyTrustDatabase(locator.sqlCipherFacade, () => locator.base.login)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(
			locator.base.user,
			locator.base.cachingEntityClient,
			assertNotNull(locator.base.cache as DefaultEntityRestCache | null),
		)
	})

	// Create all platform-kit typed instances
	const clientModelInfo = initClientModels(apps)
	locator.base = await createBaseLocator({
		worker,
		clientModelInfo,
		browserData,
		loginListenerProvider: (user) => new MailLoginListener(() => locator.eventBusClient, mainInterface.loginListener, user, worker),
		maybeUninitializedStorage,
		lastProcessedEventBatchStorageFacade,
		cacheManagement: locator.cacheManagement,
		identityKeyTrustDatabase: locator.identityKeyTrustDatabase,
		domainConfig: new DomainConfigProvider().getCurrentDomainConfig(),
		rsa: await createRsaImplementation(worker),
		fileFacade: new FileFacadeSendDispatcher(worker),
		nativeCryptoFacade: new NativeCryptoFacadeSendDispatcher(worker),
		entityMigratorFactory: ({
			cryptoWrapper,
			user,
			keyLoader,
			cachingEntityClient,
			serviceExecutor,
			typeModelResolver,
			instancePipeline,
			restClient,
			crypto,
		}) =>
			new TutanotaEntityMigrator(
				cryptoWrapper,
				user,
				keyLoader,
				cachingEntityClient,
				serviceExecutor,
				typeModelResolver,
				instancePipeline,
				restClient,
				crypto,
			),
		entityRestCache: (entityRestClient, patchMerger, typeModelResolver, lastProcessed) =>
			new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage, typeModelResolver, patchMerger, lastProcessed),
	})

	// App-specific setup — all platform-kit deps accessed via locator.base.*

	locator.booking = lazyMemoized(async () => {
		const { BookingFacade } = await import("../../../common/api/worker/facades/lazy/BookingFacade.js")
		return new BookingFacade(locator.base.serviceExecutor)
	})

	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("../../../common/api/worker/facades/lazy/UserManagementFacade.js")
		return new UserManagementFacade(
			locator.base.user,
			await locator.base.groupManagement(),
			await locator.base.counters(),
			locator.base.serviceExecutor,
			mainInterface.operationProgressTracker,
			locator.base.login,
			locator.base.pqFacade,
			locator.base.keyLoader,
			await locator.base.recoverCode(),
			locator.base.adminKeyLoader,
			await locator.base.identityKeyCreator(),
		)
	})

	locator.customer = lazyMemoized(async () => {
		const { CustomerFacade } = await import("../../../common/api/worker/facades/lazy/CustomerFacade.js")
		return new CustomerFacade(
			locator.base.user,
			await locator.base.groupManagement(),
			await locator.userManagement(),
			await locator.base.counters(),
			locator.base.rsa,
			locator.base.cachingEntityClient,
			locator.base.serviceExecutor,
			await locator.booking(),
			locator.base.crypto,
			mainInterface.operationProgressTracker,
			locator.pdfWriter,
			locator.base.pqFacade,
			locator.base.keyLoader,
			await locator.base.recoverCode(),
			locator.base.asymmetricCrypto,
			locator.base.publicEncryptionKeyProvider,
			locator.base.cryptoWrapper,
		)
	})

	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker))
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("../../../common/api/worker/facades/lazy/BlobFacade.js")
		return new BlobFacade(
			locator.base.restClient,
			locator.base.suspensionHandler,
			fileApp,
			aesApp,
			locator.base.instancePipeline,
			locator.base.crypto,
			locator.base.blobAccessToken,
			mainInterface.uploadProgressListener,
		)
	})

	locator.mail = lazyMemoized(async () => {
		const { MailFacade } = await import("../../../common/api/worker/facades/lazy/MailFacade.js")
		return new MailFacade(
			locator.base.user,
			locator.base.cachingEntityClient,
			locator.base.crypto,
			locator.base.cryptoWrapper,
			locator.base.serviceExecutor,
			await locator.blob(),
			fileApp,
			locator.base.login,
			locator.base.keyLoader,
			locator.base.publicEncryptionKeyProvider,
		)
	})

	locator.spamClassifier = lazyMemoized(async () => {
		const { SpamClassifierDataDealer } = await import("../spamClassification/SpamClassifierDataDealer")
		const { SpamClassifier } = await import("../spamClassification/SpamClassifier")
		const spamClassificationDataDealer = new SpamClassifierDataDealer(locator.base.cachingEntityClient, locator.bulkMailLoader, locator.mail)
		return new SpamClassifier(await locator.spamClassifierStorageFacade(), spamClassificationDataDealer)
	})

	locator.alarmFacade = lazyMemoized(async () => {
		const { AlarmFacade } = await import("../../../common/api/worker/facades/lazy/AlarmFacade.js")
		const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
		return new AlarmFacade(
			locator.base.user,
			locator.base.serviceExecutor,
			locator.base.cryptoWrapper,
			locator.base.crypto,
			nativePushFacade,
			locator.base.instancePipeline,
			mainInterface.infoMessageHandler,
		)
	})

	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("../../../common/api/worker/facades/lazy/CalendarFacade.js")
		return new CalendarFacade(
			locator.base.user,
			await locator.base.groupManagement(),
			locator.base.cache as DefaultEntityRestCache,
			locator.base.nonCachingEntityClient,
			mainInterface.operationProgressTracker,
			locator.base.serviceExecutor,
			locator.base.cachingEntityClient,
			await locator.alarmFacade(),
		)
	})

	locator.mailAddress = lazyMemoized(async () => {
		const { MailAddressFacade } = await import("../../../common/api/worker/facades/lazy/MailAddressFacade.js")
		return new MailAddressFacade(
			locator.base.user,
			locator.base.adminKeyLoader,
			locator.base.serviceExecutor,
			locator.base.nonCachingEntityClient,
			dateProvider,
		)
	})

	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("../../../common/api/worker/facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.base.keyLoader, locator.base.user)
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

	locator.indexer = lazyMemoized(async () => {
		const contact = await contactIndexer()

		if (isOfflineStorageAvailable()) {
			const { OfflineStorageIndexer } = await import("../index/OfflineStorageIndexer.js")
			const persistence = await offlineStorageIndexerPersistence()
			return new OfflineStorageIndexer(locator.base.user, persistence, await mailIndexer(), mainInterface.infoMessageHandler, contact)
		} else {
			const { IndexedDbIndexer } = await import("../index/IndexedDbIndexer.js")
			const core = await indexerCore()
			return new IndexedDbIndexer(
				serverDateProvider,
				await db(),
				core,
				mainInterface.infoMessageHandler,
				locator.base.cachingEntityClient,
				await mailIndexer(),
				contact,
				locator.base.typeModelResolver,
				locator.base.keyLoader,
			)
		}
	})

	locator.search = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			const { OfflineStorageSearchFacade } = await import("../index/OfflineStorageSearchFacade.js")
			return new OfflineStorageSearchFacade(locator.sqlCipherFacade, await mailIndexer(), await contactIndexer())
		} else {
			const { IndexedDbSearchFacade } = await import("../index/IndexedDbSearchFacade.js")
			return new IndexedDbSearchFacade(
				locator.base.user,
				await db(),
				await mailIndexer(),
				await contactSuggestionFacade(),
				browserData,
				locator.base.cachingEntityClient,
				locator.base.typeModelResolver,
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
			return new IndexedDbContactSearchFacade(search as IndexedDbSearchFacade, locator.base.typeModelResolver)
		}
	})

	const serverDateProvider: DateProvider = {
		now(): number {
			return locator.base.restClient.getServerTimestampMs()
		},
		timeZone(): string {
			throw new ProgrammingError("Not supported")
		},
	}

	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()
	const eventBusCoordinator = new EventBusEventCoordinator(
		locator.mail,
		locator.base.user,
		locator.base.cachingEntityClient,
		mainInterface.eventController,
		locator.configFacade,
		locator.base.keyRotation,
		locator.cacheManagement,
		async (error: Error) => {
			await worker.sendError(error)
		},
		async (events, batchId, groupId, isInitialSyncDone) => {
			const indexer = await locator.indexer()
			await indexer.processEntityEvents(events, batchId, groupId, isInitialSyncDone)
		},
		locator.base.rolloutFacade,
		locator.base.groupManagement,
		locator.base.identityKeyCreator,
		mainInterface.syncTracker,
	)

	const cache = isAdminClient() ? null : (locator.base.cache as DefaultEntityRestCache)
	locator.eventBusClient = new EventBusClient(
		mainInterface.wsConnectivityListener,
		eventBusCoordinator,
		cache ?? new AdminClientDummyEntityRestCache(),
		locator.base.user,
		locator.base.instancePipeline,
		(path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path),
		new SleepDetector(scheduler, dateProvider),
		locator.base.typeModelResolver,
		locator.base.crypto,
		locator.base.entityMigrator,
		locator.base.lastProcessedEventBatchStorageFacade,
		serverDateProvider,
		(totalWork) => new ProgressMonitorDelegate(mainInterface.progressTracker, totalWork),
	)

	locator.Const = Const

	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("../../../common/api/worker/facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.base.user, await locator.customer(), locator.base.serviceExecutor, locator.base.crypto, locator.base.keyLoader)
	})

	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("../../../common/api/worker/facades/lazy/ContactFacade.js")
		return new ContactFacade(new EntityClient(locator.base.cache, locator.base.typeModelResolver))
	})

	locator.mailExportFacade = lazyMemoized(async () => {
		const { MailExportFacade } = await import("../../../common/api/worker/facades/lazy/MailExportFacade.js")
		const { MailExportTokenFacade } = await import("../../../common/api/worker/facades/lazy/MailExportTokenFacade.js")
		const mailExportTokenFacade = new MailExportTokenFacade(locator.base.serviceExecutor)
		return new MailExportFacade(
			mailExportTokenFacade,
			await locator.bulkMailLoader(),
			await locator.blob(),
			locator.base.crypto,
			locator.base.blobAccessToken,
		)
	})

	locator.driveFacade = lazyMemoized(async () => {
		const { DriveFacade } = await import("../../../common/api/worker/facades/lazy/DriveFacade.js")
		return new DriveFacade(
			locator.base.keyLoader,
			await locator.blob(),
			locator.base.user,
			locator.base.cachingEntityClient,
			locator.base.serviceExecutor,
			locator.base.crypto,
			locator.base.cryptoWrapper,
			locator.cacheStorage,
		)
	})
}

export async function resetLocator(): Promise<void> {
	await locator.base.login.resetSession()
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
