import type {WorkerClient} from "./WorkerClient"
import {bootstrapWorker} from "./WorkerClient"
import {EventController} from "./EventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/model/SearchModel"
import {MailModel} from "../../mail/model/MailModel"
import {assertMainOrNode, assertOfflineStorageAvailable, getWebRoot, isAdminClient, isBrowser, isDesktop} from "../common/Env"
import {notifications} from "../../gui/Notifications"
import {logins} from "./LoginController"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {ContactModelImpl} from "../../contacts/model/ContactModel"
import {EntityClient} from "../common/EntityClient"
import type {CalendarModel} from "../../calendar/model/CalendarModel"
import {CalendarModelImpl} from "../../calendar/model/CalendarModel"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, downcast} from "@tutao/tutanota-utils"
import {ProgressTracker} from "./ProgressTracker"
import {MinimizedMailEditorViewModel} from "../../mail/model/MinimizedMailEditorViewModel"
import {SchedulerImpl} from "../common/utils/Scheduler.js"
import type {ICredentialsProvider} from "../../misc/credentials/CredentialsProvider"
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
import type {NativeSystemApp} from "../../native/common/NativeSystemApp"
import type {NativeInterfaceMain} from "../../native/main/NativeInterfaceMain"
import type {NativeInterfaces} from "./NativeInterfaceFactory"
import {createNativeInterfaces} from "./NativeInterfaceFactory"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {SecondFactorHandler} from "../../misc/2fa/SecondFactorHandler"
import {IWebauthnClient, WebauthnClient} from "../../misc/2fa/webauthn/WebauthnClient"
import {UserManagementFacade} from "../worker/facades/UserManagementFacade"
import {GroupManagementFacade} from "../worker/facades/GroupManagementFacade"
import {exposeRemote} from "../common/WorkerProxy"
import {ExposedNativeInterface, ExposedWebInterface} from "../../native/common/NativeInterface"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn.js"
import {BrowserWebauthn} from "../../misc/2fa/webauthn/BrowserWebauthn.js"
import {UsageTestController} from "@tutao/tutanota-usagetests"
import {UsageTestModel} from "../../misc/UsageTestModel"
import {deviceConfig} from "../../misc/DeviceConfig"
import {IServiceExecutor} from "../common/ServiceRequest.js"
import {BlobFacade} from "../worker/facades/BlobFacade"
import {CryptoFacade} from "../worker/crypto/CryptoFacade"
import type {InterWindowEventBus} from "../../native/common/InterWindowEventBus"
import {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {CachedRangeLoader} from "../worker/rest/EntityRestCache.js"
import {InterWindowEventTypes} from "../../native/common/InterWindowEventTypes"
import {LoginListener} from "./LoginListener"

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
	readonly credentialsProvider: ICredentialsProvider
	readonly worker: WorkerClient
	readonly native: NativeInterfaceMain
	readonly fileController: FileController
	readonly fileApp: NativeFileApp
	readonly pushService: NativePushServiceApp
	readonly systemApp: NativeSystemApp
	readonly secondFactorHandler: SecondFactorHandler
	readonly webauthnClient: IWebauthnClient
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
	readonly serviceExecutor: IServiceExecutor
	readonly cryptoFacade: CryptoFacade
	readonly interWindowEventBus: InterWindowEventBus<InterWindowEventTypes>
	readonly loginListener: LoginListener
	readonly offlineDbFacade: OfflineDbFacade
	readonly cachedRangeLoader: CachedRangeLoader

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
	credentialsProvider!: ICredentialsProvider
	worker!: WorkerClient
	fileController!: FileController
	secondFactorHandler!: SecondFactorHandler
	webauthnClient!: IWebauthnClient
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
	serviceExecutor!: IServiceExecutor
	cryptoFacade!: CryptoFacade
	cachedRangeLoader!: CachedRangeLoader
	_interWindowEventBus!: InterWindowEventBus<InterWindowEventTypes>
	loginListener!: LoginListener

	/**
	 * @deprecated
	 */
	private _nativeInterfaces: NativeInterfaces | null = null

	private _exposedNativeInterfaces: ExposedNativeInterface | null = null

	get native(): NativeInterfaceMain {
		return this._getNativeInterface("native")
	}

	get fileApp(): NativeFileApp {
		return this._getNativeInterface("fileApp")
	}

	get pushService(): NativePushServiceApp {
		return this._getNativeInterface("pushService")
	}

	get systemApp(): NativeSystemApp {
		return this._getNativeInterface("systemApp")
	}

	get interWindowEventBus(): InterWindowEventBus<InterWindowEventTypes> {
		if (!isDesktop()) {
			throw new ProgrammingError("Trying to use InterWindowEventBus not on desktop")
		}
		return this._interWindowEventBus
	}

	get webauthnController(): IWebauthn {
		const creds = navigator.credentials
		return isDesktop() || isAdminClient()
			? this.getExposedNativeInterface().webauthn
			: new BrowserWebauthn(creds, window.location.hostname)
	}

	get offlineDbFacade(): OfflineDbFacade {
		assertOfflineStorageAvailable()
		return this.getExposedNativeInterface().offlineDbFacade
	}

	private getExposedNativeInterface(): ExposedNativeInterface {
		if (isBrowser()) {
			throw new ProgrammingError("Tried to access native interfaces in browser")
		}

		if (this._exposedNativeInterfaces == null) {
			this._exposedNativeInterfaces = exposeRemote<ExposedNativeInterface>((msg) => this.native.invokeNative(msg))
		}

		return this._exposedNativeInterfaces
	}

	_getNativeInterface<T extends keyof NativeInterfaces>(name: T): NativeInterfaces[T] {
		if (!this._nativeInterfaces) {
			throw new ProgrammingError(`Tried to use ${name} in web`)
		}

		return this._nativeInterfaces[name]
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
		if (!isBrowser()) {
			if (isDesktop()) {
				const {InterWindowEventBus} = await import("../../native/common/InterWindowEventBus.js")
				this._interWindowEventBus = new InterWindowEventBus()
			}
			const webInterface: ExposedWebInterface = {
				interWindowEventHandler: this._interWindowEventBus,
			}
			this._nativeInterfaces = await createNativeInterfaces(webInterface)

			if (isDesktop()) {
				this.interWindowEventBus.init(this.getExposedNativeInterface().interWindowEventSender)
			}
		}

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
			cachedRangeLoader
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
		this.cachedRangeLoader = cachedRangeLoader

		this.webauthnClient = new WebauthnClient(this.webauthnController, getWebRoot())
		this.secondFactorHandler = new SecondFactorHandler(this.eventController, this.entityClient, this.webauthnClient, this.loginFacade)
		this.loginListener = new LoginListener(this.secondFactorHandler)
		this.credentialsProvider = await createCredentialsProvider(deviceEncryptionFacade, this._nativeInterfaces?.native ?? null, isDesktop() ? this.interWindowEventBus : null)
		this.mailModel = new MailModel(notifications, this.eventController, this.worker, this.mailFacade, this.entityClient)
		this.usageTestModel = new UsageTestModel(
			deviceConfig, {
				now(): number {
					return Date.now()
				},
				timeZone(): string {
					throw new Error("Not implemented by this provider")
				},
			},
			this.serviceExecutor,
		)

		const lazyScheduler = async () => {
			const {AlarmSchedulerImpl} = await import("../../calendar/date/AlarmScheduler")
			const {DateProviderImpl} = await import("../../calendar/date/CalendarUtils")
			const dateProvider = new DateProviderImpl()
			return new AlarmSchedulerImpl(dateProvider, new SchedulerImpl(dateProvider, window, window))
		}

		this.fileController = new FileController(this._nativeInterfaces?.fileApp ?? null, blobFacade, fileFacade)
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
	}
}

export const locator: IMainLocator = new MainLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}