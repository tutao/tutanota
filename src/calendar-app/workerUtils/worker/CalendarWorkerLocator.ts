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
import { lazyAsync, lazyMemoized, noOp } from "@tutao/tutanota-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../../common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacadeSendDispatcher } from "../../../common/native/common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { EntropyFacade } from "../../../common/api/worker/facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../../../common/api/worker/facades/BlobAccessTokenFacade.js"
import { EventBusEventCoordinator } from "../../../common/api/worker/EventBusEventCoordinator.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade.js"
import { Challenge, UserTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
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
import { Credentials } from "../../../common/misc/credentials/Credentials.js"
import { AsymmetricCryptoFacade } from "../../../common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { CryptoWrapper } from "../../../common/api/worker/crypto/CryptoWrapper.js"
import { KeyVerificationFacade } from "../../../common/api/worker/facades/lazy/KeyVerificationFacade"
import { KeyAuthenticationFacade } from "../../../common/api/worker/facades/KeyAuthenticationFacade.js"
import { PublicEncryptionKeyProvider } from "../../../common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { InstancePipeline } from "../../../common/api/worker/crypto/InstancePipeline"
import { ApplicationTypesFacade } from "../../../common/api/worker/facades/ApplicationTypesFacade"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "../../../common/api/worker/facades/Ed25519Facade"
import { ClientModelInfo, ServerModelInfo, TypeModelResolver } from "../../../common/api/common/EntityFunctions"
import { CustomCacheHandlerMap } from "../../../common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { CalendarEventTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { CustomUserCacheHandler } from "../../../common/api/worker/rest/cacheHandler/CustomUserCacheHandler"
import { EphemeralCacheStorage } from "../../../common/api/worker/rest/EphemeralCacheStorage"
import { CustomCalendarEventCacheHandler } from "../../../common/api/worker/rest/cacheHandler/CustomCalendarEventCacheHandler"
import { PatchMerger } from "../../../common/api/worker/offline/PatchMerger"
import { EventInstancePrefetcher } from "../../../common/api/worker/EventInstancePrefetcher"
import { RolloutFacade } from "../../../common/api/worker/facades/RolloutFacade"
import { PublicKeySignatureFacade } from "../../../common/api/worker/facades/PublicKeySignatureFacade"
import { AdminKeyLoaderFacade } from "../../../common/api/worker/facades/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../common/api/worker/facades/lazy/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../common/api/worker/facades/PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase } from "../../../common/api/worker/facades/IdentityKeyTrustDatabase"
import { InstanceSessionKeysCache } from "../../../common/api/worker/facades/InstanceSessionKeysCache"
import { PublicEncryptionKeyCache } from "../../../common/api/worker/facades/PublicEncryptionKeyCache"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"

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

	//contact
	contactFacade: lazyAsync<ContactFacade>

	// drive
	driveFacade: lazyAsync<DriveFacade>
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

	const suspensionHandler = new SuspensionHandler(self, () => {
		mainInterface.infoMessageHandler.onInfoMessage({
			translationKey: "clientSuspensionWait_label",
			args: {},
		})
	})

	const clientModelInfo = ClientModelInfo.getInstance()
	const serverModelInfo = ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, (expectedHash) =>
		locator.applicationTypesFacade.getServerApplicationTypesJson(expectedHash),
	)
	const typeModelResolver = new TypeModelResolver(clientModelInfo, serverModelInfo)
	locator.instancePipeline = new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
	)
	locator.rsa = await createRsaImplementation(worker)

	const domainConfig = new DomainConfigProvider().getCurrentDomainConfig()
	locator.restClient = new RestClient(suspensionHandler, domainConfig, serverModelInfo, String(browserData.clientPlatform))
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
	if (isOfflineStorageAvailable()) {
		locator.sqlCipherFacade = new SqlCipherFacadeSendDispatcher(locator.native)
		offlineStorageProvider = async () => {
			const customCacheHandler = new CustomCacheHandlerMap({
				ref: CalendarEventTypeRef,
				handler: new CustomCalendarEventCacheHandler(entityRestClient, typeModelResolver),
			})

			const { KeyVerificationTableDefinitions } = await import("../../../common/api/worker/facades/IdentityKeyTrustDatabase.js")

			return new OfflineStorage(
				locator.sqlCipherFacade,
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS),
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

	locator.patchMerger = new PatchMerger(locator.cacheStorage, locator.instancePipeline, typeModelResolver, () => locator.crypto)

	locator.cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage, typeModelResolver, locator.patchMerger)

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
		const { KeyVerificationFacade } = await import("../../../common/api/worker/facades/lazy/KeyVerificationFacade.js")
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
		locator.cache as DefaultEntityRestCache,
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
			asymmetricCrypto,
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
	const aesApp = new AesApp(nativeCryptoFacadeSendDispatcher, random)
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
		noOp,
		locator.rolloutFacade,
		locator.groupManagement,
		locator.identityKeyCreator,
		mainInterface.syncTracker,
	)

	const eventInstancePrefetcher = new EventInstancePrefetcher(locator.cache)

	locator.eventBusClient = new EventBusClient(
		eventBusCoordinator,
		locator.cache as EntityRestCache,
		locator.user,
		locator.cachingEntityClient,
		locator.instancePipeline,
		(path) => new WebSocket(getWebsocketBaseUrl(domainConfig) + path),
		new SleepDetector(scheduler, dateProvider),
		mainInterface.progressTracker,
		typeModelResolver,
		locator.crypto,
		eventInstancePrefetcher,
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
