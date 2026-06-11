import type { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade.js"
import {
	assertWorkerOrNode,
	Const,
	getWebsocketBaseUrl,
	isAndroidApp,
	isBrowser,
	isIOSApp,
	isOfflineStorageAvailable,
	Mode,
	ProgrammingError,
	SessionType,
} from "../../../../platform-kit/app-env"
import { RestClient, restSuspension } from "../../../../platform-kit/rest-client"
import type { GiftCardFacade } from "../../../common/api/worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { SleepDetector } from "../../../common/api/worker/utils/SleepDetector.js"
import { SchedulerImpl } from "../../../common/api/common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../../../common/api/common/utils/NoZoneDateProvider.js"
import type { BookingFacade } from "../../../common/api/worker/facades/lazy/BookingFacade.js"
import type { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade.js"
import { DateProvider, lazyAsync, lazyMemoized, noOp } from "../../../../platform-kit/utils"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider.js"
import { PdfWriter } from "../../../common/api/worker/pdf/PdfWriter.js"
import { CacheManagementFacade } from "../../../common/api/worker/facades/lazy/CacheManagementFacade.js"
import {
	ApplicationTypesFacade,
	InstancePipeline,
	NamedClientModel,
	PatchMerger,
	ServerModelInfo,
	TypeModelResolver,
	UpdateAppTypesHashMiddleware,
} from "../../../../platform-kit/instance-pipeline"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import {
	NoOpLastProcessedEventBatchStorageFacade,
	OfflineStorageLastProcessedEventBatchStorageFacade,
} from "../../../common/api/worker/LastProcessedEventBatchStorageFacade"
import { DriveWorkerImpl } from "./DriveWorkerImpl"
import { DriveOfflineCleanerStub } from "../offline/DriveOfflineCleanerStub"
import { CacheInfo, LoginFacade, LoginFailReason, LoginListener } from "../../../../platform-kit/base/facades/LoginFacade"
import { IServiceExecutor } from "../../../../platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { EntityRestCache, EntityRestInterface } from "../../../../platform-kit/network/EntityRestCacheInterface"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EventBusClient } from "../../../../platform-kit/network/EventBusClient"
import { createRsaImplementation, RsaImplementation } from "../../../../app-kit/native-bridge/worker/RsaImplementation"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "../../../../platform-kit/base/base-crypto/KyberFacade"
import { PQFacade } from "../../../../platform-kit/base/base-crypto/PQFacade"
import { EntropyFacade } from "../../../../platform-kit/base/facades/EntropyFacade"
import { BlobAccessTokenFacade } from "../../../../platform-kit/network/BlobAccessTokenFacade"
import { KeyCache } from "../../../../app-kit/local-store/KeyCache"
import { KeyLoaderFacade } from "../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { AdminKeyLoaderFacade } from "../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { KeyAuthenticationFacade } from "../../../../platform-kit/network/KeyAuthenticationFacade"
import PublicEncryptionKeyProvider from "../../../../platform-kit/base/base-crypto/PublicEncryptionKeyProvider"
import { PublicIdentityKeyProvider } from "../../../../platform-kit/base/base-crypto/PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase, KeyVerificationTableDefinitions } from "../../../../app-kit/local-store/IdentityKeyTrustDatabase"
import { KeyRotationFacade } from "../../../../platform-kit/base/base-crypto/KeyRotationFacade"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "../../../../platform-kit/base/base-crypto/Ed25519Facade"
import { PublicKeySignatureFacade } from "../../../../platform-kit/base/base-crypto/PublicKeySignatureFacade"
import { RolloutFacade } from "../../../../platform-kit/base/facades/RolloutFacade"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"
import { CounterFacade } from "../../../../platform-kit/network/CounterFacade"
import { GroupManagementFacade } from "../../../../platform-kit/base/facades/lazy/GroupManagementFacade"
import { IdentityKeyCreator } from "../../../../platform-kit/base/base-crypto/IdentityKeyCreator"
import { RecoverCodeFacade } from "../../../../platform-kit/base/facades/lazy/RecoverCodeFacade"
import { ShareFacade } from "../../../../platform-kit/base/facades/lazy/ShareFacade"
import { KeyVerificationFacade } from "../../../../platform-kit/base/facades/lazy/KeyVerificationFacade"
import { DeviceEncryptionFacade } from "../../../../platform-kit/base/base-crypto/DeviceEncryptionFacade"
import { NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { initClientModels } from "../../../common/api/common/ClientModelInfoInitializer"
import { ServiceExecutor } from "../../../../platform-kit/network/ServiceExecutor"
import { EntityRestClient } from "../../../../platform-kit/network/EntityRestClient"
import {
	ExportFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacadeSendDispatcher,
	NativeCryptoFacadeSendDispatcher,
	SqlCipherFacadeSendDispatcher,
} from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp"
import { CustomCacheHandlerMap } from "../../../../app-kit/local-store/CustomCacheHandler"
import { Challenge, UserTypeRef } from "@tutao/entities/sys"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/CustomUserCacheHandler"
import { EphemeralCacheStorage } from "../../../../app-kit/local-store/EphemeralCacheStorage"
import { LateInitializedCacheStorageImpl } from "../../../../app-kit/local-store/CacheStorageProxy"
import { DefaultEntityRestCache } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { PublicEncryptionKeyCache } from "../../../../app-kit/local-store/PublicEncryptionKeyCache"
import { AsymmetricCryptoFacade } from "../../../../platform-kit/base/base-crypto/AsymmetricCryptoFacade"
import { InstanceSessionKeysCache } from "../../../../app-kit/local-store/InstanceSessionKeysCache"
import { CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { CustomCalendarEventCacheHandler } from "../../../calendar-app/workerUtils/worker/CustomCalendarEventCacheHandler"
import { OfflineStorage } from "../../../../app-kit/local-store/OfflineStorage"
import { createOfflineStorageMigrations, OfflineStorageMigrator } from "../../../../app-kit/local-store/OfflineStorageMigrator"

import { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { Argon2idFacade, WASMArgon2idFacade } from "../../../../platform-kit/base/base-crypto/WasmArgon2idFacade"
import { NativeArgon2idFacade } from "../../../../platform-kit/base/base-crypto/NativeArgon2idFacade"
import { Credentials } from "../../../../platform-kit/network/types"
import { AesApp } from "../../../../app-kit/native-bridge/worker/AesApp"
import { ProgressMonitorDelegate } from "../../../common/api/worker/ProgressMonitorDelegate"
import { LastProcessedEventBatchProvider } from "../../../../platform-kit/network/LastProcessedEventBatchProvider"
import { BrowserData } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { CryptoWrapper, random, SYMMETRIC_CIPHER_FACADE } from "@tutao/crypto"
import { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade"

assertWorkerOrNode()

export type DriveWorkerLocatorType = {
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
	counters: lazyAsync<CounterFacade>
	Const: Record<string, any>

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
	_worker: DriveWorkerImpl
	_browserData: BrowserData
	_apps: Array<NamedClientModel>

	// drive
	driveFacade: lazyAsync<DriveFacade>

	lastProcessedEventBatchProvider: lazyAsync<LastProcessedEventBatchProvider>
}
export const locator: DriveWorkerLocatorType = {} as any

export async function initLocator(worker: DriveWorkerImpl, browserData: BrowserData, apps: Array<NamedClientModel>) {
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
	const entityRestClient = new EntityRestClient(
		locator.user,
		locator.restClient,
		() => locator.crypto,
		locator.instancePipeline,
		locator.blobAccessToken,
		typeModelResolver,
		() => locator.crypto,
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
	if (!isBrowser() && !(env.mode === Mode.Admin)) {
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
				new DriveOfflineCleanerStub(),
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

	locator.lastProcessedEventBatchProvider = lazyMemoized(async () => {
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
		locator.lastProcessedEventBatchProvider,
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
		const { KeyVerificationFacade } = await import("../../../../platform-kit/base/facades/lazy/KeyVerificationFacade")
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
		const { CounterFacade } = await import("../../../../platform-kit/network/CounterFacade")
		return new CounterFacade(locator.serviceExecutor)
	})

	locator.identityKeyCreator = lazyMemoized(async () => {
		const { IdentityKeyCreator } = await import("../../../../platform-kit/base/base-crypto/IdentityKeyCreator")
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
	const { DatabaseKeyFactory } = await import("../../../../platform-kit/base/base-crypto/DatabaseKeyFactory")

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

	const eventBusCoordinator = new EventBusEventCoordinator(
		null,
		null,
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
		locator.lastProcessedEventBatchProvider,
		serverDateProvider,
		(totalWork) => new ProgressMonitorDelegate(mainInterface.progressTracker, totalWork),
	)
	locator.login.init(locator.eventBusClient)
	locator.Const = Const
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("../../../common/api/worker/facades/lazy/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto, locator.keyLoader)
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
			locator.cacheStorage,
		)
	})
}

export async function resetLocator(): Promise<void> {
	await locator.login.resetSession()
	await initLocator(locator._worker, locator._browserData, locator._apps)
}

if (typeof self !== "undefined") {
	;(self as unknown as WorkerGlobalScope).locator = locator // export in worker scope
}
