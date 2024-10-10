import { CacheInfo, LoginFacade, LoginListener } from "../../../common/api/worker/facades/LoginFacade.js"
import type { EntityRestInterface } from "../../../common/api/worker/rest/EntityRestClient.js"
import { EntityRestClient } from "../../../common/api/worker/rest/EntityRestClient.js"
import type { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade.js"
import { CacheStorage, DefaultEntityRestCache, EntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import type { GroupManagementFacade } from "../../../common/api/worker/facades/lazy/GroupManagementFacade.js"
import type { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import type { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade.js"
import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import type { CounterFacade } from "../../../common/api/worker/facades/lazy/CounterFacade.js"
import { EventBusClient } from "../../../common/api/worker/EventBusClient.js"
import { assertWorkerOrNode, getWebsocketBaseUrl, isAndroidApp, isBrowser, isIOSApp, isOfflineStorageAvailable } from "../../../common/api/common/Env.js"
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
import { lazyAsync, lazyMemoized, noOp } from "@tutao/tutanota-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../../common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacadeSendDispatcher } from "../../../common/native/common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { EntropyFacade } from "../../../common/api/worker/facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../../../common/api/worker/facades/BlobAccessTokenFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade.js"
import { Challenge } from "../../../common/api/entities/sys/TypeRefs.js"
import { LoginFailReason } from "../../../common/api/main/PageContextLoginListener.js"
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
import { RecoverCodeFacade } from "../../../common/api/worker/facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { CalendarWorkerImpl } from "./CalendarWorkerImpl.js"
import { CalendarOfflineCleaner } from "../offline/CalendarOfflineCleaner.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { Credentials } from "../../../common/misc/credentials/Credentials.js"
import { AsymmetricCryptoFacade } from "../../../common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { CryptoWrapper } from "../../../common/api/worker/crypto/CryptoWrapper.js"

assertWorkerOrNode()

export type CalendarWorkerLocatorType = {
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
	_worker: CalendarWorkerImpl
	_browserData: BrowserData

	//contact
	contactFacade: lazyAsync<ContactFacade>
}
export const locator: CalendarWorkerLocatorType = {} as any

export async function initLocator(worker: CalendarWorkerImpl, browserData: BrowserData) {
	locator._worker = worker
	locator._browserData = browserData
	locator.keyCache = new KeyCache()
	const cryptoWrapper = new CryptoWrapper()
	locator.user = new UserFacade(locator.keyCache, cryptoWrapper)
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

	locator.native = worker
	locator.booking = lazyMemoized(async () => {
		const { BookingFacade } = await import("../../../common/api/worker/facades/lazy/BookingFacade.js")
		return new BookingFacade(locator.serviceExecutor)
	})

	let offlineStorageProvider
	if (isOfflineStorageAvailable()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos),
				new CalendarOfflineCleaner(),
			)
		}
	} else {
		offlineStorageProvider = async () => null
	}
	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(async (error: Error) => {
		await worker.sendError(error)
	}, offlineStorageProvider)

	locator.cacheStorage = maybeUninitializedStorage

	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(worker), new ExportFacadeSendDispatcher(worker))

	locator.cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage)

	locator.cachingEntityClient = new EntityClient(locator.cache)
	const nonCachingEntityClient = new EntityClient(entityRestClient)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, locator.cache as DefaultEntityRestCache)
	})

	if (isIOSApp() || isAndroidApp()) {
		locator.kyberFacade = new NativeKyberFacade(new NativeCryptoFacadeSendDispatcher(worker))
	} else {
		locator.kyberFacade = new WASMKyberFacade()
	}

	locator.pqFacade = new PQFacade(locator.kyberFacade)

	locator.keyLoader = new KeyLoaderFacade(locator.keyCache, locator.user, locator.cachingEntityClient, locator.cacheManagement)

	const asymmetricCrypto = new AsymmetricCryptoFacade(locator.rsa, locator.pqFacade, locator.keyLoader, cryptoWrapper, locator.serviceExecutor)
	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.serviceExecutor,
		locator.instanceMapper,
		new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor),
		locator.cache as DefaultEntityRestCache,
		locator.keyLoader,
		asymmetricCrypto,
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
			asymmetricCrypto,
			cryptoWrapper,
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
		asymmetricCrypto,
	)

	const loginListener: LoginListener = {
		onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
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
	)

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
			asymmetricCrypto,
		)
	})
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = lazyMemoized(async () => {
		const { BlobFacade } = await import("../../../common/api/worker/facades/lazy/BlobFacade.js")
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
			locator.cache as DefaultEntityRestCache,
		)
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
		)
	})
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("../../../common/api/worker/facades/lazy/CalendarFacade.js")
		return new CalendarFacade(
			locator.user,
			await locator.groupManagement(),
			locator.cache as DefaultEntityRestCache,
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
		(queuedBatch: QueuedBatch[]) => noOp,
	)

	locator.eventBusClient = new EventBusClient(
		eventBusCoordinator,
		locator.cache as EntityRestCache,
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
		const { GiftCardFacade } = await import("../../../common/api/worker/facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader)
	})
	locator.contactFacade = lazyMemoized(async () => {
		const { ContactFacade } = await import("../../../common/api/worker/facades/lazy/ContactFacade.js")
		return new ContactFacade(new EntityClient(locator.cache))
	})
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
