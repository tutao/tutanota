import type {WorkerClient} from "./WorkerClient"
import {bootstrapWorker} from "./WorkerClient"
import {EventController} from "./EventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/model/SearchModel"
import {MailModel} from "../../mail/model/MailModel"
import {assertMainOrNode, getWebRoot, isAndroidApp, isBrowser, isDesktop, isElectronClient, isOfflineStorageAvailable} from "../common/Env"
import {notifications} from "../../gui/Notifications"
import {logins} from "./LoginController"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {ContactModelImpl} from "../../contacts/model/ContactModel"
import {EntityClient} from "../common/EntityClient"
import type {CalendarModel} from "../../calendar/model/CalendarModel"
import {CalendarModelImpl} from "../../calendar/model/CalendarModel"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, lazyMemoized} from "@tutao/tutanota-utils"
import {ProgressTracker} from "./ProgressTracker"
import {MinimizedMailEditorViewModel} from "../../mail/model/MinimizedMailEditorViewModel"
import {SchedulerImpl} from "../common/utils/Scheduler.js"
import type {CredentialsProvider} from "../../misc/credentials/CredentialsProvider.js"
import {createCredentialsProvider} from "../../misc/credentials/CredentialsProviderFactory"
import type {LoginFacade} from "../worker/facades/LoginFacade"
import type {CustomerFacade} from "../worker/facades/CustomerFacade"
import type {GiftCardFacade} from "../worker/facades/GiftCardFacade"
import type {ConfigurationDatabase} from "../worker/facades/ConfigurationDatabase"
import type {CalendarFacade} from "../worker/facades/CalendarFacade"
import type {MailFacade} from "../worker/facades/MailFacade"
import type {ShareFacade} from "../worker/facades/ShareFacade"
import type {CounterFacade} from "../worker/facades/CounterFacade"
import type {Indexer} from "../worker/search/Indexer"
import type {SearchFacade} from "../worker/search/SearchFacade"
import type {BookingFacade} from "../worker/facades/BookingFacade"
import type {MailAddressFacade} from "../worker/facades/MailAddressFacade"
import type {FileFacade} from "../worker/facades/FileFacade.js"
import type {ContactFormFacade} from "../worker/facades/ContactFormFacade"
import type {DeviceEncryptionFacade} from "../worker/facades/DeviceEncryptionFacade"
import {FileController} from "../../file/FileController"
import type {NativeFileApp} from "../../native/common/FileApp"
import type {NativePushServiceApp} from "../../native/main/NativePushServiceApp"
import type {NativeInterfaceMain} from "../../native/main/NativeInterfaceMain"
import type {NativeInterfaces} from "../../native/main/NativeInterfaceFactory.js"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {SecondFactorHandler} from "../../misc/2fa/SecondFactorHandler"
import {WebauthnClient} from "../../misc/2fa/webauthn/WebauthnClient"
import {UserManagementFacade} from "../worker/facades/UserManagementFacade"
import {GroupManagementFacade} from "../worker/facades/GroupManagementFacade"
import {WorkerRandomizer} from "../worker/WorkerImpl"
import {exposeRemote} from "../common/WorkerProxy"
import {ExposedNativeInterface} from "../../native/common/NativeInterface"
import {BrowserWebauthn} from "../../misc/2fa/webauthn/BrowserWebauthn.js"
import {UsageTestController} from "@tutao/tutanota-usagetests"
import {EphemeralUsageTestStorage, StorageBehavior, UsageTestModel} from "../../misc/UsageTestModel"
import {deviceConfig} from "../../misc/DeviceConfig"
import {IServiceExecutor} from "../common/ServiceRequest.js"
import {BlobFacade} from "../worker/facades/BlobFacade"
import {CryptoFacade} from "../worker/crypto/CryptoFacade"
import {RecipientsModel} from "./RecipientsModel"
import {ExposedCacheStorage} from "../worker/rest/DefaultEntityRestCache.js"
import {LoginListener} from "./LoginListener"
import {SearchTextInAppFacade} from "../../native/common/generatedipc/SearchTextInAppFacade.js"
import {SettingsFacade} from "../../native/common/generatedipc/SettingsFacade.js"
import {MobileSystemFacade} from "../../native/common/generatedipc/MobileSystemFacade.js"
import {CommonSystemFacade} from "../../native/common/generatedipc/CommonSystemFacade.js"
import {DesktopSystemFacade} from "../../native/common/generatedipc/DesktopSystemFacade.js"
import {ThemeFacade} from "../../native/common/generatedipc/ThemeFacade.js"
import {FileControllerBrowser} from "../../file/FileControllerBrowser.js"
import {FileControllerNative} from "../../file/FileControllerNative.js"
import {windowFacade} from "../../misc/WindowFacade.js"
import {InterWindowEventFacade} from "../../native/common/generatedipc/InterWindowEventFacade.js"
import {InterWindowEventFacadeSendDispatcher} from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import {SqlCipherFacade} from "../../native/common/generatedipc/SqlCipherFacade.js"
import {NewsModel} from "../../misc/news/NewsModel.js"
import type {OwnMailAddressNameChanger} from "../../settings/mailaddress/OwnMailAddressNameChanger.js"
import type {MailAddressNameChanger, MailAddressTableModel} from "../../settings/mailaddress/MailAddressTableModel.js"
import type {AnotherUserMailAddressNameChanger} from "../../settings/mailaddress/AnotherUserMailAddressNameChanger.js"
import type {GroupInfo} from "../entities/sys/TypeRefs.js"

assertMainOrNode()

// We use interface here mostly to make things readonly from the outside.
export interface IMainLocator {
	readonly eventController: EventController
	readonly search: SearchModel
	readonly mailModel: MailModel
	readonly calendarModel: CalendarModel
	readonly minimizedMailModel: MinimizedMailEditorViewModel
	readonly contactModel: ContactModel
	readonly entityClient: EntityClient
	readonly progressTracker: ProgressTracker
	readonly credentialsProvider: CredentialsProvider
	readonly worker: WorkerClient
	readonly native: NativeInterfaceMain
	readonly fileController: FileController
	readonly fileApp: NativeFileApp
	readonly pushService: NativePushServiceApp
	readonly commonSystemFacade: CommonSystemFacade
	readonly themeFacade: ThemeFacade
	readonly systemFacade: MobileSystemFacade
	readonly secondFactorHandler: SecondFactorHandler
	readonly webAuthn: WebauthnClient
	readonly loginFacade: LoginFacade
	readonly customerFacade: CustomerFacade
	readonly giftCardFacade: GiftCardFacade
	readonly groupManagementFacade: GroupManagementFacade
	readonly configFacade: ConfigurationDatabase
	readonly calendarFacade: CalendarFacade
	readonly mailFacade: MailFacade
	readonly shareFacade: ShareFacade
	readonly counterFacade: CounterFacade
	readonly indexerFacade: Indexer
	readonly searchFacade: SearchFacade
	readonly bookingFacade: BookingFacade
	readonly mailAddressFacade: MailAddressFacade
	readonly fileFacade: FileFacade
	readonly blobFacade: BlobFacade
	readonly userManagementFacade: UserManagementFacade
	readonly contactFormFacade: ContactFormFacade
	readonly deviceEncryptionFacade: DeviceEncryptionFacade
	readonly usageTestController: UsageTestController
	readonly usageTestModel: UsageTestModel
	readonly newsModel: NewsModel
	readonly serviceExecutor: IServiceExecutor
	readonly cryptoFacade: CryptoFacade
	readonly loginListener: LoginListener
	readonly sqlCipherFacade: SqlCipherFacade
	readonly cacheStorage: ExposedCacheStorage
	readonly recipientsModel: RecipientsModel
	readonly searchTextFacade: SearchTextInAppFacade
	readonly desktopSettingsFacade: SettingsFacade
	readonly desktopSystemFacade: DesktopSystemFacade
	readonly interWindowEventSender: InterWindowEventFacade
	readonly random: WorkerRandomizer;

	mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel>;

	mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userGroupInfo: GroupInfo): Promise<MailAddressTableModel>;

	readonly init: () => Promise<void>
	readonly initialized: Promise<void>
}

class MainLocator implements IMainLocator {
	eventController!: EventController
	search!: SearchModel
	mailModel!: MailModel
	calendarModel!: CalendarModel
	minimizedMailModel!: MinimizedMailEditorViewModel
	contactModel!: ContactModel
	entityClient!: EntityClient
	progressTracker!: ProgressTracker
	credentialsProvider!: CredentialsProvider
	worker!: WorkerClient
	fileController!: FileController
	secondFactorHandler!: SecondFactorHandler
	webAuthn!: WebauthnClient
	loginFacade!: LoginFacade
	customerFacade!: CustomerFacade
	giftCardFacade!: GiftCardFacade
	groupManagementFacade!: GroupManagementFacade
	configFacade!: ConfigurationDatabase
	calendarFacade!: CalendarFacade
	mailFacade!: MailFacade
	shareFacade!: ShareFacade
	counterFacade!: CounterFacade
	indexerFacade!: Indexer
	searchFacade!: SearchFacade
	bookingFacade!: BookingFacade
	mailAddressFacade!: MailAddressFacade
	fileFacade!: FileFacade
	blobFacade!: BlobFacade
	userManagementFacade!: UserManagementFacade
	contactFormFacade!: ContactFormFacade
	deviceEncryptionFacade!: DeviceEncryptionFacade
	usageTestController!: UsageTestController
	usageTestModel!: UsageTestModel
	newsModel!: NewsModel
	serviceExecutor!: IServiceExecutor
	cryptoFacade!: CryptoFacade
	recipientsModel!: RecipientsModel
	searchTextFacade!: SearchTextInAppFacade
	desktopSettingsFacade!: SettingsFacade
	desktopSystemFacade!: DesktopSystemFacade
	interWindowEventSender!: InterWindowEventFacadeSendDispatcher
	cacheStorage!: ExposedCacheStorage
	loginListener!: LoginListener
	random!: WorkerRandomizer
	sqlCipherFacade!: SqlCipherFacade

	private nativeInterfaces: NativeInterfaces | null = null
	private exposedNativeInterfaces: ExposedNativeInterface | null = null

	get native(): NativeInterfaceMain {
		return this.getNativeInterface("native")
	}

	get fileApp(): NativeFileApp {
		return this.getNativeInterface("fileApp")
	}

	get pushService(): NativePushServiceApp {
		return this.getNativeInterface("pushService")
	}

	get commonSystemFacade(): CommonSystemFacade {
		return this.getNativeInterface("commonSystemFacade")
	}

	get themeFacade(): ThemeFacade {
		return this.getNativeInterface("themeFacade")
	}

	get systemFacade(): MobileSystemFacade {
		return this.getNativeInterface("mobileSystemFacade")
	}

	async mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel> {
		const {MailAddressTableModel} = await import("../../settings/mailaddress/MailAddressTableModel.js")
		const nameChanger = await this.ownMailAddressNameChanger()
		return new MailAddressTableModel(
			this.entityClient,
			this.mailAddressFacade,
			logins,
			this.eventController,
			logins.getUserController().userGroupInfo,
			nameChanger,
		)
	}

	async mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userGroupInfo: GroupInfo): Promise<MailAddressTableModel> {
		const {MailAddressTableModel} = await import("../../settings/mailaddress/MailAddressTableModel.js")
		const nameChanger = await this.adminNameChanger(mailGroupId, userId)
		return new MailAddressTableModel(
			this.entityClient,
			this.mailAddressFacade,
			logins,
			this.eventController,
			userGroupInfo,
			nameChanger,
		)
	}

	async ownMailAddressNameChanger(): Promise<MailAddressNameChanger> {
		const {OwnMailAddressNameChanger} = await import("../../settings/mailaddress/OwnMailAddressNameChanger.js")
		return new OwnMailAddressNameChanger(this.mailModel, this.entityClient)
	}

	async adminNameChanger(mailGroupId: Id, userId: Id): Promise<MailAddressNameChanger> {
		const {AnotherUserMailAddressNameChanger} = await import("../../settings/mailaddress/AnotherUserMailAddressNameChanger.js")
		return new AnotherUserMailAddressNameChanger(this.userManagementFacade, mailGroupId, userId)
	}

	private getExposedNativeInterface(): ExposedNativeInterface {
		if (isBrowser()) {
			throw new ProgrammingError("Tried to access native interfaces in browser")
		}

		if (this.exposedNativeInterfaces == null) {
			this.exposedNativeInterfaces = exposeRemote<ExposedNativeInterface>((msg) => this.native.invokeNative(msg.requestType, msg.args))
		}

		return this.exposedNativeInterfaces
	}

	private getNativeInterface<T extends keyof NativeInterfaces>(name: T): NativeInterfaces[T] {
		if (!this.nativeInterfaces) {
			throw new ProgrammingError(`Tried to use ${name} in web`)
		}

		return this.nativeInterfaces[name]
	}

	private readonly _workerDeferred: DeferredObject<WorkerClient>
	private _entropyCollector!: EntropyCollector
	private _deferredInitialized: DeferredObject<void> = defer()

	get initialized(): Promise<void> {
		return this._deferredInitialized.promise
	}

	constructor() {
		this._workerDeferred = defer()
	}

	async init(): Promise<void> {
		// Split init in two separate parts: creating modules and causing side effects.
		// We would like to do both on normal init but on HMR we just want to replace modules without a new worker. If we create a new
		// worker we end up losing state on the worker side (including our session).
		this.worker = bootstrapWorker(this)
		await this._createInstances()
		this._entropyCollector = new EntropyCollector(this.worker)

		this._entropyCollector.start()

		this._deferredInitialized.resolve()
	}

	async _createInstances() {
		const {
			loginFacade,
			customerFacade,
			giftCardFacade,
			groupManagementFacade,
			configFacade,
			calendarFacade,
			mailFacade,
			shareFacade,
			counterFacade,
			indexerFacade,
			searchFacade,
			bookingFacade,
			mailAddressFacade,
			fileFacade,
			blobFacade,
			userManagementFacade,
			contactFormFacade,
			deviceEncryptionFacade,
			restInterface,
			serviceExecutor,
			cryptoFacade,
			cacheStorage,
			random,
		} = this.worker.getWorkerInterface()
		this.loginFacade = loginFacade
		this.customerFacade = customerFacade
		this.giftCardFacade = giftCardFacade
		this.groupManagementFacade = groupManagementFacade
		this.configFacade = configFacade
		this.calendarFacade = calendarFacade
		this.mailFacade = mailFacade
		this.shareFacade = shareFacade
		this.counterFacade = counterFacade
		this.indexerFacade = indexerFacade
		this.searchFacade = searchFacade
		this.bookingFacade = bookingFacade
		this.mailAddressFacade = mailAddressFacade
		this.fileFacade = fileFacade
		this.blobFacade = blobFacade
		this.userManagementFacade = userManagementFacade
		this.contactFormFacade = contactFormFacade
		this.deviceEncryptionFacade = deviceEncryptionFacade
		this.serviceExecutor = serviceExecutor
		this.eventController = new EventController(logins)
		this.progressTracker = new ProgressTracker()
		this.search = new SearchModel(this.searchFacade)
		this.entityClient = new EntityClient(restInterface)
		this.cryptoFacade = cryptoFacade
		this.cacheStorage = cacheStorage

		if (!isBrowser()) {
			const {WebDesktopFacade} = await import("../../native/main/WebDesktopFacade")
			const {WebMobileFacade} = await import("../../native/main/WebMobileFacade.js")
			const {WebCommonNativeFacade} = await import("../../native/main/WebCommonNativeFacade.js")
			const {WebInterWindowEventFacade} = await import("../../native/main/WebInterWindowEventFacade.js")
			const {WebAuthnFacadeSendDispatcher} = await import("../../native/common/generatedipc/WebAuthnFacadeSendDispatcher.js")
			const {createNativeInterfaces, createDesktopInterfaces} = await import("../../native/main/NativeInterfaceFactory.js")
			this.nativeInterfaces = createNativeInterfaces(
				new WebMobileFacade(),
				new WebDesktopFacade(),
				new WebInterWindowEventFacade(logins, windowFacade),
				new WebCommonNativeFacade(),
				cryptoFacade,
				calendarFacade,
				this.entityClient,
			)

			if (isElectronClient()) {
				const desktopInterfaces = createDesktopInterfaces(this.native)
				this.searchTextFacade = desktopInterfaces.searchTextFacade
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), getWebRoot())
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade
				}
			} else if (isAndroidApp()) {
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), getWebRoot())
			}
			if (isOfflineStorageAvailable()) {
				this.sqlCipherFacade = this.nativeInterfaces.sqlCipherFacade
			}
		}

		if (this.webAuthn == null) {
			this.webAuthn = new WebauthnClient(new BrowserWebauthn(navigator.credentials, window.location.hostname), getWebRoot())
		}
		this.secondFactorHandler = new SecondFactorHandler(this.eventController, this.entityClient, this.webAuthn, this.loginFacade)
		this.loginListener = new LoginListener(this.secondFactorHandler)
		this.credentialsProvider = await createCredentialsProvider(
			deviceEncryptionFacade,
			this.nativeInterfaces?.native ?? null,
			isDesktop() ? this.interWindowEventSender : null
		)
		this.mailModel = new MailModel(notifications, this.eventController, this.worker, this.mailFacade, this.entityClient, logins)
		this.random = random

		this.usageTestModel = new UsageTestModel(
			{
				[StorageBehavior.Persist]: deviceConfig,
				[StorageBehavior.Ephemeral]: new EphemeralUsageTestStorage(),
			}, {
				now(): number {
					return Date.now()
				},
				timeZone(): string {
					throw new Error("Not implemented by this provider")
				},
			},
			this.serviceExecutor,
			this.entityClient,
			logins,
			this.eventController,
			() => this.usageTestController,
		)

		this.newsModel = new NewsModel(this.serviceExecutor, async (name: string) => {
			switch (name) {
				case "usageOptIn":
					const {UsageOptInNews} = await import("../../misc/news/items/UsageOptInNews.js")
					return new UsageOptInNews(this.newsModel, this.usageTestModel)
				case "recoveryCode":
					const {RecoveryCodeNews} = await import("../../misc/news/items/RecoveryCodeNews.js")
					return new RecoveryCodeNews(this.newsModel, logins.getUserController(), this.usageTestModel, this.usageTestController, this.userManagementFacade)
				default:
					console.log(`No implementation for news named '${name}'`)
					return null
			}
		})

		const lazyScheduler = lazyMemoized(async () => {
			const {AlarmSchedulerImpl} = await import("../../calendar/date/AlarmScheduler")
			const {DateProviderImpl} = await import("../../calendar/date/CalendarUtils")
			const dateProvider = new DateProviderImpl()
			return new AlarmSchedulerImpl(dateProvider, new SchedulerImpl(dateProvider, window, window))
		})
		this.fileController = this.nativeInterfaces == null
			? new FileControllerBrowser(blobFacade, fileFacade)
			: new FileControllerNative(this.nativeInterfaces.fileApp, blobFacade, fileFacade)

		this.calendarModel = new CalendarModelImpl(
			notifications,
			lazyScheduler,
			this.eventController,
			this.serviceExecutor,
			logins,
			this.progressTracker,
			this.entityClient,
			this.mailModel,
			this.calendarFacade,
			this.fileController,
		)
		this.contactModel = new ContactModelImpl(this.searchFacade, this.entityClient, logins)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()
		this.usageTestController = new UsageTestController(this.usageTestModel)
		this.recipientsModel = new RecipientsModel(this.contactModel, logins, this.mailFacade, this.entityClient)
	}
}

export const locator: IMainLocator = new MainLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}