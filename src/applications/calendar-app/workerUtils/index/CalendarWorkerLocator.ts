import { CacheInfo, LoginFacade, LoginFailReason, LoginListener } from "../../../../platform-kit/base/facades/LoginFacade.js"
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
	ProgrammingError,
	SessionType,
} from "../../../../platform-kit/app-env"
import type { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import type { ShareFacade } from "../../../../platform-kit/base/facades/lazy/ShareFacade.js"
import { RestClient, restSuspension } from "../../../../platform-kit/rest-client"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { DeviceEncryptionFacade } from "../../../../platform-kit/base/base-crypto/DeviceEncryptionFacade.js"
import type { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface.js"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp.js"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp.js"
import type { RsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { createRsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation.js"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../common/api/common/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy.js"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade.js"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage.js"
import { InstanceSessionKeysCache } from "../../../../app-kit/local-store/InstanceSessionKeysCache.js"
import { KeyCache } from "../../../../app-kit/local-store/KeyCache.js"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator.js"
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
import { EntropyFacade } from "../../../../platform-kit/base/facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../../../../platform-kit/network/BlobAccessTokenFacade.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { NativeArgon2idFacade } from "../../../../platform-kit/base/base-crypto/NativeArgon2idFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "../../../../platform-kit/base/base-crypto/KyberFacade.js"
import { PQFacade } from "../../../../platform-kit/base/base-crypto/PQFacade.js"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { ContactFacade } from "../../../common/api/worker/facades/lazy/ContactFacade.js"
import { KeyLoaderFacade } from "../../../../platform-kit/base/base-crypto/KeyLoaderFacade.js"
import { KeyRotationFacade } from "../../../../platform-kit/base/base-crypto/KeyRotationFacade.js"
import { RecoverCodeFacade } from "../../../../platform-kit/base/facades/lazy/RecoverCodeFacade.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import { CalendarWorkerImpl } from "../worker/CalendarWorkerImpl.js"
import { CalendarOfflineCleaner } from "../offline/CalendarOfflineCleaner.js"
import { AsymmetricCryptoFacade } from "../../../../platform-kit/base/base-crypto/AsymmetricCryptoFacade.js"
import {
	ApplicationTypesFacade,
	InstancePipeline,
	NamedClientModel,
	PatchMerger,
	ServerModelInfo,
	TypeModelResolver,
	UpdateAppTypesHashMiddleware,
} from "../../../../platform-kit/instance-pipeline"
import { KeyVerificationFacade } from "../../../../platform-kit/base/facades/lazy/KeyVerificationFacade"
import PublicEncryptionKeyProvider from "../../../../platform-kit/base/base-crypto/PublicEncryptionKeyProvider.js"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "../../../../platform-kit/base/base-crypto/Ed25519Facade"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage"
import { CustomCalendarEventCacheHandler } from "../worker/CustomCalendarEventCacheHandler"
import { RolloutFacade } from "../../../../platform-kit/base/facades/RolloutFacade"
import { PublicKeySignatureFacade } from "../../../../platform-kit/base/base-crypto/PublicKeySignatureFacade"
import { AdminKeyLoaderFacade } from "../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../../platform-kit/base/base-crypto/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../../platform-kit/base/base-crypto/PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase, KeyVerificationTableDefinitions } from "../../../../app-kit/local-store/IdentityKeyTrustDatabase"
import { PublicEncryptionKeyCache } from "../../../../app-kit/local-store/PublicEncryptionKeyCache"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { EntityRestCache, EntityRestInterface } from "../../../../platform-kit/network/EntityRestCacheInterface"
import { Argon2idFacade, WASMArgon2idFacade } from "../../../../platform-kit/base/base-crypto/WasmArgon2idFacade"
import { EntityRestClient } from "../../../../platform-kit/network/EntityRestClient"
import { KeyAuthenticationFacade } from "../../../../platform-kit/network/KeyAuthenticationFacade"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { ServiceExecutor } from "../../../../platform-kit/network/ServiceExecutor"
import { Credentials } from "../../../../platform-kit/network/types"
import { CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { Challenge, UserTypeRef } from "@tutao/entities/sys"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"
import { AlarmFacade } from "../../../common/api/worker/facades/lazy/AlarmFacade"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { CryptoWrapper, random, SYMMETRIC_CIPHER_FACADE } from "@tutao/crypto"

assertWorkerOrNode()

export type CalendarWorkerLocatorType = {
	// network & encryption
	restClient: RestClient
	serviceExecutor: IServiceExecutor
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
	keyAuthenticationFacade: KeyAuthenticationFacade
	publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	publicIdentityKeyProvider: PublicIdentityKeyProvider
	identityKeyTrustDatabase: IdentityKeyTrustDatabase
	keyRotation: KeyRotationFacade
	ed25519Facade: Ed25519Facade
	publicKeySignatureFacade: PublicKeySignatureFacade
	cryptoWrapper: CryptoWrapper
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

	// used to cache between resets
	_worker: CalendarWorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>

	//contact
	contactFacade: lazyAsync<ContactFacade>

	// drive
	driveFacade: lazyAsync<DriveFacade>

	lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider>
}
export const locator: CalendarWorkerLocatorType = {} as any

export async function initLocator(worker: CalendarWorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
	locator._worker = worker
	locator._browserData = browserData
	locator._apps = apps
	locator.keyCache = new KeyCache()
	const cryptoWrapper = new CryptoWrapper()
	locator.user = new UserFacade(locator.keyCache, cryptoWrapper)
	locator.workerFacade = new WorkerFacade()
	const dateProvider = new NoZoneDateProvider()

	const mainInterface = worker.getMainInterface()

	const suspensionHandler = new restSuspension.SuspensionHandler(self, () => {
		mainInterface.infoMessageHandler.onInfoMessage({
			translationKey: "clientSuspensionWait_label",
			args: {},
		})
	})

	const clientModelInfo = initClientModels(apps)
	const serverModelInfo = ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, (expectedHash) =>
		locator.applicationTypesFacade.getServerApplicationTypesJson(expectedHash),
	)
	const typeModelResolver = new TypeModelResolver(clientModelInfo, serverModelInfo)
	locator.instancePipeline = new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
		() => locator.keyLoader,
		SYMMETRIC_CIPHER_FACADE,
	)
	locator.rsa = await createRsaImplementation(worker)

	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()
	locator.restClient = new RestClient(suspensionHandler, domainConfig, String(browserData.clientPlatform)).addMiddleware(
		new UpdateAppTypesHashMiddleware(serverModelInfo),
	)
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instancePipeline, () => locator.crypto, typeModelResolver)
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

	const fileFacadeSendDispatcher = new FileFacadeSendDispatcher(worker)
	const fileApp = new NativeFileApp(fileFacadeSendDispatcher, new ExportFacadeSendDispatcher(worker))
	locator.applicationTypesFacade = new ApplicationTypesFacade(locator.restClient, fileFacadeSendDispatcher, serverModelInfo)

	let offlineStorageProvider
	if (!isBrowser() && !isAdminClient()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			const customCacheHandler = new CustomCacheHandlerMap({
				ref: CalendarEventTypeRef,
				handler: new CustomCalendarEventCacheHandler(entityRestClient, typeModelResolver),
			})

			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(createOfflineStorageMigrations(locator.sqlCipherFacade, locator.applicationTypesFacade)),
				new CalendarOfflineCleaner(),
				locator.instancePipeline.modelMapper,
				typeModelResolver,
				customCacheHandler,
				KeyVerificationTableDefinitions,
			)
		}
	} else {
		offlineStorageProvider = async () => null
	}
	locator.pdfWriter = async () => {
		const { PdfWriter } = await import("../../../common/api/worker/pdf/PdfWriter.js")
		return new PdfWriter(new TextEncoder(), undefined)
	}

	const ephemeralStorageProvider = async () => {
		const customCacheHandler = new CustomCacheHandlerMap({
			ref: UserTypeRef,
			handler: new CustomUserCacheHandler(locator.cacheStorage),
		})
		return new EphemeralCacheStorage(locator.instancePipeline.modelMapper, typeModelResolver, customCacheHandler)
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		async (error: Error) => {
			await worker.sendError(error)
		},
		ephemeralStorageProvider,
		offlineStorageProvider,
	)

	locator.cacheStorage = maybeUninitializedStorage

	locator.patchMerger = new PatchMerger(locator.cacheStorage, locator.instancePipeline, typeModelResolver, () => locator.crypto, SYMMETRIC_CIPHER_FACADE)

	locator.lastProcessedEventBatchStorageFacade = lazyMemoized(async () => {
		if (isOfflineStorageAvailable()) {
			return new OfflineStorageLastProcessedEventBatchStorageFacade(locator.sqlCipherFacade)
		} else {
			return new NoOpLastProcessedEventBatchStorageFacade()
		}
	})

	locator.cache = new DefaultEntityRestCache(
		entityRestClient,
		maybeUninitializedStorage,
		typeModelResolver,
		locator.patchMerger,
		locator.lastProcessedEventBatchStorageFacade,
	)

	locator.cachingEntityClient = new EntityClient(locator.cache, typeModelResolver)
	const nonCachingEntityClient = new EntityClient(entityRestClient, typeModelResolver)

	locator.cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../../common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(locator.user, locator.cachingEntityClient, locator.cache as DefaultEntityRestCache)
	})

	const nativeCryptoFacadeSendDispatcher = new NativeCryptoFacadeSendDispatcher(worker)
	if (isIOSApp() || isAndroidApp()) {
		locator.kyberFacade = new NativeKyberFacade(nativeCryptoFacadeSendDispatcher)
		locator.ed25519Facade = new NativeEd25519Facade(nativeCryptoFacadeSendDispatcher)
	} else {
		locator.kyberFacade = new WASMKyberFacade()
		locator.ed25519Facade = new WASMEd25519Facade()
	}

	locator.pqFacade = new PQFacade(locator.kyberFacade)

	locator.cryptoWrapper = new CryptoWrapper()

	locator.publicKeySignatureFacade = new PublicKeySignatureFacade(locator.ed25519Facade, locator.cryptoWrapper)

	locator.keyAuthenticationFacade = new KeyAuthenticationFacade(cryptoWrapper)
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

	const asymmetricCrypto = new AsymmetricCryptoFacade(
		locator.rsa,
		locator.pqFacade,
		locator.keyLoader,
		cryptoWrapper,
		locator.serviceExecutor,
		locator.publicEncryptionKeyProvider,
		adminKeyLoaderProvider,
	)
	locator.adminKeyLoader = new AdminKeyLoaderFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.keyLoader,
		locator.cacheManagement,
		asymmetricCrypto,
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
		asymmetricCrypto,
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
		const { IdentityKeyCreator } = await import("../../../../platform-kit/base/base-crypto/IdentityKeyCreator.js")
		return new IdentityKeyCreator(
			locator.user,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.keyLoader,
			locator.adminKeyLoader,
			await locator.cacheManagement(),
			asymmetricCrypto,
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
			cryptoWrapper,
			await locator.identityKeyCreator(),
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
		locator.keyAuthenticationFacade,
		locator.publicEncryptionKeyProvider,
		locator.publicKeySignatureFacade,
		locator.adminKeyLoader,
	)
	locator.rolloutFacade = new RolloutFacade(locator.serviceExecutor, async (error: Error) => {
		await worker.sendError(error)
	})

	const loginListener: LoginListener = {
		async onPartialLoginSuccess(_sessionType: SessionType, _cacheInfo: CacheInfo, _credentials: Credentials): Promise<void> {
			// no-op
		},
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
		argon2idFacade = new NativeArgon2idFacade(nativeCryptoFacadeSendDispatcher)
	} else {
		argon2idFacade = new WASMArgon2idFacade()
	}

	locator.deviceEncryptionFacade = new DeviceEncryptionFacade()
	const { DatabaseKeyFactory } = await import("../../../../platform-kit/base/base-crypto/DatabaseKeyFactory.js")

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
			asymmetricCrypto,
			locator.publicEncryptionKeyProvider,
			locator.cryptoWrapper,
		)
	})
	const aesApp = new AesApp(nativeCryptoFacadeSendDispatcher)
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
			typeModelResolver,
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
			nonCachingEntityClient, // without cache,
			dateProvider,
		)
	})
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	locator.configFacade = lazyMemoized(async () => {
		const { ConfigurationDatabase } = await import("../../../common/api/worker/facades/lazy/ConfigurationDatabase.js")
		return new ConfigurationDatabase(locator.keyLoader, locator.user)
	})

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
		noOp,
		locator.rolloutFacade,
		locator.groupManagement,
		locator.identityKeyCreator,
		mainInterface.syncTracker,
	)

	const serverDateProvider: DateProvider = {
		now(): number {
			return locator.restClient.getServerTimestampMs()
		},
		timeZone(): string {
			throw new ProgrammingError("Not supported")
		},
	}

	locator.eventBusClient = new EventBusClient(
		mainInterface.wsConnectivityListener,
		eventBusCoordinator,
		locator.cache as EntityRestCache,
		locator.user,
		locator.instancePipeline,
		(path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path),
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
