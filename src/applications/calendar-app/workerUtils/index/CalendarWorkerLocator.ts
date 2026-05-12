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
import type { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import type { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface.js"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp.js"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../../platform-kit/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage.js"
import { KeyVerificationTableDefinitions, LocalIdentityKeyTrustDatabase } from "../../../../app-kit/local-store/LocalIdentityKeyTrustDatabase.js"
import {
	ExportFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacadeSendDispatcher,
	NativeCryptoFacadeSendDispatcher,
	NativePushFacadeSendDispatcher,
	SqlCipherFacadeSendDispatcher,
} from "@tutao/native-bridge/generatedIpc/dispatchers"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { DateProvider, lazyAsync, lazyMemoized, noOp } from "../../../../platform-kit/utils"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { CalendarWorkerImpl } from "../worker/CalendarWorkerImpl.js"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { EntityRestCache } from "../../../../platform-kit/network/EntityRestCacheInterface"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { UserTypeRef } from "@tutao/entities/sys"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { AlarmFacade } from "../../../common/api/worker/facades/lazy/AlarmFacade"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { NamedClientModel } from "../../../../platform-kit/instance-pipeline"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator.js"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage"
import { CustomCalendarEventCacheHandler } from "../worker/CustomCalendarEventCacheHandler"
import { DefaultLoginListener } from "../../../common/api/worker/utils/DefaultLoginListener"
import { BaseLocator } from "../../../../platform-kit/base/BaseLocator.js"
import { createBaseLocator } from "../../../../platform-kit/base/BaseLocator"
import { createRsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { TutanotaEntityMigrator } from "../../../common/api/worker/TutanotaEntityMigrator.js"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"

assertWorkerOrNode()

export type CalendarWorkerLocatorType = {
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

	// Meta
	_worker: CalendarWorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>

	// Contact & Drive
	contactFacade: lazyAsync<ContactFacade>
	driveFacade: lazyAsync<DriveFacade>
}
export const locator: CalendarWorkerLocatorType = {} as any

export async function initLocator(worker: CalendarWorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
	locator._worker = worker
	locator._browserData = browserData
	locator._apps = apps
	locator.workerFacade = new WorkerFacade()
	locator.native = worker

	const mainInterface = worker.getMainInterface()
	const dateProvider = new NoZoneDateProvider()
	const fileFacadeSendDispatcher = new FileFacadeSendDispatcher(worker)
	const fileApp = new NativeFileApp(fileFacadeSendDispatcher, new ExportFacadeSendDispatcher(worker))

	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	if (!isBrowser() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
	}

	// offlineStorageProvider and ephemeralStorageProvider reference locator.base.* lazily — only called during login init
	let offlineStorageProvider: () => Promise<OfflineStorage | null>
	if (!isBrowser() && !isAdminClient()) {
		offlineStorageProvider = async () => {
			const customCacheHandler = new CustomCacheHandlerMap({
				ref: CalendarEventTypeRef,
				handler: new CustomCalendarEventCacheHandler(locator.base.entityRestClient, locator.base.typeModelResolver),
			})
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				new OfflineStorageMigrator(createOfflineStorageMigrations(locator.sqlCipherFacade, locator.base.applicationTypesFacade)),
				locator.base.instancePipeline.modelMapper,
				locator.base.typeModelResolver,
				customCacheHandler,
				KeyVerificationTableDefinitions,
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
		return new EphemeralCacheStorage(locator.base.instancePipeline.modelMapper, locator.base.typeModelResolver, customCacheHandler)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		async (error: Error) => {
			await worker.sendError(error)
		},
		ephemeralStorageProvider,
		offlineStorageProvider,
	)
	locator.cacheStorage = maybeUninitializedStorage

	const lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider> = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			return new OfflineStorageLastProcessedEventBatchStorageFacade(locator.sqlCipherFacade)
		} else {
			return new NoOpLastProcessedEventBatchStorageFacade()
		}
	})

	locator.identityKeyTrustDatabase = new LocalIdentityKeyTrustDatabase(locator.sqlCipherFacade, () => locator.base.login)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.base.user, locator.base.cachingEntityClient, locator.base.cache as DefaultEntityRestCache)
	})
	const clientModelInfo = initClientModels(apps)
	locator.base = await createBaseLocator({
		worker,
		clientModelInfo,
		browserData,
		loginListenerProvider: (user) => new DefaultLoginListener(() => locator.eventBusClient, mainInterface.loginListener, user),
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
			locator.base.typeModelResolver,
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
		noOp,
		locator.base.rolloutFacade,
		locator.base.groupManagement,
		locator.base.identityKeyCreator,
		mainInterface.syncTracker,
	)

	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()
	const serverDateProvider: DateProvider = {
		now(): number {
			return locator.base.restClient.getServerTimestampMs()
		},
		timeZone(): string {
			throw new ProgrammingError("Not supported")
		},
	}

	locator.eventBusClient = new EventBusClient(
		mainInterface.wsConnectivityListener,
		eventBusCoordinator,
		locator.base.cache as EntityRestCache,
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
}

export async function resetLocator(): Promise<void> {
	await locator.base.login.resetSession()
	await initLocator(locator._worker, locator._browserData, locator._apps)
}

if (typeof self !== "undefined") {
	;(self as unknown as WorkerGlobalScope).locator = locator // export in worker scope
}
