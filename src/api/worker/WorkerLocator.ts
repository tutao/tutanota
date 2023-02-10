import { CacheInfo, LoginFacade, LoginListener } from "./facades/LoginFacade"
import type { WorkerImpl } from "./WorkerImpl"
import type { Indexer } from "./search/Indexer"
import type { EntityRestInterface } from "./rest/EntityRestClient"
import { EntityRestClient } from "./rest/EntityRestClient"
import { UserManagementFacade } from "./facades/UserManagementFacade"
import { CacheStorage, DefaultEntityRestCache } from "./rest/DefaultEntityRestCache.js"
import { GroupManagementFacade } from "./facades/GroupManagementFacade"
import { MailFacade } from "./facades/MailFacade"
import { MailAddressFacade } from "./facades/MailAddressFacade"
import { FileFacade } from "./facades/FileFacade"
import { CustomerFacade } from "./facades/CustomerFacade"
import { CounterFacade } from "./facades/CounterFacade"
import { EventBusClient } from "./EventBusClient"
import { assertWorkerOrNode, getWebsocketOrigin, isAdminClient, isOfflineStorageAvailable, isTest } from "../common/Env"
import { Const } from "../common/TutanotaConstants"
import type { BrowserData } from "../../misc/ClientConstants"
import { CalendarFacade } from "./facades/CalendarFacade"
import { ShareFacade } from "./facades/ShareFacade"
import { RestClient } from "./rest/RestClient"
import { SuspensionHandler } from "./SuspensionHandler"
import { EntityClient } from "../common/EntityClient"
import { GiftCardFacade } from "./facades/GiftCardFacade"
import { ConfigurationDatabase } from "./facades/ConfigurationDatabase"
import { ContactFormFacade } from "./facades/ContactFormFacade"
import { DeviceEncryptionFacade } from "./facades/DeviceEncryptionFacade"
import type { NativeInterface } from "../../native/common/NativeInterface"
import { NativeFileApp } from "../../native/common/FileApp"
import { AesApp } from "../../native/worker/AesApp"
import type { RsaImplementation } from "./crypto/RsaImplementation"
import { createRsaImplementation } from "./crypto/RsaImplementation"
import { CryptoFacade } from "./crypto/CryptoFacade"
import { InstanceMapper } from "./crypto/InstanceMapper"
import { AdminClientDummyEntityRestCache } from "./rest/AdminClientDummyEntityRestCache.js"
import { SleepDetector } from "./utils/SleepDetector.js"
import { SchedulerImpl } from "../common/utils/Scheduler.js"
import { NoZoneDateProvider } from "../common/utils/NoZoneDateProvider.js"
import { LateInitializedCacheStorageImpl } from "./rest/CacheStorageProxy"
import { IServiceExecutor } from "../common/ServiceRequest"
import { ServiceExecutor } from "./rest/ServiceExecutor"
import { BookingFacade } from "./facades/BookingFacade"
import { BlobFacade } from "./facades/BlobFacade"
import { UserFacade } from "./facades/UserFacade"
import { OfflineStorage } from "./offline/OfflineStorage.js"
import { OFFLINE_STORAGE_MIGRATIONS, OfflineStorageMigrator } from "./offline/OfflineStorageMigrator.js"
import { modelInfos } from "../common/EntityFunctions.js"
import { FileFacadeSendDispatcher } from "../../native/common/generatedipc/FileFacadeSendDispatcher.js"
import { NativePushFacadeSendDispatcher } from "../../native/common/generatedipc/NativePushFacadeSendDispatcher.js"
import { NativeCryptoFacadeSendDispatcher } from "../../native/common/generatedipc/NativeCryptoFacadeSendDispatcher"
import { random } from "@tutao/tutanota-crypto"
import { ExportFacadeSendDispatcher } from "../../native/common/generatedipc/ExportFacadeSendDispatcher.js"
import { assertNotNull, delay, lazyAsync, lazyMemoized, ofClass } from "@tutao/tutanota-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacadeSendDispatcher } from "../../native/common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { EntropyFacade } from "./facades/EntropyFacade.js"
import { BlobAccessTokenFacade } from "./facades/BlobAccessTokenFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "./crypto/OwnerEncSessionKeysUpdateQueue.js"
import { EventBusEventCoordinator } from "./EventBusEventCoordinator.js"
import { WorkerFacade } from "./facades/WorkerFacade.js"
import type { SearchFacade } from "./search/SearchFacade.js"
import { Challenge } from "../entities/sys/TypeRefs.js"
import { LoginFailReason } from "../main/PageContextLoginListener.js"
import { ConnectionError, ServiceUnavailableError } from "../common/error/RestError.js"
import { SessionType } from "../common/SessionType.js"

assertWorkerOrNode()

export type WorkerLocatorType = {
	serviceExecutor: IServiceExecutor
	login: LoginFacade
	user: UserFacade
	indexer: lazyAsync<Indexer>
	search: lazyAsync<SearchFacade>
	cache: EntityRestInterface
	cachingEntityClient: EntityClient
	file: FileFacade
	blobAccessToken: BlobAccessTokenFacade
	blob: BlobFacade
	mail: MailFacade
	calendar: lazyAsync<CalendarFacade>
	counters: CounterFacade
	eventBusClient: EventBusClient
	_indexedDbSupported: boolean
	_browserData: BrowserData
	Const: Record<string, any>
	share: ShareFacade
	restClient: RestClient
	groupManagement: lazyAsync<GroupManagementFacade>
	userManagement: lazyAsync<UserManagementFacade>
	customer: lazyAsync<CustomerFacade>
	giftCards: lazyAsync<GiftCardFacade>
	mailAddress: lazyAsync<MailAddressFacade>
	configFacade: ConfigurationDatabase
	contactFormFacade: ContactFormFacade
	deviceEncryptionFacade: DeviceEncryptionFacade
	native: NativeInterface
	rsa: RsaImplementation
	ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue
	crypto: CryptoFacade
	instanceMapper: InstanceMapper
	booking: BookingFacade
	cacheStorage: CacheStorage
	entropyFacade: EntropyFacade
	workerFacade: WorkerFacade
}
export const locator: WorkerLocatorType = {} as any

export async function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	locator.user = new UserFacade()
	locator.workerFacade = new WorkerFacade()
	const dateProvider = new NoZoneDateProvider()

	const mainInterface = worker.getMainInterface()

	const suspensionHandler = new SuspensionHandler(mainInterface.infoMessageHandler, self)
	locator.instanceMapper = new InstanceMapper()
	locator.rsa = await createRsaImplementation(worker)
	locator.restClient = new RestClient(suspensionHandler)
	locator.serviceExecutor = new ServiceExecutor(locator.restClient, locator.user, locator.instanceMapper, () => locator.crypto)
	locator.entropyFacade = new EntropyFacade(locator.user, locator.serviceExecutor, random)
	locator.blobAccessToken = new BlobAccessTokenFacade(locator.serviceExecutor, dateProvider)
	const entityRestClient = new EntityRestClient(locator.user, locator.restClient, () => locator.crypto, locator.instanceMapper, locator.blobAccessToken)
	locator._browserData = browserData

	locator.native = worker
	locator.booking = new BookingFacade(locator.serviceExecutor)

	const offlineStorageProvider = async () => {
		if (isOfflineStorageAvailable() && !isAdminClient()) {
			return new OfflineStorage(
				new SqlCipherFacadeSendDispatcher(locator.native),
				new InterWindowEventFacadeSendDispatcher(worker),
				dateProvider,
				new OfflineStorageMigrator(OFFLINE_STORAGE_MIGRATIONS, modelInfos),
			)
		} else {
			return null
		}
	}

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(worker, offlineStorageProvider)

	locator.cacheStorage = maybeUninitializedStorage

	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(worker), new ExportFacadeSendDispatcher(worker))

	// We don't want to cache within the admin client
	let cache: DefaultEntityRestCache | null = null
	if (!isAdminClient()) {
		cache = new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage)
	}

	locator.cache = cache ?? entityRestClient

	locator.cachingEntityClient = new EntityClient(locator.cache)
	locator.indexer = lazyMemoized(async () => {
		const { Indexer } = await import("./search/Indexer.js")
		return new Indexer(entityRestClient, mainInterface.infoMessageHandler, browserData, locator.cache as DefaultEntityRestCache)
	})

	locator.ownerEncSessionKeysUpdateQueue = new OwnerEncSessionKeysUpdateQueue(locator.user, locator.serviceExecutor)

	locator.crypto = new CryptoFacade(
		locator.user,
		locator.cachingEntityClient,
		locator.restClient,
		locator.rsa,
		locator.serviceExecutor,
		locator.instanceMapper,
		locator.ownerEncSessionKeysUpdateQueue,
	)

	const loginListener: LoginListener = {
		onPartialLoginSuccess(): Promise<void> {
			return mainInterface.loginListener.onPartialLoginSuccess()
		},

		onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo): Promise<void> {
			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				// index new items in background
				console.log("initIndexer after log in")

				initIndexer(worker, cacheInfo)
			}

			return mainInterface.loginListener.onFullLoginSuccess(sessionType, cacheInfo)
		},

		onLoginFailure(reason: LoginFailReason): Promise<void> {
			return mainInterface.loginListener.onLoginFailure(reason)
		},

		onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
			return mainInterface.loginListener.onSecondFactorChallenge(sessionId, challenges, mailAddress)
		},
	}

	locator.login = new LoginFacade(
		worker,
		locator.restClient,
		/**
		 * we don't want to try to use the cache in the login facade, because it may not be available (when no user is logged in)
		 */
		new EntityClient(locator.cache),
		loginListener,
		locator.instanceMapper,
		locator.crypto,
		maybeUninitializedStorage,
		locator.serviceExecutor,
		locator.user,
		locator.blobAccessToken,
		locator.entropyFacade,
	)

	locator.search = lazyMemoized(async () => {
		const { SearchFacade } = await import("./search/SearchFacade.js")
		const indexer = await locator.indexer()
		const suggestionFacades = [indexer._contact.suggestionFacade, indexer._groupInfo.suggestionFacade, indexer._whitelabelChildIndexer.suggestionFacade]
		return new SearchFacade(locator.user, indexer.db, indexer._mail, suggestionFacades, browserData, locator.cachingEntityClient)
	})
	locator.counters = new CounterFacade(locator.serviceExecutor)
	locator.groupManagement = lazyMemoized(async () => {
		const { GroupManagementFacade } = await import("./facades/GroupManagementFacade.js")
		return new GroupManagementFacade(locator.user, locator.counters, locator.cachingEntityClient, locator.rsa, locator.serviceExecutor)
	})
	locator.userManagement = lazyMemoized(async () => {
		const { UserManagementFacade } = await import("./facades/UserManagementFacade.js")
		return new UserManagementFacade(
			locator.user,
			await locator.groupManagement(),
			locator.counters,
			locator.rsa,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			mainInterface.operationProgressTracker,
		)
	})
	locator.customer = lazyMemoized(async () => {
		const { CustomerFacade } = await import("./facades/CustomerFacade.js")
		return new CustomerFacade(
			locator.user,
			await locator.groupManagement(),
			await locator.userManagement(),
			locator.counters,
			locator.rsa,
			locator.cachingEntityClient,
			locator.serviceExecutor,
			locator.booking,
			locator.crypto,
			mainInterface.operationProgressTracker,
		)
	})
	const aesApp = new AesApp(new NativeCryptoFacadeSendDispatcher(worker), random)
	locator.blob = new BlobFacade(
		locator.user,
		locator.serviceExecutor,
		locator.restClient,
		suspensionHandler,
		fileApp,
		aesApp,
		locator.instanceMapper,
		locator.crypto,
		locator.blobAccessToken,
	)
	locator.file = new FileFacade(
		locator.user,
		locator.restClient,
		suspensionHandler,
		fileApp,
		aesApp,
		locator.instanceMapper,
		locator.serviceExecutor,
		locator.crypto,
	)
	locator.mail = new MailFacade(locator.user, locator.file, locator.cachingEntityClient, locator.crypto, locator.serviceExecutor, locator.blob, fileApp)
	const nativePushFacade = new NativePushFacadeSendDispatcher(worker)
	locator.calendar = lazyMemoized(async () => {
		const { CalendarFacade } = await import("./facades/CalendarFacade.js")
		return new CalendarFacade(
			locator.user,
			await locator.groupManagement(),
			assertNotNull(cache),
			nativePushFacade,
			mainInterface.operationProgressTracker,
			locator.instanceMapper,
			locator.serviceExecutor,
			locator.crypto,
		)
	})

	locator.mailAddress = lazyMemoized(async () => {
		return new MailAddressFacade(
			locator.user,
			await locator.groupManagement(),
			locator.serviceExecutor,
			new EntityClient(entityRestClient), // without cache
		)
	})
	const scheduler = new SchedulerImpl(dateProvider, self, self)

	const eventBusCoordinator = new EventBusEventCoordinator(
		worker,
		mainInterface.wsConnectivityListener,
		locator.mail,
		locator.indexer,
		locator.user,
		locator.cachingEntityClient,
		mainInterface.eventController,
	)

	locator.eventBusClient = new EventBusClient(
		eventBusCoordinator,
		cache ?? new AdminClientDummyEntityRestCache(),
		locator.user,
		locator.cachingEntityClient,
		locator.instanceMapper,
		(path) => new WebSocket(getWebsocketOrigin() + path),
		new SleepDetector(scheduler, dateProvider),
		mainInterface.progressTracker,
	)
	locator.login.init(locator.eventBusClient)
	locator.Const = Const
	locator.share = new ShareFacade(locator.user, locator.crypto, locator.serviceExecutor, locator.cachingEntityClient)
	locator.giftCards = lazyMemoized(async () => {
		const { GiftCardFacade } = await import("./facades/GiftCardFacade.js")
		return new GiftCardFacade(locator.user, await locator.customer(), locator.serviceExecutor, locator.crypto)
	})
	locator.configFacade = new ConfigurationDatabase(locator.user)
	locator.contactFormFacade = new ContactFormFacade(locator.restClient, locator.instanceMapper)
	locator.deviceEncryptionFacade = new DeviceEncryptionFacade()
}

const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000

function initIndexer(worker: WorkerImpl, cacheInfo: CacheInfo): Promise<void> {
	return locator.indexer().then((indexer) => {
		return indexer
			.init({
				user: assertNotNull(locator.user.getUser()),
				userGroupKey: locator.user.getUserGroupKey(),
				cacheInfo,
			})
			.catch(
				ofClass(ServiceUnavailableError, () => {
					console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
					return delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
						console.log("_initIndexer after ServiceUnavailableError")
						return initIndexer(worker, cacheInfo)
					})
				}),
			)
			.catch(
				ofClass(ConnectionError, () => {
					console.log("Retry init indexer in 30 seconds after ConnectionError")
					return delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
						console.log("_initIndexer after ConnectionError")
						return initIndexer(worker, cacheInfo)
					})
				}),
			)
			.catch((e) => {
				worker.sendError(e)
			})
	})
}

export async function resetLocator(): Promise<void> {
	await locator.login.resetSession()
	await initLocator(locator.login.worker, locator._browserData)
}

if (typeof self !== "undefined") {
	;(self as unknown as WorkerGlobalScope).locator = locator // export in worker scope
}
