import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import { assertWorkerOrNode, Const, getWebsocketBaseUrl, isBrowser, isOfflineStorageAvailable, Mode, ProgrammingError } from "../../../../platform-kit/app-env"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../../platform-kit/utils/NoZoneDateProvider.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { DateProvider, lazyAsync, lazyMemoized, noOp } from "../../../../platform-kit/utils"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { DriveWorkerImpl } from "./DriveWorkerImpl"
import { DriveOfflineCleanerStub } from "../offline/DriveOfflineCleanerStub"
import { KeyVerificationTableDefinitions, LocalIdentityKeyTrustDatabase } from "../../../../app-kit/local-store/LocalIdentityKeyTrustDatabase"
import { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import {
	ExportFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacadeSendDispatcher,
	NativeCryptoFacadeSendDispatcher,
	SqlCipherFacadeSendDispatcher,
} from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { UserTypeRef } from "@tutao/entities/sys"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy"
import { DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { CustomCalendarEventCacheHandler } from "../../../calendar-app/workerUtils/worker/CustomCalendarEventCacheHandler"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp"
import { ProgressMonitorDelegate } from "../../../common/api/worker/ProgressMonitorDelegate"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { NamedClientModel } from "../../../../platform-kit/instance-pipeline"
import { EntityRestCache } from "../../../../platform-kit/network/EntityRestCacheInterface"
import { EventBusClient } from "../../../../app-kit/local-store/event/EventBusClient"
import { DefaultLoginListener } from "../../../common/misc/DefaultLoginListener"
import { BaseLocator } from "../../../../platform-kit/base/BaseLocator.js"
import { createBaseLocator } from "../../../../platform-kit/base/BaseLocator"
import { createRsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { TutanotaEntityMigrator } from "../../../common/misc/TutanotaEntityMigrator.js"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"
import { OfflineMapper } from "../../../../platform-kit/instance-pipeline/OfflineMapper"

assertWorkerOrNode()

export type DriveWorkerLocatorType = {
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
	Const: Record<string, any>

	// Management facades
	userManagement: lazyAsync<UserManagementFacade>
	customer: lazyAsync<CustomerFacade>
	giftCards: lazyAsync<GiftCardFacade>
	booking: lazyAsync<BookingFacade>
	cacheManagement: lazyAsync<CacheManagementFacade>

	// Misc facades
	configFacade: lazyAsync<ConfigurationDatabase>
	pdfWriter: lazyAsync<PdfWriter>

	// Meta
	_worker: DriveWorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>

	// Drive
	driveFacade: lazyAsync<DriveFacade>
}
export const locator: DriveWorkerLocatorType = {} as any

export async function initLocator(worker: DriveWorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
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

	if (!isBrowser() && !(env.mode === Mode.Admin)) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
	}

	// offlineStorageProvider and ephemeralStorageProvider reference locator.base.* lazily — only called during login init
	let offlineStorageProvider: () => Promise<OfflineStorage | null>
	if (!isBrowser() && !(env.mode === Mode.Admin)) {
		offlineStorageProvider = async () => {
			const customCacheHandler = new CustomCacheHandlerMap({
				ref: CalendarEventTypeRef,
				handler: new CustomCalendarEventCacheHandler(locator.base.entityRestClient, locator.base.typeModelResolver),
			})
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(createOfflineStorageMigrations(locator.sqlCipherFacade, locator.base.applicationTypesFacade)),
				new DriveOfflineCleanerStub(),
				locator.base.instancePipeline.modelMapper,
				locator.base.typeModelResolver,
				new OfflineMapper(locator.base.typeModelResolver),
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
		)
	})

	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("../../../common/api/worker/facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.base.keyLoader, locator.base.user)
	})

	const eventBusCoordinator = new EventBusEventCoordinator(
		null,
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
