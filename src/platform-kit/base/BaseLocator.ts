import { LoginFacade, LoginListener } from "./facades/LoginFacade.js"
import { UserFacade } from "./facades/UserFacade.js"
import { CryptoFacade } from "./crypto/CryptoFacade.js"
import { KeyCache } from "./crypto/persistence/KeyCache.js"
import { CryptoWrapper, random, SYMMETRIC_CIPHER_FACADE } from "../crypto"
import { EntropyFacade } from "./facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "../network/BlobAccessTokenFacade.js"
import { IServiceExecutor } from "../network/ServiceRequest.js"
import { KeyLoaderFacade } from "./crypto/KeyLoaderFacade.js"
import { AdminKeyLoaderFacade } from "./crypto/AdminKeyLoaderFacade.js"
import { KeyRotationFacade } from "./crypto/KeyRotationFacade.js"
import { KeyAuthenticationFacade } from "../network/KeyAuthenticationFacade.js"
import { AsymmetricCryptoFacade } from "./crypto/AsymmetricCryptoFacade.js"
import { DeviceEncryptionFacade } from "./crypto/DeviceEncryptionFacade.js"
import { RolloutFacade } from "./facades/RolloutFacade.js"
import { KyberFacade, NativeKyberFacade, WASMKyberFacade } from "./crypto/KyberFacade.js"
import { PQFacade } from "./crypto/PQFacade.js"
import { Ed25519Facade, NativeEd25519Facade, WASMEd25519Facade } from "./crypto/Ed25519Facade.js"
import { PublicKeySignatureFacade } from "./crypto/PublicKeySignatureFacade.js"
import PublicEncryptionKeyProvider from "./crypto/PublicEncryptionKeyProvider.js"
import { PublicIdentityKeyProvider } from "./crypto/PublicIdentityKeyProvider.js"
import type { IdentityKeyCreator } from "./crypto/IdentityKeyCreator.js"
import { RestClient, restSuspension } from "../rest-client"
import { EntityRestInterface } from "../network/EntityRestCacheInterface.js"
import { EntityClient } from "../network/EntityClient.js"
import { EntityMigrator, EntityRestClient } from "../network/EntityRestClient.js"
import { LastProcessedEventBatchProvider } from "../network/LastProcessedEventBatchProvider.js"
import type { CounterFacade } from "../network/CounterFacade.js"
import type { ShareFacade } from "./facades/lazy/ShareFacade.js"
import type { RecoverCodeFacade } from "./facades/lazy/RecoverCodeFacade.js"
import type { GroupManagementFacade } from "./facades/lazy/GroupManagementFacade.js"
import type { KeyVerificationFacade } from "./facades/lazy/KeyVerificationFacade.js"
import {
	ApplicationTypesFacade,
	InstancePipeline,
	NamedClientModel,
	PatchMerger,
	ServerModelInfo,
	SimpleFileFacade,
	TypeModelResolver,
	UpdateAppTypesHashMiddleware,
} from "../instance-pipeline"
import { lazyAsync, lazyMemoized } from "../utils"
import { RsaImplementation } from "../crypto/encryption/RsaImplementation.js"
import { NoZoneDateProvider } from "../utils/NoZoneDateProvider.js"
import { NativeCryptoFacade } from "@tutao/native-bridge/generatedIpc/types"
import { initClientModels } from "../instance-pipeline/ClientModelInfoInitializer.js"
import { ServiceExecutor } from "../network/ServiceExecutor"
import { isAdminClient, isAndroidApp, isBrowser, isIOSApp } from "@tutao/app-env"
import { PublicEncryptionKeyCache } from "./crypto/persistence/PublicEncryptionKeyCache"
import { InstanceSessionKeysCache } from "./crypto/persistence/InstanceSessionKeysCache.js"
import { Argon2idFacade, WASMArgon2idFacade } from "./crypto/WasmArgon2idFacade"
import { NativeArgon2idFacade } from "./crypto/NativeArgon2idFacade"
import { BrowserData } from "../app-env/boot/ClientConstants"
import { CacheStorageLateInitializer } from "./facades/CacheStorageLateInitializer.js"
import { GetOrPutInstance } from "../instance-pipeline/PatchMerger.js"
import { CacheManager } from "./crypto/persistence/CacheManager.js"
import { IdentityKeyTrustDatabase } from "./crypto/persistence/IdentityKeyTrustDatabase"

export type BaseLocator = {
	cryptoWrapper: CryptoWrapper
	rsa: RsaImplementation
	kyberFacade: KyberFacade
	pqFacade: PQFacade
	ed25519Facade: Ed25519Facade
	publicKeySignatureFacade: PublicKeySignatureFacade
	asymmetricCrypto: AsymmetricCryptoFacade

	keyCache: KeyCache
	keyLoader: KeyLoaderFacade
	adminKeyLoader: AdminKeyLoaderFacade
	keyAuthenticationFacade: KeyAuthenticationFacade
	keyRotation: KeyRotationFacade
	deviceEncryptionFacade: DeviceEncryptionFacade

	publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	publicIdentityKeyProvider: PublicIdentityKeyProvider

	user: UserFacade
	login: LoginFacade
	entropyFacade: EntropyFacade
	rolloutFacade: RolloutFacade
	crypto: CryptoFacade

	counters: lazyAsync<CounterFacade>
	share: lazyAsync<ShareFacade>
	recoverCode: lazyAsync<RecoverCodeFacade>
	groupManagement: lazyAsync<GroupManagementFacade>
	identityKeyCreator: lazyAsync<IdentityKeyCreator>
	keyVerification: lazyAsync<KeyVerificationFacade>

	restClient: RestClient
	suspensionHandler: restSuspension.SuspensionHandler
	serviceExecutor: IServiceExecutor
	blobAccessToken: BlobAccessTokenFacade
	entityMigrator: EntityMigrator
	entityRestClient: EntityRestClient
	instancePipeline: InstancePipeline
	patchMerger: PatchMerger
	applicationTypesFacade: ApplicationTypesFacade
	cache: EntityRestInterface
	cachingEntityClient: EntityClient
	nonCachingEntityClient: EntityClient
	typeModelResolver: TypeModelResolver
	lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider>
}

export type BaseLocatorConfig = {
	worker: {
		sendError(e: Error): Promise<void>
		getMainInterface(): {
			infoMessageHandler: { onInfoMessage(msg: { translationKey: string; args: Record<string, unknown> }): void }
		}
	}
	apps: Array<NamedClientModel>
	browserData: BrowserData
	loginListenerProvider: (user: UserFacade) => LoginListener
	maybeUninitializedStorage: CacheStorageLateInitializer & GetOrPutInstance
	lastProcessedEventBatchStorageFacade: lazyAsync<LastProcessedEventBatchProvider>
	cacheManagement: lazyAsync<CacheManager>
	identityKeyTrustDatabase: IdentityKeyTrustDatabase
	argon2idFacade: Argon2idFacade | null
	domainConfig: DomainConfig
	rsa: RsaImplementation
	fileFacade: SimpleFileFacade
	nativeCryptoFacade: NativeCryptoFacade | null
	entityMigratorFactory: (params: {
		cryptoWrapper: CryptoWrapper
		user: UserFacade
		keyLoader: KeyLoaderFacade
		cachingEntityClient: EntityClient
		serviceExecutor: IServiceExecutor
		typeModelResolver: TypeModelResolver
		instancePipeline: InstancePipeline
		restClient: RestClient
		crypto: CryptoFacade
	}) => EntityMigrator
	entityRestCache: (
		entityRestClient: EntityRestClient,
		patchMerger: PatchMerger,
		typeModelResolver: TypeModelResolver,
		lastProcessed: lazyAsync<LastProcessedEventBatchProvider>,
	) => EntityRestInterface
}

export async function createBaseLocator({
	worker,
	apps,
	browserData,
	loginListenerProvider,
	maybeUninitializedStorage,
	lastProcessedEventBatchStorageFacade,
	cacheManagement,
	identityKeyTrustDatabase,
	argon2idFacade: argon2idFacadeOverride,
	domainConfig,
	rsa,
	fileFacade,
	nativeCryptoFacade,
	entityMigratorFactory,
	entityRestCache,
}: BaseLocatorConfig): Promise<BaseLocator> {
	const keyCache = new KeyCache()
	const cryptoWrapper = new CryptoWrapper()
	const user = new UserFacade(keyCache, cryptoWrapper)

	const dateProvider = new NoZoneDateProvider()
	const mainInterface = worker.getMainInterface()
	const suspensionHandler = new restSuspension.SuspensionHandler(self, () =>
		mainInterface.infoMessageHandler.onInfoMessage({
			translationKey: "clientSuspensionWait_label",
			args: {},
		}),
	)

	const clientModelInfo = initClientModels(apps)

	// Declared before serverModelInfo because it's captured by the lazy callback
	let applicationTypesFacade: ApplicationTypesFacade
	const serverModelInfo = ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, (expectedHash: string | null) =>
		applicationTypesFacade.getServerApplicationTypesJson(expectedHash),
	)
	const typeModelResolver = new TypeModelResolver(clientModelInfo, serverModelInfo)

	// Declared before instancePipeline because it's captured by the lazy callback
	let keyLoader: KeyLoaderFacade
	const instancePipeline = new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
		() => keyLoader,
		SYMMETRIC_CIPHER_FACADE,
	)
	const restClient = new RestClient(suspensionHandler, domainConfig, String(browserData.clientPlatform)).addMiddleware(
		new UpdateAppTypesHashMiddleware(serverModelInfo),
	)

	// Declared before serviceExecutor and entityRestClient because it's captured via lazyCrypto
	let crypto: CryptoFacade
	const lazyCrypto = () => crypto
	const serviceExecutor = new ServiceExecutor(restClient, user, instancePipeline, lazyCrypto, typeModelResolver)
	applicationTypesFacade = new ApplicationTypesFacade(restClient, fileFacade, serverModelInfo)
	const entropyFacade = new EntropyFacade(user, serviceExecutor, random, () => keyLoader)
	const blobAccessToken = new BlobAccessTokenFacade(serviceExecutor, user, dateProvider, typeModelResolver)

	// Declared before entityRestClient because it's captured by the lazy callback
	let entityMigrator: EntityMigrator
	const entityRestClient = new EntityRestClient(
		user,
		restClient,
		lazyCrypto,
		instancePipeline,
		blobAccessToken,
		typeModelResolver,
		lazyCrypto,
		() => entityMigrator,
	)

	const patchMerger = new PatchMerger(maybeUninitializedStorage, instancePipeline, typeModelResolver, lazyCrypto, SYMMETRIC_CIPHER_FACADE)

	const cache: EntityRestInterface = isAdminClient()
		? entityRestClient
		: entityRestCache(entityRestClient, patchMerger, typeModelResolver, lastProcessedEventBatchStorageFacade)

	const cachingEntityClient = new EntityClient(cache, typeModelResolver)
	const nonCachingEntityClient = new EntityClient(entityRestClient, typeModelResolver)

	let kyberFacade: KyberFacade
	let ed25519Facade: Ed25519Facade
	if (nativeCryptoFacade != null && (isIOSApp() || isAndroidApp())) {
		kyberFacade = new NativeKyberFacade(nativeCryptoFacade)
		ed25519Facade = new NativeEd25519Facade(nativeCryptoFacade)
	} else {
		kyberFacade = new WASMKyberFacade()
		ed25519Facade = new WASMEd25519Facade()
	}

	const pqFacade = new PQFacade(kyberFacade)
	const publicKeySignatureFacade = new PublicKeySignatureFacade(ed25519Facade, cryptoWrapper)
	const keyAuthenticationFacade = new KeyAuthenticationFacade(cryptoWrapper)
	keyLoader = new KeyLoaderFacade(keyCache, user, cachingEntityClient, cacheManagement, cryptoWrapper)

	const publicIdentityKeyProvider = new PublicIdentityKeyProvider(
		serviceExecutor,
		cachingEntityClient,
		keyAuthenticationFacade,
		keyLoader,
		identityKeyTrustDatabase,
	)

	const keyVerification = lazyMemoized(async () => {
		const { KeyVerificationFacade } = await import("./facades/lazy/KeyVerificationFacade.js")
		return new KeyVerificationFacade(publicKeySignatureFacade, publicIdentityKeyProvider, identityKeyTrustDatabase)
	})

	const publicEncryptionKeyCache = new PublicEncryptionKeyCache()
	const publicEncryptionKeyProvider = new PublicEncryptionKeyProvider(serviceExecutor, keyVerification, publicEncryptionKeyCache)

	// Declared before asymmetricCrypto because it's captured by the lazy callback
	let adminKeyLoader: AdminKeyLoaderFacade
	const asymmetricCrypto = new AsymmetricCryptoFacade(
		rsa,
		pqFacade,
		keyLoader,
		cryptoWrapper,
		serviceExecutor,
		publicEncryptionKeyProvider,
		() => adminKeyLoader,
	)
	adminKeyLoader = new AdminKeyLoaderFacade(user, cachingEntityClient, keyLoader, cacheManagement, asymmetricCrypto, cryptoWrapper, keyAuthenticationFacade)

	// Declared before crypto because it's captured by the lazy callback inside CryptoFacade
	let keyRotation: KeyRotationFacade
	crypto = new CryptoFacade(
		user,
		cachingEntityClient,
		restClient,
		serviceExecutor,
		instancePipeline,
		cacheManagement,
		keyLoader,
		asymmetricCrypto,
		publicEncryptionKeyProvider,
		new InstanceSessionKeysCache(),
		cryptoWrapper,
		lazyMemoized(() => keyRotation),
		typeModelResolver,
		async (error: Error) => {
			await worker.sendError(error)
		},
	)

	// Declared before recoverCode because it's captured inside the lazy callback
	let login: LoginFacade
	const recoverCode = lazyMemoized(async () => {
		const { RecoverCodeFacade } = await import("./facades/lazy/RecoverCodeFacade.js")
		return new RecoverCodeFacade(user, cachingEntityClient, login, keyLoader)
	})
	const share = lazyMemoized(async () => {
		const { ShareFacade } = await import("./facades/lazy/ShareFacade.js")
		return new ShareFacade(user, crypto, serviceExecutor, cachingEntityClient, keyLoader)
	})
	const counters = lazyMemoized(async () => {
		const { CounterFacade } = await import("../network/CounterFacade.js")
		return new CounterFacade(serviceExecutor)
	})
	const identityKeyCreator = lazyMemoized(async () => {
		const { IdentityKeyCreator } = await import("./crypto/IdentityKeyCreator.js")
		return new IdentityKeyCreator(
			user,
			cachingEntityClient,
			serviceExecutor,
			keyLoader,
			adminKeyLoader,
			await cacheManagement(),
			asymmetricCrypto,
			cryptoWrapper,
			keyAuthenticationFacade,
			ed25519Facade,
			publicKeySignatureFacade,
		)
	})
	const groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("./facades/lazy/GroupManagementFacade.js")
		return new GroupManagementFacade(
			user,
			await counters(),
			cachingEntityClient,
			serviceExecutor,
			pqFacade,
			keyLoader,
			adminKeyLoader,
			await cacheManagement(),
			cryptoWrapper,
			await identityKeyCreator(),
		)
	})

	keyRotation = new KeyRotationFacade(
		cachingEntityClient,
		keyLoader,
		pqFacade,
		serviceExecutor,
		cryptoWrapper,
		recoverCode,
		user,
		crypto,
		share,
		groupManagement,
		asymmetricCrypto,
		keyAuthenticationFacade,
		publicEncryptionKeyProvider,
		publicKeySignatureFacade,
		adminKeyLoader,
	)

	const rolloutFacade = new RolloutFacade(serviceExecutor, async (error: Error) => {
		await worker.sendError(error)
	})

	let argon2idFacade: Argon2idFacade
	if (argon2idFacadeOverride != null) {
		argon2idFacade = argon2idFacadeOverride
	} else if (nativeCryptoFacade != null && !isBrowser()) {
		argon2idFacade = new NativeArgon2idFacade(nativeCryptoFacade)
	} else {
		argon2idFacade = new WASMArgon2idFacade()
	}

	const deviceEncryptionFacade = new DeviceEncryptionFacade()
	const { DatabaseKeyFactory } = await import("./crypto/DatabaseKeyFactory.js")

	entityMigrator = entityMigratorFactory({
		cryptoWrapper,
		user,
		keyLoader,
		cachingEntityClient,
		serviceExecutor,
		typeModelResolver,
		instancePipeline,
		restClient,
		crypto,
	})

	login = new LoginFacade(
		restClient,
		new EntityClient(cache, typeModelResolver),
		loginListenerProvider(user),
		instancePipeline,
		crypto,
		keyRotation,
		maybeUninitializedStorage,
		serviceExecutor,
		user,
		blobAccessToken,
		entropyFacade,
		new DatabaseKeyFactory(deviceEncryptionFacade),
		argon2idFacade,
		nonCachingEntityClient,
		async (error: Error) => {
			await worker.sendError(error)
		},
		cacheManagement,
		typeModelResolver,
		rolloutFacade,
		applicationTypesFacade,
		entityMigrator,
	)

	return {
		cryptoWrapper,
		rsa,
		kyberFacade,
		pqFacade,
		ed25519Facade,
		publicKeySignatureFacade,
		asymmetricCrypto,
		keyCache,
		keyLoader,
		adminKeyLoader,
		keyAuthenticationFacade,
		keyRotation,
		deviceEncryptionFacade,
		publicEncryptionKeyProvider,
		publicIdentityKeyProvider,
		user,
		login,
		entropyFacade,
		rolloutFacade,
		crypto,
		counters,
		share,
		recoverCode,
		groupManagement,
		identityKeyCreator,
		keyVerification,
		restClient,
		suspensionHandler,
		serviceExecutor,
		blobAccessToken,
		entityMigrator,
		entityRestClient,
		instancePipeline,
		patchMerger,
		applicationTypesFacade,
		cache,
		cachingEntityClient,
		nonCachingEntityClient,
		typeModelResolver,
		lastProcessedEventBatchStorageFacade,
	}
}
